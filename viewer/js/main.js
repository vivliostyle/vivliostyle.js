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

},{"knockout":1}],3:[function(require,module,exports){
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

},{"../models/message-queue":6}],4:[function(require,module,exports){
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

},{"./models/vivliostyle":10,"./vivliostyle-viewer":21,"vivliostyle":22}],5:[function(require,module,exports){
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
    var fragment = _storesUrlParameters2["default"].getParameter("f", true);
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
        _storesUrlParameters2["default"].setParameter("f", encoded, true);
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

},{"../stores/url-parameters":12,"./page-size":7,"knockout":1}],6:[function(require,module,exports){
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

},{"knockout":1}],7:[function(require,module,exports){
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

},{"knockout":1}],8:[function(require,module,exports){
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

},{"../models/vivliostyle":10}],9:[function(require,module,exports){
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

},{"../stores/url-parameters":12,"./page-view-mode":8,"./zoom-options":11,"knockout":1}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"../models/vivliostyle":10}],12:[function(require,module,exports){
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

URLParameterStore.prototype.getParameter = function (name, dontPercentDecode) {
    var url = this.location.href;
    var regexp = getRegExpForParameter(name);
    var results = [];
    var r;
    while (r = regexp.exec(url)) {
        var value = r[1];
        if (!dontPercentDecode) value = _utilsStringUtil2["default"].percentDecodeAmpersandAndPercent(value);
        results.push(value);
    }
    return results;
};

URLParameterStore.prototype.setParameter = function (name, value, dontPercentEncode) {
    var url = this.location.href;
    if (!dontPercentEncode) value = _utilsStringUtil2["default"].percentEncodeAmpersandAndPercent(value);
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

},{"../utils/string-util":15}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"knockout":1}],15:[function(require,module,exports){
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
exports["default"] = {
    escapeUnicodeChar: function escapeUnicodeChar(ch) {
        return "\\u" + (0x10000 | ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function escapeUnicodeString(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    },
    percentEncodeAmpersandAndPercent: function percentEncodeAmpersandAndPercent(str) {
        return str.replace(/%/g, "%25").replace(/&/g, "%26");
    },
    percentDecodeAmpersandAndPercent: function percentDecodeAmpersandAndPercent(str) {
        return str.replace(/%26/g, "&").replace(/%25/g, "%");
    }
};
module.exports = exports["default"];

},{}],16:[function(require,module,exports){
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

},{"knockout":1}],17:[function(require,module,exports){
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

},{"../models/viewer-options":9,"../utils/key-util":13,"knockout":1}],18:[function(require,module,exports){
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

},{"../models/page-size":7,"../models/page-view-mode":8,"../models/viewer-options":9,"../utils/key-util":13,"knockout":1}],19:[function(require,module,exports){
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

},{"../models/document-options":5,"../models/message-queue":6,"../models/viewer-options":9,"../models/vivliostyle":10,"../models/zoom-options":11,"../stores/url-parameters":12,"../utils/key-util":13,"./message-dialog":16,"./navigation":17,"./settings-panel":18,"./viewer":20,"knockout":1}],20:[function(require,module,exports){
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

},{"../logging/logger":3,"../models/vivliostyle":10,"../utils/observable-util":14,"knockout":1}],21:[function(require,module,exports){
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

},{"./bindings/menuButton.js":2,"./viewmodels/viewer-app":19,"knockout":1}],22:[function(require,module,exports){
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
 * Vivliostyle core 2017.6
 */"use strict";(function(factory){if(typeof define === "function" && define.amd){ // AMD
define([],factory);}else if(typeof module === "object"){ // Node.js
var enclosingObject={};module.exports = factory(enclosingObject);}else if(typeof exports === "object"){ // CommonJS
var enclosingObject={};exports = factory(enclosingObject);}else { // Attach to the window object
factory(window);}})((function(enclosingObject){enclosingObject = enclosingObject || {};var n,aa=this;function ba(a,b){var c="undefined" !== typeof enclosingObject && enclosingObject?enclosingObject:window,d=a.split("."),c=c || aa;d[0] in c || !c.execScript || c.execScript("var " + d[0]);for(var e;d.length && (e = d.shift());) d.length || void 0 === b?c[e]?c = c[e]:c = c[e] = {}:c[e] = b;}function t(a,b){function c(){}c.prototype = b.prototype;a.Nf = b.prototype;a.prototype = new c();a.prototype.constructor = a;a.Kg = function(a,c,f){for(var d=Array(arguments.length - 2),e=2;e < arguments.length;e++) d[e - 2] = arguments[e];return b.prototype[c].apply(a,d);};};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else {var b=Error().stack;b && (this.stack = b);}a && (this.message = String(a));}t(ca,Error);ca.prototype.name = "CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length && 1 < c.length;) d += c.shift() + e.shift();return d + c.join("%s");};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift();}t(ea,ca);ea.prototype.name = "AssertionError";function fa(a,b){throw new ea("Failure" + (a?": " + a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b && (b.frameTrace || b.stack);a = [].concat(a.messages);b && (0 < a.length && (a = a.concat(["\n"])),a = a.concat([b.toString()]),c && (a = a.concat(["\n"]).concat(c)));return a;}function ha(a){a = Array.from(a);var b=null;a[0] instanceof Error && (b = a.shift());return {error:b,messages:a};}function ia(a){function b(a){return function(b){return a.apply(c,b);};}var c=a || console;this.h = b(c.debug || c.log);this.l = b(c.info || c.log);this.A = b(c.warn || c.log);this.j = b(c.error || c.log);this.f = {};}function ja(a,b,c){(a = a.f[b]) && a.forEach(function(a){a(c);});}function ka(a,b){var c=v,d=c.f[a];d || (d = c.f[a] = []);d.push(b);}ia.prototype.debug = function(a){var b=ha(arguments);this.h(ga(b));ja(this,1,b);};ia.prototype.g = function(a){var b=ha(arguments);this.l(ga(b));ja(this,2,b);};ia.prototype.b = function(a){var b=ha(arguments);this.A(ga(b));ja(this,3,b);};ia.prototype.error = function(a){var b=ha(arguments);this.j(ga(b));ja(this,4,b);};var v=new ia();function la(a){var b=a.match(/^([^#]*)/);return b?b[1]:a;}var ma=window.location.href,na=window.location.href;function oa(a,b){if(!b || a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/) && (b += "/");var c;if(a.match(/^\/\//))return (c = b.match(/^(\w{2,}:)\/\//))?c[1] + a:a;if(a.match(/^\//))return (c = b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1] + a:a;a.match(/^\.(\/|$)/) && (a = a.substr(1));c = b;var d=c.match(/^([^#?]*)/);b = d?d[1]:c;if(a.match(/^\#/))return b + a;c = b.lastIndexOf("/");if(0 > c)return a;for(d = b.substr(0,c + 1) + a;;) {c = d.indexOf("/../");if(0 >= c)break;var e=d.lastIndexOf("/",c - 1);if(0 >= e)break;d = d.substr(0,e) + d.substr(c + 3);}return d.replace(/\/(\.\/)+/g,"/");}function pa(a){a = new RegExp("#(.*&)?" + qa(a) + "=([^#&]*)");return (a = window.location.href.match(a))?a[2]:null;}function ra(a,b){var c=new RegExp("#(.*&)?" + qa("f") + "=([^#&]*)"),d=a.match(c);return d?(c = d[2].length,d = d.index + d[0].length - c,a.substr(0,d) + b + a.substr(d + c)):a.match(/#/)?a + "&f=" + b:a + "#f=" + b;}function sa(a){return null == a?a:a.toString();}function ta(){this.b = [null];}ta.prototype.length = function(){return this.b.length - 1;};function ua(a,b){a && (b = "-" + b,a = a.replace(/-/g,""),"moz" === a && (a = "Moz"));return a + b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase();});}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};function ya(a,b){if("writing-mode" === b){var c=document.createElement("span");if("-ms-" === a)return c.style.setProperty(a + b,"tb-rl"),"tb-rl" === c.style["writing-mode"];c.style.setProperty(a + b,"vertical-rl");return "vertical-rl" === c.style[a + b];}return "string" === typeof document.documentElement.style[ua(a,b)];}function za(a){var b=xa[a];if(b || null === b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a] = ["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a] = ["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a] = ["-webkit-clip-path","clip-path"];}for(b = 0;b < wa.length;b++) {var c=wa[b];if(ya(c,a))return b = c + a,xa[a] = [b],[b];}v.b("Property not supported by the browser: ",a);return xa[a] = null;}function w(a,b,c){try{var d=za(b);d && d.forEach(function(b){if("-ms-writing-mode" === b)switch(c){case "horizontal-tb":c = "lr-tb";break;case "vertical-rl":c = "tb-rl";break;case "vertical-lr":c = "tb-lr";}a && a.style && a.style.setProperty(b,c);});}catch(e) {v.b(e);}}function Aa(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b);}catch(e) {}return c || "";}function Ba(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b || "http://www.w3.org/1999/xhtml" != a.namespaceURI || (b = a.getAttribute("lang"));return b;}function Ca(){this.b = [];}Ca.prototype.append = function(a){this.b.push(a);return this;};Ca.prototype.toString = function(){var a=this.b.join("");this.b = [a];return a;};function Da(a){return "\\" + a.charCodeAt(0).toString(16) + " ";}function Ga(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Da);}function Ha(a){return a.replace(/[\u0000-\u001F"]/g,Da);}function Ia(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent);}function Ja(a){return !!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/);}function qa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return ("string" === typeof b?b:"\\u") + (65536 | a.charCodeAt(0)).toString(16).substr(1);});}function Ka(a){var b=":",b="string" === typeof b?b:"\\u",c=new RegExp(qa(b) + "[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string" === typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16));});}function La(a){if(!a)throw "Assert failed";}function Ma(a,b){for(var c=0,d=a;;) {La(c <= d);La(!c || !b(c - 1));La(d == a || b(d));if(c == d)return c;var e=c + d >> 1;b(e)?d = e:c = e + 1;}}function Na(a,b){return a - b;}function Oa(a,b){for(var c={},d=0;d < a.length;d++) {var e=a[d],f=b(e);f && !c[f] && (c[f] = e);}return c;}var Pa={};function Ra(a,b){for(var c={},d=0;d < a.length;d++) {var e=a[d],f=b(e);f && (c[f]?c[f].push(e):c[f] = [e]);}return c;}function Sa(a,b){for(var c=Array(a.length),d=0;d < a.length;d++) c[d] = b(a[d],d);return c;}function Ta(a,b){var c={},d;for(d in a) c[d] = b(a[d],d);return c;}function Ua(){this.h = {};}function Va(a,b){var c=a.h[b.type];if(c){b.target = a;b.currentTarget = a;for(var d=0;d < c.length;d++) c[d](b);}}Ua.prototype.addEventListener = function(a,b,c){c || ((c = this.h[a])?c.push(b):this.h[a] = [b]);};Ua.prototype.removeEventListener = function(a,b,c){!c && (a = this.h[a]) && (b = a.indexOf(b),0 <= b && a.splice(b,1));};var Wa=null,Xa=null,Ya=null,Za=null;function $a(a){return 1 == a.nodeType && (a = a.getAttribute("id")) && a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null;}function ab(a){return "^" + a;}function bb(a){return a.substr(1);}function cb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,bb):a;}function db(a){for(var b={};a;) {var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a: {e = c[2];var f=[];do {var g=e.match(/^(\^,|[^,])*/),h=cb(g[0]);e = e.substr(g[0].length + 1);if(!e && !f.length){e = h;break a;}f.push(h);}while(e);e = f;}b[d] = e;a = a.substr(c[0].length);}return b;}function eb(){}eb.prototype.g = function(a){a.append("!");};eb.prototype.h = function(){return !1;};function fb(a,b,c){this.index = a;this.id = b;this.qb = c;}fb.prototype.g = function(a){a.append("/");a.append(this.index.toString());if(this.id || this.qb)a.append("["),this.id && a.append(this.id),this.qb && (a.append(";s="),a.append(this.qb)),a.append("]");};fb.prototype.h = function(a){if(1 != a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index / 2) - 1;0 > e || !d?(c = b.firstChild,a.node = c || b):(c = c[Math.min(e,d - 1)],this.index & 1 && ((b = c.nextSibling) && 1 != b.nodeType?c = b:a.K = !0),a.node = c);if(this.id && (a.K || this.id != $a(a.node)))throw Error("E_CFI_ID_MISMATCH");a.qb = this.qb;return !0;};function gb(a,b,c,d){this.offset = a;this.f = b;this.b = c;this.qb = d;}gb.prototype.h = function(a){if(0 < this.offset && !a.K){for(var b=this.offset,c=a.node;;) {var d=c.nodeType;if(1 == d)break;var e=c.nextSibling;if(3 <= d && 5 >= d){d = c.textContent.length;if(b <= d)break;if(!e){b = d;break;}b -= d;}if(!e){b = 0;break;}c = e;}a.node = c;a.offset = b;}a.qb = this.qb;return !0;};gb.prototype.g = function(a){a.append(":");a.append(this.offset.toString());if(this.f || this.b || this.qb){a.append("[");if(this.f || this.b)this.f && a.append(this.f.replace(/[\[\]\(\),=;^]/g,ab)),a.append(","),this.b && a.append(this.b.replace(/[\[\]\(\),=;^]/g,ab));this.qb && (a.append(";s="),a.append(this.qb));a.append("]");}};function hb(){this.ma = null;}function ib(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;) switch(d.charAt(e)){case "/":e++;c = d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e + c[0].length,g=parseInt(c[1],10),h=c[3],c=db(c[4]);f.push(new fb(g,h,sa(c.s)));break;case ":":e++;c = d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e += c[0].length;g = parseInt(c[1],10);(h = c[4]) && (h = cb(h));var l=c[7];l && (l = cb(l));c = db(c[10]);f.push(new gb(g,h,l,sa(c.s)));break;case "!":e++;f.push(new eb());break;case "~":case "@":case "":a.ma = f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function jb(a,b){for(var c={node:b.documentElement,offset:0,K:!1,qb:null,$c:null},d=0;d < a.ma.length;d++) if(!a.ma[d].h(c)){++d < a.ma.length && (c.$c = new hb(),c.$c.ma = a.ma.slice(d));break;}return c;}hb.prototype.trim = function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"");};function kb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;) {switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c += m,h || (h = k)):(c > m && (c = m),d = !0,h = k.substr(0,c),l = k.substr(c));b = b.previousSibling;continue;case 8:b = b.previousSibling;continue;}break;}if(0 < c || h || l)h = a.trim(h,!1),l = a.trim(l,!0),f.push(new gb(c,h,l,e)),e = null;for(;g && g && 9 != g.nodeType;) {c = d?null:$a(b);for(d = d?1:0;b;) 1 == b.nodeType && (d += 2),b = b.previousSibling;f.push(new fb(d,c,e));e = null;b = g;g = g.parentNode;d = !1;}f.reverse();a.ma?(f.push(new eb()),a.ma = f.concat(a.ma)):a.ma = f;}hb.prototype.toString = function(){if(!this.ma)return "";var a=new Ca();a.append("epubcfi(");for(var b=0;b < this.ma.length;b++) this.ma[b].g(a);a.append(")");return a.toString();};function lb(){return {fontFamily:"serif",lineHeight:1.25,margin:8,be:!1,Wd:25,ae:!1,ie:!1,rb:!1,Fc:1,Ce:{print:!0},fc:void 0};}function mb(a){return {fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,be:a.be,Wd:a.Wd,ae:a.ae,ie:a.ie,rb:a.rb,Fc:a.Fc,Ce:Object.assign({},a.Ce),fc:a.fc?Object.assign({},a.fc):void 0};}var nb=lb(),ob={};function pb(a,b,c,d){a = Math.min((a - 0) / c,(b - 0) / d);return "matrix(" + a + ",0,0," + a + ",0,0)";}function qb(a){return '"' + Ha(a + "") + '"';}function rb(a){return Ga(a + "");}function sb(a,b){return a?Ga(a) + "." + Ga(b):Ga(b);}var tb=0;function ub(a,b){this.parent = a;this.A = "S" + tb++;this.C = [];this.b = new wb(this,0);this.f = new wb(this,1);this.j = new wb(this,!0);this.h = new wb(this,!1);a && a.C.push(this);this.values = {};this.G = {};this.F = {};this.l = b;if(!a){var c=this.F;c.floor = Math.floor;c.ceil = Math.ceil;c.round = Math.round;c.sqrt = Math.sqrt;c.min = Math.min;c.max = Math.max;c.letterbox = pb;c["css-string"] = qb;c["css-name"] = rb;c["typeof"] = function(a){return typeof a;};xb(this,"page-width",function(){return this.Ub();});xb(this,"page-height",function(){return this.Tb();});xb(this,"pref-font-family",function(){return this.X.fontFamily;});xb(this,"pref-night-mode",function(){return this.X.ie;});xb(this,"pref-hyphenate",function(){return this.X.be;});xb(this,"pref-margin",function(){return this.X.margin;});xb(this,"pref-line-height",function(){return this.X.lineHeight;});xb(this,"pref-column-width",function(){return this.X.Wd * this.fontSize;});xb(this,"pref-horizontal",function(){return this.X.ae;});xb(this,"pref-spread-view",function(){return this.X.rb;});}}function xb(a,b,c){a.values[b] = new yb(a,c,b);}function zb(a,b){a.values["page-number"] = b;}function Ab(a,b){a.F["has-content"] = b;}var Bb={px:1,"in":96,pt:4 / 3,pc:16,cm:96 / 2.54,mm:96 / 25.4,q:96 / 2.54 / 40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1 / 96,dpcm:2.54 / 96};function Cb(a){switch(a){case "q":case "rem":case "rex":return !0;default:return !1;}}function Db(a,b,c,d){this.Sa = b;this.Eb = c;this.O = null;this.Ub = function(){return this.O?this.O:this.X.rb?Math.floor(b / 2) - this.X.Fc:b;};this.J = null;this.Tb = function(){return this.J?this.J:c;};this.A = d;this.na = null;this.fontSize = function(){return this.na?this.na:d;};this.X = nb;this.H = {};}function Eb(a,b){a.H[b.A] = {};for(var c=0;c < b.C.length;c++) Eb(a,b.C[c]);}function Fb(a,b,c){return "vw" == b?a.Ub() / 100:"vh" == b?a.Tb() / 100:"em" == b || "rem" == b?c?a.A:a.fontSize():"ex" == b || "rex" == b?Bb.ex * (c?a.A:a.fontSize()) / Bb.em:Bb[b];}function Gb(a,b,c){do {var d=b.values[c];if(d || b.l && (d = b.l.call(a,c,!1)))return d;b = b.parent;}while(b);throw Error("Name '" + c + "' is undefined");}function Hb(a,b,c,d,e){do {var f=b.G[c];if(f || b.l && (f = b.l.call(a,c,!0)))return f;if(f = b.F[c]){if(e)return b.b;c = Array(d.length);for(e = 0;e < d.length;e++) c[e] = d[e].evaluate(a);return new wb(b,f.apply(a,c));}b = b.parent;}while(b);throw Error("Function '" + c + "' is undefined");}function Ib(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e && (d = e[1],b = e[2]);var f=e = null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c && (e = c.evaluate(a));}switch(b){case "width":f = a.Ub();break;case "height":f = a.Tb();break;case "device-width":f = window.screen.availWidth;break;case "device-height":f = window.screen.availHeight;break;case "color":f = window.screen.pixelDepth;}if(null != f && null != e)switch(d){case "min":return f >= e;case "max":return f <= e;default:return f == e;}else if(null != f && !c)return !!f;return !1;}function Jb(a){this.b = a;this.h = "_" + tb++;}n = Jb.prototype;n.toString = function(){var a=new Ca();this.xa(a,0);return a.toString();};n.xa = function(){throw Error("F_ABSTRACT");};n.jb = function(){throw Error("F_ABSTRACT");};n.$a = function(){return this;};n.gc = function(a){return a === this;};function Kb(a,b,c,d){var e=d[a.h];if(null != e)return e === ob?!1:e;d[a.h] = ob;b = a.gc(b,c,d);return d[a.h] = b;}n.evaluate = function(a){var b;b = (b = a.H[this.b.A])?b[this.h]:void 0;if("undefined" != typeof b)return b;b = this.jb(a);var c=this.h,d=this.b,e=a.H[d.A];e || (e = {},a.H[d.A] = e);return e[c] = b;};n.Ke = function(){return !1;};function Lb(a,b){Jb.call(this,a);this.f = b;}t(Lb,Jb);n = Lb.prototype;n.ve = function(){throw Error("F_ABSTRACT");};n.Ee = function(){throw Error("F_ABSTRACT");};n.jb = function(a){a = this.f.evaluate(a);return this.Ee(a);};n.gc = function(a,b,c){return a === this || Kb(this.f,a,b,c);};n.xa = function(a,b){10 < b && a.append("(");a.append(this.ve());this.f.xa(a,10);10 < b && a.append(")");};n.$a = function(a,b){var c=this.f.$a(a,b);return c === this.f?this:new this.constructor(this.b,c);};function Mb(a,b,c){Jb.call(this,a);this.f = b;this.g = c;}t(Mb,Jb);n = Mb.prototype;n.ld = function(){throw Error("F_ABSTRACT");};n.Va = function(){throw Error("F_ABSTRACT");};n.ob = function(){throw Error("F_ABSTRACT");};n.jb = function(a){var b=this.f.evaluate(a);a = this.g.evaluate(a);return this.ob(b,a);};n.gc = function(a,b,c){return a === this || Kb(this.f,a,b,c) || Kb(this.g,a,b,c);};n.xa = function(a,b){var c=this.ld();c <= b && a.append("(");this.f.xa(a,c);a.append(this.Va());this.g.xa(a,c);c <= b && a.append(")");};n.$a = function(a,b){var c=this.f.$a(a,b),d=this.g.$a(a,b);return c === this.f && d === this.g?this:new this.constructor(this.b,c,d);};function Nb(a,b,c){Mb.call(this,a,b,c);}t(Nb,Mb);Nb.prototype.ld = function(){return 1;};function Ob(a,b,c){Mb.call(this,a,b,c);}t(Ob,Mb);Ob.prototype.ld = function(){return 2;};function Pb(a,b,c){Mb.call(this,a,b,c);}t(Pb,Mb);Pb.prototype.ld = function(){return 3;};function Qb(a,b,c){Mb.call(this,a,b,c);}t(Qb,Mb);Qb.prototype.ld = function(){return 4;};function Rb(a,b){Lb.call(this,a,b);}t(Rb,Lb);Rb.prototype.ve = function(){return "!";};Rb.prototype.Ee = function(a){return !a;};function Sb(a,b){Lb.call(this,a,b);}t(Sb,Lb);Sb.prototype.ve = function(){return "-";};Sb.prototype.Ee = function(a){return -a;};function Tb(a,b,c){Mb.call(this,a,b,c);}t(Tb,Nb);Tb.prototype.Va = function(){return "&&";};Tb.prototype.jb = function(a){return this.f.evaluate(a) && this.g.evaluate(a);};function Ub(a,b,c){Mb.call(this,a,b,c);}t(Ub,Tb);Ub.prototype.Va = function(){return " and ";};function Vb(a,b,c){Mb.call(this,a,b,c);}t(Vb,Nb);Vb.prototype.Va = function(){return "||";};Vb.prototype.jb = function(a){return this.f.evaluate(a) || this.g.evaluate(a);};function Wb(a,b,c){Mb.call(this,a,b,c);}t(Wb,Vb);Wb.prototype.Va = function(){return ", ";};function Xb(a,b,c){Mb.call(this,a,b,c);}t(Xb,Ob);Xb.prototype.Va = function(){return "<";};Xb.prototype.ob = function(a,b){return a < b;};function Yb(a,b,c){Mb.call(this,a,b,c);}t(Yb,Ob);Yb.prototype.Va = function(){return "<=";};Yb.prototype.ob = function(a,b){return a <= b;};function Zb(a,b,c){Mb.call(this,a,b,c);}t(Zb,Ob);Zb.prototype.Va = function(){return ">";};Zb.prototype.ob = function(a,b){return a > b;};function $b(a,b,c){Mb.call(this,a,b,c);}t($b,Ob);$b.prototype.Va = function(){return ">=";};$b.prototype.ob = function(a,b){return a >= b;};function ac(a,b,c){Mb.call(this,a,b,c);}t(ac,Ob);ac.prototype.Va = function(){return "==";};ac.prototype.ob = function(a,b){return a == b;};function bc(a,b,c){Mb.call(this,a,b,c);}t(bc,Ob);bc.prototype.Va = function(){return "!=";};bc.prototype.ob = function(a,b){return a != b;};function cc(a,b,c){Mb.call(this,a,b,c);}t(cc,Pb);cc.prototype.Va = function(){return "+";};cc.prototype.ob = function(a,b){return a + b;};function dc(a,b,c){Mb.call(this,a,b,c);}t(dc,Pb);dc.prototype.Va = function(){return " - ";};dc.prototype.ob = function(a,b){return a - b;};function ec(a,b,c){Mb.call(this,a,b,c);}t(ec,Qb);ec.prototype.Va = function(){return "*";};ec.prototype.ob = function(a,b){return a * b;};function fc(a,b,c){Mb.call(this,a,b,c);}t(fc,Qb);fc.prototype.Va = function(){return "/";};fc.prototype.ob = function(a,b){return a / b;};function gc(a,b,c){Mb.call(this,a,b,c);}t(gc,Qb);gc.prototype.Va = function(){return "%";};gc.prototype.ob = function(a,b){return a % b;};function hc(a,b,c){Jb.call(this,a);this.M = b;this.ga = c.toLowerCase();}t(hc,Jb);hc.prototype.xa = function(a){a.append(this.M.toString());a.append(Ga(this.ga));};hc.prototype.jb = function(a){return this.M * Fb(a,this.ga,!1);};function ic(a,b){Jb.call(this,a);this.f = b;}t(ic,Jb);ic.prototype.xa = function(a){a.append(this.f);};ic.prototype.jb = function(a){return Gb(a,this.b,this.f).evaluate(a);};ic.prototype.gc = function(a,b,c){return a === this || Kb(Gb(b,this.b,this.f),a,b,c);};function jc(a,b,c){Jb.call(this,a);this.f = b;this.name = c;}t(jc,Jb);jc.prototype.xa = function(a){this.f && a.append("not ");a.append(Ga(this.name));};jc.prototype.jb = function(a){var b=this.name;a = "all" === b || !!a.X.Ce[b];return this.f?!a:a;};jc.prototype.gc = function(a,b,c){return a === this || Kb(this.value,a,b,c);};jc.prototype.Ke = function(){return !0;};function yb(a,b,c){Jb.call(this,a);this.Cc = b;this.Ic = c;}t(yb,Jb);yb.prototype.xa = function(a){a.append(this.Ic);};yb.prototype.jb = function(a){return this.Cc.call(a);};function kc(a,b,c){Jb.call(this,a);this.g = b;this.f = c;}t(kc,Jb);kc.prototype.xa = function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c < b.length;c++) c && a.append(","),b[c].xa(a,0);a.append(")");};kc.prototype.jb = function(a){return Hb(a,this.b,this.g,this.f,!1).$a(a,this.f).evaluate(a);};kc.prototype.gc = function(a,b,c){if(a === this)return !0;for(var d=0;d < this.f.length;d++) if(Kb(this.f[d],a,b,c))return !0;return Kb(Hb(b,this.b,this.g,this.f,!0),a,b,c);};kc.prototype.$a = function(a,b){for(var c,d=c = this.f,e=0;e < c.length;e++) {var f=c[e].$a(a,b);if(c !== d)d[e] = f;else if(f !== c[e]){for(var d=Array(c.length),g=0;g < e;g++) d[g] = c[g];d[e] = f;}}c = d;return c === this.f?this:new kc(this.b,this.g,c);};function lc(a,b,c,d){Jb.call(this,a);this.f = b;this.j = c;this.g = d;}t(lc,Jb);lc.prototype.xa = function(a,b){0 < b && a.append("(");this.f.xa(a,0);a.append("?");this.j.xa(a,0);a.append(":");this.g.xa(a,0);0 < b && a.append(")");};lc.prototype.jb = function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a);};lc.prototype.gc = function(a,b,c){return a === this || Kb(this.f,a,b,c) || Kb(this.j,a,b,c) || Kb(this.g,a,b,c);};lc.prototype.$a = function(a,b){var c=this.f.$a(a,b),d=this.j.$a(a,b),e=this.g.$a(a,b);return c === this.f && d === this.j && e === this.g?this:new lc(this.b,c,d,e);};function wb(a,b){Jb.call(this,a);this.f = b;}t(wb,Jb);wb.prototype.xa = function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ha(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};wb.prototype.jb = function(){return this.f;};function mc(a,b,c){Jb.call(this,a);this.name = b;this.value = c;}t(mc,Jb);mc.prototype.xa = function(a){a.append("(");a.append(Ha(this.name.name));a.append(":");this.value.xa(a,0);a.append(")");};mc.prototype.jb = function(a){return Ib(a,this.name.name,this.value);};mc.prototype.gc = function(a,b,c){return a === this || Kb(this.value,a,b,c);};mc.prototype.$a = function(a,b){var c=this.value.$a(a,b);return c === this.value?this:new mc(this.b,this.name,c);};function nc(a,b){Jb.call(this,a);this.index = b;}t(nc,Jb);nc.prototype.xa = function(a){a.append("$");a.append(this.index.toString());};nc.prototype.$a = function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: " + this.index);return c;};function oc(a,b,c){return b === a.h || b === a.b || c == a.h || c == a.b?a.h:b === a.j || b === a.f?c:c === a.j || c === a.f?b:new Tb(a,b,c);}function x(a,b,c){return b === a.b?c:c === a.b?b:new cc(a,b,c);}function y(a,b,c){return b === a.b?new Sb(a,c):c === a.b?b:new dc(a,b,c);}function pc(a,b,c){return b === a.b || c === a.b?a.b:b === a.f?c:c === a.f?b:new ec(a,b,c);}function qc(a,b,c){return b === a.b?a.b:c === a.f?b:new fc(a,b,c);};var rc={};function sc(){}n = sc.prototype;n.$b = function(a){for(var b=0;b < a.length;b++) a[b].ba(this);};n.se = function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.te = function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.hd = function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Zb = function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Mc = function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Lc = function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Kc = function(a){return this.Lc(a);};n.Od = function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Nc = function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Ab = function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Yb = function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Ib = function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Jc = function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function tc(){}t(tc,sc);n = tc.prototype;n.$b = function(a){for(var b=null,c=0;c < a.length;c++) {var d=a[c],e=d.ba(this);if(b)b[c] = e;else if(d !== e){b = Array(a.length);for(d = 0;d < c;d++) b[d] = a[d];b[c] = e;}}return b || a;};n.hd = function(a){return a;};n.Zb = function(a){return a;};n.te = function(a){return a;};n.Mc = function(a){return a;};n.Lc = function(a){return a;};n.Kc = function(a){return a;};n.Od = function(a){return a;};n.Nc = function(a){return a;};n.Ab = function(a){var b=this.$b(a.values);return b === a.values?a:new uc(b);};n.Yb = function(a){var b=this.$b(a.values);return b === a.values?a:new vc(b);};n.Ib = function(a){var b=this.$b(a.values);return b === a.values?a:new wc(a.name,b);};n.Jc = function(a){return a;};function xc(){}n = xc.prototype;n.toString = function(){var a=new Ca();this.Ta(a,!0);return a.toString();};n.stringValue = function(){var a=new Ca();this.Ta(a,!1);return a.toString();};n.ta = function(){throw Error("F_ABSTRACT");};n.Ta = function(a){a.append("[error]");};n.Ie = function(){return !1;};n.kc = function(){return !1;};n.Le = function(){return !1;};n.zf = function(){return !1;};n.yd = function(){return !1;};function yc(){if(B)throw Error("E_INVALID_CALL");}t(yc,xc);yc.prototype.ta = function(a){return new wb(a,"");};yc.prototype.Ta = function(){};yc.prototype.ba = function(a){return a.se(this);};var B=new yc();function zc(){if(Ac)throw Error("E_INVALID_CALL");}t(zc,xc);zc.prototype.ta = function(a){return new wb(a,"/");};zc.prototype.Ta = function(a){a.append("/");};zc.prototype.ba = function(a){return a.te(this);};var Ac=new zc();function Bc(a){this.Ic = a;}t(Bc,xc);Bc.prototype.ta = function(a){return new wb(a,this.Ic);};Bc.prototype.Ta = function(a,b){b?(a.append('"'),a.append(Ha(this.Ic)),a.append('"')):a.append(this.Ic);};Bc.prototype.ba = function(a){return a.hd(this);};function Cc(a){this.name = a;if(rc[a])throw Error("E_INVALID_CALL");rc[a] = this;}t(Cc,xc);Cc.prototype.ta = function(a){return new wb(a,this.name);};Cc.prototype.Ta = function(a,b){b?a.append(Ga(this.name)):a.append(this.name);};Cc.prototype.ba = function(a){return a.Zb(this);};Cc.prototype.zf = function(){return !0;};function C(a){var b=rc[a];b || (b = new Cc(a));return b;}function D(a,b){this.M = a;this.ga = b.toLowerCase();}t(D,xc);D.prototype.ta = function(a,b){return this.M?b && "%" == this.ga?100 == this.M?b:new ec(a,b,new wb(a,this.M / 100)):new hc(a,this.M,this.ga):a.b;};D.prototype.Ta = function(a){a.append(this.M.toString());a.append(this.ga);};D.prototype.ba = function(a){return a.Mc(this);};D.prototype.kc = function(){return !0;};function Dc(a){this.M = a;}t(Dc,xc);Dc.prototype.ta = function(a){return this.M?1 == this.M?a.f:new wb(a,this.M):a.b;};Dc.prototype.Ta = function(a){a.append(this.M.toString());};Dc.prototype.ba = function(a){return a.Lc(this);};Dc.prototype.Le = function(){return !0;};function Ec(a){this.M = a;}t(Ec,Dc);Ec.prototype.ba = function(a){return a.Kc(this);};function Fc(a){this.f = a;}t(Fc,xc);Fc.prototype.Ta = function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b);};Fc.prototype.ba = function(a){return a.Od(this);};function Gc(a){this.url = a;}t(Gc,xc);Gc.prototype.Ta = function(a){a.append('url("');a.append(Ha(this.url));a.append('")');};Gc.prototype.ba = function(a){return a.Nc(this);};function Hc(a,b,c,d){var e=b.length;b[0].Ta(a,d);for(var f=1;f < e;f++) a.append(c),b[f].Ta(a,d);}function uc(a){this.values = a;}t(uc,xc);uc.prototype.Ta = function(a,b){Hc(a,this.values," ",b);};uc.prototype.ba = function(a){return a.Ab(this);};uc.prototype.yd = function(){return !0;};function vc(a){this.values = a;}t(vc,xc);vc.prototype.Ta = function(a,b){Hc(a,this.values,",",b);};vc.prototype.ba = function(a){return a.Yb(this);};function wc(a,b){this.name = a;this.values = b;}t(wc,xc);wc.prototype.Ta = function(a,b){a.append(Ga(this.name));a.append("(");Hc(a,this.values,",",b);a.append(")");};wc.prototype.ba = function(a){return a.Ib(this);};function G(a){this.b = a;}t(G,xc);G.prototype.ta = function(){return this.b;};G.prototype.Ta = function(a){a.append("-epubx-expr(");this.b.xa(a,0);a.append(")");};G.prototype.ba = function(a){return a.Jc(this);};G.prototype.Ie = function(){return !0;};function Ic(a,b){if(a){if(a.kc())return Fb(b,a.ga,!1) * a.M;if(a.Le())return a.M;}return 0;}var Jc=C("absolute"),Kc=C("all"),Lc=C("always"),Mc=C("auto");C("avoid");var Nc=C("block"),Oc=C("block-end"),Pc=C("block-start"),Qc=C("both"),Rc=C("bottom"),Sc=C("border-box"),Tc=C("break-all"),Uc=C("break-word"),Vc=C("crop"),Wc=C("cross");C("column");var Xc=C("exclusive"),Yc=C("false"),Zc=C("fixed"),$c=C("flex"),ad=C("footnote"),bd=C("footer"),cd=C("header");C("hidden");var dd=C("horizontal-tb"),ed=C("inherit"),fd=C("inline"),gd=C("inline-block"),hd=C("inline-end"),id=C("inline-start"),jd=C("landscape"),kd=C("left"),ld=C("line"),md=C("list-item"),nd=C("ltr");C("manual");var H=C("none"),od=C("normal"),pd=C("oeb-page-foot"),qd=C("oeb-page-head"),rd=C("page"),sd=C("relative"),td=C("right"),ud=C("scale"),vd=C("snap-block");C("spread");var wd=C("static"),xd=C("rtl"),yd=C("table"),zd=C("table-caption"),Ad=C("table-cell"),Bd=C("table-footer-group"),Cd=C("table-header-group");C("table-row");var Dd=C("top"),Ed=C("transparent"),Fd=C("vertical-lr"),Gd=C("vertical-rl"),Hd=C("visible"),Id=C("true"),Jd=new D(100,"%"),Kd=new D(100,"vw"),Ld=new D(100,"vh"),Md=new D(0,"px"),Nd={"font-size":1,color:2};function Od(a,b){return (Nd[a] || Number.MAX_VALUE) - (Nd[b] || Number.MAX_VALUE);};var Pd={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR",POST_LAYOUT_BLOCK:"POST_LAYOUT_BLOCK"},Qd={};function Rd(a,b){if(Pd[a]){var c=Qd[a];c || (c = Qd[a] = []);c.push(b);}else v.b(Error("Skipping unknown plugin hook '" + a + "'."));}function Sd(a){return Qd[a] || [];}ba("vivliostyle.plugin.registerHook",Rd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Pd[a]){var c=Qd[a];if(c){var d=c.indexOf(b);0 <= d && c.splice(d,1);}}else v.b(Error("Ignoring unknown plugin hook '" + a + "'."));});var Td=null,Ud=null;function J(a){if(!Td)throw Error("E_TASK_NO_CONTEXT");Td.name || (Td.name = a);var b=Td;a = new Vd(b,b.top,a);b.top = a;a.b = Wd;return a;}function K(a){return new Xd(a);}function Yd(a,b,c){a = J(a);a.j = c;try{b(a);}catch(d) {Zd(a.f,d,a);}return a.result();}function $d(a){var b=ae,c;Td?c = Td.f:(c = Ud) || (c = new be(new ce()));b(c,a,void 0);}var Wd=1;function ce(){}ce.prototype.currentTime = function(){return new Date().valueOf();};function de(a,b){return setTimeout(a,b);}function be(a){this.g = a;this.h = 1;this.slice = 25;this.l = 0;this.f = new ta();this.b = this.A = null;this.j = !1;this.order = 0;Ud || (Ud = this);}function ee(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null != a.b){if(c + a.h > a.A)return;clearTimeout(a.b);}b -= c;b <= a.h && (b = a.h);a.A = c + b;a.b = de(function(){a.b = null;null != a.b && (clearTimeout(a.b),a.b = null);a.j = !0;try{var b=a.g.currentTime();for(a.l = b + a.slice;a.f.length();) {var c=a.f.b[1];if(c.b > b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1 < h){for(var l=1;;) {var k=2 * l;if(k >= h)break;if(0 < fe(f.b[k],g))k + 1 < h && 0 < fe(f.b[k + 1],f.b[k]) && k++;else if(k + 1 < h && 0 < fe(f.b[k + 1],g))k++;else break;f.b[l] = f.b[k];l = k;}f.b[l] = g;}if(!c.g){var l=c,m=l.f;l.f = null;m && m.b == l && (m.b = null,k = Td,Td = m,M(m.top,l.result),Td = k);}b = a.g.currentTime();if(b >= a.l)break;}}catch(p) {v.error(p);}a.j = !1;a.f.length() && ee(a);},b);}}be.prototype.ib = function(a,b){var c=this.g.currentTime();a.order = this.order++;a.b = c + (b || 0);a: {for(var c=this.f,d=c.b.length;1 < d;) {var e=Math.floor(d / 2),f=c.b[e];if(0 < fe(f,a)){c.b[d] = a;break a;}c.b[d] = f;d = e;}c.b[1] = a;}ee(this);};function ae(a,b,c){var d=new ge(a,c || "");d.top = new Vd(d,null,"bootstrap");d.top.b = Wd;d.top.then(function(){function a(){d.j = !1;for(var a=0;a < d.h.length;a++) {var b=d.h[a];try{b();}catch(h) {v.error(h);}}}try{b().then(function(b){d.result = b;a();});}catch(f) {Zd(d,f),a();}});c = Td;Td = d;a.ib(he(d.top,"bootstrap"));Td = c;return d;}function ie(a){this.f = a;this.order = this.b = 0;this.result = null;this.g = !1;}function fe(a,b){return b.b - a.b || b.order - a.order;}ie.prototype.ib = function(a,b){this.result = a;this.f.f.ib(this,b);};function ge(a,b){this.f = a;this.name = b;this.h = [];this.g = null;this.j = !0;this.b = this.top = this.l = this.result = null;}function je(a,b){a.h.push(b);}ge.prototype.join = function(){var a=J("Task.join");if(this.j){var b=he(a,this),c=this;je(this,function(){b.ib(c.result);});}else M(a,this.result);return a.result();};function Zd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack + "\n\t---- async ---\n":"",e=a.top;e;e = e.parent) d += "\t",d += e.name,d += "\n";b.frameTrace = d;}if(c){for(d = a.top;d && d != c;) d = d.parent;d == c && (a.top = d);}for(a.g = b;a.top && !a.top.j;) a.top = a.top.parent;a.top?(b = a.g,a.g = null,a.top.j(a.top,b)):a.g && v.error(a.g,"Unhandled exception in task",a.name);}function Xd(a){this.value = a;}n = Xd.prototype;n.then = function(a){a(this.value);};n.fa = function(a){return a(this.value);};n.tc = function(a){return new Xd(a);};n.Da = function(a){M(a,this.value);};n.Pa = function(){return !1;};n.get = function(){return this.value;};function ke(a){this.b = a;}n = ke.prototype;n.then = function(a){this.b.then(a);};n.fa = function(a){if(this.Pa()){var b=new Vd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b = Wd;this.b.parent = b;this.b.then(function(c){a(c).then(function(a){M(b,a);});});return b.result();}return a(this.b.g);};n.tc = function(a){return this.Pa()?this.fa(function(){return new Xd(a);}):new Xd(a);};n.Da = function(a){this.Pa()?this.then(function(b){M(a,b);}):M(a,this.b.g);};n.Pa = function(){return this.b.b == Wd;};n.get = function(){if(this.Pa())throw Error("Result is pending");return this.b.g;};function Vd(a,b,c){this.f = a;this.parent = b;this.name = c;this.g = null;this.b = 0;this.j = this.h = null;}function le(a){if(!Td)throw Error("F_TASK_NO_CONTEXT");if(a !== Td.top)throw Error("F_TASK_NOT_TOP_FRAME");}Vd.prototype.result = function(){return new ke(this);};function M(a,b){le(a);Td.g || (a.g = b);a.b = 2;var c=a.parent;Td.top = c;if(a.h){try{a.h(b);}catch(d) {Zd(a.f,d,c);}a.b = 3;}}Vd.prototype.then = function(a){switch(this.b){case Wd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h = a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b = 3;}catch(d) {this.b = 3,Zd(b,d,c);}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE " + this.b);}};function me(){var a=J("Frame.timeSlice"),b=a.f.f;b.g.currentTime() >= b.l?(v.debug("-- time slice --"),he(a).ib(!0)):M(a,!0);return a.result();}function ne(a){var b=J("Frame.sleep");he(b).ib(!0,a);return b.result();}function oe(a){function b(d){try{for(;d;) {var e=a();if(e.Pa()){e.then(b);return;}e.then(function(a){d = a;});}M(c,!0);}catch(f) {Zd(c.f,f,c);}}var c=J("Frame.loop");b(!0);return c.result();}function pe(a){var b=Td;if(!b)throw Error("E_TASK_NO_CONTEXT");return oe(function(){var c;do c = new qe(b,b.top),b.top = c,c.b = Wd,a(c),c = c.result();while(!c.Pa() && c.get());return c;});}function he(a,b){le(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ie(a.f);a.f.b = c;Td = null;a.f.l = b || null;return c;}function qe(a,b){Vd.call(this,a,b,"loop");}t(qe,Vd);function N(a){M(a,!0);}function O(a){M(a,!1);};function re(a,b){this.fetch = a;this.name = b;this.f = !1;this.b = this.h = null;this.g = [];}re.prototype.start = function(){if(!this.b){var a=this;this.b = ae(Td.f,function(){var b=J("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f = !0;a.h = c;a.b = null;a.g = [];if(d)for(var e=0;e < d.length;e++) try{d[e](c);}catch(f) {v.error(f,"Error:");}M(b,c);});return b.result();},this.name);}};function se(a,b){a.f?b(a.h):a.g.push(b);}re.prototype.get = function(){if(this.f)return K(this.h);this.start();return this.b.join();};function te(a){if(!a.length)return K(!0);if(1 == a.length)return a[0].get().tc(!0);var b=J("waitForFetches"),c=0;oe(function(){for(;c < a.length;) {var b=a[c++];if(!b.f)return b.get().tc(!0);}return K(!1);}).then(function(){M(b,!0);});return b.result();}function ue(a,b){var c=null,d=null;"img" == a.localName && (c = a.getAttribute("width"),d = a.getAttribute("height"));var e=new re(function(){function e(b){l || (l = !0,"img" == a.localName && (c || a.removeAttribute("width"),d || a.removeAttribute("height")),h.ib(b?b.type:"timeout"));}var g=J("loadImage"),h=he(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg" == a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,300)):a.src = b;return g.result();},"loadElement " + b);e.start();return e;};function ve(a){a = a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a = parseInt(a,16);return isNaN(a)?"":65535 >= a?String.fromCharCode(a):1114111 >= a?String.fromCharCode(55296 | a >> 10 & 1023,56320 | a & 1023):"�";}function we(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,ve);}function xe(){this.type = 0;this.b = !1;this.M = 0;this.text = "";this.position = 0;}function ye(a,b){var c=Array(128),d;for(d = 0;128 > d;d++) c[d] = a;c[NaN] = 35 == a?35:72;for(d = 0;d < b.length;d += 2) c[b[d]] = b[d + 1];return c;}var ze=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];ze[NaN] = 80;var Ae=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Ae[NaN] = 43;var Be=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Ae[NaN] = 43;var Ce=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Ce[NaN] = 35;var De=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];De[NaN] = 45;var Ee=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Ee[NaN] = 37;var Fe=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Fe[NaN] = 38;var Ge=ye(35,[61,36]),He=ye(35,[58,77]),Ie=ye(35,[61,36,124,50]),Je=ye(35,[38,51]),Ke=ye(35,[42,54]),Le=ye(39,[42,55]),Me=ye(54,[42,55,47,56]),Ne=ye(62,[62,56]),Oe=ye(35,[61,36,33,70]),Pe=ye(62,[45,71]),Qe=ye(63,[45,56]),Re=ye(76,[9,72,10,72,13,72,32,72]),Se=ye(39,[39,46,10,72,13,72,92,48]),Te=ye(39,[34,46,10,72,13,72,92,49]),Ue=ye(39,[39,47,10,74,13,74,92,48]),Ve=ye(39,[34,47,10,74,13,74,92,49]),We=ye(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Xe=ye(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,72,91,72,93,72,123,72,125,72,NaN,67]),Ye=ye(39,[39,68,10,74,13,74,92,75,NaN,67]),Ze=ye(39,[34,68,10,74,13,74,92,75,NaN,67]),$e=ye(72,[9,39,10,39,13,39,32,39,41,69]);function af(a,b){this.l = b;this.g = 15;this.A = a;this.j = Array(this.g + 1);this.b = -1;for(var c=this.position = this.f = this.h = 0;c <= this.g;c++) this.j[c] = new xe();}function P(a){a.h == a.f && bf(a);return a.j[a.f];}function Q(a,b){(a.h - a.f & a.g) <= b && bf(a);return a.j[a.f + b & a.g];}function R(a){a.f = a.f + 1 & a.g;}function cf(a){if(0 > a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f = a.b;a.b = -1;}af.prototype.error = function(a,b,c){this.l && this.l.error(c,b);};function bf(a){var b=a.h,c=0 <= a.b?a.b:a.f,d=a.g;b >= c?c += d:c--;if(c == b){if(0 > a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2 * (a.g + 1) - 1,c=Array(b + 1),d=a.b,e=0;d != a.h;) c[e] = a.j[d],d == a.f && (a.f = e),d = d + 1 & a.g,e++;a.b = 0;a.h = e;a.g = b;for(a.j = c;e <= b;) c[e++] = new xe();b = a.h;c = d = a.g;}for(var e=ze,f=a.A,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;) {var u=f.charCodeAt(g);switch(e[u] || e[65]){case 72:l = 51;m = isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q = !0;continue;case 2:k = g++;e = Ee;continue;case 3:l = 1;k = g++;e = Ae;continue;case 4:k = g++;l = 31;e = Ge;continue;case 33:l = 2;k = ++g;e = Se;continue;case 34:l = 2;k = ++g;e = Te;continue;case 6:k = ++g;l = 7;e = Ae;continue;case 7:k = g++;l = 32;e = Ge;continue;case 8:k = g++;l = 21;break;case 9:k = g++;l = 32;e = Je;continue;case 10:k = g++;l = 10;break;case 11:k = g++;l = 11;break;case 12:k = g++;l = 36;e = Ge;continue;case 13:k = g++;l = 23;break;case 14:k = g++;l = 16;break;case 15:l = 24;k = g++;e = Ce;continue;case 16:k = g++;e = Be;continue;case 78:k = g++;l = 9;e = Ae;continue;case 17:k = g++;l = 19;e = Ke;continue;case 18:k = g++;l = 18;e = He;continue;case 77:g++;l = 50;break;case 19:k = g++;l = 17;break;case 20:k = g++;l = 38;e = Oe;continue;case 21:k = g++;l = 39;e = Ge;continue;case 22:k = g++;l = 37;e = Ge;continue;case 23:k = g++;l = 22;break;case 24:k = ++g;l = 20;e = Ae;continue;case 25:k = g++;l = 14;break;case 26:k = g++;l = 15;break;case 27:k = g++;l = 12;break;case 28:k = g++;l = 13;break;case 29:z = k = g++;l = 1;e = Re;continue;case 30:k = g++;l = 33;e = Ge;continue;case 31:k = g++;l = 34;e = Ie;continue;case 32:k = g++;l = 35;e = Ge;continue;case 35:break;case 36:g++;l = l + 41 - 31;break;case 37:l = 5;p = parseInt(f.substring(k,g),10);break;case 38:l = 4;p = parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l = 3;p = parseFloat(f.substring(k,g));k = g++;e = Ae;continue;case 41:l = 3;p = parseFloat(f.substring(k,g));m = "%";k = g++;break;case 42:g++;e = Fe;continue;case 43:m = f.substring(k,g);break;case 44:z = g++;e = Re;continue;case 45:m = we(f.substring(k,g));break;case 46:m = f.substring(k,g);g++;break;case 47:m = we(f.substring(k,g));g++;break;case 48:z = g;g += 2;e = Ue;continue;case 49:z = g;g += 2;e = Ve;continue;case 50:g++;l = 25;break;case 51:g++;l = 26;break;case 52:m = f.substring(k,g);if(1 == l){g++;if("url" == m.toLowerCase()){e = We;continue;}l = 6;}break;case 53:m = we(f.substring(k,g));if(1 == l){g++;if("url" == m.toLowerCase()){e = We;continue;}l = 6;}break;case 54:e = Le;g++;continue;case 55:e = Me;g++;continue;case 56:e = ze;g++;continue;case 57:e = Ne;g++;continue;case 58:l = 5;e = Ee;g++;continue;case 59:l = 4;e = Fe;g++;continue;case 60:l = 1;e = Ae;g++;continue;case 61:l = 1;e = Re;z = g++;continue;case 62:g--;break;case 63:g -= 2;break;case 64:k = g++;e = Xe;continue;case 65:k = ++g;e = Ye;continue;case 66:k = ++g;e = Ze;continue;case 67:l = 8;m = we(f.substring(k,g));g++;break;case 69:g++;break;case 70:e = Pe;g++;continue;case 71:e = Qe;g++;continue;case 79:if(8 > g - z && f.substring(z + 1,g + 1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue;}case 68:l = 8;m = we(f.substring(k,g));g++;e = $e;continue;case 74:g++;if(9 > g - z && f.substring(z + 1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l = 51;m = "E_CSS_UNEXPECTED_NEWLINE";break;case 73:if(9 > g - z && f.substring(z + 1,g + 1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue;}m = we(f.substring(k,g));break;case 75:z = g++;continue;case 76:g++;e = De;continue;default:e !== ze?(l = 51,m = "E_CSS_UNEXPECTED_STATE"):(k = g,l = 0);}r.type = l;r.b = q;r.M = p;r.text = m;r.position = k;b++;if(b >= c)break;e = ze;q = !1;r = h[b & d];}a.position = g;a.h = b & d;};function df(a,b,c,d,e){var f=J("ajax"),g=new XMLHttpRequest(),h=he(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Dd:null};g.open(c || "GET",a,!0);b && (g.responseType = b);g.onreadystatechange = function(){if(4 === g.readyState){l.status = g.status;if(200 == l.status || !l.status)if(b && "document" !== b || !g.responseXML || "parsererror" == g.responseXML.documentElement.localName)if((!b || "document" === b) && g.response instanceof HTMLDocument)l.responseXML = g.response,l.contentType = g.response.contentType;else {var c=g.response;b && "text" !== b || "string" != typeof c?c?"string" == typeof c?l.Dd = ef([c]):l.Dd = c:v.b("Unexpected empty success response for",a):l.responseText = c;if(c = g.getResponseHeader("Content-Type"))l.contentType = c.replace(/(.*);.*$/,"$1");}else l.responseXML = g.responseXML,l.contentType = g.responseXML.contentType;h.ib(l);}};try{d?(g.setRequestHeader("Content-Type",e || "text/plain; charset=UTF-8"),g.send(d)):(a.match(/file:\/\/.*(\.html$|\.htm$)/) && g.overrideMimeType("text/html"),g.send(null));}catch(k) {v.b(k,"Error fetching " + a),h.ib(l);}return f.result();}function ef(a){var b=window.WebKitBlobBuilder || window.MSBlobBuilder;if(b){for(var b=new b(),c=0;c < a.length;c++) b.append(a[c]);return b.getBlob("application/octet-stream");}return new Blob(a,{type:"application/octet-stream"});}function ff(a){var b=J("readBlob"),c=new FileReader(),d=he(b,c);c.addEventListener("load",function(){d.ib(c.result);},!1);c.readAsArrayBuffer(a);return b.result();}function gf(a,b){this.ha = a;this.type = b;this.h = {};this.j = {};}gf.prototype.load = function(a,b,c){a = la(a);var d=this.h[a];return "undefined" != typeof d?K(d):this.fetch(a,b,c).get();};function hf(a,b,c,d){var e=J("fetch");df(b,a.type).then(function(f){if(c && 400 <= f.status)throw Error(d || "Failed to fetch required resource: " + b);a.ha(f,a).then(function(c){delete a.j[b];a.h[b] = c;M(e,c);});});return e.result();}gf.prototype.fetch = function(a,b,c){a = la(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new re(function(){return hf(e,a,b,c);},"Fetch " + a);e.j[a] = d;d.start();}return d;};gf.prototype.get = function(a){return this.h[la(a)];};function jf(a){a = a.responseText;return K(a?JSON.parse(a):null);};function kf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6 == a.length)return new Fc(b);if(3 == a.length)return new Fc(b & 15 | (b & 15) << 4 | (b & 240) << 4 | (b & 240) << 8 | (b & 3840) << 8 | (b & 3840) << 12);throw Error("E_CSS_COLOR");}function lf(a){this.f = a;this.cb = "Author";}n = lf.prototype;n.Sc = function(){return null;};n.ja = function(){return this.f;};n.error = function(){};n.Hc = function(a){this.cb = a;};n.Hb = function(){};n.Vd = function(){};n.Yc = function(){};n.Zc = function(){};n.ce = function(){};n.pd = function(){};n.Nb = function(){};n.Ud = function(){};n.Rd = function(){};n.Zd = function(){};n.Ec = function(){};n.zb = function(){};n.Hd = function(){};n.bd = function(){};n.Ld = function(){};n.Fd = function(){};n.Kd = function(){};n.Gc = function(){};n.qe = function(){};n.rc = function(){};n.Gd = function(){};n.Jd = function(){};n.Id = function(){};n.ed = function(){};n.dd = function(){};n.Ba = function(){};n.xb = function(){};n.Ob = function(){};n.cd = function(){};n.sd = function(){};function mf(a){switch(a.cb){case "UA":return 0;case "User":return 100663296;default:return 83886080;}}function nf(a){switch(a.cb){case "UA":return 0;case "User":return 16777216;default:return 33554432;}}function of(){lf.call(this,null);this.g = [];this.b = null;}t(of,lf);function pf(a,b){a.g.push(a.b);a.b = b;}n = of.prototype;n.Sc = function(){return null;};n.ja = function(){return this.b.ja();};n.error = function(a,b){this.b.error(a,b);};n.Hc = function(a){lf.prototype.Hc.call(this,a);0 < this.g.length && (this.b = this.g[0],this.g = []);this.b.Hc(a);};n.Hb = function(a,b){this.b.Hb(a,b);};n.Vd = function(a){this.b.Vd(a);};n.Yc = function(a,b){this.b.Yc(a,b);};n.Zc = function(a,b){this.b.Zc(a,b);};n.ce = function(a){this.b.ce(a);};n.pd = function(a,b,c,d){this.b.pd(a,b,c,d);};n.Nb = function(){this.b.Nb();};n.Ud = function(){this.b.Ud();};n.Rd = function(){this.b.Rd();};n.Zd = function(){this.b.Zd();};n.Ec = function(){this.b.Ec();};n.zb = function(){this.b.zb();};n.Hd = function(){this.b.Hd();};n.bd = function(a){this.b.bd(a);};n.Ld = function(){this.b.Ld();};n.Fd = function(){this.b.Fd();};n.Kd = function(){this.b.Kd();};n.Gc = function(){this.b.Gc();};n.qe = function(a){this.b.qe(a);};n.rc = function(a){this.b.rc(a);};n.Gd = function(a){this.b.Gd(a);};n.Jd = function(){this.b.Jd();};n.Id = function(a,b,c){this.b.Id(a,b,c);};n.ed = function(a,b,c){this.b.ed(a,b,c);};n.dd = function(a,b,c){this.b.dd(a,b,c);};n.Ba = function(){this.b.Ba();};n.xb = function(a,b,c){this.b.xb(a,b,c);};n.Ob = function(){this.b.Ob();};n.cd = function(a){this.b.cd(a);};n.sd = function(){this.b.sd();};function qf(a,b,c){lf.call(this,a);this.O = c;this.J = 0;if(this.la = b)this.cb = b.cb;}t(qf,lf);qf.prototype.Sc = function(){return this.la.Sc();};qf.prototype.error = function(a){v.b(a);};qf.prototype.Ba = function(){this.J++;};qf.prototype.Ob = function(){if(! --this.J && !this.O){var a=this.la;a.b = a.g.pop();}};function rf(a,b,c){qf.call(this,a,b,c);}t(rf,qf);function sf(a,b){a.error(b,a.Sc());}function tf(a,b){sf(a,b);pf(a.la,new qf(a.f,a.la,!1));}n = rf.prototype;n.zb = function(){tf(this,"E_CSS_UNEXPECTED_SELECTOR");};n.Hd = function(){tf(this,"E_CSS_UNEXPECTED_FONT_FACE");};n.bd = function(){tf(this,"E_CSS_UNEXPECTED_FOOTNOTE");};n.Ld = function(){tf(this,"E_CSS_UNEXPECTED_VIEWPORT");};n.Fd = function(){tf(this,"E_CSS_UNEXPECTED_DEFINE");};n.Kd = function(){tf(this,"E_CSS_UNEXPECTED_REGION");};n.Gc = function(){tf(this,"E_CSS_UNEXPECTED_PAGE");};n.rc = function(){tf(this,"E_CSS_UNEXPECTED_WHEN");};n.Gd = function(){tf(this,"E_CSS_UNEXPECTED_FLOW");};n.Jd = function(){tf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE");};n.Id = function(){tf(this,"E_CSS_UNEXPECTED_PAGE_MASTER");};n.ed = function(){tf(this,"E_CSS_UNEXPECTED_PARTITION");};n.dd = function(){tf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP");};n.cd = function(){tf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC");};n.sd = function(){tf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC");};n.xb = function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Sc());};var uf=[],vf=[],S=[],wf=[],xf=[],yf=[],zf=[],Af=[],Bf=[],Cf=[],Df=[],Ef=[],Ff=[];uf[1] = 28;uf[36] = 29;uf[7] = 29;uf[9] = 29;uf[14] = 29;uf[18] = 29;uf[20] = 30;uf[13] = 27;uf[0] = 200;vf[1] = 46;vf[0] = 200;yf[1] = 2;yf[36] = 4;yf[7] = 6;yf[9] = 8;yf[14] = 10;yf[18] = 14;S[37] = 11;S[23] = 12;S[35] = 56;S[1] = 1;S[36] = 3;S[7] = 5;S[9] = 7;S[14] = 9;S[12] = 13;S[18] = 55;S[50] = 42;S[16] = 41;wf[1] = 1;wf[36] = 3;wf[7] = 5;wf[9] = 7;wf[14] = 9;wf[11] = 200;wf[18] = 55;xf[1] = 2;xf[36] = 4;xf[7] = 6;xf[9] = 8;xf[18] = 14;xf[50] = 42;xf[14] = 10;xf[12] = 13;zf[1] = 15;zf[7] = 16;zf[4] = 17;zf[5] = 18;zf[3] = 19;zf[2] = 20;zf[8] = 21;zf[16] = 22;zf[19] = 23;zf[6] = 24;zf[11] = 25;zf[17] = 26;zf[13] = 48;zf[31] = 47;zf[23] = 54;zf[0] = 44;Af[1] = 31;Af[4] = 32;Af[5] = 32;Af[3] = 33;Af[2] = 34;Af[10] = 40;Af[6] = 38;Af[31] = 36;Af[24] = 36;Af[32] = 35;Bf[1] = 45;Bf[16] = 37;Bf[37] = 37;Bf[38] = 37;Bf[47] = 37;Bf[48] = 37;Bf[39] = 37;Bf[49] = 37;Bf[26] = 37;Bf[25] = 37;Bf[23] = 37;Bf[24] = 37;Bf[19] = 37;Bf[21] = 37;Bf[36] = 37;Bf[18] = 37;Bf[22] = 37;Bf[11] = 39;Bf[12] = 43;Bf[17] = 49;Cf[0] = 200;Cf[12] = 50;Cf[13] = 51;Cf[14] = 50;Cf[15] = 51;Cf[10] = 50;Cf[11] = 51;Cf[17] = 53;Df[0] = 200;Df[12] = 50;Df[13] = 52;Df[14] = 50;Df[15] = 51;Df[10] = 50;Df[11] = 51;Df[17] = 53;Ef[0] = 200;Ef[12] = 50;Ef[13] = 51;Ef[14] = 50;Ef[15] = 51;Ef[10] = 50;Ef[11] = 51;Ff[11] = 0;Ff[16] = 0;Ff[22] = 1;Ff[18] = 1;Ff[26] = 2;Ff[25] = 2;Ff[38] = 3;Ff[37] = 3;Ff[48] = 3;Ff[47] = 3;Ff[39] = 3;Ff[49] = 3;Ff[41] = 3;Ff[23] = 4;Ff[24] = 4;Ff[36] = 5;Ff[19] = 5;Ff[21] = 5;Ff[0] = 6;Ff[52] = 2;function Gf(a,b,c,d){this.b = a;this.f = b;this.A = c;this.Y = d;this.G = [];this.O = {};this.g = this.I = null;this.F = !1;this.j = 2;this.result = null;this.H = !1;this.C = this.J = null;this.l = [];this.h = [];this.T = this.W = !1;}function Hf(a,b){for(var c=[],d=a.G;;) {c.push(d[b++]);if(b == d.length)break;if("," != d[b++])throw Error("Unexpected state");}return c;}function If(a,b,c){var d=a.G,e=d.length,f;do f = d[--e];while("undefined" != typeof f && "string" != typeof f);var g=d.length - (e + 1);1 < g && d.splice(e + 1,g,new uc(d.slice(e + 1,d.length)));if("," == b)return null;e++;do f = d[--e];while("undefined" != typeof f && ("string" != typeof f || "," == f));g = d.length - (e + 1);if("(" == f){if(")" != b)return a.A.error("E_CSS_MISMATCHED_C_PAR",c),a.b = Df,null;a = new wc(d[e - 1],Hf(a,e + 1));d.splice(e - 1,g + 2,a);return null;}return ";" != b || 0 <= e?(a.A.error("E_CSS_UNEXPECTED_VAL_END",c),a.b = Df,null):1 < g?new vc(Hf(a,e + 1)):d[0];}function Jf(a,b,c){a.b = a.g?Df:Cf;a.A.error(b,c);}function Kf(a,b,c){for(var d=a.G,e=a.A,f=d.pop(),g;;) {var h=d.pop();if(11 == b){for(g = [f];16 == h;) g.unshift(d.pop()),h = d.pop();if("string" == typeof h){if("{" == h){for(;2 <= g.length;) a = g.shift(),c = g.shift(),a = new Wb(e.ja(),a,c),g.unshift(a);d.push(new G(g[0]));return !0;}if("(" == h){b = d.pop();f = d.pop();f = new kc(e.ja(),sb(f,b),g);b = 0;continue;}}if(10 == h){f.Ke() && (f = new mc(e.ja(),f,null));b = 0;continue;}}else if("string" == typeof h){d.push(h);break;}if(0 > h)if(-31 == h)f = new Rb(e.ja(),f);else if(-24 == h)f = new Sb(e.ja(),f);else return Jf(a,"F_UNEXPECTED_STATE",c),!1;else {if(Ff[b] > Ff[h]){d.push(h);break;}g = d.pop();switch(h){case 26:f = new Tb(e.ja(),g,f);break;case 52:f = new Ub(e.ja(),g,f);break;case 25:f = new Vb(e.ja(),g,f);break;case 38:f = new Xb(e.ja(),g,f);break;case 37:f = new Zb(e.ja(),g,f);break;case 48:f = new Yb(e.ja(),g,f);break;case 47:f = new $b(e.ja(),g,f);break;case 39:case 49:f = new ac(e.ja(),g,f);break;case 41:f = new bc(e.ja(),g,f);break;case 23:f = new cc(e.ja(),g,f);break;case 24:f = new dc(e.ja(),g,f);break;case 36:f = new ec(e.ja(),g,f);break;case 19:f = new fc(e.ja(),g,f);break;case 21:f = new gc(e.ja(),g,f);break;case 18:if(1 < d.length)switch(d[d.length - 1]){case 22:d.pop();f = new lc(e.ja(),d.pop(),g,f);break;case 10:if(g.Ke())f = new mc(e.ja(),g,f);else return Jf(a,"E_CSS_MEDIA_TEST",c),!1;}else return Jf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18 != b)return Jf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Jf(a,"F_UNEXPECTED_STATE",c),!1;}}}d.push(f);return !1;}function Lf(a){for(var b=[];;) {var c=P(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.M);break;default:return b;}R(a.f);}}function Mf(a){var b=!1,c=P(a.f);if(23 === c.type)b = !0,R(a.f),c = P(a.f);else if(1 === c.type && ("even" === c.text || "odd" === c.text))return R(a.f),[2,"odd" === c.text?1:0];switch(c.type){case 3:if(b && 0 > c.M)break;case 1:if(b && "-" === c.text.charAt(0))break;if("n" === c.text || "-n" === c.text){if(b && c.b)break;b = "-n" === c.text?-1:1;3 === c.type && (b = c.M);var d=0;R(a.f);var c=P(a.f),e=24 === c.type,f=23 === c.type || e;f && (R(a.f),c = P(a.f));if(5 === c.type){d = c.M;if(1 / d === 1 / -0){if((d = 0,f))break;}else if(0 > d){if(f)break;}else if(0 <= d && !f)break;R(a.f);}else if(f)break;return [b,e && 0 < d?-d:d];}if("n-" === c.text || "-n-" === c.text){if(!b || !c.b)if((b = "-n-" === c.text?-1:1,3 === c.type && (b = c.M),R(a.f),c = P(a.f),5 === c.type && !(0 > c.M || 1 / c.M === 1 / -0)))return R(a.f),[b,c.M];}else {if(d = c.text.match(/^n(-[0-9]+)$/)){if(b && c.b)break;R(a.f);return [3 === c.type?c.M:1,parseInt(d[1],10)];}if(d = c.text.match(/^-n(-[0-9]+)$/))return R(a.f),[-1,parseInt(d[1],10)];}break;case 5:if(!b || !(c.b || 0 > c.M))return R(a.f),[0,c.M];}return null;}function Nf(a,b,c){a = a.A.ja();if(!a)return null;c = c || a.j;if(b){b = b.split(/\s+/);for(var d=0;d < b.length;d++) switch(b[d]){case "vertical":c = oc(a,c,new Rb(a,new ic(a,"pref-horizontal")));break;case "horizontal":c = oc(a,c,new ic(a,"pref-horizontal"));break;case "day":c = oc(a,c,new Rb(a,new ic(a,"pref-night-mode")));break;case "night":c = oc(a,c,new ic(a,"pref-night-mode"));break;default:c = a.h;}}return c === a.j?null:new G(c);}function Of(a){switch(a.h[a.h.length - 1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return !0;}return !1;}function Pf(a,b,c,d,e,f){var g=a.A,h=a.f,l=a.G,k,m,p,q;e && (a.j = 2,a.G.push("{"));a: for(;0 < b;--b) switch((k = P(h),a.b[k.type])){case 28:if(18 != Q(h,1).type){Of(a)?(g.error("E_CSS_COLON_EXPECTED",Q(h,1)),a.b = Df):(a.b = yf,g.zb());continue;}m = Q(h,2);if(!(m.b || 1 != m.type && 6 != m.type)){if(0 <= h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b = h.f;}a.g = k.text;a.F = !1;R(h);R(h);a.b = zf;l.splice(0,l.length);continue;case 46:if(18 != Q(h,1).type){a.b = Df;g.error("E_CSS_COLON_EXPECTED",Q(h,1));continue;}a.g = k.text;a.F = !1;R(h);R(h);a.b = zf;l.splice(0,l.length);continue;case 29:a.b = yf;g.zb();continue;case 1:if(!k.b){a.b = Ef;g.error("E_CSS_SPACE_EXPECTED",k);continue;}g.Nb();case 2:if(34 == Q(h,1).type)if((R(h),R(h),p = a.O[k.text],null != p))switch((k = P(h),k.type)){case 1:g.Hb(p,k.text);a.b = f?wf:S;R(h);break;case 36:g.Hb(p,null);a.b = f?wf:S;R(h);break;default:a.b = Cf,g.error("E_CSS_NAMESPACE",k);}else a.b = Cf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Hb(a.I,k.text),a.b = f?wf:S,R(h);continue;case 3:if(!k.b){a.b = Ef;g.error("E_CSS_SPACE_EXPECTED",k);continue;}g.Nb();case 4:if(34 == Q(h,1).type)switch((R(h),R(h),k = P(h),k.type)){case 1:g.Hb(null,k.text);a.b = f?wf:S;R(h);break;case 36:g.Hb(null,null);a.b = f?wf:S;R(h);break;default:a.b = Cf,g.error("E_CSS_NAMESPACE",k);}else g.Hb(a.I,null),a.b = f?wf:S,R(h);continue;case 5:k.b && g.Nb();case 6:g.ce(k.text);a.b = f?wf:S;R(h);continue;case 7:k.b && g.Nb();case 8:g.Vd(k.text);a.b = f?wf:S;R(h);continue;case 55:k.b && g.Nb();case 14:R(h);k = P(h);b: switch(k.type){case 1:g.Yc(k.text,null);R(h);a.b = f?wf:S;continue;case 6:m = k.text;R(h);switch(m){case "not":a.b = yf;g.cd("not");Pf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b = S:a.b = Ef;break a;case "lang":case "href-epub-type":if((k = P(h),1 === k.type)){p = [k.text];R(h);break;}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p = Mf(a))break;else break b;default:p = Lf(a);}k = P(h);if(11 == k.type){g.Yc(m,p);R(h);a.b = f?wf:S;continue;}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b = Cf;continue;case 42:R(h);k = P(h);switch(k.type){case 1:g.Zc(k.text,null);a.b = f?wf:S;R(h);continue;case 6:m = k.text;R(h);if("nth-fragment" == m){if((p = Mf(a),!p))break;}else p = Lf(a);k = P(h);if(11 == k.type){g.Zc(m,p);a.b = f?wf:S;R(h);continue;}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b = Cf;continue;case 9:k.b && g.Nb();case 10:R(h);k = P(h);if(1 == k.type)m = k.text,R(h);else if(36 == k.type)m = null,R(h);else if(34 == k.type)m = "";else {a.b = Ef;g.error("E_CSS_ATTR",k);R(h);continue;}k = P(h);if(34 == k.type){p = m?a.O[m]:m;if(null == p){a.b = Ef;g.error("E_CSS_UNDECLARED_PREFIX",k);R(h);continue;}R(h);k = P(h);if(1 != k.type){a.b = Ef;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue;}m = k.text;R(h);k = P(h);}else p = "";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q = k.type;R(h);k = P(h);break;case 15:g.pd(p,m,0,null);a.b = f?wf:S;R(h);continue;default:a.b = Ef;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue;}switch(k.type){case 1:case 2:g.pd(p,m,q,k.text);R(h);k = P(h);break;default:a.b = Ef;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue;}if(15 != k.type){a.b = Ef;g.error("E_CSS_ATTR",k);continue;}a.b = f?wf:S;R(h);continue;case 11:g.Ud();a.b = xf;R(h);continue;case 12:g.Rd();a.b = xf;R(h);continue;case 56:g.Zd();a.b = xf;R(h);continue;case 13:a.W?(a.h.push("-epubx-region"),a.W = !1):a.T?(a.h.push("page"),a.T = !1):a.h.push("[selector]");g.Ba();a.b = uf;R(h);continue;case 41:g.Ec();a.b = yf;R(h);continue;case 15:l.push(C(k.text));R(h);continue;case 16:try{l.push(kf(k.text));}catch(z) {g.error("E_CSS_COLOR",k),a.b = Cf;}R(h);continue;case 17:l.push(new Dc(k.M));R(h);continue;case 18:l.push(new Ec(k.M));R(h);continue;case 19:l.push(new D(k.M,k.text));R(h);continue;case 20:l.push(new Bc(k.text));R(h);continue;case 21:l.push(new Gc(oa(k.text,a.Y)));R(h);continue;case 22:If(a,",",k);l.push(",");R(h);continue;case 23:l.push(Ac);R(h);continue;case 24:m = k.text.toLowerCase();"-epubx-expr" == m?(a.b = Af,a.j = 0,l.push("{")):(l.push(m),l.push("("));R(h);continue;case 25:If(a,")",k);R(h);continue;case 47:R(h);k = P(h);m = Q(h,1);if(1 == k.type && "important" == k.text.toLowerCase() && (17 == m.type || 0 == m.type || 13 == m.type)){R(h);a.F = !0;continue;}Jf(a,"E_CSS_SYNTAX",k);continue;case 54:m = Q(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){R(h);continue;}}a.b === zf && 0 <= h.b?(cf(h),a.b = yf,g.zb()):Jf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:R(h);case 48:h.b = -1;(m = If(a,";",k)) && a.g && g.xb(a.g,m,a.F);a.b = d?vf:uf;continue;case 44:R(h);h.b = -1;m = If(a,";",k);if(c)return a.result = m,!0;a.g && m && g.xb(a.g,m,a.F);if(d)return !0;Jf(a,"E_CSS_SYNTAX",k);continue;case 31:m = Q(h,1);9 == m.type?(10 != Q(h,2).type || Q(h,2).b?(l.push(new ic(g.ja(),sb(k.text,m.text))),a.b = Bf):(l.push(k.text,m.text,"("),R(h)),R(h)):(2 == a.j || 3 == a.j?"not" == k.text.toLowerCase()?(R(h),l.push(new jc(g.ja(),!0,m.text))):("only" == k.text.toLowerCase() && (R(h),k = m),l.push(new jc(g.ja(),!1,k.text))):l.push(new ic(g.ja(),k.text)),a.b = Bf);R(h);continue;case 38:l.push(null,k.text,"(");R(h);continue;case 32:l.push(new wb(g.ja(),k.M));R(h);a.b = Bf;continue;case 33:m = k.text;"%" == m && (m = a.g && a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new hc(g.ja(),k.M,m));R(h);a.b = Bf;continue;case 34:l.push(new wb(g.ja(),k.text));R(h);a.b = Bf;continue;case 35:R(h);k = P(h);5 != k.type || k.b?Jf(a,"E_CSS_SYNTAX",k):(l.push(new nc(g.ja(),k.M)),R(h),a.b = Bf);continue;case 36:l.push(-k.type);R(h);continue;case 37:a.b = Af;Kf(a,k.type,k);l.push(k.type);R(h);continue;case 45:"and" == k.text.toLowerCase()?(a.b = Af,Kf(a,52,k),l.push(52),R(h)):Jf(a,"E_CSS_SYNTAX",k);continue;case 39:Kf(a,k.type,k) && (a.g?a.b = zf:Jf(a,"E_CSS_UNBALANCED_PAR",k));R(h);continue;case 43:Kf(a,11,k) && (a.g || 3 == a.j?Jf(a,"E_CSS_UNEXPECTED_BRC",k):(1 == a.j?g.rc(l.pop()):(k = l.pop(),g.rc(k)),a.h.push("media"),g.Ba(),a.b = uf));R(h);continue;case 49:if(Kf(a,11,k))if(a.g || 3 != a.j)Jf(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.C = l.pop(),a.H = !0,a.b = uf,R(h),!1;R(h);continue;case 40:l.push(k.type);R(h);continue;case 27:a.b = uf;R(h);g.Ob();a.h.length && a.h.pop();continue;case 30:m = k.text.toLowerCase();switch(m){case "import":R(h);k = P(h);if(2 == k.type || 8 == k.type){a.J = k.text;R(h);k = P(h);if(17 == k.type || 0 == k.type)return a.H = !0,R(h),!1;a.g = null;a.j = 3;a.b = Af;l.push("{");continue;}g.error("E_CSS_IMPORT_SYNTAX",k);a.b = Cf;continue;case "namespace":R(h);k = P(h);switch(k.type){case 1:m = k.text;R(h);k = P(h);if((2 == k.type || 8 == k.type) && 17 == Q(h,1).type){a.O[m] = k.text;R(h);R(h);continue;}break;case 2:case 8:if(17 == Q(h,1).type){a.I = k.text;R(h);R(h);continue;}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b = Cf;continue;case "charset":R(h);k = P(h);if(2 == k.type && 17 == Q(h,1).type){m = k.text.toLowerCase();"utf-8" != m && "utf-16" != m && g.error("E_CSS_UNEXPECTED_CHARSET " + m,k);R(h);R(h);continue;}g.error("E_CSS_CHARSET_SYNTAX",k);a.b = Cf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12 == Q(h,1).type){R(h);R(h);switch(m){case "font-face":g.Hd();break;case "-epubx-page-template":g.Jd();break;case "-epubx-define":g.Fd();break;case "-epubx-viewport":g.Ld();}a.h.push(m);g.Ba();continue;}break;case "-adapt-footnote-area":R(h);k = P(h);switch(k.type){case 12:R(h);g.bd(null);a.h.push(m);g.Ba();continue;case 50:if((R(h),k = P(h),1 == k.type && 12 == Q(h,1).type)){m = k.text;R(h);R(h);g.bd(m);a.h.push("-adapt-footnote-area");g.Ba();continue;}}break;case "-epubx-region":R(h);g.Kd();a.W = !0;a.b = yf;continue;case "page":R(h);g.Gc();a.T = !0;a.b = xf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":R(h);k = P(h);if(12 == k.type){R(h);g.qe(m);a.h.push(m);g.Ba();continue;}break;case "-epubx-when":R(h);a.g = null;a.j = 1;a.b = Af;l.push("{");continue;case "media":R(h);a.g = null;a.j = 2;a.b = Af;l.push("{");continue;case "-epubx-flow":if(1 == Q(h,1).type && 12 == Q(h,2).type){g.Gd(Q(h,1).text);R(h);R(h);R(h);a.h.push(m);g.Ba();continue;}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":R(h);k = P(h);q = p = null;var r=[];1 == k.type && (p = k.text,R(h),k = P(h));18 == k.type && 1 == Q(h,1).type && (q = Q(h,1).text,R(h),R(h),k = P(h));for(;6 == k.type && "class" == k.text.toLowerCase() && 1 == Q(h,1).type && 11 == Q(h,2).type;) r.push(Q(h,1).text),R(h),R(h),R(h),k = P(h);if(12 == k.type){R(h);switch(m){case "-epubx-page-master":g.Id(p,q,r);break;case "-epubx-partition":g.ed(p,q,r);break;case "-epubx-partition-group":g.dd(p,q,r);}a.h.push(m);g.Ba();continue;}break;case "":g.error("E_CSS_UNEXPECTED_AT" + m,k);a.b = Ef;continue;default:g.error("E_CSS_AT_UNKNOWN " + m,k);a.b = Cf;continue;}g.error("E_CSS_AT_SYNTAX " + m,k);a.b = Cf;continue;case 50:if(c || d)return !0;a.l.push(k.type + 1);R(h);continue;case 52:if(c || d)return !0;if(!a.l.length){a.b = uf;continue;}case 51:0 < a.l.length && a.l[a.l.length - 1] == k.type && a.l.pop();a.l.length || 13 != k.type || (a.b = uf);R(h);continue;case 53:if(c || d)return !0;a.l.length || (a.b = uf);R(h);continue;case 200:return f && (R(h),g.sd()),!0;default:if(c || d)return !0;if(e)return Kf(a,11,k)?(a.result = l.pop(),!0):!1;if(f)return 51 == k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b === zf && 0 <= h.b?(cf(h),a.b = yf,g.zb()):a.b !== Cf && a.b !== Ef && a.b !== Df?(51 == k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b = Of(a)?Df:Ef):R(h);}return !1;}function Qf(a){lf.call(this,null);this.f = a;}t(Qf,lf);Qf.prototype.error = function(a){throw Error(a);};Qf.prototype.ja = function(){return this.f;};function Rf(a,b,c,d,e){var f=J("parseStylesheet"),g=new Gf(uf,a,b,c),h=null;e && (h = Sf(new af(e,b),b,c));if(h = Nf(g,d,h && h.ta()))b.rc(h),b.Ba();oe(function(){for(;!Pf(g,100,!1,!1,!1,!1);) {if(g.H){var a=oa(g.J,c);g.C && (b.rc(g.C),b.Ba());var d=J("parseStylesheet.import");Tf(a,b,null,null).then(function(){g.C && b.Ob();g.H = !1;g.J = null;g.C = null;M(d,!0);});return d.result();}a = me();if(a.Pa)return a;}return K(!1);}).then(function(){h && b.Ob();M(f,!0);});return f.result();}function Uf(a,b,c,d,e){return Yd("parseStylesheetFromText",function(f){var g=new af(a,b);Rf(g,b,c,d,e).Da(f);},function(b,c){v.b(c,"Failed to parse stylesheet text: " + a);M(b,!1);});}function Tf(a,b,c,d){return Yd("parseStylesheetFromURL",function(e){df(a).then(function(f){f.responseText?Uf(f.responseText,b,a,c,d).then(function(b){b || v.b("Failed to parse stylesheet from " + a);M(e,!0);}):M(e,!0);});},function(b,c){v.b(c,"Exception while fetching and parsing:",a);M(b,!0);});}function Vf(a,b){var c=new Gf(zf,b,new Qf(a),"");Pf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result;}function Sf(a,b,c){a = new Gf(Af,a,b,c);Pf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result;}var Wf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};function Xf(a,b,c){if(b.Ie())a: {b = b.b;a = b.evaluate(a);switch(typeof a){case "number":c = Wf[c]?a == Math.round(a)?new Ec(a):new Dc(a):new D(a,"px");break a;case "string":c = a?Vf(b.b,new af(a,null)):B;break a;case "boolean":c = a?Id:Yc;break a;case "undefined":c = B;break a;}throw Error("E_UNEXPECTED");}else c = b;return c;};function Yf(a,b,c,d){this.U = a;this.S = b;this.V = c;this.P = d;}function Zf(a,b){this.f = a;this.b = b;}function $f(){this.bottom = this.right = this.top = this.left = 0;}function ag(a,b,c,d){this.b = a;this.f = b;this.h = c;this.g = d;}function bg(a,b,c,d){this.S = a;this.P = b;this.U = c;this.V = d;this.right = this.left = null;}function cg(a,b){return a.b.b - b.b.b || a.b.f - b.b.f;}function dg(a){this.b = a;}function eg(a,b,c){a = a.b;for(var d=a.length,e=a[d - 1],f=0;f < d;f++) {var g=a[f];b.push(e.b < g.b?new ag(e,g,1,c):new ag(g,e,-1,c));e = g;}}function fg(a,b,c,d){for(var e=[],f=0;20 > f;f++) {var g=2 * f * Math.PI / 20;e.push(new Zf(a + c * Math.sin(g),b + d * Math.cos(g)));}return new dg(e);}function gg(a,b,c,d){return new dg([new Zf(a,b),new Zf(c,b),new Zf(c,d),new Zf(a,d)]);}function hg(a,b,c,d){this.f = a;this.h = b;this.b = c;this.g = d;}function ig(a,b){var c=a.b.f + (a.f.f - a.b.f) * (b - a.b.b) / (a.f.b - a.b.b);if(isNaN(c))throw Error("Bad intersection");return c;}function jg(a,b,c,d){var e,f;b.f.b < c && v.b("Error: inconsistent segment (1)");b.b.b <= c?(c = ig(b,c),e = b.h):(c = b.b.f,e = 0);b.f.b >= d?(d = ig(b,d),f = b.h):(d = b.f.f,f = 0);c < d?(a.push(new hg(c,e,b.g,-1)),a.push(new hg(d,f,b.g,1))):(a.push(new hg(d,f,b.g,-1)),a.push(new hg(c,e,b.g,1)));}function kg(a,b,c){c = b + c;for(var d=Array(c),e=Array(c),f=0;f <= c;f++) d[f] = 0,e[f] = 0;for(var g=[],h=!1,l=a.length,k=0;k < l;k++) {var m=a[k];d[m.b] += m.h;e[m.b] += m.g;for(var p=!1,f=0;f < b;f++) if(d[f] && !e[f]){p = !0;break;}if(p)for(f = b;f <= c;f++) if(d[f] || e[f]){p = !1;break;}h != p && (g.push(m.f),h = p);}return g;}function lg(a,b){return b?Math.ceil(a / b) * b:a;}function mg(a,b){return b?Math.floor(a / b) * b:a;}function ng(a){return new Zf(a.b,-a.f);}function og(a){return new Yf(a.S,-a.V,a.P,-a.U);}function pg(a){return new dg(Sa(a.b,ng));}function qg(a,b,c,d,e){e && (a = og(a),b = Sa(b,pg),c = Sa(c,pg));e = b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l = 0;l < e;l++) eg(b[l],h,l);for(l = 0;l < f;l++) eg(c[l],h,l + e);b = h.length;h.sort(cg);for(c = 0;h[c].g >= e;) c++;c = h[c].b.b;c > a.S && g.push(new bg(a.S,c,a.V,a.V));l = 0;for(var p=[];l < b && (m = h[l]).b.b < c;) m.f.b > c && p.push(m),l++;for(;l < b || 0 < p.length;) {var q=a.P,r=Math.min(lg(Math.ceil(c + 8),d),a.P);for(k = 0;k < p.length && q > r;k++) m = p[k],m.b.f == m.f.f?m.f.b < q && (q = Math.max(mg(m.f.b,d),r)):m.b.f != m.f.f && (q = r);q > a.P && (q = a.P);for(;l < b && (m = h[l]).b.b < q;) if(m.f.b < c)l++;else if(m.b.b < r){if(m.b.b != m.f.b || m.b.b != c)p.push(m),q = r;l++;}else {k = mg(m.b.b,d);k < q && (q = k);break;}r = [];for(k = 0;k < p.length;k++) jg(r,p[k],c,q);r.sort(function(a,b){return a.f - b.f || a.g - b.g;});r = kg(r,e,f);if(r.length){var z=0,u=a.U;for(k = 0;k < r.length;k += 2) {var A=Math.max(a.U,r[k]),I=Math.min(a.V,r[k + 1]) - A;I > z && (z = I,u = A);}z?g.push(new bg(c,q,Math.max(u,a.U),Math.min(u + z,a.V))):g.push(new bg(c,q,a.V,a.V));}else g.push(new bg(c,q,a.V,a.V));if(q == a.P)break;c = q;for(k = p.length - 1;0 <= k;k--) p[k].f.b <= q && p.splice(k,1);}rg(a,g);return g;}function rg(a,b){for(var c=b.length - 1,d=new bg(a.P,a.P,a.U,a.V);0 <= c;) {var e=d,d=b[c];if(1 > d.P - d.S || d.U == e.U && d.V == e.V)e.S = d.S,b.splice(c,1),d = e;c--;}}function sg(a,b){for(var c=0,d=a.length;c < d;) {var e=Math.floor((c + d) / 2);b >= a[e].P?c = e + 1:d = e;}return c;}function tg(a,b){if(!a.length)return b;for(var c=b.S,d,e=0;e < a.length && !(d = a[e],d.P > b.S && d.U - .1 <= b.U && d.V + .1 >= b.V);e++) c = Math.max(c,d.P);for(var f=c;e < a.length && !(d = a[e],d.S >= b.P || d.U - .1 > b.U || d.V + .1 < b.V);e++) f = d.P;f = e === a.length?b.P:Math.min(f,b.P);return f <= c?null:new Yf(b.U,c,b.V,f);}function ug(a,b){if(!a.length)return b;for(var c=b.P,d,e=a.length - 1;0 <= e && !(d = a[e],e === a.length - 1 && d.P < b.P) && !(d.S < b.P && d.U - .1 <= b.U && d.V + .1 >= b.V);e--) c = Math.min(c,d.S);for(var f=Math.min(c,d.P);0 <= e && !(d = a[e],d.P <= b.S || d.U - .1 > b.U || d.V + .1 < b.V);e--) f = d.S;f = Math.max(f,b.S);return c <= f?null:new Yf(b.U,f,b.V,c);};function vg(){this.b = {};}t(vg,sc);vg.prototype.Zb = function(a){this.b[a.name] = !0;return a;};vg.prototype.Ab = function(a){this.$b(a.values);return a;};function wg(a){this.value = a;}t(wg,sc);wg.prototype.Kc = function(a){this.value = a.M;return a;};function xg(a,b){if(a){var c=new wg(b);try{return a.ba(c),c.value;}catch(d) {v.b(d,"toInt: ");}}return b;}function yg(){this.f = !1;this.b = [];this.name = null;}t(yg,sc);yg.prototype.Mc = function(a){this.f && this.b.push(a);return null;};yg.prototype.Lc = function(a){this.f && !a.M && this.b.push(new D(0,"px"));return null;};yg.prototype.Ab = function(a){this.$b(a.values);return null;};yg.prototype.Ib = function(a){this.f || (this.f = !0,this.$b(a.values),this.f = !1,this.name = a.name.toLowerCase());return null;};function zg(a,b,c,d,e,f){if(a){var g=new yg();try{a.ba(g);var h;a: {if(0 < g.b.length){a = [];for(var l=0;l < g.b.length;l++) {var k=g.b[l];if("%" == k.ga){var m=l % 2?e:d;3 == l && "circle" == g.name && (m = Math.sqrt((d * d + e * e) / 2));a.push(k.M * m / 100);}else a.push(k.M * Fb(f,k.ga,!1));}switch(g.name){case "polygon":if(!(a.length % 2)){f = [];for(g = 0;g < a.length;g += 2) f.push(new Zf(b + a[g],c + a[g + 1]));h = new dg(f);break a;}break;case "rectangle":if(4 == a.length){h = gg(b + a[0],c + a[1],b + a[0] + a[2],c + a[1] + a[3]);break a;}break;case "ellipse":if(4 == a.length){h = fg(b + a[0],c + a[1],a[2],a[3]);break a;}break;case "circle":if(3 == a.length){h = fg(b + a[0],c + a[1],a[2],a[2]);break a;}}}h = null;}return h;}catch(p) {v.b(p,"toShape:");}}return gg(b,c,b + d,c + e);}function Ag(a){this.f = a;this.b = {};this.name = null;}t(Ag,sc);Ag.prototype.Zb = function(a){this.name = a.toString();this.b[this.name] = this.f?0:(this.b[this.name] || 0) + 1;return a;};Ag.prototype.Kc = function(a){this.name && (this.b[this.name] += a.M - (this.f?0:1));return a;};Ag.prototype.Ab = function(a){this.$b(a.values);return a;};function Bg(a,b){var c=new Ag(b);try{a.ba(c);}catch(d) {v.b(d,"toCounters:");}return c.b;}function Cg(a,b){this.b = a;this.f = b;}t(Cg,tc);Cg.prototype.Nc = function(a){return new Gc(this.f.gd(a.url,this.b));};function Dg(a){this.g = this.h = null;this.f = 0;this.b = a;}function Eg(a,b){this.b = -1;this.f = a;this.g = b;}function Fg(){this.b = [];this.f = [];this.match = [];this.g = [];this.error = [];this.h = !0;}Fg.prototype.connect = function(a,b){for(var c=0;c < a.length;c++) this.f[a[c]].b = b;a.splice(0,a.length);};Fg.prototype.clone = function(){for(var a=new Fg(),b=0;b < this.b.length;b++) {var c=this.b[b],d=new Dg(c.b);d.f = c.f;a.b.push(d);}for(b = 0;b < this.f.length;b++) c = this.f[b],d = new Eg(c.f,c.g),d.b = c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a;};function Gg(a,b,c,d){var e=a.b.length,f=new Dg(Hg);f.f = 0 <= d?c?2 * d + 1:2 * d + 2:c?-1:-2;a.b.push(f);a.connect(b,e);c = new Eg(e,!0);e = new Eg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c);}function Ig(a){return 1 == a.b.length && !a.b[0].f && a.b[0].b instanceof Jg;}function Kg(a,b,c){if(b.b.length){var d=a.b.length;if(4 == c && 1 == d && Ig(b) && Ig(a)){c = a.b[0].b;b = b.b[0].b;var d={},e={},f;for(f in c.f) d[f] = c.f[f];for(f in b.f) d[f] = b.f[f];for(var g in c.g) e[g] = c.g[g];for(g in b.g) e[g] = b.g[g];a.b[0].b = new Jg(c.b | b.b,d,e);}else {for(f = 0;f < b.b.length;f++) a.b.push(b.b[f]);4 == c?(a.h = !0,a.connect(a.g,d)):a.connect(a.match,d);g = a.f.length;for(f = 0;f < b.f.length;f++) e = b.f[f],e.f += d,0 <= e.b && (e.b += d),a.f.push(e);for(f = 0;f < b.match.length;f++) a.match.push(b.match[f] + g);3 == c && a.connect(a.match,d);if(2 == c || 3 == c)for(f = 0;f < b.g.length;f++) a.match.push(b.g[f] + g);else if(a.h){for(f = 0;f < b.g.length;f++) a.g.push(b.g[f] + g);a.h = b.h;}else for(f = 0;f < b.g.length;f++) a.error.push(b.g[f] + g);for(f = 0;f < b.error.length;f++) a.error.push(b.error[f] + g);b.b = null;b.f = null;}}}var T={};function Lg(){}t(Lg,sc);Lg.prototype.h = function(a,b){var c=a[b].ba(this);return c?[c]:null;};function Jg(a,b,c){this.b = a;this.f = b;this.g = c;}t(Jg,Lg);n = Jg.prototype;n.se = function(a){return this.b & 1?a:null;};n.te = function(a){return this.b & 2048?a:null;};n.hd = function(a){return this.b & 2?a:null;};n.Zb = function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b & 4?a:null;};n.Mc = function(a){return a.M || this.b & 512?0 > a.M && !(this.b & 256)?null:this.g[a.ga]?a:null:"%" == a.ga && this.b & 1024?a:null;};n.Lc = function(a){return a.M?0 >= a.M && !(this.b & 256)?null:this.b & 16?a:null:this.b & 512?a:null;};n.Kc = function(a){return a.M?0 >= a.M && !(this.b & 256)?null:this.b & 48?a:(a = this.f["" + a.M])?a:null:this.b & 512?a:null;};n.Od = function(a){return this.b & 64?a:null;};n.Nc = function(a){return this.b & 128?a:null;};n.Ab = function(){return null;};n.Yb = function(){return null;};n.Ib = function(){return null;};n.Jc = function(){return null;};var Hg=new Jg(0,T,T);function Mg(a){this.b = new Dg(null);var b=this.g = new Dg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c + 1);a.connect(a.error,c + 1);for(b = 0;b < a.f.length;b++) {var d=a.f[b];d.g?a.b[d.f].h = a.b[d.b]:a.b[d.f].g = a.b[d.b];}for(b = 0;b < c;b++) if(!a.b[b].g || !a.b[b].h)throw Error("Invalid validator state");this.f = a.b[0];}t(Mg,Lg);function Ng(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f !== a.b && f !== a.g;) if(g >= b.length)f = f.g;else {var k=b[g],m;if(f.f)m = !0,-1 == f.f?(h?h.push(l):h = [l],l = []):-2 == f.f?0 < h.length?l = h.pop():l = null:0 < f.f && !(f.f % 2)?l[Math.floor((f.f - 1) / 2)] = "taken":m = null == l[Math.floor((f.f - 1) / 2)],f = m?f.h:f.g;else {if(!g && !c && f.b instanceof Og && a instanceof Og){if(m = new uc(b).ba(f.b)){g = b.length;f = f.h;continue;}}else if(!g && !c && f.b instanceof Pg && a instanceof Og){if(m = new vc(b).ba(f.b)){g = b.length;f = f.h;continue;}}else m = k.ba(f.b);if(m){if(m !== k && b === e)for(e = [],k = 0;k < g;k++) e[k] = b[k];b !== e && (e[g - d] = m);g++;f = f.h;}else f = f.g;}}return f === a.b && (c?0 < e.length:g == b.length)?e:null;}n = Mg.prototype;n.nb = function(a){for(var b=null,c=this.f;c !== this.b && c !== this.g;) a?c.f?c = c.h:(b = a.ba(c.b))?(a = null,c = c.h):c = c.g:c = c.g;return c === this.b?b:null;};n.se = function(a){return this.nb(a);};n.te = function(a){return this.nb(a);};n.hd = function(a){return this.nb(a);};n.Zb = function(a){return this.nb(a);};n.Mc = function(a){return this.nb(a);};n.Lc = function(a){return this.nb(a);};n.Kc = function(a){return this.nb(a);};n.Od = function(a){return this.nb(a);};n.Nc = function(a){return this.nb(a);};n.Ab = function(){return null;};n.Yb = function(){return null;};n.Ib = function(a){return this.nb(a);};n.Jc = function(){return null;};function Og(a){Mg.call(this,a);}t(Og,Mg);Og.prototype.Ab = function(a){var b=Ng(this,a.values,!1,0);return b === a.values?a:b?new uc(b):null;};Og.prototype.Yb = function(a){for(var b=this.f,c=!1;b;) {if(b.b instanceof Pg){c = !0;break;}b = b.g;}return c?(b = Ng(this,a.values,!1,0),b === a.values?a:b?new vc(b):null):null;};Og.prototype.h = function(a,b){return Ng(this,a,!0,b);};function Pg(a){Mg.call(this,a);}t(Pg,Mg);Pg.prototype.Ab = function(a){return this.nb(a);};Pg.prototype.Yb = function(a){var b=Ng(this,a.values,!1,0);return b === a.values?a:b?new vc(b):null;};Pg.prototype.h = function(a,b){for(var c=this.f,d;c !== this.g;) {if(d = c.b.h(a,b))return d;c = c.g;}return null;};function Qg(a,b){Mg.call(this,b);this.name = a;}t(Qg,Mg);Qg.prototype.nb = function(){return null;};Qg.prototype.Ib = function(a){if(a.name.toLowerCase() != this.name)return null;var b=Ng(this,a.values,!1,0);return b === a.values?a:b?new wc(a.name,b):null;};function Rg(){}Rg.prototype.b = function(a,b){return b;};Rg.prototype.g = function(){};function Sg(a,b){this.name = b;this.h = a.g[this.name];}t(Sg,Rg);Sg.prototype.b = function(a,b,c){if(c.values[this.name])return b;if(a = this.h.h(a,b)){var d=a.length;this.g(1 < d?new uc(a):a[0],c);return b + d;}return b;};Sg.prototype.g = function(a,b){b.values[this.name] = a;};function Tg(a,b){Sg.call(this,a,b[0]);this.f = b;}t(Tg,Sg);Tg.prototype.g = function(a,b){for(var c=0;c < this.f.length;c++) b.values[this.f[c]] = a;};function Ug(a,b){this.f = a;this.Re = b;}t(Ug,Rg);Ug.prototype.b = function(a,b,c){var d=b;if(this.Re)if(a[b] == Ac){if(++b == a.length)return d;}else return d;var e=this.f[0].b(a,b,c);if(e == b)return d;b = e;for(d = 1;d < this.f.length && b < a.length;d++) {e = this.f[d].b(a,b,c);if(e == b)break;b = e;}return b;};function Vg(){this.b = this.lb = null;this.error = !1;this.values = {};this.f = null;}n = Vg.prototype;n.clone = function(){var a=new this.constructor();a.lb = this.lb;a.b = this.b;a.f = this.f;return a;};n.ue = function(a,b){this.lb = a;this.b = b;};n.xc = function(){this.error = !0;return 0;};function Wg(a,b){a.xc([b]);return null;}n.se = function(a){return Wg(this,a);};n.hd = function(a){return Wg(this,a);};n.Zb = function(a){return Wg(this,a);};n.Mc = function(a){return Wg(this,a);};n.Lc = function(a){return Wg(this,a);};n.Kc = function(a){return Wg(this,a);};n.Od = function(a){return Wg(this,a);};n.Nc = function(a){return Wg(this,a);};n.Ab = function(a){this.xc(a.values);return null;};n.Yb = function(){this.error = !0;return null;};n.Ib = function(a){return Wg(this,a);};n.Jc = function(){this.error = !0;return null;};function Xg(){Vg.call(this);}t(Xg,Vg);Xg.prototype.xc = function(a){for(var b=0,c=0;b < a.length;) {var d=this.lb[c].b(a,b,this);if(d > b)b = d,c = 0;else if(++c == this.lb.length){this.error = !0;break;}}return b;};function Yg(){Vg.call(this);}t(Yg,Vg);Yg.prototype.xc = function(a){if(a.length > this.lb.length || !a.length)return this.error = !0,0;for(var b=0;b < this.lb.length;b++) {for(var c=b;c >= a.length;) c = 1 == c?0:c - 2;if(this.lb[b].b(a,c,this) != c + 1)return this.error = !0,0;}return a.length;};function Zg(){Vg.call(this);}t(Zg,Vg);Zg.prototype.xc = function(a){for(var b=a.length,c=0;c < a.length;c++) if(a[c] === Ac){b = c;break;}if(b > this.lb.length || !a.length)return this.error = !0,0;for(c = 0;c < this.lb.length;c++) {for(var d=c;d >= b;) d = 1 == d?0:d - 2;var e;if(b + 1 < a.length)for(e = b + c + 1;e >= a.length;) e -= e == b + 2?1:2;else e = d;if(2 != this.lb[c].b([a[d],a[e]],0,this))return this.error = !0,0;}return a.length;};function $g(){Vg.call(this);}t($g,Xg);$g.prototype.Yb = function(a){for(var b={},c=0;c < a.values.length;c++) {this.values = {};if(a.values[c] instanceof vc)this.error = !0;else {a.values[c].ba(this);for(var d=b,e=this.values,f=0;f < this.b.length;f++) {var g=this.b[f],h=e[g] || this.f.l[g],l=d[g];l || (l = [],d[g] = l);l.push(h);}this.values["background-color"] && c != a.values.length - 1 && (this.error = !0);}if(this.error)return null;}this.values = {};for(var k in b) this.values[k] = "background-color" == k?b[k].pop():new vc(b[k]);return null;};function ah(){Vg.call(this);}t(ah,Xg);ah.prototype.ue = function(a,b){Xg.prototype.ue.call(this,a,b);this.b.push("font-family","line-height","font-size");};ah.prototype.xc = function(a){var b=Xg.prototype.xc.call(this,a);if(b + 2 > a.length)return this.error = !0,b;this.error = !1;var c=this.f.g;if(!a[b].ba(c["font-size"]))return this.error = !0,b;this.values["font-size"] = a[b++];if(a[b] === Ac){b++;if(b + 2 > a.length || !a[b].ba(c["line-height"]))return this.error = !0,b;this.values["line-height"] = a[b++];}var d=b == a.length - 1?a[b]:new uc(a.slice(b,a.length));if(!d.ba(c["font-family"]))return this.error = !0,b;this.values["font-family"] = d;return a.length;};ah.prototype.Yb = function(a){a.values[0].ba(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c < a.values.length;c++) b.push(a.values[c]);a = new vc(b);a.ba(this.f.g["font-family"])?this.values["font-family"] = a:this.error = !0;return null;};ah.prototype.Zb = function(a){if(a = this.f.f[a.name])for(var b in a) this.values[b] = a[b];else this.error = !0;return null;};var bh={SIMPLE:Xg,INSETS:Yg,INSETS_SLASH:Zg,COMMA:$g,FONT:ah};function ch(){this.g = {};this.C = {};this.l = {};this.b = {};this.f = {};this.h = {};this.A = [];this.j = [];}function dh(a,b){var c;if(3 == b.type)c = new D(b.M,b.text);else if(7 == b.type)c = kf(b.text);else if(1 == b.type)c = C(b.text);else throw Error("unexpected replacement");if(Ig(a)){var d=a.b[0].b.f,e;for(e in d) d[e] = c;return a;}throw Error("unexpected replacement");}function eh(a,b,c){for(var d=new Fg(),e=0;e < b;e++) Kg(d,a.clone(),1);if(c == Number.POSITIVE_INFINITY)Kg(d,a,3);else for(e = b;e < c;e++) Kg(d,a.clone(),2);return d;}function fh(a){var b=new Fg(),c=b.b.length;b.b.push(new Dg(a));a = new Eg(c,!0);var d=new Eg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h = !1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b;}function gh(a,b){var c;switch(a){case "COMMA":c = new Pg(b);break;case "SPACE":c = new Og(b);break;default:c = new Qg(a.toLowerCase(),b);}return fh(c);}function hh(a){a.b.HASHCOLOR = fh(new Jg(64,T,T));a.b.POS_INT = fh(new Jg(32,T,T));a.b.POS_NUM = fh(new Jg(16,T,T));a.b.POS_PERCENTAGE = fh(new Jg(8,T,{"%":B}));a.b.NEGATIVE = fh(new Jg(256,T,T));a.b.ZERO = fh(new Jg(512,T,T));a.b.ZERO_PERCENTAGE = fh(new Jg(1024,T,T));a.b.POS_LENGTH = fh(new Jg(8,T,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE = fh(new Jg(8,T,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME = fh(new Jg(8,T,{s:B,ms:B}));a.b.FREQUENCY = fh(new Jg(8,T,{Hz:B,kHz:B}));a.b.RESOLUTION = fh(new Jg(8,T,{dpi:B,dpcm:B,dppx:B}));a.b.URI = fh(new Jg(128,T,T));a.b.IDENT = fh(new Jg(4,T,T));a.b.STRING = fh(new Jg(2,T,T));a.b.SLASH = fh(new Jg(2048,T,T));var b={"font-family":C("sans-serif")};a.f.caption = b;a.f.icon = b;a.f.menu = b;a.f["message-box"] = b;a.f["small-caption"] = b;a.f["status-bar"] = b;}function ih(a){return !!a.match(/^[A-Z_0-9]+$/);}function jh(a,b,c){var d=P(b);if(0 == d.type)return null;var e={"":!0};if(14 == d.type){do {R(b);d = P(b);if(1 != d.type)throw Error("Prefix name expected");e[d.text] = !0;R(b);d = P(b);}while(16 == d.type);if(15 != d.type)throw Error("']' expected");R(b);d = P(b);}if(1 != d.type)throw Error("Property name expected");if(2 == c?"SHORTHANDS" == d.text:"DEFAULTS" == d.text)return R(b),null;d = d.text;R(b);if(2 != c){if(39 != P(b).type)throw Error("'=' expected");ih(d) || (a.C[d] = e);}else if(18 != P(b).type)throw Error("':' expected");return d;}function kh(a,b){for(;;) {var c=jh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function l(){if(!d.length)throw Error("No values");var a;if(1 == d.length)a = d[0];else {var b=f,c=d;a = new Fg();if("||" == b){for(b = 0;b < c.length;b++) {var e=new Fg(),g=e;if(g.b.length)throw Error("invalid call");var h=new Dg(Hg);h.f = 2 * b + 1;g.b.push(h);var h=new Eg(0,!0),k=new Eg(0,!1);g.g.push(g.f.length);g.f.push(k);g.match.push(g.f.length);g.f.push(h);Kg(e,c[b],1);Gg(e,e.match,!1,b);Kg(a,e,b?4:1);}c = new Fg();if(c.b.length)throw Error("invalid call");Gg(c,c.match,!0,-1);Kg(c,a,3);a = [c.match,c.g,c.error];for(b = 0;b < a.length;b++) Gg(c,a[b],!1,-1);a = c;}else {switch(b){case " ":e = 1;break;case "|":case "||":e = 4;break;default:throw Error("unexpected op");}for(b = 0;b < c.length;b++) Kg(a,c[b],b?e:1);}}return a;},k=function k(a){if(h)throw Error("'" + a + "': unexpected");if(f && f != a)throw Error("mixed operators: '" + a + "' and '" + f + "'");f = a;h = !0;},m=null;!m;) switch((R(b),g = P(b),g.type)){case 1:h || k(" ");if(ih(g.text)){var p=a.b[g.text];if(!p)throw Error("'" + g.text + "' unexpected");d.push(p.clone());}else p = {},p[g.text.toLowerCase()] = C(g.text),d.push(fh(new Jg(0,p,T)));h = !1;break;case 5:p = {};p["" + g.M] = new Ec(g.M);d.push(fh(new Jg(0,p,T)));h = !1;break;case 34:k("|");break;case 25:k("||");break;case 14:h || k(" ");e.push({Ve:d,Oe:f,vb:"["});f = "";d = [];h = !0;break;case 6:h || k(" ");e.push({Ve:d,Oe:f,vb:"(",Cc:g.text});f = "";d = [];h = !0;break;case 15:g = l();p = e.pop();if("[" != p.vb)throw Error("']' unexpected");d = p.Ve;d.push(g);f = p.Oe;h = !1;break;case 11:g = l();p = e.pop();if("(" != p.vb)throw Error("')' unexpected");d = p.Ve;d.push(gh(p.Cc,g));f = p.Oe;h = !1;break;case 18:if(h)throw Error("':' unexpected");R(b);d.push(dh(d.pop(),P(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(eh(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(eh(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(eh(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:R(b);g = P(b);if(5 != g.type)throw Error("<int> expected");var q=p = g.M;R(b);g = P(b);if(16 == g.type){R(b);g = P(b);if(5 != g.type)throw Error("<int> expected");q = g.M;R(b);g = P(b);}if(13 != g.type)throw Error("'}' expected");d.push(eh(d.pop(),p,q));break;case 17:m = l();if(0 < e.length)throw Error("unclosed '" + e.pop().vb + "'");break;default:throw Error("unexpected token");}R(b);ih(c)?a.b[c] = m:a.g[c] = 1 != m.b.length || m.b[0].f?new Og(m):m.b[0].b;}}function lh(a,b){for(var c={},d=0;d < b.length;d++) for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f < e.length;f++) {var g=e[f],h=a.l[g];h?c[g] = h:v.b("Unknown property in makePropSet:",g);}return c;}function mh(a,b,c,d,e){var f="",g=b;b = b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h && (f = h[1],b = h[2]);if((h = a.C[b]) && h[f])if(f = a.g[b])(a = c === ed || c.Ie()?c:c.ba(f))?e.yb(b,a,d):e.Tc(g,c);else if((b = a.h[b].clone(),c === ed))for(c = 0;c < b.b.length;c++) e.yb(b.b[c],ed,d);else {c.ba(b);if(b.error)d = !1;else {for(a = 0;a < b.b.length;a++) f = b.b[a],e.yb(f,b.values[f] || b.f.l[f],d);d = !0;}d || e.Tc(g,c);}else e.Md(g,c);}var nh=new re(function(){var a=J("loadValidatorSet.load"),b=oa("validation.txt",na),c=df(b),d=new ch();hh(d);c.then(function(c){try{if(c.responseText){var e=new af(c.responseText,null);for(kh(d,e);;) {var g=jh(d,e,2);if(!g)break;for(c = [];;) {R(e);var h=P(e);if(17 == h.type){R(e);break;}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Dc(h.M));break;case 5:c.push(new Ec(h.M));break;case 3:c.push(new D(h.M,h.text));break;default:throw Error("unexpected token");}}d.l[g] = 1 < c.length?new uc(c):c[0];}for(;;) {var l=jh(d,e,3);if(!l)break;var k=Q(e,1),m;1 == k.type && bh[k.text]?(m = new bh[k.text](),R(e)):m = new Xg();m.f = d;g = !1;h = [];c = !1;for(var p=[],q=[];!g;) switch((R(e),k = P(e),k.type)){case 1:if(d.g[k.text])h.push(new Sg(m.f,k.text)),q.push(k.text);else if(d.h[k.text] instanceof Yg){var r=d.h[k.text];h.push(new Tg(r.f,r.b));q.push.apply(q,r.b);}else throw Error("'" + k.text + "' is neither a simple property nor an inset shorthand");break;case 19:if(0 < h.length || c)throw Error("unexpected slash");c = !0;break;case 14:p.push({Re:c,lb:h});h = [];c = !1;break;case 15:var z=new Ug(h,c),u=p.pop(),h=u.lb;c = u.Re;h.push(z);break;case 17:g = !0;R(e);break;default:throw Error("unexpected token");}m.ue(h,q);d.h[l] = m;}d.j = lh(d,["background"]);d.A = lh(d,"margin border padding columns column-gap column-rule column-fill".split(" "));}else v.error("Error: missing",b);}catch(A) {v.error(A,"Error:");}M(a,d);});return a.result();},"validatorFetcher");var oh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},ph=["box-decoration-break","image-resolution","orphans","widows"];function qh(){return Sd("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b());},[].concat(ph));}for(var rh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},sh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),th=["left","right","top","bottom"],uh={width:!0,height:!0},vh=0;vh < sh.length;vh++) for(var wh=0;wh < th.length;wh++) {var xh=sh[vh].replace("%",th[wh]);uh[xh] = !0;}function yh(a){for(var b={},c=0;c < sh.length;c++) for(var d in a) {var e=sh[c].replace("%",d),f=sh[c].replace("%",a[d]);b[e] = f;b[f] = e;}return b;}var zh=yh({before:"right",after:"left",start:"top",end:"bottom"}),Ah=yh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value = a;this.Ua = b;}n = V.prototype;n.sf = function(){return this;};n.ud = function(a){a = this.value.ba(a);return a === this.value?this:new V(a,this.Ua);};n.wf = function(a){return a?new V(this.value,this.Ua + a):this;};n.evaluate = function(a,b){return Xf(a,this.value,b);};n.Xe = function(){return !0;};function Bh(a,b,c){V.call(this,a,b);this.ea = c;}t(Bh,V);Bh.prototype.sf = function(){return new V(this.value,this.Ua);};Bh.prototype.ud = function(a){a = this.value.ba(a);return a === this.value?this:new Bh(a,this.Ua,this.ea);};Bh.prototype.wf = function(a){return a?new Bh(this.value,this.Ua + a,this.ea):this;};Bh.prototype.Xe = function(a){return !!this.ea.evaluate(a);};function Ch(a,b,c){return (!b || c.Ua > b.Ua) && c.Xe(a)?c.sf():b;}var Dh={"region-id":!0,"fragment-selector-id":!0};function Eh(a){return "_" != a.charAt(0) && !Dh[a];}function Fh(a,b,c){c?a[b] = c:delete a[b];}function Gh(a,b){var c=a[b];c || (c = {},a[b] = c);return c;}function Hh(a){var b=a._viewConditionalStyles;b || (b = [],a._viewConditionalStyles = b);return b;}function Ih(a,b){var c=a[b];c || (c = [],a[b] = c);return c;}function Jh(a,b,c,d,e,f,g){[{id:e,Mf:"_pseudos"},{id:f,Mf:"_regions"}].forEach(function(a){if(a.id){var c=Gh(b,a.Mf);b = c[a.id];b || (b = {},c[a.id] = b);}});g && (e = Hh(b),b = {},e.push({lg:b,ag:g}));for(var h in c) "_" != h.charAt(0) && (Dh[h]?(g = c[h],e = Ih(b,h),Array.prototype.push.apply(e,g)):Fh(b,h,Ch(a,b[h],c[h].wf(d))));}function Kh(a,b){if(0 < a.length){a.sort(function(a,b){return b.f() - a.f();});for(var c=null,d=a.length - 1;0 <= d;d--) c = a[d],c.b = b,b = c;return c;}return b;}function Lh(a,b){this.g = a;this.b = b;this.f = "";}t(Lh,tc);function Mh(a){a = a.g["font-size"].value;var b;a: switch(a.ga.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b = !0;break a;default:b = !1;}if(!b)throw Error("Unexpected state");return a.M * Bb[a.ga];}Lh.prototype.Mc = function(a){if("em" == a.ga || "ex" == a.ga){var b=Fb(this.b,a.ga,!1) / Fb(this.b,"em",!1);return new D(a.M * b * Mh(this),"px");}if("rem" == a.ga || "rex" == a.ga)return b = Fb(this.b,a.ga,!1) / Fb(this.b,"rem",!1),new D(a.M * b * this.b.fontSize(),"px");if("%" == a.ga){if("font-size" === this.f)return new D(a.M / 100 * Mh(this),"px");if("line-height" === this.f)return a;b = this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.M,b);}return a;};Lh.prototype.Jc = function(a){return "font-size" == this.f?Xf(this.b,a,this.f).ba(this):a;};function Nh(){}Nh.prototype.apply = function(){};Nh.prototype.l = function(a){return new Oh([this,a]);};Nh.prototype.clone = function(){return this;};function Ph(a){this.b = a;}t(Ph,Nh);Ph.prototype.apply = function(a){var b=this.b.f(a);a.h[a.h.length - 1].push(b);};function Oh(a){this.b = a;}t(Oh,Nh);Oh.prototype.apply = function(a){for(var b=0;b < this.b.length;b++) this.b[b].apply(a);};Oh.prototype.l = function(a){this.b.push(a);return this;};Oh.prototype.clone = function(){return new Oh([].concat(this.b));};function Qh(a,b,c,d,e){this.style = a;this.Z = b;this.b = c;this.h = d;this.j = e;}t(Qh,Nh);Qh.prototype.apply = function(a){Jh(a.l,a.G,this.style,this.Z,this.b,this.h,Rh(a,this.j));};function W(){this.b = null;}t(W,Nh);W.prototype.apply = function(a){this.b.apply(a);};W.prototype.f = function(){return 0;};W.prototype.g = function(){return !1;};function Sh(a){this.b = null;this.h = a;}t(Sh,W);Sh.prototype.apply = function(a){0 <= a.H.indexOf(this.h) && this.b.apply(a);};Sh.prototype.f = function(){return 10;};Sh.prototype.g = function(a){this.b && Th(a.Ea,this.h,this.b);return !0;};function Uh(a){this.b = null;this.id = a;}t(Uh,W);Uh.prototype.apply = function(a){a.W != this.id && a.ia != this.id || this.b.apply(a);};Uh.prototype.f = function(){return 11;};Uh.prototype.g = function(a){this.b && Th(a.g,this.id,this.b);return !0;};function Vh(a){this.b = null;this.localName = a;}t(Vh,W);Vh.prototype.apply = function(a){a.f == this.localName && this.b.apply(a);};Vh.prototype.f = function(){return 8;};Vh.prototype.g = function(a){this.b && Th(a.fd,this.localName,this.b);return !0;};function Wh(a,b){this.b = null;this.h = a;this.localName = b;}t(Wh,W);Wh.prototype.apply = function(a){a.f == this.localName && a.j == this.h && this.b.apply(a);};Wh.prototype.f = function(){return 8;};Wh.prototype.g = function(a){if(this.b){var b=a.b[this.h];b || (b = "ns" + a.j++ + ":",a.b[this.h] = b);Th(a.h,b + this.localName,this.b);}return !0;};function Xh(a){this.b = null;this.h = a;}t(Xh,W);Xh.prototype.apply = function(a){var b=a.b;if(b && "a" == a.f){var c=b.getAttribute("href");c && c.match(/^#/) && (b = b.ownerDocument.getElementById(c.substring(1))) && (b = b.getAttributeNS("http://www.idpf.org/2007/ops","type")) && b.match(this.h) && this.b.apply(a);}};function Yh(a){this.b = null;this.h = a;}t(Yh,W);Yh.prototype.apply = function(a){a.j == this.h && this.b.apply(a);};function Zh(a,b){this.b = null;this.h = a;this.name = b;}t(Zh,W);Zh.prototype.apply = function(a){a.b && a.b.hasAttributeNS(this.h,this.name) && this.b.apply(a);};function $h(a,b,c){this.b = null;this.h = a;this.name = b;this.value = c;}t($h,W);$h.prototype.apply = function(a){a.b && a.b.getAttributeNS(this.h,this.name) == this.value && this.b.apply(a);};$h.prototype.f = function(){return "type" == this.name && "http://www.idpf.org/2007/ops" == this.h?9:0;};$h.prototype.g = function(a){return "type" == this.name && "http://www.idpf.org/2007/ops" == this.h?(this.b && Th(a.f,this.value,this.b),!0):!1;};function ai(a,b){this.b = null;this.h = a;this.name = b;}t(ai,W);ai.prototype.apply = function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b && rh[b] && this.b.apply(a);}};ai.prototype.f = function(){return 0;};ai.prototype.g = function(){return !1;};function bi(a,b,c){this.b = null;this.j = a;this.name = b;this.h = c;}t(bi,W);bi.prototype.apply = function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b && b.match(this.h) && this.b.apply(a);}};function ci(a){this.b = null;this.h = a;}t(ci,W);ci.prototype.apply = function(a){a.lang.match(this.h) && this.b.apply(a);};function di(){this.b = null;}t(di,W);di.prototype.apply = function(a){a.tb && this.b.apply(a);};di.prototype.f = function(){return 6;};function ei(){this.b = null;}t(ei,W);ei.prototype.apply = function(a){a.ra && this.b.apply(a);};ei.prototype.f = function(){return 12;};function fi(a,b){this.b = null;this.h = a;this.vb = b;}t(fi,W);function gi(a,b,c){a -= c;return b?!(a % b) && 0 <= a / b:!a;}function hi(a,b){fi.call(this,a,b);}t(hi,fi);hi.prototype.apply = function(a){gi(a.Sa,this.h,this.vb) && this.b.apply(a);};hi.prototype.f = function(){return 5;};function ii(a,b){fi.call(this,a,b);}t(ii,fi);ii.prototype.apply = function(a){gi(a.Db[a.j][a.f],this.h,this.vb) && this.b.apply(a);};ii.prototype.f = function(){return 5;};function ji(a,b){fi.call(this,a,b);}t(ji,fi);ji.prototype.apply = function(a){var b=a.T;null === b && (b = a.T = a.b.parentNode.childElementCount - a.Sa + 1);gi(b,this.h,this.vb) && this.b.apply(a);};ji.prototype.f = function(){return 4;};function ki(a,b){fi.call(this,a,b);}t(ki,fi);ki.prototype.apply = function(a){var b=a.Cb;if(!b[a.j]){var c=a.b;do {var d=c.namespaceURI,e=c.localName,f=b[d];f || (f = b[d] = {});f[e] = (f[e] || 0) + 1;}while(c = c.nextElementSibling);}gi(b[a.j][a.f],this.h,this.vb) && this.b.apply(a);};ki.prototype.f = function(){return 4;};function li(){this.b = null;}t(li,W);li.prototype.apply = function(a){for(var b=a.b.firstChild;b;) {switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0 < b.length)return;}b = b.nextSibling;}this.b.apply(a);};li.prototype.f = function(){return 4;};function mi(){this.b = null;}t(mi,W);mi.prototype.apply = function(a){!1 === a.b.disabled && this.b.apply(a);};mi.prototype.f = function(){return 5;};function ni(){this.b = null;}t(ni,W);ni.prototype.apply = function(a){!0 === a.b.disabled && this.b.apply(a);};ni.prototype.f = function(){return 5;};function oi(){this.b = null;}t(oi,W);oi.prototype.apply = function(a){var b=a.b;!0 !== b.selected && !0 !== b.checked || this.b.apply(a);};oi.prototype.f = function(){return 5;};function pi(a){this.b = null;this.ea = a;}t(pi,W);pi.prototype.apply = function(a){if(a.ha[this.ea])try{a.sb.push(this.ea),this.b.apply(a);}finally {a.sb.pop();}};pi.prototype.f = function(){return 5;};function qi(){this.b = !1;}t(qi,Nh);qi.prototype.apply = function(){this.b = !0;};qi.prototype.clone = function(){var a=new qi();a.b = this.b;return a;};function ri(a){this.b = null;this.h = new qi();this.j = Kh(a,this.h);}t(ri,W);ri.prototype.apply = function(a){this.j.apply(a);this.h.b || this.b.apply(a);this.h.b = !1;};ri.prototype.f = function(){return this.j.f();};function si(a,b,c){this.ea = a;this.b = b;this.h = c;}function ti(a,b){var c=a.ea,d=a.h;b.ha[c] = (b.ha[c] || 0) + 1;d && (b.C[c]?b.C[c].push(d):b.C[c] = [d]);}function ui(a,b){vi(b,a.ea,a.h);}function wi(a,b,c){si.call(this,a,b,c);}t(wi,si);wi.prototype.f = function(a){return new wi(this.ea,this.b,Rh(a,this.b));};wi.prototype.push = function(a,b){b || ti(this,a);return !1;};wi.prototype.pop = function(a,b){return b?!1:(ui(this,a),!0);};function xi(a,b,c){si.call(this,a,b,c);}t(xi,si);xi.prototype.f = function(a){return new xi(this.ea,this.b,Rh(a,this.b));};xi.prototype.push = function(a,b){b?1 == b && ui(this,a):ti(this,a);return !1;};xi.prototype.pop = function(a,b){if(b)1 == b && ti(this,a);else return ui(this,a),!0;return !1;};function yi(a,b,c){si.call(this,a,b,c);this.g = !1;}t(yi,si);yi.prototype.f = function(a){return new yi(this.ea,this.b,Rh(a,this.b));};yi.prototype.push = function(a){return this.g?(ui(this,a),!0):!1;};yi.prototype.pop = function(a,b){if(this.g)return ui(this,a),!0;b || (this.g = !0,ti(this,a));return !1;};function zi(a,b,c){si.call(this,a,b,c);this.g = !1;}t(zi,si);zi.prototype.f = function(a){return new zi(this.ea,this.b,Rh(a,this.b));};zi.prototype.push = function(a,b){this.g && (-1 == b?ti(this,a):b || ui(this,a));return !1;};zi.prototype.pop = function(a,b){if(this.g){if(-1 == b)return ui(this,a),!0;b || ti(this,a);}else b || (this.g = !0,ti(this,a));return !1;};function Ai(a,b){this.b = a;this.element = b;}Ai.prototype.f = function(){return this;};Ai.prototype.push = function(){return !1;};Ai.prototype.pop = function(a,b){return b?!1:(Bi(a,this.b,this.element),!0);};function Ci(a){this.lang = a;}Ci.prototype.f = function(){return this;};Ci.prototype.push = function(){return !1;};Ci.prototype.pop = function(a,b){return b?!1:(a.lang = this.lang,!0);};function Di(a){this.b = a;}Di.prototype.f = function(){return this;};Di.prototype.push = function(){return !1;};Di.prototype.pop = function(a,b){return b?!1:(a.J = this.b,!0);};function Ei(a){this.element = a;}t(Ei,tc);function Fi(a,b){switch(b){case "url":return a?new Gc(a):new Gc("about:invalid");default:return a?new Bc(a):new Bc("");}}Ei.prototype.Ib = function(a){if("attr" !== a.name)return tc.prototype.Ib.call(this,a);var b="string",c;a.values[0] instanceof uc?(2 <= a.values[0].values.length && (b = a.values[0].values[1].stringValue()),c = a.values[0].values[0].stringValue()):c = a.values[0].stringValue();a = 1 < a.values.length?Fi(a.values[1].stringValue(),b):Fi(null,b);return this.element && this.element.hasAttribute(c)?Fi(this.element.getAttribute(c),b):a;};function Gi(a,b,c){this.f = a;this.element = b;this.b = c;}t(Gi,tc);Gi.prototype.Zb = function(a){var b=this.f,c=b.J,d=Math.floor(c.length / 2) - 1;switch(a.name){case "open-quote":a = c[2 * Math.min(d,b.F)];b.F++;break;case "close-quote":return 0 < b.F && b.F--,c[2 * Math.min(d,b.F) + 1];case "no-open-quote":return b.F++,new Bc("");case "no-close-quote":return 0 < b.F && b.F--,new Bc("");}return a;};var Hi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"ք",8E3,"փ",7E3,"ւ",6E3,"ց",5E3,"ր",4E3,"տ",3E3,"վ",2E3,"ս",1E3,"ռ",900,"ջ",800,"պ",700,"չ",600,"ո",500,"շ",400,"ն",300,"յ",200,"մ",100,"ճ",90,"ղ",80,"ձ",70,"հ",60,"կ",50,"ծ",40,"խ",30,"լ",20,"ի",10,"ժ",9,"թ",8,"ը",7,"է",6,"զ",5,"ե",4,"դ",3,"գ",2,"բ",1,"ա"],georgian:[19999,1E4,"ჵ",9E3,"ჰ",8E3,"ჯ",7E3,"ჴ",6E3,"ხ",5E3,"ჭ",4E3,"წ",3E3,"ძ",2E3,"ც",1E3,"ჩ",900,"შ",800,"ყ",700,"ღ",600,"ქ",500,"ფ",400,"ჳ",300,"ტ",200,"ს",100,"რ",90,"ჟ",80,"პ",70,"ო",60,"ჲ",50,"ნ",40,"მ",30,"ლ",20,"კ",10,"ი",9,"თ",8,"ჱ",7,"ზ",6,"ვ",5,"ე",4,"დ",3,"გ",2,"ბ",1,"ა"],hebrew:[999,400,"ת",300,"ש",200,"ר",100,"ק",90,"צ",80,"פ",70,"ע",60,"ס",50,"נ",40,"מ",30,"ל",20,"כ",19,"יט",18,"יח",17,"יז",16,"טז",15,"טו",10,"י",9,"ט",8,"ח",7,"ז",6,"ו",5,"ה",4,"ד",3,"ג",2,"ב",1,"א"]},Ii={latin:"a-z",alpha:"a-z",greek:"α-ρσ-ω",russian:"а-ик-щэ-я"},Ji={square:"■",disc:"•",circle:"◦",none:""},Ki={Lg:!1,Pc:"零一二三四五六七八九",zd:"十百千",dg:"負"};function Li(a){if(9999 < a || -9999 > a)return "" + a;if(!a)return Ki.Pc.charAt(0);var b=new Ca();0 > a && (b.append(Ki.dg),a = -a);if(10 > a)b.append(Ki.Pc.charAt(a));else if(Ki.Mg && 19 >= a)b.append(Ki.zd.charAt(0)),a && b.append(Ki.zd.charAt(a - 10));else {var c=Math.floor(a / 1E3);c && (b.append(Ki.Pc.charAt(c)),b.append(Ki.zd.charAt(2)));if(c = Math.floor(a / 100) % 10)b.append(Ki.Pc.charAt(c)),b.append(Ki.zd.charAt(1));if(c = Math.floor(a / 10) % 10)b.append(Ki.Pc.charAt(c)),b.append(Ki.zd.charAt(0));(a %= 10) && b.append(Ki.Pc.charAt(a));}return b.toString();}function Mi(a,b){var c=!1,d=!1,e;if(e = b.match(/^upper-(.*)/))c = !0,b = e[1];else if(e = b.match(/^lower-(.*)/))d = !0,b = e[1];e = "";if(Hi[b])a: {e = Hi[b];var f=a;if(f > e[0] || 0 >= f || f != Math.round(f))e = "";else {for(var g="",h=1;h < e.length;h += 2) {var l=e[h],k=Math.floor(f / l);if(20 < k){e = "";break a;}for(f -= k * l;0 < k;) g += e[h + 1],k--;}e = g;}}else if(Ii[b])if((e = a,0 >= e || e != Math.round(e)))e = "";else {g = Ii[b];f = [];for(h = 0;h < g.length;) if("-" == g.substr(h + 1,1))for(k = g.charCodeAt(h),l = g.charCodeAt(h + 2),h += 3;k <= l;k++) f.push(String.fromCharCode(k));else f.push(g.substr(h++,1));g = "";do e--,h = e % f.length,g = f[h] + g,e = (e - h) / f.length;while(0 < e);e = g;}else null != Ji[b]?e = Ji[b]:"decimal-leading-zero" == b?(e = a + "",1 == e.length && (e = "0" + e)):"cjk-ideographic" == b || "trad-chinese-informal" == b?e = Li(a):e = a + "";return c?e.toUpperCase():d?e.toLowerCase():e;}function Ni(a,b){var c=b[0].toString(),d=1 < b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e && e.length)return new Bc(Mi(e && e.length && e[e.length - 1] || 0,d));c = new G(Oi(a.b,c,function(a){return Mi(a || 0,d);}));return new uc([c]);}function Pi(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2 < b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Ca();if(f && f.length)for(var h=0;h < f.length;h++) 0 < h && g.append(d),g.append(Mi(f[h],e));c = new G(Qi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c < a.length;c++) b.push(Mi(a[c],e));a = g.toString();a.length && b.push(a);return b.length?b.join(d):Mi(0,e);}));return new uc([c]);}function Ri(a,b){var c=b[0],c=c instanceof Gc?c.url:c.stringValue(),d=b[1].toString(),e=2 < b.length?b[2].stringValue():"decimal",c=new G(Si(a.b,c,d,function(a){return Mi(a || 0,e);}));return new uc([c]);}function Ti(a,b){var c=b[0],c=c instanceof Gc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3 < b.length?b[3].stringValue():"decimal",c=new G(Ui(a.b,c,d,function(a){a = a.map(function(a){return Mi(a,f);});return a.length?a.join(e):Mi(0,f);}));return new uc([c]);}Gi.prototype.Ib = function(a){switch(a.name){case "counter":if(2 >= a.values.length)return Ni(this,a.values);break;case "counters":if(3 >= a.values.length)return Pi(this,a.values);break;case "target-counter":if(3 >= a.values.length)return Ri(this,a.values);break;case "target-counters":if(4 >= a.values.length)return Ti(this,a.values);}v.b("E_CSS_CONTENT_PROP:",a.toString());return new Bc("");};var Vi=1 / 1048576;function Wi(a,b){for(var c in a) b[c] = a[c].clone();}function Xi(){this.j = 0;this.b = {};this.fd = {};this.h = {};this.f = {};this.Ea = {};this.g = {};this.Wc = {};this.order = 0;}Xi.prototype.clone = function(){var a=new Xi();a.j = this.j;for(var b in this.b) a.b[b] = this.b[b];Wi(this.fd,a.fd);Wi(this.h,a.h);Wi(this.f,a.f);Wi(this.Ea,a.Ea);Wi(this.g,a.g);Wi(this.Wc,a.Wc);a.order = this.order;return a;};function Th(a,b,c){var d=a[b];d && (c = d.l(c));a[b] = c;}Xi.prototype.Ne = function(){return this.order += Vi;};function Yi(a,b,c,d){this.A = a;this.l = b;this.Oc = c;this.Bb = d;this.h = [[],[]];this.ha = {};this.H = this.G = this.wa = this.b = null;this.Ra = this.ia = this.W = this.j = this.f = "";this.Y = this.O = null;this.ra = this.tb = !0;this.g = {};this.I = [{}];this.J = [new Bc("“"),new Bc("”"),new Bc("‘"),new Bc("’")];this.F = 0;this.lang = "";this.wc = [0];this.Sa = 0;this.na = [{}];this.Db = this.na[0];this.T = null;this.vc = [this.T];this.uc = [{}];this.Cb = this.na[0];this.C = {};this.sb = [];this.Eb = [];}function vi(a,b,c){a.ha[b]--;a.C[b] && (a.C[b] = a.C[b].filter(function(a){return a !== c;}),a.C[b].length || delete a.C[b]);}function Rh(a,b){var c=null;b && (c = Zi(a.wa,b));var d=a.sb.map((function(a){return (a = this.C[a]) && 0 < a.length?1 === a.length?a[0]:new $i([].concat(a)):null;}).bind(a)).filter(function(a){return a;});return 0 >= d.length?c:c?new aj([c].concat(d)):1 === d.length?d[0]:new aj(d);}function bj(a,b,c){(b = b[c]) && b.apply(a);}var cj=[];function dj(a,b,c,d){a.b = null;a.wa = null;a.G = d;a.j = "";a.f = "";a.W = "";a.ia = "";a.H = b;a.Ra = "";a.O = cj;a.Y = c;ej(a);}function fj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b] = [c];c = a.I[a.I.length - 1];c || (c = {},a.I[a.I.length - 1] = c);c[b] = !0;}function gj(a,b){var c=fd,d=b.display;d && (c = d.evaluate(a.l));var e=null,f=d = null,g=b["counter-reset"];g && (g = g.evaluate(a.l)) && (e = Bg(g,!0));(g = b["counter-set"]) && (g = g.evaluate(a.l)) && (f = Bg(g,!1));(g = b["counter-increment"]) && (g = g.evaluate(a.l)) && (d = Bg(g,!1));"ol" != a.f && "ul" != a.f || "http://www.w3.org/1999/xhtml" != a.j || (e || (e = {}),e["ua-list-item"] = 0);c === md && (d || (d = {}),d["ua-list-item"] = 1);if(e)for(var h in e) fj(a,h,e[h]);if(f)for(var l in f) a.g[l]?(h = a.g[l],h[h.length - 1] = f[l]):fj(a,l,f[l]);if(d)for(var k in d) a.g[k] || fj(a,k,0),h = a.g[k],h[h.length - 1] += d[k];c === md && (c = a.g["ua-list-item"],b["ua-list-item-count"] = new V(new Dc(c[c.length - 1]),0));a.I.push(null);}function hj(a){var b=a.I.pop();if(b)for(var c in b) (b = a.g[c]) && (1 == b.length?delete a.g[c]:b.pop());}function Bi(a,b,c){gj(a,b);b.content && (b.content = b.content.ud(new Gi(a,c,a.Bb)));hj(a);}var ij="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");function jj(a,b,c,d){a.Eb.push(b);a.Y = null;a.b = b;a.wa = d;a.G = c;a.j = b.namespaceURI;a.f = b.localName;d = a.A.b[a.j];a.Ra = d?d + a.f:"";a.W = b.getAttribute("id");a.ia = b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d = b.getAttribute("class"))?a.H = d.split(/\s+/):a.H = cj;(d = b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O = d.split(/\s+/):a.O = cj;"style" == a.f && "http://www.gribuser.ru/xml/fictionbook/2.0" == a.j && (a.H = [b.getAttribute("name") || ""]);if(d = Ba(b))a.h[a.h.length - 1].push(new Ci(a.lang)),a.lang = d.toLowerCase();d = a.ra;var e=a.wc;a.Sa = ++e[e.length - 1];e.push(0);var e=a.na,f=a.Db = e[e.length - 1],g=f[a.j];g || (g = f[a.j] = {});g[a.f] = (g[a.f] || 0) + 1;e.push({});e = a.vc;null !== e[e.length - 1]?a.T = --e[e.length - 1]:a.T = null;e.push(null);e = a.uc;(f = a.Cb = e[e.length - 1]) && f[a.j] && f[a.j][a.f]--;e.push({});ej(a);kj(a,b);e = c.quotes;c = null;e && (e = e.evaluate(a.l)) && (c = new Di(a.J),e === H?a.J = [new Bc(""),new Bc("")]:e instanceof uc && (a.J = e.values));gj(a,a.G);e = a.W || a.ia || b.getAttribute("name") || "";if(d || e){var h={};Object.keys(a.g).forEach(function(a){h[a] = Array.from(this.g[a]);},a);lj(a.Oc,e,h);}if(d = a.G._pseudos)for(e = !0,f = 0;f < ij.length;f++) (g = ij[f]) || (e = !1),(g = d[g]) && (e?Bi(a,g,b):a.h[a.h.length - 2].push(new Ai(g,b)));c && a.h[a.h.length - 2].push(c);}function mj(a,b){for(var c in b) Eh(c) && (b[c] = b[c].ud(a));}function kj(a,b){var c=new Ei(b),d=a.G,e=d._pseudos,f;for(f in e) mj(c,e[f]);mj(c,d);}function ej(a){var b;for(b = 0;b < a.H.length;b++) bj(a,a.A.Ea,a.H[b]);for(b = 0;b < a.O.length;b++) bj(a,a.A.f,a.O[b]);bj(a,a.A.g,a.W);bj(a,a.A.fd,a.f);"" != a.f && bj(a,a.A.fd,"*");bj(a,a.A.h,a.Ra);null !== a.Y && (bj(a,a.A.Wc,a.Y),bj(a,a.A.Wc,"*"));a.b = null;a.h.push([]);for(var c=1;-1 <= c;--c) {var d=a.h[a.h.length - c - 2];for(b = 0;b < d.length;) d[b].push(a,c)?d.splice(b,1):b++;}a.tb = !0;a.ra = !1;}Yi.prototype.pop = function(){for(var a=1;-1 <= a;--a) for(var b=this.h[this.h.length - a - 2],c=0;c < b.length;) b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.tb = !1;};var nj=null;function oj(a,b,c,d,e,f,g){qf.call(this,a,b,g);this.b = null;this.Z = 0;this.h = this.ab = null;this.F = !1;this.ea = c;this.l = d?d.l:nj?nj.clone():new Xi();this.H = e;this.C = f;this.A = 0;this.j = null;}t(oj,rf);oj.prototype.yf = function(a){Th(this.l.fd,"*",a);};function pj(a,b){var c=Kh(a.b,b);c !== b && c.g(a.l) || a.yf(c);}oj.prototype.Hb = function(a,b){if(b || a)this.Z += 1,b && a?this.b.push(new Wh(a,b.toLowerCase())):b?this.b.push(new Vh(b.toLowerCase())):this.b.push(new Yh(a));};oj.prototype.Vd = function(a){this.h?(v.b("::" + this.h,"followed by ." + a),this.b.push(new pi(""))):(this.Z += 256,this.b.push(new Sh(a)));};var qj={"nth-child":hi,"nth-of-type":ii,"nth-last-child":ji,"nth-last-of-type":ki};oj.prototype.Yc = function(a,b){if(this.h)v.b("::" + this.h,"followed by :" + a),this.b.push(new pi(""));else {switch(a.toLowerCase()){case "enabled":this.b.push(new mi());break;case "disabled":this.b.push(new ni());break;case "checked":this.b.push(new oi());break;case "root":this.b.push(new ei());break;case "link":this.b.push(new Vh("a"));this.b.push(new Zh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b && 1 == b.length && "string" == typeof b[0]){var c=new RegExp("(^|s)" + qa(b[0]) + "($|s)");this.b.push(new Xh(c));}else this.b.push(new pi(""));break;case "-adapt-footnote-content":case "footnote-content":this.F = !0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new pi(""));break;case "lang":b && 1 == b.length && "string" == typeof b[0]?this.b.push(new ci(new RegExp("^" + qa(b[0].toLowerCase()) + "($|-)"))):this.b.push(new pi(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c = qj[a.toLowerCase()];b && 2 == b.length?this.b.push(new c(b[0],b[1])):this.b.push(new pi(""));break;case "first-child":this.b.push(new di());break;case "last-child":this.b.push(new ji(0,1));break;case "first-of-type":this.b.push(new ii(0,1));break;case "last-of-type":this.b.push(new ki(0,1));break;case "only-child":this.b.push(new di());this.b.push(new ji(0,1));break;case "only-of-type":this.b.push(new ii(0,1));this.b.push(new ki(0,1));break;case "empty":this.b.push(new li());break;case "before":case "after":case "first-line":case "first-letter":this.Zc(a,b);return;default:v.b("unknown pseudo-class selector: " + a),this.b.push(new pi(""));}this.Z += 256;}};oj.prototype.Zc = function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(v.b("Double pseudoelement ::" + this.h + "::" + a),this.b.push(new pi(""))):this.h = a;break;case "first-n-lines":if(b && 1 == b.length && "number" == typeof b[0]){var c=Math.round(b[0]);if(0 < c && c == b[0]){this.h?(v.b("Double pseudoelement ::" + this.h + "::" + a),this.b.push(new pi(""))):this.h = "first-" + c + "-lines";break;}}case "nth-fragment":b && 2 == b.length?this.j = "NFS_" + b[0] + "_" + b[1]:this.b.push(new pi(""));break;default:v.b("Unrecognized pseudoelement: ::" + a),this.b.push(new pi(""));}this.Z += 1;};oj.prototype.ce = function(a){this.Z += 65536;this.b.push(new Uh(a));};oj.prototype.pd = function(a,b,c,d){this.Z += 256;b = b.toLowerCase();d = d || "";var e;switch(c){case 0:e = new Zh(a,b);break;case 39:e = new $h(a,b,d);break;case 45:!d || d.match(/\s/)?e = new pi(""):e = new bi(a,b,new RegExp("(^|\\s)" + qa(d) + "($|\\s)"));break;case 44:e = new bi(a,b,new RegExp("^" + qa(d) + "($|-)"));break;case 43:d?e = new bi(a,b,new RegExp("^" + qa(d))):e = new pi("");break;case 42:d?e = new bi(a,b,new RegExp(qa(d) + "$")):e = new pi("");break;case 46:d?e = new bi(a,b,new RegExp(qa(d))):e = new pi("");break;case 50:"supported" == d?e = new ai(a,b):(v.b("Unsupported :: attr selector op:",d),e = new pi(""));break;default:v.b("Unsupported attr selector:",c),e = new pi("");}this.b.push(e);};var rj=0;n = oj.prototype;n.Nb = function(){var a="d" + rj++;pj(this,new Ph(new wi(a,this.j,null)));this.b = [new pi(a)];this.j = null;};n.Ud = function(){var a="c" + rj++;pj(this,new Ph(new xi(a,this.j,null)));this.b = [new pi(a)];this.j = null;};n.Rd = function(){var a="a" + rj++;pj(this,new Ph(new yi(a,this.j,null)));this.b = [new pi(a)];this.j = null;};n.Zd = function(){var a="f" + rj++;pj(this,new Ph(new zi(a,this.j,null)));this.b = [new pi(a)];this.j = null;};n.Ec = function(){sj(this);this.h = null;this.F = !1;this.Z = 0;this.b = [];};n.zb = function(){var a;0 != this.A?(tf(this,"E_CSS_UNEXPECTED_SELECTOR"),a = !0):a = !1;a || (this.A = 1,this.ab = {},this.h = null,this.Z = 0,this.F = !1,this.b = []);};n.error = function(a,b){rf.prototype.error.call(this,a,b);1 == this.A && (this.A = 0);};n.Hc = function(a){rf.prototype.Hc.call(this,a);this.A = 0;};n.Ba = function(){sj(this);rf.prototype.Ba.call(this);1 == this.A && (this.A = 0);};n.Ob = function(){rf.prototype.Ob.call(this);};function sj(a){if(a.b){var b=a.Z + a.l.Ne();pj(a,a.Df(b));a.b = null;a.h = null;a.j = null;a.F = !1;a.Z = 0;}}n.Df = function(a){var b=this.H;this.F && (b = b?"xxx-bogus-xxx":"footnote");return new Qh(this.ab,a,this.h,b,this.j);};n.xb = function(a,b,c){mh(this.C,a,b,c,this);};n.Tc = function(a,b){sf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};n.Md = function(a,b){sf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};n.yb = function(a,b,c){"display" != a || b !== qd && b !== pd || (this.yb("flow-options",new uc([Xc,wd]),c),this.yb("flow-into",b,c),b = Nc);Sd("SIMPLE_PROPERTY").forEach(function(d){d = d({name:a,value:b,important:c});a = d.name;b = d.value;c = d.important;});var d=c?mf(this):nf(this);Fh(this.ab,a,this.ea?new Bh(b,d,this.ea):new V(b,d));};n.cd = function(a){switch(a){case "not":a = new tj(this),a.zb(),pf(this.la,a);}};function tj(a){oj.call(this,a.f,a.la,a.ea,a,a.H,a.C,!1);this.parent = a;this.g = a.b;}t(tj,oj);n = tj.prototype;n.cd = function(a){"not" == a && tf(this,"E_CSS_UNEXPECTED_NOT");};n.Ba = function(){tf(this,"E_CSS_UNEXPECTED_RULE_BODY");};n.Ec = function(){tf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR");};n.sd = function(){this.b && 0 < this.b.length && this.g.push(new ri(this.b));this.parent.Z += this.Z;var a=this.la;a.b = a.g.pop();};n.error = function(a,b){oj.prototype.error.call(this,a,b);var c=this.la;c.b = c.g.pop();};function uj(a,b){qf.call(this,a,b,!1);}t(uj,rf);uj.prototype.xb = function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED " + a,this.Sc());else {var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new hc(this.f,100,c),c=b.ta(this.f,c);this.f.values[a] = c;}};function vj(a,b,c,d,e){qf.call(this,a,b,!1);this.ab = d;this.ea = c;this.b = e;}t(vj,rf);vj.prototype.xb = function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):mh(this.b,a,b,c,this);};vj.prototype.Tc = function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a + ":",b.toString());};vj.prototype.Md = function(a,b){v.b("E_INVALID_PROPERTY",a + ":",b.toString());};vj.prototype.yb = function(a,b,c){c = c?mf(this):nf(this);c += this.order;this.order += Vi;Fh(this.ab,a,this.ea?new Bh(b,c,this.ea):new V(b,c));};function wj(a,b){Qf.call(this,a);this.ab = {};this.b = b;this.order = 0;}t(wj,Qf);wj.prototype.xb = function(a,b,c){mh(this.b,a,b,c,this);};wj.prototype.Tc = function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a + ":",b.toString());};wj.prototype.Md = function(a,b){v.b("E_INVALID_PROPERTY",a + ":",b.toString());};wj.prototype.yb = function(a,b,c){c = (c?67108864:50331648) + this.order;this.order += Vi;Fh(this.ab,a,new V(b,c));};function xj(a,b,c){return (a = a["writing-mode"]) && (b = a.evaluate(b,"writing-mode")) && b !== ed?b === Gd:c;}function yj(a,b,c,d){var e={},f;for(f in a) Eh(f) && (e[f] = a[f]);zj(e,b,a);Aj(a,c,d,function(a,c){Bj(e,c,b);zj(e,b,c);});return e;}function Aj(a,b,c,d){a = a._regions;if((b || c) && a)for(c && (c = ["footnote"],b = b?b.concat(c):c),c = 0;c < b.length;c++) {var e=b[c],f=a[e];f && d(e,f);}}function Bj(a,b,c){for(var d in b) Eh(d) && (a[d] = Ch(c,a[d],b[d]));}function Cj(a,b,c,d){c = c?zh:Ah;for(var e in a) if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h && h.Ua > f.Ua)continue;g = uh[g]?g:e;}else g = e;b[g] = d(e,f);}}};var Dj=!1,Ej={Ag:"ltr",Bg:"rtl"};ba("vivliostyle.constants.PageProgression",Ej);Ej.LTR = "ltr";Ej.RTL = "rtl";var Fj={Pf:"left",Qf:"right"};ba("vivliostyle.constants.PageSide",Fj);Fj.LEFT = "left";Fj.RIGHT = "right";var Gj={LOADING:"loading",zg:"interactive",wg:"complete"};ba("vivliostyle.constants.ReadyState",Gj);Gj.LOADING = "loading";Gj.INTERACTIVE = "interactive";Gj.COMPLETE = "complete";function Hj(a,b,c){this.A = a;this.url = b;this.b = c;this.lang = null;this.h = -1;this.root = c.documentElement;b = a = null;if("http://www.w3.org/1999/xhtml" == this.root.namespaceURI){for(var d=this.root.firstChild;d;d = d.nextSibling) if(1 == d.nodeType && (c = d,"http://www.w3.org/1999/xhtml" == c.namespaceURI))switch(c.localName){case "head":b = c;break;case "body":a = c;}this.lang = this.root.getAttribute("lang");}else if("http://www.gribuser.ru/xml/fictionbook/2.0" == this.root.namespaceURI){b = this.root;for(d = this.root.firstChild;d;d = d.nextSibling) 1 == d.nodeType && (c = d,"http://www.gribuser.ru/xml/fictionbook/2.0" == c.namespaceURI && "body" == c.localName && (a = c));c = Ij(Ij(Ij(Ij(new Jj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0 < c.length && (this.lang = c[0]);}else if("http://example.com/sse" == this.root.namespaceURI)for(c = this.root.firstElementChild;c;c = c.nextElementSibling) d = c.localName,"meta" === d?b = c:"body" === d && (a = c);this.body = a;this.l = b;this.g = this.root;this.j = 1;this.g.setAttribute("data-adapt-eloff","0");}function Kj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d != b;) {var e=d.firstChild;if(!e)for(;!(e = d.nextSibling);) if((d = d.parentNode,!d))throw Error("Internal error");d = e;1 == e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c += e.textContent.length;}a.j = c;a.g = b;return c - 1;}function Lj(a,b,c,d){var e=0;if(1 == b.nodeType){if(!d)return Kj(a,b);}else {e = c;c = b.previousSibling;if(!c)return b = b.parentNode,e += 1,Kj(a,b) + e;b = c;}for(;;) {for(;b.lastChild;) b = b.lastChild;if(1 == b.nodeType)break;e += b.textContent.length;c = b.previousSibling;if(!c){b = b.parentNode;break;}b = c;}e += 1;return Kj(a,b) + e;}function Mj(a){0 > a.h && (a.h = Lj(a,a.root,0,!0));return a.h;}function Nj(a,b){for(var c,d=a.root;;) {c = Kj(a,d);if(c >= b)return d;var e=d.children;if(!e)break;var f=Ma(e.length,function(c){return Kj(a,e[c]) > b;});if(!f)break;if(f < e.length && Kj(a,e[f]) <= b)throw Error("Consistency check failed!");d = e[f - 1];}c += 1;for(var f=d,g=f.firstChild || f.nextSibling,h=null;;) {if(g){if(1 == g.nodeType)break;h = f = g;c += g.textContent.length;if(c > b)break;}else if((f = f.parentNode,!f))break;g = f.nextSibling;}return h || d;}function Oj(a,b){var c=b.getAttribute("id");c && !a.f[c] && (a.f[c] = b);(c = b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id")) && !a.f[c] && (a.f[c] = b);for(c = b.firstElementChild;c;c = c.nextElementSibling) Oj(a,c);}function Pj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c || c[1] && c[1] != a.url)return null;var c=c[2],d=a.b.getElementById(c);!d && a.b.getElementsByName && (d = a.b.getElementsByName(c)[0]);d || (a.f || (a.f = {},Oj(a,a.b.documentElement)),d = a.f[c]);return d;}var Qj={Eg:"text/html",Fg:"text/xml",rg:"application/xml",qg:"application/xhtml_xml",yg:"image/svg+xml"};function Rj(a,b,c){c = c || new DOMParser();var d;try{d = c.parseFromString(a,b);}catch(e) {}if(d){a = d.documentElement;if("parsererror" === a.localName)return null;for(a = a.firstChild;a;a = a.nextSibling) if("parsererror" === a.localName)return null;}else return null;return d;}function Sj(a){var b=a.contentType;if(b){for(var c=Object.keys(Qj),d=0;d < c.length;d++) if(Qj[c[d]] === b)return b;if(b.match(/\+xml$/))return "application/xml";}if(a = a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return "text/html";case "xhtml":case "xht":return "application/xhtml_xml";case "svg":case "svgz":return "image/svg+xml";case "opf":case "xml":return "application/xml";}return null;}function Tj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser(),e=a.responseText;if(e){var f=Sj(a);(c = Rj(e,f || "application/xml",d)) && !f && (f = c.documentElement,"html" !== f.localName.toLowerCase() || f.namespaceURI?"svg" === f.localName.toLowerCase() && "image/svg+xml" !== c.contentType && (c = Rj(e,"image/svg+xml",d)):c = Rj(e,"text/html",d));c || (c = Rj(e,"text/html",d));}}c = c?new Hj(b,a.url,c):null;return K(c);}function Uj(a){this.Cc = a;}function Vj(){var a=Wj;return new Uj(function(b){return a.Cc(b) && 1 == b.nodeType && "http://www.idpf.org/2008/embedding" == b.getAttribute("Algorithm");});}function Xj(){var a=Vj(),b=Wj;return new Uj(function(c){if(!b.Cc(c))return !1;c = new Jj([c]);c = Ij(c,"EncryptionMethod");a && (c = Yj(c,a));return 0 < c.b.length;});}var Wj=new Uj(function(){return !0;});function Jj(a){this.b = a;}function Yj(a,b){for(var c=[],d=0;d < a.b.length;d++) {var e=a.b[d];b.Cc(e) && c.push(e);}return new Jj(c);}function Zj(a,b){function c(a){d.push(a);}for(var d=[],e=0;e < a.b.length;e++) b(a.b[e],c);return new Jj(d);}Jj.prototype.forEach = function(a){for(var b=[],c=0;c < this.b.length;c++) b.push(a(this.b[c]));return b;};function ak(a,b){for(var c=[],d=0;d < a.b.length;d++) {var e=b(a.b[d]);null != e && c.push(e);}return c;}function Ij(a,b){return Zj(a,function(a,d){for(var c=a.firstChild;c;c = c.nextSibling) c.localName == b && d(c);});}function bk(a){return Zj(a,function(a,c){for(var b=a.firstChild;b;b = b.nextSibling) 1 == b.nodeType && c(b);});}function ck(a,b){return ak(a,function(a){return 1 == a.nodeType?a.getAttribute(b):null;});}Jj.prototype.textContent = function(){return this.forEach(function(a){return a.textContent;});};var dk={transform:!0,"transform-origin":!0},ek={top:!0,bottom:!0,left:!0,right:!0};function fk(a,b,c){this.target = a;this.name = b;this.value = c;}var gk={show:function show(a){a.style.visibility = "visible";},hide:function hide(a){a.style.visibility = "hidden";},play:function play(a){a.currentTime = 0;a.play();},pause:function pause(a){a.pause();},resume:function resume(a){a.play();},mute:function mute(a){a.muted = !0;},unmute:function unmute(a){a.muted = !1;}};function hk(a,b){var c=gk[b];return c?function(){for(var b=0;b < a.length;b++) try{c(a[b]);}catch(e) {}}:null;}function ik(a,b){this.h = {};this.L = a;this.g = b;this.O = null;this.A = [];var c=this;this.J = function(a){var b=a.currentTarget,d=b.getAttribute("href") || b.getAttributeNS("http://www.w3.org/1999/xlink","href");d && Va(c,{type:"hyperlink",target:null,currentTarget:null,Jg:b,href:d,preventDefault:function preventDefault(){a.preventDefault();}});};this.b = {};this.f = {width:0,height:0};this.C = this.H = !1;this.F = this.G = !0;this.R = 0;this.position = null;this.offset = -1;this.l = null;this.j = [];this.I = {top:{},bottom:{},left:{},right:{}};}t(ik,Ua);function jk(a,b){(a.G = b)?a.L.setAttribute("data-vivliostyle-auto-page-width",!0):a.L.removeAttribute("data-vivliostyle-auto-page-width");}function kk(a,b){(a.F = b)?a.L.setAttribute("data-vivliostyle-auto-page-height",!0):a.L.removeAttribute("data-vivliostyle-auto-page-height");}function lk(a,b,c){var d=a.b[c];d?d.push(b):a.b[c] = [b];}function mk(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c < b.length;) this.L.contains(b[c])?c++:b.splice(c,1);b.length || delete this.b[a];},a);for(var d=a.A,e=0;e < d.length;e++) {var f=d[e];w(f.target,f.name,f.value.toString());}e = nk(c,a.L);a.f.width = e.width;a.f.height = e.height;for(e = 0;e < b.length;e++) if((c = b[e],f = a.b[c.$c],d = a.b[c.fg],f && d && (f = hk(f,c.action))))for(var g=0;g < d.length;g++) d[g].addEventListener(c.event,f,!1);}ik.prototype.zoom = function(a){w(this.L,"transform","scale(" + a + ")");};function ok(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null;}}function pk(a,b){if(1 == a.nodeType)return !1;var c=a.textContent;switch(b){case 0:return !!c.match(/^\s*$/);case 1:return !!c.match(/^[ \t\f]*$/);case 2:return !c.length;}throw Error("Unexpected whitespace: " + b);}function qk(a){this.f = a;this.b = [];this.D = null;}function rk(a,b,c,d,e,f,g,h,l){this.b = a;this.element = b;this.f = c;this.Ua = d;this.l = e;this.h = f;this.ig = g;this.j = h;this.kb = -1;this.g = l;}function sk(a,b){return a.h?!b.h || a.Ua > b.Ua?!0:a.j:!1;}function tk(a,b){return a.top - b.top;}function uk(a,b){return b.right - a.right;}function vk(_x,_x2){var _left;var _again=true;_function: while(_again) {var a=_x,b=_x2;_again = false;if(a === b){return !0;}else {if(a && b){if(!(_left = a.node === b.node && a.Za === b.Za && wk(a.pa,b.pa) && wk(a.Aa,b.Aa))){return _left;}_x = a.va;_x2 = b.va;_again = true;continue _function;}else {return !1;}}}}function xk(a,b){if(a === b)return !0;if(!a || !b || a.ka !== b.ka || a.K !== b.K || a.ma.length !== b.ma.length)return !1;for(var c=0;c < a.ma.length;c++) if(!vk(a.ma[c],b.ma[c]))return !1;return !0;}function yk(a){return {ma:[{node:a.N,Za:zk,pa:a.pa,Aa:null,va:null,Ka:0}],ka:0,K:!1,Ia:a.Ia};}function Ak(a,b){var c=new Bk(a.node,b,0);c.Za = a.Za;c.pa = a.pa;c.Aa = a.Aa;c.va = a.va?Ak(a.va,Dk(b)):null;c.D = a.D;c.Ka = a.Ka + 1;return c;}var zk=0;function Ek(a,b,c,d,e,f,g){this.la = a;this.Xc = d;this.Ue = null;this.root = b;this.aa = c;this.type = f;e && (e.Ue = this);this.b = g;}function wk(_x3,_x4){var _left2;var _again2=true;_function2: while(_again2) {var a=_x3,b=_x4;_again2 = false;if(_left2 = a === b){return _left2;}if(!(_left2 = !!a && !!b)){return _left2;}if(b){if(!(_left2 = a.la === b.la && a.aa === b.aa && a.type === b.type)){return _left2;}_x3 = a.Xc;_x4 = b.Xc;_again2 = true;continue _function2;}else {return !1;}}}function Fk(a,b){this.gg = a;this.count = b;}function Bk(a,b,c){this.N = a;this.parent = b;this.Ca = c;this.ka = 0;this.K = !1;this.Za = zk;this.pa = b?b.pa:null;this.va = this.Aa = null;this.ra = !1;this.sa = !0;this.b = !1;this.j = b?b.j:0;this.display = null;this.H = Gk;this.Y = this.A = this.za = null;this.W = "baseline";this.ha = "top";this.Sd = this.ia = 0;this.I = !1;this.bc = b?b.bc:0;this.F = b?b.F:null;this.l = b?b.l:!1;this.O = this.Rc = !1;this.C = this.B = this.G = this.g = null;this.wb = b?b.wb:{};this.u = b?b.u:!1;this.wa = b?b.wa:"ltr";this.f = b?b.f:null;this.Ia = this.lang = null;this.D = b?b.D:null;this.h = null;this.na = {};this.Ka = 1;this.T = this.J = null;}function Hk(a){a.sa = !0;a.j = a.parent?a.parent.j:0;a.B = null;a.C = null;a.ka = 0;a.K = !1;a.display = null;a.H = Gk;a.za = null;a.A = null;a.Y = null;a.W = "baseline";a.I = !1;a.bc = a.parent?a.parent.bc:0;a.F = a.parent?a.parent.F:null;a.l = a.parent?a.parent.l:!1;a.g = null;a.G = null;a.Aa = null;a.Rc = !1;a.O = !1;a.u = a.parent?a.parent.u:!1;a.Aa = null;a.Ia = null;a.D = a.parent?a.parent.D:null;a.h = null;a.na = {};a.Ka = 1;a.J = null;a.T = null;}function Ik(a){var b=new Bk(a.N,a.parent,a.Ca);b.ka = a.ka;b.K = a.K;b.Aa = a.Aa;b.Za = a.Za;b.pa = a.pa;b.va = a.va;b.sa = a.sa;b.j = a.j;b.display = a.display;b.H = a.H;b.za = a.za;b.A = a.A;b.Y = a.Y;b.W = a.W;b.ha = a.ha;b.ia = a.ia;b.Sd = a.Sd;b.Rc = a.Rc;b.O = a.O;b.I = a.I;b.bc = a.bc;b.F = a.F;b.l = a.l;b.g = a.g;b.G = a.G;b.B = a.B;b.C = a.C;b.f = a.f;b.u = a.u;b.b = a.b;b.Ia = a.Ia;b.D = a.D;b.h = a.h;b.na = Object.create(a.na);b.Ka = a.Ka;b.J = a.J;b.T = a.T;return b;}Bk.prototype.modify = function(){return this.ra?Ik(this):this;};function Dk(a){var b=a;do {if(b.ra)break;b.ra = !0;b = b.parent;}while(b);return a;}Bk.prototype.clone = function(){for(var a=Ik(this),b=a,c;c = b.parent;) c = Ik(c),b = b.parent = c;return a;};function Jk(a){return {node:a.N,Za:a.Za,pa:a.pa,Aa:a.Aa,va:a.va?Jk(a.va):null,D:a.D,Ka:a.Ka};}function Kk(a){var b=a,c=[];do b.f && b.parent && b.parent.f !== b.f || c.push(Jk(b)),b = b.parent;while(b);b = a.Ia?Lk(a.Ia,a.ka,-1):a.ka;return {ma:c,ka:b,K:a.K,Ia:a.Ia};}function Mk(a){for(a = a.parent;a;) {if(a.Rc)return !0;a = a.parent;}return !1;}function Nk(a,b){for(var c=a;c;) c.sa || b(c),c = c.parent;}function Ok(a,b){return a.D === b && !!a.parent && a.parent.D === b;}function Pk(a){this.f = a;this.b = null;}Pk.prototype.clone = function(){var a=new Pk(this.f);if(this.b){a.b = [];for(var b=0;b < this.b.length;++b) a.b[b] = this.b[b];}return a;};function Qk(a,b){if(!b)return !1;if(a === b)return !0;if(!xk(a.f,b.f))return !1;if(a.b){if(!b.b || a.b.length !== b.b.length)return !1;for(var c=0;c < a.b.length;c++) if(!xk(a.b[c],b.b[c]))return !1;}else if(b.b)return !1;return !0;}function Rk(a,b){this.f = a;this.b = b;}Rk.prototype.clone = function(){return new Rk(this.f.clone(),this.b);};function Sk(){this.b = [];this.g = "any";this.f = null;}Sk.prototype.clone = function(){for(var a=new Sk(),b=this.b,c=a.b,d=0;d < b.length;d++) c[d] = b[d].clone();a.g = this.g;a.f = this.f;return a;};function Tk(a,b){if(a === b)return !0;if(!b || a.b.length !== b.b.length)return !1;for(var c=0;c < a.b.length;c++) {var d=a.b[c],e=b.b[c];if(!e || d !== e && !Qk(d.f,e.f))return !1;}return !0;}function Uk(){this.page = 0;this.f = {};this.b = {};this.g = 0;}Uk.prototype.clone = function(){var a=new Uk();a.page = this.page;a.h = this.h;a.g = this.g;a.j = this.j;a.f = this.f;for(var b in this.b) a.b[b] = this.b[b].clone();return a;};function Vk(a,b){if(a === b)return !0;if(!b || a.page !== b.page || a.g !== b.g)return !1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length !== d.length)return !1;for(d = 0;d < c.length;d++) {var e=c[d];if(!Tk(a.b[e],b.b[e]))return !1;}return !0;}function Wk(a){this.element = a;this.hb = this.gb = this.height = this.width = this.H = this.F = this.I = this.C = this.Y = this.borderTop = this.ha = this.borderLeft = this.marginBottom = this.marginTop = this.marginRight = this.marginLeft = this.top = this.left = 0;this.wa = this.Bc = null;this.na = this.Db = this.Sa = this.Eb = this.ya = 0;this.u = !1;}function Xk(a){return a.marginTop + a.borderTop + a.F;}function Yk(a){return a.marginBottom + a.Y + a.H;}function Zk(a){return a.marginLeft + a.borderLeft + a.C;}function $k(a){return a.marginRight + a.ha + a.I;}function al(a){return a.u?-1:1;}function bl(a,b){a.element = b.element;a.left = b.left;a.top = b.top;a.marginLeft = b.marginLeft;a.marginRight = b.marginRight;a.marginTop = b.marginTop;a.marginBottom = b.marginBottom;a.borderLeft = b.borderLeft;a.ha = b.ha;a.borderTop = b.borderTop;a.Y = b.Y;a.C = b.C;a.I = b.I;a.F = b.F;a.H = b.H;a.width = b.width;a.height = b.height;a.gb = b.gb;a.hb = b.hb;a.wa = b.wa;a.Bc = b.Bc;a.ya = b.ya;a.Eb = b.Eb;a.Sa = b.Sa;a.u = b.u;}function cl(a,b,c){a.top = b;a.height = c;w(a.element,"top",b + "px");w(a.element,"height",c + "px");}function dl(a,b,c){a.left = b;a.width = c;w(a.element,"left",b + "px");w(a.element,"width",c + "px");}function el(a,b,c){a.u?dl(a,b + c * al(a),c):cl(a,b,c);}function fl(a,b,c){a.u?cl(a,b,c):dl(a,b,c);}function gl(a){a = a.element;for(var b;b = a.lastChild;) a.removeChild(b);}function hl(a){var b=a.gb + a.left + a.marginLeft + a.borderLeft,c=a.hb + a.top + a.marginTop + a.borderTop;return new Yf(b,c,b + (a.C + a.width + a.I),c + (a.F + a.height + a.H));}Wk.prototype.$d = function(a,b){var c=il(this);return zg(a,c.U,c.S,c.V - c.U,c.P - c.S,b);};function il(a){var b=a.gb + a.left,c=a.hb + a.top;return new Yf(b,c,b + (Zk(a) + a.width + $k(a)),c + (Xk(a) + a.height + Yk(a)));}function jl(a,b,c){this.b = a;this.f = b;this.g = c;}t(jl,sc);jl.prototype.hd = function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Ic));return null;};jl.prototype.Nc = function(a){if(this.g.url)this.b.setAttribute("src",a.url);else {var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);}return null;};jl.prototype.Ab = function(a){this.$b(a.values);return null;};jl.prototype.Jc = function(a){a = a.ta().evaluate(this.f);"string" === typeof a && this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null;};function kl(a){return !!a && a !== od && a !== H && a !== ed;};function ll(a,b,c){this.g = a;this.f = b;this.b = c;}function ml(){this.map = [];}function nl(a){return a.map.length?a.map[a.map.length - 1].b:0;}function ol(a,b){if(a.map.length){var c=a.map[a.map.length - 1],d=c.b + b - c.f;c.f == c.g?(c.f = b,c.g = b,c.b = d):a.map.push(new ll(b,b,d));}else a.map.push(new ll(b,b,b));}function pl(a,b){a.map.length?a.map[a.map.length - 1].f = b:a.map.push(new ll(b,0,0));}function ql(a,b){var c=Ma(a.map.length,function(c){return b <= a.map[c].f;}),c=a.map[c];return c.b - Math.max(0,c.g - b);}function rl(a,b){var c=Ma(a.map.length,function(c){return b <= a.map[c].b;}),c=a.map[c];return c.g - (c.b - b);}function sl(a,b,c,d,e,f,g,h){this.F = a;this.style = b;this.offset = c;this.G = d;this.j = e;this.b = e.b;this.Wa = f;this.bb = g;this.H = h;this.l = this.A = null;this.C = {};this.g = this.f = this.h = null;tl(this) && (b = b._pseudos) && b.before && (a = new sl(a,b.before,c,!1,e,ul(this),g,!0),c = vl(a,"content"),kl(c) && (this.h = a,this.g = a.g));this.g = wl(xl(this,"before"),this.g);this.bb && yl[this.g] && (e.g = wl(e.g,this.g));}function vl(a,b,c){if(!(b in a.C)){var d=a.style[b];a.C[b] = d?d.evaluate(a.F,b):c || null;}return a.C[b];}function zl(a){return vl(a,"display",fd);}function ul(a){if(null === a.A){var b=zl(a),c=vl(a,"position"),d=vl(a,"float");a.A = Al(b,c,d,a.G).display === Nc;}return a.A;}function tl(a){null === a.l && (a.l = a.H && zl(a) !== H);return a.l;}function xl(a,b){var c=null;if(ul(a)){var d=vl(a,"break-" + b);d && (c = d.toString());}return c;}function Bl(a){this.g = a;this.b = [];this.bb = this.Wa = !0;this.f = [];}function Cl(a){return a.b[a.b.length - 1];}function Dl(a){return a.b.every(function(a){return zl(a) !== H;});}Bl.prototype.push = function(a,b,c,d){var e=Cl(this);d && e && d.b !== e.b && this.f.push({Wa:this.Wa,bb:this.bb});e = d || e.j;d = this.bb || !!d;var f=Dl(this);a = new sl(this.g,a,b,c,e,d || this.Wa,d,f);this.b.push(a);this.Wa = tl(a)?!a.h && ul(a):this.Wa;this.bb = tl(a)?!a.h && d:this.bb;return a;};Bl.prototype.pop = function(a){var b=this.b.pop(),c=this.Wa,d=this.bb;if(tl(b)){var e=b.style._pseudos;e && e.after && (a = new sl(b.F,e.after,a,!1,b.j,c,d,!0),c = vl(a,"content"),kl(c) && (b.f = a));}this.bb && b.f && (a = xl(b.f,"before"),b.j.g = wl(b.j.g,a));if(a = Cl(this))a.b === b.b?tl(b) && (this.Wa = this.bb = !1):(a = this.f.pop(),this.Wa = a.Wa,this.bb = a.bb);return b;};function El(a,b){if(!b.Wa)return b.offset;var c=a.b.length - 1,d=a.b[c];d === b && (c--,d = a.b[c]);for(;0 <= c;) {if(d.b !== b.b)return b.offset;if(!d.Wa || d.G)return d.offset;b = d;d = a.b[--c];}throw Error("No block start offset found!");}function Fl(a,b,c,d,e,f,g,h){this.aa = a;this.root = a.root;this.Sa = c;this.h = d;this.C = f;this.f = this.root;this.T = {};this.W = {};this.G = {};this.I = [];this.F = this.O = this.J = null;this.Y = new Yi(b,d,g,h);this.g = new ml();this.A = !0;this.ia = [];this.Ra = e;this.wa = this.ra = !1;this.b = a = Kj(a,this.root);this.ha = {};this.j = new Bl(d);ol(this.g,a);d = Gl(this,this.root);jj(this.Y,this.root,d,a);Hl(this,d,!1);this.H = !0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H = !1;}this.ia.push(!0);this.W = {};this.W["e" + a] = d;this.b++;Il(this,-1);}function Jl(a,b,c,d){return (b = b[d]) && b.evaluate(a.h) !== c[d];}function Kl(a,b,c){for(var d in c) {var e=b[d];e?(a.T[d] = e,delete b[d]):(e = c[d]) && (a.T[d] = new V(e,33554432));}}var Ll=["column-count","column-width"];function Hl(a,b,c){c || ["writing-mode","direction"].forEach(function(a){b[a] && (this.T[a] = b[a]);},a);if(!a.ra){var d=Jl(a,b,a.C.j,"background-color")?b["background-color"].evaluate(a.h):null,e=Jl(a,b,a.C.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d && d !== ed || e && e !== ed)Kl(a,b,a.C.j),a.ra = !0;}if(!a.wa)for(d = 0;d < Ll.length;d++) if(Jl(a,b,a.C.A,Ll[d])){Kl(a,b,a.C.A);a.wa = !0;break;}if(!c && (c = b["font-size"])){d = c.evaluate(a.h);c = d.M;switch(d.ga){case "em":case "rem":c *= a.h.A;break;case "ex":case "rex":c *= a.h.A * Bb.ex / Bb.em;break;case "%":c *= a.h.A / 100;break;default:(d = Bb[d.ga]) && (c *= d);}a.h.na = c;}}function Ml(a){for(var b=0;!a.H && (b += 5E3,Nl(a,b,0) != Number.POSITIVE_INFINITY););return a.T;}function Gl(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.aa.url,e=new wj(a.Sa,a.C),c=new af(c,e);try{Pf(new Gf(vf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1);}catch(f) {v.b(f,"Style attribute parse error:");}return e.ab;}}return {};}function Il(a,b){if(!(b >= a.b)){var c=a.h,d=Kj(a.aa,a.root);if(b < d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=Ol(a,f,e,a.root,d);!a.j.b.length && a.j.push(e,d,!0,f);}d = Nj(a.aa,b);e = Lj(a.aa,d,0,!1);if(!(e >= a.b))for(;;) {if(1 != d.nodeType)e += d.textContent.length;else {var g=d;if(e != Kj(a.aa,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f = h["flow-into"])f = f.evaluate(c,"flow-into").toString(),Ol(a,f,h,g,e);e++;}if(e >= a.b)break;f = d.firstChild;if(!f)for(;!(f = d.nextSibling);) if((d = d.parentNode,d === a.root))return;d = f;}}}function Pl(a,b){a.J = b;for(var c=0;c < a.I.length;c++) Ql(a.J,a.I[c],a.G[a.I[c].b]);}function Ol(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a: {if(h = m.evaluate(a.h,"flow-options")){l = new vg();try{h.ba(l);p = l.b;break a;}catch(q) {v.b(q,"toSet:");}}p = {};}h = !!p.exclusive;l = !!p["static"];k = !!p.last;}(p = c["flow-linger"]) && (g = xg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c = c["flow-priority"]) && (f = xg(c.evaluate(a.h,"flow-priority"),0));c = a.ha[e] || null;p = a.G[b];p || (p = Cl(a.j),p = a.G[b] = new qk(p?p.j.b:null));d = new rk(b,d,e,f,g,h,l,k,c);a.I.push(d);a.O == b && (a.O = null);a.J && Ql(a.J,d,p);return d;}function Rl(a,b,c,d){yl[b] && (d = a.G[d].b,(!d.length || d[d.length - 1] < c) && d.push(c));a.ha[c] = wl(a.ha[c],b);}function Nl(a,b,c){var d=-1;if(b <= a.b && (d = ql(a.g,b),d += c,d < nl(a.g)))return rl(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;) {var f=a.f.firstChild;if(!f)for(;;) {if(1 == a.f.nodeType){var f=a.Y,g=a.f;if(f.Eb.pop() !== g)throw Error("Invalid call to popElement");f.wc.pop();f.na.pop();f.vc.pop();f.uc.pop();f.pop();hj(f);a.A = a.ia.pop();g = a.j.pop(a.b);f = null;g.f && (f = xl(g.f,"before"),Rl(a,f,g.f.Wa?El(a.j,g):g.f.offset,g.b),f = xl(g.f,"after"));f = wl(f,xl(g,"after"));Rl(a,f,a.b,g.b);}if(f = a.f.nextSibling)break;a.f = a.f.parentNode;if(a.f === a.root)return a.f = null,b < a.b && (0 > d && (d = ql(a.g,b),d += c),d <= nl(a.g))?rl(a.g,d):Number.POSITIVE_INFINITY;}a.f = f;if(1 != a.f.nodeType){a.b += a.f.textContent.length;var f=a.j,g=a.f,h=Cl(f);(f.Wa || f.bb) && tl(h) && (h = vl(h,"white-space",od).toString(),pk(g,ok(h)) || (f.Wa = !1,f.bb = !1));a.A?ol(a.g,a.b):pl(a.g,a.b);}else {g = a.f;f = Gl(a,g);a.ia.push(a.A);jj(a.Y,g,f,a.b);(h = g.getAttribute("id") || g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id")) && h === a.F && (a.F = null);a.H || "body" != g.localName || g.parentNode != a.root || (Hl(a,f,!0),a.H = !0);if(h = f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=Ol(a,h,f,g,a.b);a.A = !!a.Ra[h];g = a.j.push(f,a.b,g === a.root,l);}else g = a.j.push(f,a.b,g === a.root);h = El(a.j,g);Rl(a,g.g,h,g.b);g.h && (l = xl(g.h,"after"),Rl(a,l,g.h.Wa?h:g.offset,g.b));a.A && zl(g) === H && (a.A = !1);if(Kj(a.aa,a.f) != a.b)throw Error("Inconsistent offset");a.W["e" + a.b] = f;a.b++;a.A?ol(a.g,a.b):pl(a.g,a.b);if(b < a.b && (0 > d && (d = ql(a.g,b),d += c),d <= nl(a.g)))return rl(a.g,d);}}}Fl.prototype.l = function(a,b){var c=Kj(this.aa,a),d="e" + c;b && (c = Lj(this.aa,a,0,!0));this.b <= c && Nl(this,c,0);return this.W[d];};Fl.prototype.na = function(){};var Sl={"font-style":od,"font-variant":od,"font-weight":od},Tl="OTTO" + new Date().valueOf(),Ul=1;function Vl(a,b){var c={},d;for(d in a) c[d] = a[d].evaluate(b,d);for(var e in Sl) c[e] || (c[e] = Sl[e]);return c;}function Wl(a){a = this.nc = a;var b=new Ca(),c;for(c in Sl) b.append(" "),b.append(a[c].toString());this.f = b.toString();this.src = this.nc.src?this.nc.src.toString():null;this.g = [];this.h = [];this.b = (c = this.nc["font-family"])?c.stringValue():null;}function Xl(a,b,c){var d=new Ca();d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in Sl) d.append(e),d.append(": "),a.nc[e].Ta(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b = (window.URL || window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString();}function Yl(a){this.f = a;this.b = {};}function Zl(a,b){if(b instanceof vc){for(var c=b.values,d=[],e=0;e < c.length;e++) {var f=c[e],g=a.b[f.stringValue()];g && d.push(C(g));d.push(f);}return new vc(d);}return (c = a.b[b.stringValue()])?new vc([C(c),b]):b;}function $l(a,b){this.b = a;this.body = b;this.f = {};this.g = 0;}function am(a,b,c){b = b.b;var d=c.b[b];if(d)return d;d = "Fnt_" + ++a.g;return c.b[b] = d;}function bm(a,b,c,d){var e=J("initFont"),f=b.src,g={},h;for(h in Sl) g[h] = b.nc[h];d = am(a,b,d);g["font-family"] = C(d);var l=new Wl(g),k=a.body.ownerDocument.createElement("span");k.textContent = "M";var m=new Date().valueOf() + 1E3;b = a.b.ownerDocument.createElement("style");h = Tl + Ul++;b.textContent = Xl(l,"",ef([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility = "hidden";k.style.fontFamily = d;for(var p in Sl) w(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right - g.left,r=g.bottom - g.top;b.textContent = Xl(l,f,c);v.g("Starting to load font:",f);var z=!1;oe(function(){var a=k.getBoundingClientRect(),b=a.bottom - a.top;return q != a.right - a.left || r != b?(z = !0,K(!1)):new Date().valueOf() > m?K(!1):ne(10);}).then(function(){z?v.g("Loaded font:",f):v.b("Failed to load font:",f);a.body.removeChild(k);M(e,l);});return e.result();}function cm(a,b,c){var d=b.src,e=a.f[d];e?se(e,function(a){if(a.f == b.f){var e=b.b,f=c.b[e];a = a.b;if(f){if(f != a)throw Error("E_FONT_FAMILY_INCONSISTENT " + b.b);}else c.b[e] = a;v.b("Found already-loaded font:",d);}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src);}):(e = new re(function(){var e=J("loadFont"),g=c.f?c.f(d):null;g?df(d,"blob").then(function(d){d.Dd?g(d.Dd).then(function(d){bm(a,b,d,c).Da(e);}):M(e,null);}):bm(a,b,null,c).Da(e);return e.result();},"loadFont " + d),a.f[d] = e,e.start());return e;}function dm(a,b,c){for(var d=[],e=0;e < b.length;e++) {var f=b[e];f.src && f.b?d.push(cm(a,f,c)):v.b("E_FONT_FACE_INVALID");}return te(d);};Rd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return {name:b.replace(/^page-/,""),value:c === Lc?rd:c,important:a.important};default:return a;}});var yl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},em={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};function wl(a,b){if(a)if(b){var c=!!yl[a],d=!!yl[b];if(c && d)switch(b){case "column":return a;case "region":return "column" === a?b:a;default:return b;}else return d?b:c?a:em[b]?b:em[a]?a:b;}else return a;else return b;}function fm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return "any";}};function gm(){}n = gm.prototype;n.xf = function(a){return {w:a,od:!1,Fb:!1};};n.Te = function(){};n.af = function(){};n.Kf = function(){};n.$e = function(){};n.jd = function(){};n.ac = function(){};function hm(a,b){this.b = a;this.f = b;}function im(a,b){var c=a.b,d=c.xf(b),e=J("LayoutIterator");pe((function(a){for(var b;d.w;) {b = d.w.B?1 !== d.w.B.nodeType?pk(d.w.B,d.w.bc)?void 0:d.w.K?c.af(d):c.Te(d):d.w.sa?d.w.K?c.$e(d):c.Kf(d):d.w.K?c.ac(d):c.jd(d):void 0;b = (b && b.Pa()?b:K(!0)).fa((function(){return d.Fb?K(null):jm(this.f,d.w,d.od);}).bind(this));if(b.Pa()){b.then(function(b){d.Fb?O(a):(d.w = b,N(a));});return;}if(d.Fb){O(a);return;}d.w = b.get();}O(a);}).bind(a)).then(function(){M(e,d.w);});return e.result();}function km(a){this.Rb = a;}t(km,gm);n = km.prototype;n.Lf = function(){};n.mf = function(){};n.xf = function(a){return {w:a,od:!!this.Rb && a.K,Fb:!1,Rb:this.Rb,Ac:null,je:!1,Cf:[],Dc:null};};n.Te = function(a){a.je = !1;};n.jd = function(a){a.Cf.push(Dk(a.w));a.Ac = wl(a.Ac,a.w.g);a.je = !0;return this.Lf(a);};n.ac = function(a){var b;a.je?(b = (b = void 0,K(!0)),b = b.fa(function(){a.Fb || (a.Cf = [],a.Rb = !1,a.od = !1,a.Ac = null);return K(!0);})):b = (b = this.mf(a)) && b.Pa()?b:K(!0);return b.fa(function(){a.Fb || (a.je = !1,a.Dc = Dk(a.w),a.Ac = wl(a.Ac,a.w.G));return K(!0);});};function lm(a,b,c){this.Se = [];this.b = Object.create(a);this.b.element = b;this.b.j = a.j.clone();this.b.h = !1;this.b.Be = c.D;this.b.Cb = a;a = mm(this.b,c);this.b.O -= a;var d=this;this.b.tb = function(a){return nm.prototype.tb.call(this,a).fa(function(a){d.Se.push(Dk(a));return K(a);});};}function om(a,b){return pm(a.b,b,!0);}lm.prototype.Pb = function(a){var b=this.b.Pb();if(a){a = Dk(this.Se[0]);var c=new qm(a,null,a.b,0);c.f(this.b,0);if(!b.w)return {Gb:c,w:a};}return b;};lm.prototype.Fa = function(a,b,c){return this.b.Fa(a,b,c);};function rm(){this.H = this.C = null;}function sm(a,b,c){a.I(b,c);return tm(a,b,c);}function tm(a,b,c){var d=J("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.l(b,c);var e=a.j(b);e.b(b,c).then((function(a){var f=e.f(a,c);(f = e.g(a,this.h,c,f))?M(d,a):(this.g(this.h),this.f(b,c),tm(this,this.h,c).Da(d));}).bind(a));return d.result();}rm.prototype.I = function(){};rm.prototype.g = function(a){a = a.B || a.parent.B;for(var b;b = a.lastChild;) a.removeChild(b);for(;b = a.nextSibling;) b.parentNode.removeChild(b);};rm.prototype.l = function(a,b){this.h = Dk(a);this.C = [].concat(b.G);this.O = [].concat(b.l);a.D && (this.H = a.D.ye());};rm.prototype.f = function(a,b){b.G = this.C;b.l = this.O;a.D && a.D.xe(this.H);};function um(a,b,c,d){d = d[b];if(!d)throw Error("unknown writing-mode: " + b);b = d[c || "ltr"];if(!b)throw Error("unknown direction: " + c);for(c = 0;c < b.length;c++) if((d = b[c],d = a.replace(d.h,d.b),d !== a))return d;return a;}function vm(a){var b=wm,c={};Object.keys(b).forEach(function(d){var e=c[d] = {},f=b[d];Object.keys(f).forEach(function(b){e[b] = f[b].map(function(b){return {h:new RegExp("(-?)" + (a?b.ca:b.da) + "(-?)"),b:"$1" + (a?b.da:b.ca) + "$2"};});});});return c;}var wm={"horizontal-tb":{ltr:[{ca:"inline-start",da:"left"},{ca:"inline-end",da:"right"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}],rtl:[{ca:"inline-start",da:"right"},{ca:"inline-end",da:"left"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}]},"vertical-rl":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"right"},{ca:"block-end",da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",da:"top"},{ca:"block-start",da:"right"},{ca:"block-end",da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]},"vertical-lr":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",da:"top"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]}},xm=vm(!0),ym=vm(!1);var Gk="inline";function zm(a){switch(a){case "inline":return Gk;case "column":return "column";case "region":return "region";case "page":return "page";default:throw Error("Unknown float-reference: " + a);}}function Am(a){switch(a){case Gk:return !1;case "column":case "region":case "page":return !0;default:throw Error("Unknown float-reference: " + a);}}function Bm(a,b,c,d){this.f = a;this.b = b;this.za = c;this.g = d;this.id = this.order = null;}Bm.prototype.Ga = function(){if(null === this.order)throw Error("The page float is not yet added");return this.order;};function Cm(a){if(!a.id)throw Error("The page float is not yet added");return a.id;}Bm.prototype.He = function(){return !1;};function Dm(){this.b = [];this.f = 0;}Dm.prototype.Ne = function(){return this.f++;};Dm.prototype.Qd = function(a){if(0 <= this.b.findIndex(function(b){return xk(b.f,a.f);}))throw Error("A page float with the same source node is already registered");var b=a.order = this.Ne();a.id = "pf" + b;this.b.push(a);};Dm.prototype.Fe = function(a){var b=this.b.findIndex(function(b){return xk(b.f,a);});return 0 <= b?this.b[b]:null;};function Em(a,b,c,d){this.f = a;this.za = b;this.Mb = c;this.dc = d;}function Fm(a,b){return a.Mb.some(function(a){return a.qa === b;});}function Gm(a,b){for(var c=a.Mb.length - 1;0 <= c;c--) {var d=a.Mb[c].qa;if(!Hm(b,Cm(d)))return d;}return null;}Em.prototype.$d = function(){return this.dc.$d(null,null);};Em.prototype.Ga = function(){var a=this.Mb.map(function(a){return a.qa;});return Math.min.apply(null,a.map(function(a){return a.Ga();}));};Em.prototype.b = function(a){return this.Ga() < a.Ga();};function Im(a,b){this.qa = a;this.b = b;}function Jm(a,b,c,d,e,f,g){(this.parent = a) && a.h.push(this);this.h = [];this.f = b;this.L = c;this.j = d;this.O = e;this.I = f || a && a.I || dd;this.H = g || a && a.H || nd;this.Uc = !1;this.C = a?a.C:new Dm();this.F = [];this.b = [];this.l = [];this.A = {};this.g = [];a: {b = this;for(a = this.parent;a;) {if(b = Km(a,b,this.f,this.j,this.O)){a = b;break a;}b = a;a = a.parent;}a = null;}this.J = a?[].concat(a.g):[];this.G = [];}function Lm(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for " + b);return a.parent;}function Km(a,b,c,d,e){b = a.h.indexOf(b);0 > b && (b = a.h.length);for(--b;0 <= b;b--) {var f=a.h[b];if(f.f === c && f.j === d && xk(f.O,e) || (f = Km(f,null,c,d,e)))return f;}return null;}function Mm(_x5,_x6){var _again3=true;_function3: while(_again3) {var a=_x5,b=_x6;_again3 = false;if(b && b !== a.f){_x5 = Lm(a,b);_x6 = b;_again3 = true;continue _function3;}else {return a.L;}}}function Nm(a,b){a.L = b;Om(a);}Jm.prototype.Qd = function(a){this.C.Qd(a);};function Pm(_x7,_x8){var _again4=true;_function4: while(_again4) {var a=_x7,b=_x8;_again4 = false;if(b === a.f){return a;}else {_x7 = Lm(a,b);_x8 = b;_again4 = true;continue _function4;}}}Jm.prototype.Fe = function(a){return this.C.Fe(a);};function Qm(a,b){var c=Cm(b),d=b.b;d === a.f?0 > a.F.indexOf(c) && (a.F.push(c),Rm(b).Of(b,a)):Qm(Lm(a,d),b);}function Sm(_x9,_x10){var _again5=true;_function5: while(_again5) {var a=_x9,b=_x10;_again5 = false;var c=Cm(b),d=b.b;if(d === a.f){return 0 <= a.F.indexOf(c);}else {_x9 = Lm(a,d);_x10 = b;_again5 = true;c = d = undefined;continue _function5;}}}function Tm(a,b,c){var d=b.f;d !== a.f?Tm(Lm(a,d),b,c):0 > a.b.indexOf(b) && (a.b.push(b),a.b.sort(function(a,b){return a.Ga() - b.Ga();}));c || Um(a);}function Vm(a,b,c){var d=b.f;d !== a.f?Vm(Lm(a,d),b,c):(b = a.b.indexOf(b),0 <= b && (b = a.b.splice(b,1)[0],(b = b.dc && b.dc.element) && b.parentNode && b.parentNode.removeChild(b),c || Um(a)));}function Wm(_x11,_x12){var _again6=true;_function6: while(_again6) {var a=_x11,b=_x12;_again6 = false;if(b.b !== a.f){_x11 = Lm(a,b.b);_x12 = b;_again6 = true;continue _function6;}var c=a.b.findIndex(function(a){return Fm(a,b);});return 0 <= c?a.b[c]:null;}}function Xm(_x13){var _again7=true;_function7: while(_again7) {var a=_x13;_again7 = false;if(0 < a.b.length){return !0;}else {if(a.parent){_x13 = a.parent;_again7 = true;continue _function7;}else {return !1;}}}}function Ym(a,b,c){b.b === a.f?a.A[Cm(b)] = c:Ym(Lm(a,b.b),b,c);}function Hm(a,b){if(Zm(a).some(function(a){return Cm(a.qa) === b;}))return !0;var c=a.A[b];return c?a.L && a.L.element?a.L.element.contains(c):!1:!1;}function $m(a,b){var c=b.qa;if(c.b === a.f){var d=a.g.findIndex(function(a){return a.qa === c;});0 <= d?a.g.splice(d,1,b):a.g.push(b);}else $m(Lm(a,c.b),b);}function an(_x14,_x15,_x16){var _again8=true;_function8: while(_again8) {var a=_x14,b=_x15,c=_x16;_again8 = false;if(!c && b.b !== a.f){_x14 = Lm(a,b.b);_x15 = b;_x16 = !1;_again8 = true;continue _function8;}var d=b.Ga();if(a.g.some(function(a){return a.qa.Ga() < d && !b.He(a.qa);})){return !0;}else {if(a.parent){_x14 = a.parent;_x15 = b;_x16 = !0;_again8 = true;d = undefined;continue _function8;}else {return !1;}}}}function Zm(a,b){b = b || a.j;var c=a.J.filter(function(a){return !b || a.qa.g === b;});a.parent && (c = Zm(a.parent,b).concat(c));return c.sort(function(a,b){return a.qa.Ga() - b.qa.Ga();});}function bn(a,b){b = b || a.j;var c=a.g.filter(function(a){return !b || a.qa.g === b;});return a.parent?bn(a.parent,b).concat(c):c;}function cn(a){for(var b=[],c=[],d=a.h.length - 1;0 <= d;d--) {var e=a.h[d];0 <= c.indexOf(e.j) || (c.push(e.j),b = b.concat(e.g.map(function(a){return a.qa;})),b = b.concat(cn(e)));}return b;}function dn(a){var b=cn(a),c=a.b.reduce(function(a,b){return a.concat(b.Mb.map(function(a){return a.qa;}));},[]);c.sort(function(a,b){return b.Ga() - a.Ga();});for(var d=0;d < c.length;d++) {var e=c[d],f=e.Ga();if(b.some(function(a){return !e.He(a) && f > a.Ga();}))return Qm(a,e),b = Wm(a,e),Vm(a,b),!0;}return !1;}function en(a){if(!dn(a)){for(var b=a.b.length - 1;0 <= b;b--) {var c=a.b[b],d=Gm(c,a);if(d){Vm(a,c);Qm(a,d);fn(a,c.za);return;}}for(b = a.g.length - 1;0 <= b;b--) Hm(a,Cm(a.g[b].qa)) || a.g.splice(b,1);a.J.forEach(function(a){0 <= this.g.findIndex(function(b){return b?a === b?!0:a.qa === b.qa && xk(a.b,b.b):!1;}) || this.b.some(function(b){return Fm(b,a.qa);}) || this.g.push(a);},a);}}function gn(a,b){return !!a.L && !!b.L && a.L.element === b.L.element;}function Um(a){a.L && (a.h.forEach(function(a){gn(this,a) && a.b.forEach(function(a){(a = a.dc.element) && a.parentNode && a.parentNode.removeChild(a);});},a),gl(a.L));a.h.forEach(function(a){a.G.splice(0);});a.h.splice(0);Object.keys(a.A).forEach(function(a){delete this.A[a];},a);a.Uc = !0;}function hn(_x17){var _left3;var _again9=true;_function9: while(_again9) {var a=_x17;_again9 = false;if(_left3 = a.Uc){return _left3;}if(!(_left3 = !!a.parent)){return _left3;}_x17 = a.parent;_again9 = true;continue _function9;}}function jn(a,b){return um(b,a.I.toString(),a.H.toString() || null,ym);}function fn(a,b){var c=jn(a,b);if("block-end" === c || "inline-end" === c)for(var d=0;d < a.b.length;) {var e=a.b[d];jn(a,e.za) === c?Vm(a,e):d++;}}function kn(a,b){var c=b.b;if(c !== a.f)kn(Lm(a,c),b);else if((c = jn(a,b.za),"block-end" === c || "snap-block" === c || "inline-end" === c))for(var d=0;d < a.b.length;) {var e=a.b[d],f=jn(a,e.za);(f === c || "snap-block" === c && "block-end" === f) && e.b(b)?(a.l.push(e),a.b.splice(d,1)):d++;}}function ln(a,b){b !== a.f?ln(Lm(a,b),b):(a.l.forEach(function(a){Tm(this,a,!0);},a),a.l.splice(0));}function mn(a,b){b !== a.f?mn(Lm(a,b),b):a.l.splice(0);}function nn(_x18,_x19){var _again10=true;_function10: while(_again10) {var a=_x18,b=_x19;_again10 = false;if(b === a.f){return a.l.concat().sort(function(a,b){return b.Ga() - a.Ga();});}else {_x18 = Lm(a,b);_x19 = b;_again10 = true;continue _function10;}}}function on(a,b,c){var d=jn(a,b);b = um(b,a.I.toString(),a.H.toString() || null,xm);d = pn(a,d,c);if(a.parent && a.parent.L)switch((a = on(a.parent,b,c),b)){case "top":return Math.max(d,a);case "left":return Math.max(d,a);case "bottom":return Math.min(d,a);case "right":return Math.min(d,a);default:fa("Should be unreachable");}return d;}function pn(a,b,c){var d=a.L.gb,e=a.L.hb,f=hl(a.L),f={top:f.S - e,left:f.U - d,bottom:f.P - e,right:f.V - d},g=a.b;0 < g.length && (f = g.reduce((function(a,b){if(c && !c(b,this))return a;var d=jn(this,b.za),e=b.dc,f=a.top,g=a.left,h=a.bottom,l=a.right;switch(d){case "inline-start":e.u?f = Math.max(f,e.top + e.height):g = Math.max(g,e.left + e.width);break;case "block-start":e.u?l = Math.min(l,e.left):f = Math.max(f,e.top + e.height);break;case "inline-end":e.u?h = Math.min(h,e.top):l = Math.min(l,e.left);break;case "block-end":e.u?g = Math.max(g,e.left + e.width):h = Math.min(h,e.top);break;default:throw Error("Unknown logical float side: " + d);}return {top:f,left:g,bottom:h,right:l};}).bind(a),f));f.left += d;f.right += d;f.top += e;f.bottom += e;switch(b){case "block-start":return a.L.u?f.right:f.top;case "block-end":return a.L.u?f.left:f.bottom;case "inline-start":return a.L.u?f.top:f.left;case "inline-end":return a.L.u?f.bottom:f.right;default:throw Error("Unknown logical side: " + b);}}function qn(_x20,_x21,_x22,_x23,_x24,_x25,_x26){var _again11=true;_function11: while(_again11) {var a=_x20,b=_x21,c=_x22,d=_x23,e=_x24,f=_x25,g=_x26;var h=function h(a,c){var d=a(b.ra,c);return d?(b.u && (d = new Yf(-d.P,d.U,-d.S,d.V)),k = b.u?Math.min(k,d.V):Math.max(k,d.S),m = b.u?Math.max(m,d.U):Math.min(m,d.P),!0):g;};_again11 = false;if(c !== a.f){_x20 = Lm(a,c);_x21 = b;_x22 = c;_x23 = d;_x24 = e;_x25 = f;_x26 = g;_again11 = true;continue _function11;}var l=jn(a,d),k=on(a,"block-start"),m=on(a,"block-end");c = on(a,"inline-start");var p=on(a,"inline-end"),q=b.u?b.gb:b.hb,r=b.u?b.hb:b.gb,k=b.u?Math.min(k,b.left + Zk(b) + b.width + $k(b) + q):Math.max(k,b.top + q),m=b.u?Math.max(m,b.left + q):Math.min(m,b.top + Xk(b) + b.height + Yk(b) + q),z;if(f){a = b.u?og(new Yf(m,c,k,p)):new Yf(c,k,p,m);if(("block-start" === l || "snap-block" === l || "inline-start" === l) && !h(tg,a) || ("block-end" === l || "snap-block" === l || "inline-end" === l) && !h(ug,a))return null;z = (m - k) * al(b);f = z - (b.u?$k(b):Xk(b)) - (b.u?Zk(b):Yk(b));e = p - c;a = e - (b.u?Xk(b):Zk(b)) - (b.u?Yk(b):$k(b));if(!g && (0 >= f || 0 >= a))return null;}else {f = b.ya;z = f + (b.u?$k(b):Xk(b)) + (b.u?Zk(b):Yk(b));var u=(m - k) * al(b);"snap-block" === l && (null === e?l = "block-start":(l = hl(a.L),l = al(a.L) * (e - (a.L.u?l.V:l.S)) <= al(a.L) * ((a.L.u?l.U:l.P) - e - z)?"block-start":"block-end"));if(!g && u < z)return null;a = "inline-start" === l || "inline-end" === l?rn(b.f,b.element,[sn])[sn]:b.vc?tn(b):b.u?b.height:b.width;e = a + (b.u?Xk(b):Zk(b)) + (b.u?Yk(b):$k(b));if(!g && p - c < e)return null;}k -= q;m -= q;c -= r;p -= r;switch(l){case "inline-start":case "block-start":case "snap-block":fl(b,c,a);el(b,k,f);break;case "inline-end":case "block-end":fl(b,p - e,a);el(b,m - z * al(b),f);break;default:throw Error("unknown float direction: " + d);}return l;}}function un(a){var b=a.b.map(function(a){return a.$d();});return a.parent?un(a.parent).concat(b):b;}function Om(a){var b=a.L.element && a.L.element.parentNode;b && a.b.forEach(function(a){b.appendChild(a.dc.element);});}function vn(a){var b=Mm(a).u;return a.b.reduce(function(a,d){var c=il(d.dc);return b?Math.min(a,c.U):Math.max(a,c.P);},b?Infinity:0);}function wn(a,b){function c(a){return function(b){return Hm(a,Cm(b.qa));};}function d(a,b){return a.Mb.some(c(b));}for(var e=hl(b),e=b.u?e.U:e.P,f=a;f;) {if(f.g.some(c(f)))return e;f = f.parent;}f = on(a,"block-start",d);return on(a,"block-end",d) * al(b) < e * al(b)?e:f;}function xn(a){return (a.parent?xn(a.parent):[]).concat(a.G);}function yn(a,b,c){c === a.f?a.G.push(b):yn(Lm(a,c),b,c);}var zn=[];function An(a){for(var b=zn.length - 1;0 <= b;b--) {var c=zn[b];if(c.cf(a))return c;}throw Error("No PageFloatLayoutStrategy found for " + a);}function Rm(a){for(var b=zn.length - 1;0 <= b;b--) {var c=zn[b];if(c.bf(a))return c;}throw Error("No PageFloatLayoutStrategy found for " + a);}function Bn(){}n = Bn.prototype;n.cf = function(a){return Am(a.H);};n.bf = function(){return !0;};n.jf = function(a,b,c){var d=a.H,e=a.za,f=Kk(a);return Cn(c,d,a.Y,a).fa(function(a){d = a;a = new Bm(f,d,e,b.j);b.Qd(a);return K(a);});};n.kf = function(a,b,c){return new Em(a[0].qa.b,b,a,c);};n.We = function(a,b){return Wm(b,a);};n.Ze = function(){};n.Of = function(){};zn.push(new Bn());var Dn={img:!0,svg:!0,audio:!0,video:!0};function En(a,b,c,d){var e=a.B;if(!e)return NaN;if(1 == e.nodeType){if(a.K){var f=nk(b,e);if(f.right >= f.left && f.bottom >= f.top)return d?f.left:f.bottom;}return NaN;}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K && (c += h);c >= h && (c = h - 1);g.setStart(e,c);g.setEnd(e,c + 1);a = Fn(b,g);if(c = d){c = document.body;if(null == Wa){var l=c.ownerDocument,g=l.createElement("div");g.style.position = "absolute";g.style.top = "0px";g.style.left = "0px";g.style.width = "100px";g.style.height = "100px";g.style.overflow = "hidden";g.style.lineHeight = "16px";g.style.fontSize = "16px";w(g,"writing-mode","vertical-rl");c.appendChild(g);h = l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l = l.createRange();l.setStart(h,0);l.setEnd(h,1);h = l.getBoundingClientRect();Wa = 10 > h.right - h.left;c.removeChild(g);}c = Wa;}if(c){c = e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b = Fn(b,c);e = [];for(c = 0;c < a.length;c++) {g = a[c];for(h = 0;h < b.length;h++) if((l = b[h],g.top >= l.top && g.bottom <= l.bottom && 1 > Math.abs(g.left - l.left))){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break;}h == b.length && (v.b("Could not fix character box"),e.push(g));}a = e;}for(e = b = 0;e < a.length;e++) c = a[e],g = d?c.bottom - c.top:c.right - c.left,c.right > c.left && c.bottom > c.top && (isNaN(f) || g > b) && (f = d?c.left:c.bottom,b = g);return f;}function Gn(a){for(var b=Sd("RESOLVE_LAYOUT_PROCESSOR"),c=0;c < b.length;c++) {var d=b[c](a);if(d)return d;}throw Error("No processor found for a formatting context: " + a.we());}function Hn(a){this.rd = a;}Hn.prototype.ub = function(a){return this.rd.every(function(b){return b.ub(a);});};function In(){}In.prototype.g = function(){return null;};function Jn(a,b){return {current:b.reduce(function(b,d){return b + d.b(a);},0),he:b.reduce(function(b,d){return b + d.G(a);},0)};}function Kn(a,b){this.h = a;this.A = b;this.j = !1;this.l = null;}t(Kn,In);Kn.prototype.f = function(a,b){if(b < this.b())return null;this.j || (this.l = Ln(a,this,0 < b),this.j = !0);return this.l;};Kn.prototype.b = function(){return this.A;};Kn.prototype.g = function(){return this.j?this.l:this.h[this.h.length - 1];};function qm(a,b,c,d){this.position = a;this.C = b;this.l = this.A = c;this.ya = d;this.h = !1;this.hc = 0;}t(qm,In);qm.prototype.f = function(a,b){this.h || (this.hc = En(this.position,a.f,0,a.u),this.h = !0);var c=this.hc,d=Jn(this.g(),Mn(a));this.l = Nn(a,c + (a.u?-1:1) * d.he);this.A = this.position.b = Nn(a,c + (a.u?-1:1) * d.current);b < this.b()?c = null:(a.ya = this.ya + On(a,this),c = this.position);return c;};qm.prototype.b = function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a = this.g()) && a.parent){var b=Pn(a.parent);a = b?(b = b.b)?a && b.g === a.N:!1:!1;}else a = !1;a = a && !this.l;return (em[this.C]?1:0) + (this.A && !a?3:0) + (this.position.parent?this.position.parent.j:0);};qm.prototype.g = function(){return this.position;};function Qn(a){for(var b=1;b < a.length;b++) {var c=a[b - 1],d=a[b];c === d?v.b("validateCheckPoints: duplicate entry"):c.Ca >= d.Ca?v.b("validateCheckPoints: incorrect boxOffset"):c.N == d.N && (d.K?c.K && v.b("validateCheckPoints: duplicate after points"):c.K || d.Ca - c.Ca != d.ka - c.ka && v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"));}}function Rn(a){this.parent = a;}Rn.prototype.we = function(){return "Block formatting context (adapt.layout.BlockFormattingContext)";};Rn.prototype.Je = function(a,b){return b;};Rn.prototype.ye = function(){};Rn.prototype.xe = function(){};function nm(a,b,c,d,e){Wk.call(this,a);this.j = b;this.f = c;this.sb = d;this.Yf = a.ownerDocument;this.g = e;Nm(e,this);this.Be = null;this.lf = this.uf = !1;this.O = this.J = this.A = this.ia = this.W = 0;this.ra = this.rf = this.nf = null;this.Bb = !1;this.b = this.G = null;this.wc = !0;this.uc = this.Td = this.Oc = 0;this.h = !0;this.Ra = null;this.l = [];this.T = this.Cb = null;}t(nm,Wk);function Sn(a,b){return !!b.za && (!a.uf || !!b.parent);}function Nn(a,b){return a.u?b < a.O:b > a.O;}nm.prototype.tb = function(a){var b=this,c=J("openAllViews"),d=a.ma;Tn(b.j,b.element,b.lf);var e=d.length - 1,f=null;oe(function(){for(;0 <= e;) {f = Ak(d[e],f);e !== d.length - 1 || f.D || (f.D = b.Be);if(!e){var c=f,h;h = a;h = h.Ia?Lk(h.Ia,h.ka,1):h.ka;c.ka = h;f.K = a.K;f.Ia = a.Ia;if(f.K)break;}c = Un(b.j,f,!e && !f.ka);e--;if(c.Pa())return c;}return K(!1);}).then(function(){M(c,f);});return c.result();};var Vn=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;function Wn(a,b){if(b.f && b.sa && !b.K && !b.f.count && 1 != b.B.nodeType){var c=b.B.textContent.match(Vn);return Xn(a.j,b,c[0].length);}return K(b);}function Yn(a,b,c){var d=!1,e=J("buildViewToNextBlockEdge");pe(function(e){b.B && !Zn(b) && c.push(Dk(b));Wn(a,b).then(function(f){f !== b && (b = f,Zn(b) || c.push(Dk(b)));$n(a,b).then(function(c){if(b = c){if(d || !a.sb.ub(b))d = !0,b = b.modify(),b.b = !0;Sn(a,b) && !a.u?ao(a,b).then(function(c){b = c;hn(a.g) && (b = null);b?N(e):O(e);}):b.sa?N(e):O(e);}else O(e);});});}).then(function(){M(e,b);});return e.result();}function $n(a,b,c){b = jm(a.j,b,c);return bo(b,a);}function co(a,b){if(!b.B)return K(b);var c=[],d=b.N,e=J("buildDeepElementView");pe(function(e){b.B && b.sa && !Zn(b)?c.push(Dk(b)):(0 < c.length && eo(a,b,c),c = []);Wn(a,b).then(function(f){if(f !== b){for(var g=f;g && g.N != d;) g = g.parent;if(!g){b = f;O(e);return;}Zn(f) || c.push(Dk(f));}$n(a,f).then(function(c){(b = c) && b.N != d?a.sb.ub(b)?N(e):(b = b.modify(),b.b = !0,a.h?O(e):N(e)):O(e);});});}).then(function(){0 < c.length && eo(a,b,c);M(e,b);});return e.result();}function fo(a,b,c,d,e){var f=a.Yf.createElement("div");a.u?(e >= a.height && (e -= .1),w(f,"height",d + "px"),w(f,"width",e + "px")):(d >= a.width && (d -= .1),w(f,"width",d + "px"),w(f,"height",e + "px"));w(f,"float",c);w(f,"clear",c);a.element.insertBefore(f,b);return f;}function go(a){for(var b=a.element.firstChild;b;) {var c=b.nextSibling;if(1 == b.nodeType){var d=b.style.cssFloat;if("left" == d || "right" == d)a.element.removeChild(b);else break;}b = c;}}function ho(a){for(var b=a.element.firstChild,c=a.ra,d=a.u?a.u?a.W:a.A:a.u?a.J:a.W,e=a.u?a.u?a.ia:a.J:a.u?a.A:a.ia,f=0;f < c.length;f++) {var g=c[f],h=g.P - g.S;g.left = fo(a,b,"left",g.U - d,h);g.right = fo(a,b,"right",e - g.V,h);}}function io(a,b,c,d,e){var f;if(b && jo(b.B))return NaN;if(b && b.K && !b.sa && (f = En(b,a.f,0,a.u),!isNaN(f)))return f;b = c[d];for(e -= b.Ca;;) {f = En(b,a.f,e,a.u);if(!isNaN(f))return f;if(0 < e)e--;else {d--;if(0 > d)return a.A;b = c[d];1 != b.B.nodeType && (e = b.B.textContent.length);}}}function X(a){return "number" == typeof a?a:(a = a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0;}function ko(a,b){var c=lo(a.f,b),d=new $f();c && (d.left = X(c.marginLeft),d.top = X(c.marginTop),d.right = X(c.marginRight),d.bottom = X(c.marginBottom));return d;}function mo(a,b){var c=lo(a.f,b),d=new $f();c && (d.left = X(c.borderLeftWidth) + X(c.paddingLeft),d.top = X(c.borderTopWidth) + X(c.paddingTop),d.right = X(c.borderRightWidth) + X(c.paddingRight),d.bottom = X(c.borderBottomWidth) + X(c.paddingBottom));return d;}function no(a,b){var c=J("layoutFloat"),d=b.B,e=b.za;w(d,"float","none");w(d,"display","inline-block");w(d,"vertical-align","top");co(a,b).then(function(f){for(var g=nk(a.f,d),h=ko(a,d),g=new Yf(g.left - h.left,g.top - h.top,g.right + h.right,g.bottom + h.bottom),h=a.W,l=a.ia,k=b.parent;k && k.sa;) k = k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left = "0px";m.style.top = "0px";a.u?(m.style.bottom = "0px",m.style.width = "1px"):(m.style.right = "0px",m.style.height = "1px");k.B.appendChild(m);var p=nk(a.f,m),h=Math.max(a.u?p.top:p.left,h),l=Math.min(a.u?p.bottom:p.right,l);k.B.removeChild(m);m = a.u?g.P - g.S:g.V - g.U;"left" == e?l = Math.max(l,h + m):h = Math.min(h,l - m);k.B.appendChild(b.B);}m = new Yf(h,al(a) * a.A,l,al(a) * a.J);h = g;a.u && (h = og(g));l = al(a);h.S < a.uc * l && (p = h.P - h.S,h.S = a.uc * l,h.P = h.S + p);a: for(var l=a.ra,p=h,q=p.S,r=p.V - p.U,z=p.P - p.S,u=sg(l,q);;) {var A=q + z;if(A > m.P)break a;for(var I=m.U,E=m.V,F=u;F < l.length && l[F].S < A;F++) {var U=l[F];U.U > I && (I = U.U);U.V < E && (E = U.V);}if(I + r <= E || u >= l.length){"left" == e?(p.U = I,p.V = I + r):(p.U = E - r,p.V = E);p.P += q - p.S;p.S = q;break a;}q = l[u].P;u++;}a.u && (g = new Yf(-h.P,h.U,-h.S,h.V));a: {m = lo(a.f,d);l = new $f();if(m){if("border-box" == m.boxSizing){m = ko(a,d);break a;}l.left = X(m.marginLeft) + X(m.borderLeftWidth) + X(m.paddingLeft);l.top = X(m.marginTop) + X(m.borderTopWidth) + X(m.paddingTop);l.right = X(m.marginRight) + X(m.borderRightWidth) + X(m.paddingRight);l.bottom = X(m.marginBottom) + X(m.borderBottomWidth) + X(m.paddingBottom);}m = l;}w(d,"width",g.V - g.U - m.left - m.right + "px");w(d,"height",g.P - g.S - m.top - m.bottom + "px");w(d,"position","absolute");w(d,"display",b.display);l = null;if(k)if(k.O)l = k;else a: {for(k = k.parent;k;) {if(k.O){l = k;break a;}k = k.parent;}l = null;}l?(m = l.B.ownerDocument.createElement("div"),m.style.position = "absolute",l.u?m.style.right = "0":m.style.left = "0",m.style.top = "0",l.B.appendChild(m),k = nk(a.f,m),l.B.removeChild(m)):k = {left:a.u?a.J:a.W,right:a.u?a.A:a.ia,top:a.u?a.W:a.A};(l?l.u:a.u)?w(d,"right",k.right - g.V + a.I + "px"):w(d,"left",g.U - k.left + a.C + "px");w(d,"top",g.S - k.top + a.F + "px");b.C && (b.C.parentNode.removeChild(b.C),b.C = null);k = a.u?g.U:g.P;g = a.u?g.V:g.S;if(Nn(a,k) && a.G.length)b = b.modify(),b.b = !0,M(c,b);else {go(a);m = new Yf(a.u?a.J:a.W,a.u?a.W:a.A,a.u?a.A:a.ia,a.u?a.ia:a.J);a.u && (m = og(m));l = a.ra;for(h = [new bg(h.S,h.P,h.U,h.V)];0 < h.length && h[0].P <= m.S;) h.shift();if(h.length){h[0].S < m.S && (h[0].S = m.S);p = l.length?l[l.length - 1].P:m.S;p < m.P && l.push(new bg(p,m.P,m.U,m.V));q = sg(l,h[0].S);for(r = 0;r < h.length;r++) {z = h[r];if(q == l.length)break;l[q].S < z.S && (p = l[q],q++,l.splice(q,0,new bg(z.S,p.P,p.U,p.V)),p.P = z.S);for(;q < l.length && (p = l[q++],p.P > z.P && (l.splice(q,0,new bg(z.P,p.P,p.U,p.V)),p.P = z.P),z.U != z.V && ("left" == e?p.U = Math.min(z.V,m.V):p.V = Math.max(z.U,m.U)),p.P != z.P););}rg(m,l);}ho(a);"left" == e?a.Oc = k:a.Td = k;a.uc = g;oo(a,k);M(c,f);}});return c.result();}function po(a,b,c,d,e){var f=a.element.ownerDocument.createElement("div");w(f,"position","absolute");var g=Pm(a.g,b.b),h=new Jm(g,"column",null,a.g.j,b.f,null,null),g=Mm(g),f=new qo(c,f,a.j.clone(),a.f,a.sb,h,g);Nm(h,f);var g=b.b,l=a.g;b = Mm(l,g);h = f.element;b.element.parentNode.appendChild(h);f.uf = !0;f.gb = b.gb;f.hb = b.hb;f.u = b.u;f.marginLeft = f.marginRight = f.marginTop = f.marginBottom = 0;f.borderLeft = f.ha = f.borderTop = f.Y = 0;f.C = f.I = f.F = f.H = 0;f.Bc = (b.Bc || []).concat();f.wc = !Xm(l);f.wa = null;var k=hl(b);dl(f,k.U - b.gb,k.V - k.U);cl(f,k.S - b.hb,k.P - k.S);e.Ze(f,b,a);ro(f);(a = !!qn(l,f,g,c,d,!0,!Xm(l)))?(go(f),ro(f)):b.element.parentNode.removeChild(h);return a?f:null;}function so(a,b,c,d,e,f,g){var h=a.g;b = (g?g.Mb:[]).concat(b);var l=po(a,b[0].qa,c,f,e),k={qf:l,Pe:null,Hf:null};if(!l)return K(k);var m=J("layoutSinglePageFloatFragment"),p=!1,q=0;pe(function(a){q >= b.length?O(a):pm(l,new Pk(b[q].b),!0).then(function(b){k.Hf = b;!b || d?(q++,N(a)):(p = !0,O(a));});}).then(function(){if(!p){var a=qn(h,l,b[0].qa.b,c,f,!1,d);a?(a = e.kf(b,a,l),Tm(h,a,!0),k.Pe = a):p = !0;}M(m,k);});return m.result();}function to(a,b,c,d,e){function f(a,c){c?Vm(g,c,!0):a && a.element.parentNode.removeChild(a.element);ln(g,h.b);$m(g,b);}var g=a.g,h=b.qa;kn(g,h);var l=J("layoutPageFloatInner");so(a,[b],h.za,!Xm(g),c,d,e).then(function(b){var c=b.qf,d=b.Pe,k=b.Hf;d?uo(a,h.b,[e]).then(function(a){a?(Tm(g,d),mn(g,h.b),k && $m(g,new Im(h,k.f)),M(l,!0)):(f(c,d),M(l,!1));}):(f(c,d),M(l,!1));});return l.result();}function uo(a,b,c){var d=a.g,e=nn(d,b),f=[],g=[],h=!1,l=J("layoutStashedPageFloats"),k=0;pe(function(b){if(k >= e.length)O(b);else {var d=e[k];if(0 <= c.indexOf(d))k++,N(b);else {var l=Rm(d.Mb[0].qa);so(a,d.Mb,d.za,!1,l,null).then(function(a){var c=a.qf;c && f.push(c);(a = a.Pe)?(g.push(a),k++,N(b)):(h = !0,O(b));});}}}).then(function(){h?(g.forEach(function(a){Vm(d,a,!0);}),f.forEach(function(a){(a = a.element) && a.parentNode && a.parentNode.removeChild(a);})):e.forEach(function(a){(a = a.dc.element) && a.parentNode && a.parentNode.removeChild(a);});M(l,!h);});return l.result();}function vo(a,b){var c=b.B.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote" === b.za && wo(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.B);c = b.modify();c.K = !0;c.B = d;return c;}function Cn(a,b,c,d){var e=J("resolveFloatReferenceFromColumnSpan"),f=a.g,g=Pm(f,"region");Mm(f).width < Mm(g).width && "column" === b?c === Mc?co(a,Dk(d)).then(function(c){var d=c.B;c = rn(a.f,d,[xo])[xo];d = ko(a,d);c = a.u?c + (d.top + d.bottom):c + (d.left + d.right);c > a.width?M(e,"region"):M(e,b);}):c === Kc?M(e,"region"):M(e,b):M(e,b);return e.result();}function yo(a,b){var c=a.g,d=An(b),e=c.Fe(Kk(b));return (e?K(e):d.jf(b,c,a)).fa(function(e){var f=yk(b),h=vo(a,b),l=d.We(e,c),f=new Im(e,f);if(l && Fm(l,e))return Ym(c,e,h.B),K(h);if(Sm(c,e) || an(c,e))return $m(c,f),Ym(c,e,h.B),K(h);if(a.T)return K(null);var k=En(h,a.f,0,a.u);return Nn(a,k)?K(h):to(a,f,d,k,l).fa(function(a){if(a)return K(null);Ym(c,e,h.B);return K(h);});});}function zo(a,b,c){if(!b.K || b.sa){if(c){for(var d="",e=b.parent;e && !d;e = e.parent) !e.sa && e.B && (d = e.B.style.textAlign);if("justify" !== d)return;}var f=b.B,g=f.ownerDocument,h=c && (b.K || 1 != f.nodeType);(d = h?f.nextSibling:f) && !d.parentNode && (d = null);if(e = f.parentNode || b.parent && b.parent.B){var l=d,k=document.body;if(null === Ya){var m=k.ownerDocument,p=m.createElement("div");p.style.position = "absolute";p.style.top = "0px";p.style.left = "0px";p.style.width = "40px";p.style.height = "100px";p.style.lineHeight = "16px";p.style.fontSize = "16px";p.style.textAlign = "justify";k.appendChild(p);var q=m.createTextNode("a a-");p.appendChild(q);var r=m.createElement("span");r.style.display = "inline-block";r.style.width = "40px";p.appendChild(r);m = m.createRange();m.setStart(q,2);m.setEnd(q,4);Ya = 37 > m.getBoundingClientRect().right;k.removeChild(p);}Ya && (h = (h = h?f:f.previousSibling)?h.textContent:"",h.charAt(h.length - 1) === Ao(b) && (h = f.ownerDocument,f = f.parentNode,k = document.body,null === Za && (m = k.ownerDocument,p = m.createElement("div"),p.style.position = "absolute",p.style.top = "0px",p.style.left = "0px",p.style.width = "40px",p.style.height = "100px",p.style.lineHeight = "16px",p.style.fontSize = "16px",p.style.textAlign = "justify",k.appendChild(p),q = m.createTextNode("a a-"),p.appendChild(q),p.appendChild(m.createElement("wbr")),r = m.createElement("span"),r.style.display = "inline-block",r.style.width = "40px",p.appendChild(r),m = m.createRange(),m.setStart(q,2),m.setEnd(q,4),Za = 37 > m.getBoundingClientRect().right,k.removeChild(p)),Za?f.insertBefore(h.createTextNode(" "),l):f.insertBefore(h.createElement("wbr"),l)));h = b.u;f = g.createElement("span");f.style.visibility = "hidden";f.style.verticalAlign = "top";f.setAttribute("data-adapt-spec","1");k = g.createElement("span");k.style.fontSize = "0";k.style.lineHeight = "0";k.textContent = " #";f.appendChild(k);f.style.display = "block";f.style.textAlign = "left";e.insertBefore(f,l);l = nk(a.f,k);f.style.textAlign = "right";k = nk(a.f,k);f.style.textAlign = "";p = document.body;if(null === Xa){r = p.ownerDocument;q = r.createElement("div");q.style.position = "absolute";q.style.top = "0px";q.style.left = "0px";q.style.width = "30px";q.style.height = "100px";q.style.lineHeight = "16px";q.style.fontSize = "16px";q.style.textAlign = "justify";p.appendChild(q);m = r.createTextNode("a | ");q.appendChild(m);var z=r.createElement("span");z.style.display = "inline-block";z.style.width = "30px";q.appendChild(z);r = r.createRange();r.setStart(m,0);r.setEnd(m,3);Xa = 27 > r.getBoundingClientRect().right;p.removeChild(q);}Xa?f.style.display = "inline":f.style.display = "inline-block";l = h?k.top - l.top:k.left - l.left;l = 1 <= l?l - 1 + "px":"100%";h?f.style.paddingTop = l:f.style.paddingLeft = l;c || (c = g.createElement("div"),e.insertBefore(c,d),d = nk(a.f,f),a = nk(a.f,c),b.u?(c.style.marginRight = a.right - d.right + "px",c.style.width = "0px"):(c.style.marginTop = d.top - a.top + "px",c.style.height = "0px"),c.setAttribute("data-adapt-spec","1"));}}}function Bo(a,b,c,d){var e=J("processLineStyling");Qn(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0 == h.count && (h = h.gg);pe(function(d){if(h){var e=Co(a,f),l=h.count - g;if(e.length <= l)O(d);else {var p=Do(a,f,e[l - 1]);p?a.Fa(p,!1,!1).then(function(){g += l;Xn(a.j,p,0).then(function(e){b = e;zo(a,b,!1);h = b.f;f = [];Yn(a,b,f).then(function(a){c = a;N(d);});});}):O(d);}}else O(d);}).then(function(){Array.prototype.push.apply(d,f);Qn(d);M(e,c);});return e.result();}function Eo(a,b){for(var c=0,d=0,e=b.length - 1;0 <= e;e--) {var f=b[e];if(!f.K || !f.B || 1 != f.B.nodeType)break;f = ko(a,f.B);f = a.u?-f.left:f.bottom;0 < f?c = Math.max(c,f):d = Math.min(d,f);}return c - d;}function Fo(a,b){var c=J("layoutBreakableBlock"),d=[];Yn(a,b,d).then(function(e){var f=d.length - 1;if(0 > f)M(c,e);else {var f=io(a,e,d,f,d[f].Ca),g=!1;if(!e || !jo(e.B)){var h=Jn(e,Mn(a)),g=Nn(a,f + (a.u?-1:1) * h.he);Nn(a,f + (a.u?-1:1) * h.current) && !a.T && (a.T = e);}e || (f += Eo(a,d));oo(a,f);var l;b.f?l = Bo(a,b,e,d):l = K(e);l.then(function(b){eo(a,b,d);0 < d.length && (a.G.push(new Kn(d,d[0].j)),g && (2 != d.length && 0 < a.G.length || d[0].N != d[1].N || !Dn[d[0].N.localName]) && b && (b = b.modify(),b.b = !0));M(c,b);});}});return c.result();}function eo(a,b,c){Sd("POST_LAYOUT_BLOCK").forEach((function(a){a(b,c,this);}).bind(a));}function Do(a,b,c){Qn(b);for(var d=0,e=b[0].Ca,f=d,g=b.length - 1,h=b[g].Ca,l;e < h;) {l = e + Math.ceil((h - e) / 2);for(var f=d,k=g;f < k;) {var m=f + Math.ceil((k - f) / 2);b[m].Ca > l?k = m - 1:f = m;}k = io(a,null,b,f,l);if(a.u?k < c:k > c){for(h = l - 1;b[f].Ca == l;) f--;g = f;}else oo(a,k),e = l,d = f;}b = b[f];c = e;a = b.B;1 != a.nodeType?(Go(b),e = b,e.K?e.ka = a.length:(c -= e.Ca,b = a.data,173 == b.charCodeAt(c)?(a.replaceData(c,b.length - c,e.l?"":Ao(e)),a = c + 1):(d = b.charAt(c),c++,f = b.charAt(c),a.replaceData(c,b.length - c,!e.l && Ja(d) && Ja(f)?Ao(e):""),a = c),c = a,0 < c && (a = c,e = e.modify(),e.ka += a,e.g = null))):e = b;return e;}function Go(a){Sd("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a) || b;},Ho);}var Ho=new function(){}();function Ao(a){return a.F || a.parent && a.parent.F || "-";}function Zn(a){return a?(a = a.B) && 1 === a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1;}function Co(a,b){for(var c=[],d=b[0].B,e=b[b.length - 1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;) {var p=!0;do {var q=null;d == e && (m = !1);1 != d.nodeType?(k || (g.setStartBefore(d),k = !0),l = d):h?h = !1:d.getAttribute("data-adapt-spec")?p = !k:q = d.firstChild;q || (q = d.nextSibling,q || (h = !0,q = d.parentNode));d = q;}while(p && m);if(k){g.setEndAfter(l);k = Fn(a.f,g);for(p = 0;p < k.length;p++) f.push(k[p]);k = !1;}}f.sort(a.u?uk:tk);l = d = h = g = e = 0;for(m = al(a);;) {if(l < f.length && (k = f[l],p = 1,0 < d && (p = Math.max(a.u?k.right - k.left:k.bottom - k.top,1),p = m * (a.u?k.right:k.top) < m * e?m * ((a.u?k.left:k.bottom) - e) / p:m * (a.u?k.left:k.bottom) > m * g?m * (g - (a.u?k.right:k.top)) / p:1),!d || .6 <= p || .2 <= p && (a.u?k.top:k.left) >= h - 1)){h = a.u?k.bottom:k.right;a.u?(e = d?Math.max(e,k.right):k.right,g = d?Math.min(g,k.left):k.left):(e = d?Math.min(e,k.top):k.top,g = d?Math.max(g,k.bottom):k.bottom);d++;l++;continue;}0 < d && (c.push(g),d = 0);if(l >= f.length)break;}c.sort(Na);a.u && c.reverse();return c;}function mm(a,b){var c=0;Nk(b,(function(a){if("clone" === a.wb["box-decoration-break"]){var b=mo(this,a.B);c += a.u?-b.left:b.bottom;"table" === a.display && (c += a.Sd);}}).bind(a));return c;}function On(a,b){return (b?Jn(b.g(),Mn(a)):Jn(null,Mn(a))).current;}function Ln(a,b,c){for(var d=b.h,e=d[0];e.parent && e.sa;) e = e.parent;var f;c?f = c = 1:(c = Math.max((e.wb.widows || 2) - 0,1),f = Math.max((e.wb.orphans || 2) - 0,1));var e=mm(a,e),g=Co(a,d),h=a.O - e,e=al(a),l=On(a,b),h=h - e * l,k=Io(a,d);isNaN(k.hc) && (k.hc = Infinity * e);var d=Ma(g.length,function(b){b = g[b];return a.u?b < h || b <= k.hc:b > h || b >= k.hc;}),m=0 >= d;m && (d = Ma(g.length,function(b){return a.u?g[b] < h:g[b] > h;}));d = Math.min(g.length - c,d);if(d < f)return null;h = g[d - 1];if(b = m?k.ff:Do(a,b.h,h))a.ya = e * (h - a.A) + l;return b;}function Io(a,b){var c=b.findIndex(function(a){return a.b;});if(0 > c)return {hc:NaN,ff:null};var d=b[c];return {hc:io(a,null,b,c,d.Ca),ff:d};}nm.prototype.Fa = function(a,b,c){var d=Gn(a.D).Fa(this,a,b,c);d || (d = Jo.Fa(this,a,b,c));return d;};nm.prototype.Pb = function(){var a=null,b=null,c,d=0;do {c = d;for(var d=Number.MAX_VALUE,e=this.G.length - 1;0 <= e && !b;--e) {var a=this.G[e],b=a.f(this,c),f=a.b();f > c && (d = Math.min(d,f));}}while(d > c && !b);return {Gb:b?a:null,w:b};};function Ko(a,b,c,d,e){if(hn(a.g) || a.b || !c)return K(b);var f=J("doFinishBreak"),g=!1;if(!b){v.b("Could not find any page breaks?!!");if(a.wc)return Lo(a,c).then(function(b){b?(b = b.modify(),b.b = !1,a.Fa(b,g,!0).then(function(){M(f,b);})):M(f,b);}),f.result();b = d;g = !0;a.ya = e;}a.Fa(b,g,!0).then(function(){M(f,b);});return f.result();}function Mo(a){a = a.toString();return "" == a || "auto" == a || !!a.match(/^0+(.0*)?[^0-9]/);}function No(a,b,c,d,e){if(!b || jo(b.B))return !1;var f=En(b,a.f,0,a.u),g=Jn(b,Mn(a)),h=Nn(a,f + (a.u?-1:1) * g.he);Nn(a,f + (a.u?-1:1) * g.current) && !a.T && (a.T = b);c && (f += Eo(a,c));oo(a,f);d = a.h?d:!0;!d && h || Oo(a,b,e,h);return h;}function Po(a,b){if(!b.B.parentNode)return !1;var c=ko(a,b.B),d=b.B.ownerDocument.createElement("div");a.u?(d.style.bottom = "0px",d.style.width = "1px",d.style.marginRight = c.right + "px"):(d.style.right = "0px",d.style.height = "1px",d.style.marginTop = c.top + "px");b.B.parentNode.insertBefore(d,b.B);var e=nk(a.f,d),e=a.u?e.right:e.top,f=al(a),g=b.A,h=Infinity * -al(a);"all" === g && (h = wn(a.g,a));switch(g){case "left":h = f * Math.max(h * f,a.Oc * f);break;case "right":h = f * Math.max(h * f,a.Td * f);break;default:h = f * Math.max(h * f,Math.max(a.Td * f,a.Oc * f));}if(e * f >= h * f)return b.B.parentNode.removeChild(d),!1;e = Math.max(1,(h - e) * f);a.u?d.style.width = e + "px":d.style.height = e + "px";e = nk(a.f,d);e = a.u?e.left:e.bottom;a.u?(h = e + c.right - h,0 < h == 0 <= c.right && (h += c.right),d.style.marginLeft = h + "px"):(h -= e + c.top,0 < h == 0 <= c.top && (h += c.top),d.style.marginBottom = h + "px");b.C = d;return !0;}function Qo(a){return a instanceof Rn?!0:a instanceof Ro?!1:a instanceof So?!0:!1;}function To(a,b,c,d){function e(){return !!d || !c && !!yl[m];}function f(){b = q[0] || b;b.B.parentNode.removeChild(b.B);h.b = m;}var g=b.K?b.parent && b.parent.D:b.D;if(g && !Qo(g))return K(b);var h=a,l=J("skipEdges"),k=!d && c && b && b.K,m=d,p=null,q=[],r=[],z=!1;pe(function(a){for(;b;) {var d=Gn(b.D);do if(b.B){if(b.sa && 1 != b.B.nodeType){if(pk(b.B,b.bc))break;if(!b.K){e()?f():No(h,p,null,!0,m)?(b = (h.h?p || b:b).modify(),b.b = !0):(b = b.modify(),b.g = m);O(a);return;}}if(!b.K){if(d && d.ze(b))break;b.A && Po(h,b) && c && !h.G.length && Oo(h,Dk(b),m,!1);if(!Qo(b.D) || b.D instanceof So || Sn(h,b) || b.I){q.push(Dk(b));m = wl(m,b.g);if(e())f();else if(No(h,p,null,!0,m) || !h.sb.ub(b))b = (h.h?p || b:b).modify(),b.b = !0;O(a);return;}}if(1 == b.B.nodeType){var g=b.B.style;if(b.K){if(!(b.sa || d && d.Ye(b,h.h))){if(z){if(e()){f();O(a);return;}q = [];k = c = !1;m = null;}z = !1;p = Dk(b);r.push(p);m = wl(m,b.G);if(g && (!Mo(g.paddingBottom) || !Mo(g.borderBottomWidth))){if(No(h,p,null,!0,m) && (b = (h.h?p || b:b).modify(),b.b = !0,h.h)){O(a);return;}r = [p];p = null;}}}else {q.push(Dk(b));m = wl(m,b.g);if(!h.sb.ub(b) && (No(h,p,null,!1,m),b = b.modify(),b.b = !0,h.h)){O(a);return;}if(Dn[b.B.localName]){e()?f():No(h,p,null,!0,m) && (b = (h.h?p || b:b).modify(),b.b = !0);O(a);return;}!g || Mo(g.paddingTop) && Mo(g.borderTopWidth) || (k = !1,r = []);z = !0;}}}while(0);d = $n(h,b,k);if(d.Pa()){d.then(function(c){b = c;N(a);});return;}b = d.get();}No(h,p,r,!1,m)?p && h.h && (b = p.modify(),b.b = !0):yl[m] && (h.b = m);O(a);}).then(function(){p && (h.Ra = Kk(p));M(l,b);});return l.result();}function Lo(a,b){var c=Dk(b),d=J("skipEdges"),e=null,f=!1;pe(function(d){for(;b;) {do if(b.B){if(b.sa && 1 != b.B.nodeType){if(pk(b.B,b.bc))break;if(!b.K){yl[e] && (a.b = e);O(d);return;}}if(!b.K && (Sn(a,b) || b.I)){e = wl(e,b.g);yl[e] && (a.b = e);O(d);return;}if(1 == b.B.nodeType){var g=b.B.style;if(b.K){if(f){if(yl[e]){a.b = e;O(d);return;}e = null;}f = !1;e = wl(e,b.G);}else {e = wl(e,b.g);if(Dn[b.B.localName]){yl[e] && (a.b = e);O(d);return;}if(g && (!Mo(g.paddingTop) || !Mo(g.borderTopWidth))){O(d);return;}}f = !0;}}while(0);g = jm(a.j,b);if(g.Pa()){g.then(function(a){b = a;N(d);});return;}b = g.get();}c = null;O(d);}).then(function(){M(d,c);});return d.result();}function ao(a,b){return Am(b.H) || "footnote" === b.za?yo(a,b):no(a,b);}function Uo(a,b,c,d){var e=J("layoutNext");To(a,b,c,d || null).then(function(d){b = d;!b || a.b || a.h && b && b.b?M(e,b):Gn(b.D).Pd(b,a,c).Da(e);});return e.result();}function Wo(a,b,c){if(b)for(var d=b.parent;b;b = d,d = d?d.parent:null) Gn((d || b).D).md(a,d,b,c),c = !1;}function ro(a){a.rf = [];w(a.element,"width",a.width + "px");w(a.element,"height",a.height + "px");var b=a.element.ownerDocument.createElement("div");b.style.position = "absolute";b.style.top = a.F + "px";b.style.right = a.I + "px";b.style.bottom = a.H + "px";b.style.left = a.C + "px";a.element.appendChild(b);var c=nk(a.f,b);a.element.removeChild(b);var b=a.gb + a.left + Zk(a),d=a.hb + a.top + Xk(a);a.nf = new Yf(b,d,b + a.width,d + a.height);a.W = c?a.u?c.top:c.left:0;a.ia = c?a.u?c.bottom:c.right:0;a.A = c?a.u?c.right:c.top:0;a.J = c?a.u?c.left:c.bottom:0;a.Oc = a.A;a.Td = a.A;a.uc = a.A;a.O = a.J;var c=a.nf,e,b=a.gb + a.left + Zk(a),d=a.hb + a.top + Xk(a);e = new Yf(b,d,b + a.width,d + a.height);if(a.wa){b = a.wa;d = e.U;e = e.S;for(var f=[],g=0;g < b.b.length;g++) {var h=b.b[g];f.push(new Zf(h.f + d,h.b + e));}b = new dg(f);}else b = gg(e.U,e.S,e.V,e.P);b = [b];d = un(a.g);a.ra = qg(c,b,a.Bc.concat(d),a.Sa,a.u);ho(a);a.ya = 0;a.Bb = !1;a.b = null;a.Ra = null;}function Oo(a,b,c,d){var e=Dk(b);b = Gn(b.D).hf(e,c,d,a.ya);a.G.push(b);}function oo(a,b){isNaN(b) || (a.ya = Math.max(al(a) * (b - a.A),a.ya));}function pm(a,b,c,d){a.rf.push(b);b.f.K && (a.Ra = b.f);if(a.h && a.Bb)return K(b);var e=J("layout");a.tb(b.f).then(function(b){var f=null;if(b.B)f = Dk(b);else {var h=function h(b){b.w.B && (f = b.w,a.j.removeEventListener("nextInTree",h));};a.j.addEventListener("nextInTree",h);}var l=new Xo(c,d);sm(l,b,a).then(function(b){Ko(a,b,l.A.Bd,f,l.b).then(function(b){var c=null;a.Cb?c = K(null):c = Yo(a,b);c.then(function(){if(hn(a.g))M(e,null);else if(b){a.Bb = !0;var c=new Pk(Kk(b));M(e,c);}else M(e,null);});});});});return e.result();}function Yo(a,b){var c=J("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.l);d.sort(function(a,b){return a.Ge() - b.Ge();});var e=0;oe((function(){return e < d.length?d[e++].Fa(b,this).tc(!0):K(!1);}).bind(a)).then(function(){M(c,!0);});return c.result();}function Zo(a,b,c,d){var e=J("doLayout"),f=null;a.G = [];a.T = null;pe(function(e){for(;b;) {var g=!0;Uo(a,b,c,d || null).then(function(h){c = !1;d = null;a.T && a.h?(a.b = null,b = a.T,b.b = !0):b = h;hn(a.g)?O(e):a.b?O(e):b && a.h && b && b.b?(f = b,b = a.Pb().w,O(e)):g?g = !1:N(e);});if(g){g = !1;return;}}a.ya += On(a);O(e);}).then(function(){M(e,{w:b,Bd:f});});return e.result();}function jo(a){for(;a;) {if(a.parentNode === a.ownerDocument)return !1;a = a.parentNode;}return !0;}function Xo(a,b){rm.call(this);this.Rb = a;this.J = b || null;this.G = null;this.b = 0;this.F = !1;this.A = {Bd:null};}t(Xo,rm);Xo.prototype.j = function(){return new $o(this.Rb,this.J,this.A);};Xo.prototype.I = function(a,b){b.l = [];b.Cb || (ap = []);};Xo.prototype.l = function(a,b){rm.prototype.l.call(this,a,b);this.G = b.b;this.b = b.ya;this.F = b.Bb;};Xo.prototype.f = function(a,b){rm.prototype.f.call(this,a,b);b.b = this.G;b.ya = this.b;b.Bb = this.F;};function $o(a,b,c){this.Rb = a;this.j = b;this.h = c;}$o.prototype.b = function(a,b){var c=J("adapt.layout.DefaultLayoutMode.doLayout");bp(a,b).then((function(){Zo(b,a,this.Rb,this.j).then((function(a){this.h.Bd = a.Bd;M(c,a.w);}).bind(this));}).bind(this));return c.result();};$o.prototype.f = function(a,b){return hn(b.g) || b.b || 0 >= b.l.length?!0:b.l.every((function(c){return c.ub(a,this.h.Bd,b);}).bind(this));};$o.prototype.g = function(a,b,c,d){d || (d = !c.l.some(function(b){return b.Ad(a);}));c.l.forEach(function(e){e.nd(d,a,b,c);});return d;};function cp(){}n = cp.prototype;n.Pd = function(a,b){var c;if(Sn(b,a))c = ao(b,a);else {a: if(a.K)c = !0;else {switch(a.N.namespaceURI){case "http://www.w3.org/2000/svg":c = !1;break a;}c = !a.I;}c = c?Fo(b,a):co(b,a);}return c;};n.hf = function(a,b,c,d){return new qm(Dk(a),b,c,d);};n.ze = function(){return !1;};n.Ye = function(){return !1;};n.md = function(a,b,c,d){if(c.B && c.B.parentNode){a = c.B.parentNode;b = c.B;if(a)for(var e;(e = a.lastChild) != b;) a.removeChild(e);d && a.removeChild(c.B);}};n.Fa = function(a,b,c,d){c = c || !!b.B && 1 == b.B.nodeType && !b.K;Wo(a,b,c);d && (zo(a,b,!0),dp(c?b:b.parent));return K(!0);};var Jo=new cp();Rd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b = a.parent;return !b && a.D?null:b && a.D !== b.D?null:a.Rc || !a.D && Al(c,d,e,f).display === Nc?new Rn(b?b.D:null):null;});Rd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Rn?Jo:null;});function qo(a,b,c,d,e,f,g){nm.call(this,b,c,d,e,f);this.za = a;this.Af = g;this.Bf = [];this.tf = [];this.vc = !0;}t(qo,nm);qo.prototype.tb = function(a){return nm.prototype.tb.call(this,a).fa((function(a){if(a){for(var b=a;b.parent;) b = b.parent;b = b.B;this.Bf.push(b);this.vc && ep(this,b);this.tf.push(ko(this,b));if(this.vc){var d=this.za;if(this.Af.u){if("block-end" === d || "left" === d)d = Aa(b,"height"),"" !== d && "auto" !== d && w(b,"margin-top","auto");}else if("block-end" === d || "bottom" === d)d = Aa(b,"width"),"" !== d && "auto" !== d && w(b,"margin-left","auto");}}return K(a);}).bind(this));};function ep(a,b){function c(a,c){a.forEach(function(a){var d=Aa(b,a);d && "%" === d.charAt(d.length - 1) && w(b,a,c * parseFloat(d) / 100 + "px");});}var d=hl(a.Af),e=d.V - d.U,d=d.P - d.S;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto" === Aa(b,a) && w(b,a,"0");});}function tn(a){return Math.max.apply(null,a.Bf.map(function(a,c){var b=nk(this.f,a),e=this.tf[c];return this.u?e.top + b.height + e.bottom:e.left + b.width + e.right;},a));}function fp(a,b,c){var d=nk(b.f,a);a = ko(b,a);return c?d.width + a.left + a.right:d.height + a.top + a.bottom;};function gp(a,b){this.b = a;this.$ = b;}function hp(a,b,c,d){this.b = a;this.g = b;this.j = c;this.f = d;this.h = null;}function ip(a,b){this.b = a;this.f = b;}function jp(a){var b={};Object.keys(a).forEach(function(c){b[c] = Array.from(a[c]);});return b;}function kp(a,b){this.sc = a;this.ad = b;this.le = null;this.$ = this.R = -1;}function lj(a,b,c){b = a.b.J.re(b,a.f);a.b.l[b] = c;}function lp(a){return (a = a.match(/^[^#]*#(.*)$/))?a[1]:null;}function mp(a,b){var c=a.b.J.gd(oa(b,a.g),a.g);"#" === c.charAt(0) && (c = c.substring(1));return c;}function Oi(a,b,c){return new yb(a.f,function(){var d=a.b.b[b];return c(d && d.length?d[d.length - 1]:null);},"page-counter-" + b);}function Qi(a,b,c){return new yb(a.f,function(){return c(a.b.b[b] || []);},"page-counters-" + b);}function np(a,b,c,d){var e=a.b.l[c];if(!e && d && b){d = a.h;if(b){d.F = b;for(b = 0;d.F && (b += 5E3,Nl(d,b,0) !== Number.POSITIVE_INFINITY););d.F = null;}e = a.b.l[c];}return e || null;}function Si(a,b,c,d){var e=lp(b),f=mp(a,b),g=np(a,e,f,!1);return g && g[c]?(b = g[c],new wb(a.j,d(b[b.length - 1] || null))):new yb(a.f,function(){if(g = np(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length - 1] || null);}if(b = a.b.j.b[f]?a.b.b:a.b.C[f] || null)return op(a.b,f),b[c]?(b = b[c],d(b[b.length - 1] || null)):d(0);pp(a.b,f,!1);return "??";}pp(a.b,f,!1);return "??";},"target-counter-" + c + "-of-" + b);}function Ui(a,b,c,d){var e=lp(b),f=mp(a,b);return new yb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.C[f] || null;if(b){op(a.b,f);var b=b[c] || [],h=np(a,e,f,!0)[c] || [];return d(b.concat(h));}pp(a.b,f,!1);return "??";},"target-counters-" + c + "-of-" + b);}function qp(a){this.J = a;this.l = {};this.C = {};this.b = {};this.b.page = [0];this.H = {};this.G = [];this.F = {};this.j = null;this.A = [];this.g = [];this.I = [];this.f = {};this.h = {};}function rp(a,b){var c=a.b.page;c && c.length?c[c.length - 1] = b:a.b.page = [b];}function sp(a,b,c){a.H = jp(a.b);var d,e=b["counter-reset"];e && (e = e.evaluate(c)) && (d = Bg(e,!0));if(d)for(var f in d) {var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g] = [h];}var l;(b = b["counter-increment"]) && (c = b.evaluate(c)) && (l = Bg(c,!1));l?"page" in l || (l.page = 1):l = {page:1};for(var k in l) a.b[k] || (c = a,b = k,c.b[b]?c.b[b].push(0):c.b[b] = [0]),c = a.b[k],c[c.length - 1] += l[k];}function tp(a,b){a.G.push(a.b);a.b = jp(b);}function op(a,b){var c=a.f[b],d=a.h[b];d || (d = a.h[b] = []);for(var e=!1,f=0;f < a.g.length;) {var g=a.g[f];g.sc === b?(g.ad = !0,a.g.splice(f,1),c && (e = c.indexOf(g),0 <= e && c.splice(e,1)),d.push(g),e = !0):f++;}e || pp(a,b,!0);}function pp(a,b,c){a.A.some(function(a){return a.sc === b;}) || a.A.push(new kp(b,c));}function up(a,b,c){var d=Object.keys(a.j.b);if(0 < d.length){var e=jp(a.b);d.forEach(function(a){this.C[a] = e;var d=this.F[a];if(d && d.$ < c && (d = this.h[a])){var f=this.f[a];f || (f = this.f[a] = []);for(var g;g = d.shift();) g.ad = !1,f.push(g);}this.F[a] = {R:b,$:c};},a);}for(var d=a.H,f;f = a.A.shift();) {f.le = d;f.R = b;f.$ = c;var g;f.ad?(g = a.h[f.sc]) || (g = a.h[f.sc] = []):(g = a.f[f.sc]) || (g = a.f[f.sc] = []);g.every(function(a){return !(f === a || a && f.sc === a.sc && f.ad === a.ad && f.R === a.R && f.$ === a.$);}) && g.push(f);}a.j = null;}function vp(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a = this.f[a]) && (c = c.concat(a));},a);c.sort(function(a,b){return a.R - b.R || a.$ - b.$;});var d=[],e=null;c.forEach(function(a){e && e.R === a.R && e.$ === a.$?e.Cd.push(a):(e = {R:a.R,$:a.$,le:a.le,Cd:[a]},d.push(e));});return d;}function wp(a,b){a.I.push(a.g);a.g = b;}gp.prototype.ub = function(a){if(!a || a.K)return !0;a = a.B;if(!a || 1 !== a.nodeType)return !0;a = a.getAttribute("id") || a.getAttribute("name");return a && (this.b.h[a] || this.b.f[a])?(a = this.b.F[a])?this.$ >= a.$:!0:!0;};var xp=1;function yp(a,b,c,d,e){this.b = {};this.j = [];this.g = null;this.index = 0;this.f = a;this.name = b;this.Xb = c;this.Ea = d;this.parent = e;this.l = "p" + xp++;e && (this.index = e.j.length,e.j.push(this));}yp.prototype.h = function(){throw Error("E_UNEXPECTED_CALL");};yp.prototype.clone = function(){throw Error("E_UNEXPECTED_CALL");};function zp(a,b){var c=a.b,d=b.b,e;for(e in c) Object.prototype.hasOwnProperty.call(c,e) && (d[e] = c[e]);}function Ap(a,b){for(var c=0;c < a.j.length;c++) a.j[c].clone({parent:b});}function Bp(a){yp.call(this,a,null,null,[],null);this.b.width = new V(Kd,0);this.b.height = new V(Ld,0);}t(Bp,yp);function Cp(a,b){this.g = b;var c=this;ub.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.A[d[1]];if(e && (e = this.wa[e])){if(b){var d=d[2],h=e.ha[d];if(h)e = h;else {switch(d){case "columns":var h=e.b.f,l=new nc(h,0),k=Dp(e,"column-count"),m=Dp(e,"column-width"),p=Dp(e,"column-gap"),h=y(h,pc(h,new kc(h,"min",[l,k]),x(h,m,p)),p);}h && (e.ha[d] = h);e = h;}}else e = Dp(e,d[2]);return e;}}return null;});}t(Cp,ub);function Ep(a,b,c,d,e,f,g){a = a instanceof Cp?a:new Cp(a,this);yp.call(this,a,b,c,d,e);this.g = this;this.ea = f;this.Z = g;this.b.width = new V(Kd,0);this.b.height = new V(Ld,0);this.b["wrap-flow"] = new V(Mc,0);this.b.position = new V(sd,0);this.b.overflow = new V(Hd,0);this.A = {};}t(Ep,yp);Ep.prototype.h = function(a){return new Fp(a,this);};Ep.prototype.clone = function(a){a = new Ep(this.f,this.name,a.Xb || this.Xb,this.Ea,this.parent,this.ea,this.Z);zp(this,a);Ap(this,a);return a;};function Gp(a,b,c,d,e){yp.call(this,a,b,c,d,e);this.g = e.g;b && (this.g.A[b] = this.l);this.b["wrap-flow"] = new V(Mc,0);}t(Gp,yp);Gp.prototype.h = function(a){return new Hp(a,this);};Gp.prototype.clone = function(a){a = new Gp(a.parent.f,this.name,this.Xb,this.Ea,a.parent);zp(this,a);Ap(this,a);return a;};function Ip(a,b,c,d,e){yp.call(this,a,b,c,d,e);this.g = e.g;b && (this.g.A[b] = this.l);}t(Ip,yp);Ip.prototype.h = function(a){return new Jp(a,this);};Ip.prototype.clone = function(a){a = new Ip(a.parent.f,this.name,this.Xb,this.Ea,a.parent);zp(this,a);Ap(this,a);return a;};function Y(a,b,c){return b && b !== Mc?b.ta(a,c):null;}function Kp(a,b,c){return b && b !== Mc?b.ta(a,c):a.b;}function Lp(a,b,c){return b?b === Mc?null:b.ta(a,c):a.b;}function Mp(a,b,c,d){return b && c !== H?b.ta(a,d):a.b;}function Np(a,b,c){return b?b === Id?a.j:b === Yc?a.h:b.ta(a,a.b):c;}function Op(a,b){this.f = a;this.b = b;this.J = {};this.style = {};this.C = this.F = null;this.A = [];this.O = this.T = this.g = this.h = !1;this.H = this.I = 0;this.G = null;this.ia = {};this.ha = {};this.ra = this.u = !1;a && a.A.push(this);}function Pp(a){a.I = 0;a.H = 0;}function Qp(a,b,c){b = Dp(a,b);c = Dp(a,c);if(!b || !c)throw Error("E_INTERNAL");return x(a.b.f,b,c);}function Dp(a,b){var c=a.ia[b];if(c)return c;var d=a.style[b];d && (c = d.ta(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c = Dp(a,"left");break;case "margin-top-edge":c = Dp(a,"top");break;case "margin-right-edge":c = Qp(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c = Qp(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c = Qp(a,"margin-left-edge","margin-left");break;case "border-top-edge":c = Qp(a,"margin-top-edge","margin-top");break;case "border-right-edge":c = Qp(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c = Qp(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c = Qp(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c = Qp(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c = Qp(a,"right-edge","padding-right");break;case "padding-bottom-edge":c = Qp(a,"bottom-edge","padding-bottom");break;case "left-edge":c = Qp(a,"padding-left-edge","padding-left");break;case "top-edge":c = Qp(a,"padding-top-edge","padding-top");break;case "right-edge":c = Qp(a,"left-edge","width");break;case "bottom-edge":c = Qp(a,"top-edge","height");}if(!c){if("extent" == b)d = a.u?"width":"height";else if("measure" == b)d = a.u?"height":"width";else {var e=a.u?zh:Ah,d=b,f;for(f in e) d = d.replace(f,e[f]);}d != b && (c = Dp(a,d));}c && (a.ia[b] = c);return c;}function Rp(a){var b=a.b.f,c=a.style,d=Np(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new ic(b,"page-number"),d=oc(b,d,new ac(b,e,f));(e = Y(b,c["min-page-width"],b.b)) && (d = oc(b,d,new $b(b,new ic(b,"page-width"),e)));(e = Y(b,c["min-page-height"],b.b)) && (d = oc(b,d,new $b(b,new ic(b,"page-height"),e)));d = a.W(d);c.enabled = new G(d);}Op.prototype.W = function(a){return a;};Op.prototype.de = function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ta(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=Mp(a,b["border-left-width"],b["border-left-style"],c),g=Kp(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=Kp(a,b["padding-right"],c),m=Mp(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=x(a,f,g),z=x(a,f,k);d && q && h?(r = y(a,c,x(a,h,x(a,x(a,d,r),z))),e?p?q = y(a,r,p):p = y(a,r,x(a,q,e)):(r = y(a,r,q),p?e = y(a,r,p):p = e = pc(a,r,new wb(a,.5)))):(e || (e = a.b),p || (p = a.b),d || q || h || (d = a.b),d || h?d || q?h || q || (h = this.F,this.h = !0):d = a.b:(h = this.F,this.h = !0),r = y(a,c,x(a,x(a,e,r),x(a,p,z))),this.h && (l || (l = y(a,r,d?d:q)),this.u || !Y(a,b["column-width"],null) && !Y(a,b["column-count"],null) || (h = l,this.h = !1)),d?h?q || (q = y(a,r,x(a,d,h))):h = y(a,r,x(a,d,q)):d = y(a,r,x(a,q,h)));a = Kp(a,b["snap-width"] || (this.f?this.f.style["snap-width"]:null),c);b.left = new G(d);b["margin-left"] = new G(e);b["border-left-width"] = new G(f);b["padding-left"] = new G(g);b.width = new G(h);b["max-width"] = new G(l?l:h);b["padding-right"] = new G(k);b["border-right-width"] = new G(m);b["margin-right"] = new G(p);b.right = new G(q);b["snap-width"] = new G(a);};Op.prototype.ee = function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ta(a,null):null,d=this.f?this.f.style.height.ta(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=Mp(a,b["border-top-width"],b["border-top-style"],c),h=Kp(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=Kp(a,b["padding-bottom"],c),p=Mp(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=x(a,g,h),u=x(a,p,m);e && r && l?(d = y(a,d,x(a,l,x(a,x(a,e,z),u))),f?q?r = y(a,d,f):q = y(a,d,x(a,r,f)):(d = y(a,d,r),q?f = y(a,d,q):q = f = pc(a,d,new wb(a,.5)))):(f || (f = a.b),q || (q = a.b),e || r || l || (e = a.b),e || l?e || r?l || r || (l = this.C,this.g = !0):e = a.b:(l = this.C,this.g = !0),d = y(a,d,x(a,x(a,f,z),x(a,q,u))),this.g && (k || (k = y(a,d,e?e:r)),this.u && (Y(a,b["column-width"],null) || Y(a,b["column-count"],null)) && (l = k,this.g = !1)),e?l?r || (r = y(a,d,x(a,e,l))):l = y(a,d,x(a,r,e)):e = y(a,d,x(a,r,l)));a = Kp(a,b["snap-height"] || (this.f?this.f.style["snap-height"]:null),c);b.top = new G(e);b["margin-top"] = new G(f);b["border-top-width"] = new G(g);b["padding-top"] = new G(h);b.height = new G(l);b["max-height"] = new G(k?k:l);b["padding-bottom"] = new G(m);b["border-bottom-width"] = new G(p);b["margin-bottom"] = new G(q);b.bottom = new G(r);b["snap-height"] = new G(a);};function Sp(a){var b=a.b.f,c=a.style;a = Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f = (f = c["column-gap"]) && f !== od?f.ta(b,null):null) || (f = new hc(b,1,"em"));d && !e && (e = new kc(b,"floor",[qc(b,x(b,a,f),x(b,d,f))]),e = new kc(b,"max",[b.f,e]));e || (e = b.f);d = y(b,qc(b,x(b,a,f),e),f);c["column-width"] = new G(d);c["column-count"] = new G(e);c["column-gap"] = new G(f);}function Tp(a,b,c,d){a = a.style[b].ta(a.b.f,null);return Kb(a,c,d,{});}function Up(a,b){b.wa[a.b.l] = a;var c=a.b.f,d=a.style,e=a.f?Vp(a.f,b):null,e=yj(a.J,b,e,!1);a.u = xj(e,b,a.f?a.f.u:!1);Cj(e,d,a.u,function(a,b){return b.value;});a.F = new yb(c,function(){return a.I;},"autoWidth");a.C = new yb(c,function(){return a.H;},"autoHeight");a.de();a.ee();Sp(a);Rp(a);}function Wp(a,b,c){(a = a.style[c]) && (a = Xf(b,a,c));return a;}function Z(a,b,c){(a = a.style[c]) && (a = Xf(b,a,c));return Ic(a,b);}function Vp(a,b){var c;a: {if(c = a.J["region-id"]){for(var d=[],e=0;e < c.length;e++) {var f=c[e].evaluate(b,"");f && f !== B && d.push(f);}if(d.length){c = d;break a;}}c = null;}if(c){d = [];for(e = 0;e < c.length;e++) d[e] = c[e].toString();return d;}return null;}function Xp(a,b,c,d,e){if(a = Wp(a,b,d))a.kc() && Cb(a.ga) && (a = new D(Ic(a,b),"px")),"font-family" === d && (a = Zl(e,a)),w(c,d,a.toString());}function Yp(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a = Z(a,b,"width");dl(c,d,a);w(c.element,"margin-left",e + "px");w(c.element,"padding-left",f + "px");w(c.element,"border-left-width",g + "px");c.marginLeft = e;c.borderLeft = g;c.C = f;}function Zp(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b = Z(a,b,"border-right-width");w(c.element,"margin-right",f + "px");w(c.element,"padding-right",g + "px");w(c.element,"border-right-width",b + "px");c.marginRight = f;c.ha = b;a.u && 0 < e && (a = d + $k(c),a -= Math.floor(a / e) * e,0 < a && (c.Db = e - a,g += c.Db));c.I = g;c.Eb = e;}function $p(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b = Z(a,b,"border-top-width");c.top = e;c.marginTop = f;c.borderTop = b;c.Sa = d;!a.u && 0 < d && (a = e + Xk(c),a -= Math.floor(a / d) * d,0 < a && (c.na = d - a,g += c.na));c.F = g;w(c.element,"top",e + "px");w(c.element,"margin-top",f + "px");w(c.element,"padding-top",g + "px");w(c.element,"border-top-width",b + "px");}function aq(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a = Z(a,b,"height") - c.na;w(c.element,"height",a + "px");w(c.element,"margin-bottom",d + "px");w(c.element,"padding-bottom",e + "px");w(c.element,"border-bottom-width",f + "px");c.height = a - c.na;c.marginBottom = d;c.Y = f;c.H = e;}function bq(a,b,c){a.u?($p(a,b,c),aq(a,b,c)):(Zp(a,b,c),Yp(a,b,c));}function cq(a,b,c){w(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.T?cl(c,0,d):($p(a,b,c),d -= c.na,c.height = d,w(c.element,"height",d + "px"));}function dq(a,b,c){w(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?dl(c,0,d):(Zp(a,b,c),d -= c.Db,c.width = d,a = Z(a,b,"right"),w(c.element,"right",a + "px"),w(c.element,"width",d + "px"));}var eq="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),fq="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),gq="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),hq=["width","height"],iq=["transform","transform-origin"];Op.prototype.Vb = function(a,b,c,d){this.f && this.u == this.f.u || w(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?dq(this,a,b):cq(this,a,b):(this.u?Zp(this,a,b):$p(this,a,b),this.u?Yp(this,a,b):aq(this,a,b));(this.u?this.g:this.h)?this.u?cq(this,a,b):dq(this,a,b):bq(this,a,b);for(c = 0;c < eq.length;c++) Xp(this,a,b.element,eq[c],d);};function jq(a,b,c,d){for(var e=0;e < gq.length;e++) Xp(a,b,c.element,gq[e],d);}function kq(a,b,c,d){for(var e=0;e < hq.length;e++) Xp(a,b,c,hq[e],d);}Op.prototype.vd = function(a,b,c,d,e,f,g){this.u?this.I = b.ya + b.Db:this.H = b.ya + b.na;var h=(this.u || !d) && this.g,l=(!this.u || !d) && this.h;if(l || h)l && w(b.element,"width","auto"),h && w(b.element,"height","auto"),d = nk(f,d?d.element:b.element),l && (this.I = Math.ceil(d.right - d.left - b.C - b.borderLeft - b.I - b.ha),this.u && (this.I += b.Db)),h && (this.H = d.bottom - d.top - b.F - b.borderTop - b.H - b.Y,this.u || (this.H += b.na));(this.u?this.g:this.h) && bq(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.T)this.u?Zp(this,a,b):$p(this,a,b);this.u?Yp(this,a,b):aq(this,a,b);}if(1 < e && (l = Z(this,a,"column-rule-width"),d = Wp(this,a,"column-rule-style"),f = Wp(this,a,"column-rule-color"),0 < l && d && d != H && f != Ed))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,p=this.u?"border-top":"border-left",h=1;h < e;h++) {var q=(m + k) * h / e - k / 2 + b.C - l / 2,r=b.height + b.F + b.H,z=b.element.ownerDocument.createElement("div");w(z,"position","absolute");w(z,this.u?"left":"top","0px");w(z,this.u?"top":"left",q + "px");w(z,this.u?"height":"width","0px");w(z,this.u?"width":"height",r + "px");w(z,p,l + "px " + d.toString() + (f?" " + f.toString():""));b.element.insertBefore(z,b.element.firstChild);}for(h = 0;h < fq.length;h++) Xp(this,a,b.element,fq[h],g);for(h = 0;h < iq.length;h++) e = b,g = iq[h],l = c.A,(d = Wp(this,a,g)) && l.push(new fk(e.element,g,d));};Op.prototype.j = function(a,b){var c=this.J,d=this.b.b,e;for(e in d) Eh(e) && Fh(c,e,d[e]);if("background-host" == this.b.Xb)for(e in b) if(e.match(/^background-/) || "writing-mode" == e)c[e] = b[e];if("layout-host" == this.b.Xb)for(e in b) e.match(/^background-/) || "writing-mode" == e || (c[e] = b[e]);dj(a,this.b.Ea,null,c);c.content && (c.content = c.content.ud(new Gi(a,null,a.Bb)));Up(this,a.l);for(c = 0;c < this.b.j.length;c++) this.b.j[c].h(this).j(a,b);a.pop();};function lq(a,b){a.h && (a.O = Tp(a,"right",a.F,b) || Tp(a,"margin-right",a.F,b) || Tp(a,"border-right-width",a.F,b) || Tp(a,"padding-right",a.F,b));a.g && (a.T = Tp(a,"top",a.C,b) || Tp(a,"margin-top",a.C,b) || Tp(a,"border-top-width",a.C,b) || Tp(a,"padding-top",a.C,b));for(var c=0;c < a.A.length;c++) lq(a.A[c],b);}function mq(a){Op.call(this,null,a);}t(mq,Op);mq.prototype.j = function(a,b){Op.prototype.j.call(this,a,b);this.A.sort(function(a,b){return b.b.Z - a.b.Z || a.b.index - b.b.index;});};function Fp(a,b){Op.call(this,a,b);this.G = this;}t(Fp,Op);Fp.prototype.W = function(a){var b=this.b.g;b.ea && (a = oc(b.f,a,b.ea));return a;};Fp.prototype.Y = function(){};function Hp(a,b){Op.call(this,a,b);this.G = a.G;}t(Hp,Op);function Jp(a,b){Op.call(this,a,b);this.G = a.G;}t(Jp,Op);function nq(a,b,c,d){var e=null;c instanceof Cc && (e = [c]);c instanceof vc && (e = c.values);if(e)for(a = a.b.f,c = 0;c < e.length;c++) if(e[c] instanceof Cc){var f=sb(e[c].name,"enabled"),f=new ic(a,f);d && (f = new Rb(a,f));b = oc(a,b,f);}return b;}Jp.prototype.W = function(a){var b=this.b.f,c=this.style,d=Np(b,c.required,b.h) !== b.h;if(d || this.g){var e;e = (e = c["flow-from"])?e.ta(b,b.b):new wb(b,"body");e = new kc(b,"has-content",[e]);a = oc(b,a,e);}a = nq(this,a,c["required-partitions"],!1);a = nq(this,a,c["conflicting-partitions"],!0);d && (c = (c = this.G.style.enabled)?c.ta(b,null):b.j,c = oc(b,c,a),this.G.style.enabled = new G(c));return a;};Jp.prototype.Vb = function(a,b,c,d,e){w(b.element,"overflow","hidden");Op.prototype.Vb.call(this,a,b,c,d,e);};function oq(a,b,c,d){qf.call(this,a,b,!1);this.target = c;this.b = d;}t(oq,rf);oq.prototype.xb = function(a,b,c){mh(this.b,a,b,c,this);};oq.prototype.Md = function(a,b){sf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};oq.prototype.Tc = function(a,b){sf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};oq.prototype.yb = function(a,b,c){this.target.b[a] = new V(b,c?50331648:67108864);};function pq(a,b,c,d){oq.call(this,a,b,c,d);}t(pq,oq);function qq(a,b,c,d){oq.call(this,a,b,c,d);c.b.width = new V(Jd,0);c.b.height = new V(Jd,0);}t(qq,oq);qq.prototype.ed = function(a,b,c){a = new Ip(this.f,a,b,c,this.target);pf(this.la,new pq(this.f,this.la,a,this.b));};qq.prototype.dd = function(a,b,c){a = new Gp(this.f,a,b,c,this.target);a = new qq(this.f,this.la,a,this.b);pf(this.la,a);};function rq(a,b,c,d){oq.call(this,a,b,c,d);}t(rq,oq);rq.prototype.ed = function(a,b,c){a = new Ip(this.f,a,b,c,this.target);pf(this.la,new pq(this.f,this.la,a,this.b));};rq.prototype.dd = function(a,b,c){a = new Gp(this.f,a,b,c,this.target);a = new qq(this.f,this.la,a,this.b);pf(this.la,a);};function sq(a){a = a.toString();switch(a){case "inline-flex":a = "flex";break;case "inline-grid":a = "grid";break;case "inline-table":a = "table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a = "block";}return C(a);}function Al(a,b,c,d){if(a !== H)if(b === Jc || b === Zc)c = H,a = sq(a);else if(c && c !== H || d)a = sq(a);return {display:a,position:b,qa:c};}function tq(a,b,c,d,e,f,g){e = e || f || dd;return !!g || !!c && c !== H || b === Jc || b === Zc || a === gd || a === Ad || a === zd || a == $c || (a === Nc || a === md) && !!d && d !== Hd || !!f && e !== f;};function uq(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return 'url("' + c.gd(e,b) + '"';}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return "url('" + c.gd(e,b) + "'";}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return "url(" + c.gd(e,b);});};var vq={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},wq={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},xq={"margin-top":"0px"},yq={"margin-right":"0px"},zq={};function Aq(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem = {name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function hasFeature(a){switch(a){case "mouse-events":return !0;}return !1;}};},!1);}var Bq=new DOMParser().parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Cq="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");function Dq(a,b){a.setAttribute("data-adapt-pseudo",b);}function Eq(a,b,c,d){this.style = b;this.element = a;this.b = c;this.g = d;this.f = {};}Eq.prototype.l = function(a){var b=a.getAttribute("data-adapt-pseudo") || "";this.b && b && b.match(/after$/) && (this.style = this.b.l(this.element,!0),this.b = null);a = this.style._pseudos[b] || {};if(b.match(/^first-/) && !a["x-first-pseudo"]){var c=1;if("first-letter" == b)c = 0;else if(b = b.match(/^first-([0-9]+)-lines$/))c = b[1] - 0;a["x-first-pseudo"] = new V(new Ec(c),0);}return a;};Eq.prototype.na = function(a,b){var c=a.getAttribute("data-adapt-pseudo") || "";this.f[c] || (this.f[c] = !0,(c = b.content) && kl(c) && c.ba(new jl(a,this.g,c)));};function Fq(a,b,c,d,e,f,g,h,l,k,m,p,q){this.h = {};this.H = a;this.b = b;this.viewport = c;this.F = c.b;this.l = d;this.A = e;this.aa = f;this.I = g;this.C = h;this.J = l;this.page = k;this.g = m;this.G = p;this.j = q;this.O = this.w = null;this.f = !1;this.N = null;this.ka = 0;this.B = null;}t(Fq,Ua);Fq.prototype.clone = function(){return new Fq(this.H,this.b,this.viewport,this.l,this.A,this.aa,this.I,this.C,this.J,this.page,this.g,this.G,this.j);};function Gq(a,b,c,d){a = a._pseudos;if(!a)return null;var e={},f;for(f in a) {var g=e[f] = {};Bj(g,a[f],d);zj(g,d,a[f]);Aj(a[f],b,c,function(a,b){Bj(g,b,d);Hq(b,function(a){Bj(g,a,d);});});}return e;}function Iq(a,b,c,d,e,f){var g=J("createRefShadow");a.aa.A.load(b).then(function(h){if(h){var l=Pj(h,b);if(l){var k=a.J,m=k.I[h.url];if(!m){var m=k.style.l.f[h.url],p=new Db(0,k.Ub(),k.Tb(),k.A),m=new Fl(h,m.g,m.f,p,k.l,m.A,new ip(k.j,h.url),new hp(k.j,h.url,m.f,m.b));k.I[h.url] = m;}f = new Ek(d,l,h,e,f,c,m);}}M(g,f);});return g.result();}function Jq(a,b,c,d,e,f,g,h){var l=J("createShadows"),k=e.template,m;k instanceof Gc?m = Iq(a,k.url,2,b,h,null):m = K(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow" == b.namespaceURI && "include" == b.localName){var p=b.getAttribute("href"),z=null;p?z = h?h.aa:a.aa:h && (p = "http://www.w3.org/1999/xhtml" == h.la.namespaceURI?h.la.getAttribute("href"):h.la.getAttributeNS("http://www.w3.org/1999/xlink","href"),z = h.Xc?h.Xc.aa:a.aa);p && (p = oa(p,z.url),m = Iq(a,p,3,b,h,k));}m || (m = K(k));var u=null;m.then(function(c){e.display === Ad?u = Iq(a,oa("user-agent.xml#table-cell",na),2,b,h,c):u = K(c);});u.then(function(k){var m=Gq(d,a.A,a.f,g);if(m){for(var p=[],q=Bq.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=0;u < Cq.length;u++) {var z=Cq[u],A;if(z){if(!m[z])continue;if(!("footnote-marker" != z || c && a.f))continue;if(z.match(/^first-/) && (A = e.display,!A || A === fd))continue;if("before" === z || "after" === z)if((A = m[z].content,!A || A === od || A === H))continue;p.push(z);A = Bq.createElementNS("http://www.w3.org/1999/xhtml","span");Dq(A,z);}else A = Bq.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/) && (r = A);}k = p.length?new Ek(b,q,null,h,k,2,new Eq(b,d,f,g)):k;}M(l,k);});});return l.result();}function Tn(a,b,c){a.O = b;a.f = c;}function Kq(a,b,c,d){var e=a.b;c = yj(c,e,a.A,a.f);b = xj(c,e,b);Cj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family" == b && (d = Zl(a.I,d));return d;});var f=Al(d.display || fd,d.position,d["float"],a.N === a.aa.root);["display","position","float"].forEach(function(a){f[a] && (d[a] = f[a]);});return b;}function Lq(a,b){for(var c=a.w.N,d=[],e=null,f=a.w.pa,g=-1;c && 1 == c.nodeType;) {var h=f && f.root == c;if(!h || 2 == f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e = e || Ba(c);}h?(c = f.la,f = f.Xc):(c = c.parentNode,g++);}c = Fb(a.b,"em",!g);c = {"font-size":new V(new D(c,"px"),0)};f = new Lh(c,a.b);for(g = d.length - 1;0 <= g;--g) {var h=d[g],l=[],k;for(k in h) oh[k] && l.push(k);l.sort(Od);for(var m=0;m < l.length;m++) {var p=l[m];f.f = p;var q=h[p];q.value !== ed && (c[p] = q.ud(f));}}for(var r in b) oh[r] || (c[r] = b[r]);return {lang:e,ab:c};}var Mq={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Nq(a,b){b = oa(b,a.aa.url);return a.G[b] || b;}function Oq(a){a.w.lang = Ba(a.w.N) || a.w.parent && a.w.parent.lang || a.w.lang;}function Pq(a,b){var c=qh().filter(function(a){return b[a];});if(c.length){var d=a.w.wb;if(a.w.parent){var d=a.w.wb = {},e;for(e in a.w.parent.wb) d[e] = a.w.parent.wb[e];}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Ec)d[a] = c.M;else if(c instanceof Cc)d[a] = c.name;else if(c instanceof D)switch(c.ga){case "dpi":case "dpcm":case "dppx":d[a] = c.M * Bb[c.ga];}else d[a] = c;delete b[a];}});}}function Qq(a,b,c,d,e,f){for(var g=Sd("RESOLVE_FORMATTING_CONTEXT"),h=0;h < g.length;h++) {var l=g[h](a,b,c,d,e,f);if(l){a.D = l;break;}}}function Rq(a,b,c){var d=!0,e=J("createElementView"),f=a.N,g=a.w.pa?a.w.pa.b:a.l,h=g.l(f,!1);if(!a.w.pa){var l=Kj(a.aa,f);Sq(l,a.w.Ka,0);}var k={};a.w.parent || (l = Lq(a,h),h = l.ab,a.w.lang = l.lang);var m=h["float-reference"] && zm(h["float-reference"].value.toString());a.w.parent && m && Am(m) && (l = Lq(a,h),h = l.ab,a.w.lang = l.lang);a.w.u = Kq(a,a.w.u,h,k);g.na(f,k);Pq(a,k);Oq(a);k.direction && (a.w.wa = k.direction.toString());if((l = k["flow-into"]) && l.toString() != a.H)return M(e,!1),e.result();var p=k.display;if(p === H)return M(e,!1),e.result();var q=!a.w.parent;a.w.I = p === $c;Jq(a,f,q,h,k,g,a.b,a.w.pa).then(function(l){a.w.Aa = l;l = k.position;var r=k["float"],u=k.clear,A=a.w.u?Gd:dd,I=a.w.parent?a.w.parent.u?Gd:dd:A,E="true" === f.getAttribute("data-vivliostyle-flow-root");a.w.Rc = tq(p,l,r,k.overflow,A,I,E);a.w.O = l === sd || l === Jc || l === Zc;Mk(a.w) && (u !== Kc && (u = null),r === ad || m && Am(m) || (r = null));A = r === kd || r === td || r === Dd || r === Rc || r === id || r === hd || r === Pc || r === Oc || r === vd || r === ad;r && (delete k["float"],r === ad && (a.f?(A = !1,k.display = Nc):k.display = fd));u && (u === ed && a.w.parent && a.w.parent.A && (u = C(a.w.parent.A)),u === kd || u === td || u === Qc || u === Kc) && (delete k.clear,k.display && k.display != fd && (a.w.A = u.toString()));var F=p === md && k["ua-list-item-count"];(A || k["break-inside"] && k["break-inside"] !== Mc) && a.w.j++;if(!(u = !A && !p))a: switch(p.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":u = !0;break a;default:u = !1;}if(!u)a: switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u = !0;break a;default:u = !1;}a.w.sa = u;a.w.display = p?p.toString():"inline";a.w.za = A?r.toString():null;a.w.H = m || Gk;a.w.Y = k["column-span"];if(!a.w.sa){if(u = k["break-after"])a.w.G = u.toString();if(u = k["break-before"])a.w.g = u.toString();}a.w.W = k["vertical-align"] && k["vertical-align"].toString() || "baseline";a.w.ha = k["caption-side"] && k["caption-side"].toString() || "top";u = k["border-collapse"];if(!u || u === C("separate"))if(A = k["border-spacing"])A.yd()?(u = A.values[0],A = A.values[1]):u = A,u.kc() && (a.w.ia = Ic(u,a.b)),A.kc() && (a.w.Sd = Ic(A,a.b));a.w.T = k["footnote-policy"];if(u = k["x-first-pseudo"])a.w.f = new Fk(a.w.parent?a.w.parent.f:null,u.M);a.w.sa || Tq(a,f,h,g,a.b);if(u = k["white-space"])u = ok(u.toString()),null !== u && (a.w.bc = u);(u = k["hyphenate-character"]) && u !== Mc && (a.w.F = u.Ic);u = k["overflow-wrap"] || ["word-wrap"];a.w.l = k["word-break"] === Tc || u === Uc;Qq(a.w,b,p,l,r,q);a.w.parent && a.w.parent.D && (b = a.w.parent.D.Je(a.w,b));a.w.sa || (a.w.h = Uq(k),Vq(a,f,g));var U=!1,Qa=null,Ea=[],va=f.namespaceURI,L=f.localName;if("http://www.w3.org/1999/xhtml" == va)"html" == L || "body" == L || "script" == L || "link" == L || "meta" == L?L = "div":"vide_" == L?L = "video":"audi_" == L?L = "audio":"object" == L && (U = !!a.g),f.getAttribute("data-adapt-pseudo") && h.content && h.content.value && h.content.value.url && (L = "img");else if("http://www.idpf.org/2007/ops" == va)L = "span",va = "http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0" == va){va = "http://www.w3.org/1999/xhtml";if("image" == L){if((L = "div",(l = f.getAttributeNS("http://www.w3.org/1999/xlink","href")) && "#" == l.charAt(0) && (l = Pj(a.aa,l))))Qa = Wq(a,va,"img"),l = "data:" + (l.getAttribute("content-type") || "image/jpeg") + ";base64," + l.textContent.replace(/[ \t\n\t]/g,""),Ea.push(ue(Qa,l));}else L = Mq[L];L || (L = a.w.sa?"span":"div");}else if("http://www.daisy.org/z3986/2005/ncx/" == va)if((va = "http://www.w3.org/1999/xhtml","ncx" == L || "navPoint" == L))L = "div";else if("navLabel" == L){if((L = "span",r = f.parentNode)){l = null;for(r = r.firstChild;r;r = r.nextSibling) if(1 == r.nodeType && (u = r,"http://www.daisy.org/z3986/2005/ncx/" == u.namespaceURI && "content" == u.localName)){l = u.getAttribute("src");break;}l && (L = "a",f = f.ownerDocument.createElementNS(va,"a"),f.setAttribute("href",l));}}else L = "span";else "http://www.pyroxy.com/ns/shadow" == va?(va = "http://www.w3.org/1999/xhtml",L = a.w.sa?"span":"div"):U = !!a.g;F?b?L = "li":(L = "div",p = Nc,k.display = p):"body" == L || "li" == L?L = "div":"q" == L?L = "span":"a" == L && (l = k["hyperlink-processing"]) && "normal" != l.toString() && (L = "span");k.behavior && "none" != k.behavior.toString() && a.g && (U = !0);f.dataset && "true" === f.getAttribute("data-math-typeset") && (U = !0);var Fa;U?Fa = a.g(f,a.w.parent?a.w.parent.B:null,k):Fa = K(null);Fa.then(function(g){g?U && (d = "true" == g.getAttribute("data-adapt-process-children")):g = Wq(a,va,L);"a" == L && g.addEventListener("click",a.page.J,!1);Qa && (wo(a,a.w,"inner",Qa),g.appendChild(Qa));"iframe" == g.localName && "http://www.w3.org/1999/xhtml" == g.namespaceURI && Aq(g);var h=a.w.wb["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m === Mc || !m && !q,p=p === Mc || !p && !r;if("http://www.gribuser.ru/xml/fictionbook/2.0" != f.namespaceURI || "td" == L){for(var q=f.attributes,u=q.length,r=null,z=0;z < u;z++) {var A=q[z],I=A.namespaceURI,E=A.localName,A=A.nodeValue;if(I)if("http://www.w3.org/2000/xmlns/" == I)continue;else "http://www.w3.org/1999/xlink" == I && "href" == E && (A = Nq(a,A));else {if(E.match(/^on/))continue;if("style" == E)continue;if(("id" == E || "name" == E) && b){A = a.j.re(A,a.aa.url);g.setAttribute(E,A);lk(a.page,g,A);continue;}"src" == E || "href" == E || "poster" == E?(A = Nq(a,A),"href" === E && (A = a.j.gd(A,a.aa.url))):"srcset" == E && (A = A.split(",").map(function(b){return Nq(a,b.trim());}).join(","));if("poster" === E && "video" === L && "http://www.w3.org/1999/xhtml" === va && m && p){var Fa=new Image(),vb=ue(Fa,A);Ea.push(vb);l.push({vf:Fa,element:g,pf:vb});}}"http://www.w3.org/2000/svg" == va && /^[A-Z\-]+$/.test(E) && (E = E.toLowerCase());-1 != Xq.indexOf(E.toLowerCase()) && (A = uq(A,a.aa.url,a.j));I && (Fa = zq[I]) && (E = Fa + ":" + E);"src" != E || I || "img" != L && "input" != L || "http://www.w3.org/1999/xhtml" != va?"href" == E && "image" == L && "http://www.w3.org/2000/svg" == va && "http://www.w3.org/1999/xlink" == I?a.page.j.push(ue(g,A)):I?g.setAttributeNS(I,E,A):g.setAttribute(E,A):r = A;}r && (Fa = "input" === L?new Image():g,q = ue(Fa,r),Fa !== g && (g.src = r),m || p?(m && p && h && 1 !== h && l.push({vf:Fa,element:g,pf:q}),Ea.push(q)):a.page.j.push(q));}delete k.content;(m = k["list-style-image"]) && m instanceof Gc && (m = m.url,Ea.push(ue(new Image(),m)));Yq(a,k);Zq(a,g,k);if(!a.w.sa && (m = null,b?c && (m = a.w.u?yq:xq):m = "clone" !== a.w.wb["box-decoration-break"]?a.w.u?wq:vq:a.w.u?yq:xq,m))for(var Vo in m) w(g,Vo,m[Vo]);F && g.setAttribute("value",k["ua-list-item-count"].stringValue());a.B = g;Ea.length?te(Ea).then(function(){0 < h && $q(a,l,h,k,a.w.u);M(e,d);}):me().then(function(){M(e,d);});});});return e.result();}function Tq(a,b,c,d,e){var f=Gq(c,a.A,a.f,e);f && f["after-if-continues"] && f["after-if-continues"].content && (a.w.J = new ar(b,new Eq(b,c,d,e)));}var Xq="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");function $q(a,b,c,d,e){b.forEach(function(b){if("load" === b.pf.get().get()){var f=b.vf,h=f.width / c,f=f.height / c;b = b.element;if(0 < h && 0 < f)if((d["box-sizing"] === Sc && (d["border-left-style"] !== H && (h += Ic(d["border-left-width"],a.b)),d["border-right-style"] !== H && (h += Ic(d["border-right-width"],a.b)),d["border-top-style"] !== H && (f += Ic(d["border-top-width"],a.b)),d["border-bottom-style"] !== H && (f += Ic(d["border-bottom-width"],a.b))),1 < c)){var l=d["max-width"] || H,k=d["max-height"] || H;l === H && k === H?w(b,"max-width",h + "px"):l !== H && k === H?w(b,"width",h + "px"):l === H && k !== H?w(b,"height",f + "px"):"%" !== l.ga?w(b,"max-width",Math.min(h,Ic(l,a.b)) + "px"):"%" !== k.ga?w(b,"max-height",Math.min(f,Ic(k,a.b)) + "px"):e?w(b,"height",f + "px"):w(b,"width",h + "px");}else 1 > c && (l = d["min-width"] || Md,k = d["min-height"] || Md,l.M || k.M?l.M && !k.M?w(b,"width",h + "px"):!l.M && k.M?w(b,"height",f + "px"):"%" !== l.ga?w(b,"min-width",Math.max(h,Ic(l,a.b)) + "px"):"%" !== k.ga?w(b,"min-height",Math.max(f,Ic(k,a.b)) + "px"):e?w(b,"height",f + "px"):w(b,"width",h + "px"):w(b,"min-width",h + "px"));}});}function Yq(a,b){Sd("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.w,b);});}function Vq(a,b,c){for(b = b.firstChild;b;b = b.nextSibling) if(1 === b.nodeType){var d={},e=c.l(b,!1);Kq(a,a.w.u,e,d);if(Uq(d)){if(a.w.D instanceof So && !Ok(a.w,a.w.D))break;c = a.w.parent;a.w.D = new So(c && c.D,a.w.N);br(a.w.D,a.w.u);break;}}}function Uq(a){var b=a["repeat-on-break"];return b !== H && (b === Mc && (b = a.display === Cd?cd:a.display === Bd?bd:H),b && b !== H)?b.toString():null;}function cr(a){var b=J("createTextNodeView");dr(a).then(function(){var c=a.ka || 0,c=er(a.w.Ia).substr(c);a.B = document.createTextNode(c);M(b,!0);});return b.result();}function dr(a){if(a.w.Ia)return K(!0);var b,c=b = a.N.textContent,d=J("preprocessTextContent"),e=Sd("PREPROCESS_TEXT_CONTENT"),f=0;oe(function(){return f >= e.length?K(!1):e[f++](a.w,c).fa(function(a){c = a;return K(!0);});}).then(function(){a.w.Ia = fr(b,c,0);M(d,!0);});return d.result();}function gr(a,b,c){var d=J("createNodeView"),e=!0;1 == a.N.nodeType?b = Rq(a,b,c):8 == a.N.nodeType?(a.B = null,b = K(!0)):b = cr(a);b.then(function(b){e = b;(a.w.B = a.B) && (b = a.w.parent?a.w.parent.B:a.O) && b.appendChild(a.B);M(d,e);});return d.result();}function Un(a,b,c,d){(a.w = b)?(a.N = b.N,a.ka = b.ka):(a.N = null,a.ka = -1);a.B = null;return a.w?gr(a,c,!!d):K(!0);}function hr(a){if(null == a.pa || "content" != a.N.localName || "http://www.pyroxy.com/ns/shadow" != a.N.namespaceURI)return a;var b=a.Ca,c=a.pa,d=a.parent,e,f;c.Ue?(f = c.Ue,e = c.root,c = c.type,2 == c && (e = e.firstChild)):(f = c.Xc,e = c.la.firstChild,c = 2);var g=a.N.nextSibling;g?(a.N = g,Hk(a)):a.va?a = a.va:e?a = null:(a = a.parent.modify(),a.K = !0);if(e)return b = new Bk(e,d,b),b.pa = f,b.Za = c,b.va = a,b;a.Ca = b;return a;}function ir(a){var b=a.Ca + 1;if(a.K){if(!a.parent)return null;if(3 != a.Za){var c=a.N.nextSibling;if(c)return a = a.modify(),a.Ca = b,a.N = c,Hk(a),hr(a);}if(a.va)return a = a.va.modify(),a.Ca = b,a;a = a.parent.modify();}else {if(a.Aa && (c = a.Aa.root,2 == a.Aa.type && (c = c.firstChild),c))return b = new Bk(c,a,b),b.pa = a.Aa,b.Za = a.Aa.type,hr(b);if(c = a.N.firstChild)return hr(new Bk(c,a,b));1 != a.N.nodeType && (c = er(a.Ia),b += c.length - 1 - a.ka);a = a.modify();}a.Ca = b;a.K = !0;return a;}function jm(a,b,c){b = ir(b);if(!b || b.K)return K(b);var d=J("nextInTree");Un(a,b,!0,c).then((function(a){b.B && a || (b = b.modify(),b.K = !0,b.B || (b.sa = !0));Va(this,{type:"nextInTree",w:b});M(d,b);}).bind(a));return d.result();}function jr(a,b){if(b instanceof vc)for(var c=b.values,d=0;d < c.length;d++) jr(a,c[d]);else b instanceof Gc && (c = b.url,a.page.j.push(ue(new Image(),c)));}var kr={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0,"footnote-policy":!0};function Zq(a,b,c){var d=c["background-image"];d && jr(a,d);var d=c.position === sd,e;for(e in c) if(!kr[e]){var f=c[e],f=f.ba(new Cg(a.aa.url,a.j));f.kc() && Cb(f.ga) && (f = new D(Ic(f,a.b),"px"));dk[e] || d && ek[e]?a.page.A.push(new fk(b,e,f)):w(b,e,f.toString());}}function wo(a,b,c,d){if(!b.K){var e=(b.pa?b.pa.b:a.l).l(a.N,!1);if(e = e._pseudos)if(e = e[c])c = {},b.u = Kq(a,b.u,e,c),b = c.content,kl(b) && (b.ba(new jl(d,a.b,b)),delete c.content),Zq(a,d,c);}}function Xn(a,b,c){var d=J("peelOff"),e=b.f,f=b.ka,g=b.K;if(0 < c)b.B.textContent = b.B.textContent.substr(0,c),f += c;else if(!g && b.B && !f){var h=b.B.parentNode;h && h.removeChild(b.B);}for(var l=b.Ca + c,k=[];b.f === e;) k.push(b),b = b.parent;var m=k.pop(),p=m.va;oe(function(){for(;0 < k.length;) {m = k.pop();b = new Bk(m.N,b,l);k.length || (b.ka = f,b.K = g);b.Za = m.Za;b.pa = m.pa;b.Aa = m.Aa;b.va = m.va?m.va:p;p = null;var c=Un(a,b,!1);if(c.Pa())return c;}return K(!1);}).then(function(){M(d,b);});return d.result();}function Wq(a,b,c){return "http://www.w3.org/1999/xhtml" == b?a.F.createElement(c):a.F.createElementNS(b,c);}function dp(a){a && Nk(a,function(a){var b=a.wb["box-decoration-break"];b && "slice" !== b || (b = a.B,a.u?(w(b,"padding-left","0"),w(b,"border-left","none"),w(b,"border-top-left-radius","0"),w(b,"border-bottom-left-radius","0")):(w(b,"padding-bottom","0"),w(b,"border-bottom","none"),w(b,"border-bottom-left-radius","0"),w(b,"border-bottom-right-radius","0")));});}function lr(a){this.b = a.h;this.window = a.window;}function mr(a,b){var c=b.left,d=b.top;return {left:a.left - c,top:a.top - d,right:a.right - c,bottom:a.bottom - d,width:a.width,height:a.height};}function Fn(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return mr(a,d);},a);}function nk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return mr(c,d);}function lo(a,b){return a.window.getComputedStyle(b,null);}function nr(a,b,c,d,e){this.window = a;this.fontSize = b;this.b = a.document;this.root = c || this.b.body;b = this.root.firstElementChild;b || (b = this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c = b.firstElementChild;c || (c = this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f || (f = this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));this.g = b;this.f = c;this.h = f;b = lo(new lr(this),this.root);this.width = d || parseFloat(b.width) || a.innerWidth;this.height = e || parseFloat(b.height) || a.innerHeight;}nr.prototype.zoom = function(a,b,c){w(this.g,"width",a * c + "px");w(this.g,"height",b * c + "px");w(this.f,"width",a + "px");w(this.f,"height",b + "px");w(this.f,"transform","scale(" + c + ")");};var xo="min-content inline size",sn="fit-content inline size";function rn(a,b,c){function d(c){return lo(a,b).getPropertyValue(c);}function e(){w(b,"display","block");w(b,"position","static");return d(Qa);}function f(){w(b,"display","inline-block");w(E,Qa,"99999999px");var a=d(Qa);w(E,Qa,"");return a;}function g(){w(b,"display","inline-block");w(E,Qa,"0");var a=d(Qa);w(E,Qa,"");return a;}function h(){var a=e(),b=g(),c=parseFloat(a);if(c <= parseFloat(b))return b;b = f();return c <= parseFloat(b)?a:b;}function l(){throw Error("Getting fill-available block size is not implemented");}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,I=b.parentNode,E=b.ownerDocument.createElement("div");w(E,"position",m);I.insertBefore(E,b);E.appendChild(b);w(b,"width","auto");w(b,"max-width","none");w(b,"min-width","0");w(b,"height","auto");w(b,"max-height","none");w(b,"min-height","0");var F=za("writing-mode"),F=(F?d(F[0]):null) || d("writing-mode"),U="vertical-rl" === F || "tb-rl" === F || "vertical-lr" === F || "tb-lr" === F,Qa=U?"height":"width",Ea=U?"width":"height",va={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c = e();break;case "max-content inline size":c = f();break;case xo:c = g();break;case sn:c = h();break;case "fill-available block size":c = l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c = d(Ea);break;case "fill-available width":c = U?l():e();break;case "fill-available height":c = U?e():l();break;case "max-content width":c = U?d(Ea):f();break;case "max-content height":c = U?f():d(Ea);break;case "min-content width":c = U?d(Ea):g();break;case "min-content height":c = U?g():d(Ea);break;case "fit-content width":c = U?d(Ea):h();break;case "fit-content height":c = U?h():d(Ea);}va[a] = parseFloat(c);w(b,"position",m);w(b,"display",k);});w(b,"width",p);w(b,"max-width",q);w(b,"min-width",r);w(b,"height",z);w(b,"max-height",u);w(b,"min-height",A);I.insertBefore(b,E);I.removeChild(E);return va;};function or(a){var b=a["writing-mode"],b=b && b.value;a = (a = a.direction) && a.value;return b === Fd || b !== Gd && a !== xd?"ltr":"rtl";}var pr={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),height:new D(17,"in")}},qr=new D(.24,"pt"),rr=new D(3,"mm"),sr=new D(10,"mm"),tr=new D(13,"mm");function ur(a){var b={width:Kd,height:Ld,ec:Md,Kb:Md},c=a.size;if(c && c.value !== Mc){var d=c.value;d.yd()?(c = d.values[0],d = d.values[1]):(c = d,d = null);if(c.kc())b.width = c,b.height = d || c;else if(c = pr[c.name.toLowerCase()])d && d === jd?(b.width = c.height,b.height = c.width):(b.width = c.width,b.height = c.height);}(c = a.marks) && c.value !== H && (b.Kb = tr);a = a.bleed;a && a.value !== Mc?a.value && a.value.kc() && (b.ec = a.value):c && (a = !1,c.value.yd()?a = c.value.values.some(function(a){return a === Vc;}):a = c.value === Vc,a && (b.ec = new D(6,"pt")));return b;}function vr(a,b){var c={},d=a.ec.M * Fb(b,a.ec.ga,!1),e=a.Kb.M * Fb(b,a.Kb.ga,!1),f=d + e,g=a.width;c.Ub = g === Kd?b.X.fc?b.X.fc.width * Fb(b,"px",!1):(b.X.rb?Math.floor(b.Sa / 2) - b.X.Fc:b.Sa) - 2 * f:g.M * Fb(b,g.ga,!1);g = a.height;c.Tb = g === Ld?b.X.fc?b.X.fc.height * Fb(b,"px",!1):b.Eb - 2 * f:g.M * Fb(b,g.ga,!1);c.ec = d;c.Kb = e;c.Xd = f;return c;}function wr(a,b,c){a = a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position = "absolute";return a;}function xr(a,b,c){a = a.createElementNS("http://www.w3.org/2000/svg",c || "polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a;}var yr={Hg:"top left",Ig:"top right",ug:"bottom left",vg:"bottom right"};function zr(a,b,c,d,e,f){var g=d;g <= e + 2 * Bb.mm && (g = e + d / 2);var h=Math.max(d,g),l=e + h + c / 2,k=wr(a,l,l),g=[[0,e + d],[d,e + d],[d,e + d - g]];d = g.map(function(a){return [a[1],a[0]];});if("top right" === b || "bottom right" === b)g = g.map(function(a){return [e + h - a[0],a[1]];}),d = d.map(function(a){return [e + h - a[0],a[1]];});if("bottom left" === b || "bottom right" === b)g = g.map(function(a){return [a[0],e + h - a[1]];}),d = d.map(function(a){return [a[0],e + h - a[1]];});l = xr(a,c);l.setAttribute("points",g.map(function(a){return a.join(",");}).join(" "));k.appendChild(l);a = xr(a,c);a.setAttribute("points",d.map(function(a){return a.join(",");}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a] = f + "px";});return k;}var Ar={Gg:"top",tg:"bottom",Pf:"left",Qf:"right"};function Br(a,b,c,d,e){var f=2 * d,g;"top" === b || "bottom" === b?(g = f,f = d):g = d;var h=wr(a,g,f),l=xr(a,c);l.setAttribute("points","0," + f / 2 + " " + g + "," + f / 2);h.appendChild(l);l = xr(a,c);l.setAttribute("points",g / 2 + ",0 " + g / 2 + "," + f);h.appendChild(l);a = xr(a,c,"circle");a.setAttribute("cx",g / 2);a.setAttribute("cy",f / 2);a.setAttribute("r",d / 4);h.appendChild(a);var k;switch(b){case "top":k = "bottom";break;case "bottom":k = "top";break;case "left":k = "right";break;case "right":k = "left";}Object.keys(Ar).forEach(function(a){a = Ar[a];a === b?h.style[a] = e + "px":a !== k && (h.style[a] = "0",h.style["margin-" + a] = "auto");});return h;}function Cr(a,b,c,d){var e=!1,f=!1;if(a = a.marks)a = a.value,a.yd()?a.values.forEach(function(a){a === Vc?e = !0:a === Wc && (f = !0);}):a === Vc?e = !0:a === Wc && (f = !0);if(e || f){var g=c.L,h=g.ownerDocument,l=b.ec,k=Ic(qr,d),m=Ic(rr,d),p=Ic(sr,d);e && Object.keys(yr).forEach(function(a){a = zr(h,yr[a],k,p,l,m);g.appendChild(a);});f && Object.keys(Ar).forEach(function(a){a = Br(h,Ar[a],k,p,m);g.appendChild(a);});}}var Dr=(function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-" + b] = !0;a["padding-" + b] = !0;a["border-" + b + "-width"] = !0;a["border-" + b + "-style"] = !0;a["border-" + b + "-color"] = !0;});return a;})(),Er={"top-left-corner":{order:1,Oa:!0,La:!1,Ma:!0,Na:!0,ua:null},"top-left":{order:2,Oa:!0,La:!1,Ma:!1,Na:!1,ua:"start"},"top-center":{order:3,Oa:!0,La:!1,Ma:!1,Na:!1,ua:"center"},"top-right":{order:4,Oa:!0,La:!1,Ma:!1,Na:!1,ua:"end"},"top-right-corner":{order:5,Oa:!0,La:!1,Ma:!1,Na:!0,ua:null},"right-top":{order:6,Oa:!1,La:!1,Ma:!1,Na:!0,ua:"start"},"right-middle":{order:7,Oa:!1,La:!1,Ma:!1,Na:!0,ua:"center"},"right-bottom":{order:8,Oa:!1,La:!1,Ma:!1,Na:!0,ua:"end"},"bottom-right-corner":{order:9,Oa:!1,La:!0,Ma:!1,Na:!0,ua:null},"bottom-right":{order:10,Oa:!1,La:!0,Ma:!1,Na:!1,ua:"end"},"bottom-center":{order:11,Oa:!1,La:!0,Ma:!1,Na:!1,ua:"center"},"bottom-left":{order:12,Oa:!1,La:!0,Ma:!1,Na:!1,ua:"start"},"bottom-left-corner":{order:13,Oa:!1,La:!0,Ma:!0,Na:!1,ua:null},"left-bottom":{order:14,Oa:!1,La:!1,Ma:!0,Na:!1,ua:"end"},"left-middle":{order:15,Oa:!1,La:!1,Ma:!0,Na:!1,ua:"center"},"left-top":{order:16,Oa:!1,La:!1,Ma:!0,Na:!1,ua:"start"}},Fr=Object.keys(Er).sort(function(a,b){return Er[a].order - Er[b].order;});function Gr(a,b,c){Ep.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a = ur(c);new Hr(this.f,this,c,a);this.F = {};Ir(this,c);this.b.position = new V(sd,0);this.b.width = new V(a.width,0);this.b.height = new V(a.height,0);for(var d in c) Dr[d] || "background-clip" === d || (this.b[d] = c[d]);}t(Gr,Ep);function Ir(a,b){var c=b._marginBoxes;c && Fr.forEach(function(d){c[d] && (a.F[d] = new Jr(a.f,a,d,b));});}Gr.prototype.h = function(a){return new Kr(a,this);};function Hr(a,b,c,d){Ip.call(this,a,null,null,[],b);this.G = d;this.b["z-index"] = new V(new Ec(0),0);this.b["flow-from"] = new V(C("body"),0);this.b.position = new V(Jc,0);this.b.overflow = new V(Hd,0);for(var e in Dr) Dr.hasOwnProperty(e) && (this.b[e] = c[e]);}t(Hr,Ip);Hr.prototype.h = function(a){return new Lr(a,this);};function Jr(a,b,c,d){Ip.call(this,a,null,null,[],b);this.C = c;a = d._marginBoxes[this.C];for(var e in d) if((b = d[e],c = a[e],oh[e] || c && c.value === ed))this.b[e] = b;for(e in a) Object.prototype.hasOwnProperty.call(a,e) && (b = a[e]) && b.value !== ed && (this.b[e] = b);}t(Jr,Ip);Jr.prototype.h = function(a){return new Mr(a,this);};function Kr(a,b){Fp.call(this,a,b);this.l = null;this.na = {};}t(Kr,Fp);Kr.prototype.j = function(a,b){var c=this.J,d;for(d in b) if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d] = b[d];}Fp.prototype.j.call(this,a,b);};Kr.prototype.de = function(){var a=this.style;a.left = Md;a["margin-left"] = Md;a["border-left-width"] = Md;a["padding-left"] = Md;a["padding-right"] = Md;a["border-right-width"] = Md;a["margin-right"] = Md;a.right = Md;};Kr.prototype.ee = function(){var a=this.style;a.top = Md;a["margin-top"] = Md;a["border-top-width"] = Md;a["padding-top"] = Md;a["padding-bottom"] = Md;a["border-bottom-width"] = Md;a["margin-bottom"] = Md;a.bottom = Md;};Kr.prototype.Y = function(a,b,c){b = b.I;var d={start:this.l.marginLeft,end:this.l.marginRight,oa:this.l.zc},e={start:this.l.marginTop,end:this.l.marginBottom,oa:this.l.yc};Nr(this,b.top,!0,d,a,c);Nr(this,b.bottom,!0,d,a,c);Nr(this,b.left,!1,e,a,c);Nr(this,b.right,!1,e,a,c);};function Or(a,b,c,d,e){this.L = a;this.F = e;this.j = c;this.C = !Y(d,b[c?"width":"height"],new hc(d,0,"px"));this.l = null;}Or.prototype.b = function(){return this.C;};function Pr(a){a.l || (a.l = rn(a.F,a.L.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l;}Or.prototype.g = function(){var a=Pr(this);return this.j?Zk(this.L) + a["max-content width"] + $k(this.L):Xk(this.L) + a["max-content height"] + Yk(this.L);};Or.prototype.h = function(){var a=Pr(this);return this.j?Zk(this.L) + a["min-content width"] + $k(this.L):Xk(this.L) + a["min-content height"] + Yk(this.L);};Or.prototype.f = function(){return this.j?Zk(this.L) + this.L.width + $k(this.L):Xk(this.L) + this.L.height + Yk(this.L);};function Qr(a){this.j = a;}Qr.prototype.b = function(){return this.j.some(function(a){return a.b();});};Qr.prototype.g = function(){var a=this.j.map(function(a){return a.g();});return Math.max.apply(null,a) * a.length;};Qr.prototype.h = function(){var a=this.j.map(function(a){return a.h();});return Math.max.apply(null,a) * a.length;};Qr.prototype.f = function(){var a=this.j.map(function(a){return a.f();});return Math.max.apply(null,a) * a.length;};function Rr(a,b,c,d,e,f){Or.call(this,a,b,c,d,e);this.A = f;}t(Rr,Or);Rr.prototype.b = function(){return !1;};Rr.prototype.g = function(){return this.f();};Rr.prototype.h = function(){return this.f();};Rr.prototype.f = function(){return this.j?Zk(this.L) + this.A + $k(this.L):Xk(this.L) + this.A + Yk(this.L);};function Nr(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b) {var p=Er[m];if(p){var q=b[m],r=a.na[m],z=new Or(q,r.style,c,g,f);h[p.ua] = q;l[p.ua] = r;k[p.ua] = z;}}a = d.start.evaluate(e);d.end.evaluate(e);b = d.oa.evaluate(e);var u=Sr(k,b),A=!1,I={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.oa);b && (b = b.evaluate(e),u[a] > b && (b = k[a] = new Rr(h[a],l[a].style,c,g,f,b),I[a] = b.f(),A = !0));});A && (u = Sr(k,b),A = !1,["start","center","end"].forEach(function(a){u[a] = I[a] || u[a];}));var E={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.oa);b && (b = b.evaluate(e),u[a] < b && (b = k[a] = new Rr(h[a],l[a].style,c,g,f,b),E[a] = b.f(),A = !0));});A && (u = Sr(k,b),["start","center","end"].forEach(function(a){u[a] = E[a] || u[a];}));var F=a + b,U=a + (a + b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e = c?d.left:d.top;break;case "center":e = (U - b) / 2;break;case "end":e = F - b;}c?dl(d,e,b - Zk(d) - $k(d)):cl(d,e,b - Xk(d) - Yk(d));}});}function Sr(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a;}),g=Tr(d,g.length?new Qr(g):null,b);g.mb && (f.center = g.mb);d = g.mb || d.f();d = (b - d) / 2;c && c.b() && (f.start = d);e && e.b() && (f.end = d);}else c = Tr(c,e,b),c.mb && (f.start = c.mb),c.kd && (f.end = c.kd);return f;}function Tr(a,b,c){var d={mb:null,kd:null};if(a && b)if(a.b() && b.b()){var e=a.g(),f=b.g();0 < e && 0 < f?(f = e + f,f < c?d.mb = c * e / f:(a = a.h(),b = b.h(),b = a + b,b < c?d.mb = a + (c - b) * (e - a) / (f - b):0 < b && (d.mb = c * a / b)),0 < d.mb && (d.kd = c - d.mb)):0 < e?d.mb = c:0 < f && (d.kd = c);}else a.b()?d.mb = Math.max(c - b.f(),0):b.b() && (d.kd = Math.max(c - a.f(),0));else a?a.b() && (d.mb = c):b && b.b() && (d.kd = c);return d;}Kr.prototype.Vb = function(a,b,c,d,e){Kr.Nf.Vb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0);};function Lr(a,b){Jp.call(this,a,b);this.marginLeft = this.marginBottom = this.marginRight = this.marginTop = this.yc = this.zc = null;}t(Lr,Jp);Lr.prototype.j = function(a,b){var c=this.J,d;for(d in b) Object.prototype.hasOwnProperty.call(b,d) && (d.match(/^column.*$/) || d.match(/^background-/)) && (c[d] = b[d]);Jp.prototype.j.call(this,a,b);d = this.f;c = {zc:this.zc,yc:this.yc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l = c;d = d.style;d.width = new G(c.zc);d.height = new G(c.yc);d["padding-left"] = new G(c.marginLeft);d["padding-right"] = new G(c.marginRight);d["padding-top"] = new G(c.marginTop);d["padding-bottom"] = new G(c.marginBottom);};Lr.prototype.de = function(){var a=Ur(this,{start:"left",end:"right",oa:"width"});this.zc = a.df;this.marginLeft = a.Ff;this.marginRight = a.Ef;};Lr.prototype.ee = function(){var a=Ur(this,{start:"top",end:"bottom",oa:"height"});this.yc = a.df;this.marginTop = a.Ff;this.marginBottom = a.Ef;};function Ur(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.oa,h=a.b.G[g].ta(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-" + e],h),m=Y(d,c["margin-" + f],h),p=Kp(d,c["padding-" + e],h),q=Kp(d,c["padding-" + f],h),r=Mp(d,c["border-" + e + "-width"],c["border-" + e + "-style"],h),z=Mp(d,c["border-" + f + "-width"],c["border-" + f + "-style"],h),u=y(d,h,x(d,x(d,r,p),x(d,z,q)));l?(u = y(d,u,l),k || m?k?m = y(d,u,k):k = y(d,u,m):m = k = pc(d,u,new wb(d,.5))):(k || (k = d.b),m || (m = d.b),l = y(d,u,x(d,k,m)));c[e] = new G(k);c[f] = new G(m);c["margin-" + e] = Md;c["margin-" + f] = Md;c["padding-" + e] = new G(p);c["padding-" + f] = new G(q);c["border-" + e + "-width"] = new G(r);c["border-" + f + "-width"] = new G(z);c[g] = new G(l);c["max-" + g] = new G(l);return {df:y(d,h,x(d,k,m)),Ff:k,Ef:m};}Lr.prototype.Vb = function(a,b,c,d,e){Jp.prototype.Vb.call(this,a,b,c,d,e);c.O = b.element;};function Mr(a,b){Jp.call(this,a,b);var c=b.C;this.l = Er[c];a.na[c] = this;this.ra = !0;}t(Mr,Jp);n = Mr.prototype;n.Vb = function(a,b,c,d,e){var f=b.element;w(f,"display","flex");var g=Wp(this,a,"vertical-align"),h=null;g === C("middle")?h = "center":g === C("top")?h = "flex-start":g === C("bottom") && (h = "flex-end");h && (w(f,"flex-flow",this.u?"row":"column"),w(f,"justify-content",h));Jp.prototype.Vb.call(this,a,b,c,d,e);};n.ua = function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left" === e,h=g?b.zc:b.yc,l=Y(d,c[a.oa],h),g=g?b.marginLeft:b.marginTop;if("start" === this.l.ua)c[e] = new G(g);else if(l){var k=Kp(d,c["margin-" + e],h),m=Kp(d,c["margin-" + f],h),p=Kp(d,c["padding-" + e],h),q=Kp(d,c["padding-" + f],h),r=Mp(d,c["border-" + e + "-width"],c["border-" + e + "-style"],h),f=Mp(d,c["border-" + f + "-width"],c["border-" + f + "-style"],h),l=x(d,l,x(d,x(d,p,q),x(d,x(d,r,f),x(d,k,m))));switch(this.l.ua){case "center":c[e] = new G(x(d,g,qc(d,y(d,h,l),new wb(d,2))));break;case "end":c[e] = new G(y(d,x(d,g,h),l));}}};function Vr(a,b,c){function d(a){if(u)return u;u = {oa:z?z.evaluate(a):null,eb:l?l.evaluate(a):null,fb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b && (c += b.evaluate(a));});(null === u.eb || null === u.fb) && c + u.oa + u.eb + u.fb > b && (null === u.eb && (u.eb = 0),null === u.fb && (u.Ng = 0));null !== u.oa && null !== u.eb && null !== u.fb && (u.fb = null);null === u.oa && null !== u.eb && null !== u.fb?u.oa = b - c - u.eb - u.fb:null !== u.oa && null === u.eb && null !== u.fb?u.eb = b - c - u.oa - u.fb:null !== u.oa && null !== u.eb && null === u.fb?u.fb = b - c - u.oa - u.eb:null === u.oa?(u.eb = u.fb = 0,u.oa = b - c):u.eb = u.fb = (b - c - u.oa) / 2;return u;}var e=a.style;a = a.b.f;var f=b.fe,g=b.ke;b = b.oa;var h=c["margin" + g.charAt(0).toUpperCase() + g.substring(1)],l=Lp(a,e["margin-" + f],h),k=Lp(a,e["margin-" + g],h),m=Kp(a,e["padding-" + f],h),p=Kp(a,e["padding-" + g],h),q=Mp(a,e["border-" + f + "-width"],e["border-" + f + "-style"],h),r=Mp(a,e["border-" + g + "-width"],e["border-" + g + "-style"],h),z=Y(a,e[b],h),u=null;e[b] = new G(new yb(a,function(){var a=d(this).oa;return null === a?0:a;},b));e["margin-" + f] = new G(new yb(a,function(){var a=d(this).eb;return null === a?0:a;},"margin-" + f));e["margin-" + g] = new G(new yb(a,function(){var a=d(this).fb;return null === a?0:a;},"margin-" + g));"left" === f?e.left = new G(x(a,c.marginLeft,c.zc)):"top" === f && (e.top = new G(x(a,c.marginTop,c.yc)));}n.de = function(){var a=this.f.l;this.l.Ma?Vr(this,{fe:"right",ke:"left",oa:"width"},a):this.l.Na?Vr(this,{fe:"left",ke:"right",oa:"width"},a):this.ua({start:"left",end:"right",oa:"width"},a);};n.ee = function(){var a=this.f.l;this.l.Oa?Vr(this,{fe:"bottom",ke:"top",oa:"height"},a):this.l.La?Vr(this,{fe:"top",ke:"bottom",oa:"height"},a):this.ua({start:"top",end:"bottom",oa:"height"},a);};n.vd = function(a,b,c,d,e,f,g){Jp.prototype.vd.call(this,a,b,c,d,e,f,g);a = c.I;c = this.b.C;d = this.l;d.Ma || d.Na?d.Oa || d.La || (d.Ma?a.left[c] = b:d.Na && (a.right[c] = b)):d.Oa?a.top[c] = b:d.La && (a.bottom[c] = b);};function Wr(a,b,c,d,e){this.b = a;this.l = b;this.h = c;this.f = d;this.g = e;this.j = {};a = this.l;b = new ic(a,"page-number");b = new ac(a,new gc(a,b,new wb(a,2)),a.b);c = new Rb(a,b);a.values["recto-page"] = c;a.values["verso-page"] = b;"ltr" === or(this.g)?(a.values["left-page"] = b,b = new Rb(a,b),a.values["right-page"] = b):(c = new Rb(a,b),a.values["left-page"] = c,a.values["right-page"] = b);}function Xr(a){var b={};dj(a.b,[],"",b);a.b.pop();return b;}function Yr(a,b){var c=[],d;for(d in b) if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f = e instanceof V?e.value + "":Yr(a,e);c.push(d + f + (e.Ua || ""));}return c.sort().join("^");}function Zr(a,b,c){c = c.clone({Xb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=ur(b),e=e.Ua;d.width = Ch(a.f,d.width,new V(f.width,e));d.height = Ch(a.f,d.height,new V(f.height,e));}["counter-reset","counter-increment"].forEach(function(a){d[a] && (b[a] = d[a]);});c = c.h(a.h);c.j(a.b,a.g);lq(c,a.f);return c;}function $r(a){this.b = null;this.h = a;}t($r,W);$r.prototype.apply = function(a){a.Y === this.h && this.b.apply(a);};$r.prototype.f = function(){return 3;};$r.prototype.g = function(a){this.b && Th(a.Wc,this.h,this.b);return !0;};function as(a){this.b = null;this.h = a;}t(as,W);as.prototype.apply = function(a){1 === new ic(this.h,"page-number").evaluate(a.l) && this.b.apply(a);};as.prototype.f = function(){return 2;};function bs(a){this.b = null;this.h = a;}t(bs,W);bs.prototype.apply = function(a){new ic(this.h,"left-page").evaluate(a.l) && this.b.apply(a);};bs.prototype.f = function(){return 1;};function cs(a){this.b = null;this.h = a;}t(cs,W);cs.prototype.apply = function(a){new ic(this.h,"right-page").evaluate(a.l) && this.b.apply(a);};cs.prototype.f = function(){return 1;};function ds(a){this.b = null;this.h = a;}t(ds,W);ds.prototype.apply = function(a){new ic(this.h,"recto-page").evaluate(a.l) && this.b.apply(a);};ds.prototype.f = function(){return 1;};function es(a){this.b = null;this.h = a;}t(es,W);es.prototype.apply = function(a){new ic(this.h,"verso-page").evaluate(a.l) && this.b.apply(a);};es.prototype.f = function(){return 1;};function fs(a,b){Qh.call(this,a,b,null,null,null);}t(fs,Qh);fs.prototype.apply = function(a){var b=a.l,c=a.G,d=this.style;a = this.Z;Jh(b,c,d,a,null,null,null);if(d = d._marginBoxes){var c=Gh(c,"_marginBoxes"),e;for(e in d) if(d.hasOwnProperty(e)){var f=c[e];f || (f = {},c[e] = f);Jh(b,f,d[e],a,null,null,null);}}};function gs(a,b,c,d,e){oj.call(this,a,b,null,c,null,d,!1);this.T = e;this.I = [];this.g = "";this.G = [];}t(gs,oj);n = gs.prototype;n.Gc = function(){this.zb();};n.Hb = function(a,b){if(this.g = b)this.b.push(new $r(b)),this.Z += 65536;};n.Yc = function(a,b){b && tf(this,"E_INVALID_PAGE_SELECTOR :" + a + "(" + b.join("") + ")");this.G.push(":" + a);switch(a.toLowerCase()){case "first":this.b.push(new as(this.f));this.Z += 256;break;case "left":this.b.push(new bs(this.f));this.Z += 1;break;case "right":this.b.push(new cs(this.f));this.Z += 1;break;case "recto":this.b.push(new ds(this.f));this.Z += 1;break;case "verso":this.b.push(new es(this.f));this.Z += 1;break;default:tf(this,"E_INVALID_PAGE_SELECTOR :" + a);}};function hs(a){var b;a.g || a.G.length?b = [a.g].concat(a.G.sort()):b = null;a.I.push({Qe:b,Z:a.Z});a.g = "";a.G = [];}n.Ec = function(){hs(this);oj.prototype.Ec.call(this);};n.Ba = function(){hs(this);oj.prototype.Ba.call(this);};n.yb = function(a,b,c){if("bleed" !== a && "marks" !== a || this.I.some(function(a){return !a.Qe;})){oj.prototype.yb.call(this,a,b,c);var d=this.ab[a],e=this.T;if("bleed" === a || "marks" === a)e[""] || (e[""] = {}),Object.keys(e).forEach(function(b){Fh(e[b],a,d);});else if("size" === a){var f=e[""];this.I.forEach(function(b){var c=new V(d.value,d.Ua + b.Z);b = b.Qe?b.Qe.join(""):"";var g=e[b];g?(c = (b = g[a])?Ch(null,c,b):c,Fh(g,a,c)):(g = e[b] = {},Fh(g,a,c),f && ["bleed","marks"].forEach(function(a){f[a] && Fh(g,a,f[a]);},this));},this);}}};n.yf = function(a){Th(this.l.Wc,"*",a);};n.Df = function(a){return new fs(this.ab,a);};n.qe = function(a){var b=Gh(this.ab,"_marginBoxes"),c=b[a];c || (c = {},b[a] = c);pf(this.la,new is(this.f,this.la,this.C,c));};function is(a,b,c,d){qf.call(this,a,b,!1);this.g = c;this.b = d;}t(is,rf);is.prototype.xb = function(a,b,c){mh(this.g,a,b,c,this);};is.prototype.Tc = function(a,b){sf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};is.prototype.Md = function(a,b){sf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};is.prototype.yb = function(a,b,c){Fh(this.b,a,new V(b,c?mf(this):nf(this)));};var js=new re(function(){var a=J("uaStylesheetBase");nh.get().then(function(b){var c=oa("user-agent-base.css",na);b = new oj(null,null,null,null,null,b,!0);b.Hc("UA");nj = b.l;Tf(c,b,null,null).Da(a);});return a.result();},"uaStylesheetBaseFetcher");function ks(a,b,c,d,e,f,g,h,l,k){this.l = a;this.f = b;this.b = c;this.g = d;this.I = e;this.j = f;this.F = a.T;this.G = g;this.h = h;this.C = l;this.H = k;this.A = a.l;Ab(this.b,function(a){var b=this.b,c;c = (c = b.b[a])?(c = c.b[0])?c.b:null:null;var d;d = b.b[a];if(d = ls(this,d?d.g:"any"))d = (a = b.b[a])?0 < a.b.length && a.b[0].b.f <= this.F:!1;return d && !!c && !ms(this,c);});zb(this.b,new yb(this.b,function(){return this.Y + this.b.page;},"page-number"));}function ns(a,b,c,d){if(a.C.length){var e=new Db(0,b,c,d);a = a.C;for(var f={},g=0;g < a.length;g++) Jh(e,f,a[g],0,null,null,null);g = f.width;a = f.height;var h=f["text-zoom"];if(g && a || h)if((f = Bb.em,(h?h.evaluate(e,"text-zoom"):null) === ud && (h = f / d,d = f,b *= h,c *= h),g && a && (g = Ic(g.evaluate(e,"width"),e),e = Ic(a.evaluate(e,"height"),e),0 < g && 0 < e)))return {width:g,height:e,fontSize:d};}return {width:b,height:c,fontSize:d};}function os(a,b,c,d,e,f,g,h,l,k,m){Db.call(this,0,d.width,d.height,d.fontSize);this.style = a;this.aa = b;this.lang = b.lang || c;this.viewport = d;this.l = {body:!0};this.g = e;this.C = this.b = this.I = this.f = this.G = null;this.F = 0;this.Cb = f;this.h = new Yl(this.style.F);this.wa = {};this.W = null;this.j = m;this.Db = new Jm(null,null,null,null,null,null,null);this.T = {};this.ra = null;this.sb = g;this.Bb = h;this.Y = l;this.tb = k;for(var p in a.h) (b = a.h[p]["flow-consume"]) && (b.evaluate(this,"flow-consume") == Kc?this.l[p] = !0:delete this.l[p]);this.Ra = {};this.ia = this.ha = 0;}t(os,Db);function ps(a){var b=J("StyleInstance.init"),c=new ip(a.j,a.aa.url),d=new hp(a.j,a.aa.url,a.style.f,a.style.b);a.f = new Fl(a.aa,a.style.g,a.style.f,a,a.l,a.style.A,c,d);d.h = a.f;Pl(a.f,a);a.I = {};a.I[a.aa.url] = a.f;var e=Ml(a.f);a.ra = or(e);a.G = new mq(a.style.I);c = new Yi(a.style.g,a,c,d);a.G.j(c,e);lq(a.G,a);a.W = new Wr(c,a.style.b,a.G,a,e);e = [];for(c = 0;c < a.style.j.length;c++) if((d = a.style.j[c],!d.ea || d.ea.evaluate(a)))d = Vl(d.nc,a),d = new Wl(d),e.push(d);dm(a.Cb,e,a.h).Da(b);var f=a.style.H;Object.keys(f).forEach(function(a){var b=vr(ur(f[a]),this);this.Ra[a] = {width:b.Ub + 2 * b.Xd,height:b.Tb + 2 * b.Xd};},a);return b.result();}function Ql(a,b,c){if(a = a.b)a.f[b.b] || (a.f[b.b] = c),c = a.b[b.b],c || (c = new Sk(),a.b[b.b] = c),c.b.push(new Rk(new Pk({ma:[{node:b.element,Za:zk,pa:null,Aa:null,va:null,Ka:0}],ka:0,K:!1,Ia:null}),b));}function qs(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d < b.b.length;d++) {for(var e=b.b[d].f.f,f=e.ma[0].node,g=e.ka,h=e.K,l=0;f.ownerDocument != a.aa.b;) l++,f = e.ma[l].node,h = !1,g = 0;e = Lj(a.aa,f,g,h);e < c && (c = e);}return c;}function rs(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l) {var f=b.b[e];if(!(c || f && f.b.length) && a.b){f = a.f;f.O = e;for(var g=0;null != f.O && (g += 5E3,Nl(f,g,0) != Number.POSITIVE_INFINITY););f = a.b.b[e];b != a.b && f && (f = f.clone(),b.b[e] = f);}f && (f = qs(a,f),f < d && (d = f));}return d;}function ls(a,b){switch(b){case "left":case "right":case "recto":case "verso":return new ic(a.style.b,b + "-page").evaluate(a);default:return !0;}}function ss(a,b){var c=a.b,d=rs(a,c);if(d == Number.POSITIVE_INFINITY)return null;for(var e=a.G.A,f,g=0;g < e.length;g++) if((f = e[g],"vivliostyle-page-rule-master" !== f.b.Xb)){var h=1,l=Wp(f,a,"utilization");l && l.Le() && (h = l.M);var l=Fb(a,"em",!1),k=a.Ub() * a.Tb();a.F = Nl(a.f,d,Math.ceil(h * k / (l * l)));h = a;l = c;k = void 0;for(k in l.b) {var m=l.b[k];if(m && 0 < m.b.length){var p=m.b[0].b;if(qs(h,m) === p.f){a: switch((p = m.g,p)){case "left":case "right":case "recto":case "verso":break a;default:p = null;}m.g = fm(wl(p,m.b[0].b.g));}}}a.C = c.clone();h = a;l = h.b.page;k = void 0;for(k in h.b.b) for(m = h.b.b[k],p = m.b.length - 1;0 <= p;p--) {var q=m.b[p];0 > q.b.kb && q.b.f < h.F && (q.b.kb = l);}Eb(a,a.style.b);h = Wp(f,a,"enabled");if(!h || h === Id){c = a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.F);d = void 0;for(d in c.b.b) for(e = c.b.b[d],g = 0;g < e.b.length;g++) v.debug("  Chunk",d + ":",e.b[g].b.f);d = a.W;e = f;f = b;c = e.b;Object.keys(f).length?(e = c,g = Yr(d,f),e = e.l + "^" + g,g = d.j[e],g || ("background-host" === c.Xb?(c = d,f = new Gr(c.l,c.h.b,f).h(c.h),f.j(c.b,c.g),lq(f,c.f),g = f):g = Zr(d,f,c),d.j[e] = g),f = g.b,f.f.g = f,f = g):(c.f.g = c,f = e);return f;}}throw Error("No enabled page masters");}function ms(a,b){var c=a.C.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length || e < f[0])return !1;var c=Ma(f.length,function(a){return f[a] > e;}) - 1,c=f[c],d=a.C.b[d],g=qs(a,d);return c < g?!1:g < c?!0:!ls(a,d.g);}return !1;}function ts(a,b,c){a = a.b.f[c];a.D || (a.D = new Rn(null));b.Be = a.D;}function us(a){var b=a.g,c=Zm(b),d=J("layoutDeferredPageFloats"),e=!1,f=0;pe(function(d){if(f === c.length)O(d);else {var g=c[f++],l=g.qa,k=Rm(l),m=k.We(l,b);m && Fm(m,l)?N(d):Sm(b,l) || an(b,l)?($m(b,g),O(d)):to(a,g,k,null,m).then(function(a){a?(a = hn(b.parent))?O(d):(hn(b) && !a && (e = !0,b.Uc = !1),N(d)):O(d);});}}).then(function(){e && Um(b);M(d,!0);});return d.result();}function vs(a,b,c){var d=a.b.b[c];if(!d || !ls(a,d.g))return K(!0);d.g = "any";ts(a,b,c);ro(b);a.l[c] && 0 < b.ra.length && (b.wc = !1);var e=J("layoutColumn");us(b).then(function(){if(hn(b.g))M(e,!0);else {var c=[],g=[],h=!0;pe(function(e){for(;0 < d.b.length - g.length;) {for(var f=0;0 <= g.indexOf(f);) f++;var l=d.b[f];if(l.b.f > a.F || ms(a,l.b))break;for(var p=f + 1;p < d.b.length;p++) if(!(0 <= g.indexOf(p))){var q=d.b[p];if(q.b.f > a.F || ms(a,q.b))break;sk(q.b,l.b) && (l = q,f = p);}var r=l.b,z=!0;pm(b,l.f,h,d.f).then(function(a){if(hn(b.g))O(e);else if((h = !1,!l.b.ig || a && !r.h || c.push(f),r.h))g.push(f),O(e);else {var k=!!a || !!b.b,m;0 < bn(b.g).length && b.Ra?a?(m = a.clone(),m.f = b.Ra):m = new Pk(b.Ra):m = null;if(b.b && m)l.f = m,d.f = b.b,b.b = null;else {g.push(f);if(a || m)l.f = a || m,c.push(f);b.b && (d.g = fm(b.b));}k?O(e):(b.wc = !1,z?z = !1:N(e));}});if(z){z = !1;return;}}O(e);}).then(function(){if(!hn(b.g)){d.b = d.b.filter(function(a,b){return 0 <= c.indexOf(b) || 0 > g.indexOf(b);});"column" === d.f && (d.f = null);var a=vn(b.g);oo(b,a);}M(e,!0);});}});return e.result();}function ws(a,b,c,d,e,f,g,h,l,k,m,p,q,r){var z=b.u?b.h && b.O:b.g && b.T,u=f.element,A=new Jm(l,"column",null,h,null,null,null),I=a.b.clone(),E=J("createAndLayoutColumn"),F;pe(function(b){var E=new Hn([new gp(a.j,a.b.page - 1)].concat(xn(A)));if(1 < k){var U=a.viewport.b.createElement("div");w(U,"position","absolute");u.appendChild(U);F = new nm(U,r,a.g,E,A);F.u = f.u;F.Sa = f.Sa;F.Eb = f.Eb;f.u?(E = g * (p + m) + f.F,dl(F,f.C,f.width),cl(F,E,p)):(E = g * (p + m) + f.C,cl(F,f.F,f.height),dl(F,E,p));F.gb = c;F.hb = d;}else F = new nm(u,r,a.g,E,A),bl(F,f);F.Bc = z?[]:e.concat();F.wa = q;Nm(A,F);0 <= F.width?vs(a,F,h).then(function(){hn(A) || en(A);hn(F.g) && !hn(l)?(F.g.Uc = !1,a.b = I.clone(),F.element !== u && u.removeChild(F.element),N(b)):O(b);}):(en(A),O(b));}).then(function(){M(E,F);});return E.result();}function xs(a,b,c,d,e){var f=Wp(c,a,"writing-mode") || null;a = Wp(c,a,"direction") || null;return new Jm(b,"region",d,e,null,f,a);}function ys(a,b,c,d,e,f,g,h){Pp(c);var l=Wp(c,a,"enabled");if(l && l !== Id)return K(!0);var k=J("layoutContainer"),m=Wp(c,a,"wrap-flow") === Mc,l=Wp(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=Wp(c,a,"position");w(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new Wk(p);r.u = c.u;r.Bc = g;c.Vb(a,r,b,a.h,a.g);r.gb = e;r.hb = f;e += r.left + r.marginLeft + r.borderLeft;f += r.top + r.marginTop + r.borderTop;(c instanceof Lr || c instanceof Fp && !(c instanceof Kr)) && Nm(h,r);var z=a.b.clone(),u=!1;if(l && l.zf())if(a.T[l.toString()])hn(h) || c.vd(a,r,b,null,1,a.g,a.h),l = K(!0);else {var A=J("layoutContainer.inner"),I=l.toString(),E=xs(a,h,c,r,I),F=Z(c,a,"column-count"),U=Z(c,a,"column-gap"),Qa=1 < F?Z(c,a,"column-width"):r.width,l=Vp(c,a),Ea=0,q=Wp(c,a,"shape-inside"),va=zg(q,0,0,r.width,r.height,a),L=new Fq(I,a,a.viewport,a.f,l,a.aa,a.h,a.style.G,a,b,a.sb,a.Bb,a.tb),Fa=0,vb=null;pe(function(b){ws(a,c,e,f,g,r,Fa++,I,E,F,U,Qa,va,L).then(function(c){hn(h)?O(b):((c.b && "column" !== c.b || Fa === F) && !hn(E) && en(E),hn(E)?(Fa = 0,a.b = z.clone(),E.Uc = !1,N(b)):(vb = c,vb.b && "column" != vb.b && (Fa = F,"region" != vb.b && (a.T[I] = !0)),Ea = Math.max(Ea,vb.ya),Fa < F?N(b):O(b)));});}).then(function(){if(!hn(h)){vb.element === p && (r = vb);r.ya = Ea;c.vd(a,r,b,vb,F,a.g,a.h);var d=a.b.b[I];d && "region" === d.f && (d.f = null);}M(A,!0);});l = A.result();}else {if((l = Wp(c,a,"content")) && kl(l)){q = "span";l.url && (q = "img");var Ck=a.viewport.b.createElement(q);l.ba(new jl(Ck,a,l));p.appendChild(Ck);"img" == q && kq(c,a,Ck,a.h);jq(c,a,r,a.h);}else c.ra && (d.removeChild(p),u = !0);u || c.vd(a,r,b,null,1,a.g,a.h);l = K(!0);}l.then(function(){if(hn(h))M(k,!0);else {if(!c.g || 0 < Math.floor(r.ya)){if(!u && !m){var l=Wp(c,a,"shape-outside"),l=r.$d(l,a);g.push(l);}}else if(!c.A.length){d.removeChild(p);M(k,!0);return;}var q=c.A.length - 1;oe(function(){for(;0 <= q;) {var d=c.A[q--],d=ys(a,b,d,p,e,f,g,h);if(d.Pa())return d.fa(function(){return K(!hn(h));});if(hn(h))break;}return K(!1);}).then(function(){M(k,!0);});}});return k.result();}function zs(a){var b=a.b.page,c;for(c in a.b.b) for(var d=a.b.b[c],e=d.b.length - 1;0 <= e;e--) {var f=d.b[e];0 <= f.b.kb && f.b.kb + f.b.l - 1 <= b && d.b.splice(e,1);}}function As(a,b){for(var c in a.l) {var d=b.b[c];if(d && 0 < d.b.length)return !1;}return !0;}function Bs(a,b,c){a.T = {};c?(a.b = c.clone(),Il(a.f,c.g)):(a.b = new Uk(),Il(a.f,-1));a.lang && b.g.setAttribute("lang",a.lang);c = a.b;c.page++;Eb(a,a.style.b);a.C = c.clone();var d=Xr(a.W),e=ss(a,d);if(!e)return K(null);jk(b,e.b.b.width.value === Kd);kk(b,e.b.b.height.value === Ld);a.j.j = b;sp(a.j,d,a);var f=vr(ur(d),a);Cs(a,f,b);Cr(d,f,b,a);var g=f.Kb + f.ec,d=Wp(e,a,"writing-mode") || dd,f=Wp(e,a,"direction") || nd,h=new Jm(a.Db,"page",null,null,null,d,f),l=J("layoutNextPage");pe(function(c){ys(a,b,e,b.g,g,g,[],h).then(function(){hn(h) || en(h);hn(h)?(a.b = a.C.clone(),h.Uc = !1,N(c)):O(c);});}).then(function(){e.Y(a,b,a.g);var d=new ic(e.b.f,"left-page");b.l = d.evaluate(a)?"left":"right";zs(a);c = a.b;Object.keys(c.b).forEach(function(b){b = c.b[b];var d=b.f;!d || "page" !== d && ls(a,d) || (b.f = null);});a.b = a.C = null;c.g = a.f.b;mk(b,a.style.l.O[a.aa.url],a.g);As(a,c) && (c = null);M(l,c);});return l.result();}function Cs(a,b,c){a.O = b.Ub;a.J = b.Tb;a.ia = b.Ub + 2 * b.Xd;a.ha = b.Tb + 2 * b.Xd;c.L.style.width = a.ia + "px";c.L.style.height = a.ha + "px";c.g.style.left = b.Kb + "px";c.g.style.right = b.Kb + "px";c.g.style.top = b.Kb + "px";c.g.style.bottom = b.Kb + "px";c.g.style.padding = b.ec + "px";}function Ds(a,b,c,d){oj.call(this,a.j,a,b,c,d,a.h,!c);this.g = a;this.G = !1;}t(Ds,oj);n = Ds.prototype;n.Jd = function(){};n.Id = function(a,b,c){a = new Ep(this.g.A,a,b,c,this.g.H,this.ea,nf(this.la));pf(this.g,new rq(a.f,this.g,a,this.C));};n.rc = function(a){a = a.b;this.ea && (a = oc(this.f,this.ea,a));pf(this.g,new Ds(this.g,a,this,this.H));};n.Fd = function(){pf(this.g,new uj(this.f,this.la));};n.Hd = function(){var a={};this.g.C.push({nc:a,ea:this.ea});pf(this.g,new vj(this.f,this.la,null,a,this.g.h));};n.Gd = function(a){var b=this.g.l[a];b || (b = {},this.g.l[a] = b);pf(this.g,new vj(this.f,this.la,null,b,this.g.h));};n.Ld = function(){var a={};this.g.I.push(a);pf(this.g,new vj(this.f,this.la,this.ea,a,this.g.h));};n.bd = function(a){var b=this.g.F;if(a){var c=Gh(b,"_pseudos"),b=c[a];b || (b = {},c[a] = b);}pf(this.g,new vj(this.f,this.la,null,b,this.g.h));};n.Kd = function(){this.G = !0;this.zb();};n.Gc = function(){var a=new gs(this.g.A,this.g,this,this.C,this.g.G);pf(this.g,a);a.Gc();};n.Ba = function(){oj.prototype.Ba.call(this);if(this.G){this.G = !1;var a="R" + this.g.O++,b=C(a),c;this.ea?c = new Bh(b,0,this.ea):c = new V(b,0);Ih(this.ab,"region-id").push(c);this.Ob();a = new Ds(this.g,this.ea,this,a);pf(this.g,a);a.Ba();}};function Es(a){var b=a.getAttribute("content");if(!b)return "";a = {};for(var c;c = b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);) b = b.substr(c[0].length),a[c[1]] = c[2];b = a.width - 0;a = a.height - 0;return b && a?"@-epubx-viewport{width:" + b + "px;height:" + a + "px;}":"";}function Fs(a){of.call(this);this.h = a;this.j = new ub(null);this.A = new ub(this.j);this.H = new Bp(this.j);this.J = new Ds(this,null,null,null);this.O = 0;this.C = [];this.F = {};this.l = {};this.I = [];this.G = {};this.b = this.J;}t(Fs,of);Fs.prototype.error = function(a){v.b("CSS parser:",a);};function Gs(a,b){return Hs(b,a);}function Is(a){gf.call(this,Gs,"document");this.T = a;this.I = {};this.A = {};this.f = {};this.O = {};this.l = null;this.b = [];this.J = !1;}t(Is,gf);function Js(a,b,c){Ks(a,b,c);var d=oa("user-agent.xml",na),e=J("OPSDocStore.init");nh.get().then(function(b){a.l = b;js.get().then(function(){a.load(d).then(function(){a.J = !0;M(e,!0);});});});return e.result();}function Ks(a,b,c){a.b.splice(0);b && b.forEach(a.W,a);c && c.forEach(a.Y,a);}Is.prototype.W = function(a){var b=a.url;b && (b = oa(b,ma));this.b.push({url:b,text:a.text,cb:"Author",Ea:null,media:null});};Is.prototype.Y = function(a){var b=a.url;b && (b = oa(b,ma));this.b.push({url:b,text:a.text,cb:"User",Ea:null,media:null});};function Hs(a,b){var c=J("OPSDocStore.load"),d=b.url;Tj(b,a).then(function(b){if(b){if(a.J)for(var e=Sd("PREPROCESS_SINGLE_DOCUMENT"),g=0;g < e.length;g++) try{e[g](b.b);}catch(u) {v.b("Error during single document preprocessing:",u);}for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g < h.length;g++) {var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k && m && p && l && e.push({fg:k,event:m,action:p,$c:l});}a.O[d] = e;var q=[];q.push({url:oa("user-agent-page.css",na),text:null,cb:"UA",Ea:null,media:null});if(g = b.l)for(g = g.firstChild;g;g = g.nextSibling) if(1 == g.nodeType)if((e = g,h = e.namespaceURI,k = e.localName,"http://www.w3.org/1999/xhtml" == h))if("style" == k)q.push({url:d,text:e.textContent,cb:"Author",Ea:null,media:null});else if("link" == k){if((m = e.getAttribute("rel"),h = e.getAttribute("class"),k = e.getAttribute("media"),"stylesheet" == m || "alternate stylesheet" == m && h))e = e.getAttribute("href"),e = oa(e,d),q.push({url:e,text:null,Ea:h,media:k,cb:"Author"});}else "meta" == k && "viewport" == e.getAttribute("name") && q.push({url:d,text:Es(e),cb:"Author",Ea:null,media:null});else "http://www.gribuser.ru/xml/fictionbook/2.0" == h?"stylesheet" == k && "text/css" == e.getAttribute("type") && q.push({url:d,text:e.textContent,cb:"Author",Ea:null,media:null}):"http://example.com/sse" == h && "property" === k && (h = e.getElementsByTagName("name")[0]) && "stylesheet" === h.textContent && (e = e.getElementsByTagName("value")[0]) && (e = oa(e.textContent,d),q.push({url:e,text:null,Ea:null,media:null,cb:"Author"}));for(g = 0;g < a.b.length;g++) q.push(a.b[g]);for(var r="",g=0;g < q.length;g++) r += q[g].url,r += "^",q[g].text && (r += q[g].text),r += "^";var z=a.I[r];z?(a.f[d] = z,M(c,b)):(g = a.A[r],g || (g = new re(function(){var b=J("fetchStylesheet"),c=0,d=new Fs(a.l);oe(function(){if(c < q.length){var a=q[c++];d.Hc(a.cb);return null !== a.text?Uf(a.text,d,a.url,a.Ea,a.media).tc(!0):Tf(a.url,d,a.Ea,a.media);}return K(!1);}).then(function(){z = new ks(a,d.j,d.A,d.J.l,d.H,d.C,d.F,d.l,d.I,d.G);a.I[r] = z;delete a.A[r];M(b,z);});return b.result();},"FetchStylesheet " + d),a.A[r] = g,g.start()),g.get().then(function(e){a.f[d] = e;M(c,b);}));}else M(c,null);});return c.result();};function Ls(a){return String.fromCharCode(a >>> 24 & 255,a >>> 16 & 255,a >>> 8 & 255,a & 255);}function Ms(a){var b=new Ca();b.append(a);var c=55 - a.length & 63;for(b.append("");0 < c;) c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ls(8 * a.length));a = b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e < a.length;e += 64) {for(d = 0;16 > d;d++) {var f=a.substr(e + 4 * d,4);c[d] = (f.charCodeAt(0) & 255) << 24 | (f.charCodeAt(1) & 255) << 16 | (f.charCodeAt(2) & 255) << 8 | f.charCodeAt(3) & 255;}for(;80 > d;d++) f = c[d - 3] ^ c[d - 8] ^ c[d - 14] ^ c[d - 16],c[d] = f << 1 | f >>> 31;var f=b[0],g=b[1],h=b[2],l=b[3],k=b[4],m;for(d = 0;80 > d;d++) m = 20 > d?(g & h | ~g & l) + 1518500249:40 > d?(g ^ h ^ l) + 1859775393:60 > d?(g & h | g & l | h & l) + 2400959708:(g ^ h ^ l) + 3395469782,m += (f << 5 | f >>> 27) + k + c[d],k = l,l = h,h = g << 30 | g >>> 2,g = f,f = m;b[0] = b[0] + f | 0;b[1] = b[1] + g | 0;b[2] = b[2] + h | 0;b[3] = b[3] + l | 0;b[4] = b[4] + k | 0;}return b;}function Ns(a){a = Ms(a);for(var b=[],c=0;c < a.length;c++) {var d=a[c];b.push(d >>> 24 & 255,d >>> 16 & 255,d >>> 8 & 255,d & 255);}return b;}function Os(a){a = Ms(a);for(var b=new Ca(),c=0;c < a.length;c++) b.append(Ls(a[c]));a = b.toString();b = new Ca();for(c = 0;c < a.length;c++) b.append((a.charCodeAt(c) | 256).toString(16).substr(1));return b.toString();};function Ps(a,b,c,d,e,f,g,h,l,k){this.b = a;this.url = b;this.lang = c;this.f = d;this.l = e;this.X = mb(f);this.A = g;this.j = h;this.h = l;this.g = k;this.Xa = this.page = null;}function Qs(a,b,c){if(c--)for(b = b.firstChild;b;b = b.nextSibling) if(1 == b.nodeType){var d=b;"auto" != Aa(d,"height","auto") && (w(d,"height","auto"),Qs(a,d,c));"absolute" == Aa(d,"position","static") && (w(d,"position","relative"),Qs(a,d,c));}}function Rs(a){var b=a.target,c="▸" == b.textContent;b.textContent = c?"▾":"▸";for(b = b.parentNode.firstChild;b;) if(1 != b.nodeType)b = b.nextSibling;else {var d=b;"toc-container" == d.getAttribute("data-adapt-class")?b = d.firstChild:("toc-node" == d.getAttribute("data-adapt-class") && (d.style.height = c?"auto":"0px"),b = b.nextSibling);}a.stopPropagation();}Ps.prototype.ge = function(a){var b=this.A.ge(a);return function(a,d,e){var c=e.behavior;if(!c || "toc-node" != c.toString() && "toc-container" != c.toString())return b(a,d,e);a = d.getAttribute("data-adapt-class");"toc-node" == a && (e = d.firstChild,"▸" != e.textContent && (e.textContent = "▸",w(e,"cursor","pointer"),e.addEventListener("click",Rs,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node" == c.toString()?(e = d.ownerDocument.createElement("div"),e.textContent = "▹",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node" != a && "toc-container" != a || w(g,"height","0px")):"toc-node" == a && g.setAttribute("data-adapt-class","toc-container");return K(g);};};Ps.prototype.Ed = function(a,b,c,d,e){if(this.page)return K(this.page);var f=this,g=J("showTOC"),h=new ik(a,a);this.page = h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=ns(k,c,1E5,e);b = new nr(b.window,l.fontSize,b.root,l.width,l.height);var p=new os(k,d,f.lang,b,f.f,f.l,f.ge(d),f.j,0,f.h,f.g);f.Xa = p;p.X = f.X;ps(p).then(function(){Bs(p,h,null).then(function(){Qs(f,a,2);M(g,h);});});});return g.result();};Ps.prototype.xd = function(){if(this.page){var a=this.page;this.Xa = this.page = null;w(a.L,"visibility","none");var b=a.L.parentNode;b && b.removeChild(a.L);}};Ps.prototype.Me = function(){return !!this.page;};function Ss(){Is.call(this,Ts(this));this.g = new gf(Tj,"document");this.G = new gf(jf,"text");this.H = {};this.ia = {};this.C = {};this.F = {};}t(Ss,Is);function Ts(a){return function(b){return a.C[b];};}function Us(a,b,c){var d=J("loadEPUBDoc");"/" !== b.substring(b.length - 1) && (b += "/");c && a.G.fetch(b + "?r=list");a.g.fetch(b + "META-INF/encryption.xml");var e=b + "META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from " + e).then(function(f){if(f){f = ck(Ij(Ij(Ij(new Jj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g < f.length;g++) {var h=f[g];if(h){Vs(a,b,h,c).Da(d);return;}}M(d,null);}else v.error("Received an empty response for EPUB container.xml " + e + ". This may be caused by the server not allowing cross origin requests.");});return d.result();}function Vs(a,b,c,d){var e=b + c,f=a.H[e];if(f)return K(f);var g=J("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b + "META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.G.load(b + "?r=list"):K(null)).then(function(d){f = new Ws(a,b);Xs(f,c,h,d,b + "?r=manifest").then(function(){a.H[e] = f;a.ia[b] = f;M(g,f);});});}):v.error("Received an empty response for EPUB OPF " + e + ". This may be caused by the server not allowing cross origin requests.");});return g.result();}function Ys(a,b,c){var d=J("EPUBDocStore.load");b = la(b);(a.F[b] = Hs(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Dd:null})).Da(d);return d.result();}Ss.prototype.load = function(a){var b=la(a);if(a = this.F[b])return a.Pa()?a:K(a.get());var c=J("EPUBDocStore.load");a = Ss.Nf.load.call(this,b,!0,"Failed to fetch a source document from " + b);a.then(function(a){a?M(c,a):v.error("Received an empty response for " + b + ". This may be caused by the server not allowing cross origin requests.");});return c.result();};function Zs(){this.id = null;this.src = "";this.h = this.f = null;this.R = -1;this.l = 0;this.A = null;this.b = this.g = 0;this.oc = this.kb = null;this.j = Pa;}function $s(a){return a.id;}function at(a){var b=Ns(a);return function(a){var c=J("deobfuscator"),e,f;a.slice?(e = a.slice(0,1040),f = a.slice(1040,a.size)):(e = a.webkitSlice(0,1040),f = a.webkitSlice(1040,a.size - 1040));ff(e).then(function(a){a = new DataView(a);for(var d=0;d < a.byteLength;d++) {var e=a.getUint8(d),e=e ^ b[d % 20];a.setUint8(d,e);}M(c,ef([a,f]));});return c.result();};}var bt={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},ct=bt.dcterms + "language",dt=bt.dcterms + "title";function et(a,b){var c={};return function(d,e){var f,g,h=d.r || c,l=e.r || c;if(a == dt && (f = "main" == h["http://idpf.org/epub/vocab/package/#title-type"],g = "main" == l["http://idpf.org/epub/vocab/package/#title-type"],f != g))return f?-1:1;f = parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f) && (f = Number.MAX_VALUE);g = parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g) && (g = Number.MAX_VALUE);return f != g?f - g:a != ct && b && (f = (h[ct] || h["http://idpf.org/epub/vocab/package/#alternate-script"]) == b,g = (l[ct] || l["http://idpf.org/epub/vocab/package/#alternate-script"]) == b,f != g)?f?-1:1:d.o - e.o;};}function ft(a,b){function c(a){for(var b in a) {var d=a[b];d.sort(et(b,k));for(var e=0;e < d.length;e++) {var f=d[e].r;f && c(f);}}}function d(a){return Ta(a,function(a){return Sa(a,function(a){var b={v:a.value,o:a.order};a.Og && (b.s = a.scheme);if(a.id || a.lang){var c=l[a.id];if(c || a.lang)a.lang && (a = {name:ct,value:a.lang,lang:null,id:null,oe:a.id,scheme:null,order:a.order},c?c.push(a):c = [a]),c = Ra(c,function(a){return a.name;}),b.r = d(c);}return b;});});}function e(a){if(a && (a = a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b + a[3];}return null;}var f;if(b){f = {};for(var g in bt) f[g] = bt[g];for(;g = b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);) b = b.substr(g[0].length),f[g[1]] = g[2];}else f = bt;var h=1;g = ak(bk(a),function(a){if("meta" == a.localName){var b=e(a.getAttribute("property"));if(b)return {name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,oe:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))};}else if("http://purl.org/dc/elements/1.1/" == a.namespaceURI)return {name:bt.dcterms + a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),oe:null,scheme:null};return null;});var l=Ra(g,function(a){return a.oe;});g = d(Ra(g,function(a){return a.oe?null:a.name;}));var k=null;g[ct] && (k = g[ct][0].v);c(g);return g;}function gt(){var a=window.MathJax;return a?a.Hub:null;}var ht={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};function Ws(a,b){this.h = a;this.l = this.f = this.b = this.j = this.g = null;this.F = b;this.C = null;this.T = {};this.lang = null;this.G = 0;this.J = {};this.W = this.O = this.Y = null;this.H = {};this.I = null;this.A = it(this);gt() && (rh["http://www.w3.org/1998/Math/MathML"] = !0);}function it(a){function b(){}b.prototype.re = function(a,b){return "viv-id-" + qa(b + (a?"#" + a:""),":");};b.prototype.gd = function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1] || d,c=c[2];if(f && a.j.some(function(a){return a.src === f;}))return "#" + this.re(c,f);}return b;};b.prototype.jg = function(a){"#" === a.charAt(0) && (a = a.substring(1));a.indexOf("viv-id-") || (a = a.substring(7));return (a = Ka(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[];};return new b();}function jt(a,b){return a.F?b.substr(0,a.F.length) == a.F?decodeURI(b.substr(a.F.length)):null:b;}function Xs(a,b,c,d,e){a.g = b;var f=Ij(new Jj([b.b]),"package"),g=ck(f,"unique-identifier")[0];g && (g = Pj(b,b.url + "#" + g)) && (a.C = g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j = Sa(Ij(Ij(f,"manifest"),"item").b,function(c){var d=new Zs(),e=b.url;d.id = c.getAttribute("id");d.src = oa(c.getAttribute("href"),e);d.f = c.getAttribute("media-type");if(e = c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g < e.length;g++) f[e[g]] = !0;d.j = f;}(c = c.getAttribute("fallback")) && !ht[d.f] && (h[d.src] = c);!a.O && d.j.nav && (a.O = d);!a.W && d.j["cover-image"] && (a.W = d);return d;});a.f = Oa(a.j,$s);a.l = Oa(a.j,function(b){return jt(a,b.src);});for(var l in h) for(g = l;;) {g = a.f[h[g]];if(!g)break;if(ht[g.f]){a.H[l] = g.src;break;}g = g.src;}a.b = Sa(Ij(Ij(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d = a.f[d])d.h = b,d.R = c;return d;});if(l = ck(Ij(f,"spine"),"toc")[0])a.Y = a.f[l];if(l = ck(Ij(f,"spine"),"page-progression-direction")[0]){a: switch(l){case "ltr":l = "ltr";break a;case "rtl":l = "rtl";break a;default:throw Error("unknown PageProgression: " + l);}a.I = l;}var g=c?ck(Ij(Ij(Yj(Ij(Ij(new Jj([c.b]),"encryption"),"EncryptedData"),Xj()),"CipherData"),"CipherReference"),"URI"):[],k=Ij(Ij(f,"bindings"),"mediaType").b;for(c = 0;c < k.length;c++) {var m=k[c].getAttribute("handler");(l = k[c].getAttribute("media-type")) && m && a.f[m] && (a.T[l] = a.f[m].src);}a.J = ft(Ij(f,"metadata"),ck(f,"prefix")[0]);a.J[ct] && (a.lang = a.J[ct][0].v);if(!d){if(0 < g.length && a.C)for(d = at(a.C),c = 0;c < g.length;c++) a.h.C[a.F + g[c]] = d;return K(!0);}f = new Ca();k = {};if(0 < g.length && a.C)for(l = "1040:" + Os(a.C),c = 0;c < g.length;c++) k[g[c]] = l;for(c = 0;c < d.length;c++) {var p=d[c];if(m = p.n){var q=decodeURI(m),g=a.l[q];l = null;g && (g.A = 0 != p.m,g.l = p.c,g.f && (l = g.f.replace(/\s+/g,"")));g = k[q];if(l || g)f.append(m),f.append(" "),f.append(l || "application/octet-stream"),g && (f.append(" "),f.append(g)),f.append("\n");}}kt(a);return df(e,"","POST",f.toString(),"text/plain");}function kt(a){for(var b=0,c=0;c < a.b.length;c++) {var d=a.b[c],e=Math.ceil(d.l / 1024);d.g = b;d.b = e;b += e;}a.G = b;}function lt(a,b,c){a.f = {};a.l = {};a.j = [];a.b = a.j;var d=a.g = new Hj(null,"",new DOMParser().parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Zs();b.R = a.index;b.id = "item" + (a.index + 1);b.src = a.url;b.kb = a.kb;b.oc = a.oc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h = c;this.f[b.id] = b;this.l[a.url] = b;this.j.push(b);},a);return c?Ys(a.h,b[0].url,c):K(null);}function mt(a,b,c){var d=a.b[b],e=J("getCFI");a.h.load(d.src).then(function(a){var b=Nj(a,c),f=null;b && (a = Lj(a,b,0,!1),f = new hb(),kb(f,b,c - a),d.h && kb(f,d.h,0),f = f.toString());M(e,f);});return e.result();}function nt(a,b){return Yd("resolveFragment",function(c){if(b){var d=new hb();ib(d,b);var e;if(a.g){var f=jb(d,a.g.b);if(1 != f.node.nodeType || f.K || !f.$c){M(c,null);return;}var g=f.node,h=g.getAttribute("idref");if("itemref" != g.localName || !h || !a.f[h]){M(c,null);return;}e = a.f[h];d = f.$c;}else e = a.b[0];a.h.load(e.src).then(function(a){var b=jb(d,a.b);a = Lj(a,b.node,b.offset,b.K);M(c,{R:e.R,Ha:a,$:-1});});}else M(c,null);},function(a,d){v.b(d,"Cannot resolve fragment:",b);M(a,null);});}function ot(a,b){return Yd("resolveEPage",function(c){if(0 >= b)M(c,{R:0,Ha:0,$:-1});else {var d=Ma(a.b.length,function(c){c = a.b[c];return c.g + c.b > b;}),e=a.b[d];a.h.load(e.src).then(function(a){b -= e.g;b > e.b && (b = e.b);var f=0;0 < b && (a = Mj(a),f = Math.round(a * b / e.b),f == a && f--);M(c,{R:d,Ha:f,$:-1});});}},function(a,d){v.b(d,"Cannot resolve epage:",b);M(a,null);});}function pt(a,b){var c=a.b[b.R];if(0 >= b.Ha)return K(c.g);var d=J("getEPage");a.h.load(c.src).then(function(a){a = Mj(a);M(d,c.g + Math.min(a,b.Ha) * c.b / a);});return d.result();}function qt(a,b){return {page:a,position:{R:a.R,$:b,Ha:a.offset}};}function rt(a,b,c,d,e){this.b = a;this.viewport = b;this.j = c;this.A = e;this.qc = [];this.l = [];this.X = mb(d);this.h = new lr(b);this.f = new qp(a.A);}function st(a,b){var c=a.qc[b.R];return c?c.pb[b.$]:null;}n = rt.prototype;n.Qb = function(a){return this.b.I?this.b.I:(a = this.qc[a?a.R:0])?a.Xa.ra:null;};function tt(a,b,c,d){c.L.style.display = "none";c.L.style.visibility = "visible";c.L.style.position = "";c.L.style.top = "";c.L.style.left = "";c.L.setAttribute("data-vivliostyle-page-side",c.l);var e=b.pb[d];c.H = !b.item.R && !d;b.pb[d] = c;e?(b.Xa.viewport.f.replaceChild(c.L,e.L),Va(e,{type:"replaced",target:null,currentTarget:null,Gf:c})):b.Xa.viewport.f.appendChild(c.L);a.A({width:b.Xa.ia,height:b.Xa.ha},b.Xa.Ra,b.item.R,b.Xa.Y + d);}function ut(a,b,c){var d=J("renderSinglePage"),e=vt(a,b,c);Bs(b.Xa,e,c).then(function(f){var g=(c = f)?c.page - 1:b.Ya.length - 1;tt(a,b,e,g);up(a.f,e.R,g);f = null;if(c){var h=b.Ya[c.page];b.Ya[c.page] = c;h && b.pb[c.page] && (Vk(c,h) || (f = ut(a,b,c)));}f || (f = K(!0));f.then(function(){var b=vp(a.f,e),f=0;pe(function(c){f++;if(f > b.length)O(c);else {var d=b[f - 1];d.Cd = d.Cd.filter(function(a){return !a.ad;});d.Cd.length?wt(a,d.R).then(function(b){b?(tp(a.f,d.le),wp(a.f,d.Cd),ut(a,b,b.Ya[d.$]).then(function(b){var d=a.f;d.b = d.G.pop();d = a.f;d.g = d.I.pop();d = b.Vc.position;d.R === e.R && d.$ === g && (e = b.Vc.page);N(c);})):N(c);}):N(c);}}).then(function(){M(d,{Vc:qt(e,g),If:c});});});});return d.result();}function xt(a,b){var c=a.$,d=-1;0 > c && (d = a.Ha,c = Ma(b.Ya.length,function(a){return rs(b.Xa,b.Ya[a],!0) > d;}),c = c === b.Ya.length?b.complete?b.Ya.length - 1:Number.POSITIVE_INFINITY:c - 1);return {R:a.R,$:c,Ha:d};}function yt(a,b,c){var d=J("findPage");wt(a,b.R).then(function(e){if(e){var f=null,g;pe(function(d){var h=xt(b,e);g = h.$;(f = e.pb[g])?O(d):e.complete?(g = e.Ya.length - 1,f = e.pb[g],O(d)):c?zt(a,h).then(function(a){a && (f = a.page);O(d);}):ne(100).then(function(){N(d);});}).then(function(){M(d,qt(f,g));});}else M(d,null);});return d.result();}function zt(a,b){var c=J("renderPage");wt(a,b.R).then(function(d){if(d){var e=xt(b,d),f=e.$,g=e.Ha,h=d.pb[f];h?M(c,qt(h,f)):pe(function(b){if(f < d.Ya.length)O(b);else if(d.complete)f = d.Ya.length - 1,O(b);else {var c=d.Ya[d.Ya.length - 1];ut(a,d,c).then(function(e){var k=e.Vc.page;(c = e.If)?0 <= g && rs(d.Xa,c) > g?(h = k,f = d.Ya.length - 2,O(b)):N(b):(h = k,f = e.Vc.position.$,d.complete = !0,k.C = d.item.R === a.b.b.length - 1,O(b));});}}).then(function(){h = h || d.pb[f];var b=d.Ya[f];h?M(c,qt(h,f)):ut(a,d,b).then(function(b){b.If || (d.complete = !0,b.Vc.page.C = d.item.R === a.b.b.length - 1);M(c,b.Vc);});});}else M(c,null);});return c.result();}n.pe = function(){return At(this,{R:this.b.b.length - 1,$:Number.POSITIVE_INFINITY,Ha:-1});};function At(a,b){var c=J("renderAllPages");b || (b = {R:0,$:0,Ha:0});var d=b.R,e=b.$,f=0,g;pe(function(c){zt(a,{R:f,$:f === d?e:Number.POSITIVE_INFINITY,Ha:f === d?b.Ha:-1}).then(function(a){g = a;++f > d?O(c):N(c);});}).then(function(){M(c,g);});return c.result();}n.Vf = function(){return yt(this,{R:0,$:0,Ha:-1});};n.Zf = function(){return yt(this,{R:this.b.b.length - 1,$:Number.POSITIVE_INFINITY,Ha:-1});};n.nextPage = function(a,b){var c=this,d=a.R,e=a.$,f=J("nextPage");wt(c,d).then(function(a){if(a){if(a.complete && e == a.Ya.length - 1){if(d >= c.b.b.length - 1){M(f,null);return;}d++;e = 0;}else e++;yt(c,{R:d,$:e,Ha:-1},b).Da(f);}else M(f,null);});return f.result();};n.ne = function(a){var b=a.R;if(a = a.$)a--;else {if(!b)return K(null);b--;a = Number.POSITIVE_INFINITY;}return yt(this,{R:b,$:a,Ha:-1});};function Bt(a,b,c){b = "left" === b.l;a = "ltr" === a.Qb(c);return !b && a || b && !a;}function Ct(a,b,c){var d=J("getCurrentSpread"),e=st(a,b);if(!e)return K({left:null,right:null});var f="left" === e.l;(Bt(a,e,b)?a.ne(b):a.nextPage(b,c)).then(function(a){a = a && a.page;f?M(d,{left:e,right:a}):M(d,{left:a,right:e});});return d.result();}n.eg = function(a,b){var c=st(this,a);if(!c)return K(null);var c=Bt(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.fa(function(a){return a?e.nextPage(a.position,!!b):K(null);});};n.hg = function(a){var b=st(this,a);if(!b)return K(null);b = Bt(this,b,a);a = this.ne(a);if(b){var c=this;return a.fa(function(a){return a?c.ne(a.position):K(null);});}return a;};function Dt(a,b){var c=J("navigateToEPage");ot(a.b,b).then(function(b){b?yt(a,b).Da(c):M(c,null);});return c.result();}function Et(a,b){var c=J("navigateToCFI");nt(a.b,b).then(function(b){b?yt(a,b).Da(c):M(c,null);});return c.result();}function Ft(a,b,c){v.debug("Navigate to",b);var d=jt(a.b,la(b));if(!d){if(a.b.g && b.match(/^#epubcfi\(/))d = jt(a.b,a.b.g.url);else if("#" === b.charAt(0)){var e=a.b.A.jg(b);a.b.g?d = jt(a.b,e[0]):d = e[0];b = d + (e[1]?"#" + e[1]:"");}if(null == d)return K(null);}var f=a.b.l[d];if(!f)return a.b.g && d == jt(a.b,a.b.g.url) && (d = b.indexOf("#"),0 <= d)?Et(a,b.substr(d + 1)):K(null);var g=J("navigateTo");wt(a,f.R).then(function(d){var e=Pj(d.aa,b);e?yt(a,{R:f.R,$:-1,Ha:Kj(d.aa,e)}).Da(g):c.R !== f.R?yt(a,{R:f.R,$:0,Ha:-1}).Da(g):M(g,null);});return g.result();}function vt(a,b,c){var d=b.Xa.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position = "absolute";e.style.top = "0";e.style.left = "0";Dj || (e.style.visibility = "hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new ik(e,f);g.R = b.item.R;g.position = c;g.offset = rs(b.Xa,c);g.offset || (b = a.b.A.re("",b.item.src),f.setAttribute("id",b),lk(g,f,b));d !== a.viewport && (a = Vf(null,new af(pb(a.viewport.width,a.viewport.height,d.width,d.height),null)),g.A.push(new fk(e,"transform",a)));return g;}function Gt(a,b){var c=gt();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d = d.importNode(a,!0);e.appendChild(d);d = c.queue;d.Push(["Typeset",c,e]);var c=J("makeMathJaxView"),f=he(c);d.Push(function(){f.ib(e);});return c.result();}return K(null);}n.ge = function(a){var b=this;return function(c,d){var e;if("object" == c.localName && "http://www.w3.org/1999/xhtml" == c.namespaceURI){var f=c.getAttribute("data");e = null;if(f){var f=oa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=jt(b.b,f);h && (h = b.b.l[h]) && (g = h.f);}if(g && (h = b.b.T[g])){e = b.viewport.b.createElement("iframe");e.style.border = "none";var f=Ia(f),l=Ia(g),g=new Ca();g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h = c.firstChild;h;h = h.nextSibling) 1 == h.nodeType && (l = h,"param" == l.localName && "http://www.w3.org/1999/xhtml" == l.namespaceURI && (f = l.getAttribute("name"),l = l.getAttribute("value"),f && l && (g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g = c.getAttribute("width")) && e.setAttribute("width",g);(g = c.getAttribute("height")) && e.setAttribute("height",g);}}e || (e = b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e = K(e);}else if("http://www.w3.org/1998/Math/MathML" == c.namespaceURI)e = Gt(c,d);else if("http://example.com/sse" == c.namespaceURI){e = d?d.ownerDocument:b.viewport.b;g = c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g = "span";break;case "ruby":case "rp":case "rt":break;default:g = "div";}e = e.createElement(g);e.setAttribute("data-adapt-process-children","true");e = K(e);}else e = c.dataset && "true" == c.dataset.mathTypeset?Gt(c,d):K(null);return e;};};function wt(a,b){if(b >= a.b.b.length)return K(null);var c=a.qc[b];if(c)return K(c);var d=J("getPageViewItem"),e=a.l[b];if(e){var f=he(d);e.push(f);return d.result();}var e=a.l[b] = [],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b || 1 != a.b.b.length || (g.b = Math.ceil(Mj(f) / 2700),a.b.G = g.b);var k=h.f[f.url],l=a.ge(f),p=a.viewport,q=ns(k,p.width,p.height,p.fontSize);if(q.width != p.width || q.height != p.height || q.fontSize != p.fontSize)p = new nr(p.window,q.fontSize,p.root,q.width,q.height);q = a.qc[b - 1];null !== g.kb?q = g.kb - 1:(q = q?q.Xa.Y + q.pb.length:0,null !== g.oc && (q += g.oc));rp(a.f,q);var r=new os(k,f,a.b.lang,p,a.h,a.j,l,a.b.H,q,a.b.A,a.f);r.X = a.X;ps(r).then(function(){c = {item:g,aa:f,Xa:r,Ya:[null],pb:[],complete:!1};a.qc[b] = c;M(d,c);e.forEach(function(a){a.ib(c);});});});return d.result();}function Ht(a){return a.qc.some(function(a){return a && 0 < a.pb.length;});}n.Ed = function(){var a=this.b,b=a.O || a.Y;if(!b)return K(null);var c=J("showTOC");this.g || (this.g = new Ps(a.h,b.src,a.lang,this.h,this.j,this.X,this,a.H,a.A,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67 * a.width) - 16),d=a.height - 6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position = "absolute";e.style.visibility = "hidden";e.style.left = "3px";e.style.top = "3px";e.style.width = b + 10 + "px";e.style.maxHeight = d + "px";e.style.overflow = "scroll";e.style.overflowX = "hidden";e.style.background = "#EEE";e.style.border = "1px outset #999";e.style.borderRadius = "2px";e.style.boxShadow = " 5px 5px rgba(128,128,128,0.3)";this.g.Ed(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility = "visible";M(c,a);});return c.result();};n.xd = function(){this.g && this.g.xd();};n.Me = function(){return this.g && this.g.Me();};var It={Cg:"singlePage",Dg:"spread",sg:"autoSpread"};function Jt(a,b,c,d){var e=this;this.window = a;this.Nd = b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);Dj && b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Sa = c;this.Ra = d;a = a.document;this.ra = new $l(a.head,b);this.C = "loading";this.O = [];this.h = null;this.Sb = this.Qa = !1;this.f = this.j = this.g = this.F = null;this.fontSize = 16;this.zoom = 1;this.G = !1;this.W = "singlePage";this.ia = !1;this.pe = !0;this.X = lb();this.ha = [];this.J = function(){};this.A = function(){};this.Y = function(){e.Qa = !0;e.J();};this.me = this.me.bind(this);this.H = function(){};this.I = a.getElementById("vivliostyle-page-rules");this.T = !1;this.l = null;this.na = {loadEPUB:this.Rf,loadXML:this.Sf,configure:this.Ae,moveTo:this.wa,toc:this.Ed};Kt(this);}function Kt(a){ka(1,(function(a){Lt(this,{t:"debug",content:a});}).bind(a));ka(2,(function(a){Lt(this,{t:"info",content:a});}).bind(a));ka(3,(function(a){Lt(this,{t:"warn",content:a});}).bind(a));ka(4,(function(a){Lt(this,{t:"error",content:a});}).bind(a));}function Lt(a,b){b.i = a.Sa;a.Ra(b);}function Mt(a,b){a.C !== b && (a.C = b,a.Nd.setAttribute("data-vivliostyle-viewer-status",b),Lt(a,{t:"readystatechange"}));}n = Jt.prototype;n.Rf = function(a){Nt.f("beforeRender");Mt(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport = null;var g=J("loadEPUB"),h=this;h.Ae(a).then(function(){var a=new Ss();Js(a,e,f).then(function(){var e=oa(b,h.window.location.href);h.O = [e];Us(a,e,d).then(function(a){h.h = a;Ot(h,c).then(function(){M(g,!0);});});});});return g.result();};n.Sf = function(a){Nt.f("beforeRender");Mt(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport = null;var g=J("loadXML"),h=this;h.Ae(a).then(function(){var a=new Ss();Js(a,e,f).then(function(){var e=b.map(function(a,b){return {url:oa(a.url,h.window.location.href),index:b,kb:a.kb,oc:a.oc};});h.O = e.map(function(a){return a.url;});h.h = new Ws(a,"");lt(h.h,e,c).then(function(){Ot(h,d).then(function(){M(g,!0);});});});});return g.result();};function Ot(a,b){Pt(a);var c;b?c = nt(a.h,b).fa(function(b){a.f = b;return K(!0);}):c = K(!0);return c.fa(function(){Nt.b("beforeRender");return Qt(a);});}function Rt(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string" === typeof b && (e = b.match(d))){d = e[0];if("em" === d || "rem" === d)return c * a.fontSize;if("ex" === d || "rex" === d)return c * Bb.ex * a.fontSize / Bb.em;if(d = Bb[d])return c * d;}return c;}n.Ae = function(a){"boolean" == typeof a.autoresize && (a.autoresize?(this.F = null,this.window.addEventListener("resize",this.Y,!1),this.Qa = !0):this.window.removeEventListener("resize",this.Y,!1));if("number" == typeof a.fontSize){var b=a.fontSize;5 <= b && 72 >= b && this.fontSize != b && (this.fontSize = b,this.Qa = !0);}"object" == typeof a.viewport && a.viewport && (b = a.viewport,b = {marginLeft:Rt(this,b["margin-left"]) || 0,marginRight:Rt(this,b["margin-right"]) || 0,marginTop:Rt(this,b["margin-top"]) || 0,marginBottom:Rt(this,b["margin-bottom"]) || 0,width:Rt(this,b.width) || 0,height:Rt(this,b.height) || 0},200 <= b.width || 200 <= b.height) && (this.window.removeEventListener("resize",this.Y,!1),this.F = b,this.Qa = !0);"boolean" == typeof a.hyphenate && (this.X.be = a.hyphenate,this.Qa = !0);"boolean" == typeof a.horizontal && (this.X.ae = a.horizontal,this.Qa = !0);"boolean" == typeof a.nightMode && (this.X.ie = a.nightMode,this.Qa = !0);"number" == typeof a.lineHeight && (this.X.lineHeight = a.lineHeight,this.Qa = !0);"number" == typeof a.columnWidth && (this.X.Wd = a.columnWidth,this.Qa = !0);"string" == typeof a.fontFamily && (this.X.fontFamily = a.fontFamily,this.Qa = !0);"boolean" == typeof a.load && (this.ia = a.load);"boolean" == typeof a.renderAllPages && (this.pe = a.renderAllPages);"string" == typeof a.userAgentRootURL && (ma = a.userAgentRootURL.replace(/resources\/?$/,""),na = a.userAgentRootURL);"string" == typeof a.rootURL && (ma = a.rootURL,na = ma + "resources/");"string" == typeof a.pageViewMode && a.pageViewMode !== this.W && (this.W = a.pageViewMode,this.Qa = !0);"number" == typeof a.pageBorder && a.pageBorder !== this.X.Fc && (this.viewport = null,this.X.Fc = a.pageBorder,this.Qa = !0);"number" == typeof a.zoom && a.zoom !== this.zoom && (this.zoom = a.zoom,this.Sb = !0);"boolean" == typeof a.fitToScreen && a.fitToScreen !== this.G && (this.G = a.fitToScreen,this.Sb = !0);"object" == typeof a.defaultPaperSize && "number" == typeof a.defaultPaperSize.width && "number" == typeof a.defaultPaperSize.height && (this.viewport = null,this.X.fc = a.defaultPaperSize,this.Qa = !0);St(this,a);return K(!0);};function St(a,b){Sd("CONFIGURATION").forEach((function(a){a = a(b);this.Qa = a.Qa || this.Qa;this.Sb = a.Sb || this.Sb;}).bind(a));}n.me = function(a){var b=this.g,c=this.j,d=a.target;c?c.left !== d && c.right !== d || Tt(this,a.Gf):b === a.target && Tt(this,a.Gf);};function Ut(a,b){var c=[];a.g && c.push(a.g);a.j && (c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a && b(a);});}function Vt(a){Ut(a,(function(a){a.removeEventListener("hyperlink",this.H,!1);a.removeEventListener("replaced",this.me,!1);}).bind(a));}function Wt(a){Vt(a);Ut(a,function(a){w(a.L,"display","none");});a.g = null;a.j = null;}function Xt(a,b){b.addEventListener("hyperlink",a.H,!1);b.addEventListener("replaced",a.me,!1);w(b.L,"visibility","visible");w(b.L,"display","block");}function Yt(a,b){Wt(a);a.g = b;Xt(a,b);}function Zt(a){var b=J("reportPosition");mt(a.h,a.f.R,a.f.Ha).then(function(c){var d=a.g;(a.ia && 0 < d.j.length?te(d.j):K(!0)).then(function(){$t(a,d,c).Da(b);});});return b.result();}function au(a){var b=a.Nd;if(a.F){var c=a.F;b.style.marginLeft = c.marginLeft + "px";b.style.marginRight = c.marginRight + "px";b.style.marginTop = c.marginTop + "px";b.style.marginBottom = c.marginBottom + "px";return new nr(a.window,a.fontSize,b,c.width,c.height);}return new nr(a.window,a.fontSize,b);}function bu(a){var b=au(a),c;a: switch(a.W){case "singlePage":c = !1;break a;case "spread":c = !0;break a;default:c = 1.45 <= b.width / b.height && 800 < b.width;}var d=a.X.rb !== c;a.X.rb = c;a.Nd.setAttribute("data-vivliostyle-spread-view",c);if(a.F || !a.viewport || a.viewport.fontSize != a.fontSize)return !1;if(!d && b.width == a.viewport.width && b.height == a.viewport.height)return !0;if(d = a.b && Ht(a.b)){a: {d = a.b.qc;for(c = 0;c < d.length;c++) {var e=d[c];if(e)for(var e=e.pb,f=0;f < e.length;f++) {var g=e[f];if(g.G && g.F){d = !0;break a;}}}d = !1;}d = !d;}return d?(a.viewport.width = b.width,a.viewport.height = b.height,a.Sb = !0):!1;}n.kg = function(a,b,c,d){this.ha[d] = a;cu(this,b,c,d);};function cu(a,b,c,d){if(!a.T && a.I && !c && !d){var e="";Object.keys(b).forEach(function(a){e += "@page " + a + "{size:";a = b[a];e += a.width + "px " + a.height + "px;}";});a.I.textContent = e;a.T = !0;}}function du(a){if(a.b){a.b.xd();for(var b=a.b,c=b.qc,d=0;d < c.length;d++) {var e=c[d];e && e.pb.splice(0);}for(b = b.viewport.root;b.lastChild;) b.removeChild(b.lastChild);}a.I && (a.I.textContent = "",a.T = !1);a.viewport = au(a);b = a.viewport;w(b.g,"width","");w(b.g,"height","");w(b.f,"width","");w(b.f,"height","");w(b.f,"transform","");a.b = new rt(a.h,a.viewport,a.ra,a.X,a.kg.bind(a));}function Tt(a,b,c){a.Sb = !1;Vt(a);if(a.X.rb)return Ct(a.b,a.f,c).fa(function(c){Wt(a);a.j = c;c.left && (Xt(a,c.left),c.right || c.left.L.setAttribute("data-vivliostyle-unpaired-page",!0));c.right && (Xt(a,c.right),c.left || c.right.L.setAttribute("data-vivliostyle-unpaired-page",!0));c = eu(a,c);a.viewport.zoom(c.width,c.height,a.G?fu(a,c):a.zoom);a.g = b;return K(null);});Yt(a,b);a.viewport.zoom(b.f.width,b.f.height,a.G?fu(a,b.f):a.zoom);a.g = b;return K(null);}function eu(a,b){var c=0,d=0;b.left && (c += b.left.f.width,d = b.left.f.height);b.right && (c += b.right.f.width,d = Math.max(d,b.right.f.height));b.left && b.right && (c += 2 * a.X.Fc);return {width:c,height:d};}var gu={xg:"fit inside viewport"};function fu(a,b){return Math.min(a.viewport.width / b.width,a.viewport.height / b.height);}function hu(){this.name = "RenderingCanceledError";this.message = "Page rendering has been canceled";this.stack = Error().stack;}t(hu,Error);function Pt(a){if(a.l){var b=a.l;Zd(b,new hu());if(b !== Td && b.b){b.b.g = !0;var c=new ie(b);b.l = "interrupt";b.b = c;b.f.ib(c);}}a.l = null;}function Qt(a){a.Qa = !1;a.Sb = !1;if(bu(a))return K(!0);Mt(a,"loading");Pt(a);var b=ae(Td.f,function(){return Yd("resize",function(c){a.l = b;Nt.f("render (resize)");du(a);a.f && (a.f.$ = -1);At(a.b,a.f).then(function(d){a.f = d.position;Tt(a,d.page,!0).then(function(){Zt(a).then(function(d){Mt(a,"interactive");(a.pe?a.b.pe():K(null)).then(function(){a.l === b && (a.l = null);Nt.b("render (resize)");Mt(a,"complete");Lt(a,{t:"loaded"});M(c,d);});});});});},function(a,b){if(b instanceof hu)Nt.b("render (resize)"),v.debug(b.message);else throw b;});});return K(!0);}function $t(a,b,c){var d=J("sendLocationNotification"),e={t:"nav",first:b.H,last:b.C};pt(a.h,a.f).then(function(b){e.epage = b;e.epageCount = a.h.G;c && (e.cfi = c);Lt(a,e);M(d,!0);});return d.result();}Jt.prototype.Qb = function(){return this.b?this.b.Qb(this.f):null;};Jt.prototype.wa = function(a){var b=this;"complete" !== this.C && Mt(this,"loading");if("string" == typeof a.where){switch(a.where){case "next":a = this.X.rb?this.b.eg:this.b.nextPage;break;case "previous":a = this.X.rb?this.b.hg:this.b.ne;break;case "last":a = this.b.Zf;break;case "first":a = this.b.Vf;break;default:return K(!0);}if(a){var c=a;a = function(){return c.call(b.b,b.f);};}}else if("number" == typeof a.epage){var d=a.epage;a = function(){return Dt(b.b,d);};}else if("string" == typeof a.url){var e=a.url;a = function(){return Ft(b.b,e,b.f);};}else return K(!0);var f=J("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f = a.position;var d=J("moveTo.showCurrent");c = d.result();Tt(b,a.page).then(function(){Zt(b).Da(d);});}else c = K(!0);c.then(function(a){"loading" === b.C && Mt(b,"interactive");M(f,a);});});return f.result();};Jt.prototype.Ed = function(a){var b=!!a.autohide;a = a.v;var c=this.b.Me();if(c){if("show" == a)return K(!0);}else if("hide" == a)return K(!0);if(c)return this.b.xd(),K(!0);var d=this,e=J("showTOC");this.b.Ed(b).then(function(a){if(a){if(b){var c=function c(){d.b.xd();};a.addEventListener("hyperlink",c,!1);a.L.addEventListener("click",c,!1);}a.addEventListener("hyperlink",d.H,!1);}M(e,!0);});return e.result();};function iu(a,b){var c=b.a || "";return Yd("runCommand",function(d){var e=a.na[c];e?e.call(a,b).then(function(){Lt(a,{t:"done",a:c});M(d,!0);}):(v.error("No such action:",c),M(d,!0));},function(a,b){v.error(b,"Error during action:",c);M(a,!0);});}function ju(a){return "string" == typeof a?JSON.parse(a):a;}function ku(a,b){var c=ju(b),d=null;$d(function(){var b=J("commandLoop"),f=Td.f;a.H = function(b){var c="#" === b.href.charAt(0) || a.O.some(function(a){return b.href.substr(0,a.length) == a;});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};ae(f,function(){Lt(a,d);return K(!0);});}};pe(function(b){if(a.Qa)Qt(a).then(function(){N(b);});else if(a.Sb)a.g && Tt(a,a.g).then(function(){N(b);});else if(c){var e=c;c = null;iu(a,e).then(function(){N(b);});}else e = J("waitForCommand"),d = he(e,self),e.result().then(function(){N(b);});}).Da(b);return b.result();});a.J = function(){var a=d;a && (d = null,a.ib());};a.A = function(b){if(c)return !1;c = ju(b);a.J();return !0;};a.window.adapt_command = a.A;};function fr(a,b,c){if(a == b)return a?[[0,a]]:[];if(0 > c || a.length < c)c = null;var d=lu(a,b),e=a.substring(0,d);a = a.substring(d);b = b.substring(d);var d=mu(a,b),f=a.substring(a.length - d);a = a.substring(0,a.length - d);b = b.substring(0,b.length - d);a = nu(a,b);e && a.unshift([0,e]);f && a.push([0,f]);ou(a);null != c && (a = pu(a,c));return a;}function nu(a,b){var c;if(!a)return [[1,b]];if(!b)return [[-1,a]];c = a.length > b.length?a:b;var d=a.length > b.length?b:a,e=c.indexOf(d);if(-1 != e)return c = [[1,c.substring(0,e)],[0,d],[1,c.substring(e + d.length)]],a.length > b.length && (c[0][0] = c[2][0] = -1),c;if(1 == d.length)return [[-1,a],[1,b]];var f=qu(a,b);if(f)return d = f[1],e = f[3],c = f[4],f = fr(f[0],f[2]),d = fr(d,e),f.concat([[0,c]],d);a: {c = a.length;for(var d=b.length,e=Math.ceil((c + d) / 2),f=2 * e,g=Array(f),h=Array(f),l=0;l < f;l++) g[l] = -1,h[l] = -1;g[e + 1] = 0;h[e + 1] = 0;for(var l=c - d,k=!!(l % 2),m=0,p=0,q=0,r=0,z=0;z < e;z++) {for(var u=-z + m;u <= z - p;u += 2) {var A=e + u,I;I = u == -z || u != z && g[A - 1] < g[A + 1]?g[A + 1]:g[A - 1] + 1;for(var E=I - u;I < c && E < d && a.charAt(I) == b.charAt(E);) I++,E++;g[A] = I;if(I > c)p += 2;else if(E > d)m += 2;else if(k && (A = e + l - u,0 <= A && A < f && -1 != h[A])){var F=c - h[A];if(I >= F){c = ru(a,b,I,E);break a;}}}for(u = -z + q;u <= z - r;u += 2) {A = e + u;F = u == -z || u != z && h[A - 1] < h[A + 1]?h[A + 1]:h[A - 1] + 1;for(I = F - u;F < c && I < d && a.charAt(c - F - 1) == b.charAt(d - I - 1);) F++,I++;h[A] = F;if(F > c)r += 2;else if(I > d)q += 2;else if(!k && (A = e + l - u,0 <= A && A < f && -1 != g[A] && (I = g[A],E = e + I - A,F = c - F,I >= F))){c = ru(a,b,I,E);break a;}}}c = [[-1,a],[1,b]];}return c;}function ru(a,b,c,d){var e=a.substring(c),f=b.substring(d);a = fr(a.substring(0,c),b.substring(0,d));e = fr(e,f);return a.concat(e);}function lu(a,b){if(!a || !b || a.charAt(0) != b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c < e;) a.substring(f,e) == b.substring(f,e)?f = c = e:d = e,e = Math.floor((d - c) / 2 + c);return e;}function mu(a,b){if(!a || !b || a.charAt(a.length - 1) != b.charAt(b.length - 1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c < e;) a.substring(a.length - e,a.length - f) == b.substring(b.length - e,b.length - f)?f = c = e:d = e,e = Math.floor((d - c) / 2 + c);return e;}function qu(a,b){function c(a,b,c){for(var d=a.substring(c,c + Math.floor(a.length / 4)),e=-1,f="",g,h,k,l;-1 != (e = b.indexOf(d,e + 1));) {var m=lu(a.substring(c),b.substring(e)),F=mu(a.substring(0,c),b.substring(0,e));f.length < F + m && (f = b.substring(e - F,e) + b.substring(e,e + m),g = a.substring(0,c - F),h = a.substring(c + m),k = b.substring(0,e - F),l = b.substring(e + m));}return 2 * f.length >= a.length?[g,h,k,l,f]:null;}var d=a.length > b.length?a:b,e=a.length > b.length?b:a;if(4 > d.length || 2 * e.length < d.length)return null;var f=c(d,e,Math.ceil(d.length / 4)),d=c(d,e,Math.ceil(d.length / 2)),g;if(f || d)d?g = f?f[4].length > d[4].length?f:d:d:g = f;else return null;var h;a.length > b.length?(f = g[0],d = g[1],e = g[2],h = g[3]):(e = g[0],h = g[1],f = g[2],d = g[3]);return [f,d,e,h,g[4]];}function ou(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b < a.length;) switch(a[b][0]){case 1:d++;f += a[b][1];b++;break;case -1:c++;e += a[b][1];b++;break;case 0:if(1 < c + d){if(c && d){if(g = lu(f,e))0 < b - c - d && 0 == a[b - c - d - 1][0]?a[b - c - d - 1][1] += f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f = f.substring(g),e = e.substring(g);if(g = mu(f,e))a[b][1] = f.substring(f.length - g) + a[b][1],f = f.substring(0,f.length - g),e = e.substring(0,e.length - g);}c?d?a.splice(b - c - d,c + d,[-1,e],[1,f]):a.splice(b - c,c + d,[-1,e]):a.splice(b - d,c + d,[1,f]);b = b - c - d + (c?1:0) + (d?1:0) + 1;}else b && 0 == a[b - 1][0]?(a[b - 1][1] += a[b][1],a.splice(b,1)):b++;c = d = 0;f = e = "";}"" === a[a.length - 1][1] && a.pop();c = !1;for(b = 1;b < a.length - 1;) 0 == a[b - 1][0] && 0 == a[b + 1][0] && (a[b][1].substring(a[b][1].length - a[b - 1][1].length) == a[b - 1][1]?(a[b][1] = a[b - 1][1] + a[b][1].substring(0,a[b][1].length - a[b - 1][1].length),a[b + 1][1] = a[b - 1][1] + a[b + 1][1],a.splice(b - 1,1),c = !0):a[b][1].substring(0,a[b + 1][1].length) == a[b + 1][1] && (a[b - 1][1] += a[b + 1][1],a[b][1] = a[b][1].substring(a[b + 1][1].length) + a[b + 1][1],a.splice(b + 1,1),c = !0)),b++;c && ou(a);}fr.f = 1;fr.b = -1;fr.g = 0;function pu(a,b){var c;a: {var d=a;if(0 === b)c = [0,d];else {var e=0;for(c = 0;c < d.length;c++) {var f=d[c];if(-1 === f[0] || 0 === f[0]){var g=e + f[1].length;if(b === g){c = [c + 1,d];break a;}if(b < g){d = d.slice();g = b - e;e = [f[0],f[1].slice(0,g)];f = [f[0],f[1].slice(g)];d.splice(c,1,e,f);c = [c + 1,d];break a;}e = g;}}throw Error("cursor_pos is out of bounds!");}}d = c[1];c = c[0];e = d[c];f = d[c + 1];return null == e || 0 !== e[0]?a:null != f && e[1] + f[1] === f[1] + e[1]?(d.splice(c,2,f,e),su(d,c,2)):null != f && 0 === f[1].indexOf(e[1])?(d.splice(c,2,[f[0],e[1]],[0,e[1]]),e = f[1].slice(e[1].length),0 < e.length && d.splice(c + 2,0,[f[0],e]),su(d,c,3)):a;}function su(a,b,c){for(c = b + c - 1;0 <= c && c >= b - 1;c--) if(c + 1 < a.length){var d=a[c],e=a[c + 1];d[0] === e[1] && a.splice(c,2,[d[0],d[1] + e[1]]);}return a;};function er(a){return a.reduce(function(a,c){return c[0] === fr.b?a:a + c[1];},"");}function Lk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f < a[1].length;f++) {switch(a[0] * c){case fr.f:d++;break;case fr.b:d--;e++;break;case fr.g:e++;}if(e > b)return !0;}return !1;});return Math.max(Math.min(b,e - 1) + d,0);};function tu(a,b,c,d){Bm.call(this,a,b,"block-end",c);this.h = d;}t(tu,Bm);tu.prototype.He = function(a){return !(a instanceof tu);};function uu(a,b,c){Em.call(this,a,"block-end",b,c);}t(uu,Em);uu.prototype.Ga = function(){return Infinity;};uu.prototype.b = function(a){return a instanceof tu?!0:this.Ga() < a.Ga();};function vu(a){this.b = a;}vu.prototype.ub = function(a){a = Kk(a);return !xk(a,this.b.f);};function wu(){}n = wu.prototype;n.cf = function(a){return "footnote" === a.za;};n.bf = function(a){return a instanceof tu;};n.jf = function(a,b){var c="region",d=Pm(b,c);gn(Pm(b,"page"),d) && (c = "page");d = Kk(a);c = new tu(d,c,b.j,a.T);b.Qd(c);return K(c);};n.kf = function(a,b,c){return new uu(a[0].qa.b,a,c);};n.We = function(a,b){return Pm(b,a.b).b.filter(function(a){return a instanceof uu;})[0] || null;};n.Ze = function(a,b,c){a.lf = !0;a.vc = !1;var d=a.element,e=c.j;b = b.u;var f={},g;g = e.C._pseudos;b = Kq(e,b,e.C,f);if(g && g.before){var h={},l=Wq(e,"http://www.w3.org/1999/xhtml","span");Dq(l,"before");d.appendChild(l);Kq(e,b,g.before,h);delete h.content;Zq(e,l,h);}delete f.content;Zq(e,d,f);a.u = b;ep(a,d);if(e = lo(c.f,d))a.marginLeft = X(e.marginLeft),a.borderLeft = X(e.borderLeftWidth),a.C = X(e.paddingLeft),a.marginTop = X(e.marginTop),a.borderTop = X(e.borderTopWidth),a.F = X(e.paddingTop),a.marginRight = X(e.marginRight),a.ha = X(e.borderRightWidth),a.I = X(e.paddingRight),a.marginBottom = X(e.marginBottom),a.Y = X(e.borderBottomWidth),a.H = X(e.paddingBottom);if(c = lo(c.f,d))a.width = X(c.width),a.height = X(c.height);};n.Of = function(a,b){switch(a.h){case ld:yn(b,new vu(a),a.b);}};zn.push(new wu());function xu(a,b){this.g(a,"end",b);}function yu(a,b){this.g(a,"start",b);}function zu(a,b,c){c || (c = this.j.now());var d=this.h[a];d || (d = this.h[a] = []);var e;for(a = d.length - 1;0 <= a && (!(e = d[a]) || e[b]);a--) e = null;e || (e = {},d.push(e));e[b] = c;}function Au(){}function Bu(a){this.j = a;this.h = {};this.registerEndTiming = this.b = this.registerStartTiming = this.f = this.g = Au;}Bu.prototype.l = function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f < e;f++) {var g=d[f];b += c;1 < e && (b += "(" + f + ")");b += " => start: " + g.start + ", end: " + g.end + ", duration: " + (g.end - g.start) + "\n";}});v.g(b);};Bu.prototype.A = function(){this.registerEndTiming = this.b = this.registerStartTiming = this.f = this.g = Au;};Bu.prototype.C = function(){this.g = zu;this.registerStartTiming = this.f = yu;this.registerEndTiming = this.b = xu;};var Cu={now:Date.now},Nt,Du=Nt = new Bu(window && window.performance || Cu);zu.call(Du,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Du);Bu.prototype.printTimings = Bu.prototype.l;Bu.prototype.disable = Bu.prototype.A;Bu.prototype.enable = Bu.prototype.C;function Pn(a){return (a = a.D) && a instanceof So?a:null;}function Eu(a,b,c){var d=a.b;return d && !d.lc && (a = Fu(a,b),a.B)?!d.ic || d.lc?K(!0):Gu(d,d.ic,a,null,c):K(!0);}function Hu(a,b,c){var d=a.b;return d && (a = Fu(a,b),a.B)?!d.jc || d.mc?K(!0):Gu(d,d.jc,a,a.B.firstChild,c):K(!0);}function Iu(a,b){a && Ju(a.K?a.parent:a,function(a,d){a instanceof Ro || b.l.push(new Ku(d));});}function Ju(a,b){for(var c=a;c;c = c.parent) {var d=c.D;d && d instanceof So && !Ok(c,d) && b(d,c);}}function So(a,b){this.parent = a;this.j = b;this.b = null;}So.prototype.we = function(){return "Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)";};So.prototype.Je = function(a,b){return b;};function Lu(a,b){var c=Fu(a,b);return c?c.B:null;}function Fu(a,b){do if(!Ok(b,a) && b.N === a.j)return b;while(b = b.parent);return null;}function br(a,b){a.b || ap.some((function(a){return a.root === this.j?(this.b = a.elements,!0):!1;}).bind(a)) || (a.b = new Mu(b,a.j),ap.push({root:a.j,elements:a.b}));}So.prototype.ye = function(){};So.prototype.xe = function(){};var ap=[];function Mu(a,b){this.u = a;this.ic = this.jc = this.A = this.F = this.l = this.C = null;this.H = this.I = 0;this.lc = this.mc = !1;this.Qc = this.Yd = !0;this.j = !1;this.W = b;this.J = this.g = null;this.O = [];this.T = [];}function Nu(a,b){a.jc || (a.jc = yk(b),a.C = b.N,a.F = b.B);}function Ou(a,b){a.ic || (a.ic = yk(b),a.l = b.N,a.A = b.B);}function Gu(a,b,c,d,e){var f=c.B,g=c.B.ownerDocument.createElement("div");f.appendChild(g);var h=new lm(e,g,c),l=h.b.b;h.b.b = null;a.h = !0;return om(h,new Pk(b)).fa((function(){this.h = !1;f.removeChild(g);if(f)for(;g.firstChild;) {var a=g.firstChild;g.removeChild(a);a.setAttribute("data-adapt-spec","1");d?f.insertBefore(a,d):f.appendChild(a);}h.b.b = l;return K(!0);}).bind(a));}Mu.prototype.b = function(a){var b=0;if(a && !this.f(a))return b;if(!this.lc || a && Pu(this,a))b += this.H;this.mc || (b += this.I);return b;};Mu.prototype.G = function(a){var b=0;if(a && !this.f(a))return b;a && Pu(this,a) && (b += this.H);this.Qc || (b += this.I);return b;};function Pu(a,b){return Qu(b,a.T,(function(){return Ru(this.J,b,!1);}).bind(a));}Mu.prototype.f = function(a){return Qu(a,this.O,(function(){return Ru(this.W,a,!0);}).bind(this));};function Qu(a,b,c){var d=b.filter(function(b){return b.w.N === a.N && b.w.K === a.K;});if(0 < d.length)return d[0].result;c = c(a);b.push({w:a,result:c});return c;}function Ru(a,b,c){for(var d=[];a;a = a.parentNode) {if(b.N === a)return b.K;d.push(a);}for(a = b.N;a;a = a.parentNode) {var e=d.indexOf(a);if(0 <= e)return c?!e:!1;for(e = a;e;e = e.previousElementSibling) if(0 <= d.indexOf(e))return !0;}return b.K;}function Su(a){return !a.lc && a.Yd && a.ic || !a.mc && a.Qc && a.jc?!0:!1;}function Tu(a){this.D = a;}Tu.prototype.b = function(){};Tu.prototype.f = function(a){return !!a;};Tu.prototype.g = function(a,b,c,d){(a = this.D.b) && !a.j && (a.F && (a.I = fp(a.F,c,a.u),a.F = null),a.A && (a.H = fp(a.A,c,a.u),a.A = null),a.j = !0);return d;};function Uu(a){this.D = a;}Uu.prototype.b = function(){};Uu.prototype.f = function(){return !0;};Uu.prototype.g = function(a,b,c,d){return d;};function Vu(a){this.D = a;}t(Vu,Tu);Vu.prototype.b = function(a,b){Tu.prototype.b.call(this,a,b);var c=J("BlockLayoutProcessor.doInitialLayout");im(new hm(new Wu(a.D),b.j),a).Da(c);return c.result();};Vu.prototype.f = function(){return !1;};function Xu(a){this.D = a;}t(Xu,Uu);Xu.prototype.b = function(a,b){Ok(a,this.D) || a.K || b.l.unshift(new Ku(a));return Yu(a,b);};function Ku(a){this.w = Fu(a.D,a);}n = Ku.prototype;n.ub = function(a,b){var c=this.w.D.b;return c && !jo(this.w.B) && Su(c)?b && !a || a && a.b?!1:!0:!0;};n.Ad = function(){var a=this.w.D.b;return a && Su(a)?(!a.lc && a.Yd && a.ic?a.lc = !0:!a.mc && a.Qc && a.jc && (a.mc = !0),!0):!1;};n.nd = function(a,b,c,d){(c = this.w.D.b) && a && d.h && (!b || Pu(c,b)) && (c.lc = !1,c.Yd = !1);};n.Fa = function(a,b){var c=this.w.D,d=this.w.D.b;if(!d)return K(!0);var e=this.w;return Hu(c,e,b).fa(function(){return Eu(c,e,b).fa(function(){d.mc = d.lc = !1;d.Yd = !0;d.Qc = !0;return K(!0);});});};n.De = function(a){return a instanceof Ku?this.w.D === a.w.D:!1;};n.Ge = function(){return 10;};function Zu(a){rm.call(this);this.D = a;}t(Zu,rm);Zu.prototype.j = function(a){var b=this.D.b;return Ok(a,this.D) || b.j?(Ok(a,this.D) || a.K || !b || (b.mc = !1,b.Qc = !1),new Xu(this.D)):new Vu(this.D);};function Wu(a){this.D = a;}t(Wu,km);Wu.prototype.jd = function(a){var b=this.D,c=a.w,d=b.b;if(c.parent && b.j === c.parent.N){switch(c.h){case "header":if(d.jc)c.h = "none";else return Nu(d,c),K(!0);break;case "footer":if(d.ic)c.h = "none";else return Ou(d,c),K(!0);}d.g || (d.g = c.N);}return km.prototype.jd.call(this,a);};Wu.prototype.ac = function(a){var b=this.D,c=a.w;c.N === b.j && (b.b.J = a.Dc && a.Dc.N,a.Fb = !0);return "header" === c.h || "footer" === c.h?K(!0):km.prototype.ac.call(this,a);};function $u(){}t($u,cp);$u.prototype.Pd = function(a,b,c){if(Sn(b,a))return ao(b,a);var d=a.D;return Lu(d,a)?(c && Iu(a.parent,b),Ok(a,d)?cp.prototype.Pd.call(this,a,b,c):sm(new Zu(d),a,b)):co(b,a);};$u.prototype.ze = function(a){var b=Pn(a).b;if(!b)return !1;b.h || b.C !== a.N && b.l !== a.N || a.B.parentNode.removeChild(a.B);return !1;};function Yu(a,b){var c=a.D,d=J("doLayout"),e=jm(b.j,a,!1);bo(e,b).then(function(a){var e=a;pe(function(a){for(;e;) {var d=!0;Uo(b,e,!1).then(function(f){e = f;hn(b.g)?O(a):b.b?O(a):e && b.h && e && e.b?O(a):e && e.K && e.N == c.j?O(a):d?d = !1:N(a);});if(d){d = !1;return;}}O(a);}).then(function(){M(d,e);});});return d.result();}$u.prototype.Fa = function(a,b,c,d){return cp.prototype.Fa.call(this,a,b,c,d);};$u.prototype.md = function(a,b,c,d){cp.prototype.md(a,b,c,d);};function Mn(a){for(var b=[],c=a;c;c = c.Cb) c.l.forEach(function(c){if(c instanceof Ku){var d=c.w.D.b;b.push(d);}c instanceof av && (d = new bv(c.w,c.f),b.push(d));c instanceof cv && dv(c,a).forEach(function(a){b.push(a);});});return b;}var ev=new $u();Rd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof So && !(a instanceof Ro)?ev:null;});function fv(a,b){if(!a || !a.J || a.K)return K(a);var c=a.J;return gv(c,b,a).fa(function(d){var e=a.B;e.appendChild(d);var f=fp(d,b,a.u);e.removeChild(d);b.l.push(new av(a,c,f));return K(a);});}function hv(a,b,c){this.b = a;this.f = b;this.vb = c;}hv.prototype.matches = function(){var a=iv[this.b];return !!a && null != a.Ka && gi(a.Ka,this.f,this.vb);};function $i(a){this.b = a;}$i.prototype.matches = function(){return this.b.some(function(a){return a.matches();});};function aj(a){this.b = a;}aj.prototype.matches = function(){return this.b.every(function(a){return a.matches();});};function Zi(a,b){var c=b.split("_");if("NFS" == c[0])return new hv(a,parseInt(c[1],10),parseInt(c[2],10));fa("unknown view condition. condition=" + b);return null;}function zj(a,b,c){Hq(c,function(c){Bj(a,c,b);});}function Hq(a,b){var c=a._viewConditionalStyles;c && c.forEach(function(a){a.ag.matches() && b(a.lg);});}function Sq(a,b,c){var d=iv;if(!d[a] || d[a].Ua <= c)d[a] = {Ka:b,Ua:c};}var iv={};function ar(a,b){this.b = b;this.N = a;}function gv(a,b,c){var d=c.B.ownerDocument.createElement("div"),e=new lm(b,d,c),f=e.b.b;e.b.b = null;return om(e,jv(a)).fa((function(){this.b.f["after-if-continues"] = !1;e.b.b = f;var a=d.firstChild;w(a,"display","block");return K(a);}).bind(a));}function jv(a){var b=Bq.createElementNS("http://www.w3.org/1999/xhtml","div");Dq(b,"after-if-continues");a = new Ek(a.N,b,null,null,null,3,a.b);return new Pk({ma:[{node:b,Za:a.type,pa:a,Aa:null,va:null}],ka:0,K:!1,Ia:null});}function av(a,b,c){this.w = a;this.b = b;this.f = c;}n = av.prototype;n.ub = function(a,b){return b && !a || a && a.b?!1:!0;};n.Ad = function(){return !1;};n.nd = function(){};n.Fa = function(a,b){return new bv(this.w,this.f).f(a)?gv(this.b,b,this.w).fa((function(a){this.w.B.appendChild(a);return K(!0);}).bind(this)):K(!0);};n.De = function(a){return a instanceof av?this.b == a.b:!1;};n.Ge = function(){return 9;};function bv(a,b){this.w = a;this.g = b;}bv.prototype.b = function(a){return this.f(a)?this.g:0;};bv.prototype.G = function(a){return this.b(a);};bv.prototype.f = function(a){if(!a)return !1;var b=a.pa?a.pa.la:a.N;if(b === this.w.N)return !!a.K;for(a = b.parentNode;a;a = a.parentNode) if(a === this.w.N)return !0;return !1;};function bo(a,b){return a.fa(function(a){return fv(a,b);});}function bp(a,b){var c=J("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;oe(function(){if(d){var a=fv(d,b);d = d.parent;return a.tc(!0);}return K(!1);}).then(function(){M(c,!0);});return c.result();};function kv(a,b,c){var d=a.w,e=d.display,f=d.parent?d.parent.display:null;return "table-row" === e && !lv(f) && "table" !== f && "inline-table" !== f || "table-cell" === e && "table-row" !== f && !lv(f) && "table" !== f && "inline-table" !== f || d.D instanceof Ro && d.D !== b?co(c,d).fa(function(b){a.w = b;return K(!0);}):null;}function lv(a){return "table-row-group" === a || "table-header-group" === a || "table-footer-group" === a;}function mv(a,b){this.rowIndex = a;this.N = b;this.cells = [];}function nv(a){return Math.min.apply(null,a.cells.map(function(a){return a.height;}));}function ov(a,b,c){this.rowIndex = a;this.Ja = b;this.f = c;this.b = c.colSpan || 1;this.rowSpan = c.rowSpan || 1;this.height = 0;this.cc = null;}function pv(a,b,c){this.rowIndex = a;this.Ja = b;this.Lb = c;}function qv(a,b,c){this.g = a;this.b = c;this.Wb = new lm(a,b,c);this.f = !1;}qv.prototype.Pb = function(){var a=this.b.B,b=this.b.W;"middle" !== b && "bottom" !== b || w(a,"vertical-align","top");var c=this.Wb.Pb(!0);w(a,"vertical-align",b);return c;};function rv(a,b){this.B = a;this.b = b;}function sv(a,b,c,d){qm.call(this,a,b,c,d);this.D = a.D;this.rowIndex = this.j = null;}t(sv,qm);sv.prototype.f = function(a,b){var c=qm.prototype.f.call(this,a,b);return b < this.b()?null:tv(this).every(function(a){return !!a.w;})?c:null;};sv.prototype.b = function(){var a=qm.prototype.b.call(this);tv(this).forEach(function(b){a += b.Gb.b();});return a;};function tv(a){a.j || (a.j = uv(a).map(function(a){return a.Pb();}));return a.j;}function uv(a){return vv(a.D,null != a.rowIndex?a.rowIndex:a.rowIndex = wv(a.D,a.position.N)).map(a.D.wd,a.D);}function xv(a,b,c){this.rowIndex = a;this.j = b;this.D = c;this.h = null;}t(xv,In);xv.prototype.f = function(a,b){if(b < this.b())return null;var c=yv(this),d=zv(this),e=d.every(function(a){return !!a.w;}) && d.some(function(a,b){var d=a.w,e=c[b].Wb.Se[0];return !(e.B === d.B && e.K === d.K && e.ka === d.ka);});this.j.b = d.some(function(a){return a.w && a.w.b;});return e?this.j:null;};xv.prototype.b = function(){var a=this.D,b=0;Av(a,a.g[this.rowIndex]) || (b += 10);zv(this).forEach(function(a){b += a.Gb.b();});return b;};function zv(a){a.h || (a.h = yv(a).map(function(a){return a.Pb();}));return a.h;}function yv(a){return Bv(a.D,a.rowIndex).map(a.D.wd,a.D);}function Ro(a,b){So.call(this,a,b);this.G = b;this.u = !1;this.C = -1;this.J = 0;this.H = [];this.I = this.A = null;this.O = 0;this.g = [];this.l = [];this.f = [];this.F = null;this.h = [];this.b = null;}t(Ro,So);n = Ro.prototype;n.we = function(){return "Table formatting context (vivliostyle.table.TableFormattingContext)";};n.Je = function(a,b){if(!b)return b;switch(a.display){case "table-row":return !this.h.length;case "table-cell":return !this.h.some(function(b){return b.qd.ma[0].node === a.N;});default:return b;}};function Cv(a,b){var c=a.l[b];c || (c = a.l[b] = []);return c;}function wv(a,b){return a.g.findIndex(function(a){return b === a.N;});}function Bv(a,b){return Cv(a,b).reduce(function(a,b){return b.Lb !== a[a.length - 1]?a.concat(b.Lb):a;},[]);}function vv(a,b){return Bv(a,b).filter(function(a){return a.rowIndex + a.rowSpan - 1 > b;});}n.wd = function(a){return this.f[a.rowIndex] && this.f[a.rowIndex][a.Ja];};function Av(a,b){return nv(b) > a.J / 2;}function Dv(a){0 > a.C && (a.C = Math.max.apply(null,a.g.map(function(a){return a.cells.reduce(function(a,b){return a + b.b;},0);})));return a.C;}function Ev(a,b){a.g.forEach(function(a){a.cells.forEach(function(a){var c=nk(b,a.f);a.f = null;a.height = this.u?c.width:c.height;},this);},a);}function Fv(a,b){if(!b)return null;var c=null,d=0;a: for(;d < a.f.length;d++) if(a.f[d])for(var e=0;e < a.f[d].length;e++) if(a.f[d][e] && b === a.f[d][e].Wb.b){c = a.g[d].cells[e];break a;}if(!c)return null;for(;d < a.l.length;d++) for(;e < a.l[d].length;e++) {var f=a.l[d][e];if(f.Lb === c)return {rowIndex:f.rowIndex,Ja:f.Ja};}return null;}function Gv(a,b){var c=[];return a.l.reduce((function(a,e,f){if(f >= b.rowIndex)return a;e = this.wd(e[b.Ja].Lb);if(!e || 0 <= c.indexOf(e))return a;Hv(e.Wb.b,a);c.push(e);return a;}).bind(a),[]);}function Iv(a){var b=[];a.g.forEach((function(a){a.cells.forEach((function(a,c){b[c] || (b[c] = {gf:[],elements:[]});var d=b[c],e=this.wd(a);!e || 0 <= d.gf.indexOf(e) || (Hv(e.Wb.b,d.elements),d.gf.push(e));}).bind(this));}).bind(a));return [new Jv(b.map(function(a){return a.elements;}))];}function Hv(a,b){a.l.forEach(function(a){a instanceof Ku && b.push(a.w.D.b);a instanceof cv && dv(a,null).forEach(function(a){b.push(a);});});}n.ye = function(){return [].concat(this.h);};n.xe = function(a){this.h = a;};function Jv(a){this.f = a;}Jv.prototype.b = function(a){return Kv(this,a,function(a){return a.current;});};Jv.prototype.G = function(a){return Kv(this,a,function(a){return a.he;});};function Kv(a,b,c){var d=0;a.f.forEach(function(a){a = Jn(b,a);d = Math.max(d,c(a));});return d;}function Lv(a,b){this.D = a;this.h = b;this.rowIndex = -1;this.Ja = 0;this.g = !1;this.f = [];}t(Lv,km);n = Lv.prototype;n.jd = function(a){var b=this.D,c=kv(a,b,this.h);if(c)return c;Mv(this,a);var c=a.w,d=b.b;switch(c.display){case "table":b.O = c.ia;break;case "table-caption":b.H.push(new rv(c.B,c.ha));break;case "table-header-group":return d.jc || (this.b = !0,Nu(d,c)),K(!0);case "table-footer-group":return d.ic || (this.b = !0,Ou(d,c)),K(!0);case "table-row":this.b || (this.g = !0,this.rowIndex++,this.Ja = 0,b.g[this.rowIndex] = new mv(this.rowIndex,c.N),d.g || (d.g = c.N));}return km.prototype.jd.call(this,a);};n.ac = function(a){var b=this.D,c=a.w,d=c.display,e=this.h.f;Mv(this,a);if(c.N === b.G)d = lo(e,Lu(b,c)),b.J = parseFloat(d[b.u?"height":"width"]),b.b.J = a.Dc && a.Dc.N,a.Fb = !0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b = !1,K(!0);break;case "table-row":this.b || (b.F = c.B,this.g = !1);break;case "table-cell":if(!this.b){this.g || (this.rowIndex++,this.Ja = 0,this.g = !0);d = this.rowIndex;c = new ov(this.rowIndex,this.Ja,c.B);e = b.g[d];e || (b.g[d] = new mv(d,null),e = b.g[d]);e.cells.push(c);for(var e=d + c.rowSpan,f=Cv(b,d),g=0;f[g];) g++;for(;d < e;d++) for(var f=Cv(b,d),h=g;h < g + c.b;h++) {var l=f[h] = new pv(d,h,c);c.cc || (c.cc = l);}this.Ja++;}}return km.prototype.ac.call(this,a);};n.Te = function(a){Nv(this,a);};n.af = function(a){Nv(this,a);};n.Kf = function(a){Nv(this,a);};n.$e = function(a){Nv(this,a);};function Nv(a,b){var c=b.w;c && c.B && !Zn(c) && a.f.push(c.clone());}function Mv(a,b){0 < a.f.length && eo(a.h,b.w,a.f);a.f = [];}function Ov(a,b){this.Rb = !0;this.D = a;this.f = b;this.l = !1;this.b = -1;this.g = 0;this.A = b.h;b.h = !1;}t(Ov,km);var Pv={"table-caption":!0,"table-column-group":!0,"table-column":!0};function Qv(a,b,c,d){var e=b.rowIndex,f=b.Ja,g=c.B;if(1 < b.b){w(g,"box-sizing","border-box");for(var h=a.D.I,l=0,k=0;k < b.b;k++) l += h[b.cc.Ja + k];l += a.D.O * (b.b - 1);w(g,a.D.u?"height":"width",l + "px");}b = g.ownerDocument.createElement("div");g.appendChild(b);c = new qv(a.f,b,c);a = a.D;(g = a.f[e]) || (g = a.f[e] = []);g[f] = c;1 === d.f.ma.length && d.f.K && (c.f = !0);return om(c.Wb,d).tc(!0);}function Rv(a,b){var c=a.D.h[0];return c?c.Lb.cc.Ja === b:!1;}function Sv(a){var b=a.D.h;if(!b.length)return [];var c=[],d=0;do {var e=b[d],f=e.Lb.rowIndex;if(f < a.b){var g=c[f];g || (g = c[f] = []);g.push(e);b.splice(d,1);}else d++;}while(d < b.length);return c;}function Tv(a,b){var c=a.D,d=Sv(a),e=d.reduce(function(a){return a + 1;},0);if(0 === e)return K(!0);var f=a.f.j,g=b.w;g.B.parentNode.removeChild(g.B);var h=J("layoutRowSpanningCellsFromPreviousFragment"),l=K(!0),k=0,m=[];d.forEach(function(a){l = l.fa((function(){var b=Ak(a[0].qd.ma[1],g.parent);return Un(f,b,!1).fa((function(){function d(a){for(;h < a;) {if(!(0 <= m.indexOf(h))){var c=b.B.ownerDocument.createElement("td");w(c,"padding","0");b.B.appendChild(c);}h++;}}var g=K(!0),h=0;a.forEach(function(a){g = g.fa((function(){var c=a.Lb;d(c.cc.Ja);var g=a.qd,l=Ak(g.ma[0],b);l.ka = g.ka;l.K = g.K;l.Ka = g.ma[0].Ka + 1;return Un(f,l,!1).fa((function(){for(var b=a.ef,d=0;d < c.b;d++) m.push(h + d);h += c.b;return Qv(this,c,l,b).fa((function(){l.B.rowSpan = c.rowIndex + c.rowSpan - this.b + e - k;return K(!0);}).bind(this));}).bind(this));}).bind(this));},this);return g.fa(function(){d(Dv(c));k++;return K(!0);});}).bind(this));}).bind(this));},a);l.then(function(){Un(f,g,!0,b.od).then(function(){M(h,!0);});});return h.result();}function Uv(a,b){if(a.j || a.h)return K(!0);var c=b.w,d=a.D;0 > a.b?a.b = wv(d,c.N):a.b++;a.g = 0;a.l = !0;return Tv(a,b).fa((function(){Vv(this);No(this.f,b.Dc,null,!0,b.Ac) && !vv(d,this.b - 1).length && (this.f.h = this.A,c.b = !0,b.Fb = !0);return K(!0);}).bind(a));}function Vv(a){a.D.g[a.b].cells.forEach((function(a){var b=this.D.h[a.Ja];b && b.Lb.cc.Ja == a.cc.Ja && (a = b.qd.ma[0],b = Kj(this.f.j.aa,a.node),Sq(b,a.Ka + 1,1));}).bind(a));}function Wv(a,b){if(a.j || a.h)return K(!0);var c=b.w;a.l || (0 > a.b?a.b = 0:a.b++,a.g = 0,a.l = !0);var d=a.D.g[a.b].cells[a.g],e=Dk(c).modify();e.K = !0;b.w = e;var f=J("startTableCell");Rv(a,d.cc.Ja)?(e = a.D.h.shift(),c.Ka = e.qd.ma[0].Ka + 1,e = K(e.ef)):e = $n(a.f,c,b.od).fa(function(a){a.B && c.B.removeChild(a.B);return K(new Pk(yk(a)));});e.then((function(a){Qv(this,d,c,a).then((function(){this.ac(b);this.g++;M(f,!0);}).bind(this));}).bind(a));return f.result();}Ov.prototype.Lf = function(a){var b=kv(a,this.D,this.f);if(b)return b;var b=a.w,c=this.D.b,d=b.display;return "table-header-group" === d && c && c.C === b.N?(this.j = !0,K(!0)):"table-footer-group" === d && c && c.l === b.N?(this.h = !0,K(!0)):"table-row" === d?Uv(this,a):"table-cell" === d?Wv(this,a):K(!0);};Ov.prototype.mf = function(a){a = a.w;"table-row" === a.display && (this.l = !1,this.j || this.h || (a = Dk(a).modify(),a.K = !1,this.f.G.push(new xv(this.b,a,this.D))));return K(!0);};Ov.prototype.ac = function(a){var b=a.w,c=this.D.b,d=b.display;"table-header-group" === d?c && !c.h && c.C === b.N?(this.j = !1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"):"table-footer-group" === d && (c && !c.h && c.l === b.N?(this.h = !1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"));if(d && Pv[d])b.B.parentNode.removeChild(b.B);else if(b.N === this.D.G)!(c = b.B.style) || Mo(c.paddingBottom) && Mo(c.borderBottomWidth) || (b.b = No(this.f,a.Dc,null,!1,a.Ac)),this.f.h = this.A,a.Fb = !0;else return km.prototype.ac.call(this,a);return K(!0);};function Xv(){}function Yv(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h < b;h++) {var l=e.createElement("td");f.appendChild(l);g.push(l);}a.parentNode.insertBefore(f,a.nextSibling);b = g.map(function(a){a = nk(d,a);return c?a.height:a.width;});a.parentNode.removeChild(f);return b;}function Zv(a){var b=[];for(a = a.firstElementChild;a;) "colgroup" === a.localName && b.push(a),a = a.nextElementSibling;return b;}function $v(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;) {if("col" === e.localName){var f=e.span;e.removeAttribute("span");for(c -= f;1 < f--;) {var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g);}b.push(e);}e = e.nextElementSibling;}for(;0 < c--;) e = a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e);});return b;}function aw(a,b,c,d){if(a.length < c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b = a.length;b < c;b++) {var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f);}}}function bw(a,b,c){var d=a.u,e=a.F;if(e){a.F = null;var f=e.ownerDocument.createDocumentFragment(),g=Dv(a);if(0 < g){var h=a.I = Yv(e,g,d,c.f);c = Zv(b);e = $v(c);aw(e,c,g,b);e.forEach(function(a,b){w(a,d?"height":"width",h[b] + "px");});c.forEach(function(a){f.appendChild(a.cloneNode(!0));});}a.A = f;}}function cw(a,b,c){var d=b.D;d.u = b.u;br(d,b.u);var e=J("TableLayoutProcessor.doInitialLayout");im(new hm(new Lv(b.D,c),c.j),b).then((function(a){var f=a.B,h=nk(c.f,f),h=c.u?h.left:h.bottom,h=h + (c.u?-1:1) * Jn(b,Mn(c)).current;Nn(c,h)?(bw(d,f,c),Ev(d,c.f),M(e,null)):M(e,a);}).bind(a));return e.result();}function dw(a,b,c){var d=a.H;d.forEach(function(a,f){a && (b.insertBefore(a.B,c),"top" === a.b && (d[f] = null));});}function ew(a,b){if(a.A && b){var c=Zv(b);c && c.forEach(function(a){b.removeChild(a);});}}function fw(a,b){var c=a.D,d=Lu(c,a),e=d.firstChild;dw(c,d,e);c.A && !Zv(d).length && d.insertBefore(c.A.cloneNode(!0),e);c = new Ov(c,b);c = new hm(c,b.j);d = J("TableFormattingContext.doLayout");im(c,a).Da(d);return d.result();}n = Xv.prototype;n.Pd = function(a,b,c){var d=a.D;return Lu(d,a)?(c && Iu(a.parent,b),sm(new gw(d,this),a,b)):co(b,a);};n.hf = function(a,b,c,d){return new sv(a,b,c,d);};n.ze = function(){return !1;};n.Ye = function(){return !1;};n.Fa = function(a,b,c,d){var e=b.D;if("table-row" === b.display){var f=wv(e,b.N);e.h = [];var g;g = b.K?vv(e,f):Bv(e,f);if(g.length){var h=J("TableLayoutProcessor.finishBreak"),l=0;pe(function(a){if(l === g.length)O(a);else {var b=g[l++],c=e.wd(b),d=c.Pb().w,h=c.b,k=Kk(h),u=new Pk(Kk(d));e.h.push({qd:k,ef:u,Lb:b});h = h.B;dp(c.b);f < b.rowIndex + b.rowSpan - 1 && (h.rowSpan = f - b.rowIndex + 1);c.f?N(a):c.Wb.Fa(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.Wb.b.element,k=c.b.B,l=nk(g.f,k),k=mo(g,k);f?(b = l.right - g.O - b.b(d) - k.right,w(h,"max-width",b + "px")):(b = g.O - b.b(d) - l.top - k.top,w(h,"max-height",b + "px"));w(h,"overflow","hidden");}N(a);});}}).then(function(){Wo(a,b,!1);dp(b);e.f = [];M(h,!0);});return h.result();}}e.f = [];return Jo.Fa(a,b,c,d);};n.md = function(a,b,c,d){cp.prototype.md(a,b,c,d);};function gw(a,b){rm.call(this);this.A = b;this.b = a;}t(gw,rm);gw.prototype.j = function(a){var b=this.b.b;return b && b.j?(a.N === this.b.G && !a.K && b && (b.mc = !1,b.Qc = !1),new hw(this.b)):new iw(this.b,this.A);};gw.prototype.g = function(a){rm.prototype.g.call(this,a);ew(this.b,Lu(this.b,a));};gw.prototype.f = function(a,b){rm.prototype.f.call(this,a,b);this.b.f = [];};function iw(a,b){this.D = a;this.h = b;}t(iw,Tu);iw.prototype.b = function(a,b){Tu.prototype.b.call(this,a,b);return cw(this.h,a,b);};function hw(a){this.D = a;}t(hw,Uu);hw.prototype.b = function(a,b){var c=this.D.b;if(c && !Pu(c,a)){var d=new cv(a);b.l.some(function(a){return d.De(a);}) || b.l.unshift(d);}return fw(a,b);};function cv(a){Ku.call(this,a);this.b = [];}t(cv,Ku);n = cv.prototype;n.ub = function(a,b,c){var d=this.w.D.b;return !d || c.Cb || jo(this.w.B) || !Su(d)?!0:b && !a || a && a.b?!1:!0;};n.Ad = function(a){return jw(a,this.w.D).some(function(b){return b.rd.some(function(b){return b.Ad(a);});})?!0:Ku.prototype.Ad.call(this,a);};n.nd = function(a,b,c,d){var e=this.w.D;this.b = jw(b,e);this.b.forEach(function(b){b.rd.forEach(function(e){e.nd(a,b.Gb,c,d);});});a || (ew(e,Lu(e,this.w)),kw(c));Ku.prototype.nd.call(this,a,b,c,d);};n.Fa = function(a,b){var c=J("finishBreak"),d=this.b.reduce(function(a,b){return a.concat(b.rd.map(function(a){return {Tf:a,Gb:b.Gb};}));},[]),e=0;oe(function(){if(e < d.length){var a=d[e++];return a.Tf.Fa(a.Gb,b).tc(!0);}return K(!1);}).then(function(){M(c,!0);});return c.result().fa((function(){return Ku.prototype.Fa.call(this,a,b);}).bind(this));};function kw(a){if(a && "table-row" === a.display && a.B)for(;a.B.previousElementSibling;) {var b=a.B.previousElementSibling;b.parentNode && b.parentNode.removeChild(b);}}function jw(a,b){return lw(a,b).map(function(a){return {rd:a.Wf.Wb.b.l,Gb:a.Gb};});}function lw(a,b){var c=Number.MAX_VALUE;a && "table-row" === a.display && (c = wv(b,a.N) + 1);for(var c=Math.min(b.f.length,c),d=[],e=0;e < c;e++) b.f[e] && b.f[e].forEach(function(a){a && d.push({Wf:a,Gb:a.Pb().w});});return d;}function dv(a,b){var c=a.w.D,d=Fv(c,b);return d?Gv(c,d):Iv(c);}n.De = function(a){return a instanceof cv?this.w.D === a.w.D:!1;};var mw=new Xv();Rd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c === yd?(b = a.parent,new Ro(b?b.D:null,a.N)):null:null;});Rd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Ro?mw:null;});Array.from || (Array.from = function(a,b,c){b && c && (b = b.bind(c));c = [];for(var d=a.length,e=0;e < d;e++) c[e] = b?b(a[e],e):a[e];return c;});Array.prototype.findIndex || Object.defineProperty(Array.prototype,"findIndex",{value:function value(a,b){if(null == this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function" !== typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length >>> 0,e,f=0;f < d;f++) if((e = c[f],a.call(b,e,f,c)))return f;return -1;},enumerable:!1,configurable:!1,writable:!1});Object.assign || (Object.assign = function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c] = b[c];});return a;});function nw(a){function b(a){return "number" === typeof a?a:null;}function c(a){return "string" === typeof a?{url:a,kb:null,oc:null}:{url:a.url,kb:b(a.startPage),oc:b(a.skipPagesBefore)};}return Array.isArray(a)?a.map(c):a?[c(a)]:null;}function ow(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize = d;break;case "pageBorderWidth":b.pageBorder = d;break;default:b[c] = d;}});return b;}function pw(a,b){Dj = a.debug;this.g = !1;this.h = a;this.Jb = new Jt(a.window || window,a.viewportElement,"main",this.Uf.bind(this));this.f = {autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b && this.Jf(b);this.b = new Ua();Object.defineProperty(this,"readyState",{get:function get(){return this.Jb.C;}});}n = pw.prototype;n.Jf = function(a){var b=Object.assign({a:"configure"},ow(a));this.Jb.A(b);Object.assign(this.f,a);};n.Uf = function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t" !== c && (b[c] = a[c]);});Va(this.b,b);};n.mg = function(a,b){this.b.addEventListener(a,b,!1);};n.pg = function(a,b){this.b.removeEventListener(a,b,!1);};n.$f = function(a,b,c){a || Va(this.b,{type:"error",content:"No URL specified"});qw(this,a,null,b,c);};n.ng = function(a,b,c){a || Va(this.b,{type:"error",content:"No URL specified"});qw(this,null,a,b,c);};function qw(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return {url:a.url || null,text:a.text || null};});}d = d || {};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e && Object.assign(a.f,e);b = Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:nw(b) || c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},ow(a.f));a.g?a.Jb.A(b):(a.g = !0,ku(a.Jb,b));}n.Qb = function(){return this.Jb.Qb();};n.cg = function(a){a: switch(a){case "left":a = "ltr" === this.Qb()?"previous":"next";break a;case "right":a = "ltr" === this.Qb()?"next":"previous";}this.Jb.A({a:"moveTo",where:a});};n.bg = function(a){this.Jb.A({a:"moveTo",url:a});};n.og = function(a){a: {var b=this.Jb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a = fu(b,b.X.rb?eu(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: " + a);}}return a;};n.Xf = function(){return this.Jb.ha;};ba("vivliostyle.viewer.Viewer",pw);pw.prototype.setOptions = pw.prototype.Jf;pw.prototype.addListener = pw.prototype.mg;pw.prototype.removeListener = pw.prototype.pg;pw.prototype.loadDocument = pw.prototype.$f;pw.prototype.loadEPUB = pw.prototype.ng;pw.prototype.getCurrentPageProgression = pw.prototype.Qb;pw.prototype.navigateToPage = pw.prototype.cg;pw.prototype.navigateToInternalUrl = pw.prototype.bg;pw.prototype.queryZoomFactor = pw.prototype.og;pw.prototype.getPageSizes = pw.prototype.Xf;ba("vivliostyle.viewer.ZoomType",gu);gu.FIT_INSIDE_VIEWPORT = "fit inside viewport";ba("vivliostyle.viewer.PageViewMode",It);It.SINGLE_PAGE = "singlePage";It.SPREAD = "spread";It.AUTO_SPREAD = "autoSpread";zu.call(Nt,"load_vivliostyle","end",void 0);var rw=16,sw="ltr";function tw(a){window.adapt_command(a);}function uw(){tw({a:"moveTo",where:"ltr" === sw?"previous":"next"});}function vw(){tw({a:"moveTo",where:"ltr" === sw?"next":"previous"});}function ww(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End" === b || "End" === c)tw({a:"moveTo",where:"last"}),a.preventDefault();else if("Home" === b || "Home" === c)tw({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp" === b || "Up" === b || "Up" === c)tw({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown" === b || "Down" === b || "Down" === c)tw({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight" === b || "Right" === b || "Right" === c)vw(),a.preventDefault();else if("ArrowLeft" === b || "Left" === b || "Left" === c)uw(),a.preventDefault();else if("0" === b || "U+0030" === c)tw({a:"configure",fontSize:Math.round(rw)}),a.preventDefault();else if("t" === b || "U+0054" === c)tw({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+" === b || "Add" === b || "U+002B" === c || "U+00BB" === c || "U+004B" === c && d === KeyboardEvent.b)rw *= 1.2,tw({a:"configure",fontSize:Math.round(rw)}),a.preventDefault();else if("-" === b || "Subtract" === b || "U+002D" === c || "U+00BD" === c || "U+004D" === c && d === KeyboardEvent.b)rw /= 1.2,tw({a:"configure",fontSize:Math.round(rw)}),a.preventDefault();}function xw(a){switch(a.t){case "loaded":a = a.viewer;var b=sw = a.Qb();a.Nd.setAttribute("data-vivliostyle-page-progression",b);a.Nd.setAttribute("data-vivliostyle-spread-view",a.X.rb);window.addEventListener("keydown",ww,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a = document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",uw,!1);b = document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",vw,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state","attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state");},1E3);});break;case "nav":(a = a.cfi) && location.replace(ra(location.href,Ia(a || "")));break;case "hyperlink":a.internal && tw({a:"moveTo",url:a.href});}}ba("vivliostyle.viewerapp.main",function(a){var b=a && a.fragment || pa("f"),c=a && a.epubURL || pa("b"),d=a && a.xmlURL || pa("x"),e=a && a.defaultPageWidth || pa("w"),f=a && a.defaultPageHeight || pa("h"),g=a && a.defaultPageSize || pa("size"),h=a && a.orientation || pa("orientation"),l=pa("spread"),l=a && a.spreadView || !!l && "false" != l,k=a && a.viewportElement || document.body;a = {a:c?"loadEPUB":"loadXML",url:c || d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a && a.uaRoot || null,document:a && a.document || null,userStyleSheet:a && a.userStyleSheet || null,spreadView:l,pageBorder:1};var m;if(e && f)m = e + " " + f;else {switch(g){case "A5":e = "148mm";f = "210mm";break;case "A4":e = "210mm";f = "297mm";break;case "A3":e = "297mm";f = "420mm";break;case "B5":e = "176mm";f = "250mm";break;case "B4":e = "250mm";f = "353mm";break;case "letter":e = "8.5in";f = "11in";break;case "legal":e = "8.5in";f = "14in";break;case "ledger":e = "11in",f = "17in";}e && f && (m = g,"landscape" === h && (m = m?m + " landscape":null,g = e,e = f,f = g));}e && f && (a.viewport = {width:e,height:f},g = document.createElement("style"),g.textContent = "@page { size: " + m + "; margin: 0; }",document.head.appendChild(g));ku(new Jt(window,k,"main",xw),a);});return enclosingObject.vivliostyle;}).bind(window));

},{}]},{},[4]);
