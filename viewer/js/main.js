(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.4.2
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
ko.version = "3.4.2";

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
                var handle,
                    ignoreUpdates = false;
                return function () {
                    if (!ignoreUpdates) {
                        ko.tasks.cancel(handle);
                        handle = ko.tasks.schedule(callback);

                        try {
                            ignoreUpdates = true;
                            target['notifySubscribers'](undefined, 'dirty');
                        } finally {
                            ignoreUpdates = false;
                        }
                    }
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
        instance._subscriptions = { "change": [] };
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
            var subs = event === defaultEvent && this._changeSubscriptions || this._subscriptions[event].slice(0);
            try {
                ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var i = 0, subscription; subscription = subs[i]; ++i) {
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
            ignoreBeforeChange, notifyNextChange, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = limitNotifySubscribers;
        }

        var finish = limitFunction(function() {
            self._notificationIsPending = false;

            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self._evalIfChanged ? self._evalIfChanged() : self();
            }
            var shouldNotify = notifyNextChange || self.isDifferent(previousValue, pendingValue);

            notifyNextChange = ignoreBeforeChange = false;

            if (shouldNotify) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._limitChange = function(value) {
            self._changeSubscriptions = self._subscriptions[defaultEvent].slice(0);
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
        self._notifyNextChangeIfValueIsDifferent = function() {
            if (self.isDifferent(previousValue, self.peek(true /*evaluate*/))) {
                notifyNextChange = true;
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
        isDirty: true,
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
            if (state.isDirty || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
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
        // If the observable we've accessed has a pending notification, ensure we get notified of the actual final value (bypass equality checks)
        if (subscribable._notificationIsPending) {
            subscribable._notifyNextChangeIfValueIsDifferent();
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
                if ((this._evalDelayed && dependency._target._notificationIsPending) || dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    },
    markDirty: function () {
        // Process "dirty" events if we can handle delayed notifications
        if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
            this._evalDelayed(false /*isChange*/);
        }
    },
    isActive: function () {
        var state = this[computedState];
        return state.isDirty || state.dependenciesCount > 0;
    },
    respondToChange: function () {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!this._notificationIsPending) {
            this.evaluatePossiblyAsync();
        } else if (this[computedState].isDirty) {
            this[computedState].isStale = true;
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
            computedObservable._evalDelayed(true /*isChange*/);
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

            state.isStale = state.isDirty = false;
        }
    },
    peek: function (evaluate) {
        // By default, peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        // Pass in true to evaluate if needed.
        var state = this[computedState];
        if ((state.isDirty && (evaluate || !state.dependenciesCount)) || (state.isSleeping && this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return state.latestValue;
    },
    limit: function (limitFunction) {
        // Override the limit function with one that delays evaluation as well
        ko.subscribable['fn'].limit.call(this, limitFunction);
        this._evalIfChanged = function () {
            if (this[computedState].isStale) {
                this.evaluateImmediate();
            } else {
                this[computedState].isDirty = false;
            }
            return this[computedState].latestValue;
        };
        this._evalDelayed = function (isChange) {
            this._limitBeforeChange(this[computedState].latestValue);

            // Mark as dirty
            this[computedState].isDirty = true;
            if (isChange) {
                this[computedState].isStale = true;
            }

            // Pass the observable to the "limit" code, which will evaluate it when
            // it's time to do the notification.
            this._limitChange(this);
        };
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
        state.isDirty = false;
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
 * Vivliostyle core 2017.2.1-pre.20170518025833
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
function t(a,b){function c(){}c.prototype=b.prototype;a.If=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Eg=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}t(ca,Error);ca.prototype.name="CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift()}t(ea,ca);ea.prototype.name="AssertionError";function fa(a,b){throw new ea("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ha(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ia(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.w=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function ja(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ka(a,b){var c=v,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ia.prototype.debug=function(a){var b=ha(arguments);this.h(ga(b));ja(this,1,b)};ia.prototype.g=function(a){var b=ha(arguments);this.l(ga(b));ja(this,2,b)};ia.prototype.b=function(a){var b=ha(arguments);this.w(ga(b));ja(this,3,b)};ia.prototype.error=function(a){var b=ha(arguments);this.j(ga(b));ja(this,4,b)};var v=new ia;function la(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ma=window.location.href,na=window.location.href;
function oa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function pa(a){a=new RegExp("#(.*&)?"+qa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ra(a,b){var c=new RegExp("#(.*&)?"+qa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function sa(a){return null==a?a:a.toString()}function ta(){this.b=[null]}
ta.prototype.length=function(){return this.b.length-1};function va(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};
function ya(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[va(a,b)]}
function za(a){var b=xa[a];if(b||null===b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<wa.length;b++){var c=wa[b];if(ya(c,a))return b=c+a,xa[a]=[b],[b]}v.b("Property not supported by the browser: ",a);return xa[a]=null}
function w(a,b,c){try{var d=za(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){v.b(e)}}function Aa(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Ba(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Ca(){this.b=[]}Ca.prototype.append=function(a){this.b.push(a);return this};Ca.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ea(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Fa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ea)}
function Ga(a){return a.replace(/[\u0000-\u001F"]/g,Ea)}function Ha(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ia(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function qa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ja(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(qa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ka(a){if(!a)throw"Assert failed";}function La(a,b){for(var c=0,d=a;;){Ka(c<=d);Ka(!c||!b(c-1));Ka(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ma(a,b){return a-b}
function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Oa={};function Qa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Ra(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Sa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Ta(){this.h={}}function Ua(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Ta.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Ta.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Va=null,Wa=null;function Xa(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Ya(a){return"^"+a}function $a(a){return a.substr(1)}function ab(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,$a):a}
function bb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=ab(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function cb(){}cb.prototype.g=function(a){a.append("!")};cb.prototype.h=function(){return!1};function db(a,b,c){this.index=a;this.id=b;this.qb=c}
db.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.qb)a.append("["),this.id&&a.append(this.id),this.qb&&(a.append(";s="),a.append(this.qb)),a.append("]")};
db.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.M=!0),a.node=c);if(this.id&&(a.M||this.id!=Xa(a.node)))throw Error("E_CFI_ID_MISMATCH");a.qb=this.qb;return!0};function eb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.qb=d}
eb.prototype.h=function(a){if(0<this.offset&&!a.M){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.qb=this.qb;return!0};
eb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.qb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Ya)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Ya));this.qb&&(a.append(";s="),a.append(this.qb));a.append("]")}};function fb(){this.ma=null}
function gb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=bb(c[4]);f.push(new db(g,h,sa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=ab(h));var l=c[7];l&&(l=ab(l));c=bb(c[10]);f.push(new eb(g,h,l,sa(c.s)));break;case "!":e++;f.push(new cb);break;case "~":case "@":case "":a.ma=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function hb(a,b){for(var c={node:b.documentElement,offset:0,M:!1,qb:null,Zc:null},d=0;d<a.ma.length;d++)if(!a.ma[d].h(c)){++d<a.ma.length&&(c.Zc=new fb,c.Zc.ma=a.ma.slice(d));break}return c}
fb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ib(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new eb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Xa(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new db(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ma?(f.push(new cb),a.ma=f.concat(a.ma)):a.ma=f}fb.prototype.toString=function(){if(!this.ma)return"";var a=new Ca;a.append("epubcfi(");for(var b=0;b<this.ma.length;b++)this.ma[b].g(a);a.append(")");return a.toString()};function jb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Zd:!0,Td:25,Yd:!1,fe:!1,rb:!1,Ec:1,Be:{print:!0},fc:void 0}}function kb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Zd:a.Zd,Td:a.Td,Yd:a.Yd,fe:a.fe,rb:a.rb,Ec:a.Ec,Be:Object.assign({},a.Be),fc:a.fc?Object.assign({},a.fc):void 0}}var lb=jb(),mb={};function nb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ob(a){return'"'+Ga(a+"")+'"'}function pb(a){return Fa(a+"")}
function qb(a,b){return a?Fa(a)+"."+Fa(b):Fa(b)}var rb=0;
function sb(a,b){this.parent=a;this.w="S"+rb++;this.C=[];this.b=new tb(this,0);this.f=new tb(this,1);this.j=new tb(this,!0);this.h=new tb(this,!1);a&&a.C.push(this);this.values={};this.G={};this.D={};this.l=b;if(!a){var c=this.D;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=nb;c["css-string"]=ob;c["css-name"]=pb;c["typeof"]=function(a){return typeof a};ub(this,"page-width",function(){return this.Tb()});ub(this,"page-height",function(){return this.Sb()});
ub(this,"pref-font-family",function(){return this.X.fontFamily});ub(this,"pref-night-mode",function(){return this.X.fe});ub(this,"pref-hyphenate",function(){return this.X.Zd});ub(this,"pref-margin",function(){return this.X.margin});ub(this,"pref-line-height",function(){return this.X.lineHeight});ub(this,"pref-column-width",function(){return this.X.Td*this.fontSize});ub(this,"pref-horizontal",function(){return this.X.Yd});ub(this,"pref-spread-view",function(){return this.X.rb})}}
function ub(a,b,c){a.values[b]=new vb(a,c,b)}function wb(a,b){a.values["page-number"]=b}function xb(a,b){a.D["has-content"]=b}var yb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function zb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function Ab(a,b,c,d){this.Sa=b;this.Db=c;this.O=null;this.Tb=function(){return this.O?this.O:this.X.rb?Math.floor(b/2)-this.X.Ec:b};this.J=null;this.Sb=function(){return this.J?this.J:c};this.w=d;this.pa=null;this.fontSize=function(){return this.pa?this.pa:d};this.X=lb;this.H={}}function Bb(a,b){a.H[b.w]={};for(var c=0;c<b.C.length;c++)Bb(a,b.C[c])}
function Cb(a,b,c){return"vw"==b?a.Tb()/100:"vh"==b?a.Sb()/100:"em"==b||"rem"==b?c?a.w:a.fontSize():"ex"==b||"rex"==b?yb.ex*(c?a.w:a.fontSize())/yb.em:yb[b]}function Db(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Eb(a,b,c,d,e){do{var f=b.G[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.D[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new tb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Fb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Tb();break;case "height":f=a.Sb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Gb(a){this.b=a;this.h="_"+rb++}n=Gb.prototype;n.toString=function(){var a=new Ca;this.wa(a,0);return a.toString()};n.wa=function(){throw Error("F_ABSTRACT");};n.jb=function(){throw Error("F_ABSTRACT");};n.$a=function(){return this};n.gc=function(a){return a===this};function Hb(a,b,c,d){var e=d[a.h];if(null!=e)return e===mb?!1:e;d[a.h]=mb;b=a.gc(b,c,d);return d[a.h]=b}
n.evaluate=function(a){var b;b=(b=a.H[this.b.w])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.jb(a);var c=this.h,d=this.b,e=a.H[d.w];e||(e={},a.H[d.w]=e);return e[c]=b};n.Je=function(){return!1};function Ib(a,b){Gb.call(this,a);this.f=b}t(Ib,Gb);n=Ib.prototype;n.se=function(){throw Error("F_ABSTRACT");};n.De=function(){throw Error("F_ABSTRACT");};n.jb=function(a){a=this.f.evaluate(a);return this.De(a)};n.gc=function(a,b,c){return a===this||Hb(this.f,a,b,c)};
n.wa=function(a,b){10<b&&a.append("(");a.append(this.se());this.f.wa(a,10);10<b&&a.append(")")};n.$a=function(a,b){var c=this.f.$a(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Jb(a,b,c){Gb.call(this,a);this.f=b;this.g=c}t(Jb,Gb);n=Jb.prototype;n.kd=function(){throw Error("F_ABSTRACT");};n.Va=function(){throw Error("F_ABSTRACT");};n.ob=function(){throw Error("F_ABSTRACT");};n.jb=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.ob(b,a)};
n.gc=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.g,a,b,c)};n.wa=function(a,b){var c=this.kd();c<=b&&a.append("(");this.f.wa(a,c);a.append(this.Va());this.g.wa(a,c);c<=b&&a.append(")")};n.$a=function(a,b){var c=this.f.$a(a,b),d=this.g.$a(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Kb(a,b,c){Jb.call(this,a,b,c)}t(Kb,Jb);Kb.prototype.kd=function(){return 1};function Lb(a,b,c){Jb.call(this,a,b,c)}t(Lb,Jb);Lb.prototype.kd=function(){return 2};
function Mb(a,b,c){Jb.call(this,a,b,c)}t(Mb,Jb);Mb.prototype.kd=function(){return 3};function Nb(a,b,c){Jb.call(this,a,b,c)}t(Nb,Jb);Nb.prototype.kd=function(){return 4};function Ob(a,b){Ib.call(this,a,b)}t(Ob,Ib);Ob.prototype.se=function(){return"!"};Ob.prototype.De=function(a){return!a};function Pb(a,b){Ib.call(this,a,b)}t(Pb,Ib);Pb.prototype.se=function(){return"-"};Pb.prototype.De=function(a){return-a};function Qb(a,b,c){Jb.call(this,a,b,c)}t(Qb,Kb);Qb.prototype.Va=function(){return"&&"};
Qb.prototype.jb=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Rb(a,b,c){Jb.call(this,a,b,c)}t(Rb,Qb);Rb.prototype.Va=function(){return" and "};function Sb(a,b,c){Jb.call(this,a,b,c)}t(Sb,Kb);Sb.prototype.Va=function(){return"||"};Sb.prototype.jb=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Tb(a,b,c){Jb.call(this,a,b,c)}t(Tb,Sb);Tb.prototype.Va=function(){return", "};function Ub(a,b,c){Jb.call(this,a,b,c)}t(Ub,Lb);Ub.prototype.Va=function(){return"<"};
Ub.prototype.ob=function(a,b){return a<b};function Vb(a,b,c){Jb.call(this,a,b,c)}t(Vb,Lb);Vb.prototype.Va=function(){return"<="};Vb.prototype.ob=function(a,b){return a<=b};function Wb(a,b,c){Jb.call(this,a,b,c)}t(Wb,Lb);Wb.prototype.Va=function(){return">"};Wb.prototype.ob=function(a,b){return a>b};function Xb(a,b,c){Jb.call(this,a,b,c)}t(Xb,Lb);Xb.prototype.Va=function(){return">="};Xb.prototype.ob=function(a,b){return a>=b};function Yb(a,b,c){Jb.call(this,a,b,c)}t(Yb,Lb);Yb.prototype.Va=function(){return"=="};
Yb.prototype.ob=function(a,b){return a==b};function Zb(a,b,c){Jb.call(this,a,b,c)}t(Zb,Lb);Zb.prototype.Va=function(){return"!="};Zb.prototype.ob=function(a,b){return a!=b};function $b(a,b,c){Jb.call(this,a,b,c)}t($b,Mb);$b.prototype.Va=function(){return"+"};$b.prototype.ob=function(a,b){return a+b};function ac(a,b,c){Jb.call(this,a,b,c)}t(ac,Mb);ac.prototype.Va=function(){return" - "};ac.prototype.ob=function(a,b){return a-b};function bc(a,b,c){Jb.call(this,a,b,c)}t(bc,Nb);bc.prototype.Va=function(){return"*"};
bc.prototype.ob=function(a,b){return a*b};function cc(a,b,c){Jb.call(this,a,b,c)}t(cc,Nb);cc.prototype.Va=function(){return"/"};cc.prototype.ob=function(a,b){return a/b};function dc(a,b,c){Jb.call(this,a,b,c)}t(dc,Nb);dc.prototype.Va=function(){return"%"};dc.prototype.ob=function(a,b){return a%b};function ec(a,b,c){Gb.call(this,a);this.L=b;this.ga=c.toLowerCase()}t(ec,Gb);ec.prototype.wa=function(a){a.append(this.L.toString());a.append(Fa(this.ga))};
ec.prototype.jb=function(a){return this.L*Cb(a,this.ga,!1)};function fc(a,b){Gb.call(this,a);this.f=b}t(fc,Gb);fc.prototype.wa=function(a){a.append(this.f)};fc.prototype.jb=function(a){return Db(a,this.b,this.f).evaluate(a)};fc.prototype.gc=function(a,b,c){return a===this||Hb(Db(b,this.b,this.f),a,b,c)};function gc(a,b,c){Gb.call(this,a);this.f=b;this.name=c}t(gc,Gb);gc.prototype.wa=function(a){this.f&&a.append("not ");a.append(Fa(this.name))};
gc.prototype.jb=function(a){var b=this.name;a="all"===b||!!a.X.Be[b];return this.f?!a:a};gc.prototype.gc=function(a,b,c){return a===this||Hb(this.value,a,b,c)};gc.prototype.Je=function(){return!0};function vb(a,b,c){Gb.call(this,a);this.Bc=b;this.Hc=c}t(vb,Gb);vb.prototype.wa=function(a){a.append(this.Hc)};vb.prototype.jb=function(a){return this.Bc.call(a)};function hc(a,b,c){Gb.call(this,a);this.g=b;this.f=c}t(hc,Gb);
hc.prototype.wa=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].wa(a,0);a.append(")")};hc.prototype.jb=function(a){return Eb(a,this.b,this.g,this.f,!1).$a(a,this.f).evaluate(a)};hc.prototype.gc=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Hb(this.f[d],a,b,c))return!0;return Hb(Eb(b,this.b,this.g,this.f,!0),a,b,c)};
hc.prototype.$a=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].$a(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new hc(this.b,this.g,c)};function ic(a,b,c,d){Gb.call(this,a);this.f=b;this.j=c;this.g=d}t(ic,Gb);ic.prototype.wa=function(a,b){0<b&&a.append("(");this.f.wa(a,0);a.append("?");this.j.wa(a,0);a.append(":");this.g.wa(a,0);0<b&&a.append(")")};
ic.prototype.jb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};ic.prototype.gc=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.j,a,b,c)||Hb(this.g,a,b,c)};ic.prototype.$a=function(a,b){var c=this.f.$a(a,b),d=this.j.$a(a,b),e=this.g.$a(a,b);return c===this.f&&d===this.j&&e===this.g?this:new ic(this.b,c,d,e)};function tb(a,b){Gb.call(this,a);this.f=b}t(tb,Gb);
tb.prototype.wa=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ga(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};tb.prototype.jb=function(){return this.f};function jc(a,b,c){Gb.call(this,a);this.name=b;this.value=c}t(jc,Gb);jc.prototype.wa=function(a){a.append("(");a.append(Ga(this.name.name));a.append(":");this.value.wa(a,0);a.append(")")};
jc.prototype.jb=function(a){return Fb(a,this.name.name,this.value)};jc.prototype.gc=function(a,b,c){return a===this||Hb(this.value,a,b,c)};jc.prototype.$a=function(a,b){var c=this.value.$a(a,b);return c===this.value?this:new jc(this.b,this.name,c)};function kc(a,b){Gb.call(this,a);this.index=b}t(kc,Gb);kc.prototype.wa=function(a){a.append("$");a.append(this.index.toString())};kc.prototype.$a=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function lc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Qb(a,b,c)}function x(a,b,c){return b===a.b?c:c===a.b?b:new $b(a,b,c)}function y(a,b,c){return b===a.b?new Pb(a,c):c===a.b?b:new ac(a,b,c)}function mc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new bc(a,b,c)}function nc(a,b,c){return b===a.b?a.b:c===a.f?b:new cc(a,b,c)};var oc={};function pc(){}n=pc.prototype;n.Zb=function(a){for(var b=0;b<a.length;b++)a[b].ba(this)};n.pe=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.qe=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.gd=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Yb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Lc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Kc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Jc=function(a){return this.Kc(a)};
n.Md=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Mc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.zb=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Xb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Hb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Ic=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function qc(){}t(qc,pc);n=qc.prototype;
n.Zb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.ba(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.gd=function(a){return a};n.Yb=function(a){return a};n.qe=function(a){return a};n.Lc=function(a){return a};n.Kc=function(a){return a};n.Jc=function(a){return a};n.Md=function(a){return a};n.Mc=function(a){return a};n.zb=function(a){var b=this.Zb(a.values);return b===a.values?a:new rc(b)};
n.Xb=function(a){var b=this.Zb(a.values);return b===a.values?a:new sc(b)};n.Hb=function(a){var b=this.Zb(a.values);return b===a.values?a:new tc(a.name,b)};n.Ic=function(a){return a};function uc(){}n=uc.prototype;n.toString=function(){var a=new Ca;this.Ta(a,!0);return a.toString()};n.stringValue=function(){var a=new Ca;this.Ta(a,!1);return a.toString()};n.ra=function(){throw Error("F_ABSTRACT");};n.Ta=function(a){a.append("[error]")};n.He=function(){return!1};n.jc=function(){return!1};n.Ke=function(){return!1};
n.uf=function(){return!1};n.wd=function(){return!1};function vc(){if(B)throw Error("E_INVALID_CALL");}t(vc,uc);vc.prototype.ra=function(a){return new tb(a,"")};vc.prototype.Ta=function(){};vc.prototype.ba=function(a){return a.pe(this)};var B=new vc;function wc(){if(xc)throw Error("E_INVALID_CALL");}t(wc,uc);wc.prototype.ra=function(a){return new tb(a,"/")};wc.prototype.Ta=function(a){a.append("/")};wc.prototype.ba=function(a){return a.qe(this)};var xc=new wc;function yc(a){this.Hc=a}t(yc,uc);
yc.prototype.ra=function(a){return new tb(a,this.Hc)};yc.prototype.Ta=function(a,b){b?(a.append('"'),a.append(Ga(this.Hc)),a.append('"')):a.append(this.Hc)};yc.prototype.ba=function(a){return a.gd(this)};function zc(a){this.name=a;if(oc[a])throw Error("E_INVALID_CALL");oc[a]=this}t(zc,uc);zc.prototype.ra=function(a){return new tb(a,this.name)};zc.prototype.Ta=function(a,b){b?a.append(Fa(this.name)):a.append(this.name)};zc.prototype.ba=function(a){return a.Yb(this)};zc.prototype.uf=function(){return!0};
function C(a){var b=oc[a];b||(b=new zc(a));return b}function D(a,b){this.L=a;this.ga=b.toLowerCase()}t(D,uc);D.prototype.ra=function(a,b){return this.L?b&&"%"==this.ga?100==this.L?b:new bc(a,b,new tb(a,this.L/100)):new ec(a,this.L,this.ga):a.b};D.prototype.Ta=function(a){a.append(this.L.toString());a.append(this.ga)};D.prototype.ba=function(a){return a.Lc(this)};D.prototype.jc=function(){return!0};function Ac(a){this.L=a}t(Ac,uc);
Ac.prototype.ra=function(a){return this.L?1==this.L?a.f:new tb(a,this.L):a.b};Ac.prototype.Ta=function(a){a.append(this.L.toString())};Ac.prototype.ba=function(a){return a.Kc(this)};Ac.prototype.Ke=function(){return!0};function Bc(a){this.L=a}t(Bc,Ac);Bc.prototype.ba=function(a){return a.Jc(this)};function Ec(a){this.f=a}t(Ec,uc);Ec.prototype.Ta=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};Ec.prototype.ba=function(a){return a.Md(this)};
function Fc(a){this.url=a}t(Fc,uc);Fc.prototype.Ta=function(a){a.append('url("');a.append(Ga(this.url));a.append('")')};Fc.prototype.ba=function(a){return a.Mc(this)};function Gc(a,b,c,d){var e=b.length;b[0].Ta(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ta(a,d)}function rc(a){this.values=a}t(rc,uc);rc.prototype.Ta=function(a,b){Gc(a,this.values," ",b)};rc.prototype.ba=function(a){return a.zb(this)};rc.prototype.wd=function(){return!0};function sc(a){this.values=a}t(sc,uc);
sc.prototype.Ta=function(a,b){Gc(a,this.values,",",b)};sc.prototype.ba=function(a){return a.Xb(this)};function tc(a,b){this.name=a;this.values=b}t(tc,uc);tc.prototype.Ta=function(a,b){a.append(Fa(this.name));a.append("(");Gc(a,this.values,",",b);a.append(")")};tc.prototype.ba=function(a){return a.Hb(this)};function E(a){this.b=a}t(E,uc);E.prototype.ra=function(){return this.b};E.prototype.Ta=function(a){a.append("-epubx-expr(");this.b.wa(a,0);a.append(")")};E.prototype.ba=function(a){return a.Ic(this)};
E.prototype.He=function(){return!0};function Hc(a,b){if(a){if(a.jc())return Cb(b,a.ga,!1)*a.L;if(a.Ke())return a.L}return 0}var Ic=C("absolute"),Jc=C("all"),Kc=C("always"),Lc=C("auto");C("avoid");var Mc=C("block"),Nc=C("block-end"),Oc=C("block-start"),Pc=C("both"),Qc=C("bottom"),Rc=C("border-box"),Sc=C("break-all"),Tc=C("break-word"),Uc=C("crop"),Vc=C("cross");C("column");var Wc=C("exclusive"),Xc=C("false"),Yc=C("fixed"),Zc=C("flex"),$c=C("footnote"),ad=C("footer"),bd=C("header");C("hidden");
var cd=C("horizontal-tb"),dd=C("inherit"),ed=C("inline"),fd=C("inline-block"),gd=C("inline-end"),hd=C("inline-start"),id=C("landscape"),jd=C("left"),kd=C("list-item"),ld=C("ltr");C("manual");var F=C("none"),md=C("normal"),nd=C("oeb-page-foot"),od=C("oeb-page-head"),pd=C("page"),qd=C("relative"),rd=C("right"),sd=C("scale"),td=C("snap-block");C("spread");var ud=C("static"),vd=C("rtl"),wd=C("table"),xd=C("table-caption"),yd=C("table-cell"),zd=C("table-footer-group"),Ad=C("table-header-group");C("table-row");
var Bd=C("top"),Cd=C("transparent"),Dd=C("vertical-lr"),Ed=C("vertical-rl"),Fd=C("visible"),Gd=C("true"),Hd=new D(100,"%"),Id=new D(100,"vw"),Jd=new D(100,"vh"),Kd=new D(0,"px"),Ld={"font-size":1,color:2};function Md(a,b){return(Ld[a]||Number.MAX_VALUE)-(Ld[b]||Number.MAX_VALUE)};var Nd={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Od={};
function Pd(a,b){if(Nd[a]){var c=Od[a];c||(c=Od[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}function Qd(a){return Od[a]||[]}ba("vivliostyle.plugin.registerHook",Pd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Nd[a]){var c=Od[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Rd=null,Sd=null;function K(a){if(!Rd)throw Error("E_TASK_NO_CONTEXT");Rd.name||(Rd.name=a);var b=Rd;a=new Td(b,b.top,a);b.top=a;a.b=Ud;return a}function L(a){return new Vd(a)}function Wd(a,b,c){a=K(a);a.j=c;try{b(a)}catch(d){Xd(a.f,d,a)}return a.result()}function Yd(a){var b=Zd,c;Rd?c=Rd.f:(c=Sd)||(c=new $d(new ae));b(c,a,void 0)}var Ud=1;function ae(){}ae.prototype.currentTime=function(){return(new Date).valueOf()};function be(a,b){return setTimeout(a,b)}
function $d(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new ta;this.b=this.w=null;this.j=!1;this.order=0;Sd||(Sd=this)}
function ce(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.w)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.w=c+b;a.b=be(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<de(f.b[k],g))k+1<h&&0<de(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<de(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.g){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Rd,Rd=m,N(m.top,l.result),Rd=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){v.error(p)}a.j=!1;a.f.length()&&ce(a)},b)}}$d.prototype.ib=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<de(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}ce(this)};
function Zd(a,b,c){var d=new ee(a,c||"");d.top=new Td(d,null,"bootstrap");d.top.b=Ud;d.top.then(function(){function a(){d.j=!1;for(var a=0;a<d.h.length;a++){var b=d.h[a];try{b()}catch(h){v.error(h)}}}try{b().then(function(b){d.result=b;a()})}catch(f){Xd(d,f),a()}});c=Rd;Rd=d;a.ib(fe(d.top,"bootstrap"));Rd=c;return d}function ge(a){this.f=a;this.order=this.b=0;this.result=null;this.g=!1}function de(a,b){return b.b-a.b||b.order-a.order}ge.prototype.ib=function(a,b){this.result=a;this.f.f.ib(this,b)};
function ee(a,b){this.f=a;this.name=b;this.h=[];this.g=null;this.j=!0;this.b=this.top=this.l=this.result=null}function he(a,b){a.h.push(b)}ee.prototype.join=function(){var a=K("Task.join");if(this.j){var b=fe(a,this),c=this;he(this,function(){b.ib(c.result)})}else N(a,this.result);return a.result()};
function Xd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&v.error(a.g,"Unhandled exception in task",a.name)}function Vd(a){this.value=a}n=Vd.prototype;n.then=function(a){a(this.value)};n.fa=function(a){return a(this.value)};n.sc=function(a){return new Vd(a)};
n.Ba=function(a){N(a,this.value)};n.Pa=function(){return!1};n.get=function(){return this.value};function ie(a){this.b=a}n=ie.prototype;n.then=function(a){this.b.then(a)};n.fa=function(a){if(this.Pa()){var b=new Td(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Ud;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){N(b,a)})});return b.result()}return a(this.b.g)};n.sc=function(a){return this.Pa()?this.fa(function(){return new Vd(a)}):new Vd(a)};
n.Ba=function(a){this.Pa()?this.then(function(b){N(a,b)}):N(a,this.b.g)};n.Pa=function(){return this.b.b==Ud};n.get=function(){if(this.Pa())throw Error("Result is pending");return this.b.g};function Td(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function je(a){if(!Rd)throw Error("F_TASK_NO_CONTEXT");if(a!==Rd.top)throw Error("F_TASK_NOT_TOP_FRAME");}Td.prototype.result=function(){return new ie(this)};
function N(a,b){je(a);Rd.g||(a.g=b);a.b=2;var c=a.parent;Rd.top=c;if(a.h){try{a.h(b)}catch(d){Xd(a.f,d,c)}a.b=3}}Td.prototype.then=function(a){switch(this.b){case Ud:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Xd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function ke(){var a=K("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(v.debug("-- time slice --"),fe(a).ib(!0)):N(a,!0);return a.result()}function le(a){var b=K("Frame.sleep");fe(b).ib(!0,a);return b.result()}function me(a){function b(d){try{for(;d;){var e=a();if(e.Pa()){e.then(b);return}e.then(function(a){d=a})}N(c,!0)}catch(f){Xd(c.f,f,c)}}var c=K("Frame.loop");b(!0);return c.result()}
function ne(a){var b=Rd;if(!b)throw Error("E_TASK_NO_CONTEXT");return me(function(){var c;do c=new oe(b,b.top),b.top=c,c.b=Ud,a(c),c=c.result();while(!c.Pa()&&c.get());return c})}function fe(a,b){je(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ge(a.f);a.f.b=c;Rd=null;a.f.l=b||null;return c}function oe(a,b){Td.call(this,a,b,"loop")}t(oe,Td);function O(a){N(a,!0)}function P(a){N(a,!1)};function pe(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}pe.prototype.start=function(){if(!this.b){var a=this;this.b=Zd(Rd.f,function(){var b=K("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}N(b,c)});return b.result()},this.name)}};function qe(a,b){a.f?b(a.h):a.g.push(b)}pe.prototype.get=function(){if(this.f)return L(this.h);this.start();return this.b.join()};
function re(a){if(!a.length)return L(!0);if(1==a.length)return a[0].get().sc(!0);var b=K("waitForFetches"),c=0;me(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().sc(!0)}return L(!1)}).then(function(){N(b,!0)});return b.result()}
function se(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new pe(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.ib(b?b.type:"timeout"))}var g=K("loadImage"),h=fe(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return g.result()},"loadElement "+b);e.start();return e};function te(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function ue(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,te)}function ve(){this.type=0;this.b=!1;this.L=0;this.text="";this.position=0}
function we(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var xe=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];xe[NaN]=80;
var ye=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];ye[NaN]=43;
var ze=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];ye[NaN]=43;
var Ae=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Ae[NaN]=35;
var Be=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Be[NaN]=45;
var Ce=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Ce[NaN]=37;
var De=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];De[NaN]=38;
var Ee=we(35,[61,36]),Fe=we(35,[58,77]),Ge=we(35,[61,36,124,50]),He=we(35,[38,51]),Ie=we(35,[42,54]),Je=we(39,[42,55]),Ke=we(54,[42,55,47,56]),Le=we(62,[62,56]),Me=we(35,[61,36,33,70]),Ne=we(62,[45,71]),Oe=we(63,[45,56]),Pe=we(76,[9,72,10,72,13,72,32,72]),Qe=we(39,[39,46,10,72,13,72,92,48]),Re=we(39,[34,46,10,72,13,72,92,49]),Se=we(39,[39,47,10,74,13,74,92,48]),Te=we(39,[34,47,10,74,13,74,92,49]),Ue=we(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Ve=we(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),We=we(39,[39,68,10,74,13,74,92,75,NaN,67]),Xe=we(39,[34,68,10,74,13,74,92,75,NaN,67]),Ye=we(72,[9,39,10,39,13,39,32,39,41,69]);function Ze(a,b){this.l=b;this.g=15;this.w=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new ve}function Q(a){a.h==a.f&&$e(a);return a.j[a.f]}function R(a,b){(a.h-a.f&a.g)<=b&&$e(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function af(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Ze.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function $e(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new ve;b=a.h;c=d=a.g}for(var e=xe,f=a.w,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;){var u=f.charCodeAt(g);switch(e[u]||e[65]){case 72:l=51;m=isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=Ce;continue;case 3:l=1;k=g++;e=ye;continue;case 4:k=g++;l=31;e=Ee;continue;case 33:l=2;k=++g;e=Qe;continue;case 34:l=2;k=++g;e=Re;continue;case 6:k=++g;l=7;e=ye;continue;case 7:k=g++;l=32;e=Ee;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=He;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=Ee;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=Ae;continue;case 16:k=g++;e=ze;continue;case 78:k=g++;l=9;e=ye;continue;case 17:k=g++;
l=19;e=Ie;continue;case 18:k=g++;l=18;e=Fe;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Me;continue;case 21:k=g++;l=39;e=Ee;continue;case 22:k=g++;l=37;e=Ee;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=ye;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=Pe;continue;case 30:k=g++;l=33;e=Ee;continue;case 31:k=g++;l=34;e=Ge;continue;case 32:k=g++;l=35;e=Ee;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=ye;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=De;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=Pe;continue;case 45:m=ue(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=ue(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=Se;continue;
case 49:z=g;g+=2;e=Te;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Ue;continue}l=6}break;case 53:m=ue(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Ue;continue}l=6}break;case 54:e=Je;g++;continue;case 55:e=Ke;g++;continue;case 56:e=xe;g++;continue;case 57:e=Le;g++;continue;case 58:l=5;e=Ce;g++;continue;case 59:l=4;e=De;g++;continue;case 60:l=1;e=ye;g++;continue;case 61:l=1;e=Pe;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Ve;continue;case 65:k=++g;e=We;continue;case 66:k=++g;e=Xe;continue;case 67:l=8;m=ue(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Ne;g++;continue;case 71:e=Oe;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=ue(f.substring(k,g));g++;e=Ye;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=ue(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=Be;continue;default:e!==xe?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}r.type=l;r.b=q;r.L=p;r.text=m;r.position=k;b++;if(b>=c)break;e=xe;q=!1;r=h[b&d]}a.position=g;a.h=b&d};function bf(a,b,c,d,e){var f=K("ajax"),g=new XMLHttpRequest,h=fe(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Bd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;
else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Bd=cf([c]):l.Bd=c:v.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.ib(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):(a.match(/file:\/\/.*(\.html$|\.htm$)/)&&g.overrideMimeType("text/html"),g.send(null))}catch(k){v.b(k,
"Error fetching "+a),h.ib(l)}return f.result()}function cf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function df(a){var b=K("readBlob"),c=new FileReader,d=fe(b,c);c.addEventListener("load",function(){d.ib(c.result)},!1);c.readAsArrayBuffer(a);return b.result()}function ef(a,b){this.ha=a;this.type=b;this.h={};this.j={}}
ef.prototype.load=function(a,b,c){a=la(a);var d=this.h[a];return"undefined"!=typeof d?L(d):this.fetch(a,b,c).get()};function ff(a,b,c,d){var e=K("fetch");bf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.ha(f,a).then(function(c){delete a.j[b];a.h[b]=c;N(e,c)})});return e.result()}
ef.prototype.fetch=function(a,b,c){a=la(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new pe(function(){return ff(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};ef.prototype.get=function(a){return this.h[la(a)]};function gf(a){a=a.responseText;return L(a?JSON.parse(a):null)};function hf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Ec(b);if(3==a.length)return new Ec(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function jf(a){this.f=a;this.cb="Author"}n=jf.prototype;n.Rc=function(){return null};n.ia=function(){return this.f};n.error=function(){};n.Gc=function(a){this.cb=a};n.Gb=function(){};n.Sd=function(){};n.Xc=function(){};n.Yc=function(){};n.$d=function(){};n.od=function(){};
n.Mb=function(){};n.Rd=function(){};n.Pd=function(){};n.Wd=function(){};n.Dc=function(){};n.yb=function(){};n.Fd=function(){};n.ad=function(){};n.Jd=function(){};n.Dd=function(){};n.Id=function(){};n.Fc=function(){};n.ne=function(){};n.qc=function(){};n.Ed=function(){};n.Hd=function(){};n.Gd=function(){};n.dd=function(){};n.cd=function(){};n.Aa=function(){};n.wb=function(){};n.Nb=function(){};n.bd=function(){};n.qd=function(){};
function kf(a){switch(a.cb){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function lf(a){switch(a.cb){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function mf(){jf.call(this,null);this.g=[];this.b=null}t(mf,jf);function nf(a,b){a.g.push(a.b);a.b=b}n=mf.prototype;n.Rc=function(){return null};n.ia=function(){return this.b.ia()};n.error=function(a,b){this.b.error(a,b)};
n.Gc=function(a){jf.prototype.Gc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Gc(a)};n.Gb=function(a,b){this.b.Gb(a,b)};n.Sd=function(a){this.b.Sd(a)};n.Xc=function(a,b){this.b.Xc(a,b)};n.Yc=function(a,b){this.b.Yc(a,b)};n.$d=function(a){this.b.$d(a)};n.od=function(a,b,c,d){this.b.od(a,b,c,d)};n.Mb=function(){this.b.Mb()};n.Rd=function(){this.b.Rd()};n.Pd=function(){this.b.Pd()};n.Wd=function(){this.b.Wd()};n.Dc=function(){this.b.Dc()};n.yb=function(){this.b.yb()};n.Fd=function(){this.b.Fd()};
n.ad=function(a){this.b.ad(a)};n.Jd=function(){this.b.Jd()};n.Dd=function(){this.b.Dd()};n.Id=function(){this.b.Id()};n.Fc=function(){this.b.Fc()};n.ne=function(a){this.b.ne(a)};n.qc=function(a){this.b.qc(a)};n.Ed=function(a){this.b.Ed(a)};n.Hd=function(){this.b.Hd()};n.Gd=function(a,b,c){this.b.Gd(a,b,c)};n.dd=function(a,b,c){this.b.dd(a,b,c)};n.cd=function(a,b,c){this.b.cd(a,b,c)};n.Aa=function(){this.b.Aa()};n.wb=function(a,b,c){this.b.wb(a,b,c)};n.Nb=function(){this.b.Nb()};n.bd=function(a){this.b.bd(a)};
n.qd=function(){this.b.qd()};function of(a,b,c){jf.call(this,a);this.O=c;this.J=0;if(this.ka=b)this.cb=b.cb}t(of,jf);of.prototype.Rc=function(){return this.ka.Rc()};of.prototype.error=function(a){v.b(a)};of.prototype.Aa=function(){this.J++};of.prototype.Nb=function(){if(!--this.J&&!this.O){var a=this.ka;a.b=a.g.pop()}};function pf(a,b,c){of.call(this,a,b,c)}t(pf,of);function qf(a,b){a.error(b,a.Rc())}function rf(a,b){qf(a,b);nf(a.ka,new of(a.f,a.ka,!1))}n=pf.prototype;n.yb=function(){rf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.Fd=function(){rf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.ad=function(){rf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.Jd=function(){rf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Dd=function(){rf(this,"E_CSS_UNEXPECTED_DEFINE")};n.Id=function(){rf(this,"E_CSS_UNEXPECTED_REGION")};n.Fc=function(){rf(this,"E_CSS_UNEXPECTED_PAGE")};n.qc=function(){rf(this,"E_CSS_UNEXPECTED_WHEN")};n.Ed=function(){rf(this,"E_CSS_UNEXPECTED_FLOW")};n.Hd=function(){rf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Gd=function(){rf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.dd=function(){rf(this,"E_CSS_UNEXPECTED_PARTITION")};n.cd=function(){rf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.bd=function(){rf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.qd=function(){rf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.wb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Rc())};var sf=[],tf=[],T=[],uf=[],vf=[],wf=[],xf=[],yf=[],zf=[],Af=[],Bf=[],Cf=[],Df=[];sf[1]=28;sf[36]=29;sf[7]=29;sf[9]=29;sf[14]=29;sf[18]=29;sf[20]=30;sf[13]=27;sf[0]=200;tf[1]=46;tf[0]=200;wf[1]=2;
wf[36]=4;wf[7]=6;wf[9]=8;wf[14]=10;wf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;uf[1]=1;uf[36]=3;uf[7]=5;uf[9]=7;uf[14]=9;uf[11]=200;uf[18]=55;vf[1]=2;vf[36]=4;vf[7]=6;vf[9]=8;vf[18]=14;vf[50]=42;vf[14]=10;vf[12]=13;xf[1]=15;xf[7]=16;xf[4]=17;xf[5]=18;xf[3]=19;xf[2]=20;xf[8]=21;xf[16]=22;xf[19]=23;xf[6]=24;xf[11]=25;xf[17]=26;xf[13]=48;xf[31]=47;xf[23]=54;xf[0]=44;yf[1]=31;yf[4]=32;yf[5]=32;yf[3]=33;yf[2]=34;yf[10]=40;yf[6]=38;
yf[31]=36;yf[24]=36;yf[32]=35;zf[1]=45;zf[16]=37;zf[37]=37;zf[38]=37;zf[47]=37;zf[48]=37;zf[39]=37;zf[49]=37;zf[26]=37;zf[25]=37;zf[23]=37;zf[24]=37;zf[19]=37;zf[21]=37;zf[36]=37;zf[18]=37;zf[22]=37;zf[11]=39;zf[12]=43;zf[17]=49;Af[0]=200;Af[12]=50;Af[13]=51;Af[14]=50;Af[15]=51;Af[10]=50;Af[11]=51;Af[17]=53;Bf[0]=200;Bf[12]=50;Bf[13]=52;Bf[14]=50;Bf[15]=51;Bf[10]=50;Bf[11]=51;Bf[17]=53;Cf[0]=200;Cf[12]=50;Cf[13]=51;Cf[14]=50;Cf[15]=51;Cf[10]=50;Cf[11]=51;Df[11]=0;Df[16]=0;Df[22]=1;Df[18]=1;
Df[26]=2;Df[25]=2;Df[38]=3;Df[37]=3;Df[48]=3;Df[47]=3;Df[39]=3;Df[49]=3;Df[41]=3;Df[23]=4;Df[24]=4;Df[36]=5;Df[19]=5;Df[21]=5;Df[0]=6;Df[52]=2;function Ef(a,b,c,d){this.b=a;this.f=b;this.w=c;this.Z=d;this.G=[];this.O={};this.g=this.I=null;this.D=!1;this.j=2;this.result=null;this.H=!1;this.C=this.J=null;this.l=[];this.h=[];this.T=this.W=!1}function Ff(a,b){for(var c=[],d=a.G;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Gf(a,b,c){var d=a.G,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new rc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.w.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Bf,null;a=new tc(d[e-1],Ff(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.w.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Bf,null):1<
g?new sc(Ff(a,e+1)):d[0]}function Hf(a,b,c){a.b=a.g?Bf:Af;a.w.error(b,c)}
function If(a,b,c){for(var d=a.G,e=a.w,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Tb(e.ia(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new hc(e.ia(),qb(f,b),g);b=0;continue}}if(10==h){f.Je()&&(f=new jc(e.ia(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Ob(e.ia(),f);else if(-24==h)f=new Pb(e.ia(),
f);else return Hf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Df[b]>Df[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Qb(e.ia(),g,f);break;case 52:f=new Rb(e.ia(),g,f);break;case 25:f=new Sb(e.ia(),g,f);break;case 38:f=new Ub(e.ia(),g,f);break;case 37:f=new Wb(e.ia(),g,f);break;case 48:f=new Vb(e.ia(),g,f);break;case 47:f=new Xb(e.ia(),g,f);break;case 39:case 49:f=new Yb(e.ia(),g,f);break;case 41:f=new Zb(e.ia(),g,f);break;case 23:f=new $b(e.ia(),g,f);break;case 24:f=new ac(e.ia(),g,f);break;case 36:f=
new bc(e.ia(),g,f);break;case 19:f=new cc(e.ia(),g,f);break;case 21:f=new dc(e.ia(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ic(e.ia(),d.pop(),g,f);break;case 10:if(g.Je())f=new jc(e.ia(),g,f);else return Hf(a,"E_CSS_MEDIA_TEST",c),!1}else return Hf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Hf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Hf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Jf(a){for(var b=[];;){var c=Q(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.L);break;default:return b}S(a.f)}}
function Kf(a){var b=!1,c=Q(a.f);if(23===c.type)b=!0,S(a.f),c=Q(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.L)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.L);var d=0;S(a.f);var c=Q(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=Q(a.f));if(5===c.type){d=c.L;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.L),S(a.f),c=Q(a.f),5===c.type&&!(0>c.L||1/c.L===1/-0))return S(a.f),[b,c.L]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.L:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.L))return S(a.f),[0,c.L]}return null}
function Lf(a,b,c){a=a.w.ia();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=lc(a,c,new Ob(a,new fc(a,"pref-horizontal")));break;case "horizontal":c=lc(a,c,new fc(a,"pref-horizontal"));break;case "day":c=lc(a,c,new Ob(a,new fc(a,"pref-night-mode")));break;case "night":c=lc(a,c,new fc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function Mf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Nf(a,b,c,d,e,f){var g=a.w,h=a.f,l=a.G,k,m,p,q;e&&(a.j=2,a.G.push("{"));a:for(;0<b;--b)switch(k=Q(h),a.b[k.type]){case 28:if(18!=R(h,1).type){Mf(a)?(g.error("E_CSS_COLON_EXPECTED",R(h,1)),a.b=Bf):(a.b=wf,g.yb());continue}m=R(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.D=!1;S(h);S(h);a.b=xf;l.splice(0,l.length);continue;case 46:if(18!=R(h,1).type){a.b=Bf;g.error("E_CSS_COLON_EXPECTED",R(h,1));continue}a.g=k.text;a.D=!1;S(h);S(h);
a.b=xf;l.splice(0,l.length);continue;case 29:a.b=wf;g.yb();continue;case 1:if(!k.b){a.b=Cf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.Mb();case 2:if(34==R(h,1).type)if(S(h),S(h),p=a.O[k.text],null!=p)switch(k=Q(h),k.type){case 1:g.Gb(p,k.text);a.b=f?uf:T;S(h);break;case 36:g.Gb(p,null);a.b=f?uf:T;S(h);break;default:a.b=Af,g.error("E_CSS_NAMESPACE",k)}else a.b=Af,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Gb(a.I,k.text),a.b=f?uf:T,S(h);continue;case 3:if(!k.b){a.b=Cf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.Mb();case 4:if(34==R(h,1).type)switch(S(h),S(h),k=Q(h),k.type){case 1:g.Gb(null,k.text);a.b=f?uf:T;S(h);break;case 36:g.Gb(null,null);a.b=f?uf:T;S(h);break;default:a.b=Af,g.error("E_CSS_NAMESPACE",k)}else g.Gb(a.I,null),a.b=f?uf:T,S(h);continue;case 5:k.b&&g.Mb();case 6:g.$d(k.text);a.b=f?uf:T;S(h);continue;case 7:k.b&&g.Mb();case 8:g.Sd(k.text);a.b=f?uf:T;S(h);continue;case 55:k.b&&g.Mb();case 14:S(h);k=Q(h);b:switch(k.type){case 1:g.Xc(k.text,null);S(h);a.b=f?uf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=wf;g.bd("not");Nf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=Cf;break a;case "lang":case "href-epub-type":if(k=Q(h),1===k.type){p=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Kf(a))break;else break b;default:p=Jf(a)}k=Q(h);if(11==k.type){g.Xc(m,p);S(h);a.b=f?uf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Af;continue;case 42:S(h);k=Q(h);switch(k.type){case 1:g.Yc(k.text,
null);a.b=f?uf:T;S(h);continue;case 6:m=k.text;S(h);if("nth-fragment"==m){if(p=Kf(a),!p)break}else p=Jf(a);k=Q(h);if(11==k.type){g.Yc(m,p);a.b=f?uf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Af;continue;case 9:k.b&&g.Mb();case 10:S(h);k=Q(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=Cf;g.error("E_CSS_ATTR",k);S(h);continue}k=Q(h);if(34==k.type){p=m?a.O[m]:m;if(null==p){a.b=Cf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=
Q(h);if(1!=k.type){a.b=Cf;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue}m=k.text;S(h);k=Q(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;S(h);k=Q(h);break;case 15:g.od(p,m,0,null);a.b=f?uf:T;S(h);continue;default:a.b=Cf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.od(p,m,q,k.text);S(h);k=Q(h);break;default:a.b=Cf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Cf;g.error("E_CSS_ATTR",k);continue}a.b=f?uf:
T;S(h);continue;case 11:g.Rd();a.b=vf;S(h);continue;case 12:g.Pd();a.b=vf;S(h);continue;case 56:g.Wd();a.b=vf;S(h);continue;case 13:a.W?(a.h.push("-epubx-region"),a.W=!1):a.T?(a.h.push("page"),a.T=!1):a.h.push("[selector]");g.Aa();a.b=sf;S(h);continue;case 41:g.Dc();a.b=wf;S(h);continue;case 15:l.push(C(k.text));S(h);continue;case 16:try{l.push(hf(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=Af}S(h);continue;case 17:l.push(new Ac(k.L));S(h);continue;case 18:l.push(new Bc(k.L));S(h);continue;case 19:l.push(new D(k.L,
k.text));S(h);continue;case 20:l.push(new yc(k.text));S(h);continue;case 21:l.push(new Fc(oa(k.text,a.Z)));S(h);continue;case 22:Gf(a,",",k);l.push(",");S(h);continue;case 23:l.push(xc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=yf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Gf(a,")",k);S(h);continue;case 47:S(h);k=Q(h);m=R(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){S(h);a.D=!0;continue}Hf(a,"E_CSS_SYNTAX",
k);continue;case 54:m=R(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);continue}}a.b===xf&&0<=h.b?(af(h),a.b=wf,g.yb()):Hf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Gf(a,";",k))&&a.g&&g.wb(a.g,m,a.D);a.b=d?tf:sf;continue;case 44:S(h);h.b=-1;m=Gf(a,";",k);if(c)return a.result=m,!0;a.g&&m&&g.wb(a.g,m,a.D);if(d)return!0;Hf(a,"E_CSS_SYNTAX",k);continue;case 31:m=R(h,1);9==m.type?(10!=R(h,2).type||R(h,2).b?(l.push(new fc(g.ia(),qb(k.text,m.text))),a.b=zf):(l.push(k.text,
m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new gc(g.ia(),!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new gc(g.ia(),!1,k.text))):l.push(new fc(g.ia(),k.text)),a.b=zf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new tb(g.ia(),k.L));S(h);a.b=zf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new ec(g.ia(),k.L,m));S(h);a.b=zf;continue;case 34:l.push(new tb(g.ia(),k.text));
S(h);a.b=zf;continue;case 35:S(h);k=Q(h);5!=k.type||k.b?Hf(a,"E_CSS_SYNTAX",k):(l.push(new kc(g.ia(),k.L)),S(h),a.b=zf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=yf;If(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=yf,If(a,52,k),l.push(52),S(h)):Hf(a,"E_CSS_SYNTAX",k);continue;case 39:If(a,k.type,k)&&(a.g?a.b=xf:Hf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:If(a,11,k)&&(a.g||3==a.j?Hf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.qc(l.pop()):(k=
l.pop(),g.qc(k)),a.h.push("media"),g.Aa(),a.b=sf));S(h);continue;case 49:if(If(a,11,k))if(a.g||3!=a.j)Hf(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.C=l.pop(),a.H=!0,a.b=sf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=sf;S(h);g.Nb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=Q(h);if(2==k.type||8==k.type){a.J=k.text;S(h);k=Q(h);if(17==k.type||0==k.type)return a.H=!0,S(h),!1;a.g=null;a.j=3;a.b=yf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",
k);a.b=Af;continue;case "namespace":S(h);k=Q(h);switch(k.type){case 1:m=k.text;S(h);k=Q(h);if((2==k.type||8==k.type)&&17==R(h,1).type){a.O[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==R(h,1).type){a.I=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Af;continue;case "charset":S(h);k=Q(h);if(2==k.type&&17==R(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Af;continue;
case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==R(h,1).type){S(h);S(h);switch(m){case "font-face":g.Fd();break;case "-epubx-page-template":g.Hd();break;case "-epubx-define":g.Dd();break;case "-epubx-viewport":g.Jd()}a.h.push(m);g.Aa();continue}break;case "-adapt-footnote-area":S(h);k=Q(h);switch(k.type){case 12:S(h);g.ad(null);a.h.push(m);g.Aa();continue;case 50:if(S(h),k=Q(h),1==k.type&&12==R(h,1).type){m=k.text;S(h);S(h);g.ad(m);a.h.push("-adapt-footnote-area");
g.Aa();continue}}break;case "-epubx-region":S(h);g.Id();a.W=!0;a.b=wf;continue;case "page":S(h);g.Fc();a.T=!0;a.b=vf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k=Q(h);if(12==k.type){S(h);g.ne(m);a.h.push(m);g.Aa();
continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=yf;l.push("{");continue;case "media":S(h);a.g=null;a.j=2;a.b=yf;l.push("{");continue;case "-epubx-flow":if(1==R(h,1).type&&12==R(h,2).type){g.Ed(R(h,1).text);S(h);S(h);S(h);a.h.push(m);g.Aa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=Q(h);q=p=null;var r=[];1==k.type&&(p=k.text,S(h),k=Q(h));18==k.type&&1==R(h,1).type&&(q=R(h,1).text,S(h),S(h),k=Q(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&
1==R(h,1).type&&11==R(h,2).type;)r.push(R(h,1).text),S(h),S(h),S(h),k=Q(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.Gd(p,q,r);break;case "-epubx-partition":g.dd(p,q,r);break;case "-epubx-partition-group":g.cd(p,q,r)}a.h.push(m);g.Aa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Cf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Af;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Af;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||
d)return!0;if(!a.l.length){a.b=sf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=sf);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=sf);S(h);continue;case 200:return f&&(S(h),g.qd()),!0;default:if(c||d)return!0;if(e)return If(a,11,k)?(a.result=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===xf&&0<=h.b?(af(h),a.b=wf,g.yb()):a.b!==Af&&a.b!==Cf&&a.b!==Bf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",
k),a.b=Mf(a)?Bf:Cf):S(h)}return!1}function Of(a){jf.call(this,null);this.f=a}t(Of,jf);Of.prototype.error=function(a){throw Error(a);};Of.prototype.ia=function(){return this.f};
function Pf(a,b,c,d,e){var f=K("parseStylesheet"),g=new Ef(sf,a,b,c),h=null;e&&(h=Qf(new Ze(e,b),b,c));if(h=Lf(g,d,h&&h.ra()))b.qc(h),b.Aa();me(function(){for(;!Nf(g,100,!1,!1,!1,!1);){if(g.H){var a=oa(g.J,c);g.C&&(b.qc(g.C),b.Aa());var d=K("parseStylesheet.import");Rf(a,b,null,null).then(function(){g.C&&b.Nb();g.H=!1;g.J=null;g.C=null;N(d,!0)});return d.result()}a=ke();if(a.Pa)return a}return L(!1)}).then(function(){h&&b.Nb();N(f,!0)});return f.result()}
function Sf(a,b,c,d,e){return Wd("parseStylesheetFromText",function(f){var g=new Ze(a,b);Pf(g,b,c,d,e).Ba(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);N(b,!1)})}function Rf(a,b,c,d){return Wd("parseStylesheetFromURL",function(e){bf(a).then(function(f){f.responseText?Sf(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);N(e,!0)}):N(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);N(b,!0)})}
function Tf(a,b){var c=new Ef(xf,b,new Of(a),"");Nf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result}function Qf(a,b,c){a=new Ef(yf,a,b,c);Nf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result}var Uf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Vf(a,b,c){if(b.He())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Uf[c]?a==Math.round(a)?new Bc(a):new Ac(a):new D(a,"px");break a;case "string":c=a?Tf(b.b,new Ze(a,null)):B;break a;case "boolean":c=a?Gd:Xc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Wf(a,b,c,d){this.U=a;this.S=b;this.V=c;this.P=d}function Xf(a,b){this.f=a;this.b=b}function Yf(){this.bottom=this.right=this.top=this.left=0}function Zf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function $f(a,b,c,d){this.S=a;this.P=b;this.U=c;this.V=d;this.right=this.left=null}function ag(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function bg(a){this.b=a}function cg(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Zf(e,g,1,c):new Zf(g,e,-1,c));e=g}}
function dg(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Xf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new bg(e)}function eg(a,b,c,d){return new bg([new Xf(a,b),new Xf(c,b),new Xf(c,d),new Xf(a,d)])}function fg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function gg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function hg(a,b,c,d){var e,f;b.f.b<c&&v.b("Error: inconsistent segment (1)");b.b.b<=c?(c=gg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=gg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new fg(c,e,b.g,-1)),a.push(new fg(d,f,b.g,1))):(a.push(new fg(d,f,b.g,-1)),a.push(new fg(c,e,b.g,1)))}
function ig(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function jg(a,b){return b?Math.ceil(a/b)*b:a}function kg(a,b){return b?Math.floor(a/b)*b:a}function lg(a){return new Xf(a.b,-a.f)}function mg(a){return new Wf(a.S,-a.V,a.P,-a.U)}
function ng(a){return new bg(Ra(a.b,lg))}
function og(a,b,c,d,e){e&&(a=mg(a),b=Ra(b,ng),c=Ra(c,ng));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)cg(b[l],h,l);for(l=0;l<f;l++)cg(c[l],h,l+e);b=h.length;h.sort(ag);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.S&&g.push(new $f(a.S,c,a.V,a.V));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.P,r=Math.min(jg(Math.ceil(c+8),d),a.P);for(k=0;k<p.length&&q>r;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(kg(m.f.b,d),r)):m.b.f!=m.f.f&&(q=r);q>a.P&&(q=
a.P);for(;l<b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<r){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=r;l++}else{k=kg(m.b.b,d);k<q&&(q=k);break}r=[];for(k=0;k<p.length;k++)hg(r,p[k],c,q);r.sort(function(a,b){return a.f-b.f||a.g-b.g});r=ig(r,e,f);if(r.length){var z=0,u=a.U;for(k=0;k<r.length;k+=2){var A=Math.max(a.U,r[k]),H=Math.min(a.V,r[k+1])-A;H>z&&(z=H,u=A)}z?g.push(new $f(c,q,Math.max(u,a.U),Math.min(u+z,a.V))):g.push(new $f(c,q,a.V,a.V))}else g.push(new $f(c,q,a.V,a.V));if(q==a.P)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}pg(a,g);return g}function pg(a,b){for(var c=b.length-1,d=new $f(a.P,a.P,a.U,a.V);0<=c;){var e=d,d=b[c];if(1>d.P-d.S||d.U==e.U&&d.V==e.V)e.S=d.S,b.splice(c,1),d=e;c--}}function qg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function rg(a,b){if(!a.length)return b;for(var c=b.S,d,e=0;e<a.length&&!(d=a[e],d.P>b.S&&d.U-.1<=b.U&&d.V+.1>=b.V);e++)c=Math.max(c,d.P);for(var f=c;e<a.length&&!(d=a[e],d.S>=b.P||d.U-.1>b.U||d.V+.1<b.V);e++)f=d.P;f=e===a.length?b.P:Math.min(f,b.P);return f<=c?null:new Wf(b.U,c,b.V,f)}
function sg(a,b){if(!a.length)return b;for(var c=b.P,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.P<b.P)&&!(d.S<b.P&&d.U-.1<=b.U&&d.V+.1>=b.V);e--)c=Math.min(c,d.S);for(var f=Math.min(c,d.P);0<=e&&!(d=a[e],d.P<=b.S||d.U-.1>b.U||d.V+.1<b.V);e--)f=d.S;f=Math.max(f,b.S);return c<=f?null:new Wf(b.U,f,b.V,c)};function tg(){this.b={}}t(tg,pc);tg.prototype.Yb=function(a){this.b[a.name]=!0;return a};tg.prototype.zb=function(a){this.Zb(a.values);return a};function ug(a){this.value=a}t(ug,pc);ug.prototype.Jc=function(a){this.value=a.L;return a};function vg(a,b){if(a){var c=new ug(b);try{return a.ba(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function wg(){this.f=!1;this.b=[];this.name=null}t(wg,pc);wg.prototype.Lc=function(a){this.f&&this.b.push(a);return null};
wg.prototype.Kc=function(a){this.f&&!a.L&&this.b.push(new D(0,"px"));return null};wg.prototype.zb=function(a){this.Zb(a.values);return null};wg.prototype.Hb=function(a){this.f||(this.f=!0,this.Zb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function xg(a,b,c,d,e,f){if(a){var g=new wg;try{a.ba(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ga){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.L*m/100)}else a.push(k.L*Cb(f,k.ga,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Xf(b+a[g],c+a[g+1]));h=new bg(f);break a}break;case "rectangle":if(4==a.length){h=eg(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=dg(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=dg(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){v.b(p,"toShape:")}}return eg(b,c,b+d,c+e)}function yg(a){this.f=a;this.b={};this.name=null}t(yg,pc);yg.prototype.Yb=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};yg.prototype.Jc=function(a){this.name&&(this.b[this.name]+=a.L-(this.f?0:1));return a};yg.prototype.zb=function(a){this.Zb(a.values);return a};
function zg(a,b){var c=new yg(b);try{a.ba(c)}catch(d){v.b(d,"toCounters:")}return c.b}function Ag(a,b){this.b=a;this.f=b}t(Ag,qc);Ag.prototype.Mc=function(a){return new Fc(this.f.fd(a.url,this.b))};function Bg(a){this.g=this.h=null;this.f=0;this.b=a}function Cg(a,b){this.b=-1;this.f=a;this.g=b}function Dg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}Dg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
Dg.prototype.clone=function(){for(var a=new Dg,b=0;b<this.b.length;b++){var c=this.b[b],d=new Bg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new Cg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function Eg(a,b,c,d){var e=a.b.length,f=new Bg(Fg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new Cg(e,!0);e=new Cg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function Gg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof Hg}
function Ig(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&Gg(b)&&Gg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new Hg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function Jg(){}t(Jg,pc);Jg.prototype.h=function(a,b){var c=a[b].ba(this);return c?[c]:null};function Hg(a,b,c){this.b=a;this.f=b;this.g=c}t(Hg,Jg);n=Hg.prototype;n.pe=function(a){return this.b&1?a:null};
n.qe=function(a){return this.b&2048?a:null};n.gd=function(a){return this.b&2?a:null};n.Yb=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Lc=function(a){return a.L||this.b&512?0>a.L&&!(this.b&256)?null:this.g[a.ga]?a:null:"%"==a.ga&&this.b&1024?a:null};n.Kc=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.Jc=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.L])?a:null:this.b&512?a:null};
n.Md=function(a){return this.b&64?a:null};n.Mc=function(a){return this.b&128?a:null};n.zb=function(){return null};n.Xb=function(){return null};n.Hb=function(){return null};n.Ic=function(){return null};var Fg=new Hg(0,U,U);
function Kg(a){this.b=new Bg(null);var b=this.g=new Bg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(Kg,Jg);
function Lg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Mg&&a instanceof Mg){if(m=(new rc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Ng&&a instanceof Mg){if(m=(new sc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else m=
k.ba(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Kg.prototype;n.nb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.ba(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};n.pe=function(a){return this.nb(a)};n.qe=function(a){return this.nb(a)};n.gd=function(a){return this.nb(a)};n.Yb=function(a){return this.nb(a)};n.Lc=function(a){return this.nb(a)};n.Kc=function(a){return this.nb(a)};
n.Jc=function(a){return this.nb(a)};n.Md=function(a){return this.nb(a)};n.Mc=function(a){return this.nb(a)};n.zb=function(){return null};n.Xb=function(){return null};n.Hb=function(a){return this.nb(a)};n.Ic=function(){return null};function Mg(a){Kg.call(this,a)}t(Mg,Kg);Mg.prototype.zb=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new rc(b):null};
Mg.prototype.Xb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Ng){c=!0;break}b=b.g}return c?(b=Lg(this,a.values,!1,0),b===a.values?a:b?new sc(b):null):null};Mg.prototype.h=function(a,b){return Lg(this,a,!0,b)};function Ng(a){Kg.call(this,a)}t(Ng,Kg);Ng.prototype.zb=function(a){return this.nb(a)};Ng.prototype.Xb=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new sc(b):null};Ng.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Og(a,b){Kg.call(this,b);this.name=a}t(Og,Kg);Og.prototype.nb=function(){return null};Og.prototype.Hb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new tc(a.name,b):null};function Pg(){}Pg.prototype.b=function(a,b){return b};Pg.prototype.g=function(){};function Qg(a,b){this.name=b;this.h=a.g[this.name]}t(Qg,Pg);
Qg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new rc(a):a[0],c);return b+d}return b};Qg.prototype.g=function(a,b){b.values[this.name]=a};function Rg(a,b){Qg.call(this,a,b[0]);this.f=b}t(Rg,Qg);Rg.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Sg(a,b){this.f=a;this.Qe=b}t(Sg,Pg);
Sg.prototype.b=function(a,b,c){var d=b;if(this.Qe)if(a[b]==xc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Tg(){this.b=this.lb=null;this.error=!1;this.values={};this.f=null}n=Tg.prototype;n.clone=function(){var a=new this.constructor;a.lb=this.lb;a.b=this.b;a.f=this.f;return a};n.re=function(a,b){this.lb=a;this.b=b};n.wc=function(){this.error=!0;return 0};
function Ug(a,b){a.wc([b]);return null}n.pe=function(a){return Ug(this,a)};n.gd=function(a){return Ug(this,a)};n.Yb=function(a){return Ug(this,a)};n.Lc=function(a){return Ug(this,a)};n.Kc=function(a){return Ug(this,a)};n.Jc=function(a){return Ug(this,a)};n.Md=function(a){return Ug(this,a)};n.Mc=function(a){return Ug(this,a)};n.zb=function(a){this.wc(a.values);return null};n.Xb=function(){this.error=!0;return null};n.Hb=function(a){return Ug(this,a)};n.Ic=function(){this.error=!0;return null};
function Vg(){Tg.call(this)}t(Vg,Tg);Vg.prototype.wc=function(a){for(var b=0,c=0;b<a.length;){var d=this.lb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.lb.length){this.error=!0;break}}return b};function Wg(){Tg.call(this)}t(Wg,Tg);Wg.prototype.wc=function(a){if(a.length>this.lb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.lb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.lb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Xg(){Tg.call(this)}t(Xg,Tg);
Xg.prototype.wc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===xc){b=c;break}if(b>this.lb.length||!a.length)return this.error=!0,0;for(c=0;c<this.lb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.lb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Yg(){Tg.call(this)}t(Yg,Vg);
Yg.prototype.Xb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof sc)this.error=!0;else{a.values[c].ba(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new sc(b[k]);return null};
function Zg(){Tg.call(this)}t(Zg,Vg);Zg.prototype.re=function(a,b){Vg.prototype.re.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Zg.prototype.wc=function(a){var b=Vg.prototype.wc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].ba(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===xc){b++;if(b+2>a.length||!a[b].ba(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new rc(a.slice(b,a.length));if(!d.ba(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Zg.prototype.Xb=function(a){a.values[0].ba(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new sc(b);a.ba(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Zg.prototype.Yb=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var $g={SIMPLE:Vg,INSETS:Wg,INSETS_SLASH:Xg,COMMA:Yg,FONT:Zg};
function ah(){this.g={};this.C={};this.l={};this.b={};this.f={};this.h={};this.w=[];this.j=[]}function bh(a,b){var c;if(3==b.type)c=new D(b.L,b.text);else if(7==b.type)c=hf(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(Gg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function ch(a,b,c){for(var d=new Dg,e=0;e<b;e++)Ig(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Ig(d,a,3);else for(e=b;e<c;e++)Ig(d,a.clone(),2);return d}function dh(a){var b=new Dg,c=b.b.length;b.b.push(new Bg(a));a=new Cg(c,!0);var d=new Cg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function eh(a,b){var c;switch(a){case "COMMA":c=new Ng(b);break;case "SPACE":c=new Mg(b);break;default:c=new Og(a.toLowerCase(),b)}return dh(c)}
function fh(a){a.b.HASHCOLOR=dh(new Hg(64,U,U));a.b.POS_INT=dh(new Hg(32,U,U));a.b.POS_NUM=dh(new Hg(16,U,U));a.b.POS_PERCENTAGE=dh(new Hg(8,U,{"%":B}));a.b.NEGATIVE=dh(new Hg(256,U,U));a.b.ZERO=dh(new Hg(512,U,U));a.b.ZERO_PERCENTAGE=dh(new Hg(1024,U,U));a.b.POS_LENGTH=dh(new Hg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=dh(new Hg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=dh(new Hg(8,U,{s:B,ms:B}));a.b.FREQUENCY=dh(new Hg(8,U,{Hz:B,
kHz:B}));a.b.RESOLUTION=dh(new Hg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI=dh(new Hg(128,U,U));a.b.IDENT=dh(new Hg(4,U,U));a.b.STRING=dh(new Hg(2,U,U));a.b.SLASH=dh(new Hg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function gh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function hh(a,b,c){var d=Q(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=Q(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=Q(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=Q(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=Q(b).type)throw Error("'=' expected");gh(d)||(a.C[d]=e)}else if(18!=Q(b).type)throw Error("':' expected");return d}
function ih(a,b){for(;;){var c=hh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new Dg;if("||"==b){for(b=0;b<c.length;b++){var e=new Dg,g=e;if(g.b.length)throw Error("invalid call");var h=new Bg(Fg);h.f=2*b+1;g.b.push(h);var h=new Cg(0,!0),k=new Cg(0,!1);g.g.push(g.f.length);g.f.push(k);g.match.push(g.f.length);g.f.push(h);Ig(e,c[b],1);Eg(e,e.match,!1,b);Ig(a,e,b?4:1)}c=new Dg;if(c.b.length)throw Error("invalid call");
Eg(c,c.match,!0,-1);Ig(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)Eg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Ig(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(S(b),g=Q(b),g.type){case 1:h||k(" ");if(gh(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text.toLowerCase()]=C(g.text),d.push(dh(new Hg(0,p,U)));h=!1;break;case 5:p={};p[""+g.L]=new Bc(g.L);d.push(dh(new Hg(0,p,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({Te:d,Ne:f,ub:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({Te:d,Ne:f,ub:"(",Bc:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.ub)throw Error("']' unexpected");d=p.Te;d.push(g);f=p.Ne;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.ub)throw Error("')' unexpected");
d=p.Te;d.push(eh(p.Bc,g));f=p.Ne;h=!1;break;case 18:if(h)throw Error("':' unexpected");S(b);d.push(bh(d.pop(),Q(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(ch(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(ch(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(ch(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);g=Q(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.L;S(b);g=Q(b);if(16==g.type){S(b);g=Q(b);
if(5!=g.type)throw Error("<int> expected");q=g.L;S(b);g=Q(b)}if(13!=g.type)throw Error("'}' expected");d.push(ch(d.pop(),p,q));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().ub+"'");break;default:throw Error("unexpected token");}S(b);gh(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Mg(m):m.b[0].b}}
function jh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:v.b("Unknown property in makePropSet:",g)}return c}
function kh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.C[b])&&h[f])if(f=a.g[b])(a=c===dd||c.He()?c:c.ba(f))?e.xb(b,a,d):e.Sc(g,c);else if(b=a.h[b].clone(),c===dd)for(c=0;c<b.b.length;c++)e.xb(b.b[c],dd,d);else{c.ba(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.xb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.Sc(g,c)}else e.Kd(g,c)}
var lh=new pe(function(){var a=K("loadValidatorSet.load"),b=oa("validation.txt",na),c=bf(b),d=new ah;fh(d);c.then(function(c){try{if(c.responseText){var e=new Ze(c.responseText,null);for(ih(d,e);;){var g=hh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=Q(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Ac(h.L));break;case 5:c.push(new Bc(h.L));break;case 3:c.push(new D(h.L,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new rc(c):
c[0]}for(;;){var l=hh(d,e,3);if(!l)break;var k=R(e,1),m;1==k.type&&$g[k.text]?(m=new $g[k.text],S(e)):m=new Vg;m.f=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(S(e),k=Q(e),k.type){case 1:if(d.g[k.text])h.push(new Qg(m.f,k.text)),q.push(k.text);else if(d.h[k.text]instanceof Wg){var r=d.h[k.text];h.push(new Rg(r.f,r.b));q.push.apply(q,r.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Qe:c,
lb:h});h=[];c=!1;break;case 15:var z=new Sg(h,c),u=p.pop(),h=u.lb;c=u.Qe;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.re(h,q);d.h[l]=m}d.j=jh(d,["background"]);d.w=jh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(A){v.error(A,"Error:")}N(a,d)});return a.result()},"validatorFetcher");var mh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},nh=["box-decoration-break","image-resolution","orphans","widows"];function oh(){return Qd("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(nh))}
for(var ph={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},qh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),rh=["left","right","top","bottom"],sh={width:!0,height:!0},th=0;th<qh.length;th++)for(var uh=0;uh<rh.length;uh++){var vh=qh[th].replace("%",rh[uh]);sh[vh]=!0}function wh(a){for(var b={},c=0;c<qh.length;c++)for(var d in a){var e=qh[c].replace("%",d),f=qh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var xh=wh({before:"right",after:"left",start:"top",end:"bottom"}),yh=wh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Ua=b}n=V.prototype;n.mf=function(){return this};n.rd=function(a){a=this.value.ba(a);return a===this.value?this:new V(a,this.Ua)};n.rf=function(a){return a?new V(this.value,this.Ua+a):this};n.evaluate=function(a,b){return Vf(a,this.value,b)};n.Ve=function(){return!0};function zh(a,b,c){V.call(this,a,b);this.ea=c}t(zh,V);
zh.prototype.mf=function(){return new V(this.value,this.Ua)};zh.prototype.rd=function(a){a=this.value.ba(a);return a===this.value?this:new zh(a,this.Ua,this.ea)};zh.prototype.rf=function(a){return a?new zh(this.value,this.Ua+a,this.ea):this};zh.prototype.Ve=function(a){return!!this.ea.evaluate(a)};function Ah(a,b,c){return(!b||c.Ua>b.Ua)&&c.Ve(a)?c.mf():b}var Bh={"region-id":!0,"fragment-selector-id":!0};function Ch(a){return"_"!=a.charAt(0)&&!Bh[a]}function Dh(a,b,c){c?a[b]=c:delete a[b]}
function Eh(a,b){var c=a[b];c||(c={},a[b]=c);return c}function Fh(a){var b=a._viewConditionalStyles;b||(b=[],a._viewConditionalStyles=b);return b}function Gh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}
function Hh(a,b,c,d,e,f,g){[{id:e,Hf:"_pseudos"},{id:f,Hf:"_regions"}].forEach(function(a){if(a.id){var c=Eh(b,a.Hf);b=c[a.id];b||(b={},c[a.id]=b)}});g&&(e=Fh(b),b={},e.push({fg:b,Vf:g}));for(var h in c)"_"!=h.charAt(0)&&(Bh[h]?(g=c[h],e=Gh(b,h),Array.prototype.push.apply(e,g)):Dh(b,h,Ah(a,b[h],c[h].rf(d))))}function Ih(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}
function Jh(a,b){this.g=a;this.b=b;this.f=""}t(Jh,qc);function Kh(a){a=a.g["font-size"].value;var b;a:switch(a.ga.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.L*yb[a.ga]}
Jh.prototype.Lc=function(a){if("em"==a.ga||"ex"==a.ga){var b=Cb(this.b,a.ga,!1)/Cb(this.b,"em",!1);return new D(a.L*b*Kh(this),"px")}if("rem"==a.ga||"rex"==a.ga)return b=Cb(this.b,a.ga,!1)/Cb(this.b,"rem",!1),new D(a.L*b*this.b.fontSize(),"px");if("%"==a.ga){if("font-size"===this.f)return new D(a.L/100*Kh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.L,b)}return a};
Jh.prototype.Ic=function(a){return"font-size"==this.f?Vf(this.b,a,this.f).ba(this):a};function Lh(){}Lh.prototype.apply=function(){};Lh.prototype.l=function(a){return new Mh([this,a])};Lh.prototype.clone=function(){return this};function Nh(a){this.b=a}t(Nh,Lh);Nh.prototype.apply=function(a){var b=this.b.f(a);a.h[a.h.length-1].push(b)};function Mh(a){this.b=a}t(Mh,Lh);Mh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Mh.prototype.l=function(a){this.b.push(a);return this};
Mh.prototype.clone=function(){return new Mh([].concat(this.b))};function Oh(a,b,c,d,e){this.style=a;this.Y=b;this.b=c;this.h=d;this.j=e}t(Oh,Lh);Oh.prototype.apply=function(a){Hh(a.l,a.G,this.style,this.Y,this.b,this.h,Ph(a,this.j))};function W(){this.b=null}t(W,Lh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function Qh(a){this.b=null;this.h=a}t(Qh,W);Qh.prototype.apply=function(a){0<=a.H.indexOf(this.h)&&this.b.apply(a)};
Qh.prototype.f=function(){return 10};Qh.prototype.g=function(a){this.b&&Rh(a.Da,this.h,this.b);return!0};function Sh(a){this.b=null;this.id=a}t(Sh,W);Sh.prototype.apply=function(a){a.W!=this.id&&a.la!=this.id||this.b.apply(a)};Sh.prototype.f=function(){return 11};Sh.prototype.g=function(a){this.b&&Rh(a.g,this.id,this.b);return!0};function Th(a){this.b=null;this.localName=a}t(Th,W);Th.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Th.prototype.f=function(){return 8};
Th.prototype.g=function(a){this.b&&Rh(a.ed,this.localName,this.b);return!0};function Uh(a,b){this.b=null;this.h=a;this.localName=b}t(Uh,W);Uh.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Uh.prototype.f=function(){return 8};Uh.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Rh(a.h,b+this.localName,this.b)}return!0};function Vh(a){this.b=null;this.h=a}t(Vh,W);
Vh.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Wh(a){this.b=null;this.h=a}t(Wh,W);Wh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Xh(a,b){this.b=null;this.h=a;this.name=b}t(Xh,W);Xh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Yh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Yh,W);Yh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Yh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Yh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Rh(a.f,this.value,this.b),!0):!1};function Zh(a,b){this.b=null;this.h=a;this.name=b}t(Zh,W);
Zh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&ph[b]&&this.b.apply(a)}};Zh.prototype.f=function(){return 0};Zh.prototype.g=function(){return!1};function $h(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t($h,W);$h.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function ai(a){this.b=null;this.h=a}t(ai,W);ai.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function bi(){this.b=null}t(bi,W);bi.prototype.apply=function(a){a.tb&&this.b.apply(a)};bi.prototype.f=function(){return 6};function ci(){this.b=null}t(ci,W);ci.prototype.apply=function(a){a.va&&this.b.apply(a)};ci.prototype.f=function(){return 12};function di(a,b){this.b=null;this.h=a;this.ub=b}t(di,W);function ei(a,b,c){a-=c;return b?!(a%b)&&0<=a/b:!a}function fi(a,b){di.call(this,a,b)}t(fi,di);fi.prototype.apply=function(a){ei(a.Sa,this.h,this.ub)&&this.b.apply(a)};fi.prototype.f=function(){return 5};
function gi(a,b){di.call(this,a,b)}t(gi,di);gi.prototype.apply=function(a){ei(a.Cb[a.j][a.f],this.h,this.ub)&&this.b.apply(a)};gi.prototype.f=function(){return 5};function hi(a,b){di.call(this,a,b)}t(hi,di);hi.prototype.apply=function(a){var b=a.T;null===b&&(b=a.T=a.b.parentNode.childElementCount-a.Sa+1);ei(b,this.h,this.ub)&&this.b.apply(a)};hi.prototype.f=function(){return 4};function ii(a,b){di.call(this,a,b)}t(ii,di);
ii.prototype.apply=function(a){var b=a.Bb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}ei(b[a.j][a.f],this.h,this.ub)&&this.b.apply(a)};ii.prototype.f=function(){return 4};function ji(){this.b=null}t(ji,W);ji.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};ji.prototype.f=function(){return 4};
function ki(){this.b=null}t(ki,W);ki.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};ki.prototype.f=function(){return 5};function li(){this.b=null}t(li,W);li.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};li.prototype.f=function(){return 5};function mi(){this.b=null}t(mi,W);mi.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};mi.prototype.f=function(){return 5};function ni(a){this.b=null;this.ea=a}t(ni,W);
ni.prototype.apply=function(a){if(a.ha[this.ea])try{a.sb.push(this.ea),this.b.apply(a)}finally{a.sb.pop()}};ni.prototype.f=function(){return 5};function oi(){this.b=!1}t(oi,Lh);oi.prototype.apply=function(){this.b=!0};oi.prototype.clone=function(){var a=new oi;a.b=this.b;return a};function pi(a){this.b=null;this.h=new oi;this.j=Ih(a,this.h)}t(pi,W);pi.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};pi.prototype.f=function(){return this.j.f()};
function qi(a,b,c){this.ea=a;this.b=b;this.h=c}function ri(a,b){var c=a.ea,d=a.h;b.ha[c]=(b.ha[c]||0)+1;d&&(b.C[c]?b.C[c].push(d):b.C[c]=[d])}function si(a,b){ti(b,a.ea,a.h)}function ui(a,b,c){qi.call(this,a,b,c)}t(ui,qi);ui.prototype.f=function(a){return new ui(this.ea,this.b,Ph(a,this.b))};ui.prototype.push=function(a,b){b||ri(this,a);return!1};ui.prototype.pop=function(a,b){return b?!1:(si(this,a),!0)};function vi(a,b,c){qi.call(this,a,b,c)}t(vi,qi);
vi.prototype.f=function(a){return new vi(this.ea,this.b,Ph(a,this.b))};vi.prototype.push=function(a,b){b?1==b&&si(this,a):ri(this,a);return!1};vi.prototype.pop=function(a,b){if(b)1==b&&ri(this,a);else return si(this,a),!0;return!1};function wi(a,b,c){qi.call(this,a,b,c);this.g=!1}t(wi,qi);wi.prototype.f=function(a){return new wi(this.ea,this.b,Ph(a,this.b))};wi.prototype.push=function(a){return this.g?(si(this,a),!0):!1};
wi.prototype.pop=function(a,b){if(this.g)return si(this,a),!0;b||(this.g=!0,ri(this,a));return!1};function xi(a,b,c){qi.call(this,a,b,c);this.g=!1}t(xi,qi);xi.prototype.f=function(a){return new xi(this.ea,this.b,Ph(a,this.b))};xi.prototype.push=function(a,b){this.g&&(-1==b?ri(this,a):b||si(this,a));return!1};xi.prototype.pop=function(a,b){if(this.g){if(-1==b)return si(this,a),!0;b||ri(this,a)}else b||(this.g=!0,ri(this,a));return!1};function yi(a,b){this.b=a;this.element=b}yi.prototype.f=function(){return this};
yi.prototype.push=function(){return!1};yi.prototype.pop=function(a,b){return b?!1:(zi(a,this.b,this.element),!0)};function Ai(a){this.lang=a}Ai.prototype.f=function(){return this};Ai.prototype.push=function(){return!1};Ai.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function Bi(a){this.b=a}Bi.prototype.f=function(){return this};Bi.prototype.push=function(){return!1};Bi.prototype.pop=function(a,b){return b?!1:(a.J=this.b,!0)};function Ci(a){this.element=a}t(Ci,qc);
function Di(a,b){switch(b){case "url":return a?new Fc(a):new Fc("about:invalid");default:return a?new yc(a):new yc("")}}
Ci.prototype.Hb=function(a){if("attr"!==a.name)return qc.prototype.Hb.call(this,a);var b="string",c;a.values[0]instanceof rc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?Di(a.values[1].stringValue(),b):Di(null,b);return this.element&&this.element.hasAttribute(c)?Di(this.element.getAttribute(c),b):a};function Ei(a,b,c){this.f=a;this.element=b;this.b=c}t(Ei,qc);
Ei.prototype.Yb=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.D)];b.D++;break;case "close-quote":return 0<b.D&&b.D--,c[2*Math.min(d,b.D)+1];case "no-open-quote":return b.D++,new yc("");case "no-close-quote":return 0<b.D&&b.D--,new yc("")}return a};
var Fi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Gi={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Hi={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Ii={Fg:!1,Oc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",xd:"\u5341\u767e\u5343",Yf:"\u8ca0"};
function Ji(a){if(9999<a||-9999>a)return""+a;if(!a)return Ii.Oc.charAt(0);var b=new Ca;0>a&&(b.append(Ii.Yf),a=-a);if(10>a)b.append(Ii.Oc.charAt(a));else if(Ii.Gg&&19>=a)b.append(Ii.xd.charAt(0)),a&&b.append(Ii.xd.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Ii.Oc.charAt(c)),b.append(Ii.xd.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Ii.Oc.charAt(c)),b.append(Ii.xd.charAt(1));if(c=Math.floor(a/10)%10)b.append(Ii.Oc.charAt(c)),b.append(Ii.xd.charAt(0));(a%=10)&&b.append(Ii.Oc.charAt(a))}return b.toString()}
function Ki(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(Fi[b])a:{e=Fi[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(Gi[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Gi[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=Hi[b]?e=Hi[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Ji(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Li(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new yc(Ki(e&&e.length&&e[e.length-1]||0,d));c=new E(Mi(a.b,c,function(a){return Ki(a||0,d)}));return new rc([c])}
function Ni(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Ca;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Ki(f[h],e));c=new E(Oi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Ki(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Ki(0,e)}));return new rc([c])}
function Pi(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Qi(a.b,c,d,function(a){return Ki(a||0,e)}));return new rc([c])}function Ri(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Si(a.b,c,d,function(a){a=a.map(function(a){return Ki(a,f)});return a.length?a.join(e):Ki(0,f)}));return new rc([c])}
Ei.prototype.Hb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return Li(this,a.values);break;case "counters":if(3>=a.values.length)return Ni(this,a.values);break;case "target-counter":if(3>=a.values.length)return Pi(this,a.values);break;case "target-counters":if(4>=a.values.length)return Ri(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new yc("")};var Ti=1/1048576;function Ui(a,b){for(var c in a)b[c]=a[c].clone()}
function Vi(){this.j=0;this.b={};this.ed={};this.h={};this.f={};this.Da={};this.g={};this.Vc={};this.order=0}Vi.prototype.clone=function(){var a=new Vi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Ui(this.ed,a.ed);Ui(this.h,a.h);Ui(this.f,a.f);Ui(this.Da,a.Da);Ui(this.g,a.g);Ui(this.Vc,a.Vc);a.order=this.order;return a};function Rh(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}Vi.prototype.Me=function(){return this.order+=Ti};
function Wi(a,b,c,d){this.w=a;this.l=b;this.Nc=c;this.Ab=d;this.h=[[],[]];this.ha={};this.H=this.G=this.Ia=this.b=null;this.Ra=this.la=this.W=this.j=this.f="";this.Z=this.O=null;this.va=this.tb=!0;this.g={};this.I=[{}];this.J=[new yc("\u201c"),new yc("\u201d"),new yc("\u2018"),new yc("\u2019")];this.D=0;this.lang="";this.vc=[0];this.Sa=0;this.pa=[{}];this.Cb=this.pa[0];this.T=null;this.uc=[this.T];this.tc=[{}];this.Bb=this.pa[0];this.C={};this.sb=[];this.Db=[]}
function ti(a,b,c){a.ha[b]--;a.C[b]&&(a.C[b]=a.C[b].filter(function(a){return a!==c}),a.C[b].length||delete a.C[b])}function Ph(a,b){var c=null;b&&(c=Xi(a.Ia,b));var d=a.sb.map(function(a){return(a=this.C[a])&&0<a.length?1===a.length?a[0]:new Yi([].concat(a)):null}.bind(a)).filter(function(a){return a});return 0>=d.length?c:c?new Zi([c].concat(d)):1===d.length?d[0]:new Zi(d)}function $i(a,b,c){(b=b[c])&&b.apply(a)}var aj=[];
function bj(a,b,c,d){a.b=null;a.Ia=null;a.G=d;a.j="";a.f="";a.W="";a.la="";a.H=b;a.Ra="";a.O=aj;a.Z=c;cj(a)}function dj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.I[a.I.length-1];c||(c={},a.I[a.I.length-1]=c);c[b]=!0}
function ej(a,b){var c=ed,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=zg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=zg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=zg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===kd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)dj(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):dj(a,l,f[l]);if(d)for(var k in d)a.g[k]||
dj(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===kd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Ac(c[c.length-1]),0));a.I.push(null)}function fj(a){var b=a.I.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function zi(a,b,c){ej(a,b);b.content&&(b.content=b.content.rd(new Ei(a,c,a.Ab)));fj(a)}var gj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function hj(a,b,c,d){a.Db.push(b);a.Z=null;a.b=b;a.Ia=d;a.G=c;a.j=b.namespaceURI;a.f=b.localName;d=a.w.b[a.j];a.Ra=d?d+a.f:"";a.W=b.getAttribute("id");a.la=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.H=d.split(/\s+/):a.H=aj;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O=d.split(/\s+/):a.O=aj;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.H=[b.getAttribute("name")||""]);if(d=Ba(b))a.h[a.h.length-1].push(new Ai(a.lang)),
a.lang=d.toLowerCase();d=a.va;var e=a.vc;a.Sa=++e[e.length-1];e.push(0);var e=a.pa,f=a.Cb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.uc;null!==e[e.length-1]?a.T=--e[e.length-1]:a.T=null;e.push(null);e=a.tc;(f=a.Bb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});cj(a);ij(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new Bi(a.J),e===F?a.J=[new yc(""),new yc("")]:e instanceof rc&&(a.J=e.values));ej(a,a.G);e=a.W||a.la||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);jj(a.Nc,e,h)}if(d=a.G._pseudos)for(e=!0,f=0;f<gj.length;f++)(g=gj[f])||(e=!1),(g=d[g])&&(e?zi(a,g,b):a.h[a.h.length-2].push(new yi(g,b)));c&&a.h[a.h.length-2].push(c)}function kj(a,b){for(var c in b)Ch(c)&&(b[c]=b[c].rd(a))}function ij(a,b){var c=new Ci(b),d=a.G,e=d._pseudos,f;for(f in e)kj(c,e[f]);kj(c,d)}
function cj(a){var b;for(b=0;b<a.H.length;b++)$i(a,a.w.Da,a.H[b]);for(b=0;b<a.O.length;b++)$i(a,a.w.f,a.O[b]);$i(a,a.w.g,a.W);$i(a,a.w.ed,a.f);""!=a.f&&$i(a,a.w.ed,"*");$i(a,a.w.h,a.Ra);null!==a.Z&&($i(a,a.w.Vc,a.Z),$i(a,a.w.Vc,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.tb=!0;a.va=!1}
Wi.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.tb=!1};var lj=null;function mj(a,b,c,d,e,f,g){of.call(this,a,b,g);this.b=null;this.Y=0;this.h=this.ab=null;this.D=!1;this.ea=c;this.l=d?d.l:lj?lj.clone():new Vi;this.H=e;this.C=f;this.w=0;this.j=null}t(mj,pf);mj.prototype.tf=function(a){Rh(this.l.ed,"*",a)};function nj(a,b){var c=Ih(a.b,b);c!==b&&c.g(a.l)||a.tf(c)}
mj.prototype.Gb=function(a,b){if(b||a)this.Y+=1,b&&a?this.b.push(new Uh(a,b.toLowerCase())):b?this.b.push(new Th(b.toLowerCase())):this.b.push(new Wh(a))};mj.prototype.Sd=function(a){this.h?(v.b("::"+this.h,"followed by ."+a),this.b.push(new ni(""))):(this.Y+=256,this.b.push(new Qh(a)))};var oj={"nth-child":fi,"nth-of-type":gi,"nth-last-child":hi,"nth-last-of-type":ii};
mj.prototype.Xc=function(a,b){if(this.h)v.b("::"+this.h,"followed by :"+a),this.b.push(new ni(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new ki);break;case "disabled":this.b.push(new li);break;case "checked":this.b.push(new mi);break;case "root":this.b.push(new ci);break;case "link":this.b.push(new Th("a"));this.b.push(new Xh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+qa(b[0])+"($|s)");this.b.push(new Vh(c))}else this.b.push(new ni(""));
break;case "-adapt-footnote-content":case "footnote-content":this.D=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new ni(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new ai(new RegExp("^"+qa(b[0].toLowerCase())+"($|-)"))):this.b.push(new ni(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=oj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new ni(""));break;case "first-child":this.b.push(new bi);
break;case "last-child":this.b.push(new hi(0,1));break;case "first-of-type":this.b.push(new gi(0,1));break;case "last-of-type":this.b.push(new ii(0,1));break;case "only-child":this.b.push(new bi);this.b.push(new hi(0,1));break;case "only-of-type":this.b.push(new gi(0,1));this.b.push(new ii(0,1));break;case "empty":this.b.push(new ji);break;case "before":case "after":case "first-line":case "first-letter":this.Yc(a,b);return;default:v.b("unknown pseudo-class selector: "+a),this.b.push(new ni(""))}this.Y+=
256}};
mj.prototype.Yc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new ni(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new ni(""))):this.h="first-"+c+"-lines";break}}case "nth-fragment":b&&2==
b.length?this.j="NFS_"+b[0]+"_"+b[1]:this.b.push(new ni(""));break;default:v.b("Unrecognized pseudoelement: ::"+a),this.b.push(new ni(""))}this.Y+=1};mj.prototype.$d=function(a){this.Y+=65536;this.b.push(new Sh(a))};
mj.prototype.od=function(a,b,c,d){this.Y+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Xh(a,b);break;case 39:e=new Yh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new ni(""):e=new $h(a,b,new RegExp("(^|\\s)"+qa(d)+"($|\\s)"));break;case 44:e=new $h(a,b,new RegExp("^"+qa(d)+"($|-)"));break;case 43:d?e=new $h(a,b,new RegExp("^"+qa(d))):e=new ni("");break;case 42:d?e=new $h(a,b,new RegExp(qa(d)+"$")):e=new ni("");break;case 46:d?e=new $h(a,b,new RegExp(qa(d))):e=new ni("");break;case 50:"supported"==
d?e=new Zh(a,b):(v.b("Unsupported :: attr selector op:",d),e=new ni(""));break;default:v.b("Unsupported attr selector:",c),e=new ni("")}this.b.push(e)};var pj=0;n=mj.prototype;n.Mb=function(){var a="d"+pj++;nj(this,new Nh(new ui(a,this.j,null)));this.b=[new ni(a)];this.j=null};n.Rd=function(){var a="c"+pj++;nj(this,new Nh(new vi(a,this.j,null)));this.b=[new ni(a)];this.j=null};n.Pd=function(){var a="a"+pj++;nj(this,new Nh(new wi(a,this.j,null)));this.b=[new ni(a)];this.j=null};
n.Wd=function(){var a="f"+pj++;nj(this,new Nh(new xi(a,this.j,null)));this.b=[new ni(a)];this.j=null};n.Dc=function(){qj(this);this.h=null;this.D=!1;this.Y=0;this.b=[]};n.yb=function(){var a;0!=this.w?(rf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.w=1,this.ab={},this.h=null,this.Y=0,this.D=!1,this.b=[])};n.error=function(a,b){pf.prototype.error.call(this,a,b);1==this.w&&(this.w=0)};n.Gc=function(a){pf.prototype.Gc.call(this,a);this.w=0};
n.Aa=function(){qj(this);pf.prototype.Aa.call(this);1==this.w&&(this.w=0)};n.Nb=function(){pf.prototype.Nb.call(this)};function qj(a){if(a.b){var b=a.Y+a.l.Me();nj(a,a.yf(b));a.b=null;a.h=null;a.j=null;a.D=!1;a.Y=0}}n.yf=function(a){var b=this.H;this.D&&(b=b?"xxx-bogus-xxx":"footnote");return new Oh(this.ab,a,this.h,b,this.j)};n.wb=function(a,b,c){kh(this.C,a,b,c,this)};n.Sc=function(a,b){qf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};
n.Kd=function(a,b){qf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};n.xb=function(a,b,c){"display"!=a||b!==od&&b!==nd||(this.xb("flow-options",new rc([Wc,ud]),c),this.xb("flow-into",b,c),b=Mc);Qd("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?kf(this):lf(this);Dh(this.ab,a,this.ea?new zh(b,d,this.ea):new V(b,d))};n.bd=function(a){switch(a){case "not":a=new rj(this),a.yb(),nf(this.ka,a)}};
function rj(a){mj.call(this,a.f,a.ka,a.ea,a,a.H,a.C,!1);this.parent=a;this.g=a.b}t(rj,mj);n=rj.prototype;n.bd=function(a){"not"==a&&rf(this,"E_CSS_UNEXPECTED_NOT")};n.Aa=function(){rf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Dc=function(){rf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.qd=function(){this.b&&0<this.b.length&&this.g.push(new pi(this.b));this.parent.Y+=this.Y;var a=this.ka;a.b=a.g.pop()};n.error=function(a,b){mj.prototype.error.call(this,a,b);var c=this.ka;c.b=c.g.pop()};
function sj(a,b){of.call(this,a,b,!1)}t(sj,pf);sj.prototype.wb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Rc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new ec(this.f,100,c),c=b.ra(this.f,c);this.f.values[a]=c}};function tj(a,b,c,d,e){of.call(this,a,b,!1);this.ab=d;this.ea=c;this.b=e}t(tj,pf);tj.prototype.wb=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):kh(this.b,a,b,c,this)};tj.prototype.Sc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
tj.prototype.Kd=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};tj.prototype.xb=function(a,b,c){c=c?kf(this):lf(this);c+=this.order;this.order+=Ti;Dh(this.ab,a,this.ea?new zh(b,c,this.ea):new V(b,c))};function uj(a,b){Of.call(this,a);this.ab={};this.b=b;this.order=0}t(uj,Of);uj.prototype.wb=function(a,b,c){kh(this.b,a,b,c,this)};uj.prototype.Sc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};uj.prototype.Kd=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
uj.prototype.xb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Ti;Dh(this.ab,a,new V(b,c))};function vj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==dd?b===Ed:c}function wj(a,b,c,d){var e={},f;for(f in a)Ch(f)&&(e[f]=a[f]);xj(e,b,a);yj(a,c,d,function(a,c){zj(e,c,b);xj(e,b,c)});return e}function yj(a,b,c,d){a=a._regions;if((b||c)&&a)for(c&&(c=["footnote"],b=b?b.concat(c):c),c=0;c<b.length;c++){var e=b[c],f=a[e];f&&d(e,f)}}
function zj(a,b,c){for(var d in b)Ch(d)&&(a[d]=Ah(c,a[d],b[d]))}function Aj(a,b,c,d){c=c?xh:yh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ua>f.Ua)continue;g=sh[g]?g:e}else g=e;b[g]=d(e,f)}}};var Bj=!1,Cj={ug:"ltr",vg:"rtl"};ba("vivliostyle.constants.PageProgression",Cj);Cj.LTR="ltr";Cj.RTL="rtl";var Dj={Jf:"left",Kf:"right"};ba("vivliostyle.constants.PageSide",Dj);Dj.LEFT="left";Dj.RIGHT="right";var Ej={LOADING:"loading",tg:"interactive",qg:"complete"};ba("vivliostyle.constants.ReadyState",Ej);Ej.LOADING="loading";Ej.INTERACTIVE="interactive";Ej.COMPLETE="complete";function Fj(a,b,c){this.w=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=Gj(Gj(Gj(Gj(new Hj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function Ij(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function Jj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return Ij(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,Ij(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return Ij(a,b)+e}function Kj(a){0>a.h&&(a.h=Jj(a,a.root,0,!0));return a.h}
function Lj(a,b){for(var c,d=a.root;;){c=Ij(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=La(e.length,function(c){return Ij(a,e[c])>b});if(!f)break;if(f<e.length&&Ij(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function Mj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Mj(a,c)}function Nj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},Mj(a,a.b.documentElement)),d=a.f[c]);return d}
var Oj={yg:"text/html",zg:"text/xml",lg:"application/xml",kg:"application/xhtml_xml",sg:"image/svg+xml"};function Pj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Qj(a){var b=a.contentType;if(b){for(var c=Object.keys(Oj),d=0;d<c.length;d++)if(Oj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Rj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Qj(a);(c=Pj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Pj(e,"image/svg+xml",d)):c=Pj(e,"text/html",d));c||(c=Pj(e,"text/html",d))}}c=c?new Fj(b,a.url,c):null;return L(c)}function Sj(a){this.Bc=a}
function Tj(){var a=Uj;return new Sj(function(b){return a.Bc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Vj(){var a=Tj(),b=Uj;return new Sj(function(c){if(!b.Bc(c))return!1;c=new Hj([c]);c=Gj(c,"EncryptionMethod");a&&(c=Wj(c,a));return 0<c.b.length})}var Uj=new Sj(function(){return!0});function Hj(a){this.b=a}function Wj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Bc(e)&&c.push(e)}return new Hj(c)}
function Xj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new Hj(d)}Hj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Yj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function Gj(a,b){return Xj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Zj(a){return Xj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function ak(a,b){return Yj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}Hj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var bk={transform:!0,"transform-origin":!0},ck={top:!0,bottom:!0,left:!0,right:!0};function dk(a,b,c){this.target=a;this.name=b;this.value=c}var ek={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function fk(a,b){var c=ek[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function gk(a,b){this.h={};this.K=a;this.g=b;this.O=null;this.w=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ua(c,{type:"hyperlink",target:null,currentTarget:null,Dg:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.C=this.H=!1;this.D=this.G=!0;this.R=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.I={top:{},bottom:{},left:{},right:{}}}
t(gk,Ta);function hk(a,b){(a.G=b)?a.K.setAttribute("data-vivliostyle-auto-page-width",!0):a.K.removeAttribute("data-vivliostyle-auto-page-width")}function ik(a,b){(a.D=b)?a.K.setAttribute("data-vivliostyle-auto-page-height",!0):a.K.removeAttribute("data-vivliostyle-auto-page-height")}function jk(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function kk(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.K.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.w,e=0;e<d.length;e++){var f=d[e];w(f.target,f.name,f.value.toString())}e=lk(c,a.K);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.Zc],d=a.b[c.$f],f&&d&&(f=fk(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
gk.prototype.zoom=function(a){w(this.K,"transform","scale("+a+")")};function mk(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function nk(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function ok(a){this.f=a;this.b=[];this.F=null}
function pk(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Ua=d;this.l=e;this.h=f;this.cg=g;this.j=h;this.kb=-1;this.g=l}function qk(a,b){return a.h?!b.h||a.Ua>b.Ua?!0:a.j:!1}function rk(a,b){return a.top-b.top}function sk(a,b){return b.right-a.right}function tk(a,b){return a===b?!0:a&&b?a.node===b.node&&a.Za===b.Za&&uk(a.oa,b.oa)&&uk(a.za,b.za)&&tk(a.ua,b.ua):!1}
function vk(a,b){if(a===b)return!0;if(!a||!b||a.ja!==b.ja||a.M!==b.M||a.ma.length!==b.ma.length)return!1;for(var c=0;c<a.ma.length;c++)if(!tk(a.ma[c],b.ma[c]))return!1;return!0}function wk(a){return{ma:[{node:a.N,Za:yk,oa:a.oa,za:null,ua:null,Ka:0}],ja:0,M:!1,Ha:a.Ha}}function zk(a,b){var c=new Ak(a.node,b,0);c.Za=a.Za;c.oa=a.oa;c.za=a.za;c.ua=a.ua?zk(a.ua,Bk(b)):null;c.F=a.F;c.Ka=a.Ka+1;return c}var yk=0;
function Ck(a,b,c,d,e,f,g){this.ka=a;this.Wc=d;this.Se=null;this.root=b;this.aa=c;this.type=f;e&&(e.Se=this);this.b=g}function uk(a,b){return a===b||!!a&&!!b&&(b?a.ka===b.ka&&a.aa===b.aa&&a.type===b.type&&uk(a.Wc,b.Wc):!1)}function Dk(a,b){this.ag=a;this.count=b}
function Ak(a,b,c){this.N=a;this.parent=b;this.Ca=c;this.ja=0;this.M=!1;this.Za=yk;this.oa=b?b.oa:null;this.ua=this.za=null;this.la=!1;this.ta=!0;this.b=!1;this.l=b?b.l:0;this.display=null;this.H=Ek;this.W=this.C=this.ya=null;this.T="baseline";this.Z="top";this.Qd=this.ha=0;this.I=!1;this.ac=b?b.ac:0;this.h=b?b.h:null;this.w=b?b.w:!1;this.O=this.Qc=!1;this.D=this.B=this.G=this.g=null;this.vb=b?b.vb:{};this.u=b?b.u:!1;this.pa=b?b.pa:"ltr";this.f=b?b.f:null;this.Ha=this.lang=null;this.F=b?b.F:null;
this.j=null;this.Ka=1;this.J=null}function Fk(a){a.ta=!0;a.l=a.parent?a.parent.l:0;a.B=null;a.D=null;a.ja=0;a.M=!1;a.display=null;a.H=Ek;a.ya=null;a.C=null;a.W=null;a.T="baseline";a.I=!1;a.ac=a.parent?a.parent.ac:0;a.h=a.parent?a.parent.h:null;a.w=a.parent?a.parent.w:!1;a.g=null;a.G=null;a.za=null;a.Qc=!1;a.O=!1;a.u=a.parent?a.parent.u:!1;a.za=null;a.Ha=null;a.F=a.parent?a.parent.F:null;a.j=null;a.Ka=1;a.J=null}
function Gk(a){var b=new Ak(a.N,a.parent,a.Ca);b.ja=a.ja;b.M=a.M;b.za=a.za;b.Za=a.Za;b.oa=a.oa;b.ua=a.ua;b.ta=a.ta;b.l=a.l;b.display=a.display;b.H=a.H;b.ya=a.ya;b.C=a.C;b.W=a.W;b.T=a.T;b.Z=a.Z;b.ha=a.ha;b.Qd=a.Qd;b.Qc=a.Qc;b.O=a.O;b.I=a.I;b.ac=a.ac;b.h=a.h;b.w=a.w;b.g=a.g;b.G=a.G;b.B=a.B;b.D=a.D;b.f=a.f;b.u=a.u;b.b=a.b;b.Ha=a.Ha;b.F=a.F;b.j=a.j;b.Ka=a.Ka;b.J=a.J;return b}Ak.prototype.modify=function(){return this.la?Gk(this):this};
function Bk(a){var b=a;do{if(b.la)break;b.la=!0;b=b.parent}while(b);return a}Ak.prototype.clone=function(){for(var a=Gk(this),b=a,c;c=b.parent;)c=Gk(c),b=b.parent=c;return a};function Hk(a){return{node:a.N,Za:a.Za,oa:a.oa,za:a.za,ua:a.ua?Hk(a.ua):null,F:a.F,Ka:a.Ka}}function Ik(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(Hk(b)),b=b.parent;while(b);b=a.Ha?Jk(a.Ha,a.ja,-1):a.ja;return{ma:c,ja:b,M:a.M,Ha:a.Ha}}function Kk(a){for(a=a.parent;a;){if(a.Qc)return!0;a=a.parent}return!1}
function Lk(a,b){for(var c=a;c;)c.ta||b(c),c=c.parent}function Mk(a,b){return a.F===b&&!!a.parent&&a.parent.F===b}function Nk(a){this.f=a;this.b=null}Nk.prototype.clone=function(){var a=new Nk(this.f);if(this.b){a.b=[];for(var b=0;b<this.b.length;++b)a.b[b]=this.b[b]}return a};function Ok(a,b){if(!b)return!1;if(a===b)return!0;if(!vk(a.f,b.f))return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++)if(!vk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}
function Pk(a,b){this.f=a;this.b=b}Pk.prototype.clone=function(){return new Pk(this.f.clone(),this.b)};function Qk(){this.b=[];this.g="any";this.f=null}Qk.prototype.clone=function(){for(var a=new Qk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function Rk(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!Ok(d.f,e.f))return!1}return!0}
function Sk(){this.page=0;this.f={};this.b={};this.g=0}Sk.prototype.clone=function(){var a=new Sk;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function Tk(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!Rk(a.b[e],b.b[e]))return!1}return!0}
function Uk(a){this.element=a;this.hb=this.gb=this.height=this.width=this.H=this.D=this.I=this.C=this.Z=this.borderTop=this.ha=this.borderLeft=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Ia=this.Ac=null;this.pa=this.Cb=this.Sa=this.Db=this.xa=0;this.u=!1}function Vk(a){return a.marginTop+a.borderTop+a.D}function Wk(a){return a.marginBottom+a.Z+a.H}function Xk(a){return a.marginLeft+a.borderLeft+a.C}function Yk(a){return a.marginRight+a.ha+a.I}
function Zk(a){return a.u?-1:1}function $k(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.borderLeft=b.borderLeft;a.ha=b.ha;a.borderTop=b.borderTop;a.Z=b.Z;a.C=b.C;a.I=b.I;a.D=b.D;a.H=b.H;a.width=b.width;a.height=b.height;a.gb=b.gb;a.hb=b.hb;a.Ia=b.Ia;a.Ac=b.Ac;a.xa=b.xa;a.Db=b.Db;a.Sa=b.Sa;a.u=b.u}
function al(a,b,c){a.top=b;a.height=c;w(a.element,"top",b+"px");w(a.element,"height",c+"px")}function bl(a,b,c){a.left=b;a.width=c;w(a.element,"left",b+"px");w(a.element,"width",c+"px")}function cl(a,b,c){a.u?bl(a,b+c*Zk(a),c):al(a,b,c)}function dl(a,b,c){a.u?al(a,b,c):bl(a,b,c)}function el(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}
function fl(a){var b=a.gb+a.left+a.marginLeft+a.borderLeft,c=a.hb+a.top+a.marginTop+a.borderTop;return new Wf(b,c,b+(a.C+a.width+a.I),c+(a.D+a.height+a.H))}Uk.prototype.Xd=function(a,b){var c=gl(this);return xg(a,c.U,c.S,c.V-c.U,c.P-c.S,b)};function gl(a){var b=a.gb+a.left,c=a.hb+a.top;return new Wf(b,c,b+(Xk(a)+a.width+Yk(a)),c+(Vk(a)+a.height+Wk(a)))}function hl(a,b,c){this.b=a;this.f=b;this.g=c}t(hl,pc);hl.prototype.gd=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Hc));return null};
hl.prototype.Mc=function(a){if(this.g.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};hl.prototype.zb=function(a){this.Zb(a.values);return null};hl.prototype.Ic=function(a){a=a.ra().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function il(a){return!!a&&a!==md&&a!==F&&a!==dd};function jl(a,b,c){this.g=a;this.f=b;this.b=c}function kl(){this.map=[]}function ll(a){return a.map.length?a.map[a.map.length-1].b:0}function ml(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new jl(b,b,d))}else a.map.push(new jl(b,b,b))}function nl(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new jl(b,0,0))}function ol(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function pl(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function ql(a,b,c,d,e,f,g,h){this.D=a;this.style=b;this.offset=c;this.G=d;this.j=e;this.b=e.b;this.Wa=f;this.bb=g;this.H=h;this.l=this.w=null;this.C={};this.g=this.f=this.h=null;rl(this)&&(b=b._pseudos)&&b.before&&(a=new ql(a,b.before,c,!1,e,sl(this),g,!0),c=tl(a,"content"),il(c)&&(this.h=a,this.g=a.g));this.g=ul(vl(this,"before"),this.g);this.bb&&wl[this.g]&&(e.g=ul(e.g,this.g))}
function tl(a,b,c){if(!(b in a.C)){var d=a.style[b];a.C[b]=d?d.evaluate(a.D,b):c||null}return a.C[b]}function xl(a){return tl(a,"display",ed)}function sl(a){if(null===a.w){var b=xl(a),c=tl(a,"position"),d=tl(a,"float");a.w=yl(b,c,d,a.G).display===Mc}return a.w}function rl(a){null===a.l&&(a.l=a.H&&xl(a)!==F);return a.l}function vl(a,b){var c=null;if(sl(a)){var d=tl(a,"break-"+b);d&&(c=d.toString())}return c}function zl(a){this.g=a;this.b=[];this.bb=this.Wa=!0;this.f=[]}
function Al(a){return a.b[a.b.length-1]}function Bl(a){return a.b.every(function(a){return xl(a)!==F})}zl.prototype.push=function(a,b,c,d){var e=Al(this);d&&e&&d.b!==e.b&&this.f.push({Wa:this.Wa,bb:this.bb});e=d||e.j;d=this.bb||!!d;var f=Bl(this);a=new ql(this.g,a,b,c,e,d||this.Wa,d,f);this.b.push(a);this.Wa=rl(a)?!a.h&&sl(a):this.Wa;this.bb=rl(a)?!a.h&&d:this.bb;return a};
zl.prototype.pop=function(a){var b=this.b.pop(),c=this.Wa,d=this.bb;if(rl(b)){var e=b.style._pseudos;e&&e.after&&(a=new ql(b.D,e.after,a,!1,b.j,c,d,!0),c=tl(a,"content"),il(c)&&(b.f=a))}this.bb&&b.f&&(a=vl(b.f,"before"),b.j.g=ul(b.j.g,a));if(a=Al(this))a.b===b.b?rl(b)&&(this.Wa=this.bb=!1):(a=this.f.pop(),this.Wa=a.Wa,this.bb=a.bb);return b};
function Cl(a,b){if(!b.Wa)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Wa||d.G)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function Dl(a,b,c,d,e,f,g,h){this.aa=a;this.root=a.root;this.Sa=c;this.h=d;this.C=f;this.f=this.root;this.T={};this.W={};this.G={};this.I=[];this.D=this.O=this.J=null;this.Z=new Wi(b,d,g,h);this.g=new kl;this.w=!0;this.la=[];this.Ra=e;this.Ia=this.va=!1;this.b=a=Ij(a,this.root);this.ha={};this.j=new zl(d);ml(this.g,a);d=El(this,this.root);hj(this.Z,this.root,d,a);Fl(this,d,!1);this.H=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H=
!1}this.la.push(!0);this.W={};this.W["e"+a]=d;this.b++;Gl(this,-1)}function Hl(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function Il(a,b,c){for(var d in c){var e=b[d];e?(a.T[d]=e,delete b[d]):(e=c[d])&&(a.T[d]=new V(e,33554432))}}var Jl=["column-count","column-width"];
function Fl(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.T[a]=b[a])},a);if(!a.va){var d=Hl(a,b,a.C.j,"background-color")?b["background-color"].evaluate(a.h):null,e=Hl(a,b,a.C.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==dd||e&&e!==dd)Il(a,b,a.C.j),a.va=!0}if(!a.Ia)for(d=0;d<Jl.length;d++)if(Hl(a,b,a.C.w,Jl[d])){Il(a,b,a.C.w);a.Ia=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.L;switch(d.ga){case "em":case "rem":c*=a.h.w;break;case "ex":case "rex":c*=
a.h.w*yb.ex/yb.em;break;case "%":c*=a.h.w/100;break;default:(d=yb[d.ga])&&(c*=d)}a.h.pa=c}}function Kl(a){for(var b=0;!a.H&&(b+=5E3,Ll(a,b,0)!=Number.POSITIVE_INFINITY););return a.T}function El(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.aa.url,e=new uj(a.Sa,a.C),c=new Ze(c,e);try{Nf(new Ef(tf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.ab}}return{}}
function Gl(a,b){if(!(b>=a.b)){var c=a.h,d=Ij(a.aa,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=Ml(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=Lj(a.aa,b);e=Jj(a.aa,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=Ij(a.aa,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),Ml(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function Nl(a,b){a.J=b;for(var c=0;c<a.I.length;c++)Ol(a.J,a.I[c],a.G[a.I[c].b])}
function Ml(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new tg;try{h.ba(l);p=l.b;break a}catch(q){v.b(q,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=vg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=vg(c.evaluate(a.h,"flow-priority"),0));c=a.ha[e]||null;p=a.G[b];p||(p=Al(a.j),p=a.G[b]=new ok(p?p.j.b:null));d=new pk(b,d,e,f,g,h,l,k,c);
a.I.push(d);a.O==b&&(a.O=null);a.J&&Ol(a.J,d,p);return d}function Pl(a,b,c,d){wl[b]&&(d=a.G[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.ha[c]=ul(a.ha[c],b)}
function Ll(a,b,c){var d=-1;if(b<=a.b&&(d=ol(a.g,b),d+=c,d<ll(a.g)))return pl(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.Z,g=a.f;if(f.Db.pop()!==g)throw Error("Invalid call to popElement");f.vc.pop();f.pa.pop();f.uc.pop();f.tc.pop();f.pop();fj(f);a.w=a.la.pop();g=a.j.pop(a.b);f=null;g.f&&(f=vl(g.f,"before"),Pl(a,f,g.f.Wa?Cl(a.j,g):g.f.offset,g.b),f=vl(g.f,"after"));f=ul(f,vl(g,"after"));Pl(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=ol(a.g,b),d+=c),d<=ll(a.g))?pl(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=Al(f);(f.Wa||f.bb)&&rl(h)&&(h=tl(h,"white-space",md).toString(),nk(g,mk(h))||(f.Wa=!1,f.bb=!1));a.w?ml(a.g,a.b):nl(a.g,a.b)}else{g=a.f;f=El(a,g);a.la.push(a.w);hj(a.Z,g,f,a.b);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.D&&(a.D=null);a.H||"body"!=g.localName||
g.parentNode!=a.root||(Fl(a,f,!0),a.H=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=Ml(a,h,f,g,a.b);a.w=!!a.Ra[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=Cl(a.j,g);Pl(a,g.g,h,g.b);g.h&&(l=vl(g.h,"after"),Pl(a,l,g.h.Wa?h:g.offset,g.b));a.w&&xl(g)===F&&(a.w=!1);if(Ij(a.aa,a.f)!=a.b)throw Error("Inconsistent offset");a.W["e"+a.b]=f;a.b++;a.w?ml(a.g,a.b):nl(a.g,a.b);if(b<a.b&&(0>d&&(d=ol(a.g,b),d+=c),d<=ll(a.g)))return pl(a.g,d)}}}
Dl.prototype.l=function(a,b){var c=Ij(this.aa,a),d="e"+c;b&&(c=Jj(this.aa,a,0,!0));this.b<=c&&Ll(this,c,0);return this.W[d]};Dl.prototype.pa=function(){};var Ql={"font-style":md,"font-variant":md,"font-weight":md},Rl="OTTO"+(new Date).valueOf(),Sl=1;function Tl(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in Ql)c[e]||(c[e]=Ql[e]);return c}function Ul(a){a=this.mc=a;var b=new Ca,c;for(c in Ql)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.mc.src?this.mc.src.toString():null;this.g=[];this.h=[];this.b=(c=this.mc["font-family"])?c.stringValue():null}
function Vl(a,b,c){var d=new Ca;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in Ql)d.append(e),d.append(": "),a.mc[e].Ta(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function Wl(a){this.f=a;this.b={}}
function Xl(a,b){if(b instanceof sc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new sc(d)}return(c=a.b[b.stringValue()])?new sc([C(c),b]):b}function Yl(a,b){this.b=a;this.body=b;this.f={};this.g=0}function Zl(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function $l(a,b,c,d){var e=K("initFont"),f=b.src,g={},h;for(h in Ql)g[h]=b.mc[h];d=Zl(a,b,d);g["font-family"]=C(d);var l=new Ul(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=Rl+Sl++;b.textContent=Vl(l,"",cf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in Ql)w(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,r=g.bottom-g.top;
b.textContent=Vl(l,f,c);v.g("Starting to load font:",f);var z=!1;me(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||r!=b?(z=!0,L(!1)):(new Date).valueOf()>m?L(!1):le(10)}).then(function(){z?v.g("Loaded font:",f):v.b("Failed to load font:",f);a.body.removeChild(k);N(e,l)});return e.result()}
function am(a,b,c){var d=b.src,e=a.f[d];e?qe(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new pe(function(){var e=K("loadFont"),g=c.f?c.f(d):null;g?bf(d,"blob").then(function(d){d.Bd?g(d.Bd).then(function(d){$l(a,b,d,c).Ba(e)}):N(e,null)}):$l(a,b,null,c).Ba(e);return e.result()},"loadFont "+d),a.f[d]=e,e.start());return e}
function bm(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(am(a,f,c)):v.b("E_FONT_FACE_INVALID")}return re(d)};Pd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Kc?pd:c,important:a.important};default:return a}});var wl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},cm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function ul(a,b){if(a)if(b){var c=!!wl[a],d=!!wl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:cm[b]?b:cm[a]?a:b}else return a;else return b}function dm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function em(){}em.prototype.sf=function(a){return{A:a,nd:!1,Eb:!1}};em.prototype.Ff=function(){};em.prototype.hd=function(){};em.prototype.$b=function(){};function fm(a,b){this.b=a;this.f=b}
function gm(a,b){var c=a.b,d=c.sf(b),e=K("LayoutIterator");ne(function(a){for(var b;d.A;){b=d.A.B?1!==d.A.B.nodeType?nk(d.A.B,d.A.ac)?void 0:d.A.M?void 0:c.Ff(d):d.A.ta?void 0:d.A.M?c.$b(d):c.hd(d):void 0;b=(b&&b.Pa()?b:L(!0)).fa(function(){return d.Eb?L(null):hm(this.f,d.A,d.nd)}.bind(this));if(b.Pa()){b.then(function(b){d.Eb?P(a):(d.A=b,O(a))});return}if(d.Eb){P(a);return}d.A=b.get()}P(a)}.bind(a)).then(function(){N(e,d.A)});return e.result()}function im(a){this.Qb=a}t(im,em);n=im.prototype;
n.Gf=function(){};n.gf=function(){};n.sf=function(a){return{A:a,nd:!!this.Qb&&a.M,Eb:!1,Qb:this.Qb,zc:null,ge:!1,xf:[],Cc:null}};n.Ff=function(a){a.ge=!1};n.hd=function(a){a.xf.push(Bk(a.A));a.zc=ul(a.zc,a.A.g);a.ge=!0;return this.Gf(a)};n.$b=function(a){var b;a.ge?(b=(b=void 0,L(!0)),b=b.fa(function(){a.Eb||(a.xf=[],a.Qb=!1,a.nd=!1,a.zc=null);return L(!0)})):b=(b=this.gf(a))&&b.Pa()?b:L(!0);return b.fa(function(){a.Eb||(a.ge=!1,a.Cc=Bk(a.A),a.zc=ul(a.zc,a.A.G));return L(!0)})};
function jm(a,b,c){this.Re=[];this.b=Object.create(a);this.b.element=b;this.b.j=a.j.clone();this.b.h=!1;this.b.xe=c.F;this.b.Bb=a;a=km(this.b,c);this.b.O-=a;var d=this;this.b.tb=function(a){return lm.prototype.tb.call(this,a).fa(function(a){d.Re.push(Bk(a));return L(a)})}}function mm(a,b){return nm(a.b,b,!0)}jm.prototype.Ob=function(a){var b=this.b.Ob();if(a){a=Bk(this.Re[0]);var c=new om(a,null,a.b,0);c.f(this.b,0);if(!b.A)return{Fb:c,A:a}}return b};
jm.prototype.Ea=function(a,b,c){return this.b.Ea(a,b,c)};function pm(){this.H=this.C=null}function qm(a,b,c){a.I(b,c);return rm(a,b,c)}function rm(a,b,c){var d=K("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.l(b,c);var e=a.j(b);e.b(b,c).then(function(a){var f=e.f(a,c);(f=e.g(a,this.h,c,f))?N(d,a):(this.g(this.h),this.f(b,c),rm(this,this.h,c).Ba(d))}.bind(a));return d.result()}pm.prototype.I=function(){};
pm.prototype.g=function(a){a=a.B||a.parent.B;for(var b;b=a.lastChild;)a.removeChild(b);for(;b=a.nextSibling;)b.parentNode.removeChild(b)};pm.prototype.l=function(a,b){this.h=Bk(a);this.C=[].concat(b.G);this.O=[].concat(b.l);a.F&&(this.H=a.F.ve())};pm.prototype.f=function(a,b){b.G=this.C;b.l=this.O;a.F&&a.F.ue(this.H)};function sm(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function tm(a){var b=um,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.ca:b.da)+"(-?)"),b:"$1"+(a?b.da:b.ca)+"$2"}})})});return c}
var um={"horizontal-tb":{ltr:[{ca:"inline-start",da:"left"},{ca:"inline-end",da:"right"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}],rtl:[{ca:"inline-start",da:"right"},{ca:"inline-end",da:"left"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}]},"vertical-rl":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"right"},{ca:"block-end",
da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",da:"top"},{ca:"block-start",da:"right"},{ca:"block-end",da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]},"vertical-lr":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",
da:"top"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]}},vm=tm(!0),wm=tm(!1);var Ek="inline";function xm(a){switch(a){case "inline":return Ek;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function ym(a){switch(a){case Ek:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function zm(a,b,c,d){this.f=a;this.b=b;this.ya=c;this.g=d;this.id=this.order=null}
zm.prototype.Fa=function(){if(null===this.order)throw Error("The page float is not yet added");return this.order};function Am(a){if(!a.id)throw Error("The page float is not yet added");return a.id}zm.prototype.Ge=function(){return!1};function Bm(){this.b=[];this.f=0}Bm.prototype.Me=function(){return this.f++};
Bm.prototype.Od=function(a){if(0<=this.b.findIndex(function(b){return vk(b.f,a.f)}))throw Error("A page float with the same source node is already registered");var b=a.order=this.Me();a.id="pf"+b;this.b.push(a)};Bm.prototype.Ee=function(a){var b=this.b.findIndex(function(b){return vk(b.f,a)});return 0<=b?this.b[b]:null};function Cm(a,b,c,d){this.f=a;this.ya=b;this.Lb=c;this.dc=d}function Dm(a,b){return a.Lb.some(function(a){return a.qa===b})}
function Em(a,b){for(var c=a.Lb.length-1;0<=c;c--){var d=a.Lb[c].qa;if(!Fm(b,Am(d)))return d}return null}Cm.prototype.Xd=function(){return this.dc.Xd(null,null)};Cm.prototype.Fa=function(){var a=this.Lb.map(function(a){return a.qa});return Math.min.apply(null,a.map(function(a){return a.Fa()}))};Cm.prototype.b=function(a){return this.Fa()<a.Fa()};function Gm(a,b){this.qa=a;this.b=b}
function Hm(a,b,c,d,e,f,g){(this.parent=a)&&a.j.push(this);this.j=[];this.f=b;this.K=c;this.h=d;this.J=e;this.H=f||a&&a.H||cd;this.G=g||a&&a.G||ld;this.Tc=!1;this.C=a?a.C:new Bm;this.D=[];this.b=[];this.l=[];this.w={};this.g=[];a:{b=this;for(a=this.parent;a;){if(b=Im(a,b,this.f,this.h,this.J)){a=b;break a}b=a;a=a.parent}a=null}this.I=a?[].concat(a.g):[]}function Jm(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function Im(a,b,c,d,e){b=a.j.indexOf(b);0>b&&(b=a.j.length);for(--b;0<=b;b--){var f=a.j[b];if(f.f===c&&f.h===d&&vk(f.J,e)||(f=Im(f,null,c,d,e)))return f}return null}function Km(a,b){return b&&b!==a.f?Km(Jm(a,b),b):a.K}function Lm(a,b){a.K=b;Mm(a)}Hm.prototype.Od=function(a){this.C.Od(a)};function Nm(a,b){return b===a.f?a:Nm(Jm(a,b),b)}Hm.prototype.Ee=function(a){return this.C.Ee(a)};function Om(a,b){var c=Am(b),d=b.b;d===a.f?0>a.D.indexOf(c)&&a.D.push(c):Om(Jm(a,d),b)}
function Pm(a,b){var c=Am(b),d=b.b;return d===a.f?0<=a.D.indexOf(c):Pm(Jm(a,d),b)}function Qm(a,b,c){var d=b.f;d!==a.f?Qm(Jm(a,d),b,c):0>a.b.indexOf(b)&&(a.b.push(b),a.b.sort(function(a,b){return a.Fa()-b.Fa()}));c||Rm(a)}function Sm(a,b,c){var d=b.f;d!==a.f?Sm(Jm(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.dc&&b.dc.element)&&b.parentNode&&b.parentNode.removeChild(b),c||Rm(a)))}
function Tm(a,b){if(b.b!==a.f)return Tm(Jm(a,b.b),b);var c=a.b.findIndex(function(a){return Dm(a,b)});return 0<=c?a.b[c]:null}function Um(a){return 0<a.b.length?!0:a.parent?Um(a.parent):!1}function Vm(a,b,c){b.b===a.f?a.w[Am(b)]=c:Vm(Jm(a,b.b),b,c)}function Fm(a,b){if(Wm(a).some(function(a){return Am(a.qa)===b}))return!0;var c=a.w[b];return c?a.K&&a.K.element?a.K.element.contains(c):!1:!1}
function Xm(a,b){var c=b.qa;if(c.b===a.f){var d=a.g.findIndex(function(a){return a.qa===c});0<=d?a.g.splice(d,1,b):a.g.push(b)}else Xm(Jm(a,c.b),b)}function Ym(a,b,c){if(!c&&b.b!==a.f)return Ym(Jm(a,b.b),b,!1);var d=b.Fa();return a.g.some(function(a){return a.qa.Fa()<d&&!b.Ge(a.qa)})?!0:a.parent?Ym(a.parent,b,!0):!1}function Wm(a,b){b=b||a.h;var c=a.I.filter(function(a){return!b||a.qa.g===b});a.parent&&(c=Wm(a.parent,b).concat(c));return c.sort(function(a,b){return a.qa.Fa()-b.qa.Fa()})}
function Zm(a,b){b=b||a.h;var c=a.g.filter(function(a){return!b||a.qa.g===b});return a.parent?Zm(a.parent,b).concat(c):c}function $m(a){for(var b=[],c=[],d=a.j.length-1;0<=d;d--){var e=a.j[d];0<=c.indexOf(e.h)||(c.push(e.h),b=b.concat(e.g.map(function(a){return a.qa})),b=b.concat($m(e)))}return b}
function an(a){var b=$m(a),c=a.b.reduce(function(a,b){return a.concat(b.Lb.map(function(a){return a.qa}))},[]);c.sort(function(a,b){return b.Fa()-a.Fa()});for(var d=0;d<c.length;d++){var e=c[d],f=e.Fa();if(b.some(function(a){return!e.Ge(a)&&f>a.Fa()}))return Om(a,e),b=Tm(a,e),Sm(a,b),!0}return!1}
function bn(a){if(!an(a)){for(var b=a.b.length-1;0<=b;b--){var c=a.b[b],d=Em(c,a);if(d){Sm(a,c);Om(a,d);cn(a,c.ya);return}}for(b=a.g.length-1;0<=b;b--)Fm(a,Am(a.g[b].qa))||a.g.splice(b,1);a.I.forEach(function(a){0<=this.g.findIndex(function(b){return b?a===b?!0:a.qa===b.qa&&vk(a.b,b.b):!1})||this.b.some(function(b){return Dm(b,a.qa)})||this.g.push(a)},a)}}function dn(a,b){return!!a.K&&!!b.K&&a.K.element===b.K.element}
function Rm(a){a.K&&(a.j.forEach(function(a){dn(this,a)&&a.b.forEach(function(a){(a=a.dc.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),el(a.K));a.j.splice(0);Object.keys(a.w).forEach(function(a){delete this.w[a]},a);a.Tc=!0}function en(a){return a.Tc||!!a.parent&&en(a.parent)}function fn(a,b){return sm(b,a.H.toString(),a.G.toString()||null,wm)}function cn(a,b){var c=fn(a,b);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];fn(a,e.ya)===c?Sm(a,e):d++}}
function gn(a,b){var c=b.b;if(c!==a.f)gn(Jm(a,c),b);else if(c=fn(a,b.ya),"block-end"===c||"snap-block"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d],f=fn(a,e.ya);(f===c||"snap-block"===c&&"block-end"===f)&&e.b(b)?(a.l.push(e),a.b.splice(d,1)):d++}}function hn(a,b){b!==a.f?hn(Jm(a,b),b):(a.l.forEach(function(a){Qm(this,a,!0)},a),a.l.splice(0))}function jn(a,b){b!==a.f?jn(Jm(a,b),b):a.l.splice(0)}
function kn(a,b){return b===a.f?a.l.concat().sort(function(a,b){return b.Fa()-a.Fa()}):kn(Jm(a,b),b)}function ln(a,b,c){var d=fn(a,b);b=sm(b,a.H.toString(),a.G.toString()||null,vm);d=mn(a,d,c);if(a.parent&&a.parent.K)switch(a=ln(a.parent,b,c),b){case "top":return Math.max(d,a);case "left":return Math.max(d,a);case "bottom":return Math.min(d,a);case "right":return Math.min(d,a);default:fa("Should be unreachable")}return d}
function mn(a,b,c){var d=a.K.gb,e=a.K.hb,f=fl(a.K),f={top:f.S-e,left:f.U-d,bottom:f.P-e,right:f.V-d},g=a.b;0<g.length&&(f=g.reduce(function(a,b){if(c&&!c(b,this))return a;var d=fn(this,b.ya),e=b.dc,f=a.top,g=a.left,h=a.bottom,l=a.right;switch(d){case "inline-start":e.u?f=Math.max(f,e.top+e.height):g=Math.max(g,e.left+e.width);break;case "block-start":e.u?l=Math.min(l,e.left):f=Math.max(f,e.top+e.height);break;case "inline-end":e.u?h=Math.min(h,e.top):l=Math.min(l,e.left);break;case "block-end":e.u?
g=Math.max(g,e.left+e.width):h=Math.min(h,e.top);break;default:throw Error("Unknown logical float side: "+d);}return{top:f,left:g,bottom:h,right:l}}.bind(a),f));f.left+=d;f.right+=d;f.top+=e;f.bottom+=e;switch(b){case "block-start":return a.K.u?f.right:f.top;case "block-end":return a.K.u?f.left:f.bottom;case "inline-start":return a.K.u?f.top:f.left;case "inline-end":return a.K.u?f.bottom:f.right;default:throw Error("Unknown logical side: "+b);}}
function nn(a,b,c,d,e,f,g){function h(a,c){var d=a(b.va,c);return d?(b.u&&(d=new Wf(-d.P,d.U,-d.S,d.V)),k=b.u?Math.min(k,d.V):Math.max(k,d.S),m=b.u?Math.max(m,d.U):Math.min(m,d.P),!0):g}if(c!==a.f)return nn(Jm(a,c),b,c,d,e,f,g);var l=fn(a,d),k=ln(a,"block-start"),m=ln(a,"block-end");c=ln(a,"inline-start");var p=ln(a,"inline-end"),q=b.u?b.gb:b.hb,r=b.u?b.hb:b.gb,k=b.u?Math.min(k,b.left+Xk(b)+b.width+Yk(b)+q):Math.max(k,b.top+q),m=b.u?Math.max(m,b.left+q):Math.min(m,b.top+Vk(b)+b.height+Wk(b)+q),z;
if(f){a=b.u?mg(new Wf(m,c,k,p)):new Wf(c,k,p,m);if(("block-start"===l||"snap-block"===l||"inline-start"===l)&&!h(rg,a)||("block-end"===l||"snap-block"===l||"inline-start"===l)&&!h(sg,a))return null;z=(m-k)*Zk(b);f=z-(b.u?Yk(b):Vk(b))-(b.u?Xk(b):Wk(b));e=p-c;a=e-(b.u?Vk(b):Xk(b))-(b.u?Wk(b):Yk(b));if(!g&&(0>=f||0>=a))return null}else{f=b.xa;z=f+(b.u?Yk(b):Vk(b))+(b.u?Xk(b):Wk(b));var u=(m-k)*Zk(b);"snap-block"===l&&(null===e?l="block-start":(l=fl(a.K),l=Zk(a.K)*(e-(a.K.u?l.V:l.S))<=Zk(a.K)*((a.K.u?
l.U:l.P)-e-z)?"block-start":"block-end"));if(!g&&u<z)return null;a="inline-start"===l||"inline-end"===l?on(b.f,b.element,[pn])[pn]:b.uc?qn(b):b.u?b.height:b.width;e=a+(b.u?Vk(b):Xk(b))+(b.u?Wk(b):Yk(b));if(!g&&p-c<e)return null}k-=q;m-=q;c-=r;p-=r;switch(l){case "inline-start":case "block-start":case "snap-block":dl(b,c,a);cl(b,k,f);break;case "inline-end":case "block-end":dl(b,p-e,a);cl(b,m-z*Zk(b),f);break;default:throw Error("unknown float direction: "+d);}return l}
function rn(a){var b=a.b.map(function(a){return a.Xd()});return a.parent?rn(a.parent).concat(b):b}function Mm(a){var b=a.K.element&&a.K.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.dc.element)})}function sn(a){var b=Km(a).u;return a.b.reduce(function(a,d){var c=gl(d.dc);return b?Math.min(a,c.U):Math.max(a,c.P)},b?Infinity:0)}
function tn(a,b){function c(a){return function(b){return Fm(a,Am(b.qa))}}function d(a,b){return a.Lb.some(c(b))}for(var e=fl(b),e=b.u?e.U:e.P,f=a;f;){if(f.g.some(c(f)))return e;f=f.parent}f=ln(a,"block-start",d);return ln(a,"block-end",d)*Zk(b)<e*Zk(b)?e:f}var un=[];function vn(a){for(var b=un.length-1;0<=b;b--){var c=un[b];if(c.Ze(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}
function wn(a){for(var b=un.length-1;0<=b;b--){var c=un[b];if(c.Ye(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function xn(){}n=xn.prototype;n.Ze=function(a){return ym(a.H)};n.Ye=function(){return!0};n.df=function(a,b,c){var d=a.H,e=a.ya,f=Ik(a);return yn(c,d,a.W,a).fa(function(a){d=a;a=new zm(f,d,e,b.h);b.Od(a);return L(a)})};n.ef=function(a,b,c){return new Cm(a[0].qa.b,b,a,c)};n.Ue=function(a,b){return Tm(b,a)};n.Xe=function(){};un.push(new xn);var zn={img:!0,svg:!0,audio:!0,video:!0};
function An(a,b,c,d){var e=a.B;if(!e)return NaN;if(1==e.nodeType){if(a.M){var f=lk(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.M&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=Bn(b,g);if(c=d){c=document.body;if(null==Va){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";w(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Va=10>h.right-h.left;c.removeChild(g)}c=Va}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=Bn(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(v.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}function Cn(a){for(var b=Qd("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.te());}
function Dn(){}Dn.prototype.g=function(){return null};function En(a,b){return{current:b.reduce(function(b,d){return b+d.b(a)},0),ee:b.reduce(function(b,d){return b+d.G(a)},0)}}function Fn(a,b){this.h=a;this.w=b;this.j=!1;this.l=null}t(Fn,Dn);Fn.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=Gn(a,this,0<b),this.j=!0);return this.l};Fn.prototype.b=function(){return this.w};Fn.prototype.g=function(){return this.j?this.l:this.h[this.h.length-1]};
function om(a,b,c,d){this.position=a;this.D=b;this.w=this.C=c;this.xa=d;this.h=!1;this.l=0}t(om,Dn);om.prototype.f=function(a,b){this.h||(this.l=An(this.position,a.f,0,a.u),this.h=!0);var c=this.l,d=En(this.g(),Hn(a));this.w=In(a,c+(a.u?-1:1)*d.ee);this.C=this.position.b=In(a,c+(a.u?-1:1)*d.current);b<this.b()?c=null:(a.xa=this.xa+Jn(a,this),c=this.position);return c};
om.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a=this.g())&&a.parent){var b=Kn(a.parent);a=b?(b=b.b)?a&&b.g===a.N:!1:!1}else a=!1;a=a&&!this.w;return(cm[this.D]?1:0)+(this.C&&!a?3:0)+(this.position.parent?this.position.parent.l:0)};om.prototype.g=function(){return this.position};
function Ln(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.Ca>=d.Ca?v.b("validateCheckPoints: incorrect boxOffset"):c.N==d.N&&(d.M?c.M&&v.b("validateCheckPoints: duplicate after points"):c.M?v.b("validateCheckPoints: inconsistent after point"):d.Ca-c.Ca!=d.ja-c.ja&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function Mn(a){this.parent=a}Mn.prototype.te=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};
Mn.prototype.Ie=function(a,b){return b};Mn.prototype.ve=function(){};Mn.prototype.ue=function(){};function lm(a,b,c,d,e){Uk.call(this,a);this.j=b;this.f=c;this.sb=d;this.Sf=a.ownerDocument;this.g=e;Lm(e,this);this.xe=null;this.ff=this.pf=!1;this.O=this.J=this.w=this.la=this.W=0;this.va=this.lf=this.hf=null;this.Ab=!1;this.b=this.G=null;this.Ae=!0;this.tc=this.Nc=this.vc=0;this.h=!0;this.Ra=null;this.l=[];this.T=this.Bb=null}t(lm,Uk);function Nn(a,b){return!!b.ya&&(!a.pf||!!b.parent)}
function In(a,b){return a.u?b<a.O:b>a.O}lm.prototype.tb=function(a){var b=this,c=K("openAllViews"),d=a.ma;On(b.j,b.element,b.ff);var e=d.length-1,f=null;me(function(){for(;0<=e;){f=zk(d[e],f);e!==d.length-1||f.F||(f.F=b.xe);if(!e){var c=f,h;h=a;h=h.Ha?Jk(h.Ha,h.ja,1):h.ja;c.ja=h;f.M=a.M;f.Ha=a.Ha;if(f.M)break}c=Pn(b.j,f,!e&&!f.ja);e--;if(c.Pa())return c}return L(!1)}).then(function(){N(c,f)});return c.result()};var Qn=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Rn(a,b){if(b.f&&b.ta&&!b.M&&!b.f.count&&1!=b.B.nodeType){var c=b.B.textContent.match(Qn);return Sn(a.j,b,c[0].length)}return L(b)}
function Tn(a,b,c){var d=K("buildViewToNextBlockEdge");ne(function(d){b.B&&!Un(b)&&c.push(Bk(b));Rn(a,b).then(function(e){e!==b&&(b=e,Un(b)||c.push(Bk(b)));Vn(a,b).then(function(c){if(b=c){if(!a.sb.bc(b)&&(b=b.modify(),b.b=!0,a.h)){P(d);return}Nn(a,b)&&!a.u?Wn(a,b).then(function(c){b=c;en(a.g)&&(b=null);b?O(d):P(d)}):b.ta?O(d):P(d)}else P(d)})})}).then(function(){N(d,b)});return d.result()}function Vn(a,b,c){b=hm(a.j,b,c);return Xn(b,a)}
function Yn(a,b){if(!b.B)return L(b);var c=b.N,d=K("buildDeepElementView");ne(function(d){Rn(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.N!=c;)f=f.parent;if(!f){b=e;P(d);return}}Vn(a,e).then(function(e){(b=e)&&b.N!=c?a.sb.bc(b)?O(d):(b=b.modify(),b.b=!0,a.h?P(d):O(d)):P(d)})})}).then(function(){N(d,b)});return d.result()}
function Zn(a,b,c,d,e){var f=a.Sf.createElement("div");a.u?(e>=a.height&&(e-=.1),w(f,"height",d+"px"),w(f,"width",e+"px")):(d>=a.width&&(d-=.1),w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.element.insertBefore(f,b);return f}function $n(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function ao(a){for(var b=a.element.firstChild,c=a.va,d=a.u?a.u?a.W:a.w:a.u?a.J:a.W,e=a.u?a.u?a.la:a.J:a.u?a.w:a.la,f=0;f<c.length;f++){var g=c[f],h=g.P-g.S;g.left=Zn(a,b,"left",g.U-d,h);g.right=Zn(a,b,"right",e-g.V,h)}}function bo(a,b,c,d,e){var f;if(b&&co(b.B))return NaN;if(b&&b.M&&!b.ta&&(f=An(b,a.f,0,a.u),!isNaN(f)))return f;b=c[d];for(e-=b.Ca;;){f=An(b,a.f,e,a.u);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.w;b=c[d];1!=b.B.nodeType&&(e=b.B.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function eo(a,b){var c=fo(a.f,b),d=new Yf;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function go(a,b){var c=fo(a.f,b),d=new Yf;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function ho(a,b){var c=K("layoutFloat"),d=b.B,e=b.ya;w(d,"float","none");w(d,"display","inline-block");w(d,"vertical-align","top");Yn(a,b).then(function(f){for(var g=lk(a.f,d),h=eo(a,d),g=new Wf(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.W,l=a.la,k=b.parent;k&&k.ta;)k=k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.u?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");k.B.appendChild(m);var p=
lk(a.f,m),h=Math.max(a.u?p.top:p.left,h),l=Math.min(a.u?p.bottom:p.right,l);k.B.removeChild(m);m=a.u?g.P-g.S:g.V-g.U;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.B.appendChild(b.B)}m=new Wf(h,Zk(a)*a.w,l,Zk(a)*a.J);h=g;a.u&&(h=mg(g));l=Zk(a);h.S<a.tc*l&&(p=h.P-h.S,h.S=a.tc*l,h.P=h.S+p);a:for(var l=a.va,p=h,q=p.S,r=p.V-p.U,z=p.P-p.S,u=qg(l,q);;){var A=q+z;if(A>m.P)break a;for(var H=m.U,G=m.V,I=u;I<l.length&&l[I].S<A;I++){var J=l[I];J.U>H&&(H=J.U);J.V<G&&(G=J.V)}if(H+r<=G||u>=l.length){"left"==e?
(p.U=H,p.V=H+r):(p.U=G-r,p.V=G);p.P+=q-p.S;p.S=q;break a}q=l[u].P;u++}a.u&&(g=new Wf(-h.P,h.U,-h.S,h.V));a:{m=fo(a.f,d);l=new Yf;if(m){if("border-box"==m.boxSizing){m=eo(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}w(d,"width",g.V-g.U-m.left-m.right+"px");w(d,"height",g.P-g.S-
m.top-m.bottom+"px");w(d,"position","absolute");w(d,"display",b.display);l=null;if(k)if(k.O)l=k;else a:{for(k=k.parent;k;){if(k.O){l=k;break a}k=k.parent}l=null}l?(m=l.B.ownerDocument.createElement("div"),m.style.position="absolute",l.u?m.style.right="0":m.style.left="0",m.style.top="0",l.B.appendChild(m),k=lk(a.f,m),l.B.removeChild(m)):k={left:a.u?a.J:a.W,right:a.u?a.w:a.la,top:a.u?a.W:a.w};(l?l.u:a.u)?w(d,"right",k.right-g.V+a.I+"px"):w(d,"left",g.U-k.left+a.C+"px");w(d,"top",g.S-k.top+a.D+"px");
b.D&&(b.D.parentNode.removeChild(b.D),b.D=null);k=a.u?g.U:g.P;g=a.u?g.V:g.S;if(In(a,k)&&a.G.length)b=b.modify(),b.b=!0,N(c,b);else{$n(a);m=new Wf(a.u?a.J:a.W,a.u?a.W:a.w,a.u?a.w:a.la,a.u?a.la:a.J);a.u&&(m=mg(m));l=a.va;for(h=[new $f(h.S,h.P,h.U,h.V)];0<h.length&&h[0].P<=m.S;)h.shift();if(h.length){h[0].S<m.S&&(h[0].S=m.S);p=l.length?l[l.length-1].P:m.S;p<m.P&&l.push(new $f(p,m.P,m.U,m.V));q=qg(l,h[0].S);for(r=0;r<h.length;r++){z=h[r];if(q==l.length)break;l[q].S<z.S&&(p=l[q],q++,l.splice(q,0,new $f(z.S,
p.P,p.U,p.V)),p.P=z.S);for(;q<l.length&&(p=l[q++],p.P>z.P&&(l.splice(q,0,new $f(z.P,p.P,p.U,p.V)),p.P=z.P),z.U!=z.V&&("left"==e?p.U=Math.min(z.V,m.V):p.V=Math.max(z.U,m.U)),p.P!=z.P););}pg(m,l)}ao(a);"left"==e?a.vc=k:a.Nc=k;a.tc=g;io(a,k);N(c,f)}});return c.result()}
function jo(a,b,c,d,e){var f=a.element.ownerDocument.createElement("div");w(f,"position","absolute");var g=Nm(a.g,b.b),h=new Hm(g,"column",null,a.g.h,b.f,null,null),g=Km(g),f=new ko(c,f,a.j.clone(),a.f,a.sb,h,g);Lm(h,f);var g=b.b,l=a.g;b=Km(l,g);h=f.element;b.element.parentNode.appendChild(h);f.pf=!0;f.gb=b.gb;f.hb=b.hb;f.u=b.u;f.marginLeft=f.marginRight=f.marginTop=f.marginBottom=0;f.borderLeft=f.ha=f.borderTop=f.Z=0;f.C=f.I=f.D=f.H=0;f.Ac=(b.Ac||[]).concat();f.Ae=!Um(l);f.Ia=null;var k=fl(b);bl(f,
k.U-b.gb,k.V-k.U);al(f,k.S-b.hb,k.P-k.S);e.Xe(f,b,a);lo(f);(a=!!nn(l,f,g,c,d,!0,!Um(l)))?($n(f),lo(f)):b.element.parentNode.removeChild(h);return a?f:null}
function mo(a,b,c,d,e,f,g){var h=a.g;b=(g?g.Lb:[]).concat(b);var l=jo(a,b[0].qa,c,f,e),k={kf:l,Oe:null,Cf:null};if(!l)return L(k);var m=K("layoutSinglePageFloatFragment"),p=!1,q=0;ne(function(a){q>=b.length?P(a):nm(l,new Nk(b[q].b),!0).then(function(b){k.Cf=b;!b||d?(q++,O(a)):(p=!0,P(a))})}).then(function(){if(!p){var a=nn(h,l,b[0].qa.b,c,f,!1,d);a?(a=e.ef(b,a,l),Qm(h,a,!0),k.Oe=a):p=!0}N(m,k)});return m.result()}
function no(a,b,c,d,e){function f(a,c){c?Sm(g,c,!0):a&&a.element.parentNode.removeChild(a.element);hn(g,h.b);Xm(g,b)}var g=a.g,h=b.qa;gn(g,h);var l=K("layoutPageFloatInner");mo(a,[b],h.ya,!Um(g),c,d,e).then(function(b){var c=b.kf,d=b.Oe,k=b.Cf;d?oo(a,h.b,[e]).then(function(a){a?(Qm(g,d),jn(g,h.b),k&&Xm(g,new Gm(h,k.f)),N(l,!0)):(f(c,d),N(l,!1))}):(f(c,d),N(l,!1))});return l.result()}
function oo(a,b,c){var d=a.g,e=kn(d,b),f=[],g=[],h=!1,l=K("layoutStashedPageFloats"),k=0;ne(function(b){if(k>=e.length)P(b);else{var d=e[k];if(0<=c.indexOf(d))k++,O(b);else{var l=wn(d.Lb[0].qa);mo(a,d.Lb,d.ya,!1,l,null).then(function(a){var c=a.kf;c&&f.push(c);(a=a.Oe)?(g.push(a),k++,O(b)):(h=!0,P(b))})}}}).then(function(){h?(g.forEach(function(a){Sm(d,a,!0)}),f.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):e.forEach(function(a){(a=a.dc.element)&&a.parentNode&&a.parentNode.removeChild(a)});
N(l,!h)});return l.result()}function po(a,b){var c=b.B.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote"===b.ya&&qo(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.B);c=b.modify();c.M=!0;c.B=d;return c}
function yn(a,b,c,d){var e=K("resolveFloatReferenceFromColumnSpan"),f=a.g,g=Nm(f,"region");Km(f).width<Km(g).width&&"column"===b?c===Lc?Yn(a,Bk(d)).then(function(c){var d=c.B;c=on(a.f,d,[ro])[ro];d=eo(a,d);c=a.u?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?N(e,"region"):N(e,b)}):c===Jc?N(e,"region"):N(e,b):N(e,b);return e.result()}
function so(a,b){var c=a.g,d=vn(b),e=c.Ee(Ik(b));return(e?L(e):d.df(b,c,a)).fa(function(e){var f=wk(b),h=po(a,b),l=d.Ue(e,c),f=new Gm(e,f);if(l&&Dm(l,e))return Vm(c,e,h.B),L(h);if(Pm(c,e)||Ym(c,e))return Xm(c,f),Vm(c,e,h.B),L(h);if(a.T)return L(null);var k=An(h,a.f,0,a.u);return In(a,k)?L(h):no(a,f,d,k,l).fa(function(a){if(a)return L(null);Vm(c,e,h.B);return L(h)})})}
function to(a,b){if(!a.M||a.ta){for(var c=a.B,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.B,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Wa){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Wa=27>g.getBoundingClientRect().right;f.removeChild(h)}Wa?a.u?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.u?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.M||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function uo(a,b,c,d){var e=K("processLineStyling");Ln(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.ag);ne(function(d){if(h){var e=vo(a,f),l=h.count-g;if(e.length<=l)P(d);else{var p=wo(a,f,e[l-1]);p?a.Ea(p,!1,!1).then(function(){g+=l;Sn(a.j,p,0).then(function(e){b=e;to(b,!1);h=b.f;f=[];Tn(a,b,f).then(function(a){c=a;O(d)})})}):P(d)}}else P(d)}).then(function(){Array.prototype.push.apply(d,f);Ln(d);N(e,c)});return e.result()}
function xo(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.M||!f.B||1!=f.B.nodeType)break;f=eo(a,f.B);f=a.u?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function yo(a,b){var c=K("layoutBreakableBlock"),d=[];Tn(a,b,d).then(function(e){var f=d.length-1;if(0>f)N(c,e);else{var f=bo(a,e,d,f,d[f].Ca),g=!1;if(!e||!co(e.B)){var h=En(e,Hn(a)),g=In(a,f+(a.u?-1:1)*h.ee);In(a,f+(a.u?-1:1)*h.current)&&!a.T&&(a.T=e)}e||(f+=xo(a,d));io(a,f);var l;b.f?l=uo(a,b,e,d):l=L(e);l.then(function(b){0<d.length&&(a.G.push(new Fn(d,d[0].l)),g&&(2!=d.length&&0<a.G.length||d[0].N!=d[1].N||!zn[d[0].N.localName])&&b&&(b=b.modify(),b.b=!0));N(c,b)})}});return c.result()}
function wo(a,b,c){Ln(b);for(var d=0,e=b[0].Ca,f=d,g=b.length-1,h=b[g].Ca,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].Ca>l?k=m-1:f=m}k=bo(a,null,b,f,l);if(a.u?k<c:k>c){for(h=l-1;b[f].Ca==l;)f--;g=f}else io(a,k),e=l,d=f}a=b[f];b=a.B;1!=b.nodeType?(zo(a),a.M?a.ja=b.length:(c=e-a.Ca,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.w?"":a.h||a.parent&&a.parent.h||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.w&&Ia(d)&&Ia(f)?
a.h||a.parent&&a.parent.h||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ja+=e,a.g=null)),e=a):e=a;return e}function zo(a){Qd("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},Ao)}var Ao=new function(){};function Un(a){return a?(a=a.B)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function vo(a,b){for(var c=[],d=b[0].B,e=b[b.length-1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=Bn(a.f,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.u?sk:rk);l=d=h=g=e=0;for(m=Zk(a);;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.u?k.right-
k.left:k.bottom-k.top,1),p=m*(a.u?k.right:k.top)<m*e?m*((a.u?k.left:k.bottom)-e)/p:m*(a.u?k.left:k.bottom)>m*g?m*(g-(a.u?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.u?k.top:k.left)>=h-1)){h=a.u?k.bottom:k.right;a.u?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ma);a.u&&c.reverse();return c}
function km(a,b){var c=0;Lk(b,function(a){if("clone"===a.vb["box-decoration-break"]){var b=go(this,a.B);c+=a.u?-b.left:b.bottom;"table"===a.display&&(c+=a.Qd)}}.bind(a));return c}function Jn(a,b){return(b?En(b.g(),Hn(a)):En(null,Hn(a))).current}
function Gn(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.ta;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.vb.widows||2)-0,1),f=Math.max((e.vb.orphans||2)-0,1));var e=km(a,e),g=vo(a,d),h=a.O-e,d=Jn(a,b),h=h-Zk(a)*d,e=La(g.length,function(b){return a.u?g[b]<h:g[b]>h}),e=Math.min(g.length-c,e);if(e<f)return null;h=g[e-1];if(b=wo(a,b.h,h))a.xa=Zk(a)*(h-a.w)+d;return b}lm.prototype.Ea=function(a,b,c){var d=Cn(a.F).Ea(this,a,b,c);d||(d=Bo.Ea(this,a,b,c));return d};
lm.prototype.Ob=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.G.length-1;0<=e&&!b;--e){var a=this.G[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Fb:b?a:null,A:b}};
function Co(a,b,c,d,e){if(en(a.g)||a.b||!c)return L(b);var f=K("doFinishBreak"),g=!1;if(!b){v.b("Could not find any page breaks?!!");if(a.Ae)return Do(a,c).then(function(b){b?(b=b.modify(),b.b=!1,a.Ea(b,g,!0).then(function(){N(f,b)})):N(f,b)}),f.result();b=d;g=!0;a.xa=e}a.Ea(b,g,!0).then(function(){N(f,b)});return f.result()}function Eo(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function Fo(a,b,c,d,e){if(!b||co(b.B))return!1;var f=An(b,a.f,0,a.u),g=En(b,Hn(a)),h=In(a,f+(a.u?-1:1)*g.ee);In(a,f+(a.u?-1:1)*g.current)&&!a.T&&(a.T=b);c&&(f+=xo(a,c));io(a,f);d=a.h?d:!0;!d&&h||Go(a,b,e,h);return h}
function Ho(a,b){if(!b.B.parentNode)return!1;var c=eo(a,b.B),d=b.B.ownerDocument.createElement("div");a.u?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.B.parentNode.insertBefore(d,b.B);var e=lk(a.f,d),e=a.u?e.right:e.top,f=Zk(a),g=b.C,h=Infinity*-Zk(a);"all"===g&&(h=tn(a.g,a));switch(g){case "left":h=f*Math.max(h*f,a.vc*f);break;case "right":h=f*Math.max(h*f,a.Nc*f);break;default:h=f*Math.max(h*
f,Math.max(a.Nc*f,a.vc*f))}if(e*f>=h*f)return b.B.parentNode.removeChild(d),!1;e=Math.max(1,(h-e)*f);a.u?d.style.width=e+"px":d.style.height=e+"px";e=lk(a.f,d);e=a.u?e.left:e.bottom;a.u?(h=e+c.right-h,0<h==0<=c.right&&(h+=c.right),d.style.marginLeft=h+"px"):(h-=e+c.top,0<h==0<=c.top&&(h+=c.top),d.style.marginBottom=h+"px");b.D=d;return!0}function Io(a){return a instanceof Mn?!0:a instanceof Jo?!1:a instanceof Ko?!0:!1}
function Lo(a,b,c,d){function e(){return!!d||!c&&!!wl[m]}function f(){b=q[0]||b;b.B.parentNode.removeChild(b.B);h.b=m}var g=b.M?b.parent&&b.parent.F:b.F;if(g&&!Io(g))return L(b);var h=a,l=K("skipEdges"),k=!d&&c&&b&&b.M,m=d,p=null,q=[],r=[],z=!1;ne(function(a){for(;b;){var d=Cn(b.F);do if(b.B){if(b.ta&&1!=b.B.nodeType){if(nk(b.B,b.ac))break;if(!b.M){e()?f():Fo(h,p,null,!0,m)?(b=(h.h?p||b:b).modify(),b.b=!0):(b=b.modify(),b.g=m);P(a);return}}if(!b.M){if(d&&d.we(b))break;b.C&&Ho(h,b)&&c&&!h.G.length&&
Go(h,Bk(b),m,!1);if(!Io(b.F)||b.F instanceof Ko||Nn(h,b)||b.I){q.push(Bk(b));m=ul(m,b.g);if(e())f();else if(Fo(h,p,null,!0,m)||!h.sb.bc(b))b=(h.h?p||b:b).modify(),b.b=!0;P(a);return}}if(1==b.B.nodeType){var g=b.B.style;if(b.M){if(!(b.ta||d&&d.We(b,h.h))){if(z){if(e()){f();P(a);return}q=[];k=c=!1;m=null}z=!1;p=Bk(b);r.push(p);m=ul(m,b.G);if(g&&(!Eo(g.paddingBottom)||!Eo(g.borderBottomWidth))){if(Fo(h,p,null,!0,m)&&(b=(h.h?p||b:b).modify(),b.b=!0,h.h)){P(a);return}r=[p];p=null}}}else{q.push(Bk(b));
m=ul(m,b.g);if(!h.sb.bc(b)&&(Fo(h,p,null,!1,m),b=b.modify(),b.b=!0,h.h)){P(a);return}if(zn[b.B.localName]){e()?f():Fo(h,p,null,!0,m)&&(b=(h.h?p||b:b).modify(),b.b=!0);P(a);return}!g||Eo(g.paddingTop)&&Eo(g.borderTopWidth)||(k=!1,r=[]);z=!0}}}while(0);d=Vn(h,b,k);if(d.Pa()){d.then(function(c){b=c;O(a)});return}b=d.get()}Fo(h,p,r,!1,m)?p&&h.h&&(b=p.modify(),b.b=!0):wl[m]&&(h.b=m);P(a)}).then(function(){p&&(h.Ra=Ik(p));N(l,b)});return l.result()}
function Do(a,b){var c=Bk(b),d=K("skipEdges"),e=null,f=!1;ne(function(d){for(;b;){do if(b.B){if(b.ta&&1!=b.B.nodeType){if(nk(b.B,b.ac))break;if(!b.M){wl[e]&&(a.b=e);P(d);return}}if(!b.M&&(Nn(a,b)||b.I)){e=ul(e,b.g);wl[e]&&(a.b=e);P(d);return}if(1==b.B.nodeType){var g=b.B.style;if(b.M){if(f){if(wl[e]){a.b=e;P(d);return}e=null}f=!1;e=ul(e,b.G)}else{e=ul(e,b.g);if(zn[b.B.localName]){wl[e]&&(a.b=e);P(d);return}if(g&&(!Eo(g.paddingTop)||!Eo(g.borderTopWidth))){P(d);return}}f=!0}}while(0);g=hm(a.j,b);if(g.Pa()){g.then(function(a){b=
a;O(d)});return}b=g.get()}c=null;P(d)}).then(function(){N(d,c)});return d.result()}function Wn(a,b){return ym(b.H)||"footnote"===b.ya?so(a,b):ho(a,b)}function Mo(a,b,c,d){var e=K("layoutNext");Lo(a,b,c,d||null).then(function(d){b=d;!b||a.b||a.h&&b&&b.b?N(e,b):Cn(b.F).Nd(b,a,c).Ba(e)});return e.result()}function No(a,b,c){if(b)for(var d=b.parent;b;b=d,d=d?d.parent:null)Cn((d||b).F).ld(a,d,b,c),c=!1}
function lo(a){a.lf=[];w(a.element,"width",a.width+"px");w(a.element,"height",a.height+"px");var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.D+"px";b.style.right=a.I+"px";b.style.bottom=a.H+"px";b.style.left=a.C+"px";a.element.appendChild(b);var c=lk(a.f,b);a.element.removeChild(b);var b=a.gb+a.left+Xk(a),d=a.hb+a.top+Vk(a);a.hf=new Wf(b,d,b+a.width,d+a.height);a.W=c?a.u?c.top:c.left:0;a.la=c?a.u?c.bottom:c.right:0;a.w=c?a.u?c.right:c.top:0;a.J=c?a.u?c.left:
c.bottom:0;a.vc=a.w;a.Nc=a.w;a.tc=a.w;a.O=a.J;var c=a.hf,e,b=a.gb+a.left+Xk(a),d=a.hb+a.top+Vk(a);e=new Wf(b,d,b+a.width,d+a.height);if(a.Ia){b=a.Ia;d=e.U;e=e.S;for(var f=[],g=0;g<b.b.length;g++){var h=b.b[g];f.push(new Xf(h.f+d,h.b+e))}b=new bg(f)}else b=eg(e.U,e.S,e.V,e.P);b=[b];d=rn(a.g);a.va=og(c,b,a.Ac.concat(d),a.Sa,a.u);ao(a);a.xa=0;a.Ab=!1;a.b=null;a.Ra=null}function Go(a,b,c,d){var e=Bk(b);b=Cn(b.F).cf(e,c,d,a.xa);a.G.push(b)}
function io(a,b){isNaN(b)||(a.xa=Math.max(Zk(a)*(b-a.w),a.xa))}
function nm(a,b,c,d){a.lf.push(b);b.f.M&&(a.Ra=b.f);if(a.h&&a.Ab)return L(b);var e=K("layout");a.tb(b.f).then(function(b){var f=null;if(b.B)f=Bk(b);else{var h=function(b){b.A.B&&(f=b.A,a.j.removeEventListener("nextInTree",h))};a.j.addEventListener("nextInTree",h)}var l=new Po(c,d);qm(l,b,a).then(function(b){Co(a,b,l.w.zd,f,l.b).then(function(b){var c=null;a.Bb?c=L(null):c=Qo(a,b);c.then(function(){if(en(a.g))N(e,null);else if(b){a.Ab=!0;var c=new Nk(Ik(b));N(e,c)}else N(e,null)})})})});return e.result()}
function Qo(a,b){var c=K("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.l);d.sort(function(a,b){return a.Fe()-b.Fe()});var e=0;me(function(){return e<d.length?d[e++].Ea(b,this).sc(!0):L(!1)}.bind(a)).then(function(){N(c,!0)});return c.result()}
function Ro(a,b,c,d){var e=K("doLayout"),f=null;a.G=[];a.T=null;ne(function(e){for(;b;){var g=!0;Mo(a,b,c,d||null).then(function(h){c=!1;d=null;a.T&&a.h?(a.b=null,b=a.T,b.b=!0):b=h;en(a.g)?P(e):a.b?P(e):b&&a.h&&b&&b.b?(f=b,b=a.Ob().A,P(e)):g?g=!1:O(e)});if(g){g=!1;return}}a.xa+=Jn(a);P(e)}).then(function(){N(e,{A:b,zd:f})});return e.result()}function co(a){for(;a;){if(a.parentNode===a.ownerDocument)return!1;a=a.parentNode}return!0}
function Po(a,b){pm.call(this);this.Qb=a;this.J=b||null;this.G=null;this.b=0;this.D=!1;this.w={zd:null}}t(Po,pm);Po.prototype.j=function(){return new So(this.Qb,this.J,this.w)};Po.prototype.I=function(a,b){b.l=[];b.Bb||(To=[])};Po.prototype.l=function(a,b){pm.prototype.l.call(this,a,b);this.G=b.b;this.b=b.xa;this.D=b.Ab};Po.prototype.f=function(a,b){pm.prototype.f.call(this,a,b);b.b=this.G;b.xa=this.b;b.Ab=this.D};function So(a,b,c){this.Qb=a;this.j=b;this.h=c}
So.prototype.b=function(a,b){var c=K("adapt.layout.DefaultLayoutMode.doLayout");Uo(a,b).then(function(){Ro(b,a,this.Qb,this.j).then(function(a){this.h.zd=a.zd;N(c,a.A)}.bind(this))}.bind(this));return c.result()};So.prototype.f=function(a,b){return en(b.g)||b.b||0>=b.l.length?!0:b.l.every(function(c){return c.bc(a,this.h.zd,b)}.bind(this))};So.prototype.g=function(a,b,c,d){d||(d=!c.l.some(function(b){return b.yd(a)}));c.l.forEach(function(e){e.md(d,a,b,c)});return d};function Vo(){}n=Vo.prototype;
n.Nd=function(a,b){var c;if(Nn(b,a))c=Wn(b,a);else{a:if(a.M)c=!0;else{switch(a.N.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.I}c=c?yo(b,a):Yn(b,a)}return c};n.cf=function(a,b,c,d){return new om(Bk(a),b,c,d)};n.we=function(){return!1};n.We=function(){return!1};n.ld=function(a,b,c,d){if(c.B&&c.B.parentNode){a=c.B.parentNode;b=c.B;if(a)for(var e;(e=a.lastChild)!=b;)a.removeChild(e);d&&a.removeChild(c.B)}};
n.Ea=function(a,b,c,d){c=c||!!b.B&&1==b.B.nodeType&&!b.M;No(a,b,c);d&&(to(b,!0),Wo(c?b:b.parent));return L(!0)};var Bo=new Vo;Pd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.F?null:b&&a.F!==b.F?null:a.Qc||!a.F&&yl(c,d,e,f).display===Mc?new Mn(b?b.F:null):null});Pd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Mn?Bo:null});function ko(a,b,c,d,e,f,g){lm.call(this,b,c,d,e,f);this.ya=a;this.vf=g;this.wf=[];this.nf=[];this.uc=!0}t(ko,lm);
ko.prototype.tb=function(a){return lm.prototype.tb.call(this,a).fa(function(a){if(a){for(var b=a;b.parent;)b=b.parent;b=b.B;this.wf.push(b);this.uc&&Xo(this,b);this.nf.push(eo(this,b));if(this.uc){var d=this.ya;if(this.vf.u){if("block-end"===d||"left"===d)d=Aa(b,"height"),""!==d&&"auto"!==d&&w(b,"margin-top","auto")}else if("block-end"===d||"bottom"===d)d=Aa(b,"width"),""!==d&&"auto"!==d&&w(b,"margin-left","auto")}}return L(a)}.bind(this))};
function Xo(a,b){function c(a,c){a.forEach(function(a){var d=Aa(b,a);d&&"%"===d.charAt(d.length-1)&&w(b,a,c*parseFloat(d)/100+"px")})}var d=fl(a.vf),e=d.V-d.U,d=d.P-d.S;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===Aa(b,a)&&w(b,a,"0")})}
function qn(a){return Math.max.apply(null,a.wf.map(function(a,c){var b=lk(this.f,a),e=this.nf[c];return this.u?e.top+b.height+e.bottom:e.left+b.width+e.right},a))}function Yo(a,b,c){var d=lk(b.f,a);a=eo(b,a);return c?d.width+a.left+a.right:d.height+a.top+a.bottom};function Zo(a,b){this.b=a;this.$=b}function $o(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function ap(a,b){this.b=a;this.f=b}function bp(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function cp(a,b){this.rc=a;this.$c=b;this.ie=null;this.$=this.R=-1}function jj(a,b,c){b=a.b.J.oe(b,a.f);a.b.l[b]=c}function dp(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function ep(a,b){var c=a.b.J.fd(oa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function Mi(a,b,c){return new vb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Oi(a,b,c){return new vb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function fp(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.D=b;for(b=0;d.D&&(b+=5E3,Ll(d,b,0)!==Number.POSITIVE_INFINITY););d.D=null}e=a.b.l[c]}return e||null}
function Qi(a,b,c,d){var e=dp(b),f=ep(a,b),g=fp(a,e,f,!1);return g&&g[c]?(b=g[c],new tb(a.j,d(b[b.length-1]||null))):new vb(a.f,function(){if(g=fp(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.C[f]||null)return gp(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);hp(a.b,f,!1);return"??"}hp(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Si(a,b,c,d){var e=dp(b),f=ep(a,b);return new vb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.C[f]||null;if(b){gp(a.b,f);var b=b[c]||[],h=fp(a,e,f,!0)[c]||[];return d(b.concat(h))}hp(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function ip(a){this.J=a;this.l={};this.C={};this.b={};this.b.page=[0];this.H={};this.G=[];this.D={};this.j=null;this.w=[];this.g=[];this.I=[];this.f={};this.h={}}function jp(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function kp(a,b,c){a.H=bp(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=zg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=zg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function lp(a,b){a.G.push(a.b);a.b=bp(b)}
function gp(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.rc===b?(g.$c=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||hp(a,b,!0)}function hp(a,b,c){a.w.some(function(a){return a.rc===b})||a.w.push(new cp(b,c))}
function mp(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=bp(a.b);d.forEach(function(a){this.C[a]=e;var d=this.D[a];if(d&&d.$<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.$c=!1,f.push(g)}this.D[a]={R:b,$:c}},a)}for(var d=a.H,f;f=a.w.shift();){f.ie=d;f.R=b;f.$=c;var g;f.$c?(g=a.h[f.rc])||(g=a.h[f.rc]=[]):(g=a.f[f.rc])||(g=a.f[f.rc]=[]);g.every(function(a){return!(f===a||a&&f.rc===a.rc&&f.$c===a.$c&&f.R===a.R&&f.$===a.$)})&&g.push(f)}a.j=null}
function np(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.R-b.R||a.$-b.$});var d=[],e=null;c.forEach(function(a){e&&e.R===a.R&&e.$===a.$?e.Ad.push(a):(e={R:a.R,$:a.$,ie:a.ie,Ad:[a]},d.push(e))});return d}function op(a,b){a.I.push(a.g);a.g=b}
Zo.prototype.bc=function(a){if(!a||a.M)return!0;a=a.B;if(!a||1!==a.nodeType)return!0;a=a.getAttribute("id")||a.getAttribute("name");return a&&(this.b.h[a]||this.b.f[a])?(a=this.b.D[a])?this.$>=a.$:!0:!0};var pp=1;function qp(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Wb=c;this.Da=d;this.parent=e;this.l="p"+pp++;e&&(this.index=e.j.length,e.j.push(this))}qp.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};qp.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function rp(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function sp(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function tp(a){qp.call(this,a,null,null,[],null);this.b.width=new V(Id,0);this.b.height=new V(Jd,0)}t(tp,qp);
function up(a,b){this.g=b;var c=this;sb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.w[d[1]];if(e&&(e=this.Ia[e])){if(b){var d=d[2],h=e.ha[d];if(h)e=h;else{switch(d){case "columns":var h=e.b.f,l=new kc(h,0),k=vp(e,"column-count"),m=vp(e,"column-width"),p=vp(e,"column-gap"),h=y(h,mc(h,new hc(h,"min",[l,k]),x(h,m,p)),p)}h&&(e.ha[d]=h);e=h}}else e=vp(e,d[2]);return e}}return null})}t(up,sb);
function wp(a,b,c,d,e,f,g){a=a instanceof up?a:new up(a,this);qp.call(this,a,b,c,d,e);this.g=this;this.ea=f;this.Y=g;this.b.width=new V(Id,0);this.b.height=new V(Jd,0);this.b["wrap-flow"]=new V(Lc,0);this.b.position=new V(qd,0);this.b.overflow=new V(Fd,0);this.w={}}t(wp,qp);wp.prototype.h=function(a){return new xp(a,this)};wp.prototype.clone=function(a){a=new wp(this.f,this.name,a.Wb||this.Wb,this.Da,this.parent,this.ea,this.Y);rp(this,a);sp(this,a);return a};
function yp(a,b,c,d,e){qp.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l);this.b["wrap-flow"]=new V(Lc,0)}t(yp,qp);yp.prototype.h=function(a){return new zp(a,this)};yp.prototype.clone=function(a){a=new yp(a.parent.f,this.name,this.Wb,this.Da,a.parent);rp(this,a);sp(this,a);return a};function Ap(a,b,c,d,e){qp.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l)}t(Ap,qp);Ap.prototype.h=function(a){return new Bp(a,this)};
Ap.prototype.clone=function(a){a=new Ap(a.parent.f,this.name,this.Wb,this.Da,a.parent);rp(this,a);sp(this,a);return a};function Y(a,b,c){return b&&b!==Lc?b.ra(a,c):null}function Cp(a,b,c){return b&&b!==Lc?b.ra(a,c):a.b}function Dp(a,b,c){return b?b===Lc?null:b.ra(a,c):a.b}function Ep(a,b,c,d){return b&&c!==F?b.ra(a,d):a.b}function Fp(a,b,c){return b?b===Gd?a.j:b===Xc?a.h:b.ra(a,a.b):c}
function Gp(a,b){this.f=a;this.b=b;this.J={};this.style={};this.C=this.D=null;this.w=[];this.O=this.T=this.g=this.h=!1;this.H=this.I=0;this.G=null;this.la={};this.ha={};this.va=this.u=!1;a&&a.w.push(this)}function Hp(a){a.I=0;a.H=0}function Ip(a,b,c){b=vp(a,b);c=vp(a,c);if(!b||!c)throw Error("E_INTERNAL");return x(a.b.f,b,c)}
function vp(a,b){var c=a.la[b];if(c)return c;var d=a.style[b];d&&(c=d.ra(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c=vp(a,"left");break;case "margin-top-edge":c=vp(a,"top");break;case "margin-right-edge":c=Ip(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Ip(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Ip(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Ip(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Ip(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Ip(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Ip(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Ip(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Ip(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Ip(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Ip(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Ip(a,"padding-top-edge","padding-top");break;case "right-edge":c=Ip(a,"left-edge","width");break;case "bottom-edge":c=Ip(a,"top-edge","height")}if(!c){if("extent"==b)d=a.u?"width":"height";else if("measure"==b)d=a.u?"height":"width";else{var e=a.u?xh:yh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=vp(a,d))}c&&(a.la[b]=c);return c}
function Jp(a){var b=a.b.f,c=a.style,d=Fp(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new fc(b,"page-number"),d=lc(b,d,new Yb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-height"),e)));d=a.W(d);c.enabled=new E(d)}Gp.prototype.W=function(a){return a};
Gp.prototype.ae=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=Ep(a,b["border-left-width"],b["border-left-style"],c),g=Cp(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=Cp(a,b["padding-right"],c),m=Ep(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=x(a,f,g),z=x(a,f,k);d&&q&&h?(r=y(a,c,x(a,h,x(a,x(a,d,r),z))),e?p?q=y(a,r,p):p=y(a,r,x(a,q,e)):(r=y(a,r,
q),p?e=y(a,r,p):p=e=mc(a,r,new tb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.D,this.h=!0):d=a.b:(h=this.D,this.h=!0),r=y(a,c,x(a,x(a,e,r),x(a,p,z))),this.h&&(l||(l=y(a,r,d?d:q)),this.u||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.h=!1)),d?h?q||(q=y(a,r,x(a,d,h))):h=y(a,r,x(a,d,q)):d=y(a,r,x(a,q,h)));a=Cp(a,b["snap-width"]||(this.f?this.f.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(p);b.right=new E(q);b["snap-width"]=new E(a)};
Gp.prototype.be=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=this.f?this.f.style.height.ra(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=Ep(a,b["border-top-width"],b["border-top-style"],c),h=Cp(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=Cp(a,b["padding-bottom"],c),p=Ep(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=x(a,g,h),u=x(a,p,m);e&&r&&l?(d=y(a,d,x(a,l,x(a,x(a,e,z),
u))),f?q?r=y(a,d,f):q=y(a,d,x(a,r,f)):(d=y(a,d,r),q?f=y(a,d,q):q=f=mc(a,d,new tb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||r||l||(e=a.b),e||l?e||r?l||r||(l=this.C,this.g=!0):e=a.b:(l=this.C,this.g=!0),d=y(a,d,x(a,x(a,f,z),x(a,q,u))),this.g&&(k||(k=y(a,d,e?e:r)),this.u&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.g=!1)),e?l?r||(r=y(a,d,x(a,e,l))):l=y(a,d,x(a,r,e)):e=y(a,d,x(a,r,l)));a=Cp(a,b["snap-height"]||(this.f?this.f.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(p);b["margin-bottom"]=new E(q);b.bottom=new E(r);b["snap-height"]=new E(a)};
function Kp(a){var b=a.b.f,c=a.style;a=Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==md?f.ra(b,null):null)||(f=new ec(b,1,"em"));d&&!e&&(e=new hc(b,"floor",[nc(b,x(b,a,f),x(b,d,f))]),e=new hc(b,"max",[b.f,e]));e||(e=b.f);d=y(b,nc(b,x(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function Lp(a,b,c,d){a=a.style[b].ra(a.b.f,null);return Hb(a,c,d,{})}
function Mp(a,b){b.Ia[a.b.l]=a;var c=a.b.f,d=a.style,e=a.f?Np(a.f,b):null,e=wj(a.J,b,e,!1);a.u=vj(e,b,a.f?a.f.u:!1);Aj(e,d,a.u,function(a,b){return b.value});a.D=new vb(c,function(){return a.I},"autoWidth");a.C=new vb(c,function(){return a.H},"autoHeight");a.ae();a.be();Kp(a);Jp(a)}function Op(a,b,c){(a=a.style[c])&&(a=Vf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Vf(b,a,c));return Hc(a,b)}
function Np(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Pp(a,b,c,d,e){if(a=Op(a,b,d))a.jc()&&zb(a.ga)&&(a=new D(Hc(a,b),"px")),"font-family"===d&&(a=Xl(e,a)),w(c,d,a.toString())}
function Qp(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");bl(c,d,a);w(c.element,"margin-left",e+"px");w(c.element,"padding-left",f+"px");w(c.element,"border-left-width",g+"px");c.marginLeft=e;c.borderLeft=g;c.C=f}
function Rp(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.element,"margin-right",f+"px");w(c.element,"padding-right",g+"px");w(c.element,"border-right-width",b+"px");c.marginRight=f;c.ha=b;a.u&&0<e&&(a=d+Yk(c),a-=Math.floor(a/e)*e,0<a&&(c.Cb=e-a,g+=c.Cb));c.I=g;c.Db=e}
function Sp(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.borderTop=b;c.Sa=d;!a.u&&0<d&&(a=e+Vk(c),a-=Math.floor(a/d)*d,0<a&&(c.pa=d-a,g+=c.pa));c.D=g;w(c.element,"top",e+"px");w(c.element,"margin-top",f+"px");w(c.element,"padding-top",g+"px");w(c.element,"border-top-width",b+"px")}
function Tp(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.pa;w(c.element,"height",a+"px");w(c.element,"margin-bottom",d+"px");w(c.element,"padding-bottom",e+"px");w(c.element,"border-bottom-width",f+"px");c.height=a-c.pa;c.marginBottom=d;c.Z=f;c.H=e}function Up(a,b,c){a.u?(Sp(a,b,c),Tp(a,b,c)):(Rp(a,b,c),Qp(a,b,c))}
function Vp(a,b,c){w(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.T?al(c,0,d):(Sp(a,b,c),d-=c.pa,c.height=d,w(c.element,"height",d+"px"))}function Wp(a,b,c){w(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?bl(c,0,d):(Rp(a,b,c),d-=c.Cb,c.width=d,a=Z(a,b,"right"),w(c.element,"right",a+"px"),w(c.element,"width",d+"px"))}
var Xp="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Yp="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Zp="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),$p=["width","height"],aq=["transform","transform-origin"];
Gp.prototype.Ub=function(a,b,c,d){this.f&&this.u==this.f.u||w(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?Wp(this,a,b):Vp(this,a,b):(this.u?Rp(this,a,b):Sp(this,a,b),this.u?Qp(this,a,b):Tp(this,a,b));(this.u?this.g:this.h)?this.u?Vp(this,a,b):Wp(this,a,b):Up(this,a,b);for(c=0;c<Xp.length;c++)Pp(this,a,b.element,Xp[c],d)};function bq(a,b,c,d){for(var e=0;e<Zp.length;e++)Pp(a,b,c.element,Zp[e],d)}
function cq(a,b,c,d){for(var e=0;e<$p.length;e++)Pp(a,b,c,$p[e],d)}
Gp.prototype.sd=function(a,b,c,d,e,f,g){this.u?this.I=b.xa+b.Cb:this.H=b.xa+b.pa;var h=(this.u||!d)&&this.g,l=(!this.u||!d)&&this.h;if(l||h)l&&w(b.element,"width","auto"),h&&w(b.element,"height","auto"),d=lk(f,d?d.element:b.element),l&&(this.I=Math.ceil(d.right-d.left-b.C-b.borderLeft-b.I-b.ha),this.u&&(this.I+=b.Cb)),h&&(this.H=d.bottom-d.top-b.D-b.borderTop-b.H-b.Z,this.u||(this.H+=b.pa));(this.u?this.g:this.h)&&Up(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.T)this.u?Rp(this,a,b):Sp(this,
a,b);this.u?Qp(this,a,b):Tp(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Op(this,a,"column-rule-style"),f=Op(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=Cd))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,p=this.u?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.C-l/2,r=b.height+b.D+b.H,z=b.element.ownerDocument.createElement("div");w(z,"position","absolute");w(z,this.u?"left":"top","0px");w(z,this.u?"top":"left",q+"px");w(z,this.u?"height":"width","0px");w(z,this.u?
"width":"height",r+"px");w(z,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<Yp.length;h++)Pp(this,a,b.element,Yp[h],g);for(h=0;h<aq.length;h++)e=b,g=aq[h],l=c.w,(d=Op(this,a,g))&&l.push(new dk(e.element,g,d))};
Gp.prototype.j=function(a,b){var c=this.J,d=this.b.b,e;for(e in d)Ch(e)&&Dh(c,e,d[e]);if("background-host"==this.b.Wb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.b.Wb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);bj(a,this.b.Da,null,c);c.content&&(c.content=c.content.rd(new Ei(a,null,a.Ab)));Mp(this,a.l);for(c=0;c<this.b.j.length;c++)this.b.j[c].h(this).j(a,b);a.pop()};
function dq(a,b){a.h&&(a.O=Lp(a,"right",a.D,b)||Lp(a,"margin-right",a.D,b)||Lp(a,"border-right-width",a.D,b)||Lp(a,"padding-right",a.D,b));a.g&&(a.T=Lp(a,"top",a.C,b)||Lp(a,"margin-top",a.C,b)||Lp(a,"border-top-width",a.C,b)||Lp(a,"padding-top",a.C,b));for(var c=0;c<a.w.length;c++)dq(a.w[c],b)}function eq(a){Gp.call(this,null,a)}t(eq,Gp);eq.prototype.j=function(a,b){Gp.prototype.j.call(this,a,b);this.w.sort(function(a,b){return b.b.Y-a.b.Y||a.b.index-b.b.index})};
function xp(a,b){Gp.call(this,a,b);this.G=this}t(xp,Gp);xp.prototype.W=function(a){var b=this.b.g;b.ea&&(a=lc(b.f,a,b.ea));return a};xp.prototype.Z=function(){};function zp(a,b){Gp.call(this,a,b);this.G=a.G}t(zp,Gp);function Bp(a,b){Gp.call(this,a,b);this.G=a.G}t(Bp,Gp);function fq(a,b,c,d){var e=null;c instanceof zc&&(e=[c]);c instanceof sc&&(e=c.values);if(e)for(a=a.b.f,c=0;c<e.length;c++)if(e[c]instanceof zc){var f=qb(e[c].name,"enabled"),f=new fc(a,f);d&&(f=new Ob(a,f));b=lc(a,b,f)}return b}
Bp.prototype.W=function(a){var b=this.b.f,c=this.style,d=Fp(b,c.required,b.h)!==b.h;if(d||this.g){var e;e=(e=c["flow-from"])?e.ra(b,b.b):new tb(b,"body");e=new hc(b,"has-content",[e]);a=lc(b,a,e)}a=fq(this,a,c["required-partitions"],!1);a=fq(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.G.style.enabled)?c.ra(b,null):b.j,c=lc(b,c,a),this.G.style.enabled=new E(c));return a};Bp.prototype.Ub=function(a,b,c,d,e){w(b.element,"overflow","hidden");Gp.prototype.Ub.call(this,a,b,c,d,e)};
function gq(a,b,c,d){of.call(this,a,b,!1);this.target=c;this.b=d}t(gq,pf);gq.prototype.wb=function(a,b,c){kh(this.b,a,b,c,this)};gq.prototype.Kd=function(a,b){qf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};gq.prototype.Sc=function(a,b){qf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};gq.prototype.xb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function hq(a,b,c,d){gq.call(this,a,b,c,d)}t(hq,gq);
function iq(a,b,c,d){gq.call(this,a,b,c,d);c.b.width=new V(Hd,0);c.b.height=new V(Hd,0)}t(iq,gq);iq.prototype.dd=function(a,b,c){a=new Ap(this.f,a,b,c,this.target);nf(this.ka,new hq(this.f,this.ka,a,this.b))};iq.prototype.cd=function(a,b,c){a=new yp(this.f,a,b,c,this.target);a=new iq(this.f,this.ka,a,this.b);nf(this.ka,a)};function jq(a,b,c,d){gq.call(this,a,b,c,d)}t(jq,gq);jq.prototype.dd=function(a,b,c){a=new Ap(this.f,a,b,c,this.target);nf(this.ka,new hq(this.f,this.ka,a,this.b))};
jq.prototype.cd=function(a,b,c){a=new yp(this.f,a,b,c,this.target);a=new iq(this.f,this.ka,a,this.b);nf(this.ka,a)};function kq(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function yl(a,b,c,d){if(a!==F)if(b===Ic||b===Yc)c=F,a=kq(a);else if(c&&c!==F||d)a=kq(a);return{display:a,position:b,qa:c}}
function lq(a,b,c,d,e,f,g){e=e||f||cd;return!!g||!!c&&c!==F||b===Ic||b===Yc||a===fd||a===yd||a===xd||a==Zc||(a===Mc||a===kd)&&!!d&&d!==Fd||!!f&&e!==f};function mq(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.fd(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.fd(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.fd(e,b)})};var nq={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},oq={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},pq={"margin-top":"0px"},qq={"margin-right":"0px"},rq={};
function sq(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var tq=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),uq="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function vq(a,b){a.setAttribute("data-adapt-pseudo",b)}function wq(a,b,c,d){this.style=b;this.element=a;this.b=c;this.g=d;this.f={}}wq.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);a=this.style._pseudos[b]||{};if(b.match(/^first-/)&&!a["x-first-pseudo"]){var c=1;if("first-letter"==b)c=0;else if(b=b.match(/^first-([0-9]+)-lines$/))c=b[1]-0;a["x-first-pseudo"]=new V(new Bc(c),0)}return a};
wq.prototype.pa=function(a,b){var c=a.getAttribute("data-adapt-pseudo")||"";this.f[c]||(this.f[c]=!0,(c=b.content)&&il(c)&&c.ba(new hl(a,this.g,c)))};function xq(a,b,c,d,e,f,g,h,l,k,m,p,q){this.h={};this.H=a;this.b=b;this.viewport=c;this.D=c.b;this.l=d;this.w=e;this.aa=f;this.I=g;this.C=h;this.J=l;this.page=k;this.g=m;this.G=p;this.j=q;this.O=this.A=null;this.f=!1;this.N=null;this.ja=0;this.B=null}t(xq,Ta);
xq.prototype.clone=function(){return new xq(this.H,this.b,this.viewport,this.l,this.w,this.aa,this.I,this.C,this.J,this.page,this.g,this.G,this.j)};function yq(a,b,c,d){a=a._pseudos;if(!a)return null;var e={},f;for(f in a){var g=e[f]={};zj(g,a[f],d);xj(g,d,a[f]);yj(a[f],b,c,function(a,b){zj(g,b,d);zq(b,function(a){zj(g,a,d)})})}return e}
function Aq(a,b,c,d,e,f){var g=K("createRefShadow");a.aa.w.load(b).then(function(h){if(h){var l=Nj(h,b);if(l){var k=a.J,m=k.I[h.url];if(!m){var m=k.style.l.f[h.url],p=new Ab(0,k.Tb(),k.Sb(),k.w),m=new Dl(h,m.g,m.f,p,k.l,m.w,new ap(k.j,h.url),new $o(k.j,h.url,m.f,m.b));k.I[h.url]=m}f=new Ck(d,l,h,e,f,c,m)}}N(g,f)});return g.result()}
function Bq(a,b,c,d,e,f,g,h){var l=K("createShadows"),k=e.template,m;k instanceof Fc?m=Aq(a,k.url,2,b,h,null):m=L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),z=null;p?z=h?h.aa:a.aa:h&&(p="http://www.w3.org/1999/xhtml"==h.ka.namespaceURI?h.ka.getAttribute("href"):h.ka.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.Wc?h.Wc.aa:a.aa);p&&(p=oa(p,z.url),m=Aq(a,p,3,b,h,k))}m||(m=L(k));var u=null;
m.then(function(c){e.display===yd?u=Aq(a,oa("user-agent.xml#table-cell",na),2,b,h,c):u=L(c)});u.then(function(k){var m=yq(d,a.w,a.f,g);if(m){for(var p=[],q=tq.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=0;u<uq.length;u++){var z=uq[u],A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.f))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===ed))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===md||A===F)continue;p.push(z);A=tq.createElementNS("http://www.w3.org/1999/xhtml",
"span");vq(A,z)}else A=tq.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/)&&(r=A)}k=p.length?new Ck(b,q,null,h,k,2,new wq(b,d,f,g)):k}N(l,k)})});return l.result()}function On(a,b,c){a.O=b;a.f=c}
function Cq(a,b,c,d){var e=a.b;c=wj(c,e,a.w,a.f);b=vj(c,e,b);Aj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=Xl(a.I,d));return d});var f=yl(d.display||ed,d.position,d["float"],a.N===a.aa.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Dq(a,b){for(var c=a.A.N,d=[],e=null,f=a.A.oa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e=e||Ba(c)}h?(c=f.ka,f=f.Wc):(c=c.parentNode,g++)}c=Cb(a.b,"em",!g);c={"font-size":new V(new D(c,"px"),0)};f=new Jh(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)mh[k]&&l.push(k);l.sort(Md);for(var m=0;m<l.length;m++){var p=l[m];f.f=p;var q=h[p];q.value!==dd&&(c[p]=q.rd(f))}}for(var r in b)mh[r]||(c[r]=b[r]);return{lang:e,ab:c}}
var Eq={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Fq(a,b){b=oa(b,a.aa.url);return a.G[b]||b}function Gq(a){a.A.lang=Ba(a.A.N)||a.A.parent&&a.A.parent.lang||a.A.lang}
function Hq(a,b){var c=oh().filter(function(a){return b[a]});if(c.length){var d=a.A.vb;if(a.A.parent){var d=a.A.vb={},e;for(e in a.A.parent.vb)d[e]=a.A.parent.vb[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Bc)d[a]=c.L;else if(c instanceof zc)d[a]=c.name;else if(c instanceof D)switch(c.ga){case "dpi":case "dpcm":case "dppx":d[a]=c.L*yb[c.ga]}else d[a]=c;delete b[a]}})}}
function Iq(a,b,c,d,e,f){for(var g=Qd("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.F=l;break}}}
function Jq(a,b,c){var d=!0,e=K("createElementView"),f=a.N,g=a.A.oa?a.A.oa.b:a.l,h=g.l(f,!1);if(!a.A.oa){var l=Ij(a.aa,f);Kq(l,a.A.Ka,0)}var k={};a.A.parent||(l=Dq(a,h),h=l.ab,a.A.lang=l.lang);var m=h["float-reference"]&&xm(h["float-reference"].value.toString());a.A.parent&&m&&ym(m)&&(l=Dq(a,h),h=l.ab,a.A.lang=l.lang);a.A.u=Cq(a,a.A.u,h,k);g.pa(f,k);Hq(a,k);Gq(a);k.direction&&(a.A.pa=k.direction.toString());if((l=k["flow-into"])&&l.toString()!=a.H)return N(e,!1),e.result();var p=k.display;if(p===
F)return N(e,!1),e.result();var q=!a.A.parent;a.A.I=p===Zc;Bq(a,f,q,h,k,g,a.b,a.A.oa).then(function(l){a.A.za=l;l=k.position;var r=k["float"],u=k.clear,A=a.A.u?Ed:cd,H=a.A.parent?a.A.parent.u?Ed:cd:A,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.A.Qc=lq(p,l,r,k.overflow,A,H,G);a.A.O=l===qd||l===Ic||l===Yc;Kk(a.A)&&(u!==Jc&&(u=null),r===$c||m&&ym(m)||(r=null));A=r===jd||r===rd||r===Bd||r===Qc||r===hd||r===gd||r===Oc||r===Nc||r===td||r===$c;r&&(delete k["float"],r===$c&&(a.f?(A=!1,k.display=
Mc):k.display=ed));u&&(u===dd&&a.A.parent&&a.A.parent.C&&(u=C(a.A.parent.C)),u===jd||u===rd||u===Pc||u===Jc)&&(delete k.clear,k.display&&k.display!=ed&&(a.A.C=u.toString()));var I=p===kd&&k["ua-list-item-count"];(A||k["break-inside"]&&k["break-inside"]!==Lc)&&a.A.l++;if(!(u=!A&&!p))a:switch(p.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":u=!0;break a;default:u=!1}if(!u)a:switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u=
!0;break a;default:u=!1}a.A.ta=u;a.A.display=p?p.toString():"inline";a.A.ya=A?r.toString():null;a.A.H=m||Ek;a.A.W=k["column-span"];if(!a.A.ta){if(u=k["break-after"])a.A.G=u.toString();if(u=k["break-before"])a.A.g=u.toString()}a.A.T=k["vertical-align"]&&k["vertical-align"].toString()||"baseline";a.A.Z=k["caption-side"]&&k["caption-side"].toString()||"top";u=k["border-collapse"];if(!u||u===C("separate"))if(A=k["border-spacing"])A.wd()?(u=A.values[0],A=A.values[1]):u=A,u.jc()&&(a.A.ha=Hc(u,a.b)),A.jc()&&
(a.A.Qd=Hc(A,a.b));if(u=k["x-first-pseudo"])a.A.f=new Dk(a.A.parent?a.A.parent.f:null,u.L);a.A.ta||Lq(a,f,h,g,a.b);if(u=k["white-space"])u=mk(u.toString()),null!==u&&(a.A.ac=u);(u=k["hyphenate-character"])&&u!==Lc&&(a.A.h=u.Hc);u=k["overflow-wrap"]||["word-wrap"];a.A.w=k["word-break"]===Sc||u===Tc;Iq(a.A,b,p,l,r,q);a.A.parent&&a.A.parent.F&&(b=a.A.parent.F.Ie(a.A,b));a.A.ta||(a.A.j=Mq(k),Nq(a,f,g));var J=!1,Pa=null,Da=[],ua=f.namespaceURI,M=f.localName;if("http://www.w3.org/1999/xhtml"==ua)"html"==
M||"body"==M||"script"==M||"link"==M||"meta"==M?M="div":"vide_"==M?M="video":"audi_"==M?M="audio":"object"==M&&(J=!!a.g),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(M="img");else if("http://www.idpf.org/2007/ops"==ua)M="span",ua="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ua){ua="http://www.w3.org/1999/xhtml";if("image"==M){if(M="div",(l=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==l.charAt(0)&&(l=
Nj(a.aa,l)))Pa=Oq(a,ua,"img"),l="data:"+(l.getAttribute("content-type")||"image/jpeg")+";base64,"+l.textContent.replace(/[ \t\n\t]/g,""),Da.push(se(Pa,l))}else M=Eq[M];M||(M=a.A.ta?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ua)if(ua="http://www.w3.org/1999/xhtml","ncx"==M||"navPoint"==M)M="div";else if("navLabel"==M){if(M="span",r=f.parentNode){l=null;for(r=r.firstChild;r;r=r.nextSibling)if(1==r.nodeType&&(u=r,"http://www.daisy.org/z3986/2005/ncx/"==u.namespaceURI&&"content"==u.localName)){l=
u.getAttribute("src");break}l&&(M="a",f=f.ownerDocument.createElementNS(ua,"a"),f.setAttribute("href",l))}}else M="span";else"http://www.pyroxy.com/ns/shadow"==ua?(ua="http://www.w3.org/1999/xhtml",M=a.A.ta?"span":"div"):J=!!a.g;I?b?M="li":(M="div",p=Mc,k.display=p):"body"==M||"li"==M?M="div":"q"==M?M="span":"a"==M&&(l=k["hyperlink-processing"])&&"normal"!=l.toString()&&(M="span");k.behavior&&"none"!=k.behavior.toString()&&a.g&&(J=!0);f.dataset&&"true"===f.getAttribute("data-math-typeset")&&(J=!0);
var Za;J?Za=a.g(f,a.A.parent?a.A.parent.B:null,k):Za=L(null);Za.then(function(g){g?J&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Oq(a,ua,M);"a"==M&&g.addEventListener("click",a.page.J,!1);Pa&&(qo(a,a.A,"inner",Pa),g.appendChild(Pa));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&sq(g);var h=a.A.vb["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Lc||!m&&!q,p=p===Lc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=
f.namespaceURI||"td"==M){for(var q=f.attributes,u=q.length,r=null,z=0;z<u;z++){var A=q[z],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==G&&(A=Fq(a,A));else{if(G.match(/^on/))continue;if("style"==G)continue;if(("id"==G||"name"==G)&&b){A=a.j.oe(A,a.aa.url);g.setAttribute(G,A);jk(a.page,g,A);continue}"src"==G||"href"==G||"poster"==G?(A=Fq(a,A),"href"===G&&(A=a.j.fd(A,a.aa.url))):"srcset"==G&&(A=A.split(",").map(function(b){return Fq(a,
b.trim())}).join(","));if("poster"===G&&"video"===M&&"http://www.w3.org/1999/xhtml"===ua&&m&&p){var Za=new Image,Cc=se(Za,A);Da.push(Cc);l.push({qf:Za,element:g,jf:Cc})}}"http://www.w3.org/2000/svg"==ua&&/^[A-Z\-]+$/.test(G)&&(G=G.toLowerCase());-1!=Pq.indexOf(G.toLowerCase())&&(A=mq(A,a.aa.url,a.j));H&&(Za=rq[H])&&(G=Za+":"+G);"src"!=G||H||"img"!=M&&"input"!=M||"http://www.w3.org/1999/xhtml"!=ua?"href"==G&&"image"==M&&"http://www.w3.org/2000/svg"==ua&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(se(g,
A)):H?g.setAttributeNS(H,G,A):g.setAttribute(G,A):r=A}r&&(Za="input"===M?new Image:g,q=se(Za,r),Za!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&l.push({qf:Za,element:g,jf:q}),Da.push(q)):a.page.j.push(q))}delete k.content;(m=k["list-style-image"])&&m instanceof Fc&&(m=m.url,Da.push(se(new Image,m)));Qq(a,k);Rq(a,g,k);if(!a.A.ta&&(m=null,b?c&&(m=a.A.u?qq:pq):m="clone"!==a.A.vb["box-decoration-break"]?a.A.u?oq:nq:a.A.u?qq:pq,m))for(var Oo in m)w(g,Oo,m[Oo]);I&&g.setAttribute("value",k["ua-list-item-count"].stringValue());
a.B=g;Da.length?re(Da).then(function(){0<h&&Sq(a,l,h,k,a.A.u);N(e,d)}):ke().then(function(){N(e,d)})})});return e.result()}function Lq(a,b,c,d,e){var f=yq(c,a.w,a.f,e);f&&f["after-if-continues"]&&f["after-if-continues"].content&&(a.A.J=new Tq(b,new wq(b,c,d,e)))}var Pq="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Sq(a,b,c,d,e){b.forEach(function(b){if("load"===b.jf.get().get()){var f=b.qf,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Rc&&(d["border-left-style"]!==F&&(h+=Hc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Hc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Hc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Hc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?w(b,"max-width",
h+"px"):l!==F&&k===F?w(b,"width",h+"px"):l===F&&k!==F?w(b,"height",f+"px"):"%"!==l.ga?w(b,"max-width",Math.min(h,Hc(l,a.b))+"px"):"%"!==k.ga?w(b,"max-height",Math.min(f,Hc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Kd,k=d["min-height"]||Kd,l.L||k.L?l.L&&!k.L?w(b,"width",h+"px"):!l.L&&k.L?w(b,"height",f+"px"):"%"!==l.ga?w(b,"min-width",Math.max(h,Hc(l,a.b))+"px"):"%"!==k.ga?w(b,"min-height",Math.max(f,Hc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+
"px"):w(b,"min-width",h+"px"))}})}function Qq(a,b){Qd("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.A,b)})}function Nq(a,b,c){for(b=b.firstChild;b;b=b.nextSibling)if(1===b.nodeType){var d={},e=c.l(b,!1);Cq(a,a.A.u,e,d);if(Mq(d)){if(a.A.F instanceof Ko&&!Mk(a.A,a.A.F))break;c=a.A.parent;a.A.F=new Ko(c&&c.F,a.A.N);Uq(a.A.F,a.A.u);break}}}function Mq(a){var b=a["repeat-on-break"];return b!==F&&(b===Lc&&(b=a.display===Ad?bd:a.display===zd?ad:F),b&&b!==F)?b.toString():null}
function Vq(a){var b=K("createTextNodeView");Wq(a).then(function(){var c=a.ja||0,c=Xq(a.A.Ha).substr(c);a.B=document.createTextNode(c);N(b,!0)});return b.result()}function Wq(a){if(a.A.Ha)return L(!0);var b,c=b=a.N.textContent,d=K("preprocessTextContent"),e=Qd("PREPROCESS_TEXT_CONTENT"),f=0;me(function(){return f>=e.length?L(!1):e[f++](a.A,c).fa(function(a){c=a;return L(!0)})}).then(function(){a.A.Ha=Yq(b,c,0);N(d,!0)});return d.result()}
function Zq(a,b,c){var d=K("createNodeView"),e=!0;1==a.N.nodeType?b=Jq(a,b,c):8==a.N.nodeType?(a.B=null,b=L(!0)):b=Vq(a);b.then(function(b){e=b;(a.A.B=a.B)&&(b=a.A.parent?a.A.parent.B:a.O)&&b.appendChild(a.B);N(d,e)});return d.result()}function Pn(a,b,c,d){(a.A=b)?(a.N=b.N,a.ja=b.ja):(a.N=null,a.ja=-1);a.B=null;return a.A?Zq(a,c,!!d):L(!0)}
function $q(a){if(null==a.oa||"content"!=a.N.localName||"http://www.pyroxy.com/ns/shadow"!=a.N.namespaceURI)return a;var b=a.Ca,c=a.oa,d=a.parent,e,f;c.Se?(f=c.Se,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Wc,e=c.ka.firstChild,c=2);var g=a.N.nextSibling;g?(a.N=g,Fk(a)):a.ua?a=a.ua:e?a=null:(a=a.parent.modify(),a.M=!0);if(e)return b=new Ak(e,d,b),b.oa=f,b.Za=c,b.ua=a,b;a.Ca=b;return a}
function ar(a){var b=a.Ca+1;if(a.M){if(!a.parent)return null;if(3!=a.Za){var c=a.N.nextSibling;if(c)return a=a.modify(),a.Ca=b,a.N=c,Fk(a),$q(a)}if(a.ua)return a=a.ua.modify(),a.Ca=b,a;a=a.parent.modify()}else{if(a.za&&(c=a.za.root,2==a.za.type&&(c=c.firstChild),c))return b=new Ak(c,a,b),b.oa=a.za,b.Za=a.za.type,$q(b);if(c=a.N.firstChild)return $q(new Ak(c,a,b));1!=a.N.nodeType&&(c=Xq(a.Ha),b+=c.length-1-a.ja);a=a.modify()}a.Ca=b;a.M=!0;return a}
function hm(a,b,c){b=ar(b);if(!b||b.M)return L(b);var d=K("nextInTree");Pn(a,b,!0,c).then(function(a){b.B&&a||(b=b.modify(),b.M=!0,b.B||(b.ta=!0));Ua(this,{type:"nextInTree",A:b});N(d,b)}.bind(a));return d.result()}function br(a,b){if(b instanceof sc)for(var c=b.values,d=0;d<c.length;d++)br(a,c[d]);else b instanceof Fc&&(c=b.url,a.page.j.push(se(new Image,c)))}var cr={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Rq(a,b,c){var d=c["background-image"];d&&br(a,d);var d=c.position===qd,e;for(e in c)if(!cr[e]){var f=c[e],f=f.ba(new Ag(a.aa.url,a.j));f.jc()&&zb(f.ga)&&(f=new D(Hc(f,a.b),"px"));bk[e]||d&&ck[e]?a.page.w.push(new dk(b,e,f)):w(b,e,f.toString())}}function qo(a,b,c,d){if(!b.M){var e=(b.oa?b.oa.b:a.l).l(a.N,!1);if(e=e._pseudos)if(e=e[c])c={},b.u=Cq(a,b.u,e,c),b=c.content,il(b)&&(b.ba(new hl(d,a.b,b)),delete c.content),Rq(a,d,c)}}
function Sn(a,b,c){var d=K("peelOff"),e=b.f,f=b.ja,g=b.M;if(0<c)b.B.textContent=b.B.textContent.substr(0,c),f+=c;else if(!g&&b.B&&!f){var h=b.B.parentNode;h&&h.removeChild(b.B)}for(var l=b.Ca+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.ua;me(function(){for(;0<k.length;){m=k.pop();b=new Ak(m.N,b,l);k.length||(b.ja=f,b.M=g);b.Za=m.Za;b.oa=m.oa;b.za=m.za;b.ua=m.ua?m.ua:p;p=null;var c=Pn(a,b,!1);if(c.Pa())return c}return L(!1)}).then(function(){N(d,b)});return d.result()}
function Oq(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.D.createElement(c):a.D.createElementNS(b,c)}function Wo(a){a&&Lk(a,function(a){var b=a.vb["box-decoration-break"];b&&"slice"!==b||(b=a.B,a.u?(w(b,"padding-left","0"),w(b,"border-left","none"),w(b,"border-top-left-radius","0"),w(b,"border-bottom-left-radius","0")):(w(b,"padding-bottom","0"),w(b,"border-bottom","none"),w(b,"border-bottom-left-radius","0"),w(b,"border-bottom-right-radius","0")))})}
function dr(a){this.b=a.h;this.window=a.window}function er(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function Bn(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return er(a,d)},a)}function lk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return er(c,d)}function fo(a,b){return a.window.getComputedStyle(b,null)}
function fr(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=fo(new dr(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}fr.prototype.zoom=function(a,b,c){w(this.g,"width",a*c+"px");w(this.g,"height",b*c+"px");w(this.f,"width",a+"px");w(this.f,"height",b+"px");w(this.f,"transform","scale("+c+")")};var ro="min-content inline size",pn="fit-content inline size";
function on(a,b,c){function d(c){return fo(a,b).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(Pa)}function f(){w(b,"display","inline-block");w(G,Pa,"99999999px");var a=d(Pa);w(G,Pa,"");return a}function g(){w(b,"display","inline-block");w(G,Pa,"0");var a=d(Pa);w(G,Pa,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,G=b.ownerDocument.createElement("div");w(G,"position",m);H.insertBefore(G,b);G.appendChild(b);w(b,"width","auto");w(b,"max-width","none");w(b,"min-width","0");w(b,"height","auto");w(b,"max-height","none");w(b,"min-height","0");var I=za("writing-mode"),I=(I?d(I[0]):null)||d("writing-mode"),J="vertical-rl"===I||"tb-rl"===I||"vertical-lr"===
I||"tb-lr"===I,Pa=J?"height":"width",Da=J?"width":"height",ua={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case ro:c=g();break;case pn:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Da);break;case "fill-available width":c=J?l():e();break;case "fill-available height":c=J?e():l();break;case "max-content width":c=
J?d(Da):f();break;case "max-content height":c=J?f():d(Da);break;case "min-content width":c=J?d(Da):g();break;case "min-content height":c=J?g():d(Da);break;case "fit-content width":c=J?d(Da):h();break;case "fit-content height":c=J?h():d(Da)}ua[a]=parseFloat(c);w(b,"position",m);w(b,"display",k)});w(b,"width",p);w(b,"max-width",q);w(b,"min-width",r);w(b,"height",z);w(b,"max-height",u);w(b,"min-height",A);H.insertBefore(b,G);H.removeChild(G);return ua};function gr(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Dd||b!==Ed&&a!==vd?"ltr":"rtl"}
var hr={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},ir=new D(.24,"pt"),jr=new D(3,"mm"),kr=new D(10,"mm"),lr=new D(13,"mm");
function mr(a){var b={width:Id,height:Jd,ec:Kd,Jb:Kd},c=a.size;if(c&&c.value!==Lc){var d=c.value;d.wd()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.jc())b.width=c,b.height=d||c;else if(c=hr[c.name.toLowerCase()])d&&d===id?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.Jb=lr);a=a.bleed;a&&a.value!==Lc?a.value&&a.value.jc()&&(b.ec=a.value):c&&(a=!1,c.value.wd()?a=c.value.values.some(function(a){return a===Uc}):a=c.value===Uc,a&&(b.ec=new D(6,
"pt")));return b}function nr(a,b){var c={},d=a.ec.L*Cb(b,a.ec.ga,!1),e=a.Jb.L*Cb(b,a.Jb.ga,!1),f=d+e,g=a.width;c.Tb=g===Id?b.X.fc?b.X.fc.width*Cb(b,"px",!1):(b.X.rb?Math.floor(b.Sa/2)-b.X.Ec:b.Sa)-2*f:g.L*Cb(b,g.ga,!1);g=a.height;c.Sb=g===Jd?b.X.fc?b.X.fc.height*Cb(b,"px",!1):b.Db-2*f:g.L*Cb(b,g.ga,!1);c.ec=d;c.Jb=e;c.Ud=f;return c}function or(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function pr(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var qr={Bg:"top left",Cg:"top right",og:"bottom left",pg:"bottom right"};
function rr(a,b,c,d,e,f){var g=d;g<=e+2*yb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=or(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=pr(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=pr(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var sr={Ag:"top",ng:"bottom",Jf:"left",Kf:"right"};
function tr(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=or(a,g,f),l=pr(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=pr(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=pr(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(sr).forEach(function(a){a=
sr[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function ur(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.wd()?a.values.forEach(function(a){a===Uc?e=!0:a===Vc&&(f=!0)}):a===Uc?e=!0:a===Vc&&(f=!0);if(e||f){var g=c.K,h=g.ownerDocument,l=b.ec,k=Hc(ir,d),m=Hc(jr,d),p=Hc(kr,d);e&&Object.keys(qr).forEach(function(a){a=rr(h,qr[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(sr).forEach(function(a){a=tr(h,sr[a],k,p,m);g.appendChild(a)})}}
var vr=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),wr={"top-left-corner":{order:1,Oa:!0,La:!1,Ma:!0,Na:!0,sa:null},"top-left":{order:2,
Oa:!0,La:!1,Ma:!1,Na:!1,sa:"start"},"top-center":{order:3,Oa:!0,La:!1,Ma:!1,Na:!1,sa:"center"},"top-right":{order:4,Oa:!0,La:!1,Ma:!1,Na:!1,sa:"end"},"top-right-corner":{order:5,Oa:!0,La:!1,Ma:!1,Na:!0,sa:null},"right-top":{order:6,Oa:!1,La:!1,Ma:!1,Na:!0,sa:"start"},"right-middle":{order:7,Oa:!1,La:!1,Ma:!1,Na:!0,sa:"center"},"right-bottom":{order:8,Oa:!1,La:!1,Ma:!1,Na:!0,sa:"end"},"bottom-right-corner":{order:9,Oa:!1,La:!0,Ma:!1,Na:!0,sa:null},"bottom-right":{order:10,Oa:!1,La:!0,Ma:!1,Na:!1,sa:"end"},
"bottom-center":{order:11,Oa:!1,La:!0,Ma:!1,Na:!1,sa:"center"},"bottom-left":{order:12,Oa:!1,La:!0,Ma:!1,Na:!1,sa:"start"},"bottom-left-corner":{order:13,Oa:!1,La:!0,Ma:!0,Na:!1,sa:null},"left-bottom":{order:14,Oa:!1,La:!1,Ma:!0,Na:!1,sa:"end"},"left-middle":{order:15,Oa:!1,La:!1,Ma:!0,Na:!1,sa:"center"},"left-top":{order:16,Oa:!1,La:!1,Ma:!0,Na:!1,sa:"start"}},xr=Object.keys(wr).sort(function(a,b){return wr[a].order-wr[b].order});
function yr(a,b,c){wp.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=mr(c);new zr(this.f,this,c,a);this.D={};Ar(this,c);this.b.position=new V(qd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)vr[d]||"background-clip"===d||(this.b[d]=c[d])}t(yr,wp);function Ar(a,b){var c=b._marginBoxes;c&&xr.forEach(function(d){c[d]&&(a.D[d]=new Br(a.f,a,d,b))})}yr.prototype.h=function(a){return new Cr(a,this)};
function zr(a,b,c,d){Ap.call(this,a,null,null,[],b);this.G=d;this.b["z-index"]=new V(new Bc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Ic,0);this.b.overflow=new V(Fd,0);for(var e in vr)vr.hasOwnProperty(e)&&(this.b[e]=c[e])}t(zr,Ap);zr.prototype.h=function(a){return new Dr(a,this)};
function Br(a,b,c,d){Ap.call(this,a,null,null,[],b);this.C=c;a=d._marginBoxes[this.C];for(var e in d)if(b=d[e],c=a[e],mh[e]||c&&c.value===dd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==dd&&(this.b[e]=b)}t(Br,Ap);Br.prototype.h=function(a){return new Er(a,this)};function Cr(a,b){xp.call(this,a,b);this.l=null;this.pa={}}t(Cr,xp);
Cr.prototype.j=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}xp.prototype.j.call(this,a,b)};Cr.prototype.ae=function(){var a=this.style;a.left=Kd;a["margin-left"]=Kd;a["border-left-width"]=Kd;a["padding-left"]=Kd;a["padding-right"]=Kd;a["border-right-width"]=Kd;a["margin-right"]=Kd;a.right=Kd};
Cr.prototype.be=function(){var a=this.style;a.top=Kd;a["margin-top"]=Kd;a["border-top-width"]=Kd;a["padding-top"]=Kd;a["padding-bottom"]=Kd;a["border-bottom-width"]=Kd;a["margin-bottom"]=Kd;a.bottom=Kd};Cr.prototype.Z=function(a,b,c){b=b.I;var d={start:this.l.marginLeft,end:this.l.marginRight,na:this.l.yc},e={start:this.l.marginTop,end:this.l.marginBottom,na:this.l.xc};Fr(this,b.top,!0,d,a,c);Fr(this,b.bottom,!0,d,a,c);Fr(this,b.left,!1,e,a,c);Fr(this,b.right,!1,e,a,c)};
function Gr(a,b,c,d,e){this.K=a;this.D=e;this.j=c;this.C=!Y(d,b[c?"width":"height"],new ec(d,0,"px"));this.l=null}Gr.prototype.b=function(){return this.C};function Hr(a){a.l||(a.l=on(a.D,a.K.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}Gr.prototype.g=function(){var a=Hr(this);return this.j?Xk(this.K)+a["max-content width"]+Yk(this.K):Vk(this.K)+a["max-content height"]+Wk(this.K)};
Gr.prototype.h=function(){var a=Hr(this);return this.j?Xk(this.K)+a["min-content width"]+Yk(this.K):Vk(this.K)+a["min-content height"]+Wk(this.K)};Gr.prototype.f=function(){return this.j?Xk(this.K)+this.K.width+Yk(this.K):Vk(this.K)+this.K.height+Wk(this.K)};function Ir(a){this.j=a}Ir.prototype.b=function(){return this.j.some(function(a){return a.b()})};Ir.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Ir.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Ir.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Jr(a,b,c,d,e,f){Gr.call(this,a,b,c,d,e);this.w=f}t(Jr,Gr);Jr.prototype.b=function(){return!1};Jr.prototype.g=function(){return this.f()};Jr.prototype.h=function(){return this.f()};Jr.prototype.f=function(){return this.j?Xk(this.K)+this.w+Yk(this.K):Vk(this.K)+this.w+Wk(this.K)};
function Fr(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b){var p=wr[m];if(p){var q=b[m],r=a.pa[m],z=new Gr(q,r.style,c,g,f);h[p.sa]=q;l[p.sa]=r;k[p.sa]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.na.evaluate(e);var u=Kr(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.na);b&&(b=b.evaluate(e),u[a]>b&&(b=k[a]=new Jr(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(u=Kr(k,b),A=!1,["start","center","end"].forEach(function(a){u[a]=H[a]||u[a]}));
var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.na);b&&(b=b.evaluate(e),u[a]<b&&(b=k[a]=new Jr(h[a],l[a].style,c,g,f,b),G[a]=b.f(),A=!0))});A&&(u=Kr(k,b),["start","center","end"].forEach(function(a){u[a]=G[a]||u[a]}));var I=a+b,J=a+(a+b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(J-b)/2;break;case "end":e=I-b}c?bl(d,e,b-Xk(d)-Yk(d)):al(d,e,b-Vk(d)-Wk(d))}})}
function Kr(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Lr(d,g.length?new Ir(g):null,b);g.mb&&(f.center=g.mb);d=g.mb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Lr(c,e,b),c.mb&&(f.start=c.mb),c.jd&&(f.end=c.jd);return f}
function Lr(a,b,c){var d={mb:null,jd:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.mb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.mb=a+(c-b)*(e-a)/(f-b):0<b&&(d.mb=c*a/b)),0<d.mb&&(d.jd=c-d.mb)):0<e?d.mb=c:0<f&&(d.jd=c)}else a.b()?d.mb=Math.max(c-b.f(),0):b.b()&&(d.jd=Math.max(c-a.f(),0));else a?a.b()&&(d.mb=c):b&&b.b()&&(d.jd=c);return d}Cr.prototype.Ub=function(a,b,c,d,e){Cr.If.Ub.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function Dr(a,b){Bp.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.xc=this.yc=null}t(Dr,Bp);
Dr.prototype.j=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);Bp.prototype.j.call(this,a,b);d=this.f;c={yc:this.yc,xc:this.xc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l=c;d=d.style;d.width=new E(c.yc);d.height=new E(c.xc);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};Dr.prototype.ae=function(){var a=Mr(this,{start:"left",end:"right",na:"width"});this.yc=a.$e;this.marginLeft=a.Af;this.marginRight=a.zf};Dr.prototype.be=function(){var a=Mr(this,{start:"top",end:"bottom",na:"height"});this.xc=a.$e;this.marginTop=a.Af;this.marginBottom=a.zf};
function Mr(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.na,h=a.b.G[g].ra(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=Cp(d,c["padding-"+e],h),q=Cp(d,c["padding-"+f],h),r=Ep(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=Ep(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),u=y(d,h,x(d,x(d,r,p),x(d,z,q)));l?(u=y(d,u,l),k||m?k?m=y(d,u,k):k=y(d,u,m):m=k=mc(d,u,new tb(d,.5))):(k||(k=d.b),m||(m=d.b),l=y(d,u,x(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Kd;c["margin-"+f]=Kd;c["padding-"+e]=new E(p);c["padding-"+f]=new E(q);c["border-"+e+"-width"]=new E(r);c["border-"+f+"-width"]=new E(z);c[g]=new E(l);c["max-"+g]=new E(l);return{$e:y(d,h,x(d,k,m)),Af:k,zf:m}}Dr.prototype.Ub=function(a,b,c,d,e){Bp.prototype.Ub.call(this,a,b,c,d,e);c.O=b.element};function Er(a,b){Bp.call(this,a,b);var c=b.C;this.l=wr[c];a.pa[c]=this;this.va=!0}t(Er,Bp);n=Er.prototype;
n.Ub=function(a,b,c,d,e){var f=b.element;w(f,"display","flex");var g=Op(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(w(f,"flex-flow",this.u?"row":"column"),w(f,"justify-content",h));Bp.prototype.Ub.call(this,a,b,c,d,e)};
n.sa=function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left"===e,h=g?b.yc:b.xc,l=Y(d,c[a.na],h),g=g?b.marginLeft:b.marginTop;if("start"===this.l.sa)c[e]=new E(g);else if(l){var k=Cp(d,c["margin-"+e],h),m=Cp(d,c["margin-"+f],h),p=Cp(d,c["padding-"+e],h),q=Cp(d,c["padding-"+f],h),r=Ep(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=Ep(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=x(d,l,x(d,x(d,p,q),x(d,x(d,r,f),x(d,k,m))));switch(this.l.sa){case "center":c[e]=new E(x(d,
g,nc(d,y(d,h,l),new tb(d,2))));break;case "end":c[e]=new E(y(d,x(d,g,h),l))}}};
function Nr(a,b,c){function d(a){if(u)return u;u={na:z?z.evaluate(a):null,eb:l?l.evaluate(a):null,fb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b&&(c+=b.evaluate(a))});(null===u.eb||null===u.fb)&&c+u.na+u.eb+u.fb>b&&(null===u.eb&&(u.eb=0),null===u.fb&&(u.Hg=0));null!==u.na&&null!==u.eb&&null!==u.fb&&(u.fb=null);null===u.na&&null!==u.eb&&null!==u.fb?u.na=b-c-u.eb-u.fb:null!==u.na&&null===u.eb&&null!==u.fb?u.eb=b-c-u.na-u.fb:null!==u.na&&null!==u.eb&&null===u.fb?u.fb=
b-c-u.na-u.eb:null===u.na?(u.eb=u.fb=0,u.na=b-c):u.eb=u.fb=(b-c-u.na)/2;return u}var e=a.style;a=a.b.f;var f=b.ce,g=b.he;b=b.na;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=Dp(a,e["margin-"+f],h),k=Dp(a,e["margin-"+g],h),m=Cp(a,e["padding-"+f],h),p=Cp(a,e["padding-"+g],h),q=Ep(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),r=Ep(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),u=null;e[b]=new E(new vb(a,function(){var a=d(this).na;return null===a?0:a},b));e["margin-"+
f]=new E(new vb(a,function(){var a=d(this).eb;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new vb(a,function(){var a=d(this).fb;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(x(a,c.marginLeft,c.yc)):"top"===f&&(e.top=new E(x(a,c.marginTop,c.xc)))}n.ae=function(){var a=this.f.l;this.l.Ma?Nr(this,{ce:"right",he:"left",na:"width"},a):this.l.Na?Nr(this,{ce:"left",he:"right",na:"width"},a):this.sa({start:"left",end:"right",na:"width"},a)};
n.be=function(){var a=this.f.l;this.l.Oa?Nr(this,{ce:"bottom",he:"top",na:"height"},a):this.l.La?Nr(this,{ce:"top",he:"bottom",na:"height"},a):this.sa({start:"top",end:"bottom",na:"height"},a)};n.sd=function(a,b,c,d,e,f,g){Bp.prototype.sd.call(this,a,b,c,d,e,f,g);a=c.I;c=this.b.C;d=this.l;d.Ma||d.Na?d.Oa||d.La||(d.Ma?a.left[c]=b:d.Na&&(a.right[c]=b)):d.Oa?a.top[c]=b:d.La&&(a.bottom[c]=b)};
function Or(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new fc(a,"page-number");b=new Yb(a,new dc(a,b,new tb(a,2)),a.b);c=new Ob(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===gr(this.g)?(a.values["left-page"]=b,b=new Ob(a,b),a.values["right-page"]=b):(c=new Ob(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Pr(a){var b={};bj(a.b,[],"",b);a.b.pop();return b}
function Qr(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":Qr(a,e);c.push(d+f+(e.Ua||""))}return c.sort().join("^")}function Rr(a,b,c){c=c.clone({Wb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=mr(b),e=e.Ua;d.width=Ah(a.f,d.width,new V(f.width,e));d.height=Ah(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.j(a.b,a.g);dq(c,a.f);return c}
function Sr(a){this.b=null;this.h=a}t(Sr,W);Sr.prototype.apply=function(a){a.Z===this.h&&this.b.apply(a)};Sr.prototype.f=function(){return 3};Sr.prototype.g=function(a){this.b&&Rh(a.Vc,this.h,this.b);return!0};function Tr(a){this.b=null;this.h=a}t(Tr,W);Tr.prototype.apply=function(a){1===(new fc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Tr.prototype.f=function(){return 2};function Ur(a){this.b=null;this.h=a}t(Ur,W);
Ur.prototype.apply=function(a){(new fc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Ur.prototype.f=function(){return 1};function Vr(a){this.b=null;this.h=a}t(Vr,W);Vr.prototype.apply=function(a){(new fc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Vr.prototype.f=function(){return 1};function Wr(a){this.b=null;this.h=a}t(Wr,W);Wr.prototype.apply=function(a){(new fc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Wr.prototype.f=function(){return 1};
function Xr(a){this.b=null;this.h=a}t(Xr,W);Xr.prototype.apply=function(a){(new fc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Xr.prototype.f=function(){return 1};function Yr(a,b){Oh.call(this,a,b,null,null,null)}t(Yr,Oh);Yr.prototype.apply=function(a){var b=a.l,c=a.G,d=this.style;a=this.Y;Hh(b,c,d,a,null,null,null);if(d=d._marginBoxes){var c=Eh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);Hh(b,f,d[e],a,null,null,null)}}};
function Zr(a,b,c,d,e){mj.call(this,a,b,null,c,null,d,!1);this.T=e;this.I=[];this.g="";this.G=[]}t(Zr,mj);n=Zr.prototype;n.Fc=function(){this.yb()};n.Gb=function(a,b){if(this.g=b)this.b.push(new Sr(b)),this.Y+=65536};
n.Xc=function(a,b){b&&rf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.G.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Tr(this.f));this.Y+=256;break;case "left":this.b.push(new Ur(this.f));this.Y+=1;break;case "right":this.b.push(new Vr(this.f));this.Y+=1;break;case "recto":this.b.push(new Wr(this.f));this.Y+=1;break;case "verso":this.b.push(new Xr(this.f));this.Y+=1;break;default:rf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function $r(a){var b;a.g||a.G.length?b=[a.g].concat(a.G.sort()):b=null;a.I.push({Pe:b,Y:a.Y});a.g="";a.G=[]}n.Dc=function(){$r(this);mj.prototype.Dc.call(this)};n.Aa=function(){$r(this);mj.prototype.Aa.call(this)};
n.xb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.I.some(function(a){return!a.Pe})){mj.prototype.xb.call(this,a,b,c);var d=this.ab[a],e=this.T;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Dh(e[b],a,d)});else if("size"===a){var f=e[""];this.I.forEach(function(b){var c=new V(d.value,d.Ua+b.Y);b=b.Pe?b.Pe.join(""):"";var g=e[b];g?(c=(b=g[a])?Ah(null,c,b):c,Dh(g,a,c)):(g=e[b]={},Dh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Dh(g,a,f[a])},this))},this)}}};
n.tf=function(a){Rh(this.l.Vc,"*",a)};n.yf=function(a){return new Yr(this.ab,a)};n.ne=function(a){var b=Eh(this.ab,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);nf(this.ka,new as(this.f,this.ka,this.C,c))};function as(a,b,c,d){of.call(this,a,b,!1);this.g=c;this.b=d}t(as,pf);as.prototype.wb=function(a,b,c){kh(this.g,a,b,c,this)};as.prototype.Sc=function(a,b){qf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};as.prototype.Kd=function(a,b){qf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
as.prototype.xb=function(a,b,c){Dh(this.b,a,new V(b,c?kf(this):lf(this)))};var bs=new pe(function(){var a=K("uaStylesheetBase");lh.get().then(function(b){var c=oa("user-agent-base.css",na);b=new mj(null,null,null,null,null,b,!0);b.Gc("UA");lj=b.l;Rf(c,b,null,null).Ba(a)});return a.result()},"uaStylesheetBaseFetcher");
function cs(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.I=e;this.j=f;this.D=a.T;this.G=g;this.h=h;this.C=l;this.H=k;this.w=a.l;xb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=ds(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.D:!1;return d&&!!c&&!es(this,c)});wb(this.b,new vb(this.b,function(){return this.Z+this.b.page},"page-number"))}
function fs(a,b,c,d){if(a.C.length){var e=new Ab(0,b,c,d);a=a.C;for(var f={},g=0;g<a.length;g++)Hh(e,f,a[g],0,null,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=yb.em,(h?h.evaluate(e,"text-zoom"):null)===sd&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Hc(g.evaluate(e,"width"),e),e=Hc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function gs(a,b,c,d,e,f,g,h,l,k,m){Ab.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.aa=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.C=this.b=this.I=this.f=this.G=null;this.D=0;this.Bb=f;this.h=new Wl(this.style.D);this.Ia={};this.W=null;this.j=m;this.Cb=new Hm(null,null,null,null,null,null,null);this.T={};this.va=null;this.sb=g;this.Ab=h;this.Z=l;this.tb=k;for(var p in a.h)(b=a.h[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Jc?this.l[p]=!0:delete this.l[p]);
this.Ra={};this.la=this.ha=0}t(gs,Ab);
function hs(a){var b=K("StyleInstance.init"),c=new ap(a.j,a.aa.url),d=new $o(a.j,a.aa.url,a.style.f,a.style.b);a.f=new Dl(a.aa,a.style.g,a.style.f,a,a.l,a.style.w,c,d);d.h=a.f;Nl(a.f,a);a.I={};a.I[a.aa.url]=a.f;var e=Kl(a.f);a.va=gr(e);a.G=new eq(a.style.I);c=new Wi(a.style.g,a,c,d);a.G.j(c,e);dq(a.G,a);a.W=new Or(c,a.style.b,a.G,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.ea||d.ea.evaluate(a))d=Tl(d.mc,a),d=new Ul(d),e.push(d);bm(a.Bb,e,a.h).Ba(b);var f=a.style.H;Object.keys(f).forEach(function(a){var b=
nr(mr(f[a]),this);this.Ra[a]={width:b.Tb+2*b.Ud,height:b.Sb+2*b.Ud}},a);return b.result()}function Ol(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new Qk,a.b[b.b]=c),c.b.push(new Pk(new Nk({ma:[{node:b.element,Za:yk,oa:null,za:null,ua:null,Ka:0}],ja:0,M:!1,Ha:null}),b))}function is(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.f,f=e.ma[0].node,g=e.ja,h=e.M,l=0;f.ownerDocument!=a.aa.b;)l++,f=e.ma[l].node,h=!1,g=0;e=Jj(a.aa,f,g,h);e<c&&(c=e)}return c}
function js(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.O=e;for(var g=0;null!=f.O&&(g+=5E3,Ll(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=is(a,f),f<d&&(d=f))}return d}function ds(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new fc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function ks(a,b){var c=a.b,d=js(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.G.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.b.Wb){var h=1,l=Op(f,a,"utilization");l&&l.Ke()&&(h=l.L);var l=Cb(a,"em",!1),k=a.Tb()*a.Sb();a.D=Ll(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(is(h,m)===p.f){a:switch(p=m.g,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.g=dm(ul(p,m.b[0].b.g))}}}a.C=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.b.kb&&q.b.f<h.D&&(q.b.kb=l)}Bb(a,a.style.b);h=Op(f,a,"enabled");if(!h||h===Gd){c=a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.D);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)v.debug("  Chunk",d+":",e.b[g].b.f);d=a.W;e=f;f=b;c=e.b;Object.keys(f).length?(e=c,g=Qr(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Wb?(c=d,f=(new yr(c.l,c.h.b,
f)).h(c.h),f.j(c.b,c.g),dq(f,c.f),g=f):g=Rr(d,f,c),d.j[e]=g),f=g.b,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function es(a,b){var c=a.C.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=La(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.C.b[d],g=is(a,d);return c<g?!1:g<c?!0:!ds(a,d.g)}return!1}function ls(a,b,c){a=a.b.f[c];a.F||(a.F=new Mn(null));b.xe=a.F}
function ms(a){var b=a.g,c=Wm(b),d=K("layoutDeferredPageFloats"),e=!1,f=0;ne(function(d){if(f===c.length)P(d);else{var g=c[f++],l=g.qa,k=wn(l),m=k.Ue(l,b);m&&Dm(m,l)?O(d):Pm(b,l)||Ym(b,l)?(Xm(b,g),P(d)):no(a,g,k,null,m).then(function(a){a?(a=en(b.parent))?P(d):(en(b)&&!a&&(e=!0,b.Tc=!1),O(d)):P(d)})}}).then(function(){e&&Rm(b);N(d,!0)});return d.result()}
function ns(a,b,c){var d=a.b.b[c];if(!d||!ds(a,d.g))return L(!0);d.g="any";ls(a,b,c);lo(b);a.l[c]&&0<b.va.length&&(b.Ae=!1);var e=K("layoutColumn");ms(b).then(function(){if(en(b.g))N(e,!0);else{var c=[],g=[],h=!0;ne(function(e){for(;0<d.b.length-g.length;){for(var f=0;0<=g.indexOf(f);)f++;var l=d.b[f];if(l.b.f>a.D||es(a,l.b))break;for(var p=f+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var q=d.b[p];if(q.b.f>a.D||es(a,q.b))break;qk(q.b,l.b)&&(l=q,f=p)}var r=l.b,z=!0;nm(b,l.f,h,d.f).then(function(a){if(en(b.g))P(e);
else if(h=!1,!l.b.cg||a&&!r.h||c.push(f),r.h)g.push(f),P(e);else{var k=!!a||!!b.b,m;0<Zm(b.g).length&&b.Ra?a?(m=a.clone(),m.f=b.Ra):m=new Nk(b.Ra):m=null;if(b.b&&m)l.f=m,d.f=b.b,b.b=null;else{g.push(f);if(a||m)l.f=a||m,c.push(f);b.b&&(d.g=dm(b.b))}k?P(e):z?z=!1:O(e)}});if(z){z=!1;return}}P(e)}).then(function(){if(!en(b.g)){d.b=d.b.filter(function(a,b){return 0<=c.indexOf(b)||0>g.indexOf(b)});"column"===d.f&&(d.f=null);var a=sn(b.g);io(b,a)}N(e,!0)})}});return e.result()}
function os(a,b,c,d,e,f,g,h,l,k,m,p,q,r,z){var u=b.u?b.h&&b.O:b.g&&b.T,A=f.element,H=new Hm(l,"column",null,h,null,null,null),G=a.b.clone(),I=K("createAndLayoutColumn"),J;ne(function(b){if(1<k){var I=a.viewport.b.createElement("div");w(I,"position","absolute");A.appendChild(I);J=new lm(I,r,a.g,z,H);J.u=f.u;J.Sa=f.Sa;J.Db=f.Db;f.u?(I=g*(p+m)+f.D,bl(J,f.C,f.width),al(J,I,p)):(I=g*(p+m)+f.C,al(J,f.D,f.height),bl(J,I,p));J.gb=c;J.hb=d}else J=new lm(A,r,a.g,z,H),$k(J,f);J.Ac=u?[]:e.concat();J.Ia=q;Lm(H,
J);0<=J.width?ns(a,J,h).then(function(){en(H)||bn(H);en(J.g)&&!en(l)?(J.g.Tc=!1,a.b=G.clone(),J.element!==A&&A.removeChild(J.element),O(b)):P(b)}):(bn(H),P(b))}).then(function(){N(I,J)});return I.result()}function ps(a,b,c,d,e){var f=Op(c,a,"writing-mode")||null;a=Op(c,a,"direction")||null;return new Hm(b,"region",d,e,null,f,a)}
function qs(a,b,c,d,e,f,g,h){Hp(c);var l=Op(c,a,"enabled");if(l&&l!==Gd)return L(!0);var k=K("layoutContainer"),m=Op(c,a,"wrap-flow")===Lc,l=Op(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=Op(c,a,"position");w(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new Uk(p);r.u=c.u;r.Ac=g;c.Ub(a,r,b,a.h,a.g);r.gb=e;r.hb=f;e+=r.left+r.marginLeft+r.borderLeft;f+=r.top+r.marginTop+r.borderTop;(c instanceof Dr||c instanceof xp&&!(c instanceof Cr))&&Lm(h,r);var z=a.b.clone(),
u=!1;if(l&&l.uf())if(a.T[l.toString()])en(h)||c.sd(a,r,b,null,1,a.g,a.h),l=L(!0);else{var A=K("layoutContainer.inner"),H=l.toString(),G=ps(a,h,c,r,H),I=Z(c,a,"column-count"),J=Z(c,a,"column-gap"),Pa=1<I?Z(c,a,"column-width"):r.width,l=Np(c,a),Da=0,q=Op(c,a,"shape-inside"),ua=xg(q,0,0,r.width,r.height,a),M=new xq(H,a,a.viewport,a.f,l,a.aa,a.h,a.style.G,a,b,a.sb,a.Ab,a.tb),Za=new Zo(a.j,a.b.page-1),Cc=0,Dc=null;ne(function(b){os(a,c,e,f,g,r,Cc++,H,G,I,J,Pa,ua,M,Za).then(function(c){en(h)?P(b):((c.b&&
"column"!==c.b||Cc===I)&&!en(G)&&bn(G),en(G)?(Cc=0,a.b=z.clone(),G.Tc=!1,O(b)):(Dc=c,Dc.b&&"column"!=Dc.b&&(Cc=I,"region"!=Dc.b&&(a.T[H]=!0)),Da=Math.max(Da,Dc.xa),Cc<I?O(b):P(b)))})}).then(function(){if(!en(h)){Dc.element===p&&(r=Dc);r.xa=Da;c.sd(a,r,b,Dc,I,a.g,a.h);var d=a.b.b[H];d&&"region"===d.f&&(d.f=null)}N(A,!0)});l=A.result()}else{if((l=Op(c,a,"content"))&&il(l)){q="span";l.url&&(q="img");var xk=a.viewport.b.createElement(q);l.ba(new hl(xk,a,l));p.appendChild(xk);"img"==q&&cq(c,a,xk,a.h);
bq(c,a,r,a.h)}else c.va&&(d.removeChild(p),u=!0);u||c.sd(a,r,b,null,1,a.g,a.h);l=L(!0)}l.then(function(){if(en(h))N(k,!0);else{if(!c.g||0<Math.floor(r.xa)){if(!u&&!m){var l=Op(c,a,"shape-outside"),l=r.Xd(l,a);g.push(l)}}else if(!c.w.length){d.removeChild(p);N(k,!0);return}var q=c.w.length-1;me(function(){for(;0<=q;){var d=c.w[q--],d=qs(a,b,d,p,e,f,g,h);if(d.Pa())return d.fa(function(){return L(!en(h))});if(en(h))break}return L(!1)}).then(function(){N(k,!0)})}});return k.result()}
function rs(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.b.kb&&f.b.kb+f.b.l-1<=b&&d.b.splice(e,1)}}function ss(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function ts(a,b,c){a.T={};c?(a.b=c.clone(),Gl(a.f,c.g)):(a.b=new Sk,Gl(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;Bb(a,a.style.b);a.C=c.clone();var d=Pr(a.W),e=ks(a,d);if(!e)return L(null);hk(b,e.b.b.width.value===Id);ik(b,e.b.b.height.value===Jd);a.j.j=b;kp(a.j,d,a);var f=nr(mr(d),a);us(a,f,b);ur(d,f,b,a);var g=f.Jb+f.ec,d=Op(e,a,"writing-mode")||cd,f=Op(e,a,"direction")||ld,h=new Hm(a.Cb,"page",null,null,null,d,f),l=K("layoutNextPage");ne(function(c){qs(a,b,e,b.g,g,g,[],h).then(function(){en(h)||
bn(h);en(h)?(a.b=a.C.clone(),h.Tc=!1,O(c)):P(c)})}).then(function(){e.Z(a,b,a.g);var d=new fc(e.b.f,"left-page");b.l=d.evaluate(a)?"left":"right";rs(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&ds(a,d)||(b.f=null)});a.b=a.C=null;c.g=a.f.b;kk(b,a.style.l.O[a.aa.url],a.g);ss(a,c)&&(c=null);N(l,c)});return l.result()}
function us(a,b,c){a.O=b.Tb;a.J=b.Sb;a.la=b.Tb+2*b.Ud;a.ha=b.Sb+2*b.Ud;c.K.style.width=a.la+"px";c.K.style.height=a.ha+"px";c.g.style.left=b.Jb+"px";c.g.style.right=b.Jb+"px";c.g.style.top=b.Jb+"px";c.g.style.bottom=b.Jb+"px";c.g.style.padding=b.ec+"px"}function vs(a,b,c,d){mj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.G=!1}t(vs,mj);n=vs.prototype;n.Hd=function(){};n.Gd=function(a,b,c){a=new wp(this.g.w,a,b,c,this.g.H,this.ea,lf(this.ka));nf(this.g,new jq(a.f,this.g,a,this.C))};
n.qc=function(a){a=a.b;this.ea&&(a=lc(this.f,this.ea,a));nf(this.g,new vs(this.g,a,this,this.H))};n.Dd=function(){nf(this.g,new sj(this.f,this.ka))};n.Fd=function(){var a={};this.g.C.push({mc:a,ea:this.ea});nf(this.g,new tj(this.f,this.ka,null,a,this.g.h))};n.Ed=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);nf(this.g,new tj(this.f,this.ka,null,b,this.g.h))};n.Jd=function(){var a={};this.g.I.push(a);nf(this.g,new tj(this.f,this.ka,this.ea,a,this.g.h))};
n.ad=function(a){var b=this.g.D;if(a){var c=Eh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}nf(this.g,new tj(this.f,this.ka,null,b,this.g.h))};n.Id=function(){this.G=!0;this.yb()};n.Fc=function(){var a=new Zr(this.g.w,this.g,this,this.C,this.g.G);nf(this.g,a);a.Fc()};n.Aa=function(){mj.prototype.Aa.call(this);if(this.G){this.G=!1;var a="R"+this.g.O++,b=C(a),c;this.ea?c=new zh(b,0,this.ea):c=new V(b,0);Gh(this.ab,"region-id").push(c);this.Nb();a=new vs(this.g,this.ea,this,a);nf(this.g,a);a.Aa()}};
function ws(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function xs(a){mf.call(this);this.h=a;this.j=new sb(null);this.w=new sb(this.j);this.H=new tp(this.j);this.J=new vs(this,null,null,null);this.O=0;this.C=[];this.D={};this.l={};this.I=[];this.G={};this.b=this.J}t(xs,mf);
xs.prototype.error=function(a){v.b("CSS parser:",a)};function ys(a,b){return zs(b,a)}function As(a){ef.call(this,ys,"document");this.T=a;this.I={};this.w={};this.f={};this.O={};this.l=null;this.b=[];this.J=!1}t(As,ef);function Bs(a,b,c){Cs(a,b,c);var d=oa("user-agent.xml",na),e=K("OPSDocStore.init");lh.get().then(function(b){a.l=b;bs.get().then(function(){a.load(d).then(function(){a.J=!0;N(e,!0)})})});return e.result()}function Cs(a,b,c){a.b.splice(0);b&&b.forEach(a.W,a);c&&c.forEach(a.Z,a)}
As.prototype.W=function(a){var b=a.url;b&&(b=oa(b,ma));this.b.push({url:b,text:a.text,cb:"Author",Da:null,media:null})};As.prototype.Z=function(a){var b=a.url;b&&(b=oa(b,ma));this.b.push({url:b,text:a.text,cb:"User",Da:null,media:null})};
function zs(a,b){var c=K("OPSDocStore.load"),d=b.url;Rj(b,a).then(function(b){if(b){if(a.J)for(var e=Qd("PREPROCESS_SINGLE_DOCUMENT"),g=0;g<e.length;g++)e[g](b.b);for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g<h.length;g++){var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&e.push({$f:k,event:m,action:p,
Zc:l})}a.O[d]=e;var q=[];q.push({url:oa("user-agent-page.css",na),text:null,cb:"UA",Da:null,media:null});if(g=b.l)for(g=g.firstChild;g;g=g.nextSibling)if(1==g.nodeType)if(e=g,h=e.namespaceURI,k=e.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:e.textContent,cb:"Author",Da:null,media:null});else if("link"==k){if(m=e.getAttribute("rel"),h=e.getAttribute("class"),k=e.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)e=e.getAttribute("href"),e=oa(e,d),q.push({url:e,
text:null,Da:h,media:k,cb:"Author"})}else"meta"==k&&"viewport"==e.getAttribute("name")&&q.push({url:d,text:ws(e),cb:"Author",Da:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==e.getAttribute("type")&&q.push({url:d,text:e.textContent,cb:"Author",Da:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=e.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(e=e.getElementsByTagName("value")[0])&&(e=oa(e.textContent,d),q.push({url:e,
text:null,Da:null,media:null,cb:"Author"}));for(g=0;g<a.b.length;g++)q.push(a.b[g]);for(var r="",g=0;g<q.length;g++)r+=q[g].url,r+="^",q[g].text&&(r+=q[g].text),r+="^";var z=a.I[r];z?(a.f[d]=z,N(c,b)):(g=a.w[r],g||(g=new pe(function(){var b=K("fetchStylesheet"),c=0,d=new xs(a.l);me(function(){if(c<q.length){var a=q[c++];d.Gc(a.cb);return null!==a.text?Sf(a.text,d,a.url,a.Da,a.media).sc(!0):Rf(a.url,d,a.Da,a.media)}return L(!1)}).then(function(){z=new cs(a,d.j,d.w,d.J.l,d.H,d.C,d.D,d.l,d.I,d.G);a.I[r]=
z;delete a.w[r];N(b,z)});return b.result()},"FetchStylesheet "+d),a.w[r]=g,g.start()),g.get().then(function(e){a.f[d]=e;N(c,b)}))}else N(c,null)});return c.result()};function Ds(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Es(a){var b=new Ca;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ds(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Fs(a){a=Es(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Gs(a){a=Es(a);for(var b=new Ca,c=0;c<a.length;c++)b.append(Ds(a[c]));a=b.toString();b=new Ca;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Hs(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.X=kb(f);this.w=g;this.j=h;this.h=l;this.g=k;this.Xa=this.page=null}function Is(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Aa(d,"height","auto")&&(w(d,"height","auto"),Is(a,d,c));"absolute"==Aa(d,"position","static")&&(w(d,"position","relative"),Is(a,d,c))}}
function Js(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Hs.prototype.de=function(a){var b=this.w.de(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",Js,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return L(g)}};
Hs.prototype.Cd=function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=K("showTOC"),h=new gk(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=fs(k,c,1E5,e);b=new fr(b.window,l.fontSize,b.root,l.width,l.height);var p=new gs(k,d,f.lang,b,f.f,f.l,f.de(d),f.j,0,f.h,f.g);f.Xa=p;p.X=f.X;hs(p).then(function(){ts(p,h,null).then(function(){Is(f,a,2);N(g,h)})})});return g.result()};
Hs.prototype.vd=function(){if(this.page){var a=this.page;this.Xa=this.page=null;w(a.K,"visibility","none");var b=a.K.parentNode;b&&b.removeChild(a.K)}};Hs.prototype.Le=function(){return!!this.page};function Ks(){As.call(this,Ls(this));this.g=new ef(Rj,"document");this.G=new ef(gf,"text");this.H={};this.la={};this.C={};this.D={}}t(Ks,As);function Ls(a){return function(b){return a.C[b]}}
function Ms(a,b,c){var d=K("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.G.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=ak(Gj(Gj(Gj(new Hj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){Ns(a,b,h,c).Ba(d);return}}N(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return d.result()}function Ns(a,b,c,d){var e=b+c,f=a.H[e];if(f)return L(f);var g=K("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.G.load(b+"?r=list"):L(null)).then(function(d){f=new Os(a,b);Ps(f,c,h,d,b+"?r=manifest").then(function(){a.H[e]=f;a.la[b]=f;N(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return g.result()}
function Qs(a,b,c){var d=K("EPUBDocStore.load");b=la(b);(a.D[b]=zs(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Bd:null})).Ba(d);return d.result()}
Ks.prototype.load=function(a){var b=la(a);if(a=this.D[b])return a.Pa()?a:L(a.get());var c=K("EPUBDocStore.load");a=Ks.If.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?N(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return c.result()};function Rs(){this.id=null;this.src="";this.h=this.f=null;this.R=-1;this.l=0;this.w=null;this.b=this.g=0;this.nc=this.kb=null;this.j=Oa}
function Ss(a){return a.id}function Ts(a){var b=Fs(a);return function(a){var c=K("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));df(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}N(c,cf([a,f]))});return c.result()}}
var Us={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Vs=Us.dcterms+"language",Ws=Us.dcterms+"title";
function Xs(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==Ws&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=Vs&&b&&(f=(h[Vs]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[Vs]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Ys(a,b){function c(a){for(var b in a){var d=a[b];d.sort(Xs(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Sa(a,function(a){return Ra(a,function(a){var b={v:a.value,o:a.order};a.Ig&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:Vs,value:a.lang,lang:null,id:null,le:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Qa(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Us)f[g]=Us[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Us;var h=1;g=Yj(Zj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,le:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Us.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),le:null,scheme:null};return null});var l=Qa(g,function(a){return a.le});g=d(Qa(g,function(a){return a.le?null:a.name}));var k=null;g[Vs]&&(k=g[Vs][0].v);c(g);return g}function Zs(){var a=window.MathJax;return a?a.Hub:null}var $s={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Os(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.D=b;this.C=null;this.T={};this.lang=null;this.G=0;this.J={};this.W=this.O=this.Z=null;this.H={};this.I=null;this.w=at(this);Zs()&&(ph["http://www.w3.org/1998/Math/MathML"]=!0)}
function at(a){function b(){}b.prototype.oe=function(a,b){return"viv-id-"+qa(b+(a?"#"+a:""),":")};b.prototype.fd=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.oe(c,f)}return b};b.prototype.dg=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ja(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function bt(a,b){return a.D?b.substr(0,a.D.length)==a.D?decodeURI(b.substr(a.D.length)):null:b}
function Ps(a,b,c,d,e){a.g=b;var f=Gj(new Hj([b.b]),"package"),g=ak(f,"unique-identifier")[0];g&&(g=Nj(b,b.url+"#"+g))&&(a.C=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Ra(Gj(Gj(f,"manifest"),"item").b,function(c){var d=new Rs,e=b.url;d.id=c.getAttribute("id");d.src=oa(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!$s[d.f]&&(h[d.src]=c);!a.O&&d.j.nav&&
(a.O=d);!a.W&&d.j["cover-image"]&&(a.W=d);return d});a.f=Na(a.j,Ss);a.l=Na(a.j,function(b){return bt(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if($s[g.f]){a.H[l]=g.src;break}g=g.src}a.b=Ra(Gj(Gj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.R=c;return d});if(l=ak(Gj(f,"spine"),"toc")[0])a.Z=a.f[l];if(l=ak(Gj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.I=l}var g=c?ak(Gj(Gj(Wj(Gj(Gj(new Hj([c.b]),"encryption"),"EncryptedData"),Vj()),"CipherData"),"CipherReference"),"URI"):[],k=Gj(Gj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.T[l]=a.f[m].src)}a.J=Ys(Gj(f,"metadata"),ak(f,"prefix")[0]);a.J[Vs]&&(a.lang=a.J[Vs][0].v);if(!d){if(0<g.length&&a.C)for(d=Ts(a.C),c=0;c<g.length;c++)a.h.C[a.D+g[c]]=d;return L(!0)}f=new Ca;k={};if(0<g.length&&a.C)for(l="1040:"+
Gs(a.C),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.l[q];l=null;g&&(g.w=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}ct(a);return bf(e,"","POST",f.toString(),"text/plain")}function ct(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.G=b}
function dt(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new Fj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Rs;b.R=a.index;b.id="item"+(a.index+1);b.src=a.url;b.kb=a.kb;b.nc=a.nc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Qs(a.h,b[0].url,c):L(null)}
function et(a,b,c){var d=a.b[b],e=K("getCFI");a.h.load(d.src).then(function(a){var b=Lj(a,c),f=null;b&&(a=Jj(a,b,0,!1),f=new fb,ib(f,b,c-a),d.h&&ib(f,d.h,0),f=f.toString());N(e,f)});return e.result()}
function ft(a,b){return Wd("resolveFragment",function(c){if(b){var d=new fb;gb(d,b);var e;if(a.g){var f=hb(d,a.g.b);if(1!=f.node.nodeType||f.M||!f.Zc){N(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){N(c,null);return}e=a.f[h];d=f.Zc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=hb(d,a.b);a=Jj(a,b.node,b.offset,b.M);N(c,{R:e.R,Ga:a,$:-1})})}else N(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);N(a,null)})}
function gt(a,b){return Wd("resolveEPage",function(c){if(0>=b)N(c,{R:0,Ga:0,$:-1});else{var d=La(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=Kj(a),f=Math.round(a*b/e.b),f==a&&f--);N(c,{R:d,Ga:f,$:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);N(a,null)})}
function ht(a,b){var c=a.b[b.R];if(0>=b.Ga)return L(c.g);var d=K("getEPage");a.h.load(c.src).then(function(a){a=Kj(a);N(d,c.g+Math.min(a,b.Ga)*c.b/a)});return d.result()}function it(a,b){return{page:a,position:{R:a.R,$:b,Ga:a.offset}}}function jt(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.w=e;this.oc=[];this.l=[];this.X=kb(d);this.h=new dr(b);this.f=new ip(a.w)}function kt(a,b){var c=a.oc[b.R];return c?c.pb[b.$]:null}n=jt.prototype;
n.Pb=function(a){return this.b.I?this.b.I:(a=this.oc[a?a.R:0])?a.Xa.va:null};
function lt(a,b,c,d){c.K.style.display="none";c.K.style.visibility="visible";c.K.style.position="";c.K.style.top="";c.K.style.left="";c.K.setAttribute("data-vivliostyle-page-side",c.l);var e=b.pb[d];c.H=!b.item.R&&!d;b.pb[d]=c;e?(b.Xa.viewport.f.replaceChild(c.K,e.K),Ua(e,{type:"replaced",target:null,currentTarget:null,Bf:c})):b.Xa.viewport.f.appendChild(c.K);a.w({width:b.Xa.la,height:b.Xa.ha},b.Xa.Ra,b.item.R,b.Xa.Z+d)}
function mt(a,b,c){var d=K("renderSinglePage"),e=nt(a,b,c);ts(b.Xa,e,c).then(function(f){var g=(c=f)?c.page-1:b.Ya.length-1;lt(a,b,e,g);mp(a.f,e.R,g);f=null;if(c){var h=b.Ya[c.page];b.Ya[c.page]=c;h&&b.pb[c.page]&&(Tk(c,h)||(f=mt(a,b,c)))}f||(f=L(!0));f.then(function(){var b=np(a.f,e),f=0;ne(function(c){f++;if(f>b.length)P(c);else{var d=b[f-1];d.Ad=d.Ad.filter(function(a){return!a.$c});d.Ad.length?ot(a,d.R).then(function(b){b?(lp(a.f,d.ie),op(a.f,d.Ad),mt(a,b,b.Ya[d.$]).then(function(b){var d=a.f;
d.b=d.G.pop();d=a.f;d.g=d.I.pop();d=b.Uc.position;d.R===e.R&&d.$===g&&(e=b.Uc.page);O(c)})):O(c)}):O(c)}}).then(function(){N(d,{Uc:it(e,g),Df:c})})})});return d.result()}function pt(a,b){var c=a.$,d=-1;0>c&&(d=a.Ga,c=La(b.Ya.length,function(a){return js(b.Xa,b.Ya[a],!0)>d}),c=c===b.Ya.length?b.complete?b.Ya.length-1:Number.POSITIVE_INFINITY:c-1);return{R:a.R,$:c,Ga:d}}
function qt(a,b,c){var d=K("findPage");ot(a,b.R).then(function(e){if(e){var f=null,g;ne(function(d){var h=pt(b,e);g=h.$;(f=e.pb[g])?P(d):e.complete?(g=e.Ya.length-1,f=e.pb[g],P(d)):c?rt(a,h).then(function(a){a&&(f=a.page);P(d)}):le(100).then(function(){O(d)})}).then(function(){N(d,it(f,g))})}else N(d,null)});return d.result()}
function rt(a,b){var c=K("renderPage");ot(a,b.R).then(function(d){if(d){var e=pt(b,d),f=e.$,g=e.Ga,h=d.pb[f];h?N(c,it(h,f)):ne(function(b){if(f<d.Ya.length)P(b);else if(d.complete)f=d.Ya.length-1,P(b);else{var c=d.Ya[d.Ya.length-1];mt(a,d,c).then(function(e){var k=e.Uc.page;(c=e.Df)?0<=g&&js(d.Xa,c)>g?(h=k,f=d.Ya.length-2,P(b)):O(b):(h=k,f=e.Uc.position.$,d.complete=!0,k.C=d.item.R===a.b.b.length-1,P(b))})}}).then(function(){h=h||d.pb[f];var b=d.Ya[f];h?N(c,it(h,f)):mt(a,d,b).then(function(b){b.Df||
(d.complete=!0,b.Uc.page.C=d.item.R===a.b.b.length-1);N(c,b.Uc)})})}else N(c,null)});return c.result()}n.me=function(){return st(this,{R:this.b.b.length-1,$:Number.POSITIVE_INFINITY,Ga:-1})};function st(a,b){var c=K("renderAllPages");b||(b={R:0,$:0,Ga:0});var d=b.R,e=b.$,f=0,g;ne(function(c){rt(a,{R:f,$:f===d?e:Number.POSITIVE_INFINITY,Ga:f===d?b.Ga:-1}).then(function(a){g=a;++f>d?P(c):O(c)})}).then(function(){N(c,g)});return c.result()}n.Pf=function(){return qt(this,{R:0,$:0,Ga:-1})};
n.Tf=function(){return qt(this,{R:this.b.b.length-1,$:Number.POSITIVE_INFINITY,Ga:-1})};n.nextPage=function(a,b){var c=this,d=a.R,e=a.$,f=K("nextPage");ot(c,d).then(function(a){if(a){if(a.complete&&e==a.Ya.length-1){if(d>=c.b.b.length-1){N(f,null);return}d++;e=0}else e++;qt(c,{R:d,$:e,Ga:-1},b).Ba(f)}else N(f,null)});return f.result()};n.ke=function(a){var b=a.R;if(a=a.$)a--;else{if(!b)return L(null);b--;a=Number.POSITIVE_INFINITY}return qt(this,{R:b,$:a,Ga:-1})};
function tt(a,b,c){b="left"===b.l;a="ltr"===a.Pb(c);return!b&&a||b&&!a}function ut(a,b,c){var d=K("getCurrentSpread"),e=kt(a,b);if(!e)return L({left:null,right:null});var f="left"===e.l;(tt(a,e,b)?a.ke(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?N(d,{left:e,right:a}):N(d,{left:a,right:e})});return d.result()}
n.Zf=function(a,b){var c=kt(this,a);if(!c)return L(null);var c=tt(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.fa(function(a){return a?e.nextPage(a.position,!!b):L(null)})};n.bg=function(a){var b=kt(this,a);if(!b)return L(null);b=tt(this,b,a);a=this.ke(a);if(b){var c=this;return a.fa(function(a){return a?c.ke(a.position):L(null)})}return a};function vt(a,b){var c=K("navigateToEPage");gt(a.b,b).then(function(b){b?qt(a,b).Ba(c):N(c,null)});return c.result()}
function wt(a,b){var c=K("navigateToCFI");ft(a.b,b).then(function(b){b?qt(a,b).Ba(c):N(c,null)});return c.result()}
function xt(a,b,c){v.debug("Navigate to",b);var d=bt(a.b,la(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=bt(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.w.dg(b);a.b.g?d=bt(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return L(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==bt(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?wt(a,b.substr(d+1)):L(null);var g=K("navigateTo");ot(a,f.R).then(function(d){var e=Nj(d.aa,b);e?qt(a,{R:f.R,$:-1,Ga:Ij(d.aa,e)}).Ba(g):c.R!==f.R?qt(a,{R:f.R,$:0,Ga:-1}).Ba(g):
N(g,null)});return g.result()}
function nt(a,b,c){var d=b.Xa.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";Bj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new gk(e,f);g.R=b.item.R;g.position=c;g.offset=js(b.Xa,c);g.offset||(b=a.b.w.oe("",b.item.src),f.setAttribute("id",b),jk(g,f,b));d!==a.viewport&&(a=Tf(null,new Ze(nb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.w.push(new dk(e,"transform",a)));return g}function yt(a,b){var c=Zs();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=K("makeMathJaxView"),f=fe(c);d.Push(function(){f.ib(e)});return c.result()}return L(null)}
n.de=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=oa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=bt(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.T[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ha(f),l=Ha(g),g=new Ca;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=L(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=yt(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=L(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?yt(c,d):L(null);return e}};
function ot(a,b){if(b>=a.b.b.length)return L(null);var c=a.oc[b];if(c)return L(c);var d=K("getPageViewItem"),e=a.l[b];if(e){var f=fe(d);e.push(f);return d.result()}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(Kj(f)/2700),a.b.G=g.b);var k=h.f[f.url],l=a.de(f),p=a.viewport,q=fs(k,p.width,p.height,p.fontSize);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new fr(p.window,q.fontSize,p.root,q.width,q.height);q=a.oc[b-1];null!==
g.kb?q=g.kb-1:(q=q?q.Xa.Z+q.pb.length:0,null!==g.nc&&(q+=g.nc));jp(a.f,q);var r=new gs(k,f,a.b.lang,p,a.h,a.j,l,a.b.H,q,a.b.w,a.f);r.X=a.X;hs(r).then(function(){c={item:g,aa:f,Xa:r,Ya:[null],pb:[],complete:!1};a.oc[b]=c;N(d,c);e.forEach(function(a){a.ib(c)})})});return d.result()}function zt(a){return a.oc.some(function(a){return a&&0<a.pb.length})}
n.Cd=function(){var a=this.b,b=a.O||a.Z;if(!b)return L(null);var c=K("showTOC");this.g||(this.g=new Hs(a.h,b.src,a.lang,this.h,this.j,this.X,this,a.H,a.w,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.Cd(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";N(c,a)});return c.result()};n.vd=function(){this.g&&this.g.vd()};n.Le=function(){return this.g&&this.g.Le()};var At={wg:"singlePage",xg:"spread",mg:"autoSpread"};
function Bt(a,b,c,d){var e=this;this.window=a;this.Ld=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);Bj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Sa=c;this.Ra=d;a=a.document;this.va=new Yl(a.head,b);this.C="loading";this.O=[];this.h=null;this.Rb=this.Qa=!1;this.f=this.j=this.g=this.D=null;this.fontSize=16;this.zoom=1;this.G=!1;this.W="singlePage";this.la=!1;this.me=!0;this.X=jb();this.ha=[];this.J=function(){};this.w=function(){};
this.Z=function(){e.Qa=!0;e.J()};this.je=this.je.bind(this);this.H=function(){};this.I=a.getElementById("vivliostyle-page-rules");this.T=!1;this.l=null;this.pa={loadEPUB:this.Lf,loadXML:this.Mf,configure:this.ye,moveTo:this.Ia,toc:this.Cd};Ct(this)}function Ct(a){ka(1,function(a){Dt(this,{t:"debug",content:a})}.bind(a));ka(2,function(a){Dt(this,{t:"info",content:a})}.bind(a));ka(3,function(a){Dt(this,{t:"warn",content:a})}.bind(a));ka(4,function(a){Dt(this,{t:"error",content:a})}.bind(a))}
function Dt(a,b){b.i=a.Sa;a.Ra(b)}function Et(a,b){a.C!==b&&(a.C=b,a.Ld.setAttribute("data-vivliostyle-viewer-status",b),Dt(a,{t:"readystatechange"}))}n=Bt.prototype;
n.Lf=function(a){Ft.f("beforeRender");Et(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=K("loadEPUB"),h=this;h.ye(a).then(function(){var a=new Ks;Bs(a,e,f).then(function(){var e=oa(b,h.window.location.href);h.O=[e];Ms(a,e,d).then(function(a){h.h=a;Gt(h,c).then(function(){N(g,!0)})})})});return g.result()};
n.Mf=function(a){Ft.f("beforeRender");Et(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=K("loadXML"),h=this;h.ye(a).then(function(){var a=new Ks;Bs(a,e,f).then(function(){var e=b.map(function(a,b){return{url:oa(a.url,h.window.location.href),index:b,kb:a.kb,nc:a.nc}});h.O=e.map(function(a){return a.url});h.h=new Os(a,"");dt(h.h,e,c).then(function(){Gt(h,d).then(function(){N(g,!0)})})})});return g.result()};
function Gt(a,b){Ht(a);var c;b?c=ft(a.h,b).fa(function(b){a.f=b;return L(!0)}):c=L(!0);return c.fa(function(){Ft.b("beforeRender");return It(a)})}function Jt(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*yb.ex*a.fontSize/yb.em;if(d=yb[d])return c*d}return c}
n.ye=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.D=null,this.window.addEventListener("resize",this.Z,!1),this.Qa=!0):this.window.removeEventListener("resize",this.Z,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Qa=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Jt(this,b["margin-left"])||0,marginRight:Jt(this,b["margin-right"])||0,marginTop:Jt(this,b["margin-top"])||0,marginBottom:Jt(this,b["margin-bottom"])||
0,width:Jt(this,b.width)||0,height:Jt(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Z,!1),this.D=b,this.Qa=!0);"boolean"==typeof a.hyphenate&&(this.X.Zd=a.hyphenate,this.Qa=!0);"boolean"==typeof a.horizontal&&(this.X.Yd=a.horizontal,this.Qa=!0);"boolean"==typeof a.nightMode&&(this.X.fe=a.nightMode,this.Qa=!0);"number"==typeof a.lineHeight&&(this.X.lineHeight=a.lineHeight,this.Qa=!0);"number"==typeof a.columnWidth&&(this.X.Td=a.columnWidth,this.Qa=
!0);"string"==typeof a.fontFamily&&(this.X.fontFamily=a.fontFamily,this.Qa=!0);"boolean"==typeof a.load&&(this.la=a.load);"boolean"==typeof a.renderAllPages&&(this.me=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ma=a.userAgentRootURL.replace(/resources\/?$/,""),na=a.userAgentRootURL);"string"==typeof a.rootURL&&(ma=a.rootURL,na=ma+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.W&&(this.W=a.pageViewMode,this.Qa=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.X.Ec&&
(this.viewport=null,this.X.Ec=a.pageBorder,this.Qa=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.Rb=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.G&&(this.G=a.fitToScreen,this.Rb=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.X.fc=a.defaultPaperSize,this.Qa=!0);Kt(this,a);return L(!0)};
function Kt(a,b){Qd("CONFIGURATION").forEach(function(a){a=a(b);this.Qa=a.Qa||this.Qa;this.Rb=a.Rb||this.Rb}.bind(a))}n.je=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||Lt(this,a.Bf):b===a.target&&Lt(this,a.Bf)};function Mt(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Nt(a){Mt(a,function(a){a.removeEventListener("hyperlink",this.H,!1);a.removeEventListener("replaced",this.je,!1)}.bind(a))}
function Ot(a){Nt(a);Mt(a,function(a){w(a.K,"display","none")});a.g=null;a.j=null}function Pt(a,b){b.addEventListener("hyperlink",a.H,!1);b.addEventListener("replaced",a.je,!1);w(b.K,"visibility","visible");w(b.K,"display","block")}function Qt(a,b){Ot(a);a.g=b;Pt(a,b)}function Rt(a){var b=K("reportPosition");et(a.h,a.f.R,a.f.Ga).then(function(c){var d=a.g;(a.la&&0<d.j.length?re(d.j):L(!0)).then(function(){St(a,d,c).Ba(b)})});return b.result()}
function Tt(a){var b=a.Ld;if(a.D){var c=a.D;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new fr(a.window,a.fontSize,b,c.width,c.height)}return new fr(a.window,a.fontSize,b)}
function Ut(a){var b=Tt(a),c;a:switch(a.W){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.X.rb!==c;a.X.rb=c;a.Ld.setAttribute("data-vivliostyle-spread-view",c);if(a.D||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&zt(a.b)){a:{d=a.b.oc;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.pb,f=0;f<e.length;f++){var g=e[f];if(g.G&&g.D){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.Rb=!0):!1}n.eg=function(a,b,c,d){this.ha[d]=a;Vt(this,b,c,d)};function Vt(a,b,c,d){if(!a.T&&a.I&&!c&&!d){var e="";Object.keys(b).forEach(function(a){e+="@page "+a+"{size:";a=b[a];e+=a.width+"px "+a.height+"px;}"});a.I.textContent=e;a.T=!0}}
function Wt(a){if(a.b){a.b.vd();for(var b=a.b,c=b.oc,d=0;d<c.length;d++){var e=c[d];e&&e.pb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.I&&(a.I.textContent="",a.T=!1);a.viewport=Tt(a);b=a.viewport;w(b.g,"width","");w(b.g,"height","");w(b.f,"width","");w(b.f,"height","");w(b.f,"transform","");a.b=new jt(a.h,a.viewport,a.va,a.X,a.eg.bind(a))}
function Lt(a,b,c){a.Rb=!1;Nt(a);if(a.X.rb)return ut(a.b,a.f,c).fa(function(c){Ot(a);a.j=c;c.left&&(Pt(a,c.left),c.right||c.left.K.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Pt(a,c.right),c.left||c.right.K.setAttribute("data-vivliostyle-unpaired-page",!0));c=Xt(a,c);a.viewport.zoom(c.width,c.height,a.G?Yt(a,c):a.zoom);a.g=b;return L(null)});Qt(a,b);a.viewport.zoom(b.f.width,b.f.height,a.G?Yt(a,b.f):a.zoom);a.g=b;return L(null)}
function Xt(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.X.Ec);return{width:c,height:d}}var Zt={rg:"fit inside viewport"};function Yt(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function $t(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t($t,Error);
function Ht(a){if(a.l){var b=a.l;Xd(b,new $t);if(b!==Rd&&b.b){b.b.g=!0;var c=new ge(b);b.l="interrupt";b.b=c;b.f.ib(c)}}a.l=null}
function It(a){a.Qa=!1;a.Rb=!1;if(Ut(a))return L(!0);Et(a,"loading");Ht(a);var b=Zd(Rd.f,function(){return Wd("resize",function(c){a.l=b;Ft.f("render (resize)");Wt(a);a.f&&(a.f.$=-1);st(a.b,a.f).then(function(d){a.f=d.position;Lt(a,d.page,!0).then(function(){Rt(a).then(function(d){Et(a,"interactive");(a.me?a.b.me():L(null)).then(function(){a.l===b&&(a.l=null);Ft.b("render (resize)");Et(a,"complete");Dt(a,{t:"loaded"});N(c,d)})})})})},function(a,b){if(b instanceof $t)Ft.b("render (resize)"),v.debug(b.message);
else throw b;})});return L(!0)}function St(a,b,c){var d=K("sendLocationNotification"),e={t:"nav",first:b.H,last:b.C};ht(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.G;c&&(e.cfi=c);Dt(a,e);N(d,!0)});return d.result()}Bt.prototype.Pb=function(){return this.b?this.b.Pb(this.f):null};
Bt.prototype.Ia=function(a){var b=this;"complete"!==this.C&&Et(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.X.rb?this.b.Zf:this.b.nextPage;break;case "previous":a=this.X.rb?this.b.bg:this.b.ke;break;case "last":a=this.b.Tf;break;case "first":a=this.b.Pf;break;default:return L(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return vt(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return xt(b.b,
e,b.f)}}else return L(!0);var f=K("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=K("moveTo.showCurrent");c=d.result();Lt(b,a.page).then(function(){Rt(b).Ba(d)})}else c=L(!0);c.then(function(a){"loading"===b.C&&Et(b,"interactive");N(f,a)})});return f.result()};
Bt.prototype.Cd=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Le();if(c){if("show"==a)return L(!0)}else if("hide"==a)return L(!0);if(c)return this.b.vd(),L(!0);var d=this,e=K("showTOC");this.b.Cd(b).then(function(a){if(a){if(b){var c=function(){d.b.vd()};a.addEventListener("hyperlink",c,!1);a.K.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.H,!1)}N(e,!0)});return e.result()};
function au(a,b){var c=b.a||"";return Wd("runCommand",function(d){var e=a.pa[c];e?e.call(a,b).then(function(){Dt(a,{t:"done",a:c});N(d,!0)}):(v.error("No such action:",c),N(d,!0))},function(a,b){v.error(b,"Error during action:",c);N(a,!0)})}function bu(a){return"string"==typeof a?JSON.parse(a):a}
function cu(a,b){var c=bu(b),d=null;Yd(function(){var b=K("commandLoop"),f=Rd.f;a.H=function(b){var c="#"===b.href.charAt(0)||a.O.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Zd(f,function(){Dt(a,d);return L(!0)})}};ne(function(b){if(a.Qa)It(a).then(function(){O(b)});else if(a.Rb)a.g&&Lt(a,a.g).then(function(){O(b)});else if(c){var e=c;c=null;au(a,e).then(function(){O(b)})}else e=K("waitForCommand"),d=fe(e,self),e.result().then(function(){O(b)})}).Ba(b);
return b.result()});a.J=function(){var a=d;a&&(d=null,a.ib())};a.w=function(b){if(c)return!1;c=bu(b);a.J();return!0};a.window.adapt_command=a.w};function Yq(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=du(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=eu(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=fu(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);gu(a);null!=c&&(a=hu(a,c));return a}
function fu(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=iu(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Yq(f[0],f[2]),d=Yq(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,r=0,z=0;z<e;z++){for(var u=-z+m;u<=z-p;u+=2){var A=e+u,H;H=u==-z||u!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var G=H-u;H<c&&G<d&&a.charAt(H)==b.charAt(G);)H++,G++;g[A]=H;if(H>c)p+=2;else if(G>d)m+=2;else if(k&&(A=e+l-u,0<=A&&A<f&&-1!=h[A])){var I=c-h[A];if(H>=I){c=ju(a,b,H,G);break a}}}for(u=-z+q;u<=z-r;u+=2){A=e+u;I=u==-z||u!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=I-u;I<c&&H<d&&a.charAt(c-I-1)==b.charAt(d-H-1);)I++,H++;h[A]=I;if(I>c)r+=2;else if(H>d)q+=2;else if(!k&&
(A=e+l-u,0<=A&&A<f&&-1!=g[A]&&(H=g[A],G=e+H-A,I=c-I,H>=I))){c=ju(a,b,H,G);break a}}}c=[[-1,a],[1,b]]}return c}function ju(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Yq(a.substring(0,c),b.substring(0,d));e=Yq(e,f);return a.concat(e)}function du(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function eu(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function iu(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=du(a.substring(c),b.substring(e)),I=eu(a.substring(0,c),b.substring(0,e));f.length<I+m&&(f=b.substring(e-I,e)+b.substring(e,e+m),g=a.substring(0,c-I),h=a.substring(c+m),k=b.substring(0,e-I),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function gu(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=du(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=eu(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&gu(a)}Yq.f=1;Yq.b=-1;Yq.g=0;
function hu(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),ku(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),ku(d,c,3)):a}function ku(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Xq(a){return a.reduce(function(a,c){return c[0]===Yq.b?a:a+c[1]},"")}function Jk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Yq.f:d++;break;case Yq.b:d--;e++;break;case Yq.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function lu(a,b,c){zm.call(this,a,b,"block-end",c)}t(lu,zm);lu.prototype.Ge=function(a){return!(a instanceof lu)};function mu(a,b,c){Cm.call(this,a,"block-end",b,c)}t(mu,Cm);mu.prototype.Fa=function(){return Infinity};mu.prototype.b=function(a){return a instanceof lu?!0:this.Fa()<a.Fa()};function nu(){}n=nu.prototype;n.Ze=function(a){return"footnote"===a.ya};n.Ye=function(a){return a instanceof lu};
n.df=function(a,b){var c="region",d=Nm(b,c);dn(Nm(b,"page"),d)&&(c="page");d=Ik(a);c=new lu(d,c,b.h);b.Od(c);return L(c)};n.ef=function(a,b,c){return new mu(a[0].qa.b,a,c)};n.Ue=function(a,b){return Nm(b,a.b).b.filter(function(a){return a instanceof mu})[0]||null};
n.Xe=function(a,b,c){a.ff=!0;a.uc=!1;var d=a.element,e=c.j;b=b.u;var f={},g;g=e.C._pseudos;b=Cq(e,b,e.C,f);if(g&&g.before){var h={},l=Oq(e,"http://www.w3.org/1999/xhtml","span");vq(l,"before");d.appendChild(l);Cq(e,b,g.before,h);delete h.content;Rq(e,l,h)}delete f.content;Rq(e,d,f);a.u=b;Xo(a,d);if(e=fo(c.f,d))a.marginLeft=X(e.marginLeft),a.borderLeft=X(e.borderLeftWidth),a.C=X(e.paddingLeft),a.marginTop=X(e.marginTop),a.borderTop=X(e.borderTopWidth),a.D=X(e.paddingTop),a.marginRight=X(e.marginRight),
a.ha=X(e.borderRightWidth),a.I=X(e.paddingRight),a.marginBottom=X(e.marginBottom),a.Z=X(e.borderBottomWidth),a.H=X(e.paddingBottom);if(c=fo(c.f,d))a.width=X(c.width),a.height=X(c.height)};un.push(new nu);function ou(a,b){this.g(a,"end",b)}function pu(a,b){this.g(a,"start",b)}function qu(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function ru(){}function su(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=ru}
su.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.g(b)};su.prototype.w=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=ru};su.prototype.C=function(){this.g=qu;this.registerStartTiming=this.f=pu;this.registerEndTiming=this.b=ou};
var tu={now:Date.now},Ft,uu=Ft=new su(window&&window.performance||tu);qu.call(uu,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",uu);su.prototype.printTimings=su.prototype.l;su.prototype.disable=su.prototype.w;su.prototype.enable=su.prototype.C;function Kn(a){return(a=a.F)&&a instanceof Ko?a:null}function vu(a,b,c){var d=a.b;return d&&!d.kc&&(a=wu(a,b),a.B)?!d.hc||d.kc?L(!0):xu(d,d.hc,a,null,c):L(!0)}function yu(a,b,c){var d=a.b;return d&&(a=wu(a,b),a.B)?!d.ic||d.lc?L(!0):xu(d,d.ic,a,a.B.firstChild,c):L(!0)}function zu(a,b){a&&Au(a.M?a.parent:a,function(a,d){a instanceof Jo||b.l.push(new Bu(d))})}function Au(a,b){for(var c=a;c;c=c.parent){var d=c.F;d&&d instanceof Ko&&!Mk(c,d)&&b(d,c)}}
function Ko(a,b){this.parent=a;this.j=b;this.b=null}Ko.prototype.te=function(){return"Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)"};Ko.prototype.Ie=function(a,b){return b};function Cu(a,b){var c=wu(a,b);return c?c.B:null}function wu(a,b){do if(!Mk(b,a)&&b.N===a.j)return b;while(b=b.parent);return null}
function Uq(a,b){a.b||To.some(function(a){return a.root===this.j?(this.b=a.elements,!0):!1}.bind(a))||(a.b=new Du(b,a.j),To.push({root:a.j,elements:a.b}))}Ko.prototype.ve=function(){};Ko.prototype.ue=function(){};var To=[];function Du(a,b){this.u=a;this.hc=this.ic=this.w=this.D=this.l=this.C=null;this.H=this.I=0;this.kc=this.lc=!1;this.Pc=this.Vd=!0;this.j=!1;this.W=b;this.J=this.g=null;this.O=[];this.T=[]}function Eu(a,b){a.ic||(a.ic=wk(b),a.C=b.N,a.D=b.B)}
function Fu(a,b){a.hc||(a.hc=wk(b),a.l=b.N,a.w=b.B)}function xu(a,b,c,d,e){var f=c.B.ownerDocument,g=f.createElement("div");f.createDocumentFragment().appendChild(g);var h=new jm(e,g,c),l=h.b.b;h.b.b=null;a.h=!0;return mm(h,new Nk(b)).fa(function(){this.h=!1;var a=c.B;if(a)for(;g.firstChild;){var b=g.firstChild;g.removeChild(b);b.setAttribute("data-adapt-spec","1");d?a.insertBefore(b,d):a.appendChild(b)}h.b.b=l;return L(!0)}.bind(a))}
Du.prototype.b=function(a){var b=0;if(a&&!this.f(a))return b;if(!this.kc||a&&Gu(this,a))b+=this.H;this.lc||(b+=this.I);return b};Du.prototype.G=function(a){var b=0;if(a&&!this.f(a))return b;a&&Gu(this,a)&&(b+=this.H);this.Pc||(b+=this.I);return b};function Gu(a,b){return Hu(b,a.T,function(){return Iu(this.J,b,!1)}.bind(a))}Du.prototype.f=function(a){return Hu(a,this.O,function(){return Iu(this.W,a,!0)}.bind(this))};
function Hu(a,b,c){var d=b.filter(function(b){return b.A.N===a.N&&b.A.M===a.M});if(0<d.length)return d[0].result;c=c(a);b.push({A:a,result:c});return c}function Iu(a,b,c){for(var d=[];a;a=a.parentNode){if(b.N===a)return b.M;d.push(a)}for(a=b.N;a;a=a.parentNode){var e=d.indexOf(a);if(0<=e)return c?!e:!1;for(e=a;e;e=e.previousElementSibling)if(0<=d.indexOf(e))return!0}return b.M}function Ju(a){return!a.kc&&a.Vd&&a.hc||!a.lc&&a.Pc&&a.ic?!0:!1}function Ku(a){this.F=a}Ku.prototype.b=function(){};
Ku.prototype.f=function(a){return!!a};Ku.prototype.g=function(a,b,c,d){(a=this.F.b)&&!a.j&&(a.D&&(a.I=Yo(a.D,c,a.u),a.D=null),a.w&&(a.H=Yo(a.w,c,a.u),a.w=null),a.j=!0);return d};function Lu(a){this.F=a}Lu.prototype.b=function(){};Lu.prototype.f=function(){return!0};Lu.prototype.g=function(a,b,c,d){return d};function Mu(a){this.F=a}t(Mu,Ku);Mu.prototype.b=function(a,b){Ku.prototype.b.call(this,a,b);var c=K("BlockLayoutProcessor.doInitialLayout");gm(new fm(new Nu(a.F),b.j),a).Ba(c);return c.result()};
Mu.prototype.f=function(){return!1};function Ou(a){this.F=a}t(Ou,Lu);Ou.prototype.b=function(a,b){Mk(a,this.F)||a.M||b.l.unshift(new Bu(a));return Pu(a,b)};function Bu(a){this.A=wu(a.F,a)}n=Bu.prototype;n.bc=function(a,b){var c=this.A.F.b;return c&&!co(this.A.B)&&Ju(c)?b&&!a||a&&a.b?!1:!0:!0};n.yd=function(){var a=this.A.F.b;return a&&Ju(a)?(!a.kc&&a.Vd&&a.hc?a.kc=!0:!a.lc&&a.Pc&&a.ic&&(a.lc=!0),!0):!1};n.md=function(a,b,c,d){(c=this.A.F.b)&&a&&d.h&&(!b||Gu(c,b))&&(c.kc=!1,c.Vd=!1)};
n.Ea=function(a,b){var c=this.A.F,d=this.A.F.b;if(!d)return L(!0);var e=this.A;return yu(c,e,b).fa(function(){return vu(c,e,b).fa(function(){d.lc=d.kc=!1;d.Vd=!0;d.Pc=!0;return L(!0)})})};n.Ce=function(a){return a instanceof Bu?this.A.F===a.A.F:!1};n.Fe=function(){return 10};function Qu(a){pm.call(this);this.F=a}t(Qu,pm);Qu.prototype.j=function(a){var b=this.F.b;return Mk(a,this.F)||b.j?(Mk(a,this.F)||a.M||!b||(b.lc=!1,b.Pc=!1),new Ou(this.F)):new Mu(this.F)};function Nu(a){this.F=a}t(Nu,im);
Nu.prototype.hd=function(a){var b=this.F,c=a.A,d=b.b;if(c.parent&&b.j===c.parent.N){switch(c.j){case "header":if(d.ic)c.j="none";else return Eu(d,c),L(!0);break;case "footer":if(d.hc)c.j="none";else return Fu(d,c),L(!0)}d.g||(d.g=c.N)}return im.prototype.hd.call(this,a)};Nu.prototype.$b=function(a){var b=this.F,c=a.A;c.N===b.j&&(b.b.J=a.Cc&&a.Cc.N,a.Eb=!0);return"header"===c.j||"footer"===c.j?L(!0):im.prototype.$b.call(this,a)};function Ru(){}t(Ru,Vo);
Ru.prototype.Nd=function(a,b,c){if(Nn(b,a))return Wn(b,a);var d=a.F;return Cu(d,a)?(c&&zu(a.parent,b),Mk(a,d)?Vo.prototype.Nd.call(this,a,b,c):qm(new Qu(d),a,b)):Yn(b,a)};Ru.prototype.we=function(a){var b=Kn(a).b;if(!b)return!1;b.h||b.C!==a.N&&b.l!==a.N||a.B.parentNode.removeChild(a.B);return!1};
function Pu(a,b){var c=a.F,d=K("doLayout"),e=hm(b.j,a,!1);Xn(e,b).then(function(a){var e=a;ne(function(a){for(;e;){var d=!0;Mo(b,e,!1).then(function(f){e=f;en(b.g)?P(a):b.b?P(a):e&&b.h&&e&&e.b?P(a):e&&e.M&&e.N==c.j?P(a):d?d=!1:O(a)});if(d){d=!1;return}}P(a)}).then(function(){N(d,e)})});return d.result()}Ru.prototype.Ea=function(a,b,c,d){return Vo.prototype.Ea.call(this,a,b,c,d)};Ru.prototype.ld=function(a,b,c,d){Vo.prototype.ld(a,b,c,d)};
function Hn(a){for(var b=[],c=a;c;c=c.Bb)c.l.forEach(function(c){if(c instanceof Bu){var d=c.A.F.b;b.push(d)}c instanceof Su&&(d=new Tu(c.A,c.f),b.push(d));c instanceof Uu&&Vu(c,a).forEach(function(a){b.push(a)})});return b}var Wu=new Ru;Pd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Ko&&!(a instanceof Jo)?Wu:null});function Xu(a,b){if(!a||!a.J||a.M)return L(a);var c=a.J;return Yu(c,b,a).fa(function(d){var e=a.B;e.appendChild(d);var f=Yo(d,b,a.u);e.removeChild(d);b.l.push(new Su(a,c,f));return L(a)})}function Zu(a,b,c){this.b=a;this.f=b;this.ub=c}Zu.prototype.matches=function(){var a=$u[this.b];return!!a&&null!=a.Ka&&ei(a.Ka,this.f,this.ub)};function Yi(a){this.b=a}Yi.prototype.matches=function(){return this.b.some(function(a){return a.matches()})};function Zi(a){this.b=a}Zi.prototype.matches=function(){return this.b.every(function(a){return a.matches()})};
function Xi(a,b){var c=b.split("_");if("NFS"==c[0])return new Zu(a,parseInt(c[1],10),parseInt(c[2],10));fa("unknown view condition. condition="+b);return null}function xj(a,b,c){zq(c,function(c){zj(a,c,b)})}function zq(a,b){var c=a._viewConditionalStyles;c&&c.forEach(function(a){a.Vf.matches()&&b(a.fg)})}function Kq(a,b,c){var d=$u;if(!d[a]||d[a].Ua<=c)d[a]={Ka:b,Ua:c}}var $u={};function Tq(a,b){this.b=b;this.N=a}
function Yu(a,b,c){var d=c.B.ownerDocument.createElement("div"),e=new jm(b,d,c),f=e.b.b;e.b.b=null;return mm(e,av(a)).fa(function(){this.b.f["after-if-continues"]=!1;e.b.b=f;var a=d.firstChild;w(a,"display","block");return L(a)}.bind(a))}function av(a){var b=tq.createElementNS("http://www.w3.org/1999/xhtml","div");vq(b,"after-if-continues");a=new Ck(a.N,b,null,null,null,3,a.b);return new Nk({ma:[{node:b,Za:a.type,oa:a,za:null,ua:null}],ja:0,M:!1,Ha:null})}
function Su(a,b,c){this.A=a;this.b=b;this.f=c}n=Su.prototype;n.bc=function(a,b){return b&&!a||a&&a.b?!1:!0};n.yd=function(){return!1};n.md=function(){};n.Ea=function(a,b){return(new Tu(this.A,this.f)).f(a)?Yu(this.b,b,this.A).fa(function(a){this.A.B.appendChild(a);return L(!0)}.bind(this)):L(!0)};n.Ce=function(a){return a instanceof Su?this.b==a.b:!1};n.Fe=function(){return 9};function Tu(a,b){this.A=a;this.g=b}Tu.prototype.b=function(a){return this.f(a)?this.g:0};Tu.prototype.G=function(a){return this.b(a)};
Tu.prototype.f=function(a){if(!a)return!1;var b=a.oa?a.oa.ka:a.N;if(b===this.A.N)return!!a.M;for(a=b.parentNode;a;a=a.parentNode)if(a===this.A.N)return!0;return!1};function Xn(a,b){return a.fa(function(a){return Xu(a,b)})}function Uo(a,b){var c=K("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;me(function(){if(d){var a=Xu(d,b);d=d.parent;return a.sc(!0)}return L(!1)}).then(function(){N(c,!0)});return c.result()};function bv(a,b,c){var d=a.A,e=d.display,f=d.parent?d.parent.display:null;return"table-row"===e&&!cv(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!cv(f)&&"table"!==f&&"inline-table"!==f||d.F instanceof Jo&&d.F!==b?Yn(c,d).fa(function(b){a.A=b;return L(!0)}):null}function cv(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function dv(a,b){this.rowIndex=a;this.N=b;this.cells=[]}
function ev(a){return Math.min.apply(null,a.cells.map(function(a){return a.height}))}function fv(a,b,c){this.rowIndex=a;this.Ja=b;this.f=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.cc=null}function gv(a,b,c){this.rowIndex=a;this.Ja=b;this.Kb=c}function hv(a,b,c){this.g=a;this.b=c;this.Vb=new jm(a,b,c);this.f=!1}hv.prototype.Ob=function(){var a=this.b.B,b=this.b.T;"middle"!==b&&"bottom"!==b||w(a,"vertical-align","top");var c=this.Vb.Ob(!0);w(a,"vertical-align",b);return c};
function iv(a,b){this.B=a;this.b=b}function jv(a,b,c,d){om.call(this,a,b,c,d);this.F=a.F;this.rowIndex=this.j=null}t(jv,om);jv.prototype.f=function(a,b){var c=om.prototype.f.call(this,a,b);return b<this.b()?null:kv(this).every(function(a){return!!a.A})?c:null};jv.prototype.b=function(){var a=om.prototype.b.call(this);kv(this).forEach(function(b){a+=b.Fb.b()});return a};function kv(a){a.j||(a.j=lv(a).map(function(a){return a.Ob()}));return a.j}
function lv(a){return mv(a.F,null!=a.rowIndex?a.rowIndex:a.rowIndex=nv(a.F,a.position.N)).map(a.F.ud,a.F)}function ov(a,b,c){this.rowIndex=a;this.j=b;this.F=c;this.h=null}t(ov,Dn);ov.prototype.f=function(a,b){if(b<this.b())return null;var c=pv(this),d=qv(this),e=d.every(function(a){return!!a.A})&&d.some(function(a,b){var d=a.A,e=c[b].Vb.Re[0];return!(e.B===d.B&&e.M===d.M&&e.ja===d.ja)});this.j.b=d.some(function(a){return a.A&&a.A.b});return e?this.j:null};
ov.prototype.b=function(){var a=this.F,b=0;rv(a,a.g[this.rowIndex])||(b+=10);qv(this).forEach(function(a){b+=a.Fb.b()});return b};function qv(a){a.h||(a.h=pv(a).map(function(a){return a.Ob()}));return a.h}function pv(a){return sv(a.F,a.rowIndex).map(a.F.ud,a.F)}function Jo(a,b){Ko.call(this,a,b);this.G=b;this.u=!1;this.C=-1;this.J=0;this.H=[];this.I=this.w=null;this.O=0;this.g=[];this.l=[];this.f=[];this.D=null;this.h=[];this.b=null}t(Jo,Ko);n=Jo.prototype;n.te=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};
n.Ie=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.h.length;case "table-cell":return!this.h.some(function(b){return b.pd.ma[0].node===a.N});default:return b}};function tv(a,b){var c=a.l[b];c||(c=a.l[b]=[]);return c}function nv(a,b){return a.g.findIndex(function(a){return b===a.N})}function sv(a,b){return tv(a,b).reduce(function(a,b){return b.Kb!==a[a.length-1]?a.concat(b.Kb):a},[])}function mv(a,b){return sv(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}
n.ud=function(a){return this.f[a.rowIndex]&&this.f[a.rowIndex][a.Ja]};function rv(a,b){return ev(b)>a.J/2}function uv(a){0>a.C&&(a.C=Math.max.apply(null,a.g.map(function(a){return a.cells.reduce(function(a,b){return a+b.b},0)})));return a.C}function vv(a,b){a.g.forEach(function(a){a.cells.forEach(function(a){var c=lk(b,a.f);a.f=null;a.height=this.u?c.width:c.height},this)},a)}
function wv(a,b){if(!b)return null;var c=null,d=0;a:for(;d<a.f.length;d++)if(a.f[d])for(var e=0;e<a.f[d].length;e++)if(a.f[d][e]&&b===a.f[d][e].Vb.b){c=a.g[d].cells[e];break a}if(!c)return null;for(;d<a.l.length;d++)for(;e<a.l[d].length;e++){var f=a.l[d][e];if(f.Kb===c)return{rowIndex:f.rowIndex,Ja:f.Ja}}return null}
function xv(a,b){var c=[];return a.l.reduce(function(a,e,f){if(f>=b.rowIndex)return a;e=this.ud(e[b.Ja].Kb);if(!e||0<=c.indexOf(e))return a;yv(e.Vb.b,a);c.push(e);return a}.bind(a),[])}function zv(a){var b=[];a.g.forEach(function(a){a.cells.forEach(function(a,c){b[c]||(b[c]={bf:[],elements:[]});var d=b[c],e=this.ud(a);!e||0<=d.bf.indexOf(e)||(yv(e.Vb.b,d.elements),d.bf.push(e))}.bind(this))}.bind(a));return[new Av(b.map(function(a){return a.elements}))]}
function yv(a,b){a.l.forEach(function(a){a instanceof Bu&&b.push(a.A.F.b);a instanceof Uu&&Vu(a,null).forEach(function(a){b.push(a)})})}n.ve=function(){return[].concat(this.h)};n.ue=function(a){this.h=a};function Av(a){this.f=a}Av.prototype.b=function(a){return Bv(this,a,function(a){return a.current})};Av.prototype.G=function(a){return Bv(this,a,function(a){return a.ee})};function Bv(a,b,c){var d=0;a.f.forEach(function(a){a=En(b,a);d=Math.max(d,c(a))});return d}
function Cv(a,b){this.F=a;this.g=b;this.rowIndex=-1;this.Ja=0;this.f=!1}t(Cv,im);
Cv.prototype.hd=function(a){var b=this.F,c=bv(a,b,this.g);if(c)return c;var c=a.A,d=b.b;switch(c.display){case "table":b.O=c.ha;break;case "table-caption":b.H.push(new iv(c.B,c.Z));break;case "table-header-group":return d.ic||(this.b=!0,Eu(d,c)),L(!0);case "table-footer-group":return d.hc||(this.b=!0,Fu(d,c)),L(!0);case "table-row":this.b||(this.f=!0,this.rowIndex++,this.Ja=0,b.g[this.rowIndex]=new dv(this.rowIndex,c.N),d.g||(d.g=c.N))}return im.prototype.hd.call(this,a)};
Cv.prototype.$b=function(a){var b=this.F,c=a.A,d=c.display,e=this.g.f;if(c.N===b.G)d=fo(e,Cu(b,c)),b.J=parseFloat(d[b.u?"height":"width"]),b.b.J=a.Cc&&a.Cc.N,a.Eb=!0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b=!1,L(!0);break;case "table-row":this.b||(b.D=c.B,this.f=!1);break;case "table-cell":if(!this.b){this.f||(this.rowIndex++,this.Ja=0,this.f=!0);d=this.rowIndex;c=new fv(this.rowIndex,this.Ja,c.B);e=b.g[d];e||(b.g[d]=new dv(d,null),e=b.g[d]);e.cells.push(c);
for(var e=d+c.rowSpan,f=tv(b,d),g=0;f[g];)g++;for(;d<e;d++)for(var f=tv(b,d),h=g;h<g+c.b;h++){var l=f[h]=new gv(d,h,c);c.cc||(c.cc=l)}this.Ja++}}return im.prototype.$b.call(this,a)};function Dv(a,b){this.Qb=!0;this.F=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.w=b.h;b.h=!1}t(Dv,im);var Ev={"table-caption":!0,"table-column-group":!0,"table-column":!0};
function Fv(a,b,c,d){var e=b.rowIndex,f=b.Ja,g=c.B;if(1<b.b){w(g,"box-sizing","border-box");for(var h=a.F.I,l=0,k=0;k<b.b;k++)l+=h[b.cc.Ja+k];l+=a.F.O*(b.b-1);w(g,a.F.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new hv(a.f,b,c);a=a.F;(g=a.f[e])||(g=a.f[e]=[]);g[f]=c;1===d.f.ma.length&&d.f.M&&(c.f=!0);return mm(c.Vb,d).sc(!0)}function Gv(a,b){var c=a.F.h[0];return c?c.Kb.cc.Ja===b:!1}
function Hv(a){var b=a.F.h;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.Kb.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function Iv(a,b){var c=a.F,d=Hv(a),e=d.reduce(function(a){return a+1},0);if(0===e)return L(!0);var f=a.f.j,g=b.A;g.B.parentNode.removeChild(g.B);var h=K("layoutRowSpanningCellsFromPreviousFragment"),l=L(!0),k=0,m=[];d.forEach(function(a){l=l.fa(function(){var b=zk(a[0].pd.ma[1],g.parent);return Pn(f,b,!1).fa(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.B.ownerDocument.createElement("td");w(c,"padding","0");b.B.appendChild(c)}h++}}var g=L(!0),h=0;a.forEach(function(a){g=g.fa(function(){var c=
a.Kb;d(c.cc.Ja);var g=a.pd,l=zk(g.ma[0],b);l.ja=g.ja;l.M=g.M;l.Ka=g.ma[0].Ka+1;return Pn(f,l,!1).fa(function(){for(var b=a.af,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return Fv(this,c,l,b).fa(function(){l.B.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return L(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.fa(function(){d(uv(c));k++;return L(!0)})}.bind(this))}.bind(this))},a);l.then(function(){Pn(f,g,!0,b.nd).then(function(){N(h,!0)})});return h.result()}
function Jv(a,b){if(a.j||a.h)return L(!0);var c=b.A,d=a.F;0>a.b?a.b=nv(d,c.N):a.b++;a.g=0;a.l=!0;return Iv(a,b).fa(function(){Kv(this);Fo(this.f,b.Cc,null,!0,b.zc)&&!mv(d,this.b-1).length&&(this.f.h=this.w,c.b=!0,b.Eb=!0);return L(!0)}.bind(a))}function Kv(a){a.F.g[a.b].cells.forEach(function(a){var b=this.F.h[a.Ja];b&&b.Kb.cc.Ja==a.cc.Ja&&(a=b.pd.ma[0],b=Ij(this.f.j.aa,a.node),Kq(b,a.Ka+1,1))}.bind(a))}
function Lv(a,b){if(a.j||a.h)return L(!0);var c=b.A;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.F.g[a.b].cells[a.g],e=Bk(c).modify();e.M=!0;b.A=e;var f=K("startTableCell");Gv(a,d.cc.Ja)?(e=a.F.h.shift(),c.Ka=e.pd.ma[0].Ka+1,e=L(e.af)):e=Vn(a.f,c,b.nd).fa(function(a){a.B&&c.B.removeChild(a.B);return L(new Nk(wk(a)))});e.then(function(a){Fv(this,d,c,a).then(function(){this.$b(b);this.g++;N(f,!0)}.bind(this))}.bind(a));return f.result()}
Dv.prototype.Gf=function(a){var b=bv(a,this.F,this.f);if(b)return b;var b=a.A,c=this.F.b,d=b.display;return"table-header-group"===d&&c&&c.C===b.N?(this.j=!0,L(!0)):"table-footer-group"===d&&c&&c.l===b.N?(this.h=!0,L(!0)):"table-row"===d?Jv(this,a):"table-cell"===d?Lv(this,a):L(!0)};Dv.prototype.gf=function(a){a=a.A;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=Bk(a).modify(),a.M=!1,this.f.G.push(new ov(this.b,a,this.F))));return L(!0)};
Dv.prototype.$b=function(a){var b=a.A,c=this.F.b,d=b.display;"table-header-group"===d?c&&!c.h&&c.C===b.N?(this.j=!1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"):"table-footer-group"===d&&(c&&!c.h&&c.l===b.N?(this.h=!1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"));if(d&&Ev[d])b.B.parentNode.removeChild(b.B);else if(b.N===this.F.G)!(c=b.B.style)||Eo(c.paddingBottom)&&Eo(c.borderBottomWidth)||(b.b=Fo(this.f,a.Cc,null,!1,a.zc)),this.f.h=this.w,a.Eb=!0;else return im.prototype.$b.call(this,
a);return L(!0)};function Mv(){}function Nv(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=lk(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function Ov(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function Pv(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function Qv(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function Rv(a,b,c){var d=a.u,e=a.D;if(e){a.D=null;var f=e.ownerDocument.createDocumentFragment(),g=uv(a);if(0<g){var h=a.I=Nv(e,g,d,c.f);c=Ov(b);e=Pv(c);Qv(e,c,g,b);e.forEach(function(a,b){w(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.w=f}}
function Sv(a,b,c){var d=b.F;d.u=b.u;Uq(d,b.u);var e=K("TableLayoutProcessor.doInitialLayout");gm(new fm(new Cv(b.F,c),c.j),b).then(function(a){var f=a.B,h=lk(c.f,f),h=c.u?h.left:h.bottom,h=h+(c.u?-1:1)*En(b,Hn(c)).current;In(c,h)?(Rv(d,f,c),vv(d,c.f),N(e,null)):N(e,a)}.bind(a));return e.result()}function Tv(a,b,c){var d=a.H;d.forEach(function(a,f){a&&(b.insertBefore(a.B,c),"top"===a.b&&(d[f]=null))})}function Uv(a,b){if(a.w&&b){var c=Ov(b);c&&c.forEach(function(a){b.removeChild(a)})}}
function Vv(a,b){var c=a.F,d=Cu(c,a),e=d.firstChild;Tv(c,d,e);c.w&&!Ov(d).length&&d.insertBefore(c.w.cloneNode(!0),e);c=new Dv(c,b);c=new fm(c,b.j);d=K("TableFormattingContext.doLayout");gm(c,a).Ba(d);return d.result()}n=Mv.prototype;n.Nd=function(a,b,c){var d=a.F;return Cu(d,a)?(c&&zu(a.parent,b),qm(new Wv(d,this),a,b)):Yn(b,a)};n.cf=function(a,b,c,d){return new jv(a,b,c,d)};n.we=function(){return!1};n.We=function(){return!1};
n.Ea=function(a,b,c,d){var e=b.F;if("table-row"===b.display){var f=nv(e,b.N);e.h=[];var g;g=b.M?mv(e,f):sv(e,f);if(g.length){var h=K("TableLayoutProcessor.finishBreak"),l=0;ne(function(a){if(l===g.length)P(a);else{var b=g[l++],c=e.ud(b),d=c.Ob().A,h=c.b,k=Ik(h),u=new Nk(Ik(d));e.h.push({pd:k,af:u,Kb:b});h=h.B;Wo(c.b);f<b.rowIndex+b.rowSpan-1&&(h.rowSpan=f-b.rowIndex+1);c.f?O(a):c.Vb.Ea(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.Vb.b.element,k=c.b.B,l=lk(g.f,k),k=go(g,k);f?(b=l.right-
g.O-b.b(d)-k.right,w(h,"max-width",b+"px")):(b=g.O-b.b(d)-l.top-k.top,w(h,"max-height",b+"px"));w(h,"overflow","hidden")}O(a)})}}).then(function(){No(a,b,!1);Wo(b);e.f=[];N(h,!0)});return h.result()}}e.f=[];return Bo.Ea(a,b,c,d)};n.ld=function(a,b,c,d){Vo.prototype.ld(a,b,c,d)};function Wv(a,b){pm.call(this);this.w=b;this.b=a}t(Wv,pm);Wv.prototype.j=function(a){var b=this.b.b;return b&&b.j?(a.N===this.b.G&&!a.M&&b&&(b.lc=!1,b.Pc=!1),new Xv(this.b)):new Yv(this.b,this.w)};
Wv.prototype.g=function(a){pm.prototype.g.call(this,a);Uv(this.b,Cu(this.b,a))};Wv.prototype.f=function(a,b){pm.prototype.f.call(this,a,b);this.b.f=[]};function Yv(a,b){this.F=a;this.h=b}t(Yv,Ku);Yv.prototype.b=function(a,b){Ku.prototype.b.call(this,a,b);return Sv(this.h,a,b)};function Xv(a){this.F=a}t(Xv,Lu);Xv.prototype.b=function(a,b){var c=this.F.b;if(c&&!Gu(c,a)){var d=new Uu(a);b.l.some(function(a){return d.Ce(a)})||b.l.unshift(d)}return Vv(a,b)};function Uu(a){Bu.call(this,a);this.b=[]}
t(Uu,Bu);n=Uu.prototype;n.bc=function(a,b,c){var d=this.A.F.b;return!d||c.Bb||co(this.A.B)||!Ju(d)?!0:b&&!a||a&&a.b?!1:!0};n.yd=function(a){return Zv(a,this.A.F).some(function(b){return b.ze.some(function(b){return b.yd(a)})})?!0:Bu.prototype.yd.call(this,a)};n.md=function(a,b,c,d){var e=this.A.F;this.b=Zv(b,e);this.b.forEach(function(b){b.ze.forEach(function(e){e.md(a,b.Fb,c,d)})});a||(Uv(e,Cu(e,this.A)),$v(c));Bu.prototype.md.call(this,a,b,c,d)};
n.Ea=function(a,b){var c=K("finishBreak"),d=this.b.reduce(function(a,b){return a.concat(b.ze.map(function(a){return{Nf:a,Fb:b.Fb}}))},[]),e=0;me(function(){if(e<d.length){var a=d[e++];return a.Nf.Ea(a.Fb,b).sc(!0)}return L(!1)}).then(function(){N(c,!0)});return c.result().fa(function(){return Bu.prototype.Ea.call(this,a,b)}.bind(this))};function $v(a){if(a&&"table-row"===a.display&&a.B)for(;a.B.previousElementSibling;){var b=a.B.previousElementSibling;b.parentNode&&b.parentNode.removeChild(b)}}
function Zv(a,b){return aw(a,b).map(function(a){return{ze:a.Qf.Vb.b.l,Fb:a.Fb}})}function aw(a,b){var c=Number.MAX_VALUE;a&&"table-row"===a.display&&(c=nv(b,a.N)+1);for(var c=Math.min(b.f.length,c),d=[],e=0;e<c;e++)b.f[e]&&b.f[e].forEach(function(a){a&&d.push({Qf:a,Fb:a.Ob().A})});return d}function Vu(a,b){var c=a.A.F,d=wv(c,b);return d?xv(c,d):zv(c)}n.Ce=function(a){return a instanceof Uu?this.A.F===a.A.F:!1};var bw=new Mv;
Pd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===wd?(b=a.parent,new Jo(b?b.F:null,a.N)):null:null});Pd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Jo?bw:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function cw(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,kb:null,nc:null}:{url:a.url,kb:b(a.startPage),nc:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function dw(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function ew(a,b){Bj=a.debug;this.g=!1;this.h=a;this.Ib=new Bt(a.window||window,a.viewportElement,"main",this.Of.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.Ef(b);this.b=new Ta;Object.defineProperty(this,"readyState",{get:function(){return this.Ib.C}})}n=ew.prototype;n.Ef=function(a){var b=Object.assign({a:"configure"},dw(a));this.Ib.w(b);Object.assign(this.f,a)};
n.Of=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ua(this.b,b)};n.gg=function(a,b){this.b.addEventListener(a,b,!1)};n.jg=function(a,b){this.b.removeEventListener(a,b,!1)};n.Uf=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});fw(this,a,null,b,c)};n.hg=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});fw(this,null,a,b,c)};
function fw(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:cw(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},dw(a.f));a.g?a.Ib.w(b):(a.g=!0,cu(a.Ib,b))}n.Pb=function(){return this.Ib.Pb()};
n.Xf=function(a){a:switch(a){case "left":a="ltr"===this.Pb()?"previous":"next";break a;case "right":a="ltr"===this.Pb()?"next":"previous"}this.Ib.w({a:"moveTo",where:a})};n.Wf=function(a){this.Ib.w({a:"moveTo",url:a})};n.ig=function(a){a:{var b=this.Ib;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=Yt(b,b.X.rb?Xt(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};n.Rf=function(){return this.Ib.ha};ba("vivliostyle.viewer.Viewer",ew);
ew.prototype.setOptions=ew.prototype.Ef;ew.prototype.addListener=ew.prototype.gg;ew.prototype.removeListener=ew.prototype.jg;ew.prototype.loadDocument=ew.prototype.Uf;ew.prototype.loadEPUB=ew.prototype.hg;ew.prototype.getCurrentPageProgression=ew.prototype.Pb;ew.prototype.navigateToPage=ew.prototype.Xf;ew.prototype.navigateToInternalUrl=ew.prototype.Wf;ew.prototype.queryZoomFactor=ew.prototype.ig;ew.prototype.getPageSizes=ew.prototype.Rf;ba("vivliostyle.viewer.ZoomType",Zt);
Zt.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",At);At.SINGLE_PAGE="singlePage";At.SPREAD="spread";At.AUTO_SPREAD="autoSpread";qu.call(Ft,"load_vivliostyle","end",void 0);var gw=16,hw="ltr";function iw(a){window.adapt_command(a)}function jw(){iw({a:"moveTo",where:"ltr"===hw?"previous":"next"})}function kw(){iw({a:"moveTo",where:"ltr"===hw?"next":"previous"})}
function lw(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)iw({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)iw({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)iw({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)iw({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)kw(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)jw(),a.preventDefault();else if("0"===b||"U+0030"===c)iw({a:"configure",fontSize:Math.round(gw)}),a.preventDefault();else if("t"===b||"U+0054"===c)iw({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)gw*=1.2,iw({a:"configure",fontSize:Math.round(gw)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)gw/=1.2,iw({a:"configure",
fontSize:Math.round(gw)}),a.preventDefault()}
function mw(a){switch(a.t){case "loaded":a=a.viewer;var b=hw=a.Pb();a.Ld.setAttribute("data-vivliostyle-page-progression",b);a.Ld.setAttribute("data-vivliostyle-spread-view",a.X.rb);window.addEventListener("keydown",lw,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",jw,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",kw,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ra(location.href,Ha(a||"")));break;case "hyperlink":a.internal&&iw({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||pa("f"),c=a&&a.epubURL||pa("b"),d=a&&a.xmlURL||pa("x"),e=a&&a.defaultPageWidth||pa("w"),f=a&&a.defaultPageHeight||pa("h"),g=a&&a.defaultPageSize||pa("size"),h=a&&a.orientation||pa("orientation"),l=pa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));cu(new Bt(window,k,"main",mw),a)});
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

URLParameterStore.prototype.getBaseURL = function () {
    var url = this.location.href;
    url = url.replace(/#.*$/, "");
    return url.replace(/\/[^/]*$/, "/");
};

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
        userAgentRootURL: _storesUrlParameters2["default"].getBaseURL() + "resources/",
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
