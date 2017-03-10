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
 * Vivliostyle core 2017.2.1-pre.20170310094502
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
function t(a,b){function c(){}c.prototype=b.prototype;a.Ue=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Pf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}t(ca,Error);ca.prototype.name="CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift()}t(ea,ca);ea.prototype.name="AssertionError";function fa(a,b){throw new ea("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ha(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ia(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.w=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function ja(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ka(a,b){var c=u,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ia.prototype.debug=function(a){var b=ha(arguments);this.h(ga(b));ja(this,1,b)};ia.prototype.g=function(a){var b=ha(arguments);this.l(ga(b));ja(this,2,b)};ia.prototype.b=function(a){var b=ha(arguments);this.w(ga(b));ja(this,3,b)};ia.prototype.error=function(a){var b=ha(arguments);this.j(ga(b));ja(this,4,b)};var u=new ia;function la(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ma=window.location.href,na=window.location.href;
function oa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function pa(a){a=new RegExp("#(.*&)?"+qa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ra(a,b){var c=new RegExp("#(.*&)?"+qa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function sa(a){return null==a?a:a.toString()}function ta(){this.b=[null]}
ta.prototype.length=function(){return this.b.length-1};function va(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};
function ya(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[va(a,b)]}
function za(a){var b=xa[a];if(b||null===b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<wa.length;b++){var c=wa[b];if(ya(c,a))return b=c+a,xa[a]=[b],[b]}u.b("Property not supported by the browser: ",a);return xa[a]=null}
function v(a,b,c){try{var d=za(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){u.b(e)}}function Aa(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Ba(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Da(){this.b=[]}Da.prototype.append=function(a){this.b.push(a);return this};Da.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ea(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Fa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ea)}
function Ga(a){return a.replace(/[\u0000-\u001F"]/g,Ea)}function Ha(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ia(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function qa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ja(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(qa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ka(a){if(!a)throw"Assert failed";}function La(a,b){for(var c=0,d=a;;){Ka(c<=d);Ka(!c||!b(c-1));Ka(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ma(a,b){return a-b}
function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Oa={};function Qa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Ra(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Sa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Ta(){this.h={}}function Ua(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Ta.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Ta.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Va=null,Wa=null;function Ya(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Za(a){return"^"+a}function $a(a){return a.substr(1)}function ab(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,$a):a}
function bb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=ab(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function cb(){}cb.prototype.g=function(a){a.append("!")};cb.prototype.h=function(){return!1};function db(a,b,c){this.index=a;this.id=b;this.ob=c}
db.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.ob)a.append("["),this.id&&a.append(this.id),this.ob&&(a.append(";s="),a.append(this.ob)),a.append("]")};
db.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.M=!0),a.node=c);if(this.id&&(a.M||this.id!=Ya(a.node)))throw Error("E_CFI_ID_MISMATCH");a.ob=this.ob;return!0};function eb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.ob=d}
eb.prototype.h=function(a){if(0<this.offset&&!a.M){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.ob=this.ob;return!0};
eb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.ob){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Za)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Za));this.ob&&(a.append(";s="),a.append(this.ob));a.append("]")}};function fb(){this.na=null}
function gb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=bb(c[4]);f.push(new db(g,h,sa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=ab(h));var l=c[7];l&&(l=ab(l));c=bb(c[10]);f.push(new eb(g,h,l,sa(c.s)));break;case "!":e++;f.push(new cb);break;case "~":case "@":case "":a.na=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function hb(a,b){for(var c={node:b.documentElement,offset:0,M:!1,ob:null,Hc:null},d=0;d<a.na.length;d++)if(!a.na[d].h(c)){++d<a.na.length&&(c.Hc=new fb,c.Hc.na=a.na.slice(d));break}return c}
fb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ib(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new eb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ya(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new db(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.na?(f.push(new cb),a.na=f.concat(a.na)):a.na=f}fb.prototype.toString=function(){if(!this.na)return"";var a=new Da;a.append("epubcfi(");for(var b=0;b<this.na.length;b++)this.na[b].g(a);a.append(")");return a.toString()};function jb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Bd:!0,wd:25,Ad:!1,Hd:!1,pb:!1,jc:1,be:{print:!0},Wb:void 0}}function kb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Bd:a.Bd,wd:a.wd,Ad:a.Ad,Hd:a.Hd,pb:a.pb,jc:a.jc,be:Object.assign({},a.be),Wb:a.Wb?Object.assign({},a.Wb):void 0}}var lb=jb(),mb={};function nb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ob(a){return'"'+Ga(a+"")+'"'}function pb(a){return Fa(a+"")}
function qb(a,b){return a?Fa(a)+"."+Fa(b):Fa(b)}var rb=0;
function sb(a,b){this.parent=a;this.w="S"+rb++;this.A=[];this.b=new tb(this,0);this.f=new tb(this,1);this.j=new tb(this,!0);this.h=new tb(this,!1);a&&a.A.push(this);this.values={};this.F={};this.C={};this.l=b;if(!a){var c=this.C;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=nb;c["css-string"]=ob;c["css-name"]=pb;c["typeof"]=function(a){return typeof a};ub(this,"page-width",function(){return this.Nb()});ub(this,"page-height",function(){return this.Mb()});
ub(this,"pref-font-family",function(){return this.Y.fontFamily});ub(this,"pref-night-mode",function(){return this.Y.Hd});ub(this,"pref-hyphenate",function(){return this.Y.Bd});ub(this,"pref-margin",function(){return this.Y.margin});ub(this,"pref-line-height",function(){return this.Y.lineHeight});ub(this,"pref-column-width",function(){return this.Y.wd*this.fontSize});ub(this,"pref-horizontal",function(){return this.Y.Ad});ub(this,"pref-spread-view",function(){return this.Y.pb})}}
function ub(a,b,c){a.values[b]=new vb(a,c,b)}function wb(a,b){a.values["page-number"]=b}function xb(a,b){a.C["has-content"]=b}var yb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function zb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function Ab(a,b,c,d){this.Xa=b;this.Cb=c;this.O=null;this.Nb=function(){return this.O?this.O:this.Y.pb?Math.floor(b/2)-this.Y.jc:b};this.J=null;this.Mb=function(){return this.J?this.J:c};this.w=d;this.ta=null;this.fontSize=function(){return this.ta?this.ta:d};this.Y=lb;this.G={}}function Bb(a,b){a.G[b.w]={};for(var c=0;c<b.A.length;c++)Bb(a,b.A[c])}
function Cb(a,b,c){return"vw"==b?a.Nb()/100:"vh"==b?a.Mb()/100:"em"==b||"rem"==b?c?a.w:a.fontSize():"ex"==b||"rex"==b?yb.ex*(c?a.w:a.fontSize())/yb.em:yb[b]}function Db(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Eb(a,b,c,d,e){do{var f=b.F[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.C[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new tb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Fb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Nb();break;case "height":f=a.Mb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Gb(a){this.b=a;this.h="_"+rb++}p=Gb.prototype;p.toString=function(){var a=new Da;this.ua(a,0);return a.toString()};p.ua=function(){throw Error("F_ABSTRACT");};p.fb=function(){throw Error("F_ABSTRACT");};p.Ta=function(){return this};p.Xb=function(a){return a===this};function Hb(a,b,c,d){var e=d[a.h];if(null!=e)return e===mb?!1:e;d[a.h]=mb;b=a.Xb(b,c,d);return d[a.h]=b}
p.evaluate=function(a){var b;b=(b=a.G[this.b.w])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.fb(a);var c=this.h,d=this.b,e=a.G[d.w];e||(e={},a.G[d.w]=e);return e[c]=b};p.ge=function(){return!1};function Ib(a,b){Gb.call(this,a);this.f=b}t(Ib,Gb);p=Ib.prototype;p.Xd=function(){throw Error("F_ABSTRACT");};p.ce=function(){throw Error("F_ABSTRACT");};p.fb=function(a){a=this.f.evaluate(a);return this.ce(a)};p.Xb=function(a,b,c){return a===this||Hb(this.f,a,b,c)};
p.ua=function(a,b){10<b&&a.append("(");a.append(this.Xd());this.f.ua(a,10);10<b&&a.append(")")};p.Ta=function(a,b){var c=this.f.Ta(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Jb(a,b,c){Gb.call(this,a);this.f=b;this.g=c}t(Jb,Gb);p=Jb.prototype;p.Rc=function(){throw Error("F_ABSTRACT");};p.Oa=function(){throw Error("F_ABSTRACT");};p.mb=function(){throw Error("F_ABSTRACT");};p.fb=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.mb(b,a)};
p.Xb=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.g,a,b,c)};p.ua=function(a,b){var c=this.Rc();c<=b&&a.append("(");this.f.ua(a,c);a.append(this.Oa());this.g.ua(a,c);c<=b&&a.append(")")};p.Ta=function(a,b){var c=this.f.Ta(a,b),d=this.g.Ta(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Kb(a,b,c){Jb.call(this,a,b,c)}t(Kb,Jb);Kb.prototype.Rc=function(){return 1};function Lb(a,b,c){Jb.call(this,a,b,c)}t(Lb,Jb);Lb.prototype.Rc=function(){return 2};
function Mb(a,b,c){Jb.call(this,a,b,c)}t(Mb,Jb);Mb.prototype.Rc=function(){return 3};function Nb(a,b,c){Jb.call(this,a,b,c)}t(Nb,Jb);Nb.prototype.Rc=function(){return 4};function Ob(a,b){Ib.call(this,a,b)}t(Ob,Ib);Ob.prototype.Xd=function(){return"!"};Ob.prototype.ce=function(a){return!a};function Pb(a,b){Ib.call(this,a,b)}t(Pb,Ib);Pb.prototype.Xd=function(){return"-"};Pb.prototype.ce=function(a){return-a};function Qb(a,b,c){Jb.call(this,a,b,c)}t(Qb,Kb);Qb.prototype.Oa=function(){return"&&"};
Qb.prototype.fb=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Rb(a,b,c){Jb.call(this,a,b,c)}t(Rb,Qb);Rb.prototype.Oa=function(){return" and "};function Sb(a,b,c){Jb.call(this,a,b,c)}t(Sb,Kb);Sb.prototype.Oa=function(){return"||"};Sb.prototype.fb=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Tb(a,b,c){Jb.call(this,a,b,c)}t(Tb,Sb);Tb.prototype.Oa=function(){return", "};function Ub(a,b,c){Jb.call(this,a,b,c)}t(Ub,Lb);Ub.prototype.Oa=function(){return"<"};
Ub.prototype.mb=function(a,b){return a<b};function Vb(a,b,c){Jb.call(this,a,b,c)}t(Vb,Lb);Vb.prototype.Oa=function(){return"<="};Vb.prototype.mb=function(a,b){return a<=b};function Wb(a,b,c){Jb.call(this,a,b,c)}t(Wb,Lb);Wb.prototype.Oa=function(){return">"};Wb.prototype.mb=function(a,b){return a>b};function Xb(a,b,c){Jb.call(this,a,b,c)}t(Xb,Lb);Xb.prototype.Oa=function(){return">="};Xb.prototype.mb=function(a,b){return a>=b};function Yb(a,b,c){Jb.call(this,a,b,c)}t(Yb,Lb);Yb.prototype.Oa=function(){return"=="};
Yb.prototype.mb=function(a,b){return a==b};function Zb(a,b,c){Jb.call(this,a,b,c)}t(Zb,Lb);Zb.prototype.Oa=function(){return"!="};Zb.prototype.mb=function(a,b){return a!=b};function $b(a,b,c){Jb.call(this,a,b,c)}t($b,Mb);$b.prototype.Oa=function(){return"+"};$b.prototype.mb=function(a,b){return a+b};function ac(a,b,c){Jb.call(this,a,b,c)}t(ac,Mb);ac.prototype.Oa=function(){return" - "};ac.prototype.mb=function(a,b){return a-b};function bc(a,b,c){Jb.call(this,a,b,c)}t(bc,Nb);bc.prototype.Oa=function(){return"*"};
bc.prototype.mb=function(a,b){return a*b};function cc(a,b,c){Jb.call(this,a,b,c)}t(cc,Nb);cc.prototype.Oa=function(){return"/"};cc.prototype.mb=function(a,b){return a/b};function dc(a,b,c){Jb.call(this,a,b,c)}t(dc,Nb);dc.prototype.Oa=function(){return"%"};dc.prototype.mb=function(a,b){return a%b};function ec(a,b,c){Gb.call(this,a);this.I=b;this.ga=c.toLowerCase()}t(ec,Gb);ec.prototype.ua=function(a){a.append(this.I.toString());a.append(Fa(this.ga))};
ec.prototype.fb=function(a){return this.I*Cb(a,this.ga,!1)};function fc(a,b){Gb.call(this,a);this.f=b}t(fc,Gb);fc.prototype.ua=function(a){a.append(this.f)};fc.prototype.fb=function(a){return Db(a,this.b,this.f).evaluate(a)};fc.prototype.Xb=function(a,b,c){return a===this||Hb(Db(b,this.b,this.f),a,b,c)};function gc(a,b,c){Gb.call(this,a);this.f=b;this.name=c}t(gc,Gb);gc.prototype.ua=function(a){this.f&&a.append("not ");a.append(Fa(this.name))};
gc.prototype.fb=function(a){var b=this.name;a="all"===b||!!a.Y.be[b];return this.f?!a:a};gc.prototype.Xb=function(a,b,c){return a===this||Hb(this.value,a,b,c)};gc.prototype.ge=function(){return!0};function vb(a,b,c){Gb.call(this,a);this.hc=b;this.mc=c}t(vb,Gb);vb.prototype.ua=function(a){a.append(this.mc)};vb.prototype.fb=function(a){return this.hc.call(a)};function hc(a,b,c){Gb.call(this,a);this.g=b;this.f=c}t(hc,Gb);
hc.prototype.ua=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ua(a,0);a.append(")")};hc.prototype.fb=function(a){return Eb(a,this.b,this.g,this.f,!1).Ta(a,this.f).evaluate(a)};hc.prototype.Xb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Hb(this.f[d],a,b,c))return!0;return Hb(Eb(b,this.b,this.g,this.f,!0),a,b,c)};
hc.prototype.Ta=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Ta(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new hc(this.b,this.g,c)};function ic(a,b,c,d){Gb.call(this,a);this.f=b;this.j=c;this.g=d}t(ic,Gb);ic.prototype.ua=function(a,b){0<b&&a.append("(");this.f.ua(a,0);a.append("?");this.j.ua(a,0);a.append(":");this.g.ua(a,0);0<b&&a.append(")")};
ic.prototype.fb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};ic.prototype.Xb=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.j,a,b,c)||Hb(this.g,a,b,c)};ic.prototype.Ta=function(a,b){var c=this.f.Ta(a,b),d=this.j.Ta(a,b),e=this.g.Ta(a,b);return c===this.f&&d===this.j&&e===this.g?this:new ic(this.b,c,d,e)};function tb(a,b){Gb.call(this,a);this.f=b}t(tb,Gb);
tb.prototype.ua=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ga(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};tb.prototype.fb=function(){return this.f};function jc(a,b,c){Gb.call(this,a);this.name=b;this.value=c}t(jc,Gb);jc.prototype.ua=function(a){a.append("(");a.append(Ga(this.name.name));a.append(":");this.value.ua(a,0);a.append(")")};
jc.prototype.fb=function(a){return Fb(a,this.name.name,this.value)};jc.prototype.Xb=function(a,b,c){return a===this||Hb(this.value,a,b,c)};jc.prototype.Ta=function(a,b){var c=this.value.Ta(a,b);return c===this.value?this:new jc(this.b,this.name,c)};function kc(a,b){Gb.call(this,a);this.index=b}t(kc,Gb);kc.prototype.ua=function(a){a.append("$");a.append(this.index.toString())};kc.prototype.Ta=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function lc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Qb(a,b,c)}function w(a,b,c){return b===a.b?c:c===a.b?b:new $b(a,b,c)}function x(a,b,c){return b===a.b?new Pb(a,c):c===a.b?b:new ac(a,b,c)}function mc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new bc(a,b,c)}function nc(a,b,c){return b===a.b?a.b:c===a.f?b:new cc(a,b,c)};var oc={};function pc(){}p=pc.prototype;p.Sb=function(a){for(var b=0;b<a.length;b++)a[b].ba(this)};p.Sd=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};p.Td=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};p.Pc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};p.Rb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};p.rc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};p.qc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};p.oc=function(a){return this.qc(a)};
p.qd=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};p.sc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};p.ub=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};p.Qb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};p.zb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};p.nc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function qc(){}t(qc,pc);p=qc.prototype;
p.Sb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.ba(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};p.Pc=function(a){return a};p.Rb=function(a){return a};p.Td=function(a){return a};p.rc=function(a){return a};p.qc=function(a){return a};p.oc=function(a){return a};p.qd=function(a){return a};p.sc=function(a){return a};p.ub=function(a){var b=this.Sb(a.values);return b===a.values?a:new rc(b)};
p.Qb=function(a){var b=this.Sb(a.values);return b===a.values?a:new sc(b)};p.zb=function(a){var b=this.Sb(a.values);return b===a.values?a:new tc(a.name,b)};p.nc=function(a){return a};function uc(){}p=uc.prototype;p.toString=function(){var a=new Da;this.Na(a,!0);return a.toString()};p.stringValue=function(){var a=new Da;this.Na(a,!1);return a.toString()};p.ra=function(){throw Error("F_ABSTRACT");};p.Na=function(a){a.append("[error]")};p.fe=function(){return!1};p.Yb=function(){return!1};p.he=function(){return!1};
p.Je=function(){return!1};p.Zc=function(){return!1};function vc(){if(B)throw Error("E_INVALID_CALL");}t(vc,uc);vc.prototype.ra=function(a){return new tb(a,"")};vc.prototype.Na=function(){};vc.prototype.ba=function(a){return a.Sd(this)};var B=new vc;function wc(){if(xc)throw Error("E_INVALID_CALL");}t(wc,uc);wc.prototype.ra=function(a){return new tb(a,"/")};wc.prototype.Na=function(a){a.append("/")};wc.prototype.ba=function(a){return a.Td(this)};var xc=new wc;function Ac(a){this.mc=a}t(Ac,uc);
Ac.prototype.ra=function(a){return new tb(a,this.mc)};Ac.prototype.Na=function(a,b){b?(a.append('"'),a.append(Ga(this.mc)),a.append('"')):a.append(this.mc)};Ac.prototype.ba=function(a){return a.Pc(this)};function Bc(a){this.name=a;if(oc[a])throw Error("E_INVALID_CALL");oc[a]=this}t(Bc,uc);Bc.prototype.ra=function(a){return new tb(a,this.name)};Bc.prototype.Na=function(a,b){b?a.append(Fa(this.name)):a.append(this.name)};Bc.prototype.ba=function(a){return a.Rb(this)};Bc.prototype.Je=function(){return!0};
function C(a){var b=oc[a];b||(b=new Bc(a));return b}function D(a,b){this.I=a;this.ga=b.toLowerCase()}t(D,uc);D.prototype.ra=function(a,b){return this.I?b&&"%"==this.ga?100==this.I?b:new bc(a,b,new tb(a,this.I/100)):new ec(a,this.I,this.ga):a.b};D.prototype.Na=function(a){a.append(this.I.toString());a.append(this.ga)};D.prototype.ba=function(a){return a.rc(this)};D.prototype.Yb=function(){return!0};function Cc(a){this.I=a}t(Cc,uc);
Cc.prototype.ra=function(a){return this.I?1==this.I?a.f:new tb(a,this.I):a.b};Cc.prototype.Na=function(a){a.append(this.I.toString())};Cc.prototype.ba=function(a){return a.qc(this)};Cc.prototype.he=function(){return!0};function Dc(a){this.I=a}t(Dc,Cc);Dc.prototype.ba=function(a){return a.oc(this)};function Ec(a){this.f=a}t(Ec,uc);Ec.prototype.Na=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};Ec.prototype.ba=function(a){return a.qd(this)};
function Fc(a){this.url=a}t(Fc,uc);Fc.prototype.Na=function(a){a.append('url("');a.append(Ga(this.url));a.append('")')};Fc.prototype.ba=function(a){return a.sc(this)};function Gc(a,b,c,d){var e=b.length;b[0].Na(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Na(a,d)}function rc(a){this.values=a}t(rc,uc);rc.prototype.Na=function(a,b){Gc(a,this.values," ",b)};rc.prototype.ba=function(a){return a.ub(this)};rc.prototype.Zc=function(){return!0};function sc(a){this.values=a}t(sc,uc);
sc.prototype.Na=function(a,b){Gc(a,this.values,",",b)};sc.prototype.ba=function(a){return a.Qb(this)};function tc(a,b){this.name=a;this.values=b}t(tc,uc);tc.prototype.Na=function(a,b){a.append(Fa(this.name));a.append("(");Gc(a,this.values,",",b);a.append(")")};tc.prototype.ba=function(a){return a.zb(this)};function E(a){this.b=a}t(E,uc);E.prototype.ra=function(){return this.b};E.prototype.Na=function(a){a.append("-epubx-expr(");this.b.ua(a,0);a.append(")")};E.prototype.ba=function(a){return a.nc(this)};
E.prototype.fe=function(){return!0};function Hc(a,b){if(a){if(a.Yb())return Cb(b,a.ga,!1)*a.I;if(a.he())return a.I}return 0}var Ic=C("absolute"),Jc=C("all"),Kc=C("always"),Lc=C("auto");C("avoid");var Mc=C("block"),Nc=C("block-end"),Oc=C("block-start"),Pc=C("both"),Qc=C("bottom"),Rc=C("border-box"),Sc=C("break-all"),Tc=C("break-word"),Uc=C("crop"),Vc=C("cross");C("column");var Wc=C("exclusive"),Xc=C("false"),Yc=C("fixed"),Zc=C("flex"),$c=C("footnote");C("hidden");
var ad=C("horizontal-tb"),bd=C("inherit"),cd=C("inline"),dd=C("inline-block"),ed=C("inline-end"),fd=C("inline-start"),gd=C("landscape"),hd=C("left"),id=C("list-item"),jd=C("ltr");C("manual");var F=C("none"),kd=C("normal"),ld=C("oeb-page-foot"),md=C("oeb-page-head"),nd=C("page"),od=C("relative"),pd=C("right"),qd=C("scale");C("spread");var rd=C("static"),sd=C("rtl"),td=C("table"),ud=C("table-caption"),vd=C("table-cell");C("table-row");
var wd=C("top"),xd=C("transparent"),yd=C("vertical-lr"),zd=C("vertical-rl"),Ad=C("visible"),Bd=C("true"),Cd=new D(100,"%"),Dd=new D(100,"vw"),Ed=new D(100,"vh"),Fd=new D(0,"px"),Gd={"font-size":1,color:2};function Hd(a,b){return(Gd[a]||Number.MAX_VALUE)-(Gd[b]||Number.MAX_VALUE)};var Id={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Jd={};
function Kd(a,b){if(Id[a]){var c=Jd[a];c||(c=Jd[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}function Ld(a){return Jd[a]||[]}ba("vivliostyle.plugin.registerHook",Kd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Id[a]){var c=Jd[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Md=null,Nd=null;function I(a){if(!Md)throw Error("E_TASK_NO_CONTEXT");Md.name||(Md.name=a);var b=Md;a=new Od(b,b.top,a);b.top=a;a.b=Pd;return a}function L(a){return new Qd(a)}function Rd(a,b,c){a=I(a);a.j=c;try{b(a)}catch(d){Sd(a.f,d,a)}return M(a)}function Td(a){var b=Ud,c;Md?c=Md.f:(c=Nd)||(c=new Vd(new Wd));b(c,a,void 0)}var Pd=1;function Wd(){}Wd.prototype.currentTime=function(){return(new Date).valueOf()};function Xd(a,b){return setTimeout(a,b)}
function Vd(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new ta;this.b=this.w=null;this.j=!1;this.order=0;Nd||(Nd=this)}
function Yd(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.w)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.w=c+b;a.b=Xd(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<Zd(f.b[k],g))k+1<h&&0<Zd(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<Zd(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.h){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Md,Md=m,O(m.top,l.g),Md=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(n){u.error(n)}a.j=!1;a.f.length()&&Yd(a)},b)}}Vd.prototype.eb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Zd(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}Yd(this)};
function Ud(a,b,c){var d=new $d(a,c||"");d.top=new Od(d,null,"bootstrap");d.top.b=Pd;d.top.then(function(){function a(){d.l=!1;for(var a=0;a<d.j.length;a++){var b=d.j[a];try{b()}catch(h){u.error(h)}}}try{b().then(function(b){d.h=b;a()})}catch(f){Sd(d,f),a()}});c=Md;Md=d;a.eb(ae(d.top,"bootstrap"));Md=c;return d}function be(a){this.f=a;this.order=this.b=0;this.g=null;this.h=!1}function Zd(a,b){return b.b-a.b||b.order-a.order}be.prototype.eb=function(a,b){this.g=a;this.f.f.eb(this,b)};
function $d(a,b){this.f=a;this.name=b;this.j=[];this.g=null;this.l=!0;this.b=this.top=this.w=this.h=null}function ce(a,b){a.j.push(b)}$d.prototype.join=function(){var a=I("Task.join");if(this.l){var b=ae(a,this),c=this;ce(this,function(){b.eb(c.h)})}else O(a,this.h);return M(a)};
function Sd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&u.error(a.g,"Unhandled exception in task",a.name)}function Qd(a){this.value=a}p=Qd.prototype;p.then=function(a){a(this.value)};p.oa=function(a){return a(this.value)};p.nd=function(a){return new Qd(a)};
p.Fa=function(a){O(a,this.value)};p.za=function(){return!1};p.get=function(){return this.value};function de(a){this.b=a}p=de.prototype;p.then=function(a){this.b.then(a)};p.oa=function(a){if(this.za()){var b=new Od(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Pd;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return M(b)}return a(this.b.g)};p.nd=function(a){return this.za()?this.oa(function(){return new Qd(a)}):new Qd(a)};
p.Fa=function(a){this.za()?this.then(function(b){O(a,b)}):O(a,this.b.g)};p.za=function(){return this.b.b==Pd};p.get=function(){if(this.za())throw Error("Result is pending");return this.b.g};function Od(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function ee(a){if(!Md)throw Error("F_TASK_NO_CONTEXT");if(a!==Md.top)throw Error("F_TASK_NOT_TOP_FRAME");}function M(a){return new de(a)}
function O(a,b){ee(a);Md.g||(a.g=b);a.b=2;var c=a.parent;Md.top=c;if(a.h){try{a.h(b)}catch(d){Sd(a.f,d,c)}a.b=3}}Od.prototype.then=function(a){switch(this.b){case Pd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Sd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function fe(){var a=I("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(u.debug("-- time slice --"),ae(a).eb(!0)):O(a,!0);return M(a)}function ge(a){var b=I("Frame.sleep");ae(b).eb(!0,a);return M(b)}function he(a){function b(d){try{for(;d;){var e=a();if(e.za()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){Sd(c.f,f,c)}}var c=I("Frame.loop");b(!0);return M(c)}
function ie(a){var b=Md;if(!b)throw Error("E_TASK_NO_CONTEXT");return he(function(){var c;do c=new je(b,b.top),b.top=c,c.b=Pd,a(c),c=M(c);while(!c.za()&&c.get());return c})}function ae(a,b){ee(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new be(a.f);a.f.b=c;Md=null;a.f.w=b||null;return c}function je(a,b){Od.call(this,a,b,"loop")}t(je,Od);function P(a){O(a,!0)}function Q(a){O(a,!1)};function ke(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}ke.prototype.start=function(){if(!this.b){var a=this;this.b=Ud(Md.f,function(){var b=I("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}O(b,c)});return M(b)},this.name)}};function le(a,b){a.f?b(a.h):a.g.push(b)}ke.prototype.get=function(){if(this.f)return L(this.h);this.start();return this.b.join()};
function me(a){if(!a.length)return L(!0);if(1==a.length)return a[0].get().nd(!0);var b=I("waitForFetches"),c=0;he(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().nd(!0)}return L(!1)}).then(function(){O(b,!0)});return M(b)}
function ne(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new ke(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.eb(b?b.type:"timeout"))}var g=I("loadImage"),h=ae(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return M(g)},"loadElement "+b);e.start();return e};function oe(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function pe(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,oe)}function qe(){this.type=0;this.b=!1;this.I=0;this.text="";this.position=0}
function re(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var se=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];se[NaN]=80;
var te=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];te[NaN]=43;
var ue=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];te[NaN]=43;
var ve=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ve[NaN]=35;
var we=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];we[NaN]=45;
var xe=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];xe[NaN]=37;
var ye=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];ye[NaN]=38;
var ze=re(35,[61,36]),Ae=re(35,[58,77]),Be=re(35,[61,36,124,50]),Ce=re(35,[38,51]),De=re(35,[42,54]),Ee=re(39,[42,55]),Fe=re(54,[42,55,47,56]),Ge=re(62,[62,56]),He=re(35,[61,36,33,70]),Ie=re(62,[45,71]),Je=re(63,[45,56]),Ke=re(76,[9,72,10,72,13,72,32,72]),Le=re(39,[39,46,10,72,13,72,92,48]),Me=re(39,[34,46,10,72,13,72,92,49]),Ne=re(39,[39,47,10,74,13,74,92,48]),Oe=re(39,[34,47,10,74,13,74,92,49]),Pe=re(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Qe=re(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Re=re(39,[39,68,10,74,13,74,92,75,NaN,67]),Se=re(39,[34,68,10,74,13,74,92,75,NaN,67]),Te=re(72,[9,39,10,39,13,39,32,39,41,69]);function Ue(a,b){this.l=b;this.g=15;this.w=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new qe}function R(a){a.h==a.f&&Ve(a);return a.j[a.f]}function We(a,b){(a.h-a.f&a.g)<=b&&Ve(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function Xe(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Ue.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Ve(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new qe;b=a.h;c=d=a.g}for(var e=se,f=a.w,g=a.position,h=a.j,l=0,k=0,m="",n=0,r=!1,q=h[b],z=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:l=51;m=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:k=
g++;e=xe;continue;case 3:l=1;k=g++;e=te;continue;case 4:k=g++;l=31;e=ze;continue;case 33:l=2;k=++g;e=Le;continue;case 34:l=2;k=++g;e=Me;continue;case 6:k=++g;l=7;e=te;continue;case 7:k=g++;l=32;e=ze;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Ce;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=ze;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ve;continue;case 16:k=g++;e=ue;continue;case 78:k=g++;l=9;e=te;continue;case 17:k=g++;
l=19;e=De;continue;case 18:k=g++;l=18;e=Ae;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=He;continue;case 21:k=g++;l=39;e=ze;continue;case 22:k=g++;l=37;e=ze;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=te;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=Ke;continue;case 30:k=g++;l=33;e=ze;continue;case 31:k=g++;l=34;e=Be;continue;case 32:k=g++;l=35;e=ze;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;n=parseInt(f.substring(k,g),10);break;case 38:l=4;n=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;n=parseFloat(f.substring(k,g));k=g++;e=te;continue;case 41:l=3;n=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=ye;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=Ke;continue;case 45:m=pe(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=pe(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=Ne;continue;
case 49:z=g;g+=2;e=Oe;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Pe;continue}l=6}break;case 53:m=pe(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Pe;continue}l=6}break;case 54:e=Ee;g++;continue;case 55:e=Fe;g++;continue;case 56:e=se;g++;continue;case 57:e=Ge;g++;continue;case 58:l=5;e=xe;g++;continue;case 59:l=4;e=ye;g++;continue;case 60:l=1;e=te;g++;continue;case 61:l=1;e=Ke;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Qe;continue;case 65:k=++g;e=Re;continue;case 66:k=++g;e=Se;continue;case 67:l=8;m=pe(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Ie;g++;continue;case 71:e=Je;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=pe(f.substring(k,g));g++;e=Te;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=pe(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=we;continue;default:e!==se?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}q.type=l;q.b=r;q.I=n;q.text=m;q.position=k;b++;if(b>=c)break;e=se;r=!1;q=h[b&d]}a.position=g;a.h=b&d};function Ye(a,b,c,d,e){var f=I("ajax"),g=new XMLHttpRequest,h=ae(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,dd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;
else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.dd=Ze([c]):l.dd=c:u.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.eb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){u.b(k,"Error fetching "+a),h.eb(l)}return M(f)}
function Ze(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function $e(a){var b=I("readBlob"),c=new FileReader,d=ae(b,c);c.addEventListener("load",function(){d.eb(c.result)},!1);c.readAsArrayBuffer(a);return M(b)}function af(a,b){this.fa=a;this.type=b;this.h={};this.j={}}
af.prototype.load=function(a,b,c){a=la(a);var d=this.h[a];return"undefined"!=typeof d?L(d):this.fetch(a,b,c).get()};function bf(a,b,c,d){var e=I("fetch");Ye(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.fa(f,a).then(function(c){delete a.j[b];a.h[b]=c;O(e,c)})});return M(e)}af.prototype.fetch=function(a,b,c){a=la(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new ke(function(){return bf(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};
af.prototype.get=function(a){return this.h[la(a)]};function cf(a){a=a.responseText;return L(a?JSON.parse(a):null)};function df(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Ec(b);if(3==a.length)return new Ec(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function ef(a){this.f=a;this.Za="Author"}p=ef.prototype;p.Ac=function(){return null};p.ha=function(){return this.f};p.error=function(){};p.lc=function(a){this.Za=a};p.yb=function(){};p.vd=function(){};p.Fc=function(){};p.Gc=function(){};p.Cd=function(){};p.Tc=function(){};
p.Gb=function(){};p.ud=function(){};p.rd=function(){};p.yd=function(){};p.ic=function(){};p.tb=function(){};p.hd=function(){};p.Jc=function(){};p.md=function(){};p.fd=function(){};p.ld=function(){};p.kc=function(){};p.Qd=function(){};p.bc=function(){};p.gd=function(){};p.kd=function(){};p.jd=function(){};p.Mc=function(){};p.Lc=function(){};p.wa=function(){};p.rb=function(){};p.Hb=function(){};p.Kc=function(){};p.Vc=function(){};
function ff(a){switch(a.Za){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function gf(a){switch(a.Za){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function hf(){ef.call(this,null);this.g=[];this.b=null}t(hf,ef);function jf(a,b){a.g.push(a.b);a.b=b}p=hf.prototype;p.Ac=function(){return null};p.ha=function(){return this.b.ha()};p.error=function(a,b){this.b.error(a,b)};
p.lc=function(a){ef.prototype.lc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.lc(a)};p.yb=function(a,b){this.b.yb(a,b)};p.vd=function(a){this.b.vd(a)};p.Fc=function(a,b){this.b.Fc(a,b)};p.Gc=function(a,b){this.b.Gc(a,b)};p.Cd=function(a){this.b.Cd(a)};p.Tc=function(a,b,c,d){this.b.Tc(a,b,c,d)};p.Gb=function(){this.b.Gb()};p.ud=function(){this.b.ud()};p.rd=function(){this.b.rd()};p.yd=function(){this.b.yd()};p.ic=function(){this.b.ic()};p.tb=function(){this.b.tb()};p.hd=function(){this.b.hd()};
p.Jc=function(a){this.b.Jc(a)};p.md=function(){this.b.md()};p.fd=function(){this.b.fd()};p.ld=function(){this.b.ld()};p.kc=function(){this.b.kc()};p.Qd=function(a){this.b.Qd(a)};p.bc=function(a){this.b.bc(a)};p.gd=function(a){this.b.gd(a)};p.kd=function(){this.b.kd()};p.jd=function(a,b,c){this.b.jd(a,b,c)};p.Mc=function(a,b,c){this.b.Mc(a,b,c)};p.Lc=function(a,b,c){this.b.Lc(a,b,c)};p.wa=function(){this.b.wa()};p.rb=function(a,b,c){this.b.rb(a,b,c)};p.Hb=function(){this.b.Hb()};p.Kc=function(a){this.b.Kc(a)};
p.Vc=function(){this.b.Vc()};function kf(a,b,c){ef.call(this,a);this.J=c;this.H=0;if(this.ka=b)this.Za=b.Za}t(kf,ef);kf.prototype.Ac=function(){return this.ka.Ac()};kf.prototype.error=function(a){u.b(a)};kf.prototype.wa=function(){this.H++};kf.prototype.Hb=function(){if(!--this.H&&!this.J){var a=this.ka;a.b=a.g.pop()}};function lf(a,b,c){kf.call(this,a,b,c)}t(lf,kf);function mf(a,b){a.error(b,a.Ac())}function nf(a,b){mf(a,b);jf(a.ka,new kf(a.f,a.ka,!1))}p=lf.prototype;p.tb=function(){nf(this,"E_CSS_UNEXPECTED_SELECTOR")};
p.hd=function(){nf(this,"E_CSS_UNEXPECTED_FONT_FACE")};p.Jc=function(){nf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};p.md=function(){nf(this,"E_CSS_UNEXPECTED_VIEWPORT")};p.fd=function(){nf(this,"E_CSS_UNEXPECTED_DEFINE")};p.ld=function(){nf(this,"E_CSS_UNEXPECTED_REGION")};p.kc=function(){nf(this,"E_CSS_UNEXPECTED_PAGE")};p.bc=function(){nf(this,"E_CSS_UNEXPECTED_WHEN")};p.gd=function(){nf(this,"E_CSS_UNEXPECTED_FLOW")};p.kd=function(){nf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};p.jd=function(){nf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
p.Mc=function(){nf(this,"E_CSS_UNEXPECTED_PARTITION")};p.Lc=function(){nf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};p.Kc=function(){nf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};p.Vc=function(){nf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};p.rb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Ac())};var of=[],pf=[],T=[],qf=[],rf=[],sf=[],tf=[],uf=[],vf=[],wf=[],xf=[],yf=[],zf=[];of[1]=28;of[36]=29;of[7]=29;of[9]=29;of[14]=29;of[18]=29;of[20]=30;of[13]=27;of[0]=200;pf[1]=46;pf[0]=200;sf[1]=2;
sf[36]=4;sf[7]=6;sf[9]=8;sf[14]=10;sf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;qf[1]=1;qf[36]=3;qf[7]=5;qf[9]=7;qf[14]=9;qf[11]=200;qf[18]=55;rf[1]=2;rf[36]=4;rf[7]=6;rf[9]=8;rf[18]=14;rf[50]=42;rf[14]=10;rf[12]=13;tf[1]=15;tf[7]=16;tf[4]=17;tf[5]=18;tf[3]=19;tf[2]=20;tf[8]=21;tf[16]=22;tf[19]=23;tf[6]=24;tf[11]=25;tf[17]=26;tf[13]=48;tf[31]=47;tf[23]=54;tf[0]=44;uf[1]=31;uf[4]=32;uf[5]=32;uf[3]=33;uf[2]=34;uf[10]=40;uf[6]=38;
uf[31]=36;uf[24]=36;uf[32]=35;vf[1]=45;vf[16]=37;vf[37]=37;vf[38]=37;vf[47]=37;vf[48]=37;vf[39]=37;vf[49]=37;vf[26]=37;vf[25]=37;vf[23]=37;vf[24]=37;vf[19]=37;vf[21]=37;vf[36]=37;vf[18]=37;vf[22]=37;vf[11]=39;vf[12]=43;vf[17]=49;wf[0]=200;wf[12]=50;wf[13]=51;wf[14]=50;wf[15]=51;wf[10]=50;wf[11]=51;wf[17]=53;xf[0]=200;xf[12]=50;xf[13]=52;xf[14]=50;xf[15]=51;xf[10]=50;xf[11]=51;xf[17]=53;yf[0]=200;yf[12]=50;yf[13]=51;yf[14]=50;yf[15]=51;yf[10]=50;yf[11]=51;zf[11]=0;zf[16]=0;zf[22]=1;zf[18]=1;
zf[26]=2;zf[25]=2;zf[38]=3;zf[37]=3;zf[48]=3;zf[47]=3;zf[39]=3;zf[49]=3;zf[41]=3;zf[23]=4;zf[24]=4;zf[36]=5;zf[19]=5;zf[21]=5;zf[0]=6;zf[52]=2;function Af(a,b,c,d){this.b=a;this.f=b;this.w=c;this.fa=d;this.F=[];this.V={};this.g=this.J=null;this.C=!1;this.j=2;this.G=null;this.H=!1;this.A=this.O=null;this.l=[];this.h=[];this.X=this.Z=!1}function Bf(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Cf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new rc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.w.error("E_CSS_MISMATCHED_C_PAR",c),a.b=xf,null;a=new tc(d[e-1],Bf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.w.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=xf,null):1<
g?new sc(Bf(a,e+1)):d[0]}function Df(a,b,c){a.b=a.g?xf:wf;a.w.error(b,c)}
function Ef(a,b,c){for(var d=a.F,e=a.w,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Tb(e.ha(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new hc(e.ha(),qb(f,b),g);b=0;continue}}if(10==h){f.ge()&&(f=new jc(e.ha(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Ob(e.ha(),f);else if(-24==h)f=new Pb(e.ha(),
f);else return Df(a,"F_UNEXPECTED_STATE",c),!1;else{if(zf[b]>zf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Qb(e.ha(),g,f);break;case 52:f=new Rb(e.ha(),g,f);break;case 25:f=new Sb(e.ha(),g,f);break;case 38:f=new Ub(e.ha(),g,f);break;case 37:f=new Wb(e.ha(),g,f);break;case 48:f=new Vb(e.ha(),g,f);break;case 47:f=new Xb(e.ha(),g,f);break;case 39:case 49:f=new Yb(e.ha(),g,f);break;case 41:f=new Zb(e.ha(),g,f);break;case 23:f=new $b(e.ha(),g,f);break;case 24:f=new ac(e.ha(),g,f);break;case 36:f=
new bc(e.ha(),g,f);break;case 19:f=new cc(e.ha(),g,f);break;case 21:f=new dc(e.ha(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ic(e.ha(),d.pop(),g,f);break;case 10:if(g.ge())f=new jc(e.ha(),g,f);else return Df(a,"E_CSS_MEDIA_TEST",c),!1}else return Df(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Df(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Df(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Ff(a){for(var b=[];;){var c=R(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.I);break;default:return b}S(a.f)}}
function Gf(a){var b=!1,c=R(a.f);if(23===c.type)b=!0,S(a.f),c=R(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.I)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.I);var d=0;S(a.f);var c=R(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=R(a.f));if(5===c.type){d=c.I;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.I),S(a.f),c=R(a.f),5===c.type&&!(0>c.I||1/c.I===1/-0))return S(a.f),[b,c.I]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.I:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.I))return S(a.f),[0,c.I]}return null}
function Hf(a,b,c){a=a.w.ha();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=lc(a,c,new Ob(a,new fc(a,"pref-horizontal")));break;case "horizontal":c=lc(a,c,new fc(a,"pref-horizontal"));break;case "day":c=lc(a,c,new Ob(a,new fc(a,"pref-night-mode")));break;case "night":c=lc(a,c,new fc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function If(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Jf(a,b,c,d,e,f){var g=a.w,h=a.f,l=a.F,k,m,n,r;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=R(h),a.b[k.type]){case 28:if(18!=We(h,1).type){If(a)?(g.error("E_CSS_COLON_EXPECTED",We(h,1)),a.b=xf):(a.b=sf,g.tb());continue}m=We(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.C=!1;S(h);S(h);a.b=tf;l.splice(0,l.length);continue;case 46:if(18!=We(h,1).type){a.b=xf;g.error("E_CSS_COLON_EXPECTED",We(h,1));continue}a.g=k.text;a.C=!1;S(h);
S(h);a.b=tf;l.splice(0,l.length);continue;case 29:a.b=sf;g.tb();continue;case 1:if(!k.b){a.b=yf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.Gb();case 2:if(34==We(h,1).type)if(S(h),S(h),n=a.V[k.text],null!=n)switch(k=R(h),k.type){case 1:g.yb(n,k.text);a.b=f?qf:T;S(h);break;case 36:g.yb(n,null);a.b=f?qf:T;S(h);break;default:a.b=wf,g.error("E_CSS_NAMESPACE",k)}else a.b=wf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.yb(a.J,k.text),a.b=f?qf:T,S(h);continue;case 3:if(!k.b){a.b=yf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.Gb();case 4:if(34==We(h,1).type)switch(S(h),S(h),k=R(h),k.type){case 1:g.yb(null,k.text);a.b=f?qf:T;S(h);break;case 36:g.yb(null,null);a.b=f?qf:T;S(h);break;default:a.b=wf,g.error("E_CSS_NAMESPACE",k)}else g.yb(a.J,null),a.b=f?qf:T,S(h);continue;case 5:k.b&&g.Gb();case 6:g.Cd(k.text);a.b=f?qf:T;S(h);continue;case 7:k.b&&g.Gb();case 8:g.vd(k.text);a.b=f?qf:T;S(h);continue;case 55:k.b&&g.Gb();case 14:S(h);k=R(h);b:switch(k.type){case 1:g.Fc(k.text,null);S(h);a.b=f?qf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=sf;g.Kc("not");Jf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=yf;break a;case "lang":case "href-epub-type":if(k=R(h),1===k.type){n=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(n=Gf(a))break;else break b;default:n=Ff(a)}k=R(h);if(11==k.type){g.Fc(m,n);S(h);a.b=f?qf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=wf;continue;case 42:S(h);k=R(h);switch(k.type){case 1:g.Gc(k.text,
null);a.b=f?qf:T;S(h);continue;case 6:if(m=k.text,S(h),n=Ff(a),k=R(h),11==k.type){g.Gc(m,n);a.b=f?qf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=wf;continue;case 9:k.b&&g.Gb();case 10:S(h);k=R(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=yf;g.error("E_CSS_ATTR",k);S(h);continue}k=R(h);if(34==k.type){n=m?a.V[m]:m;if(null==n){a.b=yf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=R(h);if(1!=k.type){a.b=yf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;S(h);k=R(h)}else n="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:r=k.type;S(h);k=R(h);break;case 15:g.Tc(n,m,0,null);a.b=f?qf:T;S(h);continue;default:a.b=yf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Tc(n,m,r,k.text);S(h);k=R(h);break;default:a.b=yf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=yf;g.error("E_CSS_ATTR",k);continue}a.b=f?qf:T;S(h);continue;case 11:g.ud();a.b=rf;S(h);continue;case 12:g.rd();
a.b=rf;S(h);continue;case 56:g.yd();a.b=rf;S(h);continue;case 13:a.Z?(a.h.push("-epubx-region"),a.Z=!1):a.X?(a.h.push("page"),a.X=!1):a.h.push("[selector]");g.wa();a.b=of;S(h);continue;case 41:g.ic();a.b=sf;S(h);continue;case 15:l.push(C(k.text));S(h);continue;case 16:try{l.push(df(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=wf}S(h);continue;case 17:l.push(new Cc(k.I));S(h);continue;case 18:l.push(new Dc(k.I));S(h);continue;case 19:l.push(new D(k.I,k.text));S(h);continue;case 20:l.push(new Ac(k.text));
S(h);continue;case 21:l.push(new Fc(oa(k.text,a.fa)));S(h);continue;case 22:Cf(a,",",k);l.push(",");S(h);continue;case 23:l.push(xc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=uf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Cf(a,")",k);S(h);continue;case 47:S(h);k=R(h);m=We(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){S(h);a.C=!0;continue}Df(a,"E_CSS_SYNTAX",k);continue;case 54:m=We(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);
continue}}a.b===tf&&0<=h.b?(Xe(h),a.b=sf,g.tb()):Df(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Cf(a,";",k))&&a.g&&g.rb(a.g,m,a.C);a.b=d?pf:of;continue;case 44:S(h);h.b=-1;m=Cf(a,";",k);if(c)return a.G=m,!0;a.g&&m&&g.rb(a.g,m,a.C);if(d)return!0;Df(a,"E_CSS_SYNTAX",k);continue;case 31:m=We(h,1);9==m.type?(10!=We(h,2).type||We(h,2).b?(l.push(new fc(g.ha(),qb(k.text,m.text))),a.b=vf):(l.push(k.text,m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new gc(g.ha(),
!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new gc(g.ha(),!1,k.text))):l.push(new fc(g.ha(),k.text)),a.b=vf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new tb(g.ha(),k.I));S(h);a.b=vf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new ec(g.ha(),k.I,m));S(h);a.b=vf;continue;case 34:l.push(new tb(g.ha(),k.text));S(h);a.b=vf;continue;case 35:S(h);k=R(h);5!=k.type||k.b?Df(a,"E_CSS_SYNTAX",k):(l.push(new kc(g.ha(),
k.I)),S(h),a.b=vf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=uf;Ef(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=uf,Ef(a,52,k),l.push(52),S(h)):Df(a,"E_CSS_SYNTAX",k);continue;case 39:Ef(a,k.type,k)&&(a.g?a.b=tf:Df(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:Ef(a,11,k)&&(a.g||3==a.j?Df(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.bc(l.pop()):(k=l.pop(),g.bc(k)),a.h.push("media"),g.wa(),a.b=of));S(h);continue;case 49:if(Ef(a,11,k))if(a.g||3!=a.j)Df(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.A=l.pop(),a.H=!0,a.b=of,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=of;S(h);g.Hb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=R(h);if(2==k.type||8==k.type){a.O=k.text;S(h);k=R(h);if(17==k.type||0==k.type)return a.H=!0,S(h),!1;a.g=null;a.j=3;a.b=uf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=wf;continue;case "namespace":S(h);k=R(h);switch(k.type){case 1:m=k.text;S(h);
k=R(h);if((2==k.type||8==k.type)&&17==We(h,1).type){a.V[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==We(h,1).type){a.J=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=wf;continue;case "charset":S(h);k=R(h);if(2==k.type&&17==We(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=wf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
We(h,1).type){S(h);S(h);switch(m){case "font-face":g.hd();break;case "-epubx-page-template":g.kd();break;case "-epubx-define":g.fd();break;case "-epubx-viewport":g.md()}a.h.push(m);g.wa();continue}break;case "-adapt-footnote-area":S(h);k=R(h);switch(k.type){case 12:S(h);g.Jc(null);a.h.push(m);g.wa();continue;case 50:if(S(h),k=R(h),1==k.type&&12==We(h,1).type){m=k.text;S(h);S(h);g.Jc(m);a.h.push("-adapt-footnote-area");g.wa();continue}}break;case "-epubx-region":S(h);g.ld();a.Z=!0;a.b=sf;continue;
case "page":S(h);g.kc();a.X=!0;a.b=rf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k=R(h);if(12==k.type){S(h);g.Qd(m);a.h.push(m);g.wa();continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=uf;l.push("{");
continue;case "media":S(h);a.g=null;a.j=2;a.b=uf;l.push("{");continue;case "-epubx-flow":if(1==We(h,1).type&&12==We(h,2).type){g.gd(We(h,1).text);S(h);S(h);S(h);a.h.push(m);g.wa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=R(h);r=n=null;var q=[];1==k.type&&(n=k.text,S(h),k=R(h));18==k.type&&1==We(h,1).type&&(r=We(h,1).text,S(h),S(h),k=R(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==We(h,1).type&&11==We(h,2).type;)q.push(We(h,1).text),
S(h),S(h),S(h),k=R(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.jd(n,r,q);break;case "-epubx-partition":g.Mc(n,r,q);break;case "-epubx-partition-group":g.Lc(n,r,q)}a.h.push(m);g.wa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=yf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=wf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=wf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=of;continue}case 51:0<
a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=of);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=of);S(h);continue;case 200:return f&&(S(h),g.Vc()),!0;default:if(c||d)return!0;if(e)return Ef(a,11,k)?(a.G=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===tf&&0<=h.b?(Xe(h),a.b=sf,g.tb()):a.b!==wf&&a.b!==yf&&a.b!==xf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=If(a)?xf:yf):S(h)}return!1}
function Kf(a){ef.call(this,null);this.f=a}t(Kf,ef);Kf.prototype.error=function(a){throw Error(a);};Kf.prototype.ha=function(){return this.f};
function Lf(a,b,c,d,e){var f=I("parseStylesheet"),g=new Af(of,a,b,c),h=null;e&&(h=Mf(new Ue(e,b),b,c));if(h=Hf(g,d,h&&h.ra()))b.bc(h),b.wa();he(function(){for(;!Jf(g,100,!1,!1,!1,!1);){if(g.H){var a=oa(g.O,c);g.A&&(b.bc(g.A),b.wa());var d=I("parseStylesheet.import");Nf(a,b,null,null).then(function(){g.A&&b.Hb();g.H=!1;g.O=null;g.A=null;O(d,!0)});return M(d)}a=fe();if(a.za)return a}return L(!1)}).then(function(){h&&b.Hb();O(f,!0)});return M(f)}
function Of(a,b,c,d,e){return Rd("parseStylesheetFromText",function(f){var g=new Ue(a,b);Lf(g,b,c,d,e).Fa(f)},function(b,c){u.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function Nf(a,b,c,d){return Rd("parseStylesheetFromURL",function(e){Ye(a).then(function(f){f.responseText?Of(f.responseText,b,a,c,d).then(function(b){b||u.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){u.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function Pf(a,b){var c=new Af(tf,b,new Kf(a),"");Jf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.G}function Mf(a,b,c){a=new Af(uf,a,b,c);Jf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.G}var Qf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Rf(a,b,c){if(b.fe())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Qf[c]?a==Math.round(a)?new Dc(a):new Cc(a):new D(a,"px");break a;case "string":c=a?Pf(b.b,new Ue(a,null)):B;break a;case "boolean":c=a?Bd:Xc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Sf(a,b,c,d){this.U=a;this.R=b;this.T=c;this.N=d}function Tf(a,b){this.f=a;this.b=b}function Uf(){this.bottom=this.right=this.top=this.left=0}function Vf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Wf(a,b,c,d){this.R=a;this.N=b;this.U=c;this.T=d;this.right=this.left=null}function Xf(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function Yf(a){this.b=a}function Zf(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Vf(e,g,1,c):new Vf(g,e,-1,c));e=g}}
function $f(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Tf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Yf(e)}function ag(a,b,c,d){return new Yf([new Tf(a,b),new Tf(c,b),new Tf(c,d),new Tf(a,d)])}function bg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function cg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function dg(a,b,c,d){var e,f;b.f.b<c&&u.b("Error: inconsistent segment (1)");b.b.b<=c?(c=cg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=cg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new bg(c,e,b.g,-1)),a.push(new bg(d,f,b.g,1))):(a.push(new bg(d,f,b.g,-1)),a.push(new bg(c,e,b.g,1)))}
function eg(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var n=!1,f=0;f<b;f++)if(d[f]&&!e[f]){n=!0;break}if(n)for(f=b;f<=c;f++)if(d[f]||e[f]){n=!1;break}h!=n&&(g.push(m.f),h=n)}return g}function fg(a,b){return b?Math.ceil(a/b)*b:a}function gg(a,b){return b?Math.floor(a/b)*b:a}function hg(a){return new Tf(a.b,-a.f)}function ig(a){return new Sf(a.R,-a.T,a.N,-a.U)}
function jg(a){return new Sf(-a.N,a.U,-a.R,a.T)}function kg(a){return new Yf(Ra(a.b,hg))}
function lg(a,b,c,d,e){e&&(a=ig(a),b=Ra(b,kg),c=Ra(c,kg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)Zf(b[l],h,l);for(l=0;l<f;l++)Zf(c[l],h,l+e);b=h.length;h.sort(Xf);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.R&&g.push(new Wf(a.R,c,a.T,a.T));l=0;for(var n=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&n.push(m),l++;for(;l<b||0<n.length;){var r=a.N,q=Math.min(fg(Math.ceil(c+8),d),a.N);for(k=0;k<n.length&&r>q;k++)m=n[k],m.b.f==m.f.f?m.f.b<r&&(r=Math.max(gg(m.f.b,d),q)):m.b.f!=m.f.f&&(r=q);r>a.N&&(r=
a.N);for(;l<b&&(m=h[l]).b.b<r;)if(m.f.b<c)l++;else if(m.b.b<q){if(m.b.b!=m.f.b||m.b.b!=c)n.push(m),r=q;l++}else{k=gg(m.b.b,d);k<r&&(r=k);break}q=[];for(k=0;k<n.length;k++)dg(q,n[k],c,r);q.sort(function(a,b){return a.f-b.f||a.g-b.g});q=eg(q,e,f);if(q.length){var z=0,y=a.U;for(k=0;k<q.length;k+=2){var A=Math.max(a.U,q[k]),H=Math.min(a.T,q[k+1])-A;H>z&&(z=H,y=A)}z?g.push(new Wf(c,r,Math.max(y,a.U),Math.min(y+z,a.T))):g.push(new Wf(c,r,a.T,a.T))}else g.push(new Wf(c,r,a.T,a.T));if(r==a.N)break;c=r;for(k=
n.length-1;0<=k;k--)n[k].f.b<=r&&n.splice(k,1)}mg(a,g);return g}function mg(a,b){for(var c=b.length-1,d=new Wf(a.N,a.N,a.U,a.T);0<=c;){var e=d,d=b[c];if(1>d.N-d.R||d.U==e.U&&d.T==e.T)e.R=d.R,b.splice(c,1),d=e;c--}}function ng(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].N?c=e+1:d=e}return c}
function og(a,b){if(!a.length)return b;for(var c=b.R,d,e=0;e<a.length&&!(d=a[e],d.N>b.R&&d.U-.1<=b.U&&d.T+.1>=b.T);e++)c=Math.max(c,d.N);for(var f=c;e<a.length&&!(d=a[e],d.R>=b.N||d.U-.1>b.U||d.T+.1<b.T);e++)f=d.N;f=e===a.length?b.N:Math.min(f,b.N);return f<=c?null:new Sf(b.U,c,b.T,f)}
function pg(a,b){if(!a.length)return b;for(var c=b.N,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.N<b.N)&&!(d.R<b.N&&d.U-.1<=b.U&&d.T+.1>=b.T);e--)c=Math.min(c,d.R);for(var f=Math.min(c,d.N);0<=e&&!(d=a[e],d.N<=b.R||d.U-.1>b.U||d.T+.1<b.T);e--)f=d.R;f=Math.max(f,b.R);return c<=f?null:new Sf(b.U,f,b.T,c)};function qg(){this.b={}}t(qg,pc);qg.prototype.Rb=function(a){this.b[a.name]=!0;return a};qg.prototype.ub=function(a){this.Sb(a.values);return a};function rg(a){this.value=a}t(rg,pc);rg.prototype.oc=function(a){this.value=a.I;return a};function sg(a,b){if(a){var c=new rg(b);try{return a.ba(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function tg(){this.f=!1;this.b=[];this.name=null}t(tg,pc);tg.prototype.rc=function(a){this.f&&this.b.push(a);return null};
tg.prototype.qc=function(a){this.f&&!a.I&&this.b.push(new D(0,"px"));return null};tg.prototype.ub=function(a){this.Sb(a.values);return null};tg.prototype.zb=function(a){this.f||(this.f=!0,this.Sb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function ug(a,b,c,d,e,f){if(a){var g=new tg;try{a.ba(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ga){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.I*m/100)}else a.push(k.I*Cb(f,k.ga,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Tf(b+a[g],c+a[g+1]));h=new Yf(f);break a}break;case "rectangle":if(4==a.length){h=ag(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=$f(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=$f(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(n){u.b(n,"toShape:")}}return ag(b,c,b+d,c+e)}function vg(a){this.f=a;this.b={};this.name=null}t(vg,pc);vg.prototype.Rb=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};vg.prototype.oc=function(a){this.name&&(this.b[this.name]+=a.I-(this.f?0:1));return a};vg.prototype.ub=function(a){this.Sb(a.values);return a};
function wg(a,b){var c=new vg(b);try{a.ba(c)}catch(d){u.b(d,"toCounters:")}return c.b}function xg(a,b){this.b=a;this.f=b}t(xg,qc);xg.prototype.sc=function(a){return new Fc(this.f.Oc(a.url,this.b))};function yg(a){this.g=this.h=null;this.f=0;this.b=a}function zg(a,b){this.b=-1;this.f=a;this.g=b}function Ag(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}Ag.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
Ag.prototype.clone=function(){for(var a=new Ag,b=0;b<this.b.length;b++){var c=this.b[b],d=new yg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new zg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function Bg(a,b,c,d){var e=a.b.length,f=new yg(Cg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new zg(e,!0);e=new zg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function Dg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof Eg}
function Fg(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&Dg(b)&&Dg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new Eg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function Gg(){}t(Gg,pc);Gg.prototype.h=function(a,b){var c=a[b].ba(this);return c?[c]:null};function Eg(a,b,c){this.b=a;this.f=b;this.g=c}t(Eg,Gg);p=Eg.prototype;p.Sd=function(a){return this.b&1?a:null};
p.Td=function(a){return this.b&2048?a:null};p.Pc=function(a){return this.b&2?a:null};p.Rb=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};p.rc=function(a){return a.I||this.b&512?0>a.I&&!(this.b&256)?null:this.g[a.ga]?a:null:"%"==a.ga&&this.b&1024?a:null};p.qc=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};p.oc=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.I])?a:null:this.b&512?a:null};
p.qd=function(a){return this.b&64?a:null};p.sc=function(a){return this.b&128?a:null};p.ub=function(){return null};p.Qb=function(){return null};p.zb=function(){return null};p.nc=function(){return null};var Cg=new Eg(0,U,U);
function Hg(a){this.b=new yg(null);var b=this.g=new yg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(Hg,Gg);
function Ig(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Jg&&a instanceof Jg){if(m=(new rc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Kg&&a instanceof Jg){if(m=(new sc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else m=
k.ba(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}p=Hg.prototype;p.kb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.ba(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};p.Sd=function(a){return this.kb(a)};p.Td=function(a){return this.kb(a)};p.Pc=function(a){return this.kb(a)};p.Rb=function(a){return this.kb(a)};p.rc=function(a){return this.kb(a)};p.qc=function(a){return this.kb(a)};
p.oc=function(a){return this.kb(a)};p.qd=function(a){return this.kb(a)};p.sc=function(a){return this.kb(a)};p.ub=function(){return null};p.Qb=function(){return null};p.zb=function(a){return this.kb(a)};p.nc=function(){return null};function Jg(a){Hg.call(this,a)}t(Jg,Hg);Jg.prototype.ub=function(a){var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new rc(b):null};
Jg.prototype.Qb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Kg){c=!0;break}b=b.g}return c?(b=Ig(this,a.values,!1,0),b===a.values?a:b?new sc(b):null):null};Jg.prototype.h=function(a,b){return Ig(this,a,!0,b)};function Kg(a){Hg.call(this,a)}t(Kg,Hg);Kg.prototype.ub=function(a){return this.kb(a)};Kg.prototype.Qb=function(a){var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new sc(b):null};Kg.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Lg(a,b){Hg.call(this,b);this.name=a}t(Lg,Hg);Lg.prototype.kb=function(){return null};Lg.prototype.zb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new tc(a.name,b):null};function Mg(){}Mg.prototype.b=function(a,b){return b};Mg.prototype.g=function(){};function Ng(a,b){this.name=b;this.h=a.g[this.name]}t(Ng,Mg);
Ng.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new rc(a):a[0],c);return b+d}return b};Ng.prototype.g=function(a,b){b.values[this.name]=a};function Og(a,b){Ng.call(this,a,b[0]);this.f=b}t(Og,Ng);Og.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Pg(a,b){this.f=a;this.me=b}t(Pg,Mg);
Pg.prototype.b=function(a,b,c){var d=b;if(this.me)if(a[b]==xc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Qg(){this.b=this.ib=null;this.error=!1;this.values={};this.f=null}p=Qg.prototype;p.clone=function(){var a=new this.constructor;a.ib=this.ib;a.b=this.b;a.f=this.f;return a};p.Wd=function(a,b){this.ib=a;this.b=b};p.dc=function(){this.error=!0;return 0};
function Rg(a,b){a.dc([b]);return null}p.Sd=function(a){return Rg(this,a)};p.Pc=function(a){return Rg(this,a)};p.Rb=function(a){return Rg(this,a)};p.rc=function(a){return Rg(this,a)};p.qc=function(a){return Rg(this,a)};p.oc=function(a){return Rg(this,a)};p.qd=function(a){return Rg(this,a)};p.sc=function(a){return Rg(this,a)};p.ub=function(a){this.dc(a.values);return null};p.Qb=function(){this.error=!0;return null};p.zb=function(a){return Rg(this,a)};p.nc=function(){this.error=!0;return null};
function Sg(){Qg.call(this)}t(Sg,Qg);Sg.prototype.dc=function(a){for(var b=0,c=0;b<a.length;){var d=this.ib[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.ib.length){this.error=!0;break}}return b};function Tg(){Qg.call(this)}t(Tg,Qg);Tg.prototype.dc=function(a){if(a.length>this.ib.length||!a.length)return this.error=!0,0;for(var b=0;b<this.ib.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.ib[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Ug(){Qg.call(this)}t(Ug,Qg);
Ug.prototype.dc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===xc){b=c;break}if(b>this.ib.length||!a.length)return this.error=!0,0;for(c=0;c<this.ib.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.ib[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Vg(){Qg.call(this)}t(Vg,Sg);
Vg.prototype.Qb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof sc)this.error=!0;else{a.values[c].ba(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new sc(b[k]);return null};
function Wg(){Qg.call(this)}t(Wg,Sg);Wg.prototype.Wd=function(a,b){Sg.prototype.Wd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Wg.prototype.dc=function(a){var b=Sg.prototype.dc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].ba(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===xc){b++;if(b+2>a.length||!a[b].ba(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new rc(a.slice(b,a.length));if(!d.ba(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Wg.prototype.Qb=function(a){a.values[0].ba(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new sc(b);a.ba(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Wg.prototype.Rb=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Xg={SIMPLE:Sg,INSETS:Tg,INSETS_SLASH:Ug,COMMA:Vg,FONT:Wg};
function Yg(){this.g={};this.A={};this.l={};this.b={};this.f={};this.h={};this.w=[];this.j=[]}function Zg(a,b){var c;if(3==b.type)c=new D(b.I,b.text);else if(7==b.type)c=df(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(Dg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function $g(a,b,c){for(var d=new Ag,e=0;e<b;e++)Fg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Fg(d,a,3);else for(e=b;e<c;e++)Fg(d,a.clone(),2);return d}function ah(a){var b=new Ag,c=b.b.length;b.b.push(new yg(a));a=new zg(c,!0);var d=new zg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function bh(a,b){var c;switch(a){case "COMMA":c=new Kg(b);break;case "SPACE":c=new Jg(b);break;default:c=new Lg(a.toLowerCase(),b)}return ah(c)}
function ch(a){a.b.HASHCOLOR=ah(new Eg(64,U,U));a.b.POS_INT=ah(new Eg(32,U,U));a.b.POS_NUM=ah(new Eg(16,U,U));a.b.POS_PERCENTAGE=ah(new Eg(8,U,{"%":B}));a.b.NEGATIVE=ah(new Eg(256,U,U));a.b.ZERO=ah(new Eg(512,U,U));a.b.ZERO_PERCENTAGE=ah(new Eg(1024,U,U));a.b.POS_LENGTH=ah(new Eg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=ah(new Eg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=ah(new Eg(8,U,{s:B,ms:B}));a.b.FREQUENCY=ah(new Eg(8,U,{Hz:B,
kHz:B}));a.b.RESOLUTION=ah(new Eg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI=ah(new Eg(128,U,U));a.b.IDENT=ah(new Eg(4,U,U));a.b.STRING=ah(new Eg(2,U,U));a.b.SLASH=ah(new Eg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function dh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function eh(a,b,c){var d=R(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=R(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=R(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=R(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=R(b).type)throw Error("'=' expected");dh(d)||(a.A[d]=e)}else if(18!=R(b).type)throw Error("':' expected");return d}
function fh(a,b){for(;;){var c=eh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new Ag;if("||"==b){for(b=0;b<c.length;b++){var e=new Ag,g=e;if(g.b.length)throw Error("invalid call");var h=new yg(Cg);h.f=2*b+1;g.b.push(h);var h=new zg(0,!0),l=new zg(0,!1);g.g.push(g.f.length);g.f.push(l);g.match.push(g.f.length);g.f.push(h);Fg(e,c[b],1);Bg(e,e.match,!1,b);Fg(a,e,b?4:1)}c=new Ag;if(c.b.length)throw Error("invalid call");
Bg(c,c.match,!0,-1);Fg(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)Bg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Fg(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(S(b),g=R(b),g.type){case 1:h||k(" ");if(dh(g.text)){var n=a.b[g.text];if(!n)throw Error("'"+g.text+"' unexpected");
d.push(n.clone())}else n={},n[g.text.toLowerCase()]=C(g.text),d.push(ah(new Eg(0,n,U)));h=!1;break;case 5:n={};n[""+g.I]=new Dc(g.I);d.push(ah(new Eg(0,n,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({qe:d,ke:f,vc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({qe:d,ke:f,vc:"(",hc:g.text});f="";d=[];h=!0;break;case 15:g=l();n=e.pop();if("["!=n.vc)throw Error("']' unexpected");d=n.qe;d.push(g);f=n.ke;h=!1;break;case 11:g=l();n=e.pop();if("("!=n.vc)throw Error("')' unexpected");
d=n.qe;d.push(bh(n.hc,g));f=n.ke;h=!1;break;case 18:if(h)throw Error("':' unexpected");S(b);d.push(Zg(d.pop(),R(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push($g(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push($g(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push($g(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);g=R(b);if(5!=g.type)throw Error("<int> expected");var r=n=g.I;S(b);g=R(b);if(16==g.type){S(b);g=R(b);
if(5!=g.type)throw Error("<int> expected");r=g.I;S(b);g=R(b)}if(13!=g.type)throw Error("'}' expected");d.push($g(d.pop(),n,r));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().vc+"'");break;default:throw Error("unexpected token");}S(b);dh(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Jg(m):m.b[0].b}}
function gh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:u.b("Unknown property in makePropSet:",g)}return c}
function hh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.A[b])&&h[f])if(f=a.g[b])(a=c===bd||c.fe()?c:c.ba(f))?e.sb(b,a,d):e.Bc(g,c);else if(b=a.h[b].clone(),c===bd)for(c=0;c<b.b.length;c++)e.sb(b.b[c],bd,d);else{c.ba(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.sb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.Bc(g,c)}else e.od(g,c)}
var ih=new ke(function(){var a=I("loadValidatorSet.load"),b=oa("validation.txt",na),c=Ye(b),d=new Yg;ch(d);c.then(function(c){try{if(c.responseText){var e=new Ue(c.responseText,null);for(fh(d,e);;){var g=eh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=R(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Cc(h.I));break;case 5:c.push(new Dc(h.I));break;case 3:c.push(new D(h.I,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new rc(c):
c[0]}for(;;){var l=eh(d,e,3);if(!l)break;var k=We(e,1),m;1==k.type&&Xg[k.text]?(m=new Xg[k.text],S(e)):m=new Sg;m.f=d;g=!1;h=[];c=!1;for(var n=[],r=[];!g;)switch(S(e),k=R(e),k.type){case 1:if(d.g[k.text])h.push(new Ng(m.f,k.text)),r.push(k.text);else if(d.h[k.text]instanceof Tg){var q=d.h[k.text];h.push(new Og(q.f,q.b));r.push.apply(r,q.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;
case 14:n.push({me:c,ib:h});h=[];c=!1;break;case 15:var z=new Pg(h,c),y=n.pop(),h=y.ib;c=y.me;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.Wd(h,r);d.h[l]=m}d.j=gh(d,["background"]);d.w=gh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(A){u.error(A,"Error:")}O(a,d)});return M(a)},"validatorFetcher");var jh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},kh=["box-decoration-break","image-resolution","orphans","widows"];function lh(){return Ld("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(kh))}
for(var mh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},nh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),oh=["left","right","top","bottom"],ph={width:!0,height:!0},qh=0;qh<nh.length;qh++)for(var rh=0;rh<oh.length;rh++){var sh=nh[qh].replace("%",oh[rh]);ph[sh]=!0}function th(a){for(var b={},c=0;c<nh.length;c++)for(var d in a){var e=nh[c].replace("%",d),f=nh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var uh=th({before:"right",after:"left",start:"top",end:"bottom"}),vh=th({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Va=b}p=V.prototype;p.De=function(){return this};p.Wc=function(a){a=this.value.ba(a);return a===this.value?this:new V(a,this.Va)};p.Fe=function(a){return a?new V(this.value,this.Va+a):this};p.evaluate=function(a,b){return Rf(a,this.value,b)};p.re=function(){return!0};function wh(a,b,c){V.call(this,a,b);this.W=c}t(wh,V);
wh.prototype.De=function(){return new V(this.value,this.Va)};wh.prototype.Wc=function(a){a=this.value.ba(a);return a===this.value?this:new wh(a,this.Va,this.W)};wh.prototype.Fe=function(a){return a?new wh(this.value,this.Va+a,this.W):this};wh.prototype.re=function(a){return!!this.W.evaluate(a)};function xh(a,b,c){return(!b||c.Va>b.Va)&&c.re(a)?c.De():b}var yh={"region-id":!0};function zh(a){return"_"!=a.charAt(0)&&!yh[a]}function Ah(a,b,c){c?a[b]=c:delete a[b]}
function Bh(a,b){var c=a[b];c||(c={},a[b]=c);return c}function Ch(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function Dh(a,b,c,d,e,f){if(e){var g=Bh(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Bh(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(yh[h]?(f=c[h],e=Ch(b,h),Array.prototype.push.apply(e,f)):Ah(b,h,xh(a,b[h],c[h].Fe(d))))}
function Eh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function Fh(a,b){this.g=a;this.b=b;this.f=""}t(Fh,qc);function Gh(a){a=a.g["font-size"].value;var b;a:switch(a.ga.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.I*yb[a.ga]}
Fh.prototype.rc=function(a){if("em"==a.ga||"ex"==a.ga){var b=Cb(this.b,a.ga,!1)/Cb(this.b,"em",!1);return new D(a.I*b*Gh(this),"px")}if("rem"==a.ga||"rex"==a.ga)return b=Cb(this.b,a.ga,!1)/Cb(this.b,"rem",!1),new D(a.I*b*this.b.fontSize(),"px");if("%"==a.ga){if("font-size"===this.f)return new D(a.I/100*Gh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.I,b)}return a};
Fh.prototype.nc=function(a){return"font-size"==this.f?Rf(this.b,a,this.f).ba(this):a};function Hh(){}Hh.prototype.apply=function(){};Hh.prototype.l=function(a){return new Ih([this,a])};Hh.prototype.clone=function(){return this};function Jh(a){this.b=a}t(Jh,Hh);Jh.prototype.apply=function(a){a.h[a.h.length-1].push(this.b.b())};function Ih(a){this.b=a}t(Ih,Hh);Ih.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Ih.prototype.l=function(a){this.b.push(a);return this};
Ih.prototype.clone=function(){return new Ih([].concat(this.b))};function Kh(a,b,c,d){this.style=a;this.$=b;this.b=c;this.h=d}t(Kh,Hh);Kh.prototype.apply=function(a){Dh(a.l,a.F,this.style,this.$,this.b,this.h)};function W(){this.b=null}t(W,Hh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function Lh(a){this.b=null;this.h=a}t(Lh,W);Lh.prototype.apply=function(a){0<=a.G.indexOf(this.h)&&this.b.apply(a)};Lh.prototype.f=function(){return 10};
Lh.prototype.g=function(a){this.b&&Mh(a.Ca,this.h,this.b);return!0};function Nh(a){this.b=null;this.id=a}t(Nh,W);Nh.prototype.apply=function(a){a.X!=this.id&&a.fa!=this.id||this.b.apply(a)};Nh.prototype.f=function(){return 11};Nh.prototype.g=function(a){this.b&&Mh(a.g,this.id,this.b);return!0};function Oh(a){this.b=null;this.localName=a}t(Oh,W);Oh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Oh.prototype.f=function(){return 8};
Oh.prototype.g=function(a){this.b&&Mh(a.Nc,this.localName,this.b);return!0};function Ph(a,b){this.b=null;this.h=a;this.localName=b}t(Ph,W);Ph.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Ph.prototype.f=function(){return 8};Ph.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Mh(a.h,b+this.localName,this.b)}return!0};function Qh(a){this.b=null;this.h=a}t(Qh,W);
Qh.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Rh(a){this.b=null;this.h=a}t(Rh,W);Rh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Sh(a,b){this.b=null;this.h=a;this.name=b}t(Sh,W);Sh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Th(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Th,W);Th.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Th.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Th.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Mh(a.f,this.value,this.b),!0):!1};function Uh(a,b){this.b=null;this.h=a;this.name=b}t(Uh,W);
Uh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&mh[b]&&this.b.apply(a)}};Uh.prototype.f=function(){return 0};Uh.prototype.g=function(){return!1};function Vh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t(Vh,W);Vh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Wh(a){this.b=null;this.h=a}t(Wh,W);Wh.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function Xh(){this.b=null}t(Xh,W);Xh.prototype.apply=function(a){a.Sa&&this.b.apply(a)};Xh.prototype.f=function(){return 6};function Yh(){this.b=null}t(Yh,W);Yh.prototype.apply=function(a){a.ta&&this.b.apply(a)};Yh.prototype.f=function(){return 12};function Zh(a,b){this.b=null;this.h=a;this.vc=b}t(Zh,W);function $h(a,b){var c=a.h;b-=a.vc;return c?!(b%c)&&0<=b/c:!b}function ai(a,b){Zh.call(this,a,b)}t(ai,Zh);ai.prototype.apply=function(a){$h(this,a.Ma)&&this.b.apply(a)};ai.prototype.f=function(){return 5};
function bi(a,b){Zh.call(this,a,b)}t(bi,Zh);bi.prototype.apply=function(a){$h(this,a.wb[a.j][a.f])&&this.b.apply(a)};bi.prototype.f=function(){return 5};function ci(a,b){Zh.call(this,a,b)}t(ci,Zh);ci.prototype.apply=function(a){var b=a.V;null===b&&(b=a.V=a.b.parentNode.childElementCount-a.Ma+1);$h(this,b)&&this.b.apply(a)};ci.prototype.f=function(){return 4};function di(a,b){Zh.call(this,a,b)}t(di,Zh);
di.prototype.apply=function(a){var b=a.vb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}$h(this,b[a.j][a.f])&&this.b.apply(a)};di.prototype.f=function(){return 4};function ei(){this.b=null}t(ei,W);ei.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};ei.prototype.f=function(){return 4};
function fi(){this.b=null}t(fi,W);fi.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};fi.prototype.f=function(){return 5};function gi(){this.b=null}t(gi,W);gi.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};gi.prototype.f=function(){return 5};function hi(){this.b=null}t(hi,W);hi.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};hi.prototype.f=function(){return 5};function ii(a){this.b=null;this.W=a}t(ii,W);
ii.prototype.apply=function(a){a.w[this.W]&&this.b.apply(a)};ii.prototype.f=function(){return 5};function ji(){this.b=!1}t(ji,Hh);ji.prototype.apply=function(){this.b=!0};ji.prototype.clone=function(){var a=new ji;a.b=this.b;return a};function ki(a){this.b=null;this.h=new ji;this.j=Eh(a,this.h)}t(ki,W);ki.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};ki.prototype.f=function(){return this.j.f()};function li(a){this.W=a}li.prototype.b=function(){return this};
li.prototype.push=function(a,b){b||mi(a,this.W);return!1};li.prototype.pop=function(a,b){return b?!1:(a.w[this.W]--,!0)};function ni(a){this.W=a}ni.prototype.b=function(){return this};ni.prototype.push=function(a,b){b?1==b&&a.w[this.W]--:mi(a,this.W);return!1};ni.prototype.pop=function(a,b){if(b)1==b&&mi(a,this.W);else return a.w[this.W]--,!0;return!1};function oi(a){this.W=a;this.f=!1}oi.prototype.b=function(){return new oi(this.W)};
oi.prototype.push=function(a){return this.f?(a.w[this.W]--,!0):!1};oi.prototype.pop=function(a,b){if(this.f)return a.w[this.W]--,!0;b||(this.f=!0,mi(a,this.W));return!1};function pi(a){this.W=a;this.f=!1}pi.prototype.b=function(){return new pi(this.W)};pi.prototype.push=function(a,b){this.f&&(-1==b?mi(a,this.W):b||a.w[this.W]--);return!1};pi.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.w[this.W]--,!0;b||mi(a,this.W)}else b||(this.f=!0,mi(a,this.W));return!1};
function qi(a,b){this.f=a;this.element=b}qi.prototype.b=function(){return this};qi.prototype.push=function(){return!1};qi.prototype.pop=function(a,b){return b?!1:(ri(a,this.f,this.element),!0)};function si(a){this.lang=a}si.prototype.b=function(){return this};si.prototype.push=function(){return!1};si.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function ti(a){this.f=a}ti.prototype.b=function(){return this};ti.prototype.push=function(){return!1};
ti.prototype.pop=function(a,b){return b?!1:(a.J=this.f,!0)};function ui(a){this.element=a}t(ui,qc);function vi(a,b){switch(b){case "url":return a?new Fc(a):new Fc("about:invalid");default:return a?new Ac(a):new Ac("")}}
ui.prototype.zb=function(a){if("attr"!==a.name)return qc.prototype.zb.call(this,a);var b="string",c;a.values[0]instanceof rc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?vi(a.values[1].stringValue(),b):vi(null,b);return this.element&&this.element.hasAttribute(c)?vi(this.element.getAttribute(c),b):a};function wi(a,b,c){this.f=a;this.element=b;this.b=c}t(wi,qc);
wi.prototype.Rb=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.C)];b.C++;break;case "close-quote":return 0<b.C&&b.C--,c[2*Math.min(d,b.C)+1];case "no-open-quote":return b.C++,new Ac("");case "no-close-quote":return 0<b.C&&b.C--,new Ac("")}return a};
var xi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},yi={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
zi={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Ai={Qf:!1,yc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",ad:"\u5341\u767e\u5343",hf:"\u8ca0"};
function Bi(a){if(9999<a||-9999>a)return""+a;if(!a)return Ai.yc.charAt(0);var b=new Da;0>a&&(b.append(Ai.hf),a=-a);if(10>a)b.append(Ai.yc.charAt(a));else if(Ai.Rf&&19>=a)b.append(Ai.ad.charAt(0)),a&&b.append(Ai.ad.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Ai.yc.charAt(c)),b.append(Ai.ad.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Ai.yc.charAt(c)),b.append(Ai.ad.charAt(1));if(c=Math.floor(a/10)%10)b.append(Ai.yc.charAt(c)),b.append(Ai.ad.charAt(0));(a%=10)&&b.append(Ai.yc.charAt(a))}return b.toString()}
function Ci(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(xi[b])a:{e=xi[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(yi[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=yi[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=zi[b]?e=zi[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Bi(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Di(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new Ac(Ci(e&&e.length&&e[e.length-1]||0,d));c=new E(Ei(a.b,c,function(a){return Ci(a||0,d)}));return new rc([c])}
function Fi(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Da;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Ci(f[h],e));c=new E(Gi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Ci(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Ci(0,e)}));return new rc([c])}
function Hi(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Ii(a.b,c,d,function(a){return Ci(a||0,e)}));return new rc([c])}function Ji(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Ki(a.b,c,d,function(a){a=a.map(function(a){return Ci(a,f)});return a.length?a.join(e):Ci(0,f)}));return new rc([c])}
wi.prototype.zb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return Di(this,a.values);break;case "counters":if(3>=a.values.length)return Fi(this,a.values);break;case "target-counter":if(3>=a.values.length)return Hi(this,a.values);break;case "target-counters":if(4>=a.values.length)return Ji(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new Ac("")};var Li=1/1048576;function Mi(a,b){for(var c in a)b[c]=a[c].clone()}
function Ni(){this.j=0;this.b={};this.Nc={};this.h={};this.f={};this.Ca={};this.g={};this.Ec={};this.order=0}Ni.prototype.clone=function(){var a=new Ni;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Mi(this.Nc,a.Nc);Mi(this.h,a.h);Mi(this.f,a.f);Mi(this.Ca,a.Ca);Mi(this.g,a.g);Mi(this.Ec,a.Ec);a.order=this.order;return a};function Mh(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}Ni.prototype.je=function(){return this.order+=Li};
function Oi(a,b,c,d){this.A=a;this.l=b;this.tc=c;this.Xa=d;this.h=[[],[]];this.w={};this.G=this.F=this.b=null;this.xa=this.fa=this.X=this.j=this.f="";this.Z=this.O=null;this.ta=this.Sa=!0;this.g={};this.H=[{}];this.J=[new Ac("\u201c"),new Ac("\u201d"),new Ac("\u2018"),new Ac("\u2019")];this.C=0;this.lang="";this.Cb=[0];this.Ma=0;this.ja=[{}];this.wb=this.ja[0];this.V=null;this.Ab=[this.V];this.Bb=[{}];this.vb=this.ja[0];this.xb=[]}function mi(a,b){a.w[b]=(a.w[b]||0)+1}
function Pi(a,b,c){(b=b[c])&&b.apply(a)}var Qi=[];function Ri(a,b,c,d){a.b=null;a.F=d;a.j="";a.f="";a.X="";a.fa="";a.G=b;a.xa="";a.O=Qi;a.Z=c;Si(a)}function Ti(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function Ui(a,b){var c=cd,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=wg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=wg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=wg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===id&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Ti(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Ti(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Ti(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===id&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Cc(c[c.length-1]),0));a.H.push(null)}function Vi(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function ri(a,b,c){Ui(a,b);b.content&&(b.content=b.content.Wc(new wi(a,c,a.Xa)));Vi(a)}var Wi="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Xi(a,b,c){a.xb.push(b);a.Z=null;a.b=b;a.F=c;a.j=b.namespaceURI;a.f=b.localName;var d=a.A.b[a.j];a.xa=d?d+a.f:"";a.X=b.getAttribute("id");a.fa=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=Qi;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O=d.split(/\s+/):a.O=Qi;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=Ba(b))a.h[a.h.length-1].push(new si(a.lang)),
a.lang=d.toLowerCase();var d=a.ta,e=a.Cb;a.Ma=++e[e.length-1];e.push(0);var e=a.ja,f=a.wb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Ab;null!==e[e.length-1]?a.V=--e[e.length-1]:a.V=null;e.push(null);e=a.Bb;(f=a.vb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});Si(a);Yi(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new ti(a.J),e===F?a.J=[new Ac(""),new Ac("")]:e instanceof rc&&(a.J=e.values));Ui(a,a.F);e=a.X||a.fa||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Zi(a.tc,e,h)}if(d=a.F._pseudos)for(e=!0,f=0;f<Wi.length;f++)(g=Wi[f])||(e=!1),(g=d[g])&&(e?ri(a,g,b):a.h[a.h.length-2].push(new qi(g,b)));c&&a.h[a.h.length-2].push(c)}function $i(a,b){for(var c in b)zh(c)&&(b[c]=b[c].Wc(a))}function Yi(a,b){var c=new ui(b),d=a.F,e=d._pseudos,f;for(f in e)$i(c,e[f]);$i(c,d)}
function Si(a){var b;for(b=0;b<a.G.length;b++)Pi(a,a.A.Ca,a.G[b]);for(b=0;b<a.O.length;b++)Pi(a,a.A.f,a.O[b]);Pi(a,a.A.g,a.X);Pi(a,a.A.Nc,a.f);""!=a.f&&Pi(a,a.A.Nc,"*");Pi(a,a.A.h,a.xa);null!==a.Z&&(Pi(a,a.A.Ec,a.Z),Pi(a,a.A.Ec,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Sa=!0;a.ta=!1}
Oi.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.Sa=!1};var aj=null;function bj(a,b,c,d,e,f,g){kf.call(this,a,b,g);this.b=null;this.$=0;this.h=this.Ua=null;this.A=!1;this.W=c;this.j=d?d.j:aj?aj.clone():new Ni;this.F=e;this.w=f;this.l=0}t(bj,lf);bj.prototype.He=function(a){Mh(this.j.Nc,"*",a)};function cj(a,b){var c=Eh(a.b,b);c!==b&&c.g(a.j)||a.He(c)}
bj.prototype.yb=function(a,b){if(b||a)this.$+=1,b&&a?this.b.push(new Ph(a,b.toLowerCase())):b?this.b.push(new Oh(b.toLowerCase())):this.b.push(new Rh(a))};bj.prototype.vd=function(a){this.h?(u.b("::"+this.h,"followed by ."+a),this.b.push(new ii(""))):(this.$+=256,this.b.push(new Lh(a)))};var dj={"nth-child":ai,"nth-of-type":bi,"nth-last-child":ci,"nth-last-of-type":di};
bj.prototype.Fc=function(a,b){if(this.h)u.b("::"+this.h,"followed by :"+a),this.b.push(new ii(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new fi);break;case "disabled":this.b.push(new gi);break;case "checked":this.b.push(new hi);break;case "root":this.b.push(new Yh);break;case "link":this.b.push(new Oh("a"));this.b.push(new Sh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+qa(b[0])+"($|s)");this.b.push(new Qh(c))}else this.b.push(new ii(""));
break;case "-adapt-footnote-content":case "footnote-content":this.A=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new ii(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Wh(new RegExp("^"+qa(b[0].toLowerCase())+"($|-)"))):this.b.push(new ii(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=dj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new ii(""));break;case "first-child":this.b.push(new Xh);
break;case "last-child":this.b.push(new ci(0,1));break;case "first-of-type":this.b.push(new bi(0,1));break;case "last-of-type":this.b.push(new di(0,1));break;case "only-child":this.b.push(new Xh);this.b.push(new ci(0,1));break;case "only-of-type":this.b.push(new bi(0,1));this.b.push(new di(0,1));break;case "empty":this.b.push(new ei);break;case "before":case "after":case "first-line":case "first-letter":this.Gc(a,b);return;default:u.b("unknown pseudo-class selector: "+a),this.b.push(new ii(""))}this.$+=
256}};
bj.prototype.Gc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new ii(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new ii(""))):this.h="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new ii(""))}this.$+=1};bj.prototype.Cd=function(a){this.$+=65536;this.b.push(new Nh(a))};
bj.prototype.Tc=function(a,b,c,d){this.$+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Sh(a,b);break;case 39:e=new Th(a,b,d);break;case 45:!d||d.match(/\s/)?e=new ii(""):e=new Vh(a,b,new RegExp("(^|\\s)"+qa(d)+"($|\\s)"));break;case 44:e=new Vh(a,b,new RegExp("^"+qa(d)+"($|-)"));break;case 43:d?e=new Vh(a,b,new RegExp("^"+qa(d))):e=new ii("");break;case 42:d?e=new Vh(a,b,new RegExp(qa(d)+"$")):e=new ii("");break;case 46:d?e=new Vh(a,b,new RegExp(qa(d))):e=new ii("");break;case 50:"supported"==
d?e=new Uh(a,b):(u.b("Unsupported :: attr selector op:",d),e=new ii(""));break;default:u.b("Unsupported attr selector:",c),e=new ii("")}this.b.push(e)};var ej=0;p=bj.prototype;p.Gb=function(){var a="d"+ej++;cj(this,new Jh(new li(a)));this.b=[new ii(a)]};p.ud=function(){var a="c"+ej++;cj(this,new Jh(new ni(a)));this.b=[new ii(a)]};p.rd=function(){var a="a"+ej++;cj(this,new Jh(new oi(a)));this.b=[new ii(a)]};p.yd=function(){var a="f"+ej++;cj(this,new Jh(new pi(a)));this.b=[new ii(a)]};
p.ic=function(){fj(this);this.h=null;this.A=!1;this.$=0;this.b=[]};p.tb=function(){var a;0!=this.l?(nf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.l=1,this.Ua={},this.h=null,this.$=0,this.A=!1,this.b=[])};p.error=function(a,b){lf.prototype.error.call(this,a,b);1==this.l&&(this.l=0)};p.lc=function(a){lf.prototype.lc.call(this,a);this.l=0};p.wa=function(){fj(this);lf.prototype.wa.call(this);1==this.l&&(this.l=0)};p.Hb=function(){lf.prototype.Hb.call(this)};
function fj(a){if(a.b){var b=a.$+a.j.je();cj(a,a.Me(b));a.b=null;a.h=null;a.A=!1;a.$=0}}p.Me=function(a){var b=this.F;this.A&&(b=b?"xxx-bogus-xxx":"footnote");return new Kh(this.Ua,a,this.h,b)};p.rb=function(a,b,c){hh(this.w,a,b,c,this)};p.Bc=function(a,b){mf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};p.od=function(a,b){mf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
p.sb=function(a,b,c){"display"!=a||b!==md&&b!==ld||(this.sb("flow-options",new rc([Wc,rd]),c),this.sb("flow-into",b,c),b=Mc);Ld("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?ff(this):gf(this);Ah(this.Ua,a,this.W?new wh(b,d,this.W):new V(b,d))};p.Kc=function(a){switch(a){case "not":a=new gj(this),a.tb(),jf(this.ka,a)}};function gj(a){bj.call(this,a.f,a.ka,a.W,a,a.F,a.w,!1);this.parent=a;this.g=a.b}t(gj,bj);p=gj.prototype;
p.Kc=function(a){"not"==a&&nf(this,"E_CSS_UNEXPECTED_NOT")};p.wa=function(){nf(this,"E_CSS_UNEXPECTED_RULE_BODY")};p.ic=function(){nf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};p.Vc=function(){this.b&&0<this.b.length&&this.g.push(new ki(this.b));this.parent.$+=this.$;var a=this.ka;a.b=a.g.pop()};p.error=function(a,b){bj.prototype.error.call(this,a,b);var c=this.ka;c.b=c.g.pop()};function hj(a,b){kf.call(this,a,b,!1)}t(hj,lf);
hj.prototype.rb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Ac());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new ec(this.f,100,c),c=b.ra(this.f,c);this.f.values[a]=c}};function ij(a,b,c,d,e){kf.call(this,a,b,!1);this.Ua=d;this.W=c;this.b=e}t(ij,lf);ij.prototype.rb=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):hh(this.b,a,b,c,this)};ij.prototype.Bc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
ij.prototype.od=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};ij.prototype.sb=function(a,b,c){c=c?ff(this):gf(this);c+=this.order;this.order+=Li;Ah(this.Ua,a,this.W?new wh(b,c,this.W):new V(b,c))};function jj(a,b){Kf.call(this,a);this.Ua={};this.b=b;this.order=0}t(jj,Kf);jj.prototype.rb=function(a,b,c){hh(this.b,a,b,c,this)};jj.prototype.Bc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};jj.prototype.od=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
jj.prototype.sb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Li;Ah(this.Ua,a,new V(b,c))};function kj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==bd?b===zd:c}function lj(a,b,c,d){var e={},f;for(f in a)zh(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)zh(g)&&(e[g]=xh(b,e[g],f[g]))}return e}
function mj(a,b,c,d){c=c?uh:vh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Va>f.Va)continue;g=ph[g]?g:e}else g=e;b[g]=d(e,f)}}};var nj=!1,oj={Ff:"ltr",Gf:"rtl"};ba("vivliostyle.constants.PageProgression",oj);oj.LTR="ltr";oj.RTL="rtl";var pj={Ve:"left",We:"right"};ba("vivliostyle.constants.PageSide",pj);pj.LEFT="left";pj.RIGHT="right";var qj={LOADING:"loading",Ef:"interactive",Bf:"complete"};ba("vivliostyle.constants.ReadyState",qj);qj.LOADING="loading";qj.INTERACTIVE="interactive";qj.COMPLETE="complete";function rj(a,b,c){this.w=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=sj(sj(sj(sj(new tj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function uj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function vj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return uj(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,uj(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return uj(a,b)+e}function wj(a){0>a.h&&(a.h=vj(a,a.root,0,!0));return a.h}
function xj(a,b){for(var c,d=a.root;;){c=uj(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=La(e.length,function(c){return uj(a,e[c])>b});if(!f)break;if(f<e.length&&uj(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function yj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)yj(a,c)}function zj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},yj(a,a.b.documentElement)),d=a.f[c]);return d}
var Aj={Jf:"text/html",Kf:"text/xml",wf:"application/xml",vf:"application/xhtml_xml",Df:"image/svg+xml"};function Bj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Cj(a){var b=a.contentType;if(b){for(var c=Object.keys(Aj),d=0;d<c.length;d++)if(Aj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Dj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Cj(a);(c=Bj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Bj(e,"image/svg+xml",d)):c=Bj(e,"text/html",d));c||(c=Bj(e,"text/html",d))}}c=c?new rj(b,a.url,c):null;return L(c)}function Ej(a){this.hc=a}
function Fj(){var a=Gj;return new Ej(function(b){return a.hc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Hj(){var a=Fj(),b=Gj;return new Ej(function(c){if(!b.hc(c))return!1;c=new tj([c]);c=sj(c,"EncryptionMethod");a&&(c=Ij(c,a));return 0<c.b.length})}var Gj=new Ej(function(){return!0});function tj(a){this.b=a}function Ij(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.hc(e)&&c.push(e)}return new tj(c)}
function Jj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new tj(d)}tj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Kj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function sj(a,b){return Jj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Mj(a){return Jj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Nj(a,b){return Kj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}tj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Oj={transform:!0,"transform-origin":!0},Pj={top:!0,bottom:!0,left:!0,right:!0};function Qj(a,b,c){this.target=a;this.name=b;this.value=c}var Rj={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Sj(a,b){var c=Rj[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Tj(a,b){this.h={};this.K=a;this.g=b;this.O=null;this.w=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ua(c,{type:"hyperlink",target:null,currentTarget:null,Of:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.A=this.G=!1;this.C=this.F=!0;this.P=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
t(Tj,Ta);function Uj(a,b){(a.F=b)?a.K.setAttribute("data-vivliostyle-auto-page-width",!0):a.K.removeAttribute("data-vivliostyle-auto-page-width")}function Vj(a,b){(a.C=b)?a.K.setAttribute("data-vivliostyle-auto-page-height",!0):a.K.removeAttribute("data-vivliostyle-auto-page-height")}function Wj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Xj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.K.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.w,e=0;e<d.length;e++){var f=d[e];v(f.target,f.name,f.value.toString())}e=Yj(c,a.K);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.Hc],d=a.b[c.kf],f&&d&&(f=Sj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Tj.prototype.zoom=function(a){v(this.K,"transform","scale("+a+")")};function Zj(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function ak(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function bk(a){this.f=a;this.b=[];this.L=null}
function ck(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Va=d;this.l=e;this.h=f;this.nf=g;this.j=h;this.hb=-1;this.g=l}function dk(a,b){return a.h?!b.h||a.Va>b.Va?!0:a.j:!1}function ek(a,b){return a.top-b.top}function fk(a,b){return b.right-a.right}
function gk(a,b){if(a===b)return!0;if(!a||!b||a.ia!==b.ia||a.M!==b.M||a.na.length!==b.na.length)return!1;for(var c=0;c<a.na.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.Wa===e.Wa&&d.qa===e.qa&&d.Aa===e.Aa&&d.va===e.va))return!1}return!0}function hk(a){return{na:[{node:a.S,Wa:ik,qa:a.qa,Aa:null,va:null}],ia:0,M:!1,La:a.La}}function jk(a,b){var c=new kk(a.node,b,0);c.Wa=a.Wa;c.qa=a.qa;c.Aa=a.Aa;c.va=a.va?jk(a.va,lk(b)):null;c.L=a.L;return c}var ik=0;
function mk(a,b,c,d,e,f,g){this.ka=a;this.Md=d;this.pe=null;this.root=b;this.ea=c;this.type=f;e&&(e.pe=this);this.b=g}function nk(a,b){this.lf=a;this.count=b}
function kk(a,b,c){this.S=a;this.parent=b;this.pa=c;this.ia=0;this.M=!1;this.Wa=ik;this.qa=b?b.qa:null;this.va=this.Aa=null;this.fa=!1;this.Da=!0;this.b=!1;this.l=b?b.l:0;this.display=null;this.H=ok;this.V=this.A=this.j=null;this.O="baseline";this.X="top";this.sd=this.Z=0;this.G=!1;this.Tb=b?b.Tb:0;this.h=b?b.h:null;this.w=b?b.w:!1;this.J=this.zc=!1;this.C=this.D=this.F=this.g=null;this.qb=b?b.qb:{};this.u=b?b.u:!1;this.ja=b?b.ja:"ltr";this.f=b?b.f:null;this.La=this.lang=null;this.L=b?b.L:null}
function pk(a){a.Da=!0;a.l=a.parent?a.parent.l:0;a.D=null;a.C=null;a.ia=0;a.M=!1;a.display=null;a.H=ok;a.j=null;a.A=null;a.V=null;a.O="baseline";a.G=!1;a.Tb=a.parent?a.parent.Tb:0;a.h=a.parent?a.parent.h:null;a.w=a.parent?a.parent.w:!1;a.g=null;a.F=null;a.Aa=null;a.zc=!1;a.J=!1;a.u=a.parent?a.parent.u:!1;a.Aa=null;a.La=null;a.L=a.parent?a.parent.L:null}
function qk(a){var b=new kk(a.S,a.parent,a.pa);b.ia=a.ia;b.M=a.M;b.Aa=a.Aa;b.Wa=a.Wa;b.qa=a.qa;b.va=a.va;b.Da=a.Da;b.l=a.l;b.display=a.display;b.H=a.H;b.j=a.j;b.A=a.A;b.V=a.V;b.O=a.O;b.X=a.X;b.Z=a.Z;b.sd=a.sd;b.zc=a.zc;b.J=a.J;b.G=a.G;b.Tb=a.Tb;b.h=a.h;b.w=a.w;b.g=a.g;b.F=a.F;b.D=a.D;b.C=a.C;b.f=a.f;b.u=a.u;b.b=a.b;b.La=a.La;b.L=a.L;return b}kk.prototype.modify=function(){return this.fa?qk(this):this};function lk(a){var b=a;do{if(b.fa)break;b.fa=!0;b=b.parent}while(b);return a}
kk.prototype.clone=function(){for(var a=qk(this),b=a,c;c=b.parent;)c=qk(c),b=b.parent=c;return a};function rk(a){return{node:a.S,Wa:a.Wa,qa:a.qa,Aa:a.Aa,va:a.va?rk(a.va):null,L:a.L}}function sk(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(rk(b)),b=b.parent;while(b);b=a.La?tk(a.La,a.ia,-1):a.ia;return{na:c,ia:b,M:a.M,La:a.La}}function uk(a){for(a=a.parent;a;){if(a.zc)return!0;a=a.parent}return!1}function vk(a,b){for(var c=a;c;)c.Da||b(c),c=c.parent}
function wk(a){this.Ba=a;this.b=this.f=null}wk.prototype.clone=function(){var a=new wk(this.Ba);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function xk(a,b){if(!b)return!1;if(a===b)return!0;if(!gk(a.Ba,b.Ba))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!gk(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!gk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function yk(a,b){this.f=a;this.b=b}yk.prototype.clone=function(){return new yk(this.f.clone(),this.b)};function zk(){this.b=[];this.g="any";this.f=null}
zk.prototype.clone=function(){for(var a=new zk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function Ak(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!xk(d.f,e.f))return!1}return!0}function Bk(){this.page=0;this.f={};this.b={};this.g=0}
Bk.prototype.clone=function(){var a=new Bk;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function Ck(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!Ak(a.b[e],b.b[e]))return!1}return!0}
function Dk(a){this.element=a;this.cb=this.bb=this.height=this.width=this.G=this.A=this.H=this.w=this.Z=this.borderTop=this.fa=this.borderLeft=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.xa=this.Ib=null;this.ja=this.wb=this.Xa=this.xb=this.la=0;this.u=!1}function Ek(a){return a.marginTop+a.borderTop+a.A}function Fk(a){return a.marginBottom+a.Z+a.G}function Gk(a){return a.marginLeft+a.borderLeft+a.w}function Hk(a){return a.marginRight+a.fa+a.H}
function Ik(a){return a.u?-1:1}function Jk(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.borderLeft=b.borderLeft;a.fa=b.fa;a.borderTop=b.borderTop;a.Z=b.Z;a.w=b.w;a.H=b.H;a.A=b.A;a.G=b.G;a.width=b.width;a.height=b.height;a.bb=b.bb;a.cb=b.cb;a.xa=b.xa;a.Ib=b.Ib;a.la=b.la;a.xb=b.xb;a.Xa=b.Xa;a.u=b.u}
function Kk(a,b,c){a.top=b;a.height=c;v(a.element,"top",b+"px");v(a.element,"height",c+"px")}function Lk(a,b,c){a.left=b;a.width=c;v(a.element,"left",b+"px");v(a.element,"width",c+"px")}function Mk(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Nk(a){var b=a.bb+a.left+a.marginLeft+a.borderLeft,c=a.cb+a.top+a.marginTop+a.borderTop;return new Sf(b,c,b+(a.w+a.width+a.H),c+(a.A+a.height+a.G))}Dk.prototype.zd=function(a,b){var c=Ok(this);return ug(a,c.U,c.R,c.T-c.U,c.N-c.R,b)};
function Ok(a){var b=a.bb+a.left,c=a.cb+a.top;return new Sf(b,c,b+(Gk(a)+a.width+Hk(a)),c+(Ek(a)+a.height+Fk(a)))}function Pk(a,b,c){this.b=a;this.f=b;this.g=c}t(Pk,pc);Pk.prototype.Pc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.mc));return null};Pk.prototype.sc=function(a){if(this.g.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Pk.prototype.ub=function(a){this.Sb(a.values);return null};Pk.prototype.nc=function(a){a=a.ra().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Qk(a){return!!a&&a!==kd&&a!==F&&a!==bd};function Rk(a,b,c){this.g=a;this.f=b;this.b=c}function Sk(){this.map=[]}function Tk(a){return a.map.length?a.map[a.map.length-1].b:0}function Uk(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Rk(b,b,d))}else a.map.push(new Rk(b,b,b))}function Vk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Rk(b,0,0))}function Wk(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Xk(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Yk(a,b,c,d,e,f,g,h){this.C=a;this.style=b;this.offset=c;this.F=d;this.j=e;this.b=e.b;this.Pa=f;this.Ya=g;this.G=h;this.l=this.w=null;this.A={};this.g=this.f=this.h=null;Zk(this)&&(b=b._pseudos)&&b.before&&(a=new Yk(a,b.before,c,!1,e,$k(this),g,!0),c=al(a,"content"),Qk(c)&&(this.h=a,this.g=a.g));this.g=bl(cl(this,"before"),this.g);this.Ya&&dl[this.g]&&(e.g=bl(e.g,this.g))}
function al(a,b,c){if(!(b in a.A)){var d=a.style[b];a.A[b]=d?d.evaluate(a.C,b):c||null}return a.A[b]}function el(a){return al(a,"display",cd)}function $k(a){if(null===a.w){var b=el(a),c=al(a,"position"),d=al(a,"float");a.w=fl(b,c,d,a.F).display===Mc}return a.w}function Zk(a){null===a.l&&(a.l=a.G&&el(a)!==F);return a.l}function cl(a,b){var c=null;if($k(a)){var d=al(a,"break-"+b);d&&(c=d.toString())}return c}function gl(a){this.g=a;this.b=[];this.Ya=this.Pa=!0;this.f=[]}
function hl(a){return a.b[a.b.length-1]}function il(a){return a.b.every(function(a){return el(a)!==F})}gl.prototype.push=function(a,b,c,d){var e=hl(this);d&&e&&d.b!==e.b&&this.f.push({Pa:this.Pa,Ya:this.Ya});e=d||e.j;d=this.Ya||!!d;var f=il(this);a=new Yk(this.g,a,b,c,e,d||this.Pa,d,f);this.b.push(a);this.Pa=Zk(a)?!a.h&&$k(a):this.Pa;this.Ya=Zk(a)?!a.h&&d:this.Ya;return a};
gl.prototype.pop=function(a){var b=this.b.pop(),c=this.Pa,d=this.Ya;if(Zk(b)){var e=b.style._pseudos;e&&e.after&&(a=new Yk(b.C,e.after,a,!1,b.j,c,d,!0),c=al(a,"content"),Qk(c)&&(b.f=a))}this.Ya&&b.f&&(a=cl(b.f,"before"),b.j.g=bl(b.j.g,a));if(a=hl(this))a.b===b.b?Zk(b)&&(this.Pa=this.Ya=!1):(a=this.f.pop(),this.Pa=a.Pa,this.Ya=a.Ya);return b};
function jl(a,b){if(!b.Pa)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Pa||d.F)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function kl(a,b,c,d,e,f,g,h){this.ea=a;this.root=a.root;this.Ma=c;this.h=d;this.w=f;this.f=this.root;this.O={};this.V={};this.C={};this.G=[];this.A=this.J=this.H=null;this.X=new Oi(b,d,g,h);this.g=new Sk;this.Ba=!0;this.fa=[];this.xa=e;this.ta=this.ja=!1;this.b=a=uj(a,this.root);this.Z={};this.j=new gl(d);Uk(this.g,a);d=ll(this,this.root);Xi(this.X,this.root,d);ml(this,d,!1);this.F=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.F=
!1}this.fa.push(!0);this.V={};this.V["e"+a]=d;this.b++;nl(this,-1)}function ol(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function pl(a,b,c){for(var d in c){var e=b[d];e?(a.O[d]=e,delete b[d]):(e=c[d])&&(a.O[d]=new V(e,33554432))}}var ql=["column-count","column-width"];
function ml(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.O[a]=b[a])},a);if(!a.ja){var d=ol(a,b,a.w.j,"background-color")?b["background-color"].evaluate(a.h):null,e=ol(a,b,a.w.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==bd||e&&e!==bd)pl(a,b,a.w.j),a.ja=!0}if(!a.ta)for(d=0;d<ql.length;d++)if(ol(a,b,a.w.w,ql[d])){pl(a,b,a.w.w);a.ta=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.I;switch(d.ga){case "em":case "rem":c*=a.h.w;break;case "ex":case "rex":c*=
a.h.w*yb.ex/yb.em;break;case "%":c*=a.h.w/100;break;default:(d=yb[d.ga])&&(c*=d)}a.h.ta=c}}function rl(a){for(var b=0;!a.F&&(b+=5E3,sl(a,b,0)!=Number.POSITIVE_INFINITY););return a.O}function ll(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ea.url,e=new jj(a.Ma,a.w),c=new Ue(c,e);try{Jf(new Af(pf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.Ua}}return{}}
function nl(a,b){if(!(b>=a.b)){var c=a.h,d=uj(a.ea,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=tl(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=xj(a.ea,b);e=vj(a.ea,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=uj(a.ea,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),tl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function ul(a,b){a.H=b;for(var c=0;c<a.G.length;c++)vl(a.H,a.G[c],a.C[a.G[c].b])}
function tl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var n;a:{if(h=m.evaluate(a.h,"flow-options")){l=new qg;try{h.ba(l);n=l.b;break a}catch(r){u.b(r,"toSet:")}}n={}}h=!!n.exclusive;l=!!n["static"];k=!!n.last}(n=c["flow-linger"])&&(g=sg(n.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=sg(c.evaluate(a.h,"flow-priority"),0));c=a.Z[e]||null;n=a.C[b];n||(n=hl(a.j),n=a.C[b]=new bk(n?n.j.b:null));d=new ck(b,d,e,f,g,h,l,k,c);
a.G.push(d);a.J==b&&(a.J=null);a.H&&vl(a.H,d,n);return d}function wl(a,b,c,d){dl[b]&&(d=a.C[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.Z[c]=bl(a.Z[c],b)}
function sl(a,b,c){var d=-1;if(b<=a.b&&(d=Wk(a.g,b),d+=c,d<Tk(a.g)))return Xk(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.X,g=a.f;if(f.xb.pop()!==g)throw Error("Invalid call to popElement");f.Cb.pop();f.ja.pop();f.Ab.pop();f.Bb.pop();f.pop();Vi(f);a.Ba=a.fa.pop();g=a.j.pop(a.b);f=null;g.f&&(f=cl(g.f,"before"),wl(a,f,g.f.Pa?jl(a.j,g):g.f.offset,g.b),f=cl(g.f,"after"));f=bl(f,cl(g,"after"));wl(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Wk(a.g,b),d+=c),d<=Tk(a.g))?Xk(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=hl(f);(f.Pa||f.Ya)&&Zk(h)&&(h=al(h,"white-space",kd).toString(),ak(g,Zj(h))||(f.Pa=!1,f.Ya=!1));a.Ba?Uk(a.g,a.b):Vk(a.g,a.b)}else{g=a.f;f=ll(a,g);a.fa.push(a.Ba);Xi(a.X,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.A&&(a.A=null);a.F||"body"!=g.localName||
g.parentNode!=a.root||(ml(a,f,!0),a.F=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=tl(a,h,f,g,a.b);a.Ba=!!a.xa[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=jl(a.j,g);wl(a,g.g,h,g.b);g.h&&(l=cl(g.h,"after"),wl(a,l,g.h.Pa?h:g.offset,g.b));a.Ba&&el(g)===F&&(a.Ba=!1);if(uj(a.ea,a.f)!=a.b)throw Error("Inconsistent offset");a.V["e"+a.b]=f;a.b++;a.Ba?Uk(a.g,a.b):Vk(a.g,a.b);if(b<a.b&&(0>d&&(d=Wk(a.g,b),d+=c),d<=Tk(a.g)))return Xk(a.g,d)}}}
kl.prototype.l=function(a,b){var c=uj(this.ea,a),d="e"+c;b&&(c=vj(this.ea,a,0,!0));this.b<=c&&sl(this,c,0);return this.V[d]};var xl={"font-style":kd,"font-variant":kd,"font-weight":kd},yl="OTTO"+(new Date).valueOf(),zl=1;function Al(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in xl)c[e]||(c[e]=xl[e]);return c}function Bl(a){a=this.Zb=a;var b=new Da,c;for(c in xl)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Zb.src?this.Zb.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Zb["font-family"])?c.stringValue():null}
function Cl(a,b,c){var d=new Da;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in xl)d.append(e),d.append(": "),a.Zb[e].Na(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function Dl(a){this.f=a;this.b={}}
function El(a,b){if(b instanceof sc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new sc(d)}return(c=a.b[b.stringValue()])?new sc([C(c),b]):b}function Fl(a,b){this.b=a;this.body=b;this.f={};this.g=0}function Gl(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function Hl(a,b,c,d){var e=I("initFont"),f=b.src,g={},h;for(h in xl)g[h]=b.Zb[h];d=Gl(a,b,d);g["font-family"]=C(d);var l=new Bl(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=yl+zl++;b.textContent=Cl(l,"",Ze([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var n in xl)v(k,n,g[n].toString());var g=k.getBoundingClientRect(),r=g.right-g.left,q=g.bottom-g.top;
b.textContent=Cl(l,f,c);u.g("Starting to load font:",f);var z=!1;he(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return r!=a.right-a.left||q!=b?(z=!0,L(!1)):(new Date).valueOf()>m?L(!1):ge(10)}).then(function(){z?u.g("Loaded font:",f):u.b("Failed to load font:",f);a.body.removeChild(k);O(e,l)});return M(e)}
function Il(a,b,c){var d=b.src,e=a.f[d];e?le(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new ke(function(){var e=I("loadFont"),g=c.f?c.f(d):null;g?Ye(d,"blob").then(function(d){d.dd?g(d.dd).then(function(d){Hl(a,b,d,c).Fa(e)}):O(e,null)}):Hl(a,b,null,c).Fa(e);return M(e)},"loadFont "+d),a.f[d]=e,e.start());return e}
function Jl(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(Il(a,f,c)):u.b("E_FONT_FACE_INVALID")}return me(d)};Kd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Kc?nd:c,important:a.important};default:return a}});var dl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Kl={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function bl(a,b){if(a)if(b){var c=!!dl[a],d=!!dl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Kl[b]?b:Kl[a]?a:b}else return a;else return b}function Ll(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Ml(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function Nl(a){var b=Ol,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.ca:b.da)+"(-?)"),b:"$1"+(a?b.da:b.ca)+"$2"}})})});return c}
var Ol={"horizontal-tb":{ltr:[{ca:"inline-start",da:"left"},{ca:"inline-end",da:"right"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}],rtl:[{ca:"inline-start",da:"right"},{ca:"inline-end",da:"left"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}]},"vertical-rl":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"right"},{ca:"block-end",
da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",da:"top"},{ca:"block-start",da:"right"},{ca:"block-end",da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]},"vertical-lr":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",
da:"top"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]}},Pl=Nl(!0),Ql=Nl(!1);var ok="inline";function Rl(a){switch(a){case "inline":return ok;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function Sl(a){switch(a){case ok:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function Tl(a,b,c){this.S=a;this.b=b;this.f=c;this.id=this.order=null}
function Ul(a){if(null===a.order)throw Error("The page float is not yet added");return a.order}function Vl(a){if(!a.id)throw Error("The page float is not yet added");return a.id}function Wl(){this.b=[];this.f=0}Wl.prototype.je=function(){return this.f++};Wl.prototype.Yd=function(a){if(0<=this.b.findIndex(function(b){return b.S===a.S}))throw Error("A page float with the same source node is already registered");var b=a.order=this.je();a.id="pf"+b;this.b.push(a)};
Wl.prototype.de=function(a){var b=this.b.findIndex(function(b){return b.S===a});return 0<=b?this.b[b]:null};function Xl(a,b){var c=a.b.findIndex(function(a){return a.id===b});return 0<=c?a.b[c]:null}function Yl(a,b,c){this.b=Vl(a);this.f=b;this.Ub=c}Yl.prototype.zd=function(){return this.Ub.zd(null,null)};function Zl(a,b,c){this.gb=a;this.b=b;this.f=c}
function $l(a,b,c,d,e,f,g){(this.parent=a)&&a.j.push(this);this.j=[];this.f=b;this.K=c;this.h=d;this.J=e;this.G=f||a&&a.G||ad;this.F=g||a&&a.F||jd;this.Cc=!1;this.A=a?a.A:new Wl;this.C=[];this.b=[];this.l=[];this.w={};this.g=[];a:{b=this;for(a=this.parent;a;){if(b=am(a,b,this.f,this.h,this.J)){a=b;break a}b=a;a=a.parent}a=null}this.H=a?[].concat(a.g):[]}function bm(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function am(a,b,c,d,e){b=a.j.indexOf(b);0>b&&(b=a.j.length);for(--b;0<=b;b--){var f=a.j[b];if(f.f===c&&f.h===d&&f.J===e||(f=am(f,null,c,d,e)))return f}return null}function cm(a,b){return b&&b!==a.f?cm(bm(a,b),b):a.K}function dm(a,b){a.K=b;em(a)}$l.prototype.Yd=function(a){this.A.Yd(a)};function fm(a,b){return b===a.f?a:fm(bm(a,b),b)}$l.prototype.de=function(a){return this.A.de(a)};function gm(a,b){var c=Vl(b),d=b.b;d===a.f?0>a.C.indexOf(c)&&a.C.push(c):gm(bm(a,d),b)}
function hm(a,b){var c=Vl(b),d=b.b;return d===a.f?0<=a.C.indexOf(c):hm(bm(a,d),b)}function im(a,b){return Xl(a.A,b.b)}function jm(a,b,c){var d=im(a,b).b;d!==a.f?jm(bm(a,d),b,c):0>a.b.indexOf(b)&&(a.b.push(b),a.b.sort(function(a,b){var c=im(this,a),d=im(this,b);return Ul(c)-Ul(d)}.bind(a)));c||km(a)}function lm(a,b,c){var d=im(a,b).b;d!==a.f?lm(bm(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.Ub&&b.Ub.element)&&b.parentNode&&b.parentNode.removeChild(b),c||km(a)))}
function mm(a,b){if(b.b!==a.f)return mm(bm(a,b.b),b);var c=Vl(b),d=a.b.findIndex(function(a){return a.b===c});return 0<=d?a.b[d]:null}function nm(a){return 0<a.b.length?!0:a.parent?nm(a.parent):!1}function om(a,b,c){b.b===a.f?a.w[Vl(b)]=c:om(bm(a,b.b),b,c)}function pm(a,b){if(qm(a).some(function(a){return Vl(a.gb)===b}))return!0;var c=a.w[b];return c?a.K&&a.K.element?a.K.element.contains(c):!1:!1}
function rm(a,b,c,d){d=d||a.h;b.b===a.f?(c=new Zl(b,c,d),d=a.g.findIndex(function(a){return a.gb===b}),0<=d?a.g.splice(d,1,c):a.g.push(c)):rm(bm(a,b.b),b,c,d)}function sm(a){return 0<a.g.length?!0:a.parent?sm(a.parent):!1}function tm(a,b){var c=Ul(b);return a.g.some(function(a){return Ul(a.gb)<c})?!0:a.parent?tm(a.parent,b):!1}function qm(a,b){b=b||a.h;var c=a.H.filter(function(a){return!b||a.f===b});a.parent&&(c=qm(a.parent,b).concat(c));return c.sort(function(a,b){return Ul(a.gb)-Ul(b.gb)})}
function um(a,b){b=b||a.h;var c=a.g.filter(function(a){return!b||a.f===b});return a.parent?um(a.parent,b).concat(c):c}function vm(a){for(var b=a.b.length-1;0<=b;b--){var c=a.b[b];if(!pm(a,c.b)){lm(a,c);b=im(a,c);gm(a,b);wm(a,b);return}}for(b=a.g.length-1;0<=b;b--)pm(a,Vl(a.g[b].gb))||a.g.splice(b,1);a.H.forEach(function(a){if(!(0<=this.g.findIndex(function(b){return b?a===b?!0:a.gb===b.gb&&gk(a.b,b.b):!1}))){var b=Vl(a.gb);this.b.some(function(a){return a.b===b})||this.g.push(a)}},a)}
function km(a){a.K&&(a.j.forEach(function(a){a.K&&a.K.element===this.K.element&&a.b.forEach(function(a){(a=a.Ub.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),Mk(a.K));a.j.splice(0);Object.keys(a.w).forEach(function(a){delete this.w[a]},a);a.Cc=!0}function xm(a){return a.Cc||!!a.parent&&xm(a.parent)}function ym(a,b){return Ml(b,a.G.toString(),a.F.toString()||null,Ql)}
function wm(a,b){var c=ym(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];ym(a,im(a,e).f)===c?lm(a,e):d++}}function zm(a,b){if(b.b!==a.f)zm(bm(a,b.b),b);else{var c=ym(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];ym(a,im(a,e).f)===c?(a.l.push(e),a.b.splice(d,1)):d++}}}function Am(a,b){b!==a.f?Am(bm(a,b),b):(a.l.forEach(function(a){jm(this,a,!0)},a),a.l.splice(0))}function Bm(a,b){b!==a.f?Bm(bm(a,b),b):a.l.splice(0)}
function Cm(a,b){return b===a.f?a.l.concat().sort(function(a,b){var c=im(this,a);return Ul(im(this,b))-Ul(c)}.bind(a)):Cm(bm(a,b),b)}function Dm(a,b){var c=ym(a,b),d=Ml(b,a.G.toString(),a.F.toString()||null,Pl),c=Em(a,c);if(a.parent&&a.parent.K){var e=Dm(a.parent,d);switch(d){case "top":return Math.max(c,e);case "left":return Math.max(c,e);case "bottom":return Math.min(c,e);case "right":return Math.min(c,e);default:fa("Should be unreachable")}}return c}
function Em(a,b){var c=a.K.bb,d=a.K.cb,e=Nk(a.K),e={top:e.R-d,left:e.U-c,bottom:e.N-d,right:e.T-c},f=a.b;0<f.length&&(e=f.reduce(function(b,c){var d=im(a,c),d=ym(this,d.f),e=c.Ub,f=b.top,g=b.left,h=b.bottom,q=b.right;switch(d){case "inline-start":e.u?f=Math.max(f,e.top+e.height):g=Math.max(g,e.left+e.width);break;case "block-start":e.u?q=Math.min(q,e.left):f=Math.max(f,e.top+e.height);break;case "inline-end":e.u?h=Math.min(h,e.top):q=Math.min(q,e.left);break;case "block-end":e.u?g=Math.max(g,e.left+
e.width):h=Math.min(h,e.top);break;default:throw Error("Unknown logical float side: "+d);}return{top:f,left:g,bottom:h,right:q}}.bind(a),e));e.left+=c;e.right+=c;e.top+=d;e.bottom+=d;switch(b){case "block-start":return a.K.u?e.right:e.top;case "block-end":return a.K.u?e.left:e.bottom;case "inline-start":return a.K.u?e.top:e.left;case "inline-end":return a.K.u?e.bottom:e.right;default:throw Error("Unknown logical side: "+b);}}
function Fm(a,b,c,d,e){if(c.b!==a.f)return Fm(bm(a,c.b),b,c,d,e);var f=ym(a,c.f),g=Dm(a,"block-start"),h=Dm(a,"block-end"),l=Dm(a,"inline-start");a=Dm(a,"inline-end");var k=b.u?b.bb:b.cb,m=b.u?b.cb:b.bb,g=b.u?Math.min(g,b.left+b.width+k):Math.max(g,b.top+k),h=b.u?Math.max(h,b.left+k):Math.min(h,b.top+b.height+k),n;if(d){d=b.u?ig(new Sf(h,l,g,a)):new Sf(l,g,a,h);switch(f){case "block-start":case "inline-start":if(d=og(b.J,d))b.u&&(d=jg(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.R),h=b.u?Math.max(h,d.U):
Math.min(h,d.N);else if(!e)return!1;break;case "block-end":case "inline-end":if(d=pg(b.J,d))b.u&&(d=jg(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.R),h=b.u?Math.max(h,d.U):Math.min(h,d.N);else if(!e)return!1}d=(h-g)*Ik(b);n=a-l;if(!e&&(0>=d||0>=n))return!1}else{d=b.la;var r=(h-g)*Ik(b);if(!e&&r<d)return!1;var q=b.xe;d=Math.min(d+(b.u?q.left:q.bottom),r);"inline-start"===f||"inline-end"===f?n=Gm(b.b,b.element,[Hm])[Hm]:n=Yj(b.b,b.Ce)[b.u?"height":"width"]+(b.u?q.top:q.left)+(b.u?q.bottom:q.right);if(!e&&
a-l<n)return!1}g-=k;h-=k;l-=m;a-=m;switch(f){case "inline-start":case "block-start":h=l;c=n;b.u?Kk(b,h,c):Lk(b,h,c);h=d;b.u?Lk(b,g+h*Ik(b),h):Kk(b,g,h);break;case "inline-end":case "block-end":g=a-n;c=n;b.u?Kk(b,g,c):Lk(b,g,c);g=h-d*Ik(b);h=d;b.u?Lk(b,g+h*Ik(b),h):Kk(b,g,h);break;default:throw Error("unknown float direction: "+c.f);}return!0}function Im(a){var b=a.b.map(function(a){return a.zd()});return a.parent?Im(a.parent).concat(b):b}
function em(a){var b=a.K.element&&a.K.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.Ub.element)})}function Jm(a){var b=cm(a).u;return a.b.reduce(function(a,d){var c=Ok(d.Ub);return b?Math.min(a,c.U):Math.max(a,c.N)},b?Infinity:0)};var Km={img:!0,svg:!0,audio:!0,video:!0};
function Lm(a,b,c,d){var e=a.D;if(!e)return NaN;if(1==e.nodeType){if(a.M){var f=Yj(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.M&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=Mm(b,g);if(c=d){c=document.body;if(null==Va){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";v(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Va=10>h.right-h.left;c.removeChild(g)}c=Va}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=Mm(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(u.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}function Nm(a){for(var b=Ld("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.se());}
function Om(){}function Pm(a){if(!a)return null;for(a=a.L;a;){var b=a.ec();if(b)return b;a=a.te()}return null}function Qm(a,b){this.h=a;this.w=b;this.j=!1;this.l=null}t(Qm,Om);Qm.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=Rm(a,this,0<b),this.j=!0);return this.l};Qm.prototype.b=function(){return this.w};Qm.prototype.g=function(){return Pm(this.h[0])};function Sm(a,b,c,d){this.position=a;this.A=b;this.w=c;this.la=d;this.h=!1;this.l=0}t(Sm,Om);
Sm.prototype.f=function(a,b){this.h||(this.l=Lm(this.position,a.b,0,a.u),this.h=!0);var c=this.l,d=this.g();d&&(c+=(a.u?-1:1)*Tm(d));this.w=this.position.b=Um(a,c);b<this.b()?c=null:(a.la=this.la,c=this.position);return c};Sm.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(Kl[this.A]?1:0)+(this.w?3:0)+(this.position.parent?this.position.parent.l:0)};Sm.prototype.g=function(){return Pm(this.position)};
function Vm(a,b,c){this.pa=a;this.f=b;this.b=c}function Wm(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.pa>=d.pa?u.b("validateCheckPoints: incorrect boxOffset"):c.S==d.S&&(d.M?c.M&&u.b("validateCheckPoints: duplicate after points"):c.M?u.b("validateCheckPoints: inconsistent after point"):d.pa-c.pa!=d.ia-c.ia&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function Xm(a){this.parent=a}Xm.prototype.se=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};
Xm.prototype.Ie=function(a,b){return b};Xm.prototype.te=function(){return this.parent};Xm.prototype.ec=function(){return null};function Ym(a,b,c,d,e){Dk.call(this,a);this.bf=a.lastChild;this.h=b;this.b=c;this.Sa=d;this.cf=a.ownerDocument;this.f=e;dm(e,this);this.Vd=null;this.we=this.ye=!1;this.F=this.lb=this.ya=this.X=this.V=0;this.J=this.Ud=this.O=this.ta=null;this.Zd=!1;this.j=this.g=this.C=null;this.Bb=!0;this.Ab=this.tc=this.Cb=0;this.l=!0;this.Ma=null}t(Ym,Dk);
function Zm(a,b){return!!b.j&&(!a.ye||!!b.parent)}function Um(a,b){return a.u?b<a.F:b>a.F}function $m(a){var b=Im(a.f);return a.Ib.concat(b)}Ym.prototype.vb=function(a){var b=this,c=I("openAllViews"),d=a.na;an(b.h,b.element,b.we);var e=d.length-1,f=null;he(function(){for(;0<=e;){f=jk(d[e],f);e!==d.length-1||f.L||(f.L=b.Vd);if(!e){var c=f,h;h=a;h=h.La?tk(h.La,h.ia,1):h.ia;c.ia=h;f.M=a.M;f.La=a.La;if(f.M)break}c=bn(b.h,f,!e&&!f.ia);e--;if(c.za())return c}return L(!1)}).then(function(){O(c,f)});return M(c)};
var cn=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;function dn(a,b){if(b.f&&b.Da&&!b.M&&!b.f.count&&1!=b.D.nodeType){var c=b.D.textContent.match(cn);return en(a.h,b,c[0].length)}return L(b)}
function fn(a,b,c){var d=I("buildViewToNextBlockEdge");ie(function(d){b.D&&!gn(b)&&c.push(lk(b));dn(a,b).then(function(e){e!==b&&(b=e,gn(b)||c.push(lk(b)));hn(a.h,b).then(function(c){if(b=c){if(!jn(a.Sa,b)&&(b=b.modify(),b.b=!0,a.l)){Q(d);return}Zm(a,b)&&!a.u?kn(a,b).then(function(a){(b=a)?P(d):Q(d)}):b.Da?P(d):Q(d)}else Q(d)})})}).then(function(){O(d,b)});return M(d)}
function ln(a,b){if(!b.D)return L(b);var c=b.S,d=I("buildDeepElementView");ie(function(d){dn(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.S!=c;)f=f.parent;if(!f){b=e;Q(d);return}}hn(a.h,e).then(function(e){(b=e)&&b.S!=c?jn(a.Sa,b)?P(d):(b=b.modify(),b.b=!0,a.l?Q(d):P(d)):Q(d)})})}).then(function(){O(d,b)});return M(d)}
function mn(a,b,c,d,e){var f=a.cf.createElement("div");a.u?(e>=a.height&&(e-=.1),v(f,"height",d+"px"),v(f,"width",e+"px")):(d>=a.width&&(d-=.1),v(f,"width",d+"px"),v(f,"height",e+"px"));v(f,"float",c);v(f,"clear",c);a.element.insertBefore(f,b);return f}function nn(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function on(a){for(var b=a.element.firstChild,c=a.J,d=a.u?a.u?a.V:a.ya:a.u?a.lb:a.V,e=a.u?a.u?a.X:a.lb:a.u?a.ya:a.X,f=0;f<c.length;f++){var g=c[f],h=g.N-g.R;g.left=mn(a,b,"left",g.U-d,h);g.right=mn(a,b,"right",e-g.T,h)}}function pn(a,b,c,d,e){var f;if(b&&b.M&&!b.Da&&(f=Lm(b,a.b,0,a.u),!isNaN(f)))return f;b=c[d];for(e-=b.pa;;){f=Lm(b,a.b,e,a.u);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.ya;b=c[d];1!=b.D.nodeType&&(e=b.D.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function qn(a,b){var c=rn(a.b,b),d=new Uf;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function sn(a,b){var c=rn(a.b,b),d=new Uf;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function tn(a,b,c){if(a=rn(a.b,b))c.marginLeft=X(a.marginLeft),c.borderLeft=X(a.borderLeftWidth),c.w=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.borderTop=X(a.borderTopWidth),c.A=X(a.paddingTop),c.marginRight=X(a.marginRight),c.fa=X(a.borderRightWidth),c.H=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.Z=X(a.borderBottomWidth),c.G=X(a.paddingBottom)}function un(a,b,c){b=new Vm(b,c,c);a.g?a.g.push(b):a.g=[b]}
function vn(a,b,c,d){if(a.g&&a.g[a.g.length-1].b)return un(a,b,c),L(!0);var e=new Sf(a.V,a.ya,a.X,a.lb),f=og(a.J,e);f&&(d=Math.max(d,f.R*Ik(a)));d+=40*Ik(a);var g=a.O,h=!g;if(h){f=a.element.ownerDocument.createElement("div");v(f,"position","absolute");var l=a.h.clone(),k=new $l(a.f,"column",null,a.f.h,c.na[0].node,null,null),g=new Ym(f,l,a.b,a.Sa,k);g.Bb=!1;dm(k,g);a.O=g;g.u=wn(a.h,a.u,f);g.we=!0;a.u?(g.left=0,v(g.element,"width","2em")):(g.top=a.lb,v(g.element,"height","2em"))}a.element.appendChild(g.element);
tn(a,g.element,g);f=Ik(a)*(d-a.ya);a.u?g.height=a.ta.N-a.ta.R-Ek(g)-Fk(g):g.width=a.ta.T-a.ta.U-Gk(g)-Hk(g);var m=(e=pg(a.J,e))?e.N:a.lb;d=Ik(a)*(m-d)-(a.u?Gk(g)-Hk(g):Ek(g)+Fk(g));if(h&&18>d)return a.element.removeChild(g.element),a.O=null,un(a,b,c),L(!0);if(!a.u&&g.top<f)return a.element.removeChild(g.element),un(a,b,c),L(!0);var n=I("layoutFootnoteInner");a.u?Lk(g,0,d):Kk(g,f,d);g.bb=a.bb+a.left+Gk(a);g.cb=a.cb+a.top+Ek(a);g.Ib=a.Ib;var r=new wk(c);h?(xn(g),d=L(!0)):$m(g).length?d=yn(g):(zn(g),
d=L(!0));d.then(function(){An(g,r).then(function(d){if(h&&d)a.element.removeChild(g.element),un(a,b,c),a.O=null,O(n,!0);else{g.la+=.01;a.u?(a.F=m+(g.la+Gk(g)+Hk(g)),Lk(g,0,g.la)):(a.F=m-(g.la+Ek(g)+Fk(g)),Kk(g,a.F-a.ya,g.la));var e;!a.u&&0<$m(g).length?e=yn(g):e=L(d);e.then(function(d){d=new Vm(b,c,d?d.Ba:null);a.g?a.g.push(d):a.g=[d];O(n,!0)})}})});return M(n)}
function Bn(a,b){var c=I("layoutFootnote"),d=b.D;d.setAttribute("style","");v(d,"display","inline-block");d.textContent="M";var e=Yj(a.b,d),f=a.u?e.left:e.bottom;d.textContent="";Cn(a.h,b,"footnote-call",d);d.textContent||(d.parentNode.removeChild(d),b.D=null);d=hk(b);e=b.pa;b=b.modify();b.M=!0;vn(a,e,d,f).then(function(){a.O&&a.O.element.parentNode&&a.element.removeChild(a.O.element);Um(a,f)&&a.C.length&&(b.b=!0);O(c,b)});return M(c)}
function Dn(a,b){if(Sl(b.H))return En(a,b);var c=I("layoutFloat"),d=b.D,e=b.j;v(d,"float","none");v(d,"display","inline-block");v(d,"vertical-align","top");ln(a,b).then(function(f){for(var g=Yj(a.b,d),h=qn(a,d),g=new Sf(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.V,l=a.X,k=b.parent;k&&k.Da;)k=k.parent;if(k){var m=k.D.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.u?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");
k.D.appendChild(m);var n=Yj(a.b,m),h=Math.max(a.u?n.top:n.left,h),l=Math.min(a.u?n.bottom:n.right,l);k.D.removeChild(m);m=a.u?g.N-g.R:g.T-g.U;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.D.appendChild(b.D)}m=new Sf(h,Ik(a)*a.ya,l,Ik(a)*a.lb);h=g;a.u&&(h=ig(g));l=Ik(a);h.R<a.Ab*l&&(n=h.N-h.R,h.R=a.Ab*l,h.N=h.R+n);a:for(var l=a.J,n=h,r=n.R,q=n.T-n.U,z=n.N-n.R,y=ng(l,r);;){var A=r+z;if(A>m.N)break a;for(var H=m.U,G=m.T,J=y;J<l.length&&l[J].R<A;J++){var K=l[J];K.U>H&&(H=K.U);K.T<G&&(G=K.T)}if(H+q<=
G||y>=l.length){"left"==e?(n.U=H,n.T=H+q):(n.U=G-q,n.T=G);n.N+=r-n.R;n.R=r;break a}r=l[y].N;y++}a.u&&(g=jg(h));a:{m=rn(a.b,d);l=new Uf;if(m){if("border-box"==m.boxSizing){m=qn(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}v(d,"width",g.T-g.U-m.left-m.right+"px");v(d,"height",g.N-
g.R-m.top-m.bottom+"px");v(d,"position","absolute");v(d,"display",b.display);l=null;if(k)if(k.J)l=k;else a:{for(k=k.parent;k;){if(k.J){l=k;break a}k=k.parent}l=null}l?(m=l.D.ownerDocument.createElement("div"),m.style.position="absolute",l.u?m.style.right="0":m.style.left="0",m.style.top="0",l.D.appendChild(m),k=Yj(a.b,m),l.D.removeChild(m)):k={left:a.u?a.lb:a.V,right:a.u?a.ya:a.X,top:a.u?a.V:a.ya};(l?l.u:a.u)?v(d,"right",k.right-g.T+a.H+"px"):v(d,"left",g.U-k.left+a.w+"px");v(d,"top",g.R-k.top+a.A+
"px");b.C&&(b.C.parentNode.removeChild(b.C),b.C=null);k=a.u?g.U:g.N;g=a.u?g.T:g.R;if(Um(a,k)&&a.C.length)b=b.modify(),b.b=!0,O(c,b);else{nn(a);m=new Sf(a.u?a.lb:a.V,a.u?a.V:a.ya,a.u?a.ya:a.X,a.u?a.X:a.lb);a.u&&(m=ig(m));l=a.J;for(h=[new Wf(h.R,h.N,h.U,h.T)];0<h.length&&h[0].N<=m.R;)h.shift();if(h.length){h[0].R<m.R&&(h[0].R=m.R);n=l.length?l[l.length-1].N:m.R;n<m.N&&l.push(new Wf(n,m.N,m.U,m.T));r=ng(l,h[0].R);for(q=0;q<h.length;q++){z=h[q];if(r==l.length)break;l[r].R<z.R&&(n=l[r],r++,l.splice(r,
0,new Wf(z.R,n.N,n.U,n.T)),n.N=z.R);for(;r<l.length&&(n=l[r++],n.N>z.N&&(l.splice(r,0,new Wf(z.N,n.N,n.U,n.T)),n.N=z.N),z.U!=z.T&&("left"==e?n.U=Math.min(z.T,m.T):n.T=Math.max(z.U,m.U)),n.N!=z.N););}mg(m,l)}on(a);"left"==e?a.Cb=k:a.tc=k;a.Ab=g;Fn(a,k);O(c,f)}});return M(c)}
function Gn(a,b){var c=a.element.ownerDocument.createElement("div");v(c,"position","absolute");var d=fm(a.f,b.b),e=new $l(d,"column",null,a.f.h,b.S,null,null),d=cm(d),c=new Hn(b,c,a.h.clone(),a.b,a.Sa,e,d);dm(e,c);var f=a.f,e=cm(f,b.b),g=Nk(e),d=c.element;e.element.parentNode.appendChild(d);Jk(c,e);c.element=d;c.ye=!0;c.width=g.T-g.U;c.height=g.N-g.R;c.marginLeft=c.marginRight=c.marginTop=c.marginBottom=0;c.borderLeft=c.fa=c.borderTop=c.Z=0;c.w=c.H=c.A=c.G=0;Lk(c,g.U-e.bb,c.width);Kk(c,g.R-e.cb,c.height);
c.Ib=(e.Ib||[]).concat();c.Bb=!nm(f);c.xa=null;xn(c);(f=Fm(f,c,b,!0,!nm(f)))?(nn(c),xn(c)):e.element.parentNode.removeChild(d);return f?c:null}
function In(a,b,c){var d=a.f;zm(d,c);var e=Gn(a,c);if(!e)return Am(d,c.b),rm(d,c,b),L(null);var f=new wk(b),g=I("layoutPageFloatInner");An(e,f,!0).then(function(f){if(f&&nm(d))Am(d,c.b),rm(d,c,b),e.element.parentNode.removeChild(e.element),O(g,null);else if(Fm(d,e,c,!1,!nm(d))){var h=new Yl(c,b,e);jm(d,h,!0);Jn(a,c.b).then(function(a){a?(jm(d,h),Bm(d,c.b),f&&rm(d,c,f.Ba),O(g,e)):(lm(d,h,!0),Am(d,c.b),rm(d,c,b),O(g,null))})}else Am(d,c.b),rm(d,c,b),e.element.parentNode.removeChild(e.element),O(g,null)});
return M(g)}
function Jn(a,b){var c=a.f,d=Cm(c,b),e=[],f=[],g=!1,h=I("layoutStashedPageFloats"),l=0;ie(function(b){if(l>=d.length)Q(b);else{var h=d[l],k=im(c,h),r=h.f,q=Gn(a,k);q?(e.push(q),An(q,new wk(r),!0).then(function(a){a?(g=!0,Q(b)):Fm(c,q,k,!1,!1)?(a=new Yl(k,r,q),jm(c,a,!0),f.push(a),l++,P(b)):(g=!0,Q(b))})):(g=!0,Q(b))}}).then(function(){g?(f.forEach(function(a){lm(c,a,!0)}),e.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):d.forEach(function(a){(a=a.Ub.element)&&a.parentNode&&
a.parentNode.removeChild(a)});O(h,!g)});return M(h)}function Kn(a){var b=a.D.parentNode,c=b.ownerDocument.createElement("span");c.setAttribute("data-adapt-spec","1");b.appendChild(c);b.removeChild(a.D);a=a.modify();a.M=!0;a.D=c;return a}
function Ln(a,b,c,d){var e=I("resolveFloatReferenceFromColumnSpan"),f=a.f,g=fm(f,"region");cm(f).width<cm(g).width&&"column"===b?c===Lc?ln(a,lk(d)).then(function(c){var d=c.D;c=Gm(a.b,d,[Mn])[Mn];d=qn(a,d);c=a.u?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?O(e,"region"):O(e,b)}):c===Jc?O(e,"region"):O(e,b):O(e,b);return M(e)}
function En(a,b){var c=a.f,d=b.H,e=b.S,f=b.j,g=c.de(e);return(g?L(g):Ln(a,d,b.V,b).oa(function(a){d=a;g=new Tl(e,d,f);c.Yd(g);return L(g)})).oa(function(d){var e=hk(b),f=Kn(b);return mm(c,d)?(om(c,d,f.D),L(f)):hm(c,d)||tm(c,d)?(rm(c,d,e),om(c,d,f.D),L(f)):In(a,e,d).oa(function(a){if(a)return L(null);om(c,d,f.D);return L(f)})})}
function On(a,b){if(!a.M||a.Da){for(var c=a.D,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.D,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Wa){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Wa=27>g.getBoundingClientRect().right;f.removeChild(h)}Wa?a.u?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.u?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.M||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function Pn(a,b,c,d){var e=I("processLineStyling");Wm(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.lf);ie(function(d){if(h){var e=Qn(a,f),l=h.count-g;if(e.length<=l)Q(d);else{var n=Rn(a,f,e[l-1]);n?Sn(a,n,!1,!1).then(function(){g+=l;en(a.h,n,0).then(function(e){b=e;On(b,!1);h=b.f;f=[];fn(a,b,f).then(function(a){c=a;P(d)})})}):Q(d)}}else Q(d)}).then(function(){Array.prototype.push.apply(d,f);Wm(d);O(e,c)});return M(e)}
function Tn(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.M||!f.D||1!=f.D.nodeType)break;f=qn(a,f.D);f=a.u?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function Un(a,b){var c=I("layoutBreakableBlock"),d=[];fn(a,b,d).then(function(e){var f=d.length-1;if(0>f)O(c,e);else{var f=pn(a,e,d,f,d[f].pa),g=Um(a,f);e||(f+=Tn(a,d));Fn(a,f);var h;b.f?h=Pn(a,b,e,d):h=L(e);h.then(function(b){0<d.length&&(a.C.push(new Qm(d,d[0].l)),g&&(2!=d.length&&0<a.C.length||d[0].S!=d[1].S||!Km[d[0].S.localName])&&b&&(b=b.modify(),b.b=!0));O(c,b)})}});return M(c)}
function Rn(a,b,c){Wm(b);for(var d=0,e=b[0].pa,f=d,g=b.length-1,h=b[g].pa,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].pa>l?k=m-1:f=m}k=pn(a,null,b,f,l);if(a.u?k<c:k>c){for(h=l-1;b[f].pa==l;)f--;g=f}else Fn(a,k),e=l,d=f}a=b[f];b=a.D;1!=b.nodeType?(Vn(a),a.M?a.ia=b.length:(c=e-a.pa,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.w?"":a.h||a.parent&&a.parent.h||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.w&&Ia(d)&&Ia(f)?
a.h||a.parent&&a.parent.h||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ia+=e,a.g=null)),e=a):e=a;return e}function Vn(a){Ld("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},Wn)}var Wn=new function(){};function gn(a){return a?(a=a.D)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function Qn(a,b){for(var c=[],d=b[0].D,e=b[b.length-1].D,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var n=!0;do{var r=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?n=!k:r=d.firstChild;r||(r=d.nextSibling,r||(h=!0,r=d.parentNode));d=r}while(n&&m);if(k){g.setEndAfter(l);k=Mm(a.b,g);for(n=0;n<k.length;n++)f.push(k[n]);k=!1}}f.sort(a.u?fk:ek);l=d=h=g=e=0;for(m=Ik(a);;){if(l<f.length&&(k=f[l],n=1,0<d&&(n=Math.max(a.u?k.right-
k.left:k.bottom-k.top,1),n=m*(a.u?k.right:k.top)<m*e?m*((a.u?k.left:k.bottom)-e)/n:m*(a.u?k.left:k.bottom)>m*g?m*(g-(a.u?k.right:k.top))/n:1),!d||.6<=n||.2<=n&&(a.u?k.top:k.left)>=h-1)){h=a.u?k.bottom:k.right;a.u?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ma);a.u&&c.reverse();return c}
function Xn(a,b){if(!a.g)return L(!0);for(var c=!1,d=a.g.length-1;0<=d;--d){var e=a.g[d];if(e.pa<=b)break;a.g.pop();e.b!==e.f&&(c=!0)}if(!c)return L(!0);var f=I("clearFootnotes"),g=a.la+a.ya,h=a.g;a.O=null;a.g=null;var l=0;he(function(){for(;l<h.length;){var b=h[l++],b=vn(a,b.pa,b.f,g);if(b.za())return b}return L(!1)}).then(function(){O(f,!0)});return M(f)}
function Yn(a,b){var c=0;vk(b,function(a){if("clone"===a.qb["box-decoration-break"]){var b=sn(this,a.D);c+=a.u?-b.left:b.bottom;"table"===a.display&&(c+=a.sd)}}.bind(a));return c}
function Rm(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.Da;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.qb.widows||2)-0,1),f=Math.max((e.qb.orphans||2)-0,1));var e=Yn(a,e),g=Qn(a,d),h=a.F-e;(d=b.g())&&(h-=(a.u?-1:1)*Tm(d));d=La(g.length,function(b){return a.u?g[b]<h:g[b]>h});d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=Rn(a,b.h,h))a.la=Ik(a)*(h-a.ya);return b}function Sn(a,b,c,d){var e=Nm(b.L).b(a,b,c,d);e||(e=Zn.b(a,b,c,d));return e}
Ym.prototype.Jb=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.C.length-1;0<=e&&!b;--e){var a=this.C[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Uc:b?a:null,B:b}};
function $n(a,b,c,d){var e=I("findAcceptableBreak"),f=a.Jb().B,g=!1;if(!f){u.b("Could not find any page breaks?!!");if(a.Bb)return ao(a,b).then(function(b){b?(b=b.modify(),b.b=!1,Sn(a,b,g,!0).then(function(){O(e,b)})):O(e,b)}),M(e);f=c;g=!0;a.la=d}Sn(a,f,g,!0).then(function(){O(e,f)});return M(e)}function bo(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function co(a,b,c,d,e){var f;if(!(f=!b))a:{for(f=b.D;f;){if(f.parentNode===f.ownerDocument){f=!1;break a}f=f.parentNode}f=!0}if(f)return!1;f=Lm(b,a.b,0,a.u);var g=b.M?b.parent&&b.parent.L:b.L;g&&(g=g.ec())&&(f+=(a.u?-1:1)*Tm(g));g=Um(a,f);c&&(f+=Tn(a,c));Fn(a,f);if((d=a.l?d:!0)||!g)c=lk(b),b=Nm(b.L).g(c,e,g,a.la),a.C.push(b);return g}
function eo(a,b){if(b.D.parentNode){var c=qn(a,b.D),d=b.D.ownerDocument.createElement("div");a.u?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.D.parentNode.insertBefore(d,b.D);var e=Yj(a.b,d),e=a.u?e.right:e.top,f=Ik(a),g;switch(b.A){case "left":g=a.Cb;break;case "right":g=a.tc;break;default:g=f*Math.max(a.tc*f,a.Cb*f)}e*f>=g*f?b.D.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.u?d.style.width=
e+"px":d.style.height=e+"px",e=Yj(a.b,d),e=a.u?e.left:e.bottom,a.u?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.C=d)}}
function fo(a,b,c,d){function e(){return!!d||!c&&!!dl[m]}function f(){b=r[0]||b;b.D.parentNode.removeChild(b.D);h.j=m}var g=b.M?b.parent&&b.parent.L:b.L;if(g&&!(g instanceof Xm))return L(b);var h=a,l=I("skipEdges"),k=!d&&c&&b&&b.M,m=d,n=null,r=[],q=[],z=!1;ie(function(a){for(;b;){do if(b.D){if(b.Da&&1!=b.D.nodeType){if(ak(b.D,b.Tb))break;if(!b.M){e()?f():co(h,n,null,!0,m)?(b=(h.l?n||b:b).modify(),b.b=!0):(b=b.modify(),b.g=m);Q(a);return}}if(!b.M&&(b.A&&eo(h,b),!(b.L instanceof Xm)||Zm(h,b)||b.G)){r.push(lk(b));
m=bl(m,b.g);if(e())f();else if(co(h,n,null,!0,m)||!jn(h.Sa,b))b=(h.l?n||b:b).modify(),b.b=!0;Q(a);return}if(1==b.D.nodeType){var d=b.D.style;if(b.M){if(z){if(e()){f();Q(a);return}r=[];k=c=!1;m=null}z=!1;n=lk(b);q.push(n);m=bl(m,b.F);if(d&&(!bo(d.paddingBottom)||!bo(d.borderBottomWidth))){if(co(h,n,null,!0,m)&&(b=(h.l?n||b:b).modify(),b.b=!0,h.l)){Q(a);return}q=[n];n=null}}else{r.push(lk(b));m=bl(m,b.g);if(!jn(h.Sa,b)&&(co(h,n,null,!1,m),b=b.modify(),b.b=!0,h.l)){Q(a);return}if(Km[b.D.localName]){e()?
f():co(h,n,null,!0,m)&&(b=(h.l?n||b:b).modify(),b.b=!0);Q(a);return}!d||bo(d.paddingTop)&&bo(d.borderTopWidth)||(k=!1,q=[]);z=!0}}}while(0);d=hn(h.h,b,k);if(d.za()){d.then(function(c){b=c;P(a)});return}b=d.get()}co(h,n,q,!1,m)?n&&h.l&&(b=n.modify(),b.b=!0):dl[m]&&(h.j=m);Q(a)}).then(function(){n&&(h.Ma=sk(n));O(l,b)});return M(l)}
function ao(a,b){var c=lk(b),d=I("skipEdges"),e=null,f=!1;ie(function(d){for(;b;){do if(b.D){if(b.Da&&1!=b.D.nodeType){if(ak(b.D,b.Tb))break;if(!b.M){dl[e]&&(a.j=e);Q(d);return}}if(!b.M&&(Zm(a,b)||b.G)){e=bl(e,b.g);dl[e]&&(a.j=e);Q(d);return}if(1==b.D.nodeType){var g=b.D.style;if(b.M){if(f){if(dl[e]){a.j=e;Q(d);return}e=null}f=!1;e=bl(e,b.F)}else{e=bl(e,b.g);if(Km[b.D.localName]){dl[e]&&(a.j=e);Q(d);return}if(g&&(!bo(g.paddingTop)||!bo(g.borderTopWidth))){Q(d);return}}f=!0}}while(0);g=hn(a.h,b);if(g.za()){g.then(function(a){b=
a;P(d)});return}b=g.get()}c=null;Q(d)}).then(function(){O(d,c)});return M(d)}function kn(a,b){return"footnote"==b.j?Bn(a,b):Dn(a,b)}function go(a,b,c,d){var e=I("layoutNext");fo(a,b,c,d).then(function(c){b=c;!b||a.j||a.l&&b&&b.b?O(e,b):Nm(b.L).f(b,a).Fa(e)});return M(e)}function ho(a,b){do{var c=a.D.parentNode;if(!c)break;var d=c,e=a.D;if(d)for(var f;(f=d.lastChild)!=e;)d.removeChild(f);b&&(c.removeChild(a.D),b=!1);a=a.parent}while(a)}
function zn(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.A+"px";b.style.right=a.H+"px";b.style.bottom=a.G+"px";b.style.left=a.w+"px";a.element.appendChild(b);var c=Yj(a.b,b);a.element.removeChild(b);var b=a.bb+a.left+Gk(a),d=a.cb+a.top+Ek(a);a.ta=new Sf(b,d,b+a.width,d+a.height);a.V=c?a.u?c.top:c.left:0;a.X=c?a.u?c.bottom:c.right:0;a.ya=c?a.u?c.right:c.top:0;a.lb=c?a.u?c.left:c.bottom:0;a.Cb=a.ya;a.tc=a.ya;a.Ab=a.ya;a.F=a.lb;var c=a.ta,e,b=a.bb+a.left+
Gk(a),d=a.cb+a.top+Ek(a);e=new Sf(b,d,b+a.width,d+a.height);if(a.xa){b=a.xa;d=e.U;e=e.R;for(var f=[],g=0;g<b.b.length;g++){var h=b.b[g];f.push(new Tf(h.f+d,h.b+e))}b=new Yf(f)}else b=ag(e.U,e.R,e.T,e.N);a.J=lg(c,[b],$m(a),a.Xa,a.u);on(a);a.g=null}function xn(a){a.Ud=[];v(a.element,"width",a.width+"px");v(a.element,"height",a.height+"px");zn(a);a.la=0;a.Zd=!1;a.j=null;a.Ma=null}function Fn(a,b){a.la=Math.max(Ik(a)*(b-a.ya),a.la)}
function io(a,b){var c=b.b;if(!c)return L(!0);var d=I("layoutOverflownFootnotes"),e=0;he(function(){for(;e<c.length;){var b=c[e++],b=vn(a,0,b,a.ya);if(b.za())return b}return L(!1)}).then(function(){O(d,!0)});return M(d)}
function An(a,b,c,d){a.Ud.push(b);b.Ba.M&&(a.Ma=b.Ba);if(a.l&&a.Zd)return L(b);var e=I("layout");io(a,b).then(function(){a.vb(b.Ba).then(function(b){var f=b,h=a.la;a.C=[];ie(function(e){for(;b;){var g=!0;go(a,b,c,d||null).then(function(d){c=!1;b=d;xm(a.f)?Q(e):a.j?Q(e):b&&a.l&&b&&b.b?$n(a,b,f,h).then(function(a){b=a;Q(e)}):g?g=!1:P(e)});if(g){g=!1;return}}Q(e)}).then(function(){if(xm(a.f))O(e,null);else{var c=a.O;c&&(a.element.appendChild(c.element),a.u?a.la=this.ya-this.lb:a.la=c.top+Ek(c)+c.la+
Fk(c));if(b){a.Zd=!0;c=new wk(sk(b));if(a.g){for(var d=[],f=0;f<a.g.length;f++){var g=a.g[f].b;g&&d.push(g)}c.b=d.length?d:null}O(e,c)}else O(e,null)}})})});return M(e)}
function yn(a){for(var b=a.Ud,c=a.element.lastChild;c!=a.bf;){var d=c.previousSibling;a.element===c.parentNode&&c.getAttribute("data-adapt-pseudo")||a.element.removeChild(c);c=d}nn(a);xn(a);var e=I("redoLayout"),f=0,g=null,h=!0;ie(function(c){if(f<b.length){var d=b[f++];An(a,d,h).then(function(a){h=!1;a?(g=a,Q(c)):P(c)})}else Q(c)}).then(function(){O(e,g)});return M(e)}function jo(){}
jo.prototype.f=function(a,b){var c;if(Zm(b,a))c=kn(b,a);else{a:if(a.M)c=!0;else{switch(a.S.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.G}c=c?Un(b,a):ln(b,a)}return c};jo.prototype.g=function(a,b,c,d){return new Sm(lk(a),b,c,d)};jo.prototype.b=function(a,b,c,d){c=c||!!b.D&&1==b.D.nodeType&&!b.M;ho(b,c);d&&(On(b,!0),ko(c?b:b.parent));return Xn(a,b.pa)};var Zn=new jo;
Kd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.L?null:b&&a.L!==b.L?null:a.zc||!a.L&&fl(c,d,e,f).display===Mc?new Xm(b?b.L:null):null});Kd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Xm?Zn:null});function Hn(a,b,c,d,e,f,g){Ym.call(this,b,c,d,e,f);this.gb=a;this.Ae=g;this.xe=this.Ce=null}t(Hn,Ym);Hn.prototype.vb=function(a){return Ym.prototype.vb.call(this,a).oa(function(a){a&&lo(this,a);return L(a)}.bind(this))};
function lo(a,b){function c(a,b){a.forEach(function(a){var c=Aa(d,a);c&&"%"===c.charAt(c.length-1)&&v(d,a,b*parseFloat(c)/100+"px")})}for(;b.parent;)b=b.parent;var d=a.Ce=b.D,e=Nk(a.Ae),f=e.T-e.U,e=e.N-e.R;c(["width","max-width","min-width"],f);c(["height","max-height","min-height"],e);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?e:f);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===
Aa(d,a)&&v(d,a,"0")});a.xe=qn(a,d);f=a.gb.f;if(a.Ae.u){if("block-end"===f||"left"===f)f=Aa(d,"height"),""!==f&&"auto"!==f&&v(d,"margin-top","auto")}else if("block-end"===f||"bottom"===f)f=Aa(d,"width"),""!==f&&"auto"!==f&&v(d,"margin-left","auto")};function mo(a,b){this.b=a;this.aa=b}function no(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function oo(a,b){this.b=a;this.f=b}function po(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function qo(a,b){this.cc=a;this.Ic=b;this.Kd=null;this.aa=this.P=-1}function Zi(a,b,c){b=a.b.J.Rd(b,a.f);a.b.l[b]=c}function ro(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}
function so(a,b){var c=a.b.J.Oc(oa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}function Ei(a,b,c){return new vb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Gi(a,b,c){return new vb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function to(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.A=b;for(b=0;d.A&&(b+=5E3,sl(d,b,0)!==Number.POSITIVE_INFINITY););d.A=null}e=a.b.l[c]}return e||null}
function Ii(a,b,c,d){var e=ro(b),f=so(a,b),g=to(a,e,f,!1);return g&&g[c]?(b=g[c],new tb(a.j,d(b[b.length-1]||null))):new vb(a.f,function(){if(g=to(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.A[f]||null)return uo(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);vo(a.b,f,!1);return"??"}vo(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Ki(a,b,c,d){var e=ro(b),f=so(a,b);return new vb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.A[f]||null;if(b){uo(a.b,f);var b=b[c]||[],h=to(a,e,f,!0)[c]||[];return d(b.concat(h))}vo(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function wo(a){this.J=a;this.l={};this.A={};this.b={};this.b.page=[0];this.G={};this.F=[];this.C={};this.j=null;this.w=[];this.g=[];this.H=[];this.f={};this.h={}}function xo(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function yo(a,b,c){a.G=po(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=wg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=wg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function zo(a,b){a.F.push(a.b);a.b=po(b)}
function uo(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.cc===b?(g.Ic=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||vo(a,b,!0)}function vo(a,b,c){a.w.some(function(a){return a.cc===b})||a.w.push(new qo(b,c))}
function Ao(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=po(a.b);d.forEach(function(a){this.A[a]=e;var d=this.C[a];if(d&&d.aa<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.Ic=!1,f.push(g)}this.C[a]={P:b,aa:c}},a)}for(var d=a.G,f;f=a.w.shift();){f.Kd=d;f.P=b;f.aa=c;var g;f.Ic?(g=a.h[f.cc])||(g=a.h[f.cc]=[]):(g=a.f[f.cc])||(g=a.f[f.cc]=[]);g.every(function(a){return!(f===a||a&&f.cc===a.cc&&f.Ic===a.Ic&&f.P===a.P&&f.aa===a.aa)})&&g.push(f)}a.j=null}
function Bo(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.P-b.P||a.aa-b.aa});var d=[],e=null;c.forEach(function(a){e&&e.P===a.P&&e.aa===a.aa?e.cd.push(a):(e={P:a.P,aa:a.aa,Kd:a.Kd,cd:[a]},d.push(e))});return d}function Co(a,b){a.H.push(a.g);a.g=b}
function jn(a,b){if(!b||b.M)return!0;var c=b.D;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c&&(a.b.h[c]||a.b.f[c])?(c=a.b.C[c])?a.aa>=c.aa:!0:!0};var Do=1;function Eo(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Pb=c;this.Ca=d;this.parent=e;this.l="p"+Do++;e&&(this.index=e.j.length,e.j.push(this))}Eo.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};Eo.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Fo(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function Go(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function Ho(a){Eo.call(this,a,null,null,[],null);this.b.width=new V(Dd,0);this.b.height=new V(Ed,0)}t(Ho,Eo);
function Io(a,b){this.g=b;var c=this;sb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.w[d[1]];if(e&&(e=this.Ma[e])){if(b){var d=d[2],h=e.fa[d];if(h)e=h;else{switch(d){case "columns":var h=e.b.f,l=new kc(h,0),k=Jo(e,"column-count"),m=Jo(e,"column-width"),n=Jo(e,"column-gap"),h=x(h,mc(h,new hc(h,"min",[l,k]),w(h,m,n)),n)}h&&(e.fa[d]=h);e=h}}else e=Jo(e,d[2]);return e}}return null})}t(Io,sb);
function Ko(a,b,c,d,e,f,g){a=a instanceof Io?a:new Io(a,this);Eo.call(this,a,b,c,d,e);this.g=this;this.W=f;this.$=g;this.b.width=new V(Dd,0);this.b.height=new V(Ed,0);this.b["wrap-flow"]=new V(Lc,0);this.b.position=new V(od,0);this.b.overflow=new V(Ad,0);this.w={}}t(Ko,Eo);Ko.prototype.h=function(a){return new Lo(a,this)};Ko.prototype.clone=function(a){a=new Ko(this.f,this.name,a.Pb||this.Pb,this.Ca,this.parent,this.W,this.$);Fo(this,a);Go(this,a);return a};
function Mo(a,b,c,d,e){Eo.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l);this.b["wrap-flow"]=new V(Lc,0)}t(Mo,Eo);Mo.prototype.h=function(a){return new No(a,this)};Mo.prototype.clone=function(a){a=new Mo(a.parent.f,this.name,this.Pb,this.Ca,a.parent);Fo(this,a);Go(this,a);return a};function Oo(a,b,c,d,e){Eo.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l)}t(Oo,Eo);Oo.prototype.h=function(a){return new Po(a,this)};
Oo.prototype.clone=function(a){a=new Oo(a.parent.f,this.name,this.Pb,this.Ca,a.parent);Fo(this,a);Go(this,a);return a};function Y(a,b,c){return b&&b!==Lc?b.ra(a,c):null}function Qo(a,b,c){return b&&b!==Lc?b.ra(a,c):a.b}function Ro(a,b,c){return b?b===Lc?null:b.ra(a,c):a.b}function So(a,b,c,d){return b&&c!==F?b.ra(a,d):a.b}function To(a,b,c){return b?b===Bd?a.j:b===Xc?a.h:b.ra(a,a.b):c}
function Uo(a,b){this.f=a;this.b=b;this.J={};this.style={};this.A=this.C=null;this.w=[];this.O=this.V=this.g=this.h=!1;this.G=this.H=0;this.F=null;this.ja={};this.fa={};this.xa=this.u=!1;a&&a.w.push(this)}function Vo(a){a.H=0;a.G=0}function Wo(a,b,c){b=Jo(a,b);c=Jo(a,c);if(!b||!c)throw Error("E_INTERNAL");return w(a.b.f,b,c)}
function Jo(a,b){var c=a.ja[b];if(c)return c;var d=a.style[b];d&&(c=d.ra(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c=Jo(a,"left");break;case "margin-top-edge":c=Jo(a,"top");break;case "margin-right-edge":c=Wo(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Wo(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Wo(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Wo(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Wo(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Wo(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Wo(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Wo(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Wo(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Wo(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Wo(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Wo(a,"padding-top-edge","padding-top");break;case "right-edge":c=Wo(a,"left-edge","width");break;case "bottom-edge":c=Wo(a,"top-edge","height")}if(!c){if("extent"==b)d=a.u?"width":"height";else if("measure"==b)d=a.u?"height":"width";else{var e=a.u?uh:vh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=Jo(a,d))}c&&(a.ja[b]=c);return c}
function Xo(a){var b=a.b.f,c=a.style,d=To(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new fc(b,"page-number"),d=lc(b,d,new Yb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-height"),e)));d=a.X(d);c.enabled=new E(d)}Uo.prototype.X=function(a){return a};
Uo.prototype.Dd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=So(a,b["border-left-width"],b["border-left-style"],c),g=Qo(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=Qo(a,b["padding-right"],c),m=So(a,b["border-right-width"],b["border-right-style"],c),n=Y(a,b["margin-right"],c),r=Y(a,b.right,c),q=w(a,f,g),z=w(a,f,k);d&&r&&h?(q=x(a,c,w(a,h,w(a,w(a,d,q),z))),e?n?r=x(a,q,n):n=x(a,q,w(a,r,e)):(q=x(a,q,
r),n?e=x(a,q,n):n=e=mc(a,q,new tb(a,.5)))):(e||(e=a.b),n||(n=a.b),d||r||h||(d=a.b),d||h?d||r?h||r||(h=this.C,this.h=!0):d=a.b:(h=this.C,this.h=!0),q=x(a,c,w(a,w(a,e,q),w(a,n,z))),this.h&&(l||(l=x(a,q,d?d:r)),this.u||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.h=!1)),d?h?r||(r=x(a,q,w(a,d,h))):h=x(a,q,w(a,d,r)):d=x(a,q,w(a,r,h)));a=Qo(a,b["snap-width"]||(this.f?this.f.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(n);b.right=new E(r);b["snap-width"]=new E(a)};
Uo.prototype.Ed=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=this.f?this.f.style.height.ra(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=So(a,b["border-top-width"],b["border-top-style"],c),h=Qo(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=Qo(a,b["padding-bottom"],c),n=So(a,b["border-bottom-width"],b["border-bottom-style"],c),r=Y(a,b["margin-bottom"],c),q=Y(a,b.bottom,d),z=w(a,g,h),y=w(a,n,m);e&&q&&l?(d=x(a,d,w(a,l,w(a,w(a,e,z),
y))),f?r?q=x(a,d,f):r=x(a,d,w(a,q,f)):(d=x(a,d,q),r?f=x(a,d,r):r=f=mc(a,d,new tb(a,.5)))):(f||(f=a.b),r||(r=a.b),e||q||l||(e=a.b),e||l?e||q?l||q||(l=this.A,this.g=!0):e=a.b:(l=this.A,this.g=!0),d=x(a,d,w(a,w(a,f,z),w(a,r,y))),this.g&&(k||(k=x(a,d,e?e:q)),this.u&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.g=!1)),e?l?q||(q=x(a,d,w(a,e,l))):l=x(a,d,w(a,q,e)):e=x(a,d,w(a,q,l)));a=Qo(a,b["snap-height"]||(this.f?this.f.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(n);b["margin-bottom"]=new E(r);b.bottom=new E(q);b["snap-height"]=new E(a)};
function Yo(a){var b=a.b.f,c=a.style;a=Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==kd?f.ra(b,null):null)||(f=new ec(b,1,"em"));d&&!e&&(e=new hc(b,"floor",[nc(b,w(b,a,f),w(b,d,f))]),e=new hc(b,"max",[b.f,e]));e||(e=b.f);d=x(b,nc(b,w(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function Zo(a,b,c,d){a=a.style[b].ra(a.b.f,null);return Hb(a,c,d,{})}
function $o(a,b){b.Ma[a.b.l]=a;var c=a.b.f,d=a.style,e=a.f?ap(a.f,b):null,e=lj(a.J,b,e,!1);a.u=kj(e,b,a.f?a.f.u:!1);mj(e,d,a.u,function(a,b){return b.value});a.C=new vb(c,function(){return a.H},"autoWidth");a.A=new vb(c,function(){return a.G},"autoHeight");a.Dd();a.Ed();Yo(a);Xo(a)}function bp(a,b,c){(a=a.style[c])&&(a=Rf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Rf(b,a,c));return Hc(a,b)}
function ap(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function cp(a,b,c,d,e){if(a=bp(a,b,d))a.Yb()&&zb(a.ga)&&(a=new D(Hc(a,b),"px")),"font-family"===d&&(a=El(e,a)),v(c,d,a.toString())}
function dp(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Lk(c,d,a);v(c.element,"margin-left",e+"px");v(c.element,"padding-left",f+"px");v(c.element,"border-left-width",g+"px");c.marginLeft=e;c.borderLeft=g;c.w=f}
function ep(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");v(c.element,"margin-right",f+"px");v(c.element,"padding-right",g+"px");v(c.element,"border-right-width",b+"px");c.marginRight=f;c.fa=b;a.u&&0<e&&(a=d+Hk(c),a-=Math.floor(a/e)*e,0<a&&(c.wb=e-a,g+=c.wb));c.H=g;c.xb=e}
function fp(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.borderTop=b;c.Xa=d;!a.u&&0<d&&(a=e+Ek(c),a-=Math.floor(a/d)*d,0<a&&(c.ja=d-a,g+=c.ja));c.A=g;v(c.element,"top",e+"px");v(c.element,"margin-top",f+"px");v(c.element,"padding-top",g+"px");v(c.element,"border-top-width",b+"px")}
function gp(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.ja;v(c.element,"height",a+"px");v(c.element,"margin-bottom",d+"px");v(c.element,"padding-bottom",e+"px");v(c.element,"border-bottom-width",f+"px");c.height=a-c.ja;c.marginBottom=d;c.Z=f;c.G=e}function hp(a,b,c){a.u?(fp(a,b,c),gp(a,b,c)):(ep(a,b,c),dp(a,b,c))}
function ip(a,b,c){v(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.V?Kk(c,0,d):(fp(a,b,c),d-=c.ja,c.height=d,v(c.element,"height",d+"px"))}function jp(a,b,c){v(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?Lk(c,0,d):(ep(a,b,c),d-=c.wb,c.width=d,a=Z(a,b,"right"),v(c.element,"right",a+"px"),v(c.element,"width",d+"px"))}
var kp="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),lp="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
mp="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),np=["width","height"],op=["transform","transform-origin"];
Uo.prototype.Ob=function(a,b,c,d){this.f&&this.u==this.f.u||v(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?jp(this,a,b):ip(this,a,b):(this.u?ep(this,a,b):fp(this,a,b),this.u?dp(this,a,b):gp(this,a,b));(this.u?this.g:this.h)?this.u?ip(this,a,b):jp(this,a,b):hp(this,a,b);for(c=0;c<kp.length;c++)cp(this,a,b.element,kp[c],d)};function pp(a,b,c,d){for(var e=0;e<mp.length;e++)cp(a,b,c.element,mp[e],d)}
function qp(a,b,c,d){for(var e=0;e<np.length;e++)cp(a,b,c,np[e],d)}
Uo.prototype.Xc=function(a,b,c,d,e,f,g){this.u?this.H=b.la+b.wb:this.G=b.la+b.ja;var h=(this.u||!d)&&this.g,l=(!this.u||!d)&&this.h;if(l||h)l&&v(b.element,"width","auto"),h&&v(b.element,"height","auto"),d=Yj(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.w-b.borderLeft-b.H-b.fa),this.u&&(this.H+=b.wb)),h&&(this.G=d.bottom-d.top-b.A-b.borderTop-b.G-b.Z,this.u||(this.G+=b.ja));(this.u?this.g:this.h)&&hp(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.V)this.u?ep(this,a,b):fp(this,
a,b);this.u?dp(this,a,b):gp(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=bp(this,a,"column-rule-style"),f=bp(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=xd))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,n=this.u?"border-top":"border-left",h=1;h<e;h++){var r=(m+k)*h/e-k/2+b.w-l/2,q=b.height+b.A+b.G,z=b.element.ownerDocument.createElement("div");v(z,"position","absolute");v(z,this.u?"left":"top","0px");v(z,this.u?"top":"left",r+"px");v(z,this.u?"height":"width","0px");v(z,this.u?
"width":"height",q+"px");v(z,n,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<lp.length;h++)cp(this,a,b.element,lp[h],g);for(h=0;h<op.length;h++)e=b,g=op[h],l=c.w,(d=bp(this,a,g))&&l.push(new Qj(e.element,g,d))};
Uo.prototype.j=function(a,b){var c=this.J,d=this.b.b,e;for(e in d)zh(e)&&Ah(c,e,d[e]);if("background-host"==this.b.Pb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.b.Pb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Ri(a,this.b.Ca,null,c);c.content&&(c.content=c.content.Wc(new wi(a,null,a.Xa)));$o(this,a.l);for(c=0;c<this.b.j.length;c++)this.b.j[c].h(this).j(a,b);a.pop()};
function rp(a,b){a.h&&(a.O=Zo(a,"right",a.C,b)||Zo(a,"margin-right",a.C,b)||Zo(a,"border-right-width",a.C,b)||Zo(a,"padding-right",a.C,b));a.g&&(a.V=Zo(a,"top",a.A,b)||Zo(a,"margin-top",a.A,b)||Zo(a,"border-top-width",a.A,b)||Zo(a,"padding-top",a.A,b));for(var c=0;c<a.w.length;c++)rp(a.w[c],b)}function sp(a){Uo.call(this,null,a)}t(sp,Uo);sp.prototype.j=function(a,b){Uo.prototype.j.call(this,a,b);this.w.sort(function(a,b){return b.b.$-a.b.$||a.b.index-b.b.index})};
function Lo(a,b){Uo.call(this,a,b);this.F=this}t(Lo,Uo);Lo.prototype.X=function(a){var b=this.b.g;b.W&&(a=lc(b.f,a,b.W));return a};Lo.prototype.Z=function(){};function No(a,b){Uo.call(this,a,b);this.F=a.F}t(No,Uo);function Po(a,b){Uo.call(this,a,b);this.F=a.F}t(Po,Uo);function tp(a,b,c,d){var e=null;c instanceof Bc&&(e=[c]);c instanceof sc&&(e=c.values);if(e)for(a=a.b.f,c=0;c<e.length;c++)if(e[c]instanceof Bc){var f=qb(e[c].name,"enabled"),f=new fc(a,f);d&&(f=new Ob(a,f));b=lc(a,b,f)}return b}
Po.prototype.X=function(a){var b=this.b.f,c=this.style,d=To(b,c.required,b.h)!==b.h;if(d||this.g){var e;e=(e=c["flow-from"])?e.ra(b,b.b):new tb(b,"body");e=new hc(b,"has-content",[e]);a=lc(b,a,e)}a=tp(this,a,c["required-partitions"],!1);a=tp(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.ra(b,null):b.j,c=lc(b,c,a),this.F.style.enabled=new E(c));return a};Po.prototype.Ob=function(a,b,c,d,e){v(b.element,"overflow","hidden");Uo.prototype.Ob.call(this,a,b,c,d,e)};
function up(a,b,c,d){kf.call(this,a,b,!1);this.target=c;this.b=d}t(up,lf);up.prototype.rb=function(a,b,c){hh(this.b,a,b,c,this)};up.prototype.od=function(a,b){mf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};up.prototype.Bc=function(a,b){mf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};up.prototype.sb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function vp(a,b,c,d){up.call(this,a,b,c,d)}t(vp,up);
function wp(a,b,c,d){up.call(this,a,b,c,d);c.b.width=new V(Cd,0);c.b.height=new V(Cd,0)}t(wp,up);wp.prototype.Mc=function(a,b,c){a=new Oo(this.f,a,b,c,this.target);jf(this.ka,new vp(this.f,this.ka,a,this.b))};wp.prototype.Lc=function(a,b,c){a=new Mo(this.f,a,b,c,this.target);a=new wp(this.f,this.ka,a,this.b);jf(this.ka,a)};function xp(a,b,c,d){up.call(this,a,b,c,d)}t(xp,up);xp.prototype.Mc=function(a,b,c){a=new Oo(this.f,a,b,c,this.target);jf(this.ka,new vp(this.f,this.ka,a,this.b))};
xp.prototype.Lc=function(a,b,c){a=new Mo(this.f,a,b,c,this.target);a=new wp(this.f,this.ka,a,this.b);jf(this.ka,a)};function yp(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function fl(a,b,c,d){if(a!==F)if(b===Ic||b===Yc)c=F,a=yp(a);else if(c&&c!==F||d)a=yp(a);return{display:a,position:b,gb:c}}
function zp(a,b,c,d,e,f,g){e=e||f||ad;return!!g||!!c&&c!==F||b===Ic||b===Yc||a===dd||a===vd||a===ud||a==Zc||(a===Mc||a===id)&&!!d&&d!==Ad||!!f&&e!==f};function Ap(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.Oc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.Oc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.Oc(e,b)})};var Bp={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},Cp={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},Dp={"margin-top":"0px"},Ep={"margin-right":"0px"},Fp={};
function Gp(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Hp=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Ip="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Jp(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
Jp.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),Qk(d)&&d.ba(new Pk(a,this.f,d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new V(new Dc(a),0)}return c};
function Kp(a,b,c,d,e,f,g,h,l,k,m,n,r){this.C=a;this.b=b;this.viewport=c;this.w=c.b;this.j=d;this.G=e;this.ea=f;this.F=g;this.l=h;this.H=l;this.page=k;this.f=m;this.A=n;this.g=r;this.J=this.B=null;this.h=!1;this.S=null;this.ia=0;this.D=null}Kp.prototype.clone=function(){return new Kp(this.C,this.b,this.viewport,this.j,this.G,this.ea,this.F,this.l,this.H,this.page,this.f,this.A,this.g)};
function Lp(a,b,c,d,e,f){var g=I("createRefShadow");a.ea.w.load(b).then(function(h){if(h){var l=zj(h,b);if(l){var k=a.H,m=k.H[h.url];if(!m){var m=k.style.l.f[h.url],n=new Ab(0,k.Nb(),k.Mb(),k.w),m=new kl(h,m.g,m.f,n,k.l,m.w,new oo(k.j,h.url),new no(k.j,h.url,m.f,m.b));k.H[h.url]=m}f=new mk(d,l,h,e,f,c,m)}}O(g,f)});return M(g)}
function Mp(a,b,c,d,e,f,g,h){var l=I("createShadows"),k=e.template,m;k instanceof Fc?m=Lp(a,k.url,2,b,h,null):m=L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var n=b.getAttribute("href"),z=null;n?z=h?h.ea:a.ea:h&&(n="http://www.w3.org/1999/xhtml"==h.ka.namespaceURI?h.ka.getAttribute("href"):h.ka.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.Md?h.Md.ea:a.ea);n&&(n=oa(n,z.url),m=Lp(a,n,3,b,h,k))}m||(m=L(k));var y=null;
m.then(function(c){e.display===vd?y=Lp(a,oa("user-agent.xml#table-cell",na),2,b,h,c):y=L(c)});y.then(function(k){var m;if(m=d._pseudos){for(var n=[],r=Hp.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=r,y=0;y<Ip.length;y++){var z=Ip[y],A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.h))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===cd))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===kd||A===F)continue;n.push(z);A=Hp.createElementNS("http://www.w3.org/1999/xhtml",
"span");A.setAttribute("data-adapt-pseudo",z)}else A=Hp.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(A);z.match(/^first-/)&&(q=A)}k=n.length?new mk(b,r,null,h,k,2,new Jp(b,d,f,g)):k}O(l,k)})});return M(l)}function an(a,b,c){a.J=b;a.h=c}
function Np(a,b,c,d){var e=a.b;c=lj(c,e,a.G,a.h);b=kj(c,e,b);mj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=El(a.F,d));return d});var f=fl(d.display||cd,d.position,d["float"],a.S===a.ea.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Op(a,b){for(var c=a.B.S,d=[],e=null,f=a.B.qa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.j).l(c,!1);d.push(l);e=e||Ba(c)}h?(c=f.ka,f=f.Md):(c=c.parentNode,g++)}c=Cb(a.b,"em",!g);c={"font-size":new V(new D(c,"px"),0)};f=new Fh(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)jh[k]&&l.push(k);l.sort(Hd);for(var m=0;m<l.length;m++){var n=l[m];f.f=n;var r=h[n];r.value!==bd&&(c[n]=r.Wc(f))}}for(var q in b)jh[q]||(c[q]=b[q]);return{lang:e,Ua:c}}
var Pp={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Qp(a,b){b=oa(b,a.ea.url);return a.A[b]||b}function Rp(a){a.B.lang=Ba(a.B.S)||a.B.parent&&a.B.parent.lang||a.B.lang}
function Sp(a,b){var c=lh().filter(function(a){return b[a]});if(c.length){var d=a.B.qb;if(a.B.parent){var d=a.B.qb={},e;for(e in a.B.parent.qb)d[e]=a.B.parent.qb[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Dc)d[a]=c.I;else if(c instanceof Bc)d[a]=c.name;else if(c instanceof D)switch(c.ga){case "dpi":case "dpcm":case "dppx":d[a]=c.I*yb[c.ga]}else d[a]=c;delete b[a]}})}}
function Tp(a,b,c,d,e,f){for(var g=Ld("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.L=l;break}}}
function Up(a,b,c){var d=!0,e=I("createElementView"),f=a.S,g=a.B.qa?a.B.qa.b:a.j,h=g.l(f,!1),l={};if(!a.B.parent){var k=Op(a,h),h=k.Ua;a.B.lang=k.lang}var m=h["float-reference"]&&Rl(h["float-reference"].value.toString());a.B.parent&&m&&Sl(m)&&(k=Op(a,h),h=k.Ua,a.B.lang=k.lang);a.B.u=Np(a,a.B.u,h,l);Sp(a,l);Rp(a);l.direction&&(a.B.ja=l.direction.toString());if((k=l["flow-into"])&&k.toString()!=a.C)return O(e,!1),M(e);var n=l.display;if(n===F)return O(e,!1),M(e);var r=!a.B.parent;a.B.G=n===Zc;Mp(a,
f,r,h,l,g,a.b,a.B.qa).then(function(g){a.B.Aa=g;g=l.position;var k=l["float"],q=l.clear,A=a.B.u?zd:ad,H=a.B.parent?a.B.parent.u?zd:ad:A,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.B.zc=zp(n,g,k,l.overflow,A,H,G);a.B.J=g===od||g===Ic||g===Yc;uk(a.B)&&(q=null,k===$c||m&&Sl(m)||(k=null));A=k===hd||k===pd||k===wd||k===Qc||k===fd||k===ed||k===Oc||k===Nc||k===$c;k&&(delete l["float"],k===$c&&(a.h?(A=!1,l.display=Mc):l.display=cd));q&&(q===bd&&a.B.parent&&a.B.parent.A&&(q=C(a.B.parent.A)),
q===hd||q===pd||q===Pc)&&(delete l.clear,l.display&&l.display!=cd&&(a.B.A=q.toString()));var J=n===id&&l["ua-list-item-count"];(A||l["break-inside"]&&l["break-inside"]!==Lc)&&a.B.l++;if(!(q=!A&&!n))a:switch(n.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":q=!0;break a;default:q=!1}if(!q)a:switch(n.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":q=!0;break a;
default:q=!1}a.B.Da=q;a.B.display=n?n.toString():"inline";a.B.j=A?k.toString():null;a.B.H=m||ok;a.B.V=l["column-span"];if(!a.B.Da){if(q=l["break-after"])a.B.F=q.toString();if(q=l["break-before"])a.B.g=q.toString()}a.B.O=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.B.X=l["caption-side"]&&l["caption-side"].toString()||"top";q=l["border-collapse"];if(!q||q===C("separate"))if(A=l["border-spacing"])A.Zc()?(q=A.values[0],A=A.values[1]):q=A,q.Yb()&&(a.B.Z=Hc(q,a.b)),A.Yb()&&(a.B.sd=
Hc(A,a.b));if(q=l["x-first-pseudo"])a.B.f=new nk(a.B.parent?a.B.parent.f:null,q.I);if(q=l["white-space"])q=Zj(q.toString()),null!==q&&(a.B.Tb=q);(q=l["hyphenate-character"])&&q!==Lc&&(a.B.h=q.mc);q=l["overflow-wrap"]||["word-wrap"];a.B.w=l["word-break"]===Sc||q===Tc;Tp(a.B,b,n,g,k,r);a.B.parent&&a.B.parent.L&&(b=a.B.parent.L.Ie(a.B,b));var K=!1,Pa=null,Ca=[],ua=f.namespaceURI,N=f.localName;if("http://www.w3.org/1999/xhtml"==ua)"html"==N||"body"==N||"script"==N||"link"==N||"meta"==N?N="div":"vide_"==
N?N="video":"audi_"==N?N="audio":"object"==N&&(K=!!a.f),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(N="img");else if("http://www.idpf.org/2007/ops"==ua)N="span",ua="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ua){ua="http://www.w3.org/1999/xhtml";if("image"==N){if(N="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=zj(a.ea,g)))Pa=Vp(a,ua,"img"),g="data:"+(g.getAttribute("content-type")||
"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),Ca.push(ne(Pa,g))}else N=Pp[N];N||(N=a.B.Da?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ua)if(ua="http://www.w3.org/1999/xhtml","ncx"==N||"navPoint"==N)N="div";else if("navLabel"==N){if(N="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(q=k,"http://www.daisy.org/z3986/2005/ncx/"==q.namespaceURI&&"content"==q.localName)){g=q.getAttribute("src");break}g&&(N="a",f=f.ownerDocument.createElementNS(ua,
"a"),f.setAttribute("href",g))}}else N="span";else"http://www.pyroxy.com/ns/shadow"==ua?(ua="http://www.w3.org/1999/xhtml",N=a.B.Da?"span":"div"):K=!!a.f;J?b?N="li":(N="div",n=Mc,l.display=n):"body"==N||"li"==N?N="div":"q"==N?N="span":"a"==N&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(N="span");l.behavior&&"none"!=l.behavior.toString()&&a.f&&(K=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(K=!0);var Xa;K?Xa=a.f(f,a.B.parent?a.B.parent.D:null,l):Xa=L(null);Xa.then(function(g){g?K&&(d=
"true"==g.getAttribute("data-adapt-process-children")):g=Vp(a,ua,N);"a"==N&&g.addEventListener("click",a.page.J,!1);Pa&&(Cn(a,a.B,"inner",Pa),g.appendChild(Pa));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Gp(g);var h=a.B.qb["image-resolution"],k=[],m=l.width,n=l.height,r=f.getAttribute("width"),q=f.getAttribute("height"),m=m===Lc||!m&&!r,n=n===Lc||!n&&!q;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==N){for(var r=f.attributes,z=r.length,q=null,y=
0;y<z;y++){var A=r[y],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==G&&(A=Qp(a,A));else{if(G.match(/^on/))continue;if("style"==G)continue;if(("id"==G||"name"==G)&&b){A=a.g.Rd(A,a.ea.url);g.setAttribute(G,A);Wj(a.page,g,A);continue}"src"==G||"href"==G||"poster"==G?(A=Qp(a,A),"href"===G&&(A=a.g.Oc(A,a.ea.url))):"srcset"==G&&(A=A.split(",").map(function(b){return Qp(a,b.trim())}).join(","));if("poster"===
G&&"video"===N&&"http://www.w3.org/1999/xhtml"===ua&&m&&n){var Xa=new Image,yc=ne(Xa,A);Ca.push(yc);k.push({Ee:Xa,element:g,Be:yc})}}"http://www.w3.org/2000/svg"==ua&&/^[A-Z\-]+$/.test(G)&&(G=G.toLowerCase());-1!=Wp.indexOf(G.toLowerCase())&&(A=Ap(A,a.ea.url,a.g));H&&(Xa=Fp[H])&&(G=Xa+":"+G);"src"!=G||H||"img"!=N&&"input"!=N||"http://www.w3.org/1999/xhtml"!=ua?"href"==G&&"image"==N&&"http://www.w3.org/2000/svg"==ua&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(ne(g,A)):H?g.setAttributeNS(H,G,A):
g.setAttribute(G,A):q=A}q&&(Xa="input"===N?new Image:g,r=ne(Xa,q),Xa!==g&&(g.src=q),m||n?(m&&n&&h&&1!==h&&k.push({Ee:Xa,element:g,Be:r}),Ca.push(r)):a.page.j.push(r))}delete l.content;(m=l["list-style-image"])&&m instanceof Fc&&(m=m.url,Ca.push(ne(new Image,m)));Xp(a,l);Yp(a,g,l);if(!a.B.Da&&(m=null,b?c&&(m=a.B.u?Ep:Dp):m="clone"!==a.B.qb["box-decoration-break"]?a.B.u?Cp:Bp:a.B.u?Ep:Dp,m))for(var Nn in m)v(g,Nn,m[Nn]);J&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.D=g;Ca.length?
me(Ca).then(function(){0<h&&Zp(a,k,h,l,a.B.u);O(e,d)}):fe().then(function(){O(e,d)})})});return M(e)}var Wp="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Zp(a,b,c,d,e){b.forEach(function(b){if("load"===b.Be.get().get()){var f=b.Ee,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Rc&&(d["border-left-style"]!==F&&(h+=Hc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Hc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Hc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Hc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?v(b,"max-width",
h+"px"):l!==F&&k===F?v(b,"width",h+"px"):l===F&&k!==F?v(b,"height",f+"px"):"%"!==l.ga?v(b,"max-width",Math.min(h,Hc(l,a.b))+"px"):"%"!==k.ga?v(b,"max-height",Math.min(f,Hc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Fd,k=d["min-height"]||Fd,l.I||k.I?l.I&&!k.I?v(b,"width",h+"px"):!l.I&&k.I?v(b,"height",f+"px"):"%"!==l.ga?v(b,"min-width",Math.max(h,Hc(l,a.b))+"px"):"%"!==k.ga?v(b,"min-height",Math.max(f,Hc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+
"px"):v(b,"min-width",h+"px"))}})}function Xp(a,b){Ld("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.B,b)})}function $p(a){var b=I("createTextNodeView");aq(a).then(function(){var c=a.ia||0,c=bq(a.B.La).substr(c);a.D=document.createTextNode(c);O(b,!0)});return M(b)}
function aq(a){if(a.B.La)return L(!0);var b,c=b=a.S.textContent,d=I("preprocessTextContent"),e=Ld("PREPROCESS_TEXT_CONTENT"),f=0;he(function(){return f>=e.length?L(!1):e[f++](a.B,c).oa(function(a){c=a;return L(!0)})}).then(function(){a.B.La=cq(b,c,0);O(d,!0)});return M(d)}
function dq(a,b,c){var d=I("createNodeView"),e=!0;1==a.S.nodeType?b=Up(a,b,c):8==a.S.nodeType?(a.D=null,b=L(!0)):b=$p(a);b.then(function(b){e=b;(a.B.D=a.D)&&(b=a.B.parent?a.B.parent.D:a.J)&&b.appendChild(a.D);O(d,e)});return M(d)}function bn(a,b,c,d){(a.B=b)?(a.S=b.S,a.ia=b.ia):(a.S=null,a.ia=-1);a.D=null;return a.B?dq(a,c,!!d):L(!0)}
function eq(a){if(null==a.qa||"content"!=a.S.localName||"http://www.pyroxy.com/ns/shadow"!=a.S.namespaceURI)return a;var b=a.pa,c=a.qa,d=a.parent,e,f;c.pe?(f=c.pe,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Md,e=c.ka.firstChild,c=2);var g=a.S.nextSibling;g?(a.S=g,pk(a)):a.va?a=a.va:e?a=null:(a=a.parent.modify(),a.M=!0);if(e)return b=new kk(e,d,b),b.qa=f,b.Wa=c,b.va=a,b;a.pa=b;return a}
function fq(a){var b=a.pa+1;if(a.M){if(!a.parent)return null;if(3!=a.Wa){var c=a.S.nextSibling;if(c)return a=a.modify(),a.pa=b,a.S=c,pk(a),eq(a)}if(a.va)return a=a.va.modify(),a.pa=b,a;a=a.parent.modify()}else{if(a.Aa&&(c=a.Aa.root,2==a.Aa.type&&(c=c.firstChild),c))return b=new kk(c,a,b),b.qa=a.Aa,b.Wa=a.Aa.type,eq(b);if(c=a.S.firstChild)return eq(new kk(c,a,b));1!=a.S.nodeType&&(c=bq(a.La),b+=c.length-1-a.ia);a=a.modify()}a.pa=b;a.M=!0;return a}
function hn(a,b,c){b=fq(b);if(!b||b.M)return L(b);var d=I("nextInTree");bn(a,b,!0,c).then(function(a){b.D&&a||(b=b.modify(),b.M=!0,b.D||(b.Da=!0));O(d,b)});return M(d)}function gq(a,b){if(b instanceof sc)for(var c=b.values,d=0;d<c.length;d++)gq(a,c[d]);else b instanceof Fc&&(c=b.url,a.page.j.push(ne(new Image,c)))}var hq={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Yp(a,b,c){var d=c["background-image"];d&&gq(a,d);var d=c.position===od,e;for(e in c)if(!hq[e]){var f=c[e],f=f.ba(new xg(a.ea.url,a.g));f.Yb()&&zb(f.ga)&&(f=new D(Hc(f,a.b),"px"));Oj[e]||d&&Pj[e]?a.page.w.push(new Qj(b,e,f)):v(b,e,f.toString())}}function Cn(a,b,c,d){if(!b.M){var e=(b.qa?b.qa.b:a.j).l(a.S,!1);if(e=e._pseudos)if(e=e[c])c={},b.u=Np(a,b.u,e,c),b=c.content,Qk(b)&&(b.ba(new Pk(d,a.b,b)),delete c.content),Yp(a,d,c)}}
function en(a,b,c){var d=I("peelOff"),e=b.f,f=b.ia,g=b.M;if(0<c)b.D.textContent=b.D.textContent.substr(0,c),f+=c;else if(!g&&b.D&&!f){var h=b.D.parentNode;h&&h.removeChild(b.D)}for(var l=b.pa+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),n=m.va;he(function(){for(;0<k.length;){m=k.pop();b=new kk(m.S,b,l);k.length||(b.ia=f,b.M=g);b.Wa=m.Wa;b.qa=m.qa;b.Aa=m.Aa;b.va=m.va?m.va:n;n=null;var c=bn(a,b,!1);if(c.za())return c}return L(!1)}).then(function(){O(d,b)});return M(d)}
function Vp(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.w.createElement(c):a.w.createElementNS(b,c)}function wn(a,b,c){var d={},e=a.l._pseudos;b=Np(a,b,a.l,d);if(e&&e.before){var f={},g=Vp(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Np(a,b,e.before,f);delete f.content;Yp(a,g,f)}delete d.content;Yp(a,c,d);return b}
function ko(a){a&&vk(a,function(a){var b=a.qb["box-decoration-break"];b&&"slice"!==b||(b=a.D,a.u?(v(b,"padding-left","0"),v(b,"border-left","none"),v(b,"border-top-left-radius","0"),v(b,"border-bottom-left-radius","0")):(v(b,"padding-bottom","0"),v(b,"border-bottom","none"),v(b,"border-bottom-left-radius","0"),v(b,"border-bottom-right-radius","0")))})}function iq(a){this.b=a.h;this.window=a.window}
function jq(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function Mm(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return jq(a,d)},a)}function Yj(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return jq(c,d)}function rn(a,b){return a.window.getComputedStyle(b,null)}
function kq(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=rn(new iq(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}kq.prototype.zoom=function(a,b,c){v(this.g,"width",a*c+"px");v(this.g,"height",b*c+"px");v(this.f,"width",a+"px");v(this.f,"height",b+"px");v(this.f,"transform","scale("+c+")")};var Mn="min-content inline size",Hm="fit-content inline size";
function Gm(a,b,c){function d(c){return rn(a,b).getPropertyValue(c)}function e(){v(b,"display","block");v(b,"position","static");return d(Pa)}function f(){v(b,"display","inline-block");v(G,Pa,"99999999px");var a=d(Pa);v(G,Pa,"");return a}function g(){v(b,"display","inline-block");v(G,Pa,"0");var a=d(Pa);v(G,Pa,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,n=b.style.width,r=b.style.maxWidth,q=b.style.minWidth,z=b.style.height,y=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,G=b.ownerDocument.createElement("div");v(G,"position",m);H.insertBefore(G,b);G.appendChild(b);v(b,"width","auto");v(b,"max-width","none");v(b,"min-width","0");v(b,"height","auto");v(b,"max-height","none");v(b,"min-height","0");var J=za("writing-mode"),J=(J?d(J[0]):null)||d("writing-mode"),K="vertical-rl"===J||"tb-rl"===J||"vertical-lr"===
J||"tb-lr"===J,Pa=K?"height":"width",Ca=K?"width":"height",ua={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case Mn:c=g();break;case Hm:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=K?l():e();break;case "fill-available height":c=K?e():l();break;case "max-content width":c=
K?d(Ca):f();break;case "max-content height":c=K?f():d(Ca);break;case "min-content width":c=K?d(Ca):g();break;case "min-content height":c=K?g():d(Ca);break;case "fit-content width":c=K?d(Ca):h();break;case "fit-content height":c=K?h():d(Ca)}ua[a]=parseFloat(c);v(b,"position",m);v(b,"display",k)});v(b,"width",n);v(b,"max-width",r);v(b,"min-width",q);v(b,"height",z);v(b,"max-height",y);v(b,"min-height",A);H.insertBefore(b,G);H.removeChild(G);return ua};function lq(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===yd||b!==zd&&a!==sd?"ltr":"rtl"}
var mq={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},nq=new D(.24,"pt"),oq=new D(3,"mm"),pq=new D(10,"mm"),qq=new D(13,"mm");
function rq(a){var b={width:Dd,height:Ed,Vb:Fd,Eb:Fd},c=a.size;if(c&&c.value!==Lc){var d=c.value;d.Zc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Yb())b.width=c,b.height=d||c;else if(c=mq[c.name.toLowerCase()])d&&d===gd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.Eb=qq);a=a.bleed;a&&a.value!==Lc?a.value&&a.value.Yb()&&(b.Vb=a.value):c&&(a=!1,c.value.Zc()?a=c.value.values.some(function(a){return a===Uc}):a=c.value===Uc,a&&(b.Vb=new D(6,
"pt")));return b}function sq(a,b){var c={},d=a.Vb.I*Cb(b,a.Vb.ga,!1),e=a.Eb.I*Cb(b,a.Eb.ga,!1),f=d+e,g=a.width;c.Nb=g===Dd?b.Y.Wb?b.Y.Wb.width*Cb(b,"px",!1):(b.Y.pb?Math.floor(b.Xa/2)-b.Y.jc:b.Xa)-2*f:g.I*Cb(b,g.ga,!1);g=a.height;c.Mb=g===Ed?b.Y.Wb?b.Y.Wb.height*Cb(b,"px",!1):b.Cb-2*f:g.I*Cb(b,g.ga,!1);c.Vb=d;c.Eb=e;c.xd=f;return c}function tq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function uq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var vq={Mf:"top left",Nf:"top right",zf:"bottom left",Af:"bottom right"};
function wq(a,b,c,d,e,f){var g=d;g<=e+2*yb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=tq(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=uq(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=uq(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var xq={Lf:"top",yf:"bottom",Ve:"left",We:"right"};
function yq(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=tq(a,g,f),l=uq(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=uq(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=uq(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(xq).forEach(function(a){a=
xq[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function zq(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Zc()?a.values.forEach(function(a){a===Uc?e=!0:a===Vc&&(f=!0)}):a===Uc?e=!0:a===Vc&&(f=!0);if(e||f){var g=c.K,h=g.ownerDocument,l=b.Vb,k=Hc(nq,d),m=Hc(oq,d),n=Hc(pq,d);e&&Object.keys(vq).forEach(function(a){a=wq(h,vq[a],k,n,l,m);g.appendChild(a)});f&&Object.keys(xq).forEach(function(a){a=yq(h,xq[a],k,n,m);g.appendChild(a)})}}
var Aq=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),Bq={"top-left-corner":{order:1,Ja:!0,Ga:!1,Ha:!0,Ia:!0,sa:null},"top-left":{order:2,
Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"start"},"top-center":{order:3,Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"center"},"top-right":{order:4,Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"end"},"top-right-corner":{order:5,Ja:!0,Ga:!1,Ha:!1,Ia:!0,sa:null},"right-top":{order:6,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"start"},"right-middle":{order:7,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"center"},"right-bottom":{order:8,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"end"},"bottom-right-corner":{order:9,Ja:!1,Ga:!0,Ha:!1,Ia:!0,sa:null},"bottom-right":{order:10,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"end"},
"bottom-center":{order:11,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"center"},"bottom-left":{order:12,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"start"},"bottom-left-corner":{order:13,Ja:!1,Ga:!0,Ha:!0,Ia:!1,sa:null},"left-bottom":{order:14,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"end"},"left-middle":{order:15,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"center"},"left-top":{order:16,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"start"}},Cq=Object.keys(Bq).sort(function(a,b){return Bq[a].order-Bq[b].order});
function Dq(a,b,c){Ko.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=rq(c);new Eq(this.f,this,c,a);this.C={};Fq(this,c);this.b.position=new V(od,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)Aq[d]||"background-clip"===d||(this.b[d]=c[d])}t(Dq,Ko);function Fq(a,b){var c=b._marginBoxes;c&&Cq.forEach(function(d){c[d]&&(a.C[d]=new Gq(a.f,a,d,b))})}Dq.prototype.h=function(a){return new Hq(a,this)};
function Eq(a,b,c,d){Oo.call(this,a,null,null,[],b);this.F=d;this.b["z-index"]=new V(new Dc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Ic,0);this.b.overflow=new V(Ad,0);for(var e in Aq)Aq.hasOwnProperty(e)&&(this.b[e]=c[e])}t(Eq,Oo);Eq.prototype.h=function(a){return new Iq(a,this)};
function Gq(a,b,c,d){Oo.call(this,a,null,null,[],b);this.A=c;a=d._marginBoxes[this.A];for(var e in d)if(b=d[e],c=a[e],jh[e]||c&&c.value===bd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==bd&&(this.b[e]=b)}t(Gq,Oo);Gq.prototype.h=function(a){return new Jq(a,this)};function Hq(a,b){Lo.call(this,a,b);this.l=null;this.ta={}}t(Hq,Lo);
Hq.prototype.j=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}Lo.prototype.j.call(this,a,b)};Hq.prototype.Dd=function(){var a=this.style;a.left=Fd;a["margin-left"]=Fd;a["border-left-width"]=Fd;a["padding-left"]=Fd;a["padding-right"]=Fd;a["border-right-width"]=Fd;a["margin-right"]=Fd;a.right=Fd};
Hq.prototype.Ed=function(){var a=this.style;a.top=Fd;a["margin-top"]=Fd;a["border-top-width"]=Fd;a["padding-top"]=Fd;a["padding-bottom"]=Fd;a["border-bottom-width"]=Fd;a["margin-bottom"]=Fd;a.bottom=Fd};Hq.prototype.Z=function(a,b,c){b=b.H;var d={start:this.l.marginLeft,end:this.l.marginRight,ma:this.l.gc},e={start:this.l.marginTop,end:this.l.marginBottom,ma:this.l.fc};Kq(this,b.top,!0,d,a,c);Kq(this,b.bottom,!0,d,a,c);Kq(this,b.left,!1,e,a,c);Kq(this,b.right,!1,e,a,c)};
function Lq(a,b,c,d,e){this.K=a;this.C=e;this.j=c;this.A=!Y(d,b[c?"width":"height"],new ec(d,0,"px"));this.l=null}Lq.prototype.b=function(){return this.A};function Mq(a){a.l||(a.l=Gm(a.C,a.K.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}Lq.prototype.g=function(){var a=Mq(this);return this.j?Gk(this.K)+a["max-content width"]+Hk(this.K):Ek(this.K)+a["max-content height"]+Fk(this.K)};
Lq.prototype.h=function(){var a=Mq(this);return this.j?Gk(this.K)+a["min-content width"]+Hk(this.K):Ek(this.K)+a["min-content height"]+Fk(this.K)};Lq.prototype.f=function(){return this.j?Gk(this.K)+this.K.width+Hk(this.K):Ek(this.K)+this.K.height+Fk(this.K)};function Nq(a){this.j=a}Nq.prototype.b=function(){return this.j.some(function(a){return a.b()})};Nq.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Nq.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Nq.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Oq(a,b,c,d,e,f){Lq.call(this,a,b,c,d,e);this.w=f}t(Oq,Lq);Oq.prototype.b=function(){return!1};Oq.prototype.g=function(){return this.f()};Oq.prototype.h=function(){return this.f()};Oq.prototype.f=function(){return this.j?Gk(this.K)+this.w+Hk(this.K):Ek(this.K)+this.w+Fk(this.K)};
function Kq(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b){var n=Bq[m];if(n){var r=b[m],q=a.ta[m],z=new Lq(r,q.style,c,g,f);h[n.sa]=r;l[n.sa]=q;k[n.sa]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.ma.evaluate(e);var y=Pq(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.ma);b&&(b=b.evaluate(e),y[a]>b&&(b=k[a]=new Oq(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(y=Pq(k,b),A=!1,["start","center","end"].forEach(function(a){y[a]=H[a]||y[a]}));
var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.ma);b&&(b=b.evaluate(e),y[a]<b&&(b=k[a]=new Oq(h[a],l[a].style,c,g,f,b),G[a]=b.f(),A=!0))});A&&(y=Pq(k,b),["start","center","end"].forEach(function(a){y[a]=G[a]||y[a]}));var J=a+b,K=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(K-b)/2;break;case "end":e=J-b}c?Lk(d,e,b-Gk(d)-Hk(d)):Kk(d,e,b-Ek(d)-Fk(d))}})}
function Pq(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Qq(d,g.length?new Nq(g):null,b);g.jb&&(f.center=g.jb);d=g.jb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Qq(c,e,b),c.jb&&(f.start=c.jb),c.Qc&&(f.end=c.Qc);return f}
function Qq(a,b,c){var d={jb:null,Qc:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.jb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.jb=a+(c-b)*(e-a)/(f-b):0<b&&(d.jb=c*a/b)),0<d.jb&&(d.Qc=c-d.jb)):0<e?d.jb=c:0<f&&(d.Qc=c)}else a.b()?d.jb=Math.max(c-b.f(),0):b.b()&&(d.Qc=Math.max(c-a.f(),0));else a?a.b()&&(d.jb=c):b&&b.b()&&(d.Qc=c);return d}Hq.prototype.Ob=function(a,b,c,d,e){Hq.Ue.Ob.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function Iq(a,b){Po.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.fc=this.gc=null}t(Iq,Po);
Iq.prototype.j=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);Po.prototype.j.call(this,a,b);d=this.f;c={gc:this.gc,fc:this.fc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l=c;d=d.style;d.width=new E(c.gc);d.height=new E(c.fc);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};Iq.prototype.Dd=function(){var a=Rq(this,{start:"left",end:"right",ma:"width"});this.gc=a.ue;this.marginLeft=a.Oe;this.marginRight=a.Ne};Iq.prototype.Ed=function(){var a=Rq(this,{start:"top",end:"bottom",ma:"height"});this.fc=a.ue;this.marginTop=a.Oe;this.marginBottom=a.Ne};
function Rq(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.ma,h=a.b.F[g].ra(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),n=Qo(d,c["padding-"+e],h),r=Qo(d,c["padding-"+f],h),q=So(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=So(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),y=x(d,h,w(d,w(d,q,n),w(d,z,r)));l?(y=x(d,y,l),k||m?k?m=x(d,y,k):k=x(d,y,m):m=k=mc(d,y,new tb(d,.5))):(k||(k=d.b),m||(m=d.b),l=x(d,y,w(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Fd;c["margin-"+f]=Fd;c["padding-"+e]=new E(n);c["padding-"+f]=new E(r);c["border-"+e+"-width"]=new E(q);c["border-"+f+"-width"]=new E(z);c[g]=new E(l);c["max-"+g]=new E(l);return{ue:x(d,h,w(d,k,m)),Oe:k,Ne:m}}Iq.prototype.Ob=function(a,b,c,d,e){Po.prototype.Ob.call(this,a,b,c,d,e);c.O=b.element};function Jq(a,b){Po.call(this,a,b);var c=b.A;this.l=Bq[c];a.ta[c]=this;this.xa=!0}t(Jq,Po);p=Jq.prototype;
p.Ob=function(a,b,c,d,e){var f=b.element;v(f,"display","flex");var g=bp(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(v(f,"flex-flow",this.u?"row":"column"),v(f,"justify-content",h));Po.prototype.Ob.call(this,a,b,c,d,e)};
p.sa=function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left"===e,h=g?b.gc:b.fc,l=Y(d,c[a.ma],h),g=g?b.marginLeft:b.marginTop;if("start"===this.l.sa)c[e]=new E(g);else if(l){var k=Qo(d,c["margin-"+e],h),m=Qo(d,c["margin-"+f],h),n=Qo(d,c["padding-"+e],h),r=Qo(d,c["padding-"+f],h),q=So(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=So(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=w(d,l,w(d,w(d,n,r),w(d,w(d,q,f),w(d,k,m))));switch(this.l.sa){case "center":c[e]=new E(w(d,
g,nc(d,x(d,h,l),new tb(d,2))));break;case "end":c[e]=new E(x(d,w(d,g,h),l))}}};
function Sq(a,b,c){function d(a){if(y)return y;y={ma:z?z.evaluate(a):null,$a:l?l.evaluate(a):null,ab:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[r,m,n,q].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.$a||null===y.ab)&&c+y.ma+y.$a+y.ab>b&&(null===y.$a&&(y.$a=0),null===y.ab&&(y.Sf=0));null!==y.ma&&null!==y.$a&&null!==y.ab&&(y.ab=null);null===y.ma&&null!==y.$a&&null!==y.ab?y.ma=b-c-y.$a-y.ab:null!==y.ma&&null===y.$a&&null!==y.ab?y.$a=b-c-y.ma-y.ab:null!==y.ma&&null!==y.$a&&null===y.ab?y.ab=
b-c-y.ma-y.$a:null===y.ma?(y.$a=y.ab=0,y.ma=b-c):y.$a=y.ab=(b-c-y.ma)/2;return y}var e=a.style;a=a.b.f;var f=b.Fd,g=b.Jd;b=b.ma;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=Ro(a,e["margin-"+f],h),k=Ro(a,e["margin-"+g],h),m=Qo(a,e["padding-"+f],h),n=Qo(a,e["padding-"+g],h),r=So(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),q=So(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),y=null;e[b]=new E(new vb(a,function(){var a=d(this).ma;return null===a?0:a},b));e["margin-"+
f]=new E(new vb(a,function(){var a=d(this).$a;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new vb(a,function(){var a=d(this).ab;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(w(a,c.marginLeft,c.gc)):"top"===f&&(e.top=new E(w(a,c.marginTop,c.fc)))}p.Dd=function(){var a=this.f.l;this.l.Ha?Sq(this,{Fd:"right",Jd:"left",ma:"width"},a):this.l.Ia?Sq(this,{Fd:"left",Jd:"right",ma:"width"},a):this.sa({start:"left",end:"right",ma:"width"},a)};
p.Ed=function(){var a=this.f.l;this.l.Ja?Sq(this,{Fd:"bottom",Jd:"top",ma:"height"},a):this.l.Ga?Sq(this,{Fd:"top",Jd:"bottom",ma:"height"},a):this.sa({start:"top",end:"bottom",ma:"height"},a)};p.Xc=function(a,b,c,d,e,f,g){Po.prototype.Xc.call(this,a,b,c,d,e,f,g);a=c.H;c=this.b.A;d=this.l;d.Ha||d.Ia?d.Ja||d.Ga||(d.Ha?a.left[c]=b:d.Ia&&(a.right[c]=b)):d.Ja?a.top[c]=b:d.Ga&&(a.bottom[c]=b)};
function Tq(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new fc(a,"page-number");b=new Yb(a,new dc(a,b,new tb(a,2)),a.b);c=new Ob(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===lq(this.g)?(a.values["left-page"]=b,b=new Ob(a,b),a.values["right-page"]=b):(c=new Ob(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Uq(a){var b={};Ri(a.b,[],"",b);a.b.pop();return b}
function Vq(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":Vq(a,e);c.push(d+f+(e.Va||""))}return c.sort().join("^")}function Wq(a,b,c){c=c.clone({Pb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=rq(b),e=e.Va;d.width=xh(a.f,d.width,new V(f.width,e));d.height=xh(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.j(a.b,a.g);rp(c,a.f);return c}
function Xq(a){this.b=null;this.h=a}t(Xq,W);Xq.prototype.apply=function(a){a.Z===this.h&&this.b.apply(a)};Xq.prototype.f=function(){return 3};Xq.prototype.g=function(a){this.b&&Mh(a.Ec,this.h,this.b);return!0};function Yq(a){this.b=null;this.h=a}t(Yq,W);Yq.prototype.apply=function(a){1===(new fc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Yq.prototype.f=function(){return 2};function Zq(a){this.b=null;this.h=a}t(Zq,W);
Zq.prototype.apply=function(a){(new fc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Zq.prototype.f=function(){return 1};function $q(a){this.b=null;this.h=a}t($q,W);$q.prototype.apply=function(a){(new fc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};$q.prototype.f=function(){return 1};function ar(a){this.b=null;this.h=a}t(ar,W);ar.prototype.apply=function(a){(new fc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};ar.prototype.f=function(){return 1};
function br(a){this.b=null;this.h=a}t(br,W);br.prototype.apply=function(a){(new fc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};br.prototype.f=function(){return 1};function cr(a,b){Kh.call(this,a,b,null,null)}t(cr,Kh);cr.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.$;Dh(b,c,d,a,null,null);if(d=d._marginBoxes){var c=Bh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);Dh(b,f,d[e],a,null,null)}}};
function dr(a,b,c,d,e){bj.call(this,a,b,null,c,null,d,!1);this.O=e;this.G=[];this.g="";this.C=[]}t(dr,bj);p=dr.prototype;p.kc=function(){this.tb()};p.yb=function(a,b){if(this.g=b)this.b.push(new Xq(b)),this.$+=65536};
p.Fc=function(a,b){b&&nf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.C.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Yq(this.f));this.$+=256;break;case "left":this.b.push(new Zq(this.f));this.$+=1;break;case "right":this.b.push(new $q(this.f));this.$+=1;break;case "recto":this.b.push(new ar(this.f));this.$+=1;break;case "verso":this.b.push(new br(this.f));this.$+=1;break;default:nf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function er(a){var b;a.g||a.C.length?b=[a.g].concat(a.C.sort()):b=null;a.G.push({le:b,$:a.$});a.g="";a.C=[]}p.ic=function(){er(this);bj.prototype.ic.call(this)};p.wa=function(){er(this);bj.prototype.wa.call(this)};
p.sb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.G.some(function(a){return!a.le})){bj.prototype.sb.call(this,a,b,c);var d=this.Ua[a],e=this.O;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Ah(e[b],a,d)});else if("size"===a){var f=e[""];this.G.forEach(function(b){var c=new V(d.value,d.Va+b.$);b=b.le?b.le.join(""):"";var g=e[b];g?(c=(b=g[a])?xh(null,c,b):c,Ah(g,a,c)):(g=e[b]={},Ah(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Ah(g,a,f[a])},this))},this)}}};
p.He=function(a){Mh(this.j.Ec,"*",a)};p.Me=function(a){return new cr(this.Ua,a)};p.Qd=function(a){var b=Bh(this.Ua,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);jf(this.ka,new fr(this.f,this.ka,this.w,c))};function fr(a,b,c,d){kf.call(this,a,b,!1);this.g=c;this.b=d}t(fr,lf);fr.prototype.rb=function(a,b,c){hh(this.g,a,b,c,this)};fr.prototype.Bc=function(a,b){mf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};fr.prototype.od=function(a,b){mf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
fr.prototype.sb=function(a,b,c){Ah(this.b,a,new V(b,c?ff(this):gf(this)))};var gr=new ke(function(){var a=I("uaStylesheetBase");ih.get().then(function(b){var c=oa("user-agent-base.css",na);b=new bj(null,null,null,null,null,b,!0);b.lc("UA");aj=b.j;Nf(c,b,null,null).Fa(a)});return M(a)},"uaStylesheetBaseFetcher");
function hr(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.H=e;this.j=f;this.C=a.V;this.F=g;this.h=h;this.A=l;this.G=k;this.w=a.l;xb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=ir(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.C:!1;return d&&!!c&&!jr(this,c)});wb(this.b,new vb(this.b,function(){return this.Z+this.b.page},"page-number"))}
function kr(a,b,c,d){if(a.A.length){var e=new Ab(0,b,c,d);a=a.A;for(var f={},g=0;g<a.length;g++)Dh(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=yb.em,(h?h.evaluate(e,"text-zoom"):null)===qd&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Hc(g.evaluate(e,"width"),e),e=Hc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function lr(a,b,c,d,e,f,g,h,l,k,m){Ab.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ea=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.A=this.b=this.H=this.f=this.F=null;this.C=0;this.Ab=f;this.h=new Dl(this.style.C);this.Ma={};this.X=null;this.j=m;this.Bb=new $l(null,null,null,null,null,null,null);this.V={};this.xa=null;this.vb=g;this.xb=h;this.Z=l;this.wb=k;for(var n in a.h)(b=a.h[n]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Jc?this.l[n]=!0:delete this.l[n]);
this.Sa={};this.ja=this.fa=0}t(lr,Ab);
function mr(a){var b=I("StyleInstance.init"),c=new oo(a.j,a.ea.url),d=new no(a.j,a.ea.url,a.style.f,a.style.b);a.f=new kl(a.ea,a.style.g,a.style.f,a,a.l,a.style.w,c,d);d.h=a.f;ul(a.f,a);a.H={};a.H[a.ea.url]=a.f;var e=rl(a.f);a.xa=lq(e);a.F=new sp(a.style.H);c=new Oi(a.style.g,a,c,d);a.F.j(c,e);rp(a.F,a);a.X=new Tq(c,a.style.b,a.F,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.W||d.W.evaluate(a))d=Al(d.Zb,a),d=new Bl(d),e.push(d);Jl(a.Ab,e,a.h).Fa(b);var f=a.style.G;Object.keys(f).forEach(function(a){var b=
sq(rq(f[a]),this);this.Sa[a]={width:b.Nb+2*b.xd,height:b.Mb+2*b.xd}},a);return M(b)}function vl(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new zk,a.b[b.b]=c),c.b.push(new yk(new wk({na:[{node:b.element,Wa:ik,qa:null,Aa:null,va:null}],ia:0,M:!1,La:null}),b))}function nr(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Ba,f=e.na[0].node,g=e.ia,h=e.M,l=0;f.ownerDocument!=a.ea.b;)l++,f=e.na[l].node,h=!1,g=0;e=vj(a.ea,f,g,h);e<c&&(c=e)}return c}
function or(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.J=e;for(var g=0;null!=f.J&&(g+=5E3,sl(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=nr(a,f),f<d&&(d=f))}return d}function ir(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new fc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function pr(a,b){var c=a.b,d=or(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.b.Pb){var h=1,l=bp(f,a,"utilization");l&&l.he()&&(h=l.I);var l=Cb(a,"em",!1),k=a.Nb()*a.Mb();a.C=sl(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var n=m.b[0].b;if(nr(h,m)===n.f){a:switch(n=m.g,n){case "left":case "right":case "recto":case "verso":break a;default:n=null}m.g=Ll(bl(n,m.b[0].b.g))}}}a.A=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],n=m.b.length-1;0<=n;n--){var r=m.b[n];0>r.b.hb&&r.b.f<h.C&&(r.b.hb=l)}Bb(a,a.style.b);h=bp(f,a,"enabled");if(!h||h===Bd){c=a;u.debug("Location - page",c.b.page);u.debug("  current:",d);u.debug("  lookup:",c.C);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)u.debug("  Chunk",d+":",e.b[g].b.f);d=a.X;e=f;f=b;c=e.b;Object.keys(f).length?(e=c,g=Vq(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Pb?(c=d,f=(new Dq(c.l,c.h.b,
f)).h(c.h),f.j(c.b,c.g),rp(f,c.f),g=f):g=Wq(d,f,c),d.j[e]=g),f=g.b,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function jr(a,b){var c=a.A.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=La(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.A.b[d],g=nr(a,d);return c<g?!1:g<c?!0:!ir(a,d.g)}return!1}function qr(a,b,c){a=a.b.f[c];a.L||(a.L=new Xm(null));b.Vd=a.L}
function rr(a){var b=a.f,c=qm(b),d=I("layoutDeferredPageFloats"),e=!1,f=0;ie(function(d){if(f===c.length||sm(b))Q(d);else{var g=c[f++],l=g.gb;mm(b,l)?P(d):In(a,g.b,l).then(function(a){a?(a=xm(b.parent))?Q(d):(xm(b)&&!a&&(e=!0,b.Cc=!1),P(d)):P(d)})}}).then(function(){e&&km(b);O(d,!0)});return M(d)}
function sr(a,b,c){var d=a.b.b[c];if(!d||!ir(a,d.g))return L(!0);d.g="any";qr(a,b,c);xn(b);a.l[c]&&0<b.J.length&&(b.Bb=!1);var e=I("layoutColumn");rr(b).then(function(){if(xm(b.f))O(e,!0);else{var c=[],g=[],h=!0;ie(function(e){for(;0<d.b.length-g.length;){for(var f=0;0<=g.indexOf(f);)f++;var l=d.b[f];if(l.b.f>a.C||jr(a,l.b))break;for(var n=f+1;n<d.b.length;n++)if(!(0<=g.indexOf(n))){var r=d.b[n];if(r.b.f>a.C||jr(a,r.b))break;dk(r.b,l.b)&&(l=r,f=n)}var q=l.b,z=!0;An(b,l.f,h,d.f).then(function(a){if(xm(b.f))Q(e);
else if(h=!1,!l.b.nf||a&&!q.h||c.push(f),q.h)g.push(f),Q(e);else{var k=!!a||!!b.j,m;0<um(b.f).length&&b.Ma?a?(m=a.clone(),m.Ba=b.Ma):m=new wk(b.Ma):m=null;if(b.j&&m)l.f=m,d.f=b.j,b.j=null;else{g.push(f);if(a||m)l.f=a||m,c.push(f);b.j&&(d.g=Ll(b.j))}k?Q(e):z?z=!1:P(e)}});if(z){z=!1;return}}Q(e)}).then(function(){if(!xm(b.f)){d.b=d.b.filter(function(a,b){return 0<=c.indexOf(b)||0>g.indexOf(b)});"column"===d.f&&(d.f=null);var a=Jm(b.f);Fn(b,a)}O(e,!0)})}});return M(e)}
function tr(a,b,c,d,e,f,g,h,l,k,m,n,r,q,z){var y=b.u?b.h&&b.O:b.g&&b.V,A=f.element,H=new $l(l,"column",null,h,null,null,null),G=a.b.clone(),J=I("createAndLayoutColumn"),K;ie(function(b){if(1<k){var J=a.viewport.b.createElement("div");v(J,"position","absolute");A.appendChild(J);K=new Ym(J,q,a.g,z,H);K.u=f.u;K.Xa=f.Xa;K.xb=f.xb;f.u?(J=g*(n+m)+f.A,Lk(K,f.w,f.width),Kk(K,J,n)):(J=g*(n+m)+f.w,Kk(K,f.A,f.height),Lk(K,J,n));K.bb=c;K.cb=d}else K=new Ym(A,q,a.g,z,H),Jk(K,f);K.Ib=y?[]:e.concat();K.xa=r;dm(H,
K);0<=K.width?sr(a,K,h).then(function(){xm(H)||vm(H);xm(K.f)&&!xm(l)?(K.f.Cc=!1,a.b=G.clone(),K.element!==A&&A.removeChild(K.element),P(b)):Q(b)}):(vm(H),Q(b))}).then(function(){O(J,K)});return M(J)}function ur(a,b,c,d,e){var f=bp(c,a,"writing-mode")||null;a=bp(c,a,"direction")||null;return new $l(b,"region",d,e,null,f,a)}
function vr(a,b,c,d,e,f,g,h){Vo(c);var l=bp(c,a,"enabled");if(l&&l!==Bd)return L(!0);var k=I("layoutContainer"),m=bp(c,a,"wrap-flow")===Lc,l=bp(c,a,"flow-from"),n=a.viewport.b.createElement("div"),r=bp(c,a,"position");v(n,"position",r?r.name:"absolute");d.insertBefore(n,d.firstChild);var q=new Dk(n);q.u=c.u;q.Ib=g;c.Ob(a,q,b,a.h,a.g);q.bb=e;q.cb=f;e+=q.left+q.marginLeft+q.borderLeft;f+=q.top+q.marginTop+q.borderTop;(c instanceof Iq||c instanceof Lo&&!(c instanceof Hq))&&dm(h,q);var z=a.b.clone(),
y=!1;if(l&&l.Je())if(a.V[l.toString()])xm(h)||c.Xc(a,q,b,null,1,a.g,a.h),l=L(!0);else{var A=I("layoutContainer.inner"),H=l.toString(),G=ur(a,h,c,q,H),J=Z(c,a,"column-count"),K=Z(c,a,"column-gap"),Pa=1<J?Z(c,a,"column-width"):q.width,l=ap(c,a),Ca=0,r=bp(c,a,"shape-inside"),ua=ug(r,0,0,q.width,q.height,a),N=new Kp(H,a,a.viewport,a.f,l,a.ea,a.h,a.style.F,a,b,a.vb,a.xb,a.wb),Xa=new mo(a.j,a.b.page-1),yc=0,zc=null;ie(function(b){tr(a,c,e,f,g,q,yc++,H,G,J,K,Pa,ua,N,Xa).then(function(c){xm(h)?Q(b):(yc!==
J||xm(G)||vm(G),xm(G)?(yc=0,a.b=z.clone(),G.Cc=!1,P(b)):(zc=c,zc.j&&"column"!=zc.j&&(yc=J,"region"!=zc.j&&(a.V[H]=!0)),Ca=Math.max(Ca,zc.la),yc<J?P(b):Q(b)))})}).then(function(){if(!xm(h)){zc.element===n&&(q=zc);q.la=Ca;c.Xc(a,q,b,zc,J,a.g,a.h);var d=a.b.b[H];d&&"region"===d.f&&(d.f=null)}O(A,!0)});l=M(A)}else{if((l=bp(c,a,"content"))&&Qk(l)){r="span";l.url&&(r="img");var Lj=a.viewport.b.createElement(r);l.ba(new Pk(Lj,a,l));n.appendChild(Lj);"img"==r&&qp(c,a,Lj,a.h);pp(c,a,q,a.h)}else c.xa&&(d.removeChild(n),
y=!0);y||c.Xc(a,q,b,null,1,a.g,a.h);l=L(!0)}l.then(function(){if(xm(h))O(k,!0);else{if(!c.g||0<Math.floor(q.la)){if(!y&&!m){var l=bp(c,a,"shape-outside"),l=q.zd(l,a);g.push(l)}}else if(!c.w.length){d.removeChild(n);O(k,!0);return}var r=c.w.length-1;he(function(){for(;0<=r;){var d=c.w[r--],d=vr(a,b,d,n,e,f,g,h);if(d.za())return d.oa(function(){return L(!xm(h))});if(xm(h))break}return L(!1)}).then(function(){O(k,!0)})}});return M(k)}
function wr(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.b.hb&&f.b.hb+f.b.l-1<=b&&d.b.splice(e,1)}}function xr(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function yr(a,b,c){a.V={};c?(a.b=c.clone(),nl(a.f,c.g)):(a.b=new Bk,nl(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;Bb(a,a.style.b);a.A=c.clone();var d=Uq(a.X),e=pr(a,d);if(!e)return L(null);Uj(b,e.b.b.width.value===Dd);Vj(b,e.b.b.height.value===Ed);a.j.j=b;yo(a.j,d,a);var f=sq(rq(d),a);zr(a,f,b);zq(d,f,b,a);var g=f.Eb+f.Vb,d=bp(e,a,"writing-mode")||ad,f=bp(e,a,"direction")||jd,h=new $l(a.Bb,"page",null,null,null,d,f),l=I("layoutNextPage");ie(function(c){vr(a,b,e,b.g,g,g,[],h).then(function(){xm(h)||
vm(h);xm(h)?(a.b=a.A.clone(),h.Cc=!1,P(c)):Q(c)})}).then(function(){e.Z(a,b,a.g);var d=new fc(e.b.f,"left-page");b.l=d.evaluate(a)?"left":"right";wr(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&ir(a,d)||(b.f=null)});a.b=a.A=null;c.g=a.f.b;Xj(b,a.style.l.O[a.ea.url],a.g);xr(a,c)&&(c=null);O(l,c)});return M(l)}
function zr(a,b,c){a.O=b.Nb;a.J=b.Mb;a.ja=b.Nb+2*b.xd;a.fa=b.Mb+2*b.xd;c.K.style.width=a.ja+"px";c.K.style.height=a.fa+"px";c.g.style.left=b.Eb+"px";c.g.style.right=b.Eb+"px";c.g.style.top=b.Eb+"px";c.g.style.bottom=b.Eb+"px";c.g.style.padding=b.Vb+"px"}function Ar(a,b,c,d){bj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.C=!1}t(Ar,bj);p=Ar.prototype;p.kd=function(){};p.jd=function(a,b,c){a=new Ko(this.g.w,a,b,c,this.g.G,this.W,gf(this.ka));jf(this.g,new xp(a.f,this.g,a,this.w))};
p.bc=function(a){a=a.b;this.W&&(a=lc(this.f,this.W,a));jf(this.g,new Ar(this.g,a,this,this.F))};p.fd=function(){jf(this.g,new hj(this.f,this.ka))};p.hd=function(){var a={};this.g.A.push({Zb:a,W:this.W});jf(this.g,new ij(this.f,this.ka,null,a,this.g.h))};p.gd=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);jf(this.g,new ij(this.f,this.ka,null,b,this.g.h))};p.md=function(){var a={};this.g.H.push(a);jf(this.g,new ij(this.f,this.ka,this.W,a,this.g.h))};
p.Jc=function(a){var b=this.g.C;if(a){var c=Bh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}jf(this.g,new ij(this.f,this.ka,null,b,this.g.h))};p.ld=function(){this.C=!0;this.tb()};p.kc=function(){var a=new dr(this.g.w,this.g,this,this.w,this.g.F);jf(this.g,a);a.kc()};p.wa=function(){bj.prototype.wa.call(this);if(this.C){this.C=!1;var a="R"+this.g.O++,b=C(a),c;this.W?c=new wh(b,0,this.W):c=new V(b,0);Ch(this.Ua,"region-id").push(c);this.Hb();a=new Ar(this.g,this.W,this,a);jf(this.g,a);a.wa()}};
function Br(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Cr(a){hf.call(this);this.h=a;this.j=new sb(null);this.w=new sb(this.j);this.G=new Ho(this.j);this.J=new Ar(this,null,null,null);this.O=0;this.A=[];this.C={};this.l={};this.H=[];this.F={};this.b=this.J}t(Cr,hf);
Cr.prototype.error=function(a){u.b("CSS parser:",a)};function Dr(a,b){return Er(b,a)}function Fr(a){af.call(this,Dr,"document");this.V=a;this.H={};this.w={};this.f={};this.O={};this.l=null;this.b=[];this.J=!1}t(Fr,af);function Gr(a,b,c){Hr(a,b,c);var d=oa("user-agent.xml",na),e=I("OPSDocStore.init");ih.get().then(function(b){a.l=b;gr.get().then(function(){a.load(d).then(function(){a.J=!0;O(e,!0)})})});return M(e)}function Hr(a,b,c){a.b.splice(0);b&&b.forEach(a.X,a);c&&c.forEach(a.Z,a)}
Fr.prototype.X=function(a){this.b.push({url:a.url,text:a.text,Za:"Author",Ca:null,media:null})};Fr.prototype.Z=function(a){this.b.push({url:a.url,text:a.text,Za:"User",Ca:null,media:null})};
function Er(a,b){var c=I("OPSDocStore.load"),d=b.url;Dj(b,a).then(function(b){if(b){if(a.J)for(var e=Ld("PREPROCESS_SINGLE_DOCUMENT"),g=0;g<e.length;g++)e[g](b.b);for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g<h.length;g++){var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),n=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&n&&l&&e.push({kf:k,event:m,action:n,
Hc:l})}a.O[d]=e;var r=[];r.push({url:oa("user-agent-page.css",na),text:null,Za:"UA",Ca:null,media:null});if(g=b.l)for(g=g.firstChild;g;g=g.nextSibling)if(1==g.nodeType)if(e=g,h=e.namespaceURI,k=e.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)r.push({url:d,text:e.textContent,Za:"Author",Ca:null,media:null});else if("link"==k){if(m=e.getAttribute("rel"),h=e.getAttribute("class"),k=e.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)e=e.getAttribute("href"),e=oa(e,d),r.push({url:e,
text:null,Ca:h,media:k,Za:"Author"})}else"meta"==k&&"viewport"==e.getAttribute("name")&&r.push({url:d,text:Br(e),Za:"Author",Ca:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==e.getAttribute("type")&&r.push({url:d,text:e.textContent,Za:"Author",Ca:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=e.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(e=e.getElementsByTagName("value")[0])&&(e=oa(e.textContent,d),r.push({url:e,
text:null,Ca:null,media:null,Za:"Author"}));for(g=0;g<a.b.length;g++)r.push(a.b[g]);for(var q="",g=0;g<r.length;g++)q+=r[g].url,q+="^",r[g].text&&(q+=r[g].text),q+="^";var z=a.H[q];z?(a.f[d]=z,O(c,b)):(g=a.w[q],g||(g=new ke(function(){var b=I("fetchStylesheet"),c=0,d=new Cr(a.l);he(function(){if(c<r.length){var a=r[c++];d.lc(a.Za);return null!==a.text?Of(a.text,d,a.url,a.Ca,a.media).nd(!0):Nf(a.url,d,a.Ca,a.media)}return L(!1)}).then(function(){z=new hr(a,d.j,d.w,d.J.j,d.G,d.A,d.C,d.l,d.H,d.F);a.H[q]=
z;delete a.w[q];O(b,z)});return M(b)},"FetchStylesheet "+d),a.w[q]=g,g.start()),g.get().then(function(e){a.f[d]=e;O(c,b)}))}else O(c,null)});return M(c)};function Ir(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Jr(a){var b=new Da;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ir(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Kr(a){a=Jr(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Lr(a){a=Jr(a);for(var b=new Da,c=0;c<a.length;c++)b.append(Ir(a[c]));a=b.toString();b=new Da;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Mr(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.Y=kb(f);this.w=g;this.j=h;this.h=l;this.g=k;this.Qa=this.page=null}function Nr(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Aa(d,"height","auto")&&(v(d,"height","auto"),Nr(a,d,c));"absolute"==Aa(d,"position","static")&&(v(d,"position","relative"),Nr(a,d,c))}}
function Or(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Mr.prototype.Gd=function(a){var b=this.w.Gd(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",v(e,"cursor","pointer"),e.addEventListener("click",Or,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",v(e,"margin-left","-1em"),v(e,"display","inline-block"),v(e,"width","1em"),v(e,"text-align","left"),v(e,"cursor","default"),v(e,"font-family","Menlo,sans-serif"),g.appendChild(e),v(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||v(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return L(g)}};
Mr.prototype.ed=function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=I("showTOC"),h=new Tj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=kr(k,c,1E5,e);b=new kq(b.window,l.fontSize,b.root,l.width,l.height);var n=new lr(k,d,f.lang,b,f.f,f.l,f.Gd(d),f.j,0,f.h,f.g);f.Qa=n;n.Y=f.Y;mr(n).then(function(){yr(n,h,null).then(function(){Nr(f,a,2);O(g,h)})})});return M(g)};
Mr.prototype.Yc=function(){if(this.page){var a=this.page;this.Qa=this.page=null;v(a.K,"visibility","none");var b=a.K.parentNode;b&&b.removeChild(a.K)}};Mr.prototype.ie=function(){return!!this.page};function Pr(){Fr.call(this,Qr(this));this.g=new af(Dj,"document");this.F=new af(cf,"text");this.G={};this.ja={};this.A={};this.C={}}t(Pr,Fr);function Qr(a){return function(b){return a.A[b]}}
function Rr(a,b,c){var d=I("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.F.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Nj(sj(sj(sj(new tj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){Sr(a,b,h,c).Fa(d);return}}O(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return M(d)}function Sr(a,b,c,d){var e=b+c,f=a.G[e];if(f)return L(f);var g=I("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.F.load(b+"?r=list"):L(null)).then(function(d){f=new Tr(a,b);Ur(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.ja[b]=f;O(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return M(g)}
function Vr(a,b,c){var d=I("EPUBDocStore.load");b=la(b);(a.C[b]=Er(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,dd:null})).Fa(d);return M(d)}
Pr.prototype.load=function(a){var b=la(a);if(a=this.C[b])return a.za()?a:L(a.get());var c=I("EPUBDocStore.load");a=Pr.Ue.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return M(c)};function Wr(){this.id=null;this.src="";this.h=this.f=null;this.P=-1;this.l=0;this.w=null;this.b=this.g=0;this.$b=this.hb=null;this.j=Oa}
function Xr(a){return a.id}function Yr(a){var b=Kr(a);return function(a){var c=I("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));$e(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}O(c,Ze([a,f]))});return M(c)}}
var Zr={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},$r=Zr.dcterms+"language",as=Zr.dcterms+"title";
function bs(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==as&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=$r&&b&&(f=(h[$r]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[$r]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function cs(a,b){function c(a){for(var b in a){var d=a[b];d.sort(bs(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Sa(a,function(a){return Ra(a,function(a){var b={v:a.value,o:a.order};a.Tf&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:$r,value:a.lang,lang:null,id:null,Od:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Qa(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Zr)f[g]=Zr[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Zr;var h=1;g=Kj(Mj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Od:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Zr.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Od:null,scheme:null};return null});var l=Qa(g,function(a){return a.Od});g=d(Qa(g,function(a){return a.Od?null:a.name}));var k=null;g[$r]&&(k=g[$r][0].v);c(g);return g}function ds(){var a=window.MathJax;return a?a.Hub:null}var es={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Tr(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.C=b;this.A=null;this.V={};this.lang=null;this.F=0;this.J={};this.X=this.O=this.Z=null;this.G={};this.H=null;this.w=fs(this);ds()&&(mh["http://www.w3.org/1998/Math/MathML"]=!0)}
function fs(a){function b(){}b.prototype.Rd=function(a,b){return"viv-id-"+qa(b+(a?"#"+a:""),":")};b.prototype.Oc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Rd(c,f)}return b};b.prototype.pf=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ja(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function gs(a,b){return a.C?b.substr(0,a.C.length)==a.C?decodeURI(b.substr(a.C.length)):null:b}
function Ur(a,b,c,d,e){a.g=b;var f=sj(new tj([b.b]),"package"),g=Nj(f,"unique-identifier")[0];g&&(g=zj(b,b.url+"#"+g))&&(a.A=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Ra(sj(sj(f,"manifest"),"item").b,function(c){var d=new Wr,e=b.url;d.id=c.getAttribute("id");d.src=oa(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!es[d.f]&&(h[d.src]=c);!a.O&&d.j.nav&&
(a.O=d);!a.X&&d.j["cover-image"]&&(a.X=d);return d});a.f=Na(a.j,Xr);a.l=Na(a.j,function(b){return gs(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(es[g.f]){a.G[l]=g.src;break}g=g.src}a.b=Ra(sj(sj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.P=c;return d});if(l=Nj(sj(f,"spine"),"toc")[0])a.Z=a.f[l];if(l=Nj(sj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.H=l}var g=c?Nj(sj(sj(Ij(sj(sj(new tj([c.b]),"encryption"),"EncryptedData"),Hj()),"CipherData"),"CipherReference"),"URI"):[],k=sj(sj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.V[l]=a.f[m].src)}a.J=cs(sj(f,"metadata"),Nj(f,"prefix")[0]);a.J[$r]&&(a.lang=a.J[$r][0].v);if(!d){if(0<g.length&&a.A)for(d=Yr(a.A),c=0;c<g.length;c++)a.h.A[a.C+g[c]]=d;return L(!0)}f=new Da;k={};if(0<g.length&&a.A)for(l="1040:"+
Lr(a.A),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var n=d[c];if(m=n.n){var r=decodeURI(m),g=a.l[r];l=null;g&&(g.w=0!=n.m,g.l=n.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[r];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}hs(a);return Ye(e,"","POST",f.toString(),"text/plain")}function hs(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.F=b}
function is(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new rj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Wr;b.P=a.index;b.id="item"+(a.index+1);b.src=a.url;b.hb=a.hb;b.$b=a.$b;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Vr(a.h,b[0].url,c):L(null)}
function js(a,b,c){var d=a.b[b],e=I("getCFI");a.h.load(d.src).then(function(a){var b=xj(a,c),f=null;b&&(a=vj(a,b,0,!1),f=new fb,ib(f,b,c-a),d.h&&ib(f,d.h,0),f=f.toString());O(e,f)});return M(e)}
function ks(a,b){return Rd("resolveFragment",function(c){if(b){var d=new fb;gb(d,b);var e;if(a.g){var f=hb(d,a.g.b);if(1!=f.node.nodeType||f.M||!f.Hc){O(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){O(c,null);return}e=a.f[h];d=f.Hc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=hb(d,a.b);a=vj(a,b.node,b.offset,b.M);O(c,{P:e.P,Ea:a,aa:-1})})}else O(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function ls(a,b){return Rd("resolveEPage",function(c){if(0>=b)O(c,{P:0,Ea:0,aa:-1});else{var d=La(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=wj(a),f=Math.round(a*b/e.b),f==a&&f--);O(c,{P:d,Ea:f,aa:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);O(a,null)})}
function ms(a,b){var c=a.b[b.P];if(0>=b.Ea)return L(c.g);var d=I("getEPage");a.h.load(c.src).then(function(a){a=wj(a);O(d,c.g+Math.min(a,b.Ea)*c.b/a)});return M(d)}function ns(a,b){return{page:a,position:{P:a.P,aa:b,Ea:a.offset}}}function os(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.w=e;this.ac=[];this.l=[];this.Y=kb(d);this.h=new iq(b);this.f=new wo(a.w)}function ps(a,b){var c=a.ac[b.P];return c?c.nb[b.aa]:null}p=os.prototype;
p.Kb=function(a){return this.b.H?this.b.H:(a=this.ac[a?a.P:0])?a.Qa.xa:null};
function qs(a,b,c,d){c.K.style.display="none";c.K.style.visibility="visible";c.K.style.position="";c.K.style.top="";c.K.style.left="";c.K.setAttribute("data-vivliostyle-page-side",c.l);var e=b.nb[d];c.G=!b.item.P&&!d;b.nb[d]=c;e?(b.Qa.viewport.f.replaceChild(c.K,e.K),Ua(e,{type:"replaced",target:null,currentTarget:null,Pe:c})):b.Qa.viewport.f.appendChild(c.K);a.w({width:b.Qa.ja,height:b.Qa.fa},b.Qa.Sa,b.item.P,b.Qa.Z+d)}
function rs(a,b,c){var d=I("renderSinglePage"),e=ss(a,b,c);yr(b.Qa,e,c).then(function(f){var g=(c=f)?c.page-1:b.Ra.length-1;qs(a,b,e,g);Ao(a.f,e.P,g);f=null;if(c){var h=b.Ra[c.page];b.Ra[c.page]=c;h&&b.nb[c.page]&&(Ck(c,h)||(f=rs(a,b,c)))}f||(f=L(!0));f.then(function(){var b=Bo(a.f,e),f=0;ie(function(c){f++;if(f>b.length)Q(c);else{var d=b[f-1];d.cd=d.cd.filter(function(a){return!a.Ic});d.cd.length?ts(a,d.P).then(function(b){b?(zo(a.f,d.Kd),Co(a.f,d.cd),rs(a,b,b.Ra[d.aa]).then(function(b){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=b.Dc.position;d.P===e.P&&d.aa===g&&(e=b.Dc.page);P(c)})):P(c)}):P(c)}}).then(function(){O(d,{Dc:ns(e,g),Qe:c})})})});return M(d)}function us(a,b){var c=a.aa,d=-1;0>c&&(d=a.Ea,c=La(b.Ra.length,function(a){return or(b.Qa,b.Ra[a],!0)>d}),c=c===b.Ra.length?b.complete?b.Ra.length-1:Number.POSITIVE_INFINITY:c-1);return{P:a.P,aa:c,Ea:d}}
function vs(a,b,c){var d=I("findPage");ts(a,b.P).then(function(e){if(e){var f=null,g;ie(function(d){var h=us(b,e);g=h.aa;(f=e.nb[g])?Q(d):e.complete?(g=e.Ra.length-1,f=e.nb[g],Q(d)):c?ws(a,h).then(function(a){a&&(f=a.page);Q(d)}):ge(100).then(function(){P(d)})}).then(function(){O(d,ns(f,g))})}else O(d,null)});return M(d)}
function ws(a,b){var c=I("renderPage");ts(a,b.P).then(function(d){if(d){var e=us(b,d),f=e.aa,g=e.Ea,h=d.nb[f];h?O(c,ns(h,f)):ie(function(b){if(f<d.Ra.length)Q(b);else if(d.complete)f=d.Ra.length-1,Q(b);else{var c=d.Ra[d.Ra.length-1];rs(a,d,c).then(function(e){var k=e.Dc.page;(c=e.Qe)?0<=g&&or(d.Qa,c)>g?(h=k,f=d.Ra.length-2,Q(b)):P(b):(h=k,f=e.Dc.position.aa,d.complete=!0,k.A=d.item.P===a.b.b.length-1,Q(b))})}}).then(function(){h=h||d.nb[f];var b=d.Ra[f];h?O(c,ns(h,f)):rs(a,d,b).then(function(b){b.Qe||
(d.complete=!0,b.Dc.page.A=d.item.P===a.b.b.length-1);O(c,b.Dc)})})}else O(c,null)});return M(c)}p.Pd=function(){return xs(this,{P:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Ea:-1})};function xs(a,b){var c=I("renderAllPages");b||(b={P:0,aa:0,Ea:0});var d=b.P,e=b.aa,f=0,g;ie(function(c){ws(a,{P:f,aa:f===d?e:Number.POSITIVE_INFINITY,Ea:f===d?b.Ea:-1}).then(function(a){g=a;++f>d?Q(c):P(c)})}).then(function(){O(c,g)});return M(c)}p.$e=function(){return vs(this,{P:0,aa:0,Ea:-1})};
p.df=function(){return vs(this,{P:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Ea:-1})};p.nextPage=function(a,b){var c=this,d=a.P,e=a.aa,f=I("nextPage");ts(c,d).then(function(a){if(a){if(a.complete&&e==a.Ra.length-1){if(d>=c.b.b.length-1){O(f,null);return}d++;e=0}else e++;vs(c,{P:d,aa:e,Ea:-1},b).Fa(f)}else O(f,null)});return M(f)};p.Nd=function(a){var b=a.P;if(a=a.aa)a--;else{if(!b)return L(null);b--;a=Number.POSITIVE_INFINITY}return vs(this,{P:b,aa:a,Ea:-1})};
function ys(a,b,c){b="left"===b.l;a="ltr"===a.Kb(c);return!b&&a||b&&!a}function zs(a,b,c){var d=I("getCurrentSpread"),e=ps(a,b);if(!e)return L({left:null,right:null});var f="left"===e.l;(ys(a,e,b)?a.Nd(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?O(d,{left:e,right:a}):O(d,{left:a,right:e})});return M(d)}p.jf=function(a,b){var c=ps(this,a);if(!c)return L(null);var c=ys(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.oa(function(a){return a?e.nextPage(a.position,!!b):L(null)})};
p.mf=function(a){var b=ps(this,a);if(!b)return L(null);b=ys(this,b,a);a=this.Nd(a);if(b){var c=this;return a.oa(function(a){return a?c.Nd(a.position):L(null)})}return a};function As(a,b){var c=I("navigateToEPage");ls(a.b,b).then(function(b){b?vs(a,b).Fa(c):O(c,null)});return M(c)}function Bs(a,b){var c=I("navigateToCFI");ks(a.b,b).then(function(b){b?vs(a,b).Fa(c):O(c,null)});return M(c)}
function Cs(a,b,c){u.debug("Navigate to",b);var d=gs(a.b,la(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=gs(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.w.pf(b);a.b.g?d=gs(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return L(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==gs(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?Bs(a,b.substr(d+1)):L(null);var g=I("navigateTo");ts(a,f.P).then(function(d){var e=zj(d.ea,b);e?vs(a,{P:f.P,aa:-1,Ea:uj(d.ea,e)}).Fa(g):c.P!==f.P?vs(a,{P:f.P,aa:0,Ea:-1}).Fa(g):
O(g,null)});return M(g)}
function ss(a,b,c){var d=b.Qa.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";nj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Tj(e,f);g.P=b.item.P;g.position=c;g.offset=or(b.Qa,c);g.offset||(b=a.b.w.Rd("",b.item.src),f.setAttribute("id",b),Wj(g,f,b));d!==a.viewport&&(a=Pf(null,new Ue(nb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.w.push(new Qj(e,"transform",a)));return g}function Ds(a,b){var c=ds();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=I("makeMathJaxView"),f=ae(c);d.Push(function(){f.eb(e)});return M(c)}return L(null)}
p.Gd=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=oa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=gs(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.V[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ha(f),l=Ha(g),g=new Da;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=L(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Ds(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=L(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Ds(c,d):L(null);return e}};
function ts(a,b){if(b>=a.b.b.length)return L(null);var c=a.ac[b];if(c)return L(c);var d=I("getPageViewItem"),e=a.l[b];if(e){var f=ae(d);e.push(f);return M(d)}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(wj(f)/2700),a.b.F=g.b);var k=h.f[f.url],l=a.Gd(f),n=a.viewport,r=kr(k,n.width,n.height,n.fontSize);if(r.width!=n.width||r.height!=n.height||r.fontSize!=n.fontSize)n=new kq(n.window,r.fontSize,n.root,r.width,r.height);r=a.ac[b-1];null!==g.hb?
r=g.hb-1:(r=r?r.Qa.Z+r.nb.length:0,null!==g.$b&&(r+=g.$b));xo(a.f,r);var q=new lr(k,f,a.b.lang,n,a.h,a.j,l,a.b.G,r,a.b.w,a.f);q.Y=a.Y;mr(q).then(function(){c={item:g,ea:f,Qa:q,Ra:[null],nb:[],complete:!1};a.ac[b]=c;O(d,c);e.forEach(function(a){a.eb(c)})})});return M(d)}function Es(a){return a.ac.some(function(a){return a&&0<a.nb.length})}
p.ed=function(){var a=this.b,b=a.O||a.Z;if(!b)return L(null);var c=I("showTOC");this.g||(this.g=new Mr(a.h,b.src,a.lang,this.h,this.j,this.Y,this,a.G,a.w,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.ed(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return M(c)};p.Yc=function(){this.g&&this.g.Yc()};p.ie=function(){return this.g&&this.g.ie()};var Fs={Hf:"singlePage",If:"spread",xf:"autoSpread"};
function Gs(a,b,c,d){var e=this;this.window=a;this.pd=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);nj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Xa=c;this.Sa=d;a=a.document;this.xa=new Fl(a.head,b);this.A="loading";this.O=[];this.h=null;this.Lb=this.Ka=!1;this.f=this.j=this.g=this.C=null;this.fontSize=16;this.zoom=1;this.F=!1;this.X="singlePage";this.ja=!1;this.Pd=!0;this.Y=jb();this.fa=[];this.J=function(){};this.w=function(){};
this.Z=function(){e.Ka=!0;e.J()};this.Ld=this.Ld.bind(this);this.G=function(){};this.H=a.getElementById("vivliostyle-page-rules");this.V=!1;this.l=null;this.ta={loadEPUB:this.Xe,loadXML:this.Ye,configure:this.ae,moveTo:this.Ma,toc:this.ed};Hs(this)}function Hs(a){ka(1,function(a){Is(this,{t:"debug",content:a})}.bind(a));ka(2,function(a){Is(this,{t:"info",content:a})}.bind(a));ka(3,function(a){Is(this,{t:"warn",content:a})}.bind(a));ka(4,function(a){Is(this,{t:"error",content:a})}.bind(a))}
function Is(a,b){b.i=a.Xa;a.Sa(b)}function Js(a,b){a.A!==b&&(a.A=b,a.pd.setAttribute("data-vivliostyle-viewer-status",b),Is(a,{t:"readystatechange"}))}p=Gs.prototype;
p.Xe=function(a){Ks.f("beforeRender");Js(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadEPUB"),h=this;h.ae(a).then(function(){var a=new Pr;Gr(a,e,f).then(function(){var e=oa(b,h.window.location.href);h.O=[e];Rr(a,e,d).then(function(a){h.h=a;Ls(h,c).then(function(){O(g,!0)})})})});return M(g)};
p.Ye=function(a){Ks.f("beforeRender");Js(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadXML"),h=this;h.ae(a).then(function(){var a=new Pr;Gr(a,e,f).then(function(){var e=b.map(function(a,b){return{url:oa(a.url,h.window.location.href),index:b,hb:a.hb,$b:a.$b}});h.O=e.map(function(a){return a.url});h.h=new Tr(a,"");is(h.h,e,c).then(function(){Ls(h,d).then(function(){O(g,!0)})})})});return M(g)};
function Ls(a,b){Ms(a);var c;b?c=ks(a.h,b).oa(function(b){a.f=b;return L(!0)}):c=L(!0);return c.oa(function(){Ks.b("beforeRender");return Ns(a)})}function Os(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*yb.ex*a.fontSize/yb.em;if(d=yb[d])return c*d}return c}
p.ae=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.C=null,this.window.addEventListener("resize",this.Z,!1),this.Ka=!0):this.window.removeEventListener("resize",this.Z,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Ka=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Os(this,b["margin-left"])||0,marginRight:Os(this,b["margin-right"])||0,marginTop:Os(this,b["margin-top"])||0,marginBottom:Os(this,b["margin-bottom"])||
0,width:Os(this,b.width)||0,height:Os(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Z,!1),this.C=b,this.Ka=!0);"boolean"==typeof a.hyphenate&&(this.Y.Bd=a.hyphenate,this.Ka=!0);"boolean"==typeof a.horizontal&&(this.Y.Ad=a.horizontal,this.Ka=!0);"boolean"==typeof a.nightMode&&(this.Y.Hd=a.nightMode,this.Ka=!0);"number"==typeof a.lineHeight&&(this.Y.lineHeight=a.lineHeight,this.Ka=!0);"number"==typeof a.columnWidth&&(this.Y.wd=a.columnWidth,this.Ka=
!0);"string"==typeof a.fontFamily&&(this.Y.fontFamily=a.fontFamily,this.Ka=!0);"boolean"==typeof a.load&&(this.ja=a.load);"boolean"==typeof a.renderAllPages&&(this.Pd=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ma=a.userAgentRootURL.replace(/resources\/?$/,""),na=a.userAgentRootURL);"string"==typeof a.rootURL&&(ma=a.rootURL,na=ma+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.X&&(this.X=a.pageViewMode,this.Ka=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Y.jc&&
(this.viewport=null,this.Y.jc=a.pageBorder,this.Ka=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.Lb=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.F&&(this.F=a.fitToScreen,this.Lb=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.Y.Wb=a.defaultPaperSize,this.Ka=!0);Ps(this,a);return L(!0)};
function Ps(a,b){Ld("CONFIGURATION").forEach(function(a){a=a(b);this.Ka=a.Ka||this.Ka;this.Lb=a.Lb||this.Lb}.bind(a))}p.Ld=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||Qs(this,a.Pe):b===a.target&&Qs(this,a.Pe)};function Rs(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Ss(a){Rs(a,function(a){a.removeEventListener("hyperlink",this.G,!1);a.removeEventListener("replaced",this.Ld,!1)}.bind(a))}
function Ts(a){Ss(a);Rs(a,function(a){v(a.K,"display","none")});a.g=null;a.j=null}function Us(a,b){b.addEventListener("hyperlink",a.G,!1);b.addEventListener("replaced",a.Ld,!1);v(b.K,"visibility","visible");v(b.K,"display","block")}function Vs(a,b){Ts(a);a.g=b;Us(a,b)}function Ws(a){var b=I("reportPosition");js(a.h,a.f.P,a.f.Ea).then(function(c){var d=a.g;(a.ja&&0<d.j.length?me(d.j):L(!0)).then(function(){Xs(a,d,c).Fa(b)})});return M(b)}
function Ys(a){var b=a.pd;if(a.C){var c=a.C;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new kq(a.window,a.fontSize,b,c.width,c.height)}return new kq(a.window,a.fontSize,b)}
function Zs(a){var b=Ys(a),c;a:switch(a.X){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.Y.pb!==c;a.Y.pb=c;a.pd.setAttribute("data-vivliostyle-spread-view",c);if(a.C||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&Es(a.b)){a:{d=a.b.ac;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.nb,f=0;f<e.length;f++){var g=e[f];if(g.F&&g.C){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.Lb=!0):!1}p.qf=function(a,b,c,d){this.fa[d]=a;$s(this,b,c,d)};function $s(a,b,c,d){if(!a.V&&a.H&&!c&&!d){var e="";Object.keys(b).forEach(function(a){e+="@page "+a+"{size:";a=b[a];e+=a.width+"px "+a.height+"px;}"});a.H.textContent=e;a.V=!0}}
function at(a){if(a.b){a.b.Yc();for(var b=a.b,c=b.ac,d=0;d<c.length;d++){var e=c[d];e&&e.nb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.H&&(a.H.textContent="",a.V=!1);a.viewport=Ys(a);b=a.viewport;v(b.g,"width","");v(b.g,"height","");v(b.f,"width","");v(b.f,"height","");v(b.f,"transform","");a.b=new os(a.h,a.viewport,a.xa,a.Y,a.qf.bind(a))}
function Qs(a,b,c){a.Lb=!1;Ss(a);if(a.Y.pb)return zs(a.b,a.f,c).oa(function(c){Ts(a);a.j=c;c.left&&(Us(a,c.left),c.right||c.left.K.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Us(a,c.right),c.left||c.right.K.setAttribute("data-vivliostyle-unpaired-page",!0));c=bt(a,c);a.viewport.zoom(c.width,c.height,a.F?ct(a,c):a.zoom);a.g=b;return L(null)});Vs(a,b);a.viewport.zoom(b.f.width,b.f.height,a.F?ct(a,b.f):a.zoom);a.g=b;return L(null)}
function bt(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.Y.jc);return{width:c,height:d}}var dt={Cf:"fit inside viewport"};function ct(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function et(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t(et,Error);
function Ms(a){if(a.l){var b=a.l;Sd(b,new et);if(b!==Md&&b.b){b.b.h=!0;var c=new be(b);b.w="interrupt";b.b=c;b.f.eb(c)}}a.l=null}
function Ns(a){a.Ka=!1;a.Lb=!1;if(Zs(a))return L(!0);Js(a,"loading");Ms(a);var b=Ud(Md.f,function(){return Rd("resize",function(c){a.l=b;Ks.f("render (resize)");at(a);a.f&&(a.f.aa=-1);xs(a.b,a.f).then(function(d){a.f=d.position;Qs(a,d.page,!0).then(function(){Ws(a).then(function(d){Js(a,"interactive");(a.Pd?a.b.Pd():L(null)).then(function(){a.l===b&&(a.l=null);Ks.b("render (resize)");Js(a,"complete");Is(a,{t:"loaded"});O(c,d)})})})})},function(a,b){if(b instanceof et)Ks.b("render (resize)"),u.debug(b.message);
else throw b;})});return L(!0)}function Xs(a,b,c){var d=I("sendLocationNotification"),e={t:"nav",first:b.G,last:b.A};ms(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.F;c&&(e.cfi=c);Is(a,e);O(d,!0)});return M(d)}Gs.prototype.Kb=function(){return this.b?this.b.Kb(this.f):null};
Gs.prototype.Ma=function(a){var b=this;"complete"!==this.A&&Js(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.Y.pb?this.b.jf:this.b.nextPage;break;case "previous":a=this.Y.pb?this.b.mf:this.b.Nd;break;case "last":a=this.b.df;break;case "first":a=this.b.$e;break;default:return L(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return As(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return Cs(b.b,
e,b.f)}}else return L(!0);var f=I("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=I("moveTo.showCurrent");c=M(d);Qs(b,a.page).then(function(){Ws(b).Fa(d)})}else c=L(!0);c.then(function(a){"loading"===b.A&&Js(b,"interactive");O(f,a)})});return M(f)};
Gs.prototype.ed=function(a){var b=!!a.autohide;a=a.v;var c=this.b.ie();if(c){if("show"==a)return L(!0)}else if("hide"==a)return L(!0);if(c)return this.b.Yc(),L(!0);var d=this,e=I("showTOC");this.b.ed(b).then(function(a){if(a){if(b){var c=function(){d.b.Yc()};a.addEventListener("hyperlink",c,!1);a.K.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.G,!1)}O(e,!0)});return M(e)};
function ft(a,b){var c=b.a||"";return Rd("runCommand",function(d){var e=a.ta[c];e?e.call(a,b).then(function(){Is(a,{t:"done",a:c});O(d,!0)}):(u.error("No such action:",c),O(d,!0))},function(a,b){u.error(b,"Error during action:",c);O(a,!0)})}function gt(a){return"string"==typeof a?JSON.parse(a):a}
function ht(a,b){var c=gt(b),d=null;Td(function(){var b=I("commandLoop"),f=Md.f;a.G=function(b){var c="#"===b.href.charAt(0)||a.O.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Ud(f,function(){Is(a,d);return L(!0)})}};ie(function(b){if(a.Ka)Ns(a).then(function(){P(b)});else if(a.Lb)a.g&&Qs(a,a.g).then(function(){P(b)});else if(c){var e=c;c=null;ft(a,e).then(function(){P(b)})}else e=I("waitForCommand"),d=ae(e,self),M(e).then(function(){P(b)})}).Fa(b);
return M(b)});a.J=function(){var a=d;a&&(d=null,a.eb())};a.w=function(b){if(c)return!1;c=gt(b);a.J();return!0};a.window.adapt_command=a.w};function cq(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=it(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=jt(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=kt(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);lt(a);null!=c&&(a=mt(a,c));return a}
function kt(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=nt(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=cq(f[0],f[2]),d=cq(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,n=0,r=0,q=0,z=0;z<e;z++){for(var y=-z+m;y<=z-n;y+=2){var A=e+y,H;H=y==-z||y!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var G=H-y;H<c&&G<d&&a.charAt(H)==b.charAt(G);)H++,G++;g[A]=H;if(H>c)n+=2;else if(G>d)m+=2;else if(k&&(A=e+l-y,0<=A&&A<f&&-1!=h[A])){var J=c-h[A];if(H>=J){c=ot(a,b,H,G);break a}}}for(y=-z+r;y<=z-q;y+=2){A=e+y;J=y==-z||y!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=J-y;J<c&&H<d&&a.charAt(c-J-1)==b.charAt(d-H-1);)J++,H++;h[A]=J;if(J>c)q+=2;else if(H>d)r+=2;else if(!k&&
(A=e+l-y,0<=A&&A<f&&-1!=g[A]&&(H=g[A],G=e+H-A,J=c-J,H>=J))){c=ot(a,b,H,G);break a}}}c=[[-1,a],[1,b]]}return c}function ot(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=cq(a.substring(0,c),b.substring(0,d));e=cq(e,f);return a.concat(e)}function it(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function jt(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function nt(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=it(a.substring(c),b.substring(e)),J=jt(a.substring(0,c),b.substring(0,e));f.length<J+m&&(f=b.substring(e-J,e)+b.substring(e,e+m),g=a.substring(0,c-J),h=a.substring(c+m),k=b.substring(0,e-J),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function lt(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=it(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=jt(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&lt(a)}cq.f=1;cq.b=-1;cq.g=0;
function mt(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),pt(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),pt(d,c,3)):a}function pt(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function bq(a){return a.reduce(function(a,c){return c[0]===cq.b?a:a+c[1]},"")}function tk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case cq.f:d++;break;case cq.b:d--;e++;break;case cq.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function qt(){}qt.prototype.Ge=function(a){return{B:a,Sc:!1,Fb:!1}};qt.prototype.Se=function(){};qt.prototype.oe=function(){};qt.prototype.uc=function(){};function rt(a,b){this.b=a;this.f=b}
function st(a,b){var c=a.b,d=c.Ge(b),e=I("LayoutIterator");ie(function(a){for(var b;d.B;){b=d.B.D?1!==d.B.D.nodeType?ak(d.B.D,d.B.Tb)?void 0:d.B.M?void 0:c.Se(d):d.B.Da?void 0:d.B.M?c.uc(d):c.oe(d):void 0;b=(b&&b.za()?b:L(!0)).oa(function(){return d.Fb?L(null):hn(this.f,d.B,d.Sc)}.bind(this));if(b.za()){b.then(function(b){d.Fb?Q(a):(d.B=b,P(a))});return}if(d.Fb){Q(a);return}d.B=b.get()}Q(a)}.bind(a)).then(function(){O(e,d.B)});return M(e)}function tt(a){this.$c=a}t(tt,qt);p=tt.prototype;p.Te=function(){};
p.ze=function(){};p.Ge=function(a){return{B:a,Sc:!!this.$c&&a.M,Fb:!1,$c:this.$c,wc:null,Id:!1,Le:[],Ke:null}};p.Se=function(a){a.Id=!1};p.oe=function(a){a.Le.push(lk(a.B));a.wc=bl(a.wc,a.B.g);a.Id=!0;return this.Te(a)};p.uc=function(a){var b;a.Id?(b=(b=void 0,L(!0)),b=b.oa(function(){a.Fb||(a.Le=[],a.$c=!1,a.Sc=!1,a.wc=null);return L(!0)})):b=(b=this.ze(a))&&b.za()?b:L(!0);return b.oa(function(){a.Fb||(a.Id=!1,a.Ke=lk(a.B),a.wc=bl(a.wc,a.B.F));return L(!0)})};
function ut(a,b,c){this.ne=[];this.b=Object.create(a);this.b.element=b;this.b.h=a.h.clone();this.b.l=!1;this.b.Vd=c.L;a=Yn(this.b,c);this.b.F-=a;var d=this;this.b.vb=function(a){return Ym.prototype.vb.call(this,a).oa(function(a){var b=lk(a);d.ne.push(b);return L(a)})}}ut.prototype.Jb=function(a){var b=this.b.Jb();if(a){a=b.Uc?b.Uc.b():Number.MAX_VALUE;var c=this.ne[0],c=new Sm(lk(c),null,c.b,0),d=c.f(this.b,a);if(d&&c.b()<a)return{Uc:c,B:d}}return b};
function vt(a){this.u=a;this.b=this.f=null;this.A=[];this.w=[];this.C=this.F=0;this.g=this.h=!1;this.l=this.j=!0}function wt(a,b,c){b=Yj(c,b);return a.u?b.width:b.height}function xt(a){a.h=a.g=!1;a.A=[];a.w=[];a.j=!0;a.l=!0}function Tm(a){return(a.g?0:a.C)-(a.h?a.F:0)}function yt(a){a.A.forEach(function(a){a.parentNode.removeChild(a)});a.A=[]}function zt(a){a.w.forEach(function(a){a.parentNode.removeChild(a)});a.w=[]};function At(a,b){this.g(a,"end",b)}function Bt(a,b){this.g(a,"start",b)}function Ct(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Dt(){}function Et(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Dt}
Et.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.g(b)};Et.prototype.w=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Dt};Et.prototype.A=function(){this.g=Ct;this.registerStartTiming=this.f=Bt;this.registerEndTiming=this.b=At};
var Ft={now:Date.now},Ks,Gt=Ks=new Et(window&&window.performance||Ft);Ct.call(Gt,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Gt);Et.prototype.printTimings=Et.prototype.l;Et.prototype.disable=Et.prototype.w;Et.prototype.enable=Et.prototype.A;function Ht(a,b,c){var d=a.B,e=d.display,f=d.parent?d.parent.display:null;return"table-row"===e&&!It(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!It(f)&&"table"!==f&&"inline-table"!==f||d.L instanceof Jt&&d.L!==b?ln(c,d).oa(function(b){a.B=b;return L(!0)}):null}function It(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function Kt(a,b){this.rowIndex=a;this.S=b;this.b=[]}
function Lt(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function Mt(a,b,c){this.rowIndex=a;this.h=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function Nt(a,b,c){this.rowIndex=a;this.b=b;this.xc=c}function Ot(a,b,c){this.g=a;this.b=c;this.bd=new ut(a,b,c);this.f=!1}Ot.prototype.Jb=function(){var a=this.b.D,b=this.b.O;"middle"!==b&&"bottom"!==b||v(a,"vertical-align","top");var c=this.bd.Jb(!0);v(a,"vertical-align",b);return c};
function Pt(a,b){this.D=a;this.b=b}function Qt(a,b,c,d){Sm.call(this,a,b,c,d);this.L=a.L;this.rowIndex=this.j=null}t(Qt,Sm);Qt.prototype.f=function(a,b){var c=Sm.prototype.f.call(this,a,b);return b<this.b()?null:Rt(this).every(function(a){return!!a.B})?c:null};Qt.prototype.b=function(){var a=Sm.prototype.b.call(this);Rt(this).forEach(function(b){a+=b.Uc.b()});return a};function Rt(a){a.j||(a.j=St(a).map(function(a){return a.Jb()}));return a.j}
function St(a){return Tt(a.L,null!=a.rowIndex?a.rowIndex:a.rowIndex=Ut(a.L,a.position.S)).map(a.L.ee,a.L)}function Vt(a,b,c){this.rowIndex=a;this.j=b;this.L=c;this.h=null}t(Vt,Om);Vt.prototype.f=function(a,b){if(b<this.b())return null;var c=Wt(this),d=Xt(this);return d.every(function(a){return!!a.B})&&d.some(function(a,b){var d=a.B,e=c[b].bd.ne[0];return!(e.D===d.D&&e.M===d.M&&e.ia===d.ia)})?this.j:null};
Vt.prototype.b=function(){var a=this.L,b=0;Yt(a,a.f[this.rowIndex])||(b+=10);Xt(this).forEach(function(a){b+=a.Uc.b()});return b};function Xt(a){a.h||(a.h=Wt(a).map(function(a){return a.Jb()}));return a.h}Vt.prototype.g=function(){return Pm(this.j)};function Wt(a){return Zt(a.L,a.rowIndex).map(a.L.ee,a.L)}function Jt(a,b){this.parent=a;this.j=b;this.u=this.G=!1;this.w=-1;this.J=0;this.C=[];this.F=this.l=null;this.O=0;this.f=[];this.H=[];this.h=[];this.A=null;this.b=[];this.g=null}p=Jt.prototype;
p.se=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};p.Ie=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.b.length;case "table-cell":return!this.b.some(function(b){return b.$d.na[0].node===a.S});default:return b}};p.te=function(){return this.parent};function $t(a,b){do if(b.S===a.j)return b.D;while(b=b.parent);return null}function au(a,b){var c=a.H[b];c||(c=a.H[b]=[]);return c}
function Ut(a,b){return a.f.findIndex(function(a){return b===a.S})}function Zt(a,b){return au(a,b).reduce(function(a,b){return b.xc!==a[a.length-1]?a.concat(b.xc):a},[])}function Tt(a,b){return Zt(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}p.ee=function(a){return this.h[a.rowIndex][a.h]};function Yt(a,b){return Lt(b)>a.J/2}function bu(a){0>a.w&&(a.w=Math.max.apply(null,a.f.map(function(a){return a.b.reduce(function(a,b){return a+b.b},0)})));return a.w}
function cu(a,b){a.f.forEach(function(a){a.b.forEach(function(a){var c=Yj(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}p.ec=function(){return this.g};function du(a,b){this.L=a;this.h=b;this.rowIndex=-1;this.f=0;this.g=!1}t(du,qt);
du.prototype.oe=function(a){var b=this.L,c=Ht(a,b,this.h);if(c)return c;a=a.B;switch(a.display){case "table":b.O=a.Z;break;case "table-caption":b.C.push(new Pt(a.D,a.X));break;case "table-header-group":this.b=!0;b=b.g;b.f||(b.f=a.D);break;case "table-footer-group":this.b=!0;b=b.g;b.b||(b.b=a.D);break;case "table-row":this.b||(this.g=!0,this.rowIndex++,this.f=0,b.f[this.rowIndex]=new Kt(this.rowIndex,a.S))}return L(!0)};
du.prototype.uc=function(a){var b=this.L,c=a.B,d=c.display,e=this.h.b;if(c.S===b.j)c=rn(e,$t(b,c)),b.J=parseFloat(c[b.u?"height":"width"]),a.Fb=!0;else switch(d){case "table-header-group":case "table-footer-group":this.b=!1;break;case "table-row":this.b||(b.A=c.D,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.f=0,this.g=!0);a=this.rowIndex;c=new Mt(this.rowIndex,this.f,c.D);d=b.f[a];d||(b.f[a]=new Kt(a,null),d=b.f[a]);d.b.push(c);for(var d=a+c.rowSpan,e=au(b,a),f=0;e[f];)f++;
for(;a<d;a++)for(var e=au(b,a),g=f;g<f+c.b;g++){var h=e[g]=new Nt(a,g,c);c.f||(c.f=h)}this.f++}}};function eu(a,b){this.$c=!0;this.L=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.w=b.l;b.l=!1}t(eu,tt);var fu={"table-caption":!0,"table-column-group":!0,"table-column":!0,"table-header-group":!0,"table-footer-group":!0};
function gu(a,b,c,d){var e=b.rowIndex,f=b.h,g=c.D;if(1<b.b){v(g,"box-sizing","border-box");for(var h=a.L.F,l=0,k=0;k<b.b;k++)l+=h[b.f.b+k];l+=a.L.O*(b.b-1);v(g,a.L.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Ot(a.f,b,c);a=a.L;(g=a.h[e])||(g=a.h[e]=[]);g[f]=c;1===d.Ba.na.length&&d.Ba.M&&(c.f=!0);return An(c.bd.b,d,!0).nd(!0)}function hu(a,b){var c=a.L.b[0];return c?c.xc.f.b===b:!1}
function iu(a){var b=a.L.b;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.xc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function ju(a,b){var c=a.L,d=iu(a),e=d.reduce(function(a){return a+1},0);if(0===e)return L(!0);var f=a.f.h,g=b.B;g.D.parentNode.removeChild(g.D);var h=I("layoutRowSpanningCellsFromPreviousFragment"),l=L(!0),k=0,m=[];d.forEach(function(a){l=l.oa(function(){var b=jk(a[0].$d.na[1],g.parent);return bn(f,b,!1).oa(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.D.ownerDocument.createElement("td");v(c,"padding","0");b.D.appendChild(c)}h++}}var g=L(!0),h=0;a.forEach(function(a){g=g.oa(function(){var c=
a.xc;d(c.f.b);var g=a.$d,l=jk(g.na[0],b);l.ia=g.ia;l.M=g.M;return bn(f,l,!1).oa(function(){for(var b=a.ve,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return gu(this,c,l,b).oa(function(){l.D.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return L(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.oa(function(){d(bu(c));k++;return L(!0)})}.bind(this))}.bind(this))},a);l.then(function(){bn(f,g,!0,b.Sc).then(function(){O(h,!0)})});return M(h)}
function ku(a,b){if(a.j||a.h)return L(!0);var c=b.B,d=a.L;0>a.b?a.b=Ut(d,c.S):a.b++;a.g=0;a.l=!0;return ju(a,b).oa(function(){co(this.f,b.Ke,null,!0,b.wc)&&!Tt(d,this.b-1).length&&(this.f.l=this.w,c.b=!0,b.Fb=!0);return L(!0)}.bind(a))}
function lu(a,b){if(a.j||a.h)return L(!0);var c=b.B;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.L.f[a.b].b[a.g],e=lk(c).modify();e.M=!0;b.B=e;var f=I("startTableCell");hu(a,d.f.b)?(e=a.L.b.shift(),e=L(e.ve)):e=hn(a.f.h,c,b.Sc).oa(function(a){a.D&&c.D.removeChild(a.D);return L(new wk(hk(a)))});e.then(function(a){gu(this,d,c,a).then(function(){this.uc(b);this.g++;O(f,!0)}.bind(this))}.bind(a));return M(f)}
eu.prototype.Te=function(a){var b=Ht(a,this.L,this.f);if(b)return b;b=a.B.display;return"table-header-group"===b?(this.j=!0,L(!0)):"table-footer-group"===b?(this.h=!0,L(!0)):"table-row"===b?ku(this,a):"table-cell"===b?lu(this,a):L(!0)};eu.prototype.ze=function(a){a=a.B;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=lk(a).modify(),a.M=!1,this.f.C.push(new Vt(this.b,a,this.L))));return L(!0)};
eu.prototype.uc=function(a){var b=a.B,c=b.display;"table-header-group"===c?this.j=!1:"table-footer-group"===c&&(this.h=!1);if(c&&fu[c])b.D.parentNode.removeChild(b.D);else if(b.S===this.L.j)this.f.l=this.w,a.Fb=!0;else return tt.prototype.uc.call(this,a);return L(!0)};function mu(){}
function nu(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Yj(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function ou(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function pu(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function qu(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function ru(a,b,c){var d=a.u,e=a.A;if(e){a.A=null;var f=e.ownerDocument.createDocumentFragment(),g=bu(a);if(0<g){var h=a.F=nu(e,g,d,c.b);c=ou(b);e=pu(c);qu(e,c,g,b);e.forEach(function(a,b){v(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.l=f}}
function su(a,b,c){var d=b.L;d.u=b.u;d.g=new vt(d.u);var e=I("TableLayoutProcessor.doInitialLayout");st(new rt(new du(b.L,c),c.h),b).then(function(a){var b=a.D,f=Yj(c.b,b);Um(c,c.u?f.left:f.bottom)?(ru(d,b,c),cu(d,c.b),a=d.g,b=c.b,a.f&&(a.F=wt(a,a.f,b)),a.b&&(a.C=wt(a,a.b,b)),O(e,null)):O(e,a)}.bind(a));return M(e)}function tu(a,b,c){var d=a.C;d.forEach(function(a,f){a&&(b.insertBefore(a.D,c),"top"===a.b&&(d[f]=null))})}
function uu(a,b){if(a.l&&b){var c=ou(b);c&&c.forEach(function(a){b.removeChild(a)})}}mu.prototype.f=function(a,b){var c=a.L,d=I("TableLayoutProcessor.layout"),e=vu(a,c),f=lk(a),g=[].concat(c.b),h=[].concat(b.C);e.g(this,a,b).then(function(l){var k=e.f(l,c,b);e.b(l,c,k);if(k)O(d,l);else{for(l=f.D||f.parent.D;k=l.lastChild;)l.removeChild(k);for(;k=l.nextSibling;)k.parentNode.removeChild(k);uu(c,$t(c,f));b.C=h;c.h=[];c.b=g;this.f(a,b).Fa(d)}}.bind(this));return M(d)};
mu.prototype.g=function(a,b,c,d){return new Qt(a,b,c,d)};
mu.prototype.b=function(a,b){var c=b.L,d=c.g;d.j||b.S===c.j&&b.M||zt(d);if("table-row"===b.display){var e=Ut(c,b.S);c.b=[];var f;f=b.M?Tt(c,e):Zt(c,e);if(f.length){var g=I("TableLayoutProcessor.finishBreak"),h=0;ie(function(a){if(h===f.length)Q(a);else{var b=f[h++],d=c.ee(b),g=d.Jb().B,l=d.b,q=sk(l),z=new wk(sk(g));c.b.push({$d:q,ve:z,xc:b});l=l.D;ko(d.b);e<b.rowIndex+b.rowSpan-1&&(l.rowSpan=e-b.rowIndex+1);d.f?P(a):Sn(d.bd.b,g,!1,!0).then(function(){var b=c.ec();if(b){var e=c.u,f=d.g,g=d.bd.b.element,
h=d.b.D,k=Yj(f.b,h),h=sn(f,h);e?v(g,"max-width",k.right-f.F-Tm(b)-h.right+"px"):v(g,"max-height",f.F-Tm(b)-k.top-h.top+"px");v(g,"overflow","hidden")}P(a)})}}).then(function(){d&&xt(d);c.h=[];ho(b,!1);ko(b);O(g,!0)});return M(g)}}d&&xt(d);c.h=[];return null};function vu(a,b){if(b.G){var c=b.ec();a.S===b.j&&!a.M&&c&&(c.h=!1,c.l=!1);return new wu}return new xu}function xu(){}xu.prototype.g=function(a,b,c){return su(a,b,c)};xu.prototype.f=function(a){return!!a};xu.prototype.b=function(a,b){b.G=!0};
function wu(){}wu.prototype.g=function(a,b,c){a=b.L;var d=a.g,e=$t(a,b),f=e.firstChild;tu(a,e,f);a.l&&e.insertBefore(a.l.cloneNode(!0),f);if(d.f&&!d.h){var g=d.f.cloneNode(!0);d.A.push(g);e.insertBefore(g,f)}d.b&&!d.g&&(g=d.b.cloneNode(!0),d.w.push(g),e.insertBefore(g,f));a=new eu(a,c);c=new rt(a,c.h);a=I("TableFormattingContext.doLayout");st(c,b).Fa(a);return M(a)};
wu.prototype.f=function(a,b,c){var d=b.ec();if(!d)return!0;c=c.Jb();return a.S===b.j&&a.M&&d.g?(d.g=!1,d.j=!1):!d.g&&d.j&&d.b||!d.h&&d.l&&d.f?!!c.B&&!c.B.b:!0};wu.prototype.b=function(a,b,c){(a=b.ec())&&!c&&(yt(a),zt(a),!a.g&&a.j&&a.b?a.g=!0:!a.h&&a.l&&a.f&&(a.h=!0))};var yu=new mu;Kd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===td?(b=a.parent,new Jt(b?b.L:null,a.S)):null:null});Kd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Jt?yu:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function zu(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,hb:null,$b:null}:{url:a.url,hb:b(a.startPage),$b:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function Au(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function Bu(a,b){nj=a.debug;this.g=!1;this.h=a;this.Db=new Gs(a.window||window,a.viewportElement,"main",this.Ze.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.Re(b);this.b=new Ta;Object.defineProperty(this,"readyState",{get:function(){return this.Db.A}})}p=Bu.prototype;p.Re=function(a){var b=Object.assign({a:"configure"},Au(a));this.Db.w(b);Object.assign(this.f,a)};
p.Ze=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ua(this.b,b)};p.rf=function(a,b){this.b.addEventListener(a,b,!1)};p.uf=function(a,b){this.b.removeEventListener(a,b,!1)};p.ef=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Cu(this,a,null,b,c)};p.sf=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Cu(this,null,a,b,c)};
function Cu(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:zu(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},Au(a.f));a.g?a.Db.w(b):(a.g=!0,ht(a.Db,b))}p.Kb=function(){return this.Db.Kb()};
p.gf=function(a){a:switch(a){case "left":a="ltr"===this.Kb()?"previous":"next";break a;case "right":a="ltr"===this.Kb()?"next":"previous"}this.Db.w({a:"moveTo",where:a})};p.ff=function(a){this.Db.w({a:"moveTo",url:a})};p.tf=function(a){a:{var b=this.Db;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=ct(b,b.Y.pb?bt(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};p.af=function(){return this.Db.fa};ba("vivliostyle.viewer.Viewer",Bu);
Bu.prototype.setOptions=Bu.prototype.Re;Bu.prototype.addListener=Bu.prototype.rf;Bu.prototype.removeListener=Bu.prototype.uf;Bu.prototype.loadDocument=Bu.prototype.ef;Bu.prototype.loadEPUB=Bu.prototype.sf;Bu.prototype.getCurrentPageProgression=Bu.prototype.Kb;Bu.prototype.navigateToPage=Bu.prototype.gf;Bu.prototype.navigateToInternalUrl=Bu.prototype.ff;Bu.prototype.queryZoomFactor=Bu.prototype.tf;Bu.prototype.getPageSizes=Bu.prototype.af;ba("vivliostyle.viewer.ZoomType",dt);
dt.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",Fs);Fs.SINGLE_PAGE="singlePage";Fs.SPREAD="spread";Fs.AUTO_SPREAD="autoSpread";Ct.call(Ks,"load_vivliostyle","end",void 0);var Du=16,Eu="ltr";function Fu(a){window.adapt_command(a)}function Gu(){Fu({a:"moveTo",where:"ltr"===Eu?"previous":"next"})}function Hu(){Fu({a:"moveTo",where:"ltr"===Eu?"next":"previous"})}
function Iu(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Fu({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Fu({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Fu({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Fu({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Hu(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Gu(),a.preventDefault();else if("0"===b||"U+0030"===c)Fu({a:"configure",fontSize:Math.round(Du)}),a.preventDefault();else if("t"===b||"U+0054"===c)Fu({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Du*=1.2,Fu({a:"configure",fontSize:Math.round(Du)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Du/=1.2,Fu({a:"configure",
fontSize:Math.round(Du)}),a.preventDefault()}
function Ju(a){switch(a.t){case "loaded":a=a.viewer;var b=Eu=a.Kb();a.pd.setAttribute("data-vivliostyle-page-progression",b);a.pd.setAttribute("data-vivliostyle-spread-view",a.Y.pb);window.addEventListener("keydown",Iu,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Gu,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Hu,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ra(location.href,Ha(a||"")));break;case "hyperlink":a.internal&&Fu({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||pa("f"),c=a&&a.epubURL||pa("b"),d=a&&a.xmlURL||pa("x"),e=a&&a.defaultPageWidth||pa("w"),f=a&&a.defaultPageHeight||pa("h"),g=a&&a.defaultPageSize||pa("size"),h=a&&a.orientation||pa("orientation"),l=pa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));ht(new Gs(window,k,"main",Ju),a)});
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
