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
 * Vivliostyle core 2017.6.1-pre.20171207084005
 */"use strict";(function(factory){if(typeof define === "function" && define.amd){ // AMD
define([],factory);}else if(typeof module === "object"){ // Node.js
var enclosingObject={};module.exports = factory(enclosingObject);}else if(typeof exports === "object"){ // CommonJS
var enclosingObject={};exports = factory(enclosingObject);}else { // Attach to the window object
factory(window);}})((function(enclosingObject){enclosingObject = enclosingObject || {};var n,aa=this;function ba(a,b){var c="undefined" !== typeof enclosingObject && enclosingObject?enclosingObject:window,d=a.split("."),c=c || aa;d[0] in c || !c.execScript || c.execScript("var " + d[0]);for(var e;d.length && (e = d.shift());) d.length || void 0 === b?c[e]?c = c[e]:c = c[e] = {}:c[e] = b;}function t(a,b){function c(){}c.prototype = b.prototype;a.Yf = b.prototype;a.prototype = new c();a.prototype.constructor = a;a.Yg = function(a,c,f){for(var d=Array(arguments.length - 2),e=2;e < arguments.length;e++) d[e - 2] = arguments[e];return b.prototype[c].apply(a,d);};};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else {var b=Error().stack;b && (this.stack = b);}a && (this.message = String(a));}t(ca,Error);ca.prototype.name = "CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length && 1 < c.length;) d += c.shift() + e.shift();return d + c.join("%s");};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift();}t(ea,ca);ea.prototype.name = "AssertionError";function fa(a,b){throw new ea("Failure" + (a?": " + a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b && (b.frameTrace || b.stack);a = [].concat(a.messages);b && (0 < a.length && (a = a.concat(["\n"])),a = a.concat([b.toString()]),c && (a = a.concat(["\n"]).concat(c)));return a;}function ha(a){a = Array.from(a);var b=null;a[0] instanceof Error && (b = a.shift());return {error:b,messages:a};}function ja(a){function b(a){return function(b){return a.apply(c,b);};}var c=a || console;this.h = b(c.debug || c.log);this.l = b(c.info || c.log);this.A = b(c.warn || c.log);this.j = b(c.error || c.log);this.f = {};}function ka(a,b,c){(a = a.f[b]) && a.forEach(function(a){a(c);});}function la(a,b){var c=v,d=c.f[a];d || (d = c.f[a] = []);d.push(b);}ja.prototype.debug = function(a){var b=ha(arguments);this.h(ga(b));ka(this,1,b);};ja.prototype.g = function(a){var b=ha(arguments);this.l(ga(b));ka(this,2,b);};ja.prototype.b = function(a){var b=ha(arguments);this.A(ga(b));ka(this,3,b);};ja.prototype.error = function(a){var b=ha(arguments);this.j(ga(b));ka(this,4,b);};var v=new ja();function ma(a){var b=a.match(/^([^#]*)/);return b?b[1]:a;}var na=window.location.href,oa=window.location.href;function pa(a,b){if(!b || a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/) && (b += "/");var c;if(a.match(/^\/\//))return (c = b.match(/^(\w{2,}:)\/\//))?c[1] + a:a;if(a.match(/^\//))return (c = b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1] + a:a;a.match(/^\.(\/|$)/) && (a = a.substr(1));c = b;var d=c.match(/^([^#?]*)/);b = d?d[1]:c;if(a.match(/^\#/))return b + a;c = b.lastIndexOf("/");if(0 > c)return a;for(d = b.substr(0,c + 1) + a;;) {c = d.indexOf("/../");if(0 >= c)break;var e=d.lastIndexOf("/",c - 1);if(0 >= e)break;d = d.substr(0,e) + d.substr(c + 3);}return d.replace(/\/(\.\/)+/g,"/");}function qa(a){a = new RegExp("#(.*&)?" + ra(a) + "=([^#&]*)");return (a = window.location.href.match(a))?a[2]:null;}function sa(a,b){var c=new RegExp("#(.*&)?" + ra("f") + "=([^#&]*)"),d=a.match(c);return d?(c = d[2].length,d = d.index + d[0].length - c,a.substr(0,d) + b + a.substr(d + c)):a.match(/#/)?a + "&f=" + b:a + "#f=" + b;}function ta(a){return null == a?a:a.toString();}function ua(){this.b = [null];}ua.prototype.length = function(){return this.b.length - 1;};function va(a,b){a && (b = "-" + b,a = a.replace(/-/g,""),"moz" === a && (a = "Moz"));return a + b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase();});}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};function ya(a,b){if("writing-mode" === b){var c=document.createElement("span");if("-ms-" === a)return c.style.setProperty(a + b,"tb-rl"),"tb-rl" === c.style["writing-mode"];c.style.setProperty(a + b,"vertical-rl");return "vertical-rl" === c.style[a + b];}return "string" === typeof document.documentElement.style[va(a,b)];}function za(a){var b=xa[a];if(b || null === b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a] = ["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a] = ["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a] = ["-webkit-clip-path","clip-path"];}for(b = 0;b < wa.length;b++) {var c=wa[b];if(ya(c,a))return b = c + a,xa[a] = [b],[b];}v.b("Property not supported by the browser: ",a);return xa[a] = null;}function w(a,b,c){try{var d=za(b);d && d.forEach(function(b){if("-ms-writing-mode" === b)switch(c){case "horizontal-tb":c = "lr-tb";break;case "vertical-rl":c = "tb-rl";break;case "vertical-lr":c = "tb-lr";}a && a.style && a.style.setProperty(b,c);});}catch(e) {v.b(e);}}function Ca(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b);}catch(e) {}return c || "";}function Da(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b || "http://www.w3.org/1999/xhtml" != a.namespaceURI || (b = a.getAttribute("lang"));return b;}function Ea(){this.b = [];}Ea.prototype.append = function(a){this.b.push(a);return this;};Ea.prototype.toString = function(){var a=this.b.join("");this.b = [a];return a;};function Fa(a){return "\\" + a.charCodeAt(0).toString(16) + " ";}function Ga(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Fa);}function Ha(a){return a.replace(/[\u0000-\u001F"]/g,Fa);}function Ia(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent);}function Ja(a){return !!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/);}function ra(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return ("string" === typeof b?b:"\\u") + (65536 | a.charCodeAt(0)).toString(16).substr(1);});}function Ka(a){var b=":",b="string" === typeof b?b:"\\u",c=new RegExp(ra(b) + "[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string" === typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16));});}function La(a){if(!a)throw "Assert failed";}function Ma(a,b){for(var c=0,d=a;;) {La(c <= d);La(!c || !b(c - 1));La(d == a || b(d));if(c == d)return c;var e=c + d >> 1;b(e)?d = e:c = e + 1;}}function Na(a,b){return a - b;}function Oa(a,b){for(var c={},d=0;d < a.length;d++) {var e=a[d],f=b(e);f && !c[f] && (c[f] = e);}return c;}var Pa={};function Qa(a,b){for(var c={},d=0;d < a.length;d++) {var e=a[d],f=b(e);f && (c[f]?c[f].push(e):c[f] = [e]);}return c;}function Ra(a,b){for(var c=Array(a.length),d=0;d < a.length;d++) c[d] = b(a[d],d);return c;}function Sa(a,b){var c={},d;for(d in a) c[d] = b(a[d],d);return c;}function Ta(){this.h = {};}function Ua(a,b){var c=a.h[b.type];if(c){b.target = a;b.currentTarget = a;for(var d=0;d < c.length;d++) c[d](b);}}Ta.prototype.addEventListener = function(a,b,c){c || ((c = this.h[a])?c.push(b):this.h[a] = [b]);};Ta.prototype.removeEventListener = function(a,b,c){!c && (a = this.h[a]) && (b = a.indexOf(b),0 <= b && a.splice(b,1));};var Va=null,Wa=null,Xa=null,Ya=null;function Za(a){return 1 == a.nodeType && (a = a.getAttribute("id")) && a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null;}function $a(a){return "^" + a;}function ab(a){return a.substr(1);}function bb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,ab):a;}function cb(a){for(var b={};a;) {var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a: {e = c[2];var f=[];do {var g=e.match(/^(\^,|[^,])*/),h=bb(g[0]);e = e.substr(g[0].length + 1);if(!e && !f.length){e = h;break a;}f.push(h);}while(e);e = f;}b[d] = e;a = a.substr(c[0].length);}return b;}function db(){}db.prototype.g = function(a){a.append("!");};db.prototype.h = function(){return !1;};function eb(a,b,c){this.index = a;this.id = b;this.tb = c;}eb.prototype.g = function(a){a.append("/");a.append(this.index.toString());if(this.id || this.tb)a.append("["),this.id && a.append(this.id),this.tb && (a.append(";s="),a.append(this.tb)),a.append("]");};eb.prototype.h = function(a){if(1 != a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index / 2) - 1;0 > e || !d?(c = b.firstChild,a.node = c || b):(c = c[Math.min(e,d - 1)],this.index & 1 && ((b = c.nextSibling) && 1 != b.nodeType?c = b:a.K = !0),a.node = c);if(this.id && (a.K || this.id != Za(a.node)))throw Error("E_CFI_ID_MISMATCH");a.tb = this.tb;return !0;};function fb(a,b,c,d){this.offset = a;this.f = b;this.b = c;this.tb = d;}fb.prototype.h = function(a){if(0 < this.offset && !a.K){for(var b=this.offset,c=a.node;;) {var d=c.nodeType;if(1 == d)break;var e=c.nextSibling;if(3 <= d && 5 >= d){d = c.textContent.length;if(b <= d)break;if(!e){b = d;break;}b -= d;}if(!e){b = 0;break;}c = e;}a.node = c;a.offset = b;}a.tb = this.tb;return !0;};fb.prototype.g = function(a){a.append(":");a.append(this.offset.toString());if(this.f || this.b || this.tb){a.append("[");if(this.f || this.b)this.f && a.append(this.f.replace(/[\[\]\(\),=;^]/g,$a)),a.append(","),this.b && a.append(this.b.replace(/[\[\]\(\),=;^]/g,$a));this.tb && (a.append(";s="),a.append(this.tb));a.append("]");}};function gb(){this.na = null;}function hb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;) switch(d.charAt(e)){case "/":e++;c = d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e + c[0].length,g=parseInt(c[1],10),h=c[3],c=cb(c[4]);f.push(new eb(g,h,ta(c.s)));break;case ":":e++;c = d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e += c[0].length;g = parseInt(c[1],10);(h = c[4]) && (h = bb(h));var l=c[7];l && (l = bb(l));c = cb(c[10]);f.push(new fb(g,h,l,ta(c.s)));break;case "!":e++;f.push(new db());break;case "~":case "@":case "":a.na = f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function ib(a,b){for(var c={node:b.documentElement,offset:0,K:!1,tb:null,ed:null},d=0;d < a.na.length;d++) if(!a.na[d].h(c)){++d < a.na.length && (c.ed = new gb(),c.ed.na = a.na.slice(d));break;}return c;}gb.prototype.trim = function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"");};function jb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;) {switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c += m,h || (h = k)):(c > m && (c = m),d = !0,h = k.substr(0,c),l = k.substr(c));b = b.previousSibling;continue;case 8:b = b.previousSibling;continue;}break;}if(0 < c || h || l)h = a.trim(h,!1),l = a.trim(l,!0),f.push(new fb(c,h,l,e)),e = null;for(;g && g && 9 != g.nodeType;) {c = d?null:Za(b);for(d = d?1:0;b;) 1 == b.nodeType && (d += 2),b = b.previousSibling;f.push(new eb(d,c,e));e = null;b = g;g = g.parentNode;d = !1;}f.reverse();a.na?(f.push(new db()),a.na = f.concat(a.na)):a.na = f;}gb.prototype.toString = function(){if(!this.na)return "";var a=new Ea();a.append("epubcfi(");for(var b=0;b < this.na.length;b++) this.na[b].g(a);a.append(")");return a.toString();};function kb(){return {fontFamily:"serif",lineHeight:1.25,margin:8,me:!1,ce:25,le:!1,ue:!1,ub:!1,Jc:1,Oe:{print:!0},hc:void 0};}function lb(a){return {fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,me:a.me,ce:a.ce,le:a.le,ue:a.ue,ub:a.ub,Jc:a.Jc,Oe:Object.assign({},a.Oe),hc:a.hc?Object.assign({},a.hc):void 0};}var mb=kb(),nb={};function pb(a,b,c,d){a = Math.min((a - 0) / c,(b - 0) / d);return "matrix(" + a + ",0,0," + a + ",0,0)";}function qb(a){return '"' + Ha(a + "") + '"';}function rb(a){return Ga(a + "");}function sb(a,b){return a?Ga(a) + "." + Ga(b):Ga(b);}var tb=0;function ub(a,b){this.parent = a;this.A = "S" + tb++;this.C = [];this.b = new vb(this,0);this.f = new vb(this,1);this.j = new vb(this,!0);this.h = new vb(this,!1);a && a.C.push(this);this.values = {};this.G = {};this.D = {};this.l = b;if(!a){var c=this.D;c.floor = Math.floor;c.ceil = Math.ceil;c.round = Math.round;c.sqrt = Math.sqrt;c.min = Math.min;c.max = Math.max;c.letterbox = pb;c["css-string"] = qb;c["css-name"] = rb;c["typeof"] = function(a){return typeof a;};wb(this,"page-width",function(){return this.Wb();});wb(this,"page-height",function(){return this.Vb();});wb(this,"pref-font-family",function(){return this.Y.fontFamily;});wb(this,"pref-night-mode",function(){return this.Y.ue;});wb(this,"pref-hyphenate",function(){return this.Y.me;});wb(this,"pref-margin",function(){return this.Y.margin;});wb(this,"pref-line-height",function(){return this.Y.lineHeight;});wb(this,"pref-column-width",function(){return this.Y.ce * this.fontSize;});wb(this,"pref-horizontal",function(){return this.Y.le;});wb(this,"pref-spread-view",function(){return this.Y.ub;});}}function wb(a,b,c){a.values[b] = new xb(a,c,b);}function yb(a,b){a.values["page-number"] = b;}function zb(a,b){a.D["has-content"] = b;}var Ab={px:1,"in":96,pt:4 / 3,pc:16,cm:96 / 2.54,mm:96 / 25.4,q:96 / 2.54 / 40,em:16,rem:16,ex:8,dppx:1,dpi:1 / 96,dpcm:2.54 / 96};function Bb(a){switch(a){case "q":case "rem":return !0;default:return !1;}}function Cb(a,b,c,d){this.Ka = b;this.yb = c;this.O = null;this.Wb = function(){return this.O?this.O:this.Y.ub?Math.floor(b / 2) - this.Y.Jc:b;};this.J = null;this.Vb = function(){return this.J?this.J:c;};this.A = d;this.oa = null;this.fontSize = function(){return this.oa?this.oa:d;};this.Y = mb;this.H = {};}function Db(a,b){a.H[b.A] = {};for(var c=0;c < b.C.length;c++) Db(a,b.C[c]);}function Eb(a,b,c){return "vw" == b?a.Wb() / 100:"vh" == b?a.Vb() / 100:"em" == b || "rem" == b?c?a.A:a.fontSize():"ex" == b?Ab.ex * (c?a.A:a.fontSize()) / Ab.em:Ab[b];}function Fb(a,b,c){do {var d=b.values[c];if(d || b.l && (d = b.l.call(a,c,!1)))return d;b = b.parent;}while(b);throw Error("Name '" + c + "' is undefined");}function Gb(a,b,c,d,e){do {var f=b.G[c];if(f || b.l && (f = b.l.call(a,c,!0)))return f;if(f = b.D[c]){if(e)return b.b;c = Array(d.length);for(e = 0;e < d.length;e++) c[e] = d[e].evaluate(a);return new vb(b,f.apply(a,c));}b = b.parent;}while(b);throw Error("Function '" + c + "' is undefined");}function Hb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e && (d = e[1],b = e[2]);var f=e = null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c && (e = c.evaluate(a));}switch(b){case "width":f = a.Wb();break;case "height":f = a.Vb();break;case "device-width":f = window.screen.availWidth;break;case "device-height":f = window.screen.availHeight;break;case "color":f = window.screen.pixelDepth;}if(null != f && null != e)switch(d){case "min":return f >= e;case "max":return f <= e;default:return f == e;}else if(null != f && !c)return !!f;return !1;}function Ib(a){this.b = a;this.g = "_" + tb++;}n = Ib.prototype;n.toString = function(){var a=new Ea();this.ya(a,0);return a.toString();};n.ya = function(){throw Error("F_ABSTRACT");};n.jb = function(){throw Error("F_ABSTRACT");};n.ab = function(){return this;};n.ic = function(a){return a === this;};function Jb(a,b,c,d){var e=d[a.g];if(null != e)return e === nb?!1:e;d[a.g] = nb;b = a.ic(b,c,d);return d[a.g] = b;}n.evaluate = function(a){var b;b = (b = a.H[this.b.A])?b[this.g]:void 0;if("undefined" != typeof b)return b;b = this.jb(a);var c=this.g,d=this.b,e=a.H[d.A];e || (e = {},a.H[d.A] = e);return e[c] = b;};n.Ue = function(){return !1;};function Kb(a,b){Ib.call(this,a);this.f = b;}t(Kb,Ib);n = Kb.prototype;n.Ie = function(){throw Error("F_ABSTRACT");};n.Pe = function(){throw Error("F_ABSTRACT");};n.jb = function(a){a = this.f.evaluate(a);return this.Pe(a);};n.ic = function(a,b,c){return a === this || Jb(this.f,a,b,c);};n.ya = function(a,b){10 < b && a.append("(");a.append(this.Ie());this.f.ya(a,10);10 < b && a.append(")");};n.ab = function(a,b){var c=this.f.ab(a,b);return c === this.f?this:new this.constructor(this.b,c);};function Lb(a,b,c){Ib.call(this,a);this.f = b;this.h = c;}t(Lb,Ib);n = Lb.prototype;n.rd = function(){throw Error("F_ABSTRACT");};n.Va = function(){throw Error("F_ABSTRACT");};n.rb = function(){throw Error("F_ABSTRACT");};n.jb = function(a){var b=this.f.evaluate(a);a = this.h.evaluate(a);return this.rb(b,a);};n.ic = function(a,b,c){return a === this || Jb(this.f,a,b,c) || Jb(this.h,a,b,c);};n.ya = function(a,b){var c=this.rd();c <= b && a.append("(");this.f.ya(a,c);a.append(this.Va());this.h.ya(a,c);c <= b && a.append(")");};n.ab = function(a,b){var c=this.f.ab(a,b),d=this.h.ab(a,b);return c === this.f && d === this.h?this:new this.constructor(this.b,c,d);};function Mb(a,b,c){Lb.call(this,a,b,c);}t(Mb,Lb);Mb.prototype.rd = function(){return 1;};function Nb(a,b,c){Lb.call(this,a,b,c);}t(Nb,Lb);Nb.prototype.rd = function(){return 2;};function Ob(a,b,c){Lb.call(this,a,b,c);}t(Ob,Lb);Ob.prototype.rd = function(){return 3;};function Pb(a,b,c){Lb.call(this,a,b,c);}t(Pb,Lb);Pb.prototype.rd = function(){return 4;};function Qb(a,b){Kb.call(this,a,b);}t(Qb,Kb);Qb.prototype.Ie = function(){return "!";};Qb.prototype.Pe = function(a){return !a;};function Rb(a,b){Kb.call(this,a,b);}t(Rb,Kb);Rb.prototype.Ie = function(){return "-";};Rb.prototype.Pe = function(a){return -a;};function Sb(a,b,c){Lb.call(this,a,b,c);}t(Sb,Mb);Sb.prototype.Va = function(){return "&&";};Sb.prototype.jb = function(a){return this.f.evaluate(a) && this.h.evaluate(a);};function Tb(a,b,c){Lb.call(this,a,b,c);}t(Tb,Sb);Tb.prototype.Va = function(){return " and ";};function Ub(a,b,c){Lb.call(this,a,b,c);}t(Ub,Mb);Ub.prototype.Va = function(){return "||";};Ub.prototype.jb = function(a){return this.f.evaluate(a) || this.h.evaluate(a);};function Vb(a,b,c){Lb.call(this,a,b,c);}t(Vb,Ub);Vb.prototype.Va = function(){return ", ";};function Wb(a,b,c){Lb.call(this,a,b,c);}t(Wb,Nb);Wb.prototype.Va = function(){return "<";};Wb.prototype.rb = function(a,b){return a < b;};function Xb(a,b,c){Lb.call(this,a,b,c);}t(Xb,Nb);Xb.prototype.Va = function(){return "<=";};Xb.prototype.rb = function(a,b){return a <= b;};function Yb(a,b,c){Lb.call(this,a,b,c);}t(Yb,Nb);Yb.prototype.Va = function(){return ">";};Yb.prototype.rb = function(a,b){return a > b;};function Zb(a,b,c){Lb.call(this,a,b,c);}t(Zb,Nb);Zb.prototype.Va = function(){return ">=";};Zb.prototype.rb = function(a,b){return a >= b;};function $b(a,b,c){Lb.call(this,a,b,c);}t($b,Nb);$b.prototype.Va = function(){return "==";};$b.prototype.rb = function(a,b){return a == b;};function ac(a,b,c){Lb.call(this,a,b,c);}t(ac,Nb);ac.prototype.Va = function(){return "!=";};ac.prototype.rb = function(a,b){return a != b;};function bc(a,b,c){Lb.call(this,a,b,c);}t(bc,Ob);bc.prototype.Va = function(){return "+";};bc.prototype.rb = function(a,b){return a + b;};function cc(a,b,c){Lb.call(this,a,b,c);}t(cc,Ob);cc.prototype.Va = function(){return " - ";};cc.prototype.rb = function(a,b){return a - b;};function dc(a,b,c){Lb.call(this,a,b,c);}t(dc,Pb);dc.prototype.Va = function(){return "*";};dc.prototype.rb = function(a,b){return a * b;};function ec(a,b,c){Lb.call(this,a,b,c);}t(ec,Pb);ec.prototype.Va = function(){return "/";};ec.prototype.rb = function(a,b){return a / b;};function fc(a,b,c){Lb.call(this,a,b,c);}t(fc,Pb);fc.prototype.Va = function(){return "%";};fc.prototype.rb = function(a,b){return a % b;};function gc(a,b,c){Ib.call(this,a);this.L = b;this.ha = c.toLowerCase();}t(gc,Ib);gc.prototype.ya = function(a){a.append(this.L.toString());a.append(Ga(this.ha));};gc.prototype.jb = function(a){return this.L * Eb(a,this.ha,!1);};function hc(a,b){Ib.call(this,a);this.f = b;}t(hc,Ib);hc.prototype.ya = function(a){a.append(this.f);};hc.prototype.jb = function(a){return Fb(a,this.b,this.f).evaluate(a);};hc.prototype.ic = function(a,b,c){return a === this || Jb(Fb(b,this.b,this.f),a,b,c);};function ic(a,b,c){Ib.call(this,a);this.f = b;this.name = c;}t(ic,Ib);ic.prototype.ya = function(a){this.f && a.append("not ");a.append(Ga(this.name));};ic.prototype.jb = function(a){var b=this.name;a = "all" === b || !!a.Y.Oe[b];return this.f?!a:a;};ic.prototype.ic = function(a,b,c){return a === this || Jb(this.value,a,b,c);};ic.prototype.Ue = function(){return !0;};function xb(a,b,c){Ib.call(this,a);this.Fc = b;this.Nc = c;}t(xb,Ib);xb.prototype.ya = function(a){a.append(this.Nc);};xb.prototype.jb = function(a){return this.Fc.call(a);};function jc(a,b,c){Ib.call(this,a);this.h = b;this.f = c;}t(jc,Ib);jc.prototype.ya = function(a){a.append(this.h);var b=this.f;a.append("(");for(var c=0;c < b.length;c++) c && a.append(","),b[c].ya(a,0);a.append(")");};jc.prototype.jb = function(a){return Gb(a,this.b,this.h,this.f,!1).ab(a,this.f).evaluate(a);};jc.prototype.ic = function(a,b,c){if(a === this)return !0;for(var d=0;d < this.f.length;d++) if(Jb(this.f[d],a,b,c))return !0;return Jb(Gb(b,this.b,this.h,this.f,!0),a,b,c);};jc.prototype.ab = function(a,b){for(var c,d=c = this.f,e=0;e < c.length;e++) {var f=c[e].ab(a,b);if(c !== d)d[e] = f;else if(f !== c[e]){for(var d=Array(c.length),g=0;g < e;g++) d[g] = c[g];d[e] = f;}}c = d;return c === this.f?this:new jc(this.b,this.h,c);};function kc(a,b,c,d){Ib.call(this,a);this.f = b;this.j = c;this.h = d;}t(kc,Ib);kc.prototype.ya = function(a,b){0 < b && a.append("(");this.f.ya(a,0);a.append("?");this.j.ya(a,0);a.append(":");this.h.ya(a,0);0 < b && a.append(")");};kc.prototype.jb = function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.h.evaluate(a);};kc.prototype.ic = function(a,b,c){return a === this || Jb(this.f,a,b,c) || Jb(this.j,a,b,c) || Jb(this.h,a,b,c);};kc.prototype.ab = function(a,b){var c=this.f.ab(a,b),d=this.j.ab(a,b),e=this.h.ab(a,b);return c === this.f && d === this.j && e === this.h?this:new kc(this.b,c,d,e);};function vb(a,b){Ib.call(this,a);this.f = b;}t(vb,Ib);vb.prototype.ya = function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ha(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};vb.prototype.jb = function(){return this.f;};function lc(a,b,c){Ib.call(this,a);this.name = b;this.value = c;}t(lc,Ib);lc.prototype.ya = function(a){a.append("(");a.append(Ha(this.name.name));a.append(":");this.value.ya(a,0);a.append(")");};lc.prototype.jb = function(a){return Hb(a,this.name.name,this.value);};lc.prototype.ic = function(a,b,c){return a === this || Jb(this.value,a,b,c);};lc.prototype.ab = function(a,b){var c=this.value.ab(a,b);return c === this.value?this:new lc(this.b,this.name,c);};function mc(a,b){Ib.call(this,a);this.index = b;}t(mc,Ib);mc.prototype.ya = function(a){a.append("$");a.append(this.index.toString());};mc.prototype.ab = function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: " + this.index);return c;};function nc(a,b,c){return b === a.h || b === a.b || c == a.h || c == a.b?a.h:b === a.j || b === a.f?c:c === a.j || c === a.f?b:new Sb(a,b,c);}function x(a,b,c){return b === a.b?c:c === a.b?b:new bc(a,b,c);}function y(a,b,c){return b === a.b?new Rb(a,c):c === a.b?b:new cc(a,b,c);}function oc(a,b,c){return b === a.b || c === a.b?a.b:b === a.f?c:c === a.f?b:new dc(a,b,c);}function pc(a,b,c){return b === a.b?a.b:c === a.f?b:new ec(a,b,c);};var qc={};function rc(){}n = rc.prototype;n.bc = function(a){for(var b=0;b < a.length;b++) a[b].ca(this);};n.Fe = function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Ge = function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.od = function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.ac = function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Rc = function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Qc = function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Pc = function(a){return this.Qc(a);};n.Wd = function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Sc = function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Gb = function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.$b = function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Jb = function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Oc = function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function sc(){}t(sc,rc);n = sc.prototype;n.bc = function(a){for(var b=null,c=0;c < a.length;c++) {var d=a[c],e=d.ca(this);if(b)b[c] = e;else if(d !== e){b = Array(a.length);for(d = 0;d < c;d++) b[d] = a[d];b[c] = e;}}return b || a;};n.od = function(a){return a;};n.ac = function(a){return a;};n.Ge = function(a){return a;};n.Rc = function(a){return a;};n.Qc = function(a){return a;};n.Pc = function(a){return a;};n.Wd = function(a){return a;};n.Sc = function(a){return a;};n.Gb = function(a){var b=this.bc(a.values);return b === a.values?a:new tc(b);};n.$b = function(a){var b=this.bc(a.values);return b === a.values?a:new uc(b);};n.Jb = function(a){var b=this.bc(a.values);return b === a.values?a:new vc(a.name,b);};n.Oc = function(a){return a;};function wc(){}n = wc.prototype;n.toString = function(){var a=new Ea();this.Ta(a,!0);return a.toString();};n.stringValue = function(){var a=new Ea();this.Ta(a,!1);return a.toString();};n.ua = function(){throw Error("F_ABSTRACT");};n.Ta = function(a){a.append("[error]");};n.Se = function(){return !1;};n.nc = function(){return !1;};n.Ve = function(){return !1;};n.Hf = function(){return !1;};n.Gd = function(){return !1;};function xc(){if(B)throw Error("E_INVALID_CALL");}t(xc,wc);xc.prototype.ua = function(a){return new vb(a,"");};xc.prototype.Ta = function(){};xc.prototype.ca = function(a){return a.Fe(this);};var B=new xc();function yc(){if(zc)throw Error("E_INVALID_CALL");}t(yc,wc);yc.prototype.ua = function(a){return new vb(a,"/");};yc.prototype.Ta = function(a){a.append("/");};yc.prototype.ca = function(a){return a.Ge(this);};var zc=new yc();function Ac(a){this.Nc = a;}t(Ac,wc);Ac.prototype.ua = function(a){return new vb(a,this.Nc);};Ac.prototype.Ta = function(a,b){b?(a.append('"'),a.append(Ha(this.Nc)),a.append('"')):a.append(this.Nc);};Ac.prototype.ca = function(a){return a.od(this);};function Bc(a){this.name = a;if(qc[a])throw Error("E_INVALID_CALL");qc[a] = this;}t(Bc,wc);Bc.prototype.ua = function(a){return new vb(a,this.name);};Bc.prototype.Ta = function(a,b){b?a.append(Ga(this.name)):a.append(this.name);};Bc.prototype.ca = function(a){return a.ac(this);};Bc.prototype.Hf = function(){return !0;};function C(a){var b=qc[a];b || (b = new Bc(a));return b;}function D(a,b){this.L = a;this.ha = b.toLowerCase();}t(D,wc);D.prototype.ua = function(a,b){return this.L?b && "%" == this.ha?100 == this.L?b:new dc(a,b,new vb(a,this.L / 100)):new gc(a,this.L,this.ha):a.b;};D.prototype.Ta = function(a){a.append(this.L.toString());a.append(this.ha);};D.prototype.ca = function(a){return a.Rc(this);};D.prototype.nc = function(){return !0;};function Cc(a){this.L = a;}t(Cc,wc);Cc.prototype.ua = function(a){return this.L?1 == this.L?a.f:new vb(a,this.L):a.b;};Cc.prototype.Ta = function(a){a.append(this.L.toString());};Cc.prototype.ca = function(a){return a.Qc(this);};Cc.prototype.Ve = function(){return !0;};function Dc(a){this.L = a;}t(Dc,Cc);Dc.prototype.ca = function(a){return a.Pc(this);};function Ec(a){this.b = a;}t(Ec,wc);Ec.prototype.Ta = function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b);};Ec.prototype.ca = function(a){return a.Wd(this);};function Fc(a){this.url = a;}t(Fc,wc);Fc.prototype.Ta = function(a){a.append('url("');a.append(Ha(this.url));a.append('")');};Fc.prototype.ca = function(a){return a.Sc(this);};function Gc(a,b,c,d){var e=b.length;b[0].Ta(a,d);for(var f=1;f < e;f++) a.append(c),b[f].Ta(a,d);}function tc(a){this.values = a;}t(tc,wc);tc.prototype.Ta = function(a,b){Gc(a,this.values," ",b);};tc.prototype.ca = function(a){return a.Gb(this);};tc.prototype.Gd = function(){return !0;};function uc(a){this.values = a;}t(uc,wc);uc.prototype.Ta = function(a,b){Gc(a,this.values,",",b);};uc.prototype.ca = function(a){return a.$b(this);};function vc(a,b){this.name = a;this.values = b;}t(vc,wc);vc.prototype.Ta = function(a,b){a.append(Ga(this.name));a.append("(");Gc(a,this.values,",",b);a.append(")");};vc.prototype.ca = function(a){return a.Jb(this);};function E(a){this.Cc = a;}t(E,wc);E.prototype.ua = function(){return this.Cc;};E.prototype.Ta = function(a){a.append("-epubx-expr(");this.Cc.ya(a,0);a.append(")");};E.prototype.ca = function(a){return a.Oc(this);};E.prototype.Se = function(){return !0;};function Hc(a,b){if(a){if(a.nc())return Eb(b,a.ha,!1) * a.L;if(a.Ve())return a.L;}return 0;}var Ic=C("absolute"),Jc=C("all"),Kc=C("always"),Lc=C("auto");C("avoid");var Mc=C("balance"),Nc=C("balance-all"),Oc=C("block"),Pc=C("block-end"),Qc=C("block-start"),Rc=C("both"),Sc=C("bottom"),Tc=C("border-box"),Uc=C("break-all"),Vc=C("break-word"),Wc=C("crop"),Xc=C("cross");C("column");var Yc=C("exclusive"),Zc=C("false"),$c=C("fixed"),ad=C("flex"),bd=C("footnote"),cd=C("footer"),dd=C("header");C("hidden");var ed=C("horizontal-tb"),fd=C("inherit"),gd=C("inline"),hd=C("inline-block"),id=C("inline-end"),jd=C("inline-start"),kd=C("landscape"),ld=C("left"),md=C("line"),nd=C("list-item"),od=C("ltr");C("manual");var F=C("none"),pd=C("normal"),qd=C("oeb-page-foot"),rd=C("oeb-page-head"),sd=C("page"),td=C("relative"),ud=C("right"),vd=C("same"),wd=C("scale"),xd=C("snap-block");C("spread");var yd=C("static"),zd=C("rtl"),Ad=C("table"),Bd=C("table-caption"),Cd=C("table-cell"),Dd=C("table-footer-group"),Ed=C("table-header-group");C("table-row");var Fd=C("top"),Gd=C("transparent"),Hd=C("vertical-lr"),Id=C("vertical-rl"),Jd=C("visible"),Kd=C("true"),Ld=new D(100,"%"),Md=new D(100,"vw"),Nd=new D(100,"vh"),Od=new D(0,"px"),Pd={"font-size":1,color:2};function Qd(a,b){return (Pd[a] || Number.MAX_VALUE) - (Pd[b] || Number.MAX_VALUE);};var Rd={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR",POST_LAYOUT_BLOCK:"POST_LAYOUT_BLOCK"},Sd={};function Td(a,b){if(Rd[a]){var c=Sd[a];c || (c = Sd[a] = []);c.push(b);}else v.b(Error("Skipping unknown plugin hook '" + a + "'."));}function Ud(a){return Sd[a] || [];}ba("vivliostyle.plugin.registerHook",Td);ba("vivliostyle.plugin.removeHook",function(a,b){if(Rd[a]){var c=Sd[a];if(c){var d=c.indexOf(b);0 <= d && c.splice(d,1);}}else v.b(Error("Ignoring unknown plugin hook '" + a + "'."));});var Vd=null,Wd=null;function J(a){if(!Vd)throw Error("E_TASK_NO_CONTEXT");Vd.name || (Vd.name = a);var b=Vd;a = new Xd(b,b.top,a);b.top = a;a.b = Yd;return a;}function L(a){return new Zd(a);}function $d(a,b,c){a = J(a);a.j = c;try{b(a);}catch(d) {ae(a.f,d,a);}return a.result();}function be(a){var b=ce,c;Vd?c = Vd.f:(c = Wd) || (c = new de(new ee()));b(c,a,void 0);}var Yd=1;function ee(){}ee.prototype.currentTime = function(){return new Date().valueOf();};function fe(a,b){return setTimeout(a,b);}function de(a){this.g = a;this.h = 1;this.slice = 25;this.l = 0;this.f = new ua();this.b = this.A = null;this.j = !1;this.order = 0;Wd || (Wd = this);}function ge(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null != a.b){if(c + a.h > a.A)return;clearTimeout(a.b);}b -= c;b <= a.h && (b = a.h);a.A = c + b;a.b = fe(function(){a.b = null;null != a.b && (clearTimeout(a.b),a.b = null);a.j = !0;try{var b=a.g.currentTime();for(a.l = b + a.slice;a.f.length();) {var c=a.f.b[1];if(c.b > b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1 < h){for(var l=1;;) {var k=2 * l;if(k >= h)break;if(0 < he(f.b[k],g))k + 1 < h && 0 < he(f.b[k + 1],f.b[k]) && k++;else if(k + 1 < h && 0 < he(f.b[k + 1],g))k++;else break;f.b[l] = f.b[k];l = k;}f.b[l] = g;}if(!c.g){var l=c,m=l.f;l.f = null;m && m.b == l && (m.b = null,k = Vd,Vd = m,M(m.top,l.result),Vd = k);}b = a.g.currentTime();if(b >= a.l)break;}}catch(p) {v.error(p);}a.j = !1;a.f.length() && ge(a);},b);}}de.prototype.hb = function(a,b){var c=this.g.currentTime();a.order = this.order++;a.b = c + (b || 0);a: {for(var c=this.f,d=c.b.length;1 < d;) {var e=Math.floor(d / 2),f=c.b[e];if(0 < he(f,a)){c.b[d] = a;break a;}c.b[d] = f;d = e;}c.b[1] = a;}ge(this);};function ce(a,b,c){var d=new ie(a,c || "");d.top = new Xd(d,null,"bootstrap");d.top.b = Yd;d.top.then(function(){function a(){d.j = !1;for(var a=0;a < d.h.length;a++) {var b=d.h[a];try{b();}catch(h) {v.error(h);}}}try{b().then(function(b){d.result = b;a();});}catch(f) {ae(d,f),a();}});c = Vd;Vd = d;a.hb(je(d.top,"bootstrap"));Vd = c;return d;}function ke(a){this.f = a;this.order = this.b = 0;this.result = null;this.g = !1;}function he(a,b){return b.b - a.b || b.order - a.order;}ke.prototype.hb = function(a,b){this.result = a;this.f.f.hb(this,b);};function ie(a,b){this.f = a;this.name = b;this.h = [];this.g = null;this.j = !0;this.b = this.top = this.l = this.result = null;}function le(a,b){a.h.push(b);}ie.prototype.join = function(){var a=J("Task.join");if(this.j){var b=je(a,this),c=this;le(this,function(){b.hb(c.result);});}else M(a,this.result);return a.result();};function ae(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack + "\n\t---- async ---\n":"",e=a.top;e;e = e.parent) d += "\t",d += e.name,d += "\n";b.frameTrace = d;}if(c){for(d = a.top;d && d != c;) d = d.parent;d == c && (a.top = d);}for(a.g = b;a.top && !a.top.j;) a.top = a.top.parent;a.top?(b = a.g,a.g = null,a.top.j(a.top,b)):a.g && v.error(a.g,"Unhandled exception in task",a.name);}function Zd(a){this.value = a;}n = Zd.prototype;n.then = function(a){a(this.value);};n.fa = function(a){return a(this.value);};n.wc = function(a){return new Zd(a);};n.Ea = function(a){M(a,this.value);};n.Ra = function(){return !1;};n.get = function(){return this.value;};function me(a){this.b = a;}n = me.prototype;n.then = function(a){this.b.then(a);};n.fa = function(a){if(this.Ra()){var b=new Xd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b = Yd;this.b.parent = b;this.b.then(function(c){a(c).then(function(a){M(b,a);});});return b.result();}return a(this.b.g);};n.wc = function(a){return this.Ra()?this.fa(function(){return new Zd(a);}):new Zd(a);};n.Ea = function(a){this.Ra()?this.then(function(b){M(a,b);}):M(a,this.b.g);};n.Ra = function(){return this.b.b == Yd;};n.get = function(){if(this.Ra())throw Error("Result is pending");return this.b.g;};function Xd(a,b,c){this.f = a;this.parent = b;this.name = c;this.g = null;this.b = 0;this.j = this.h = null;}function ne(a){if(!Vd)throw Error("F_TASK_NO_CONTEXT");if(a !== Vd.top)throw Error("F_TASK_NOT_TOP_FRAME");}Xd.prototype.result = function(){return new me(this);};function M(a,b){ne(a);Vd.g || (a.g = b);a.b = 2;var c=a.parent;Vd.top = c;if(a.h){try{a.h(b);}catch(d) {ae(a.f,d,c);}a.b = 3;}}Xd.prototype.then = function(a){switch(this.b){case Yd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h = a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b = 3;}catch(d) {this.b = 3,ae(b,d,c);}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE " + this.b);}};function oe(){var a=J("Frame.timeSlice"),b=a.f.f;b.g.currentTime() >= b.l?(v.debug("-- time slice --"),je(a).hb(!0)):M(a,!0);return a.result();}function pe(a){var b=J("Frame.sleep");je(b).hb(!0,a);return b.result();}function qe(a){function b(d){try{for(;d;) {var e=a();if(e.Ra()){e.then(b);return;}e.then(function(a){d = a;});}M(c,!0);}catch(f) {ae(c.f,f,c);}}var c=J("Frame.loop");b(!0);return c.result();}function re(a){var b=Vd;if(!b)throw Error("E_TASK_NO_CONTEXT");return qe(function(){var c;do c = new se(b,b.top),b.top = c,c.b = Yd,a(c),c = c.result();while(!c.Ra() && c.get());return c;});}function je(a,b){ne(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ke(a.f);a.f.b = c;Vd = null;a.f.l = b || null;return c;}function se(a,b){Xd.call(this,a,b,"loop");}t(se,Xd);function O(a){M(a,!0);}function P(a){M(a,!1);};function te(a,b){this.fetch = a;this.name = b;this.f = !1;this.b = this.h = null;this.g = [];}te.prototype.start = function(){if(!this.b){var a=this;this.b = ce(Vd.f,function(){var b=J("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f = !0;a.h = c;a.b = null;a.g = [];if(d)for(var e=0;e < d.length;e++) try{d[e](c);}catch(f) {v.error(f,"Error:");}M(b,c);});return b.result();},this.name);}};function ue(a,b){a.f?b(a.h):a.g.push(b);}te.prototype.get = function(){if(this.f)return L(this.h);this.start();return this.b.join();};function ve(a){if(!a.length)return L(!0);if(1 == a.length)return a[0].get().wc(!0);var b=J("waitForFetches"),c=0;qe(function(){for(;c < a.length;) {var b=a[c++];if(!b.f)return b.get().wc(!0);}return L(!1);}).then(function(){M(b,!0);});return b.result();}function we(a,b){var c=null,d=null;"img" == a.localName && (c = a.getAttribute("width"),d = a.getAttribute("height"));var e=new te(function(){function e(b){l || (l = !0,"img" == a.localName && (c || a.removeAttribute("width"),d || a.removeAttribute("height")),h.hb(b?b.type:"timeout"));}var g=J("loadImage"),h=je(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg" == a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,300)):a.src = b;return g.result();},"loadElement " + b);e.start();return e;};function xe(a){a = a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a = parseInt(a,16);return isNaN(a)?"":65535 >= a?String.fromCharCode(a):1114111 >= a?String.fromCharCode(55296 | a >> 10 & 1023,56320 | a & 1023):"�";}function ye(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,xe);}function ze(){this.type = 0;this.b = !1;this.L = 0;this.text = "";this.position = 0;}function Ae(a,b){var c=Array(128),d;for(d = 0;128 > d;d++) c[d] = a;c[NaN] = 35 == a?35:72;for(d = 0;d < b.length;d += 2) c[b[d]] = b[d + 1];return c;}var Be=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];Be[NaN] = 80;var Ce=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Ce[NaN] = 43;var De=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Ce[NaN] = 43;var Ee=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Ee[NaN] = 35;var Fe=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Fe[NaN] = 45;var Ge=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Ge[NaN] = 37;var He=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];He[NaN] = 38;var Ie=Ae(35,[61,36]),Je=Ae(35,[58,77]),Ke=Ae(35,[61,36,124,50]),Le=Ae(35,[38,51]),Me=Ae(35,[42,54]),Ne=Ae(39,[42,55]),Oe=Ae(54,[42,55,47,56]),Pe=Ae(62,[62,56]),Qe=Ae(35,[61,36,33,70]),Re=Ae(62,[45,71]),Se=Ae(63,[45,56]),Te=Ae(76,[9,72,10,72,13,72,32,72]),Ue=Ae(39,[39,46,10,72,13,72,92,48]),Ve=Ae(39,[34,46,10,72,13,72,92,49]),We=Ae(39,[39,47,10,74,13,74,92,48]),Xe=Ae(39,[34,47,10,74,13,74,92,49]),Ye=Ae(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Ze=Ae(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,72,91,72,93,72,123,72,125,72,NaN,67]),$e=Ae(39,[39,68,10,74,13,74,92,75,NaN,67]),af=Ae(39,[34,68,10,74,13,74,92,75,NaN,67]),bf=Ae(72,[9,39,10,39,13,39,32,39,41,69]);function cf(a,b){this.l = b;this.g = 15;this.A = a;this.j = Array(this.g + 1);this.b = -1;for(var c=this.position = this.f = this.h = 0;c <= this.g;c++) this.j[c] = new ze();}function Q(a){a.h == a.f && df(a);return a.j[a.f];}function R(a,b){(a.h - a.f & a.g) <= b && df(a);return a.j[a.f + b & a.g];}function S(a){a.f = a.f + 1 & a.g;}function ef(a){if(0 > a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f = a.b;a.b = -1;}cf.prototype.error = function(a,b,c){this.l && this.l.error(c,b);};function df(a){var b=a.h,c=0 <= a.b?a.b:a.f,d=a.g;b >= c?c += d:c--;if(c == b){if(0 > a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2 * (a.g + 1) - 1,c=Array(b + 1),d=a.b,e=0;d != a.h;) c[e] = a.j[d],d == a.f && (a.f = e),d = d + 1 & a.g,e++;a.b = 0;a.h = e;a.g = b;for(a.j = c;e <= b;) c[e++] = new ze();b = a.h;c = d = a.g;}for(var e=Be,f=a.A,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;) {var u=f.charCodeAt(g);switch(e[u] || e[65]){case 72:l = 51;m = isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q = !0;continue;case 2:k = g++;e = Ge;continue;case 3:l = 1;k = g++;e = Ce;continue;case 4:k = g++;l = 31;e = Ie;continue;case 33:l = 2;k = ++g;e = Ue;continue;case 34:l = 2;k = ++g;e = Ve;continue;case 6:k = ++g;l = 7;e = Ce;continue;case 7:k = g++;l = 32;e = Ie;continue;case 8:k = g++;l = 21;break;case 9:k = g++;l = 32;e = Le;continue;case 10:k = g++;l = 10;break;case 11:k = g++;l = 11;break;case 12:k = g++;l = 36;e = Ie;continue;case 13:k = g++;l = 23;break;case 14:k = g++;l = 16;break;case 15:l = 24;k = g++;e = Ee;continue;case 16:k = g++;e = De;continue;case 78:k = g++;l = 9;e = Ce;continue;case 17:k = g++;l = 19;e = Me;continue;case 18:k = g++;l = 18;e = Je;continue;case 77:g++;l = 50;break;case 19:k = g++;l = 17;break;case 20:k = g++;l = 38;e = Qe;continue;case 21:k = g++;l = 39;e = Ie;continue;case 22:k = g++;l = 37;e = Ie;continue;case 23:k = g++;l = 22;break;case 24:k = ++g;l = 20;e = Ce;continue;case 25:k = g++;l = 14;break;case 26:k = g++;l = 15;break;case 27:k = g++;l = 12;break;case 28:k = g++;l = 13;break;case 29:z = k = g++;l = 1;e = Te;continue;case 30:k = g++;l = 33;e = Ie;continue;case 31:k = g++;l = 34;e = Ke;continue;case 32:k = g++;l = 35;e = Ie;continue;case 35:break;case 36:g++;l = l + 41 - 31;break;case 37:l = 5;p = parseInt(f.substring(k,g),10);break;case 38:l = 4;p = parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l = 3;p = parseFloat(f.substring(k,g));k = g++;e = Ce;continue;case 41:l = 3;p = parseFloat(f.substring(k,g));m = "%";k = g++;break;case 42:g++;e = He;continue;case 43:m = f.substring(k,g);break;case 44:z = g++;e = Te;continue;case 45:m = ye(f.substring(k,g));break;case 46:m = f.substring(k,g);g++;break;case 47:m = ye(f.substring(k,g));g++;break;case 48:z = g;g += 2;e = We;continue;case 49:z = g;g += 2;e = Xe;continue;case 50:g++;l = 25;break;case 51:g++;l = 26;break;case 52:m = f.substring(k,g);if(1 == l){g++;if("url" == m.toLowerCase()){e = Ye;continue;}l = 6;}break;case 53:m = ye(f.substring(k,g));if(1 == l){g++;if("url" == m.toLowerCase()){e = Ye;continue;}l = 6;}break;case 54:e = Ne;g++;continue;case 55:e = Oe;g++;continue;case 56:e = Be;g++;continue;case 57:e = Pe;g++;continue;case 58:l = 5;e = Ge;g++;continue;case 59:l = 4;e = He;g++;continue;case 60:l = 1;e = Ce;g++;continue;case 61:l = 1;e = Te;z = g++;continue;case 62:g--;break;case 63:g -= 2;break;case 64:k = g++;e = Ze;continue;case 65:k = ++g;e = $e;continue;case 66:k = ++g;e = af;continue;case 67:l = 8;m = ye(f.substring(k,g));g++;break;case 69:g++;break;case 70:e = Re;g++;continue;case 71:e = Se;g++;continue;case 79:if(8 > g - z && f.substring(z + 1,g + 1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue;}case 68:l = 8;m = ye(f.substring(k,g));g++;e = bf;continue;case 74:g++;if(9 > g - z && f.substring(z + 1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l = 51;m = "E_CSS_UNEXPECTED_NEWLINE";break;case 73:if(9 > g - z && f.substring(z + 1,g + 1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue;}m = ye(f.substring(k,g));break;case 75:z = g++;continue;case 76:g++;e = Fe;continue;default:e !== Be?(l = 51,m = "E_CSS_UNEXPECTED_STATE"):(k = g,l = 0);}r.type = l;r.b = q;r.L = p;r.text = m;r.position = k;b++;if(b >= c)break;e = Be;q = !1;r = h[b & d];}a.position = g;a.h = b & d;};function ff(a,b,c,d,e){var f=J("ajax"),g=new XMLHttpRequest(),h=je(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Ld:null};g.open(c || "GET",a,!0);b && (g.responseType = b);g.onreadystatechange = function(){if(4 === g.readyState){l.status = g.status;if(200 == l.status || !l.status)if(b && "document" !== b || !g.responseXML || "parsererror" == g.responseXML.documentElement.localName)if((!b || "document" === b) && g.response instanceof HTMLDocument)l.responseXML = g.response,l.contentType = g.response.contentType;else {var c=g.response;b && "text" !== b || "string" != typeof c?c?"string" == typeof c?l.Ld = gf([c]):l.Ld = c:v.b("Unexpected empty success response for",a):l.responseText = c;if(c = g.getResponseHeader("Content-Type"))l.contentType = c.replace(/(.*);.*$/,"$1");}else l.responseXML = g.responseXML,l.contentType = g.responseXML.contentType;h.hb(l);}};try{d?(g.setRequestHeader("Content-Type",e || "text/plain; charset=UTF-8"),g.send(d)):(a.match(/file:\/\/.*(\.html$|\.htm$)/) && g.overrideMimeType("text/html"),g.send(null));}catch(k) {v.b(k,"Error fetching " + a),h.hb(l);}return f.result();}function gf(a){var b=window.WebKitBlobBuilder || window.MSBlobBuilder;if(b){for(var b=new b(),c=0;c < a.length;c++) b.append(a[c]);return b.getBlob("application/octet-stream");}return new Blob(a,{type:"application/octet-stream"});}function hf(a){var b=J("readBlob"),c=new FileReader(),d=je(b,c);c.addEventListener("load",function(){d.hb(c.result);},!1);c.readAsArrayBuffer(a);return b.result();}function jf(a,b){this.ia = a;this.type = b;this.h = {};this.j = {};}jf.prototype.load = function(a,b,c){a = ma(a);var d=this.h[a];return "undefined" != typeof d?L(d):this.fetch(a,b,c).get();};function kf(a,b,c,d){var e=J("fetch");ff(b,a.type).then(function(f){if(c && 400 <= f.status)throw Error(d || "Failed to fetch required resource: " + b);a.ia(f,a).then(function(c){delete a.j[b];a.h[b] = c;M(e,c);});});return e.result();}jf.prototype.fetch = function(a,b,c){a = ma(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new te(function(){return kf(e,a,b,c);},"Fetch " + a);e.j[a] = d;d.start();}return d;};jf.prototype.get = function(a){return this.h[ma(a)];};function lf(a){a = a.responseText;return L(a?JSON.parse(a):null);};function mf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6 == a.length)return new Ec(b);if(3 == a.length)return new Ec(b & 15 | (b & 15) << 4 | (b & 240) << 4 | (b & 240) << 8 | (b & 3840) << 8 | (b & 3840) << 12);throw Error("E_CSS_COLOR");}function nf(a){this.f = a;this.eb = "Author";}n = nf.prototype;n.Xc = function(){return null;};n.ka = function(){return this.f;};n.error = function(){};n.Mc = function(a){this.eb = a;};n.Ib = function(){};n.be = function(){};n.cd = function(){};n.dd = function(){};n.oe = function(){};n.vd = function(){};n.Pb = function(){};n.ae = function(){};n.Zd = function(){};n.he = function(){};n.Ic = function(){};n.Fb = function(){};n.Pd = function(){};n.hd = function(){};n.Td = function(){};n.Nd = function(){};n.Sd = function(){};n.Lc = function(){};n.De = function(){};n.uc = function(){};n.Od = function(){};n.Rd = function(){};n.Qd = function(){};n.ld = function(){};n.kd = function(){};n.Ba = function(){};n.Db = function(){};n.Qb = function(){};n.jd = function(){};n.Bd = function(){};function of(a){switch(a.eb){case "UA":return 0;case "User":return 100663296;default:return 83886080;}}function pf(a){switch(a.eb){case "UA":return 0;case "User":return 16777216;default:return 33554432;}}function qf(){nf.call(this,null);this.g = [];this.b = null;}t(qf,nf);function rf(a,b){a.g.push(a.b);a.b = b;}n = qf.prototype;n.Xc = function(){return null;};n.ka = function(){return this.b.ka();};n.error = function(a,b){this.b.error(a,b);};n.Mc = function(a){nf.prototype.Mc.call(this,a);0 < this.g.length && (this.b = this.g[0],this.g = []);this.b.Mc(a);};n.Ib = function(a,b){this.b.Ib(a,b);};n.be = function(a){this.b.be(a);};n.cd = function(a,b){this.b.cd(a,b);};n.dd = function(a,b){this.b.dd(a,b);};n.oe = function(a){this.b.oe(a);};n.vd = function(a,b,c,d){this.b.vd(a,b,c,d);};n.Pb = function(){this.b.Pb();};n.ae = function(){this.b.ae();};n.Zd = function(){this.b.Zd();};n.he = function(){this.b.he();};n.Ic = function(){this.b.Ic();};n.Fb = function(){this.b.Fb();};n.Pd = function(){this.b.Pd();};n.hd = function(a){this.b.hd(a);};n.Td = function(){this.b.Td();};n.Nd = function(){this.b.Nd();};n.Sd = function(){this.b.Sd();};n.Lc = function(){this.b.Lc();};n.De = function(a){this.b.De(a);};n.uc = function(a){this.b.uc(a);};n.Od = function(a){this.b.Od(a);};n.Rd = function(){this.b.Rd();};n.Qd = function(a,b,c){this.b.Qd(a,b,c);};n.ld = function(a,b,c){this.b.ld(a,b,c);};n.kd = function(a,b,c){this.b.kd(a,b,c);};n.Ba = function(){this.b.Ba();};n.Db = function(a,b,c){this.b.Db(a,b,c);};n.Qb = function(){this.b.Qb();};n.jd = function(a){this.b.jd(a);};n.Bd = function(){this.b.Bd();};function sf(a,b,c){nf.call(this,a);this.O = c;this.J = 0;if(this.ma = b)this.eb = b.eb;}t(sf,nf);sf.prototype.Xc = function(){return this.ma.Xc();};sf.prototype.error = function(a){v.b(a);};sf.prototype.Ba = function(){this.J++;};sf.prototype.Qb = function(){if(! --this.J && !this.O){var a=this.ma;a.b = a.g.pop();}};function tf(a,b,c){sf.call(this,a,b,c);}t(tf,sf);function uf(a,b){a.error(b,a.Xc());}function vf(a,b){uf(a,b);rf(a.ma,new sf(a.f,a.ma,!1));}n = tf.prototype;n.Fb = function(){vf(this,"E_CSS_UNEXPECTED_SELECTOR");};n.Pd = function(){vf(this,"E_CSS_UNEXPECTED_FONT_FACE");};n.hd = function(){vf(this,"E_CSS_UNEXPECTED_FOOTNOTE");};n.Td = function(){vf(this,"E_CSS_UNEXPECTED_VIEWPORT");};n.Nd = function(){vf(this,"E_CSS_UNEXPECTED_DEFINE");};n.Sd = function(){vf(this,"E_CSS_UNEXPECTED_REGION");};n.Lc = function(){vf(this,"E_CSS_UNEXPECTED_PAGE");};n.uc = function(){vf(this,"E_CSS_UNEXPECTED_WHEN");};n.Od = function(){vf(this,"E_CSS_UNEXPECTED_FLOW");};n.Rd = function(){vf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE");};n.Qd = function(){vf(this,"E_CSS_UNEXPECTED_PAGE_MASTER");};n.ld = function(){vf(this,"E_CSS_UNEXPECTED_PARTITION");};n.kd = function(){vf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP");};n.jd = function(){vf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC");};n.Bd = function(){vf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC");};n.Db = function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Xc());};var wf=[],xf=[],T=[],yf=[],zf=[],Af=[],Bf=[],Cf=[],Df=[],Ef=[],Ff=[],Gf=[],Hf=[];wf[1] = 28;wf[36] = 29;wf[7] = 29;wf[9] = 29;wf[14] = 29;wf[18] = 29;wf[20] = 30;wf[13] = 27;wf[0] = 200;xf[1] = 46;xf[0] = 200;Af[1] = 2;Af[36] = 4;Af[7] = 6;Af[9] = 8;Af[14] = 10;Af[18] = 14;T[37] = 11;T[23] = 12;T[35] = 56;T[1] = 1;T[36] = 3;T[7] = 5;T[9] = 7;T[14] = 9;T[12] = 13;T[18] = 55;T[50] = 42;T[16] = 41;yf[1] = 1;yf[36] = 3;yf[7] = 5;yf[9] = 7;yf[14] = 9;yf[11] = 200;yf[18] = 55;zf[1] = 2;zf[36] = 4;zf[7] = 6;zf[9] = 8;zf[18] = 14;zf[50] = 42;zf[14] = 10;zf[12] = 13;Bf[1] = 15;Bf[7] = 16;Bf[4] = 17;Bf[5] = 18;Bf[3] = 19;Bf[2] = 20;Bf[8] = 21;Bf[16] = 22;Bf[19] = 23;Bf[6] = 24;Bf[11] = 25;Bf[17] = 26;Bf[13] = 48;Bf[31] = 47;Bf[23] = 54;Bf[0] = 44;Cf[1] = 31;Cf[4] = 32;Cf[5] = 32;Cf[3] = 33;Cf[2] = 34;Cf[10] = 40;Cf[6] = 38;Cf[31] = 36;Cf[24] = 36;Cf[32] = 35;Df[1] = 45;Df[16] = 37;Df[37] = 37;Df[38] = 37;Df[47] = 37;Df[48] = 37;Df[39] = 37;Df[49] = 37;Df[26] = 37;Df[25] = 37;Df[23] = 37;Df[24] = 37;Df[19] = 37;Df[21] = 37;Df[36] = 37;Df[18] = 37;Df[22] = 37;Df[11] = 39;Df[12] = 43;Df[17] = 49;Ef[0] = 200;Ef[12] = 50;Ef[13] = 51;Ef[14] = 50;Ef[15] = 51;Ef[10] = 50;Ef[11] = 51;Ef[17] = 53;Ff[0] = 200;Ff[12] = 50;Ff[13] = 52;Ff[14] = 50;Ff[15] = 51;Ff[10] = 50;Ff[11] = 51;Ff[17] = 53;Gf[0] = 200;Gf[12] = 50;Gf[13] = 51;Gf[14] = 50;Gf[15] = 51;Gf[10] = 50;Gf[11] = 51;Hf[11] = 0;Hf[16] = 0;Hf[22] = 1;Hf[18] = 1;Hf[26] = 2;Hf[25] = 2;Hf[38] = 3;Hf[37] = 3;Hf[48] = 3;Hf[47] = 3;Hf[39] = 3;Hf[49] = 3;Hf[41] = 3;Hf[23] = 4;Hf[24] = 4;Hf[36] = 5;Hf[19] = 5;Hf[21] = 5;Hf[0] = 6;Hf[52] = 2;function If(a,b,c,d){this.b = a;this.f = b;this.A = c;this.Z = d;this.G = [];this.O = {};this.g = this.I = null;this.D = !1;this.j = 2;this.result = null;this.H = !1;this.C = this.J = null;this.l = [];this.h = [];this.R = this.X = !1;}function Jf(a,b){for(var c=[],d=a.G;;) {c.push(d[b++]);if(b == d.length)break;if("," != d[b++])throw Error("Unexpected state");}return c;}function Kf(a,b,c){var d=a.G,e=d.length,f;do f = d[--e];while("undefined" != typeof f && "string" != typeof f);var g=d.length - (e + 1);1 < g && d.splice(e + 1,g,new tc(d.slice(e + 1,d.length)));if("," == b)return null;e++;do f = d[--e];while("undefined" != typeof f && ("string" != typeof f || "," == f));g = d.length - (e + 1);if("(" == f){if(")" != b)return a.A.error("E_CSS_MISMATCHED_C_PAR",c),a.b = Ff,null;a = new vc(d[e - 1],Jf(a,e + 1));d.splice(e - 1,g + 2,a);return null;}return ";" != b || 0 <= e?(a.A.error("E_CSS_UNEXPECTED_VAL_END",c),a.b = Ff,null):1 < g?new uc(Jf(a,e + 1)):d[0];}function Lf(a,b,c){a.b = a.g?Ff:Ef;a.A.error(b,c);}function Mf(a,b,c){for(var d=a.G,e=a.A,f=d.pop(),g;;) {var h=d.pop();if(11 == b){for(g = [f];16 == h;) g.unshift(d.pop()),h = d.pop();if("string" == typeof h){if("{" == h){for(;2 <= g.length;) a = g.shift(),c = g.shift(),a = new Vb(e.ka(),a,c),g.unshift(a);d.push(new E(g[0]));return !0;}if("(" == h){b = d.pop();f = d.pop();f = new jc(e.ka(),sb(f,b),g);b = 0;continue;}}if(10 == h){f.Ue() && (f = new lc(e.ka(),f,null));b = 0;continue;}}else if("string" == typeof h){d.push(h);break;}if(0 > h)if(-31 == h)f = new Qb(e.ka(),f);else if(-24 == h)f = new Rb(e.ka(),f);else return Lf(a,"F_UNEXPECTED_STATE",c),!1;else {if(Hf[b] > Hf[h]){d.push(h);break;}g = d.pop();switch(h){case 26:f = new Sb(e.ka(),g,f);break;case 52:f = new Tb(e.ka(),g,f);break;case 25:f = new Ub(e.ka(),g,f);break;case 38:f = new Wb(e.ka(),g,f);break;case 37:f = new Yb(e.ka(),g,f);break;case 48:f = new Xb(e.ka(),g,f);break;case 47:f = new Zb(e.ka(),g,f);break;case 39:case 49:f = new $b(e.ka(),g,f);break;case 41:f = new ac(e.ka(),g,f);break;case 23:f = new bc(e.ka(),g,f);break;case 24:f = new cc(e.ka(),g,f);break;case 36:f = new dc(e.ka(),g,f);break;case 19:f = new ec(e.ka(),g,f);break;case 21:f = new fc(e.ka(),g,f);break;case 18:if(1 < d.length)switch(d[d.length - 1]){case 22:d.pop();f = new kc(e.ka(),d.pop(),g,f);break;case 10:if(g.Ue())f = new lc(e.ka(),g,f);else return Lf(a,"E_CSS_MEDIA_TEST",c),!1;}else return Lf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18 != b)return Lf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Lf(a,"F_UNEXPECTED_STATE",c),!1;}}}d.push(f);return !1;}function Nf(a){for(var b=[];;) {var c=Q(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.L);break;default:return b;}S(a.f);}}function Of(a){var b=!1,c=Q(a.f);if(23 === c.type)b = !0,S(a.f),c = Q(a.f);else if(1 === c.type && ("even" === c.text || "odd" === c.text))return S(a.f),[2,"odd" === c.text?1:0];switch(c.type){case 3:if(b && 0 > c.L)break;case 1:if(b && "-" === c.text.charAt(0))break;if("n" === c.text || "-n" === c.text){if(b && c.b)break;b = "-n" === c.text?-1:1;3 === c.type && (b = c.L);var d=0;S(a.f);var c=Q(a.f),e=24 === c.type,f=23 === c.type || e;f && (S(a.f),c = Q(a.f));if(5 === c.type){d = c.L;if(1 / d === 1 / -0){if((d = 0,f))break;}else if(0 > d){if(f)break;}else if(0 <= d && !f)break;S(a.f);}else if(f)break;return [b,e && 0 < d?-d:d];}if("n-" === c.text || "-n-" === c.text){if(!b || !c.b)if((b = "-n-" === c.text?-1:1,3 === c.type && (b = c.L),S(a.f),c = Q(a.f),5 === c.type && !(0 > c.L || 1 / c.L === 1 / -0)))return S(a.f),[b,c.L];}else {if(d = c.text.match(/^n(-[0-9]+)$/)){if(b && c.b)break;S(a.f);return [3 === c.type?c.L:1,parseInt(d[1],10)];}if(d = c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)];}break;case 5:if(!b || !(c.b || 0 > c.L))return S(a.f),[0,c.L];}return null;}function Pf(a,b,c){a = a.A.ka();if(!a)return null;c = c || a.j;if(b){b = b.split(/\s+/);for(var d=0;d < b.length;d++) switch(b[d]){case "vertical":c = nc(a,c,new Qb(a,new hc(a,"pref-horizontal")));break;case "horizontal":c = nc(a,c,new hc(a,"pref-horizontal"));break;case "day":c = nc(a,c,new Qb(a,new hc(a,"pref-night-mode")));break;case "night":c = nc(a,c,new hc(a,"pref-night-mode"));break;default:c = a.h;}}return c === a.j?null:new E(c);}function Qf(a){switch(a.h[a.h.length - 1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return !0;}return !1;}function Rf(a,b,c,d,e,f){var g=a.A,h=a.f,l=a.G,k,m,p,q;e && (a.j = 2,a.G.push("{"));a: for(;0 < b;--b) switch((k = Q(h),a.b[k.type])){case 28:if(18 != R(h,1).type){Qf(a)?(g.error("E_CSS_COLON_EXPECTED",R(h,1)),a.b = Ff):(a.b = Af,g.Fb());continue;}m = R(h,2);if(!(m.b || 1 != m.type && 6 != m.type)){if(0 <= h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b = h.f;}a.g = k.text;a.D = !1;S(h);S(h);a.b = Bf;l.splice(0,l.length);continue;case 46:if(18 != R(h,1).type){a.b = Ff;g.error("E_CSS_COLON_EXPECTED",R(h,1));continue;}a.g = k.text;a.D = !1;S(h);S(h);a.b = Bf;l.splice(0,l.length);continue;case 29:a.b = Af;g.Fb();continue;case 1:if(!k.b){a.b = Gf;g.error("E_CSS_SPACE_EXPECTED",k);continue;}g.Pb();case 2:if(34 == R(h,1).type)if((S(h),S(h),p = a.O[k.text],null != p))switch((k = Q(h),k.type)){case 1:g.Ib(p,k.text);a.b = f?yf:T;S(h);break;case 36:g.Ib(p,null);a.b = f?yf:T;S(h);break;default:a.b = Ef,g.error("E_CSS_NAMESPACE",k);}else a.b = Ef,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Ib(a.I,k.text),a.b = f?yf:T,S(h);continue;case 3:if(!k.b){a.b = Gf;g.error("E_CSS_SPACE_EXPECTED",k);continue;}g.Pb();case 4:if(34 == R(h,1).type)switch((S(h),S(h),k = Q(h),k.type)){case 1:g.Ib(null,k.text);a.b = f?yf:T;S(h);break;case 36:g.Ib(null,null);a.b = f?yf:T;S(h);break;default:a.b = Ef,g.error("E_CSS_NAMESPACE",k);}else g.Ib(a.I,null),a.b = f?yf:T,S(h);continue;case 5:k.b && g.Pb();case 6:g.oe(k.text);a.b = f?yf:T;S(h);continue;case 7:k.b && g.Pb();case 8:g.be(k.text);a.b = f?yf:T;S(h);continue;case 55:k.b && g.Pb();case 14:S(h);k = Q(h);b: switch(k.type){case 1:g.cd(k.text,null);S(h);a.b = f?yf:T;continue;case 6:m = k.text;S(h);switch(m){case "not":a.b = Af;g.jd("not");Rf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b = T:a.b = Gf;break a;case "lang":case "href-epub-type":if((k = Q(h),1 === k.type)){p = [k.text];S(h);break;}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p = Of(a))break;else break b;default:p = Nf(a);}k = Q(h);if(11 == k.type){g.cd(m,p);S(h);a.b = f?yf:T;continue;}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b = Ef;continue;case 42:S(h);k = Q(h);switch(k.type){case 1:g.dd(k.text,null);a.b = f?yf:T;S(h);continue;case 6:m = k.text;S(h);if("nth-fragment" == m){if((p = Of(a),!p))break;}else p = Nf(a);k = Q(h);if(11 == k.type){g.dd(m,p);a.b = f?yf:T;S(h);continue;}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b = Ef;continue;case 9:k.b && g.Pb();case 10:S(h);k = Q(h);if(1 == k.type)m = k.text,S(h);else if(36 == k.type)m = null,S(h);else if(34 == k.type)m = "";else {a.b = Gf;g.error("E_CSS_ATTR",k);S(h);continue;}k = Q(h);if(34 == k.type){p = m?a.O[m]:m;if(null == p){a.b = Gf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue;}S(h);k = Q(h);if(1 != k.type){a.b = Gf;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue;}m = k.text;S(h);k = Q(h);}else p = "";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q = k.type;S(h);k = Q(h);break;case 15:g.vd(p,m,0,null);a.b = f?yf:T;S(h);continue;default:a.b = Gf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue;}switch(k.type){case 1:case 2:g.vd(p,m,q,k.text);S(h);k = Q(h);break;default:a.b = Gf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue;}if(15 != k.type){a.b = Gf;g.error("E_CSS_ATTR",k);continue;}a.b = f?yf:T;S(h);continue;case 11:g.ae();a.b = zf;S(h);continue;case 12:g.Zd();a.b = zf;S(h);continue;case 56:g.he();a.b = zf;S(h);continue;case 13:a.X?(a.h.push("-epubx-region"),a.X = !1):a.R?(a.h.push("page"),a.R = !1):a.h.push("[selector]");g.Ba();a.b = wf;S(h);continue;case 41:g.Ic();a.b = Af;S(h);continue;case 15:l.push(C(k.text));S(h);continue;case 16:try{l.push(mf(k.text));}catch(z) {g.error("E_CSS_COLOR",k),a.b = Ef;}S(h);continue;case 17:l.push(new Cc(k.L));S(h);continue;case 18:l.push(new Dc(k.L));S(h);continue;case 19:l.push(new D(k.L,k.text));S(h);continue;case 20:l.push(new Ac(k.text));S(h);continue;case 21:l.push(new Fc(pa(k.text,a.Z)));S(h);continue;case 22:Kf(a,",",k);l.push(",");S(h);continue;case 23:l.push(zc);S(h);continue;case 24:m = k.text.toLowerCase();"-epubx-expr" == m?(a.b = Cf,a.j = 0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Kf(a,")",k);S(h);continue;case 47:S(h);k = Q(h);m = R(h,1);if(1 == k.type && "important" == k.text.toLowerCase() && (17 == m.type || 0 == m.type || 13 == m.type)){S(h);a.D = !0;continue;}Lf(a,"E_CSS_SYNTAX",k);continue;case 54:m = R(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);continue;}}a.b === Bf && 0 <= h.b?(ef(h),a.b = Af,g.Fb()):Lf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b = -1;(m = Kf(a,";",k)) && a.g && g.Db(a.g,m,a.D);a.b = d?xf:wf;continue;case 44:S(h);h.b = -1;m = Kf(a,";",k);if(c)return a.result = m,!0;a.g && m && g.Db(a.g,m,a.D);if(d)return !0;Lf(a,"E_CSS_SYNTAX",k);continue;case 31:m = R(h,1);9 == m.type?(10 != R(h,2).type || R(h,2).b?(l.push(new hc(g.ka(),sb(k.text,m.text))),a.b = Df):(l.push(k.text,m.text,"("),S(h)),S(h)):(2 == a.j || 3 == a.j?"not" == k.text.toLowerCase()?(S(h),l.push(new ic(g.ka(),!0,m.text))):("only" == k.text.toLowerCase() && (S(h),k = m),l.push(new ic(g.ka(),!1,k.text))):l.push(new hc(g.ka(),k.text)),a.b = Df);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new vb(g.ka(),k.L));S(h);a.b = Df;continue;case 33:m = k.text;"%" == m && (m = a.g && a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new gc(g.ka(),k.L,m));S(h);a.b = Df;continue;case 34:l.push(new vb(g.ka(),k.text));S(h);a.b = Df;continue;case 35:S(h);k = Q(h);5 != k.type || k.b?Lf(a,"E_CSS_SYNTAX",k):(l.push(new mc(g.ka(),k.L)),S(h),a.b = Df);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b = Cf;Mf(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and" == k.text.toLowerCase()?(a.b = Cf,Mf(a,52,k),l.push(52),S(h)):Lf(a,"E_CSS_SYNTAX",k);continue;case 39:Mf(a,k.type,k) && (a.g?a.b = Bf:Lf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:Mf(a,11,k) && (a.g || 3 == a.j?Lf(a,"E_CSS_UNEXPECTED_BRC",k):(1 == a.j?g.uc(l.pop()):(k = l.pop(),g.uc(k)),a.h.push("media"),g.Ba(),a.b = wf));S(h);continue;case 49:if(Mf(a,11,k))if(a.g || 3 != a.j)Lf(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.C = l.pop(),a.H = !0,a.b = wf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b = wf;S(h);g.Qb();a.h.length && a.h.pop();continue;case 30:m = k.text.toLowerCase();switch(m){case "import":S(h);k = Q(h);if(2 == k.type || 8 == k.type){a.J = k.text;S(h);k = Q(h);if(17 == k.type || 0 == k.type)return a.H = !0,S(h),!1;a.g = null;a.j = 3;a.b = Cf;l.push("{");continue;}g.error("E_CSS_IMPORT_SYNTAX",k);a.b = Ef;continue;case "namespace":S(h);k = Q(h);switch(k.type){case 1:m = k.text;S(h);k = Q(h);if((2 == k.type || 8 == k.type) && 17 == R(h,1).type){a.O[m] = k.text;S(h);S(h);continue;}break;case 2:case 8:if(17 == R(h,1).type){a.I = k.text;S(h);S(h);continue;}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b = Ef;continue;case "charset":S(h);k = Q(h);if(2 == k.type && 17 == R(h,1).type){m = k.text.toLowerCase();"utf-8" != m && "utf-16" != m && g.error("E_CSS_UNEXPECTED_CHARSET " + m,k);S(h);S(h);continue;}g.error("E_CSS_CHARSET_SYNTAX",k);a.b = Ef;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12 == R(h,1).type){S(h);S(h);switch(m){case "font-face":g.Pd();break;case "-epubx-page-template":g.Rd();break;case "-epubx-define":g.Nd();break;case "-epubx-viewport":g.Td();}a.h.push(m);g.Ba();continue;}break;case "-adapt-footnote-area":S(h);k = Q(h);switch(k.type){case 12:S(h);g.hd(null);a.h.push(m);g.Ba();continue;case 50:if((S(h),k = Q(h),1 == k.type && 12 == R(h,1).type)){m = k.text;S(h);S(h);g.hd(m);a.h.push("-adapt-footnote-area");g.Ba();continue;}}break;case "-epubx-region":S(h);g.Sd();a.X = !0;a.b = Af;continue;case "page":S(h);g.Lc();a.R = !0;a.b = zf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k = Q(h);if(12 == k.type){S(h);g.De(m);a.h.push(m);g.Ba();continue;}break;case "-epubx-when":S(h);a.g = null;a.j = 1;a.b = Cf;l.push("{");continue;case "media":S(h);a.g = null;a.j = 2;a.b = Cf;l.push("{");continue;case "-epubx-flow":if(1 == R(h,1).type && 12 == R(h,2).type){g.Od(R(h,1).text);S(h);S(h);S(h);a.h.push(m);g.Ba();continue;}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k = Q(h);q = p = null;var r=[];1 == k.type && (p = k.text,S(h),k = Q(h));18 == k.type && 1 == R(h,1).type && (q = R(h,1).text,S(h),S(h),k = Q(h));for(;6 == k.type && "class" == k.text.toLowerCase() && 1 == R(h,1).type && 11 == R(h,2).type;) r.push(R(h,1).text),S(h),S(h),S(h),k = Q(h);if(12 == k.type){S(h);switch(m){case "-epubx-page-master":g.Qd(p,q,r);break;case "-epubx-partition":g.ld(p,q,r);break;case "-epubx-partition-group":g.kd(p,q,r);}a.h.push(m);g.Ba();continue;}break;case "":g.error("E_CSS_UNEXPECTED_AT" + m,k);a.b = Gf;continue;default:g.error("E_CSS_AT_UNKNOWN " + m,k);a.b = Ef;continue;}g.error("E_CSS_AT_SYNTAX " + m,k);a.b = Ef;continue;case 50:if(c || d)return !0;a.l.push(k.type + 1);S(h);continue;case 52:if(c || d)return !0;if(!a.l.length){a.b = wf;continue;}case 51:0 < a.l.length && a.l[a.l.length - 1] == k.type && a.l.pop();a.l.length || 13 != k.type || (a.b = wf);S(h);continue;case 53:if(c || d)return !0;a.l.length || (a.b = wf);S(h);continue;case 200:return f && (S(h),g.Bd()),!0;default:if(c || d)return !0;if(e)return Mf(a,11,k)?(a.result = l.pop(),!0):!1;if(f)return 51 == k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b === Bf && 0 <= h.b?(ef(h),a.b = Af,g.Fb()):a.b !== Ef && a.b !== Gf && a.b !== Ff?(51 == k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b = Qf(a)?Ff:Gf):S(h);}return !1;}function Sf(a){nf.call(this,null);this.f = a;}t(Sf,nf);Sf.prototype.error = function(a){throw Error(a);};Sf.prototype.ka = function(){return this.f;};function Tf(a,b,c,d,e){var f=J("parseStylesheet"),g=new If(wf,a,b,c),h=null;e && (h = Uf(new cf(e,b),b,c));if(h = Pf(g,d,h && h.ua()))b.uc(h),b.Ba();qe(function(){for(;!Rf(g,100,!1,!1,!1,!1);) {if(g.H){var a=pa(g.J,c);g.C && (b.uc(g.C),b.Ba());var d=J("parseStylesheet.import");Vf(a,b,null,null).then(function(){g.C && b.Qb();g.H = !1;g.J = null;g.C = null;M(d,!0);});return d.result();}a = oe();if(a.Ra)return a;}return L(!1);}).then(function(){h && b.Qb();M(f,!0);});return f.result();}function Wf(a,b,c,d,e){return $d("parseStylesheetFromText",function(f){var g=new cf(a,b);Tf(g,b,c,d,e).Ea(f);},function(b,c){v.b(c,"Failed to parse stylesheet text: " + a);M(b,!1);});}function Vf(a,b,c,d){return $d("parseStylesheetFromURL",function(e){ff(a).then(function(f){f.responseText?Wf(f.responseText,b,a,c,d).then(function(b){b || v.b("Failed to parse stylesheet from " + a);M(e,!0);}):M(e,!0);});},function(b,c){v.b(c,"Exception while fetching and parsing:",a);M(b,!0);});}function Xf(a,b){var c=new If(Bf,b,new Sf(a),"");Rf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result;}function Uf(a,b,c){a = new If(Cf,a,b,c);Rf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result;}var Yf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};function Zf(a,b,c){if(b.Se())a: {b = b.Cc;a = b.evaluate(a);switch(typeof a){case "number":c = Yf[c]?a == Math.round(a)?new Dc(a):new Cc(a):new D(a,"px");break a;case "string":c = a?Xf(b.b,new cf(a,null)):B;break a;case "boolean":c = a?Kd:Zc;break a;case "undefined":c = B;break a;}throw Error("E_UNEXPECTED");}else c = b;return c;};function $f(a,b,c,d){this.V = a;this.S = b;this.U = c;this.P = d;}function ag(a,b){this.f = a;this.b = b;}function bg(){this.bottom = this.right = this.top = this.left = 0;}function cg(a,b,c,d){this.b = a;this.f = b;this.h = c;this.g = d;}function dg(a,b,c,d){this.S = a;this.P = b;this.V = c;this.U = d;this.right = this.left = null;}function eg(a,b){return a.b.b - b.b.b || a.b.f - b.b.f;}function fg(a){this.b = a;}function gg(a,b,c){a = a.b;for(var d=a.length,e=a[d - 1],f=0;f < d;f++) {var g=a[f];b.push(e.b < g.b?new cg(e,g,1,c):new cg(g,e,-1,c));e = g;}}function hg(a,b,c,d){for(var e=[],f=0;20 > f;f++) {var g=2 * f * Math.PI / 20;e.push(new ag(a + c * Math.sin(g),b + d * Math.cos(g)));}return new fg(e);}function ig(a,b,c,d){return new fg([new ag(a,b),new ag(c,b),new ag(c,d),new ag(a,d)]);}function jg(a,b,c,d){this.f = a;this.h = b;this.b = c;this.g = d;}function kg(a,b){var c=a.b.f + (a.f.f - a.b.f) * (b - a.b.b) / (a.f.b - a.b.b);if(isNaN(c))throw Error("Bad intersection");return c;}function lg(a,b,c,d){var e,f;b.f.b < c && v.b("Error: inconsistent segment (1)");b.b.b <= c?(c = kg(b,c),e = b.h):(c = b.b.f,e = 0);b.f.b >= d?(d = kg(b,d),f = b.h):(d = b.f.f,f = 0);c < d?(a.push(new jg(c,e,b.g,-1)),a.push(new jg(d,f,b.g,1))):(a.push(new jg(d,f,b.g,-1)),a.push(new jg(c,e,b.g,1)));}function mg(a,b,c){c = b + c;for(var d=Array(c),e=Array(c),f=0;f <= c;f++) d[f] = 0,e[f] = 0;for(var g=[],h=!1,l=a.length,k=0;k < l;k++) {var m=a[k];d[m.b] += m.h;e[m.b] += m.g;for(var p=!1,f=0;f < b;f++) if(d[f] && !e[f]){p = !0;break;}if(p)for(f = b;f <= c;f++) if(d[f] || e[f]){p = !1;break;}h != p && (g.push(m.f),h = p);}return g;}function ng(a,b){return b?Math.ceil(a / b) * b:a;}function og(a,b){return b?Math.floor(a / b) * b:a;}function pg(a){return new ag(a.b,-a.f);}function qg(a){return new $f(a.S,-a.U,a.P,-a.V);}function rg(a){return new fg(Ra(a.b,pg));}function sg(a,b,c,d,e){e && (a = qg(a),b = Ra(b,rg),c = Ra(c,rg));e = b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l = 0;l < e;l++) gg(b[l],h,l);for(l = 0;l < f;l++) gg(c[l],h,l + e);b = h.length;h.sort(eg);for(c = 0;h[c].g >= e;) c++;c = h[c].b.b;c > a.S && g.push(new dg(a.S,c,a.U,a.U));l = 0;for(var p=[];l < b && (m = h[l]).b.b < c;) m.f.b > c && p.push(m),l++;for(;l < b || 0 < p.length;) {var q=a.P,r=Math.min(ng(Math.ceil(c + 8),d),a.P);for(k = 0;k < p.length && q > r;k++) m = p[k],m.b.f == m.f.f?m.f.b < q && (q = Math.max(og(m.f.b,d),r)):m.b.f != m.f.f && (q = r);q > a.P && (q = a.P);for(;l < b && (m = h[l]).b.b < q;) if(m.f.b < c)l++;else if(m.b.b < r){if(m.b.b != m.f.b || m.b.b != c)p.push(m),q = r;l++;}else {k = og(m.b.b,d);k < q && (q = k);break;}r = [];for(k = 0;k < p.length;k++) lg(r,p[k],c,q);r.sort(function(a,b){return a.f - b.f || a.g - b.g;});r = mg(r,e,f);if(r.length){var z=0,u=a.V;for(k = 0;k < r.length;k += 2) {var A=Math.max(a.V,r[k]),H=Math.min(a.U,r[k + 1]) - A;H > z && (z = H,u = A);}z?g.push(new dg(c,q,Math.max(u,a.V),Math.min(u + z,a.U))):g.push(new dg(c,q,a.U,a.U));}else g.push(new dg(c,q,a.U,a.U));if(q == a.P)break;c = q;for(k = p.length - 1;0 <= k;k--) p[k].f.b <= q && p.splice(k,1);}tg(a,g);return g;}function tg(a,b){for(var c=b.length - 1,d=new dg(a.P,a.P,a.V,a.U);0 <= c;) {var e=d,d=b[c];if(1 > d.P - d.S || d.V == e.V && d.U == e.U)e.S = d.S,b.splice(c,1),d = e;c--;}}function ug(a,b){for(var c=0,d=a.length;c < d;) {var e=Math.floor((c + d) / 2);b >= a[e].P?c = e + 1:d = e;}return c;}function vg(a,b){if(!a.length)return b;for(var c=b.S,d,e=0;e < a.length && !(d = a[e],d.P > b.S && d.V - .1 <= b.V && d.U + .1 >= b.U);e++) c = Math.max(c,d.P);for(var f=c;e < a.length && !(d = a[e],d.S >= b.P || d.V - .1 > b.V || d.U + .1 < b.U);e++) f = d.P;f = e === a.length?b.P:Math.min(f,b.P);return f <= c?null:new $f(b.V,c,b.U,f);}function wg(a,b){if(!a.length)return b;for(var c=b.P,d,e=a.length - 1;0 <= e && !(d = a[e],e === a.length - 1 && d.P < b.P) && !(d.S < b.P && d.V - .1 <= b.V && d.U + .1 >= b.U);e--) c = Math.min(c,d.S);for(var f=Math.min(c,d.P);0 <= e && !(d = a[e],d.P <= b.S || d.V - .1 > b.V || d.U + .1 < b.U);e--) f = d.S;f = Math.max(f,b.S);return c <= f?null:new $f(b.V,f,b.U,c);};function xg(){this.b = {};}t(xg,rc);xg.prototype.ac = function(a){this.b[a.name] = !0;return a;};xg.prototype.Gb = function(a){this.bc(a.values);return a;};function yg(a){this.value = a;}t(yg,rc);yg.prototype.Pc = function(a){this.value = a.L;return a;};function zg(a,b){if(a){var c=new yg(b);try{return a.ca(c),c.value;}catch(d) {v.b(d,"toInt: ");}}return b;}function Ag(){this.f = !1;this.b = [];this.name = null;}t(Ag,rc);Ag.prototype.Rc = function(a){this.f && this.b.push(a);return null;};Ag.prototype.Qc = function(a){this.f && !a.L && this.b.push(new D(0,"px"));return null;};Ag.prototype.Gb = function(a){this.bc(a.values);return null;};Ag.prototype.Jb = function(a){this.f || (this.f = !0,this.bc(a.values),this.f = !1,this.name = a.name.toLowerCase());return null;};function Bg(a,b,c,d,e,f){if(a){var g=new Ag();try{a.ca(g);var h;a: {if(0 < g.b.length){a = [];for(var l=0;l < g.b.length;l++) {var k=g.b[l];if("%" == k.ha){var m=l % 2?e:d;3 == l && "circle" == g.name && (m = Math.sqrt((d * d + e * e) / 2));a.push(k.L * m / 100);}else a.push(k.L * Eb(f,k.ha,!1));}switch(g.name){case "polygon":if(!(a.length % 2)){f = [];for(g = 0;g < a.length;g += 2) f.push(new ag(b + a[g],c + a[g + 1]));h = new fg(f);break a;}break;case "rectangle":if(4 == a.length){h = ig(b + a[0],c + a[1],b + a[0] + a[2],c + a[1] + a[3]);break a;}break;case "ellipse":if(4 == a.length){h = hg(b + a[0],c + a[1],a[2],a[3]);break a;}break;case "circle":if(3 == a.length){h = hg(b + a[0],c + a[1],a[2],a[2]);break a;}}}h = null;}return h;}catch(p) {v.b(p,"toShape:");}}return ig(b,c,b + d,c + e);}function Cg(a){this.f = a;this.b = {};this.name = null;}t(Cg,rc);Cg.prototype.ac = function(a){this.name = a.toString();this.b[this.name] = this.f?0:(this.b[this.name] || 0) + 1;return a;};Cg.prototype.Pc = function(a){this.name && (this.b[this.name] += a.L - (this.f?0:1));return a;};Cg.prototype.Gb = function(a){this.bc(a.values);return a;};function Dg(a,b){var c=new Cg(b);try{a.ca(c);}catch(d) {v.b(d,"toCounters:");}return c.b;}function Eg(a,b){this.b = a;this.f = b;}t(Eg,sc);Eg.prototype.Sc = function(a){return new Fc(this.f.nd(a.url,this.b));};function Fg(a){this.g = this.h = null;this.f = 0;this.b = a;}function Gg(a,b){this.b = -1;this.f = a;this.g = b;}function Hg(){this.b = [];this.f = [];this.match = [];this.g = [];this.error = [];this.h = !0;}Hg.prototype.connect = function(a,b){for(var c=0;c < a.length;c++) this.f[a[c]].b = b;a.splice(0,a.length);};Hg.prototype.clone = function(){for(var a=new Hg(),b=0;b < this.b.length;b++) {var c=this.b[b],d=new Fg(c.b);d.f = c.f;a.b.push(d);}for(b = 0;b < this.f.length;b++) c = this.f[b],d = new Gg(c.f,c.g),d.b = c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a;};function Ig(a,b,c,d){var e=a.b.length,f=new Fg(Jg);f.f = 0 <= d?c?2 * d + 1:2 * d + 2:c?-1:-2;a.b.push(f);a.connect(b,e);c = new Gg(e,!0);e = new Gg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c);}function Kg(a){return 1 == a.b.length && !a.b[0].f && a.b[0].b instanceof Lg;}function Mg(a,b,c){if(b.b.length){var d=a.b.length;if(4 == c && 1 == d && Kg(b) && Kg(a)){c = a.b[0].b;b = b.b[0].b;var d={},e={},f;for(f in c.f) d[f] = c.f[f];for(f in b.f) d[f] = b.f[f];for(var g in c.g) e[g] = c.g[g];for(g in b.g) e[g] = b.g[g];a.b[0].b = new Lg(c.b | b.b,d,e);}else {for(f = 0;f < b.b.length;f++) a.b.push(b.b[f]);4 == c?(a.h = !0,a.connect(a.g,d)):a.connect(a.match,d);g = a.f.length;for(f = 0;f < b.f.length;f++) e = b.f[f],e.f += d,0 <= e.b && (e.b += d),a.f.push(e);for(f = 0;f < b.match.length;f++) a.match.push(b.match[f] + g);3 == c && a.connect(a.match,d);if(2 == c || 3 == c)for(f = 0;f < b.g.length;f++) a.match.push(b.g[f] + g);else if(a.h){for(f = 0;f < b.g.length;f++) a.g.push(b.g[f] + g);a.h = b.h;}else for(f = 0;f < b.g.length;f++) a.error.push(b.g[f] + g);for(f = 0;f < b.error.length;f++) a.error.push(b.error[f] + g);b.b = null;b.f = null;}}}var U={};function Ng(){}t(Ng,rc);Ng.prototype.h = function(a,b){var c=a[b].ca(this);return c?[c]:null;};function Lg(a,b,c){this.b = a;this.f = b;this.g = c;}t(Lg,Ng);n = Lg.prototype;n.Fe = function(a){return this.b & 1?a:null;};n.Ge = function(a){return this.b & 2048?a:null;};n.od = function(a){return this.b & 2?a:null;};n.ac = function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b & 4?a:null;};n.Rc = function(a){return a.L || this.b & 512?0 > a.L && !(this.b & 256)?null:this.g[a.ha]?a:null:"%" == a.ha && this.b & 1024?a:null;};n.Qc = function(a){return a.L?0 >= a.L && !(this.b & 256)?null:this.b & 16?a:null:this.b & 512?a:null;};n.Pc = function(a){return a.L?0 >= a.L && !(this.b & 256)?null:this.b & 48?a:(a = this.f["" + a.L])?a:null:this.b & 512?a:null;};n.Wd = function(a){return this.b & 64?a:null;};n.Sc = function(a){return this.b & 128?a:null;};n.Gb = function(){return null;};n.$b = function(){return null;};n.Jb = function(){return null;};n.Oc = function(){return null;};var Jg=new Lg(0,U,U);function Og(a){this.b = new Fg(null);var b=this.g = new Fg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c + 1);a.connect(a.error,c + 1);for(b = 0;b < a.f.length;b++) {var d=a.f[b];d.g?a.b[d.f].h = a.b[d.b]:a.b[d.f].g = a.b[d.b];}for(b = 0;b < c;b++) if(!a.b[b].g || !a.b[b].h)throw Error("Invalid validator state");this.f = a.b[0];}t(Og,Ng);function Pg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f !== a.b && f !== a.g;) if(g >= b.length)f = f.g;else {var k=b[g],m;if(f.f)m = !0,-1 == f.f?(h?h.push(l):h = [l],l = []):-2 == f.f?0 < h.length?l = h.pop():l = null:0 < f.f && !(f.f % 2)?l[Math.floor((f.f - 1) / 2)] = "taken":m = null == l[Math.floor((f.f - 1) / 2)],f = m?f.h:f.g;else {if(!g && !c && f.b instanceof Qg && a instanceof Qg){if(m = new tc(b).ca(f.b)){g = b.length;f = f.h;continue;}}else if(!g && !c && f.b instanceof Rg && a instanceof Qg){if(m = new uc(b).ca(f.b)){g = b.length;f = f.h;continue;}}else m = k.ca(f.b);if(m){if(m !== k && b === e)for(e = [],k = 0;k < g;k++) e[k] = b[k];b !== e && (e[g - d] = m);g++;f = f.h;}else f = f.g;}}return f === a.b && (c?0 < e.length:g == b.length)?e:null;}n = Og.prototype;n.nb = function(a){for(var b=null,c=this.f;c !== this.b && c !== this.g;) a?c.f?c = c.h:(b = a.ca(c.b))?(a = null,c = c.h):c = c.g:c = c.g;return c === this.b?b:null;};n.Fe = function(a){return this.nb(a);};n.Ge = function(a){return this.nb(a);};n.od = function(a){return this.nb(a);};n.ac = function(a){return this.nb(a);};n.Rc = function(a){return this.nb(a);};n.Qc = function(a){return this.nb(a);};n.Pc = function(a){return this.nb(a);};n.Wd = function(a){return this.nb(a);};n.Sc = function(a){return this.nb(a);};n.Gb = function(){return null;};n.$b = function(){return null;};n.Jb = function(a){return this.nb(a);};n.Oc = function(){return null;};function Qg(a){Og.call(this,a);}t(Qg,Og);Qg.prototype.Gb = function(a){var b=Pg(this,a.values,!1,0);return b === a.values?a:b?new tc(b):null;};Qg.prototype.$b = function(a){for(var b=this.f,c=!1;b;) {if(b.b instanceof Rg){c = !0;break;}b = b.g;}return c?(b = Pg(this,a.values,!1,0),b === a.values?a:b?new uc(b):null):null;};Qg.prototype.h = function(a,b){return Pg(this,a,!0,b);};function Rg(a){Og.call(this,a);}t(Rg,Og);Rg.prototype.Gb = function(a){return this.nb(a);};Rg.prototype.$b = function(a){var b=Pg(this,a.values,!1,0);return b === a.values?a:b?new uc(b):null;};Rg.prototype.h = function(a,b){for(var c=this.f,d;c !== this.g;) {if(d = c.b.h(a,b))return d;c = c.g;}return null;};function Sg(a,b){Og.call(this,b);this.name = a;}t(Sg,Og);Sg.prototype.nb = function(){return null;};Sg.prototype.Jb = function(a){if(a.name.toLowerCase() != this.name)return null;var b=Pg(this,a.values,!1,0);return b === a.values?a:b?new vc(a.name,b):null;};function Tg(){}Tg.prototype.b = function(a,b){return b;};Tg.prototype.g = function(){};function Ug(a,b){this.name = b;this.h = a.g[this.name];}t(Ug,Tg);Ug.prototype.b = function(a,b,c){if(c.values[this.name])return b;if(a = this.h.h(a,b)){var d=a.length;this.g(1 < d?new tc(a):a[0],c);return b + d;}return b;};Ug.prototype.g = function(a,b){b.values[this.name] = a;};function Vg(a,b){Ug.call(this,a,b[0]);this.f = b;}t(Vg,Ug);Vg.prototype.g = function(a,b){for(var c=0;c < this.f.length;c++) b.values[this.f[c]] = a;};function Wg(a,b){this.f = a;this.df = b;}t(Wg,Tg);Wg.prototype.b = function(a,b,c){var d=b;if(this.df)if(a[b] == zc){if(++b == a.length)return d;}else return d;var e=this.f[0].b(a,b,c);if(e == b)return d;b = e;for(d = 1;d < this.f.length && b < a.length;d++) {e = this.f[d].b(a,b,c);if(e == b)break;b = e;}return b;};function Xg(){this.b = this.lb = null;this.error = !1;this.values = {};this.f = null;}n = Xg.prototype;n.clone = function(){var a=new this.constructor();a.lb = this.lb;a.b = this.b;a.f = this.f;return a;};n.He = function(a,b){this.lb = a;this.b = b;};n.xc = function(){this.error = !0;return 0;};function Yg(a,b){a.xc([b]);return null;}n.Fe = function(a){return Yg(this,a);};n.od = function(a){return Yg(this,a);};n.ac = function(a){return Yg(this,a);};n.Rc = function(a){return Yg(this,a);};n.Qc = function(a){return Yg(this,a);};n.Pc = function(a){return Yg(this,a);};n.Wd = function(a){return Yg(this,a);};n.Sc = function(a){return Yg(this,a);};n.Gb = function(a){this.xc(a.values);return null;};n.$b = function(){this.error = !0;return null;};n.Jb = function(a){return Yg(this,a);};n.Oc = function(){this.error = !0;return null;};function Zg(){Xg.call(this);}t(Zg,Xg);Zg.prototype.xc = function(a){for(var b=0,c=0;b < a.length;) {var d=this.lb[c].b(a,b,this);if(d > b)b = d,c = 0;else if(++c == this.lb.length){this.error = !0;break;}}return b;};function $g(){Xg.call(this);}t($g,Xg);$g.prototype.xc = function(a){if(a.length > this.lb.length || !a.length)return this.error = !0,0;for(var b=0;b < this.lb.length;b++) {for(var c=b;c >= a.length;) c = 1 == c?0:c - 2;if(this.lb[b].b(a,c,this) != c + 1)return this.error = !0,0;}return a.length;};function ah(){Xg.call(this);}t(ah,Xg);ah.prototype.xc = function(a){for(var b=a.length,c=0;c < a.length;c++) if(a[c] === zc){b = c;break;}if(b > this.lb.length || !a.length)return this.error = !0,0;for(c = 0;c < this.lb.length;c++) {for(var d=c;d >= b;) d = 1 == d?0:d - 2;var e;if(b + 1 < a.length)for(e = b + c + 1;e >= a.length;) e -= e == b + 2?1:2;else e = d;if(2 != this.lb[c].b([a[d],a[e]],0,this))return this.error = !0,0;}return a.length;};function bh(){Xg.call(this);}t(bh,Zg);bh.prototype.$b = function(a){for(var b={},c=0;c < a.values.length;c++) {this.values = {};if(a.values[c] instanceof uc)this.error = !0;else {a.values[c].ca(this);for(var d=b,e=this.values,f=0;f < this.b.length;f++) {var g=this.b[f],h=e[g] || this.f.l[g],l=d[g];l || (l = [],d[g] = l);l.push(h);}this.values["background-color"] && c != a.values.length - 1 && (this.error = !0);}if(this.error)return null;}this.values = {};for(var k in b) this.values[k] = "background-color" == k?b[k].pop():new uc(b[k]);return null;};function ch(){Xg.call(this);}t(ch,Zg);ch.prototype.He = function(a,b){Zg.prototype.He.call(this,a,b);this.b.push("font-family","line-height","font-size");};ch.prototype.xc = function(a){var b=Zg.prototype.xc.call(this,a);if(b + 2 > a.length)return this.error = !0,b;this.error = !1;var c=this.f.g;if(!a[b].ca(c["font-size"]))return this.error = !0,b;this.values["font-size"] = a[b++];if(a[b] === zc){b++;if(b + 2 > a.length || !a[b].ca(c["line-height"]))return this.error = !0,b;this.values["line-height"] = a[b++];}var d=b == a.length - 1?a[b]:new tc(a.slice(b,a.length));if(!d.ca(c["font-family"]))return this.error = !0,b;this.values["font-family"] = d;return a.length;};ch.prototype.$b = function(a){a.values[0].ca(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c < a.values.length;c++) b.push(a.values[c]);a = new uc(b);a.ca(this.f.g["font-family"])?this.values["font-family"] = a:this.error = !0;return null;};ch.prototype.ac = function(a){if(a = this.f.f[a.name])for(var b in a) this.values[b] = a[b];else this.error = !0;return null;};var dh={SIMPLE:Zg,INSETS:$g,INSETS_SLASH:ah,COMMA:bh,FONT:ch};function eh(){this.g = {};this.C = {};this.l = {};this.b = {};this.f = {};this.h = {};this.A = [];this.j = [];}function fh(a,b){var c;if(3 == b.type)c = new D(b.L,b.text);else if(7 == b.type)c = mf(b.text);else if(1 == b.type)c = C(b.text);else throw Error("unexpected replacement");if(Kg(a)){var d=a.b[0].b.f,e;for(e in d) d[e] = c;return a;}throw Error("unexpected replacement");}function gh(a,b,c){for(var d=new Hg(),e=0;e < b;e++) Mg(d,a.clone(),1);if(c == Number.POSITIVE_INFINITY)Mg(d,a,3);else for(e = b;e < c;e++) Mg(d,a.clone(),2);return d;}function hh(a){var b=new Hg(),c=b.b.length;b.b.push(new Fg(a));a = new Gg(c,!0);var d=new Gg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h = !1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b;}function ih(a,b){var c;switch(a){case "COMMA":c = new Rg(b);break;case "SPACE":c = new Qg(b);break;default:c = new Sg(a.toLowerCase(),b);}return hh(c);}function jh(a){a.b.HASHCOLOR = hh(new Lg(64,U,U));a.b.POS_INT = hh(new Lg(32,U,U));a.b.POS_NUM = hh(new Lg(16,U,U));a.b.POS_PERCENTAGE = hh(new Lg(8,U,{"%":B}));a.b.NEGATIVE = hh(new Lg(256,U,U));a.b.ZERO = hh(new Lg(512,U,U));a.b.ZERO_PERCENTAGE = hh(new Lg(1024,U,U));a.b.POS_LENGTH = hh(new Lg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE = hh(new Lg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME = hh(new Lg(8,U,{s:B,ms:B}));a.b.FREQUENCY = hh(new Lg(8,U,{Hz:B,kHz:B}));a.b.RESOLUTION = hh(new Lg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI = hh(new Lg(128,U,U));a.b.IDENT = hh(new Lg(4,U,U));a.b.STRING = hh(new Lg(2,U,U));a.b.SLASH = hh(new Lg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption = b;a.f.icon = b;a.f.menu = b;a.f["message-box"] = b;a.f["small-caption"] = b;a.f["status-bar"] = b;}function kh(a){return !!a.match(/^[A-Z_0-9]+$/);}function lh(a,b,c){var d=Q(b);if(0 == d.type)return null;var e={"":!0};if(14 == d.type){do {S(b);d = Q(b);if(1 != d.type)throw Error("Prefix name expected");e[d.text] = !0;S(b);d = Q(b);}while(16 == d.type);if(15 != d.type)throw Error("']' expected");S(b);d = Q(b);}if(1 != d.type)throw Error("Property name expected");if(2 == c?"SHORTHANDS" == d.text:"DEFAULTS" == d.text)return S(b),null;d = d.text;S(b);if(2 != c){if(39 != Q(b).type)throw Error("'=' expected");kh(d) || (a.C[d] = e);}else if(18 != Q(b).type)throw Error("':' expected");return d;}function mh(a,b){for(;;) {var c=lh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function l(){if(!d.length)throw Error("No values");var a;if(1 == d.length)a = d[0];else {var b=f,c=d;a = new Hg();if("||" == b){for(b = 0;b < c.length;b++) {var e=new Hg(),g=e;if(g.b.length)throw Error("invalid call");var h=new Fg(Jg);h.f = 2 * b + 1;g.b.push(h);var h=new Gg(0,!0),k=new Gg(0,!1);g.g.push(g.f.length);g.f.push(k);g.match.push(g.f.length);g.f.push(h);Mg(e,c[b],1);Ig(e,e.match,!1,b);Mg(a,e,b?4:1);}c = new Hg();if(c.b.length)throw Error("invalid call");Ig(c,c.match,!0,-1);Mg(c,a,3);a = [c.match,c.g,c.error];for(b = 0;b < a.length;b++) Ig(c,a[b],!1,-1);a = c;}else {switch(b){case " ":e = 1;break;case "|":case "||":e = 4;break;default:throw Error("unexpected op");}for(b = 0;b < c.length;b++) Mg(a,c[b],b?e:1);}}return a;},k=function k(a){if(h)throw Error("'" + a + "': unexpected");if(f && f != a)throw Error("mixed operators: '" + a + "' and '" + f + "'");f = a;h = !0;},m=null;!m;) switch((S(b),g = Q(b),g.type)){case 1:h || k(" ");if(kh(g.text)){var p=a.b[g.text];if(!p)throw Error("'" + g.text + "' unexpected");d.push(p.clone());}else p = {},p[g.text.toLowerCase()] = C(g.text),d.push(hh(new Lg(0,p,U)));h = !1;break;case 5:p = {};p["" + g.L] = new Dc(g.L);d.push(hh(new Lg(0,p,U)));h = !1;break;case 34:k("|");break;case 25:k("||");break;case 14:h || k(" ");e.push({hf:d,af:f,Ab:"["});f = "";d = [];h = !0;break;case 6:h || k(" ");e.push({hf:d,af:f,Ab:"(",Fc:g.text});f = "";d = [];h = !0;break;case 15:g = l();p = e.pop();if("[" != p.Ab)throw Error("']' unexpected");d = p.hf;d.push(g);f = p.af;h = !1;break;case 11:g = l();p = e.pop();if("(" != p.Ab)throw Error("')' unexpected");d = p.hf;d.push(ih(p.Fc,g));f = p.af;h = !1;break;case 18:if(h)throw Error("':' unexpected");S(b);d.push(fh(d.pop(),Q(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(gh(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(gh(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(gh(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);g = Q(b);if(5 != g.type)throw Error("<int> expected");var q=p = g.L;S(b);g = Q(b);if(16 == g.type){S(b);g = Q(b);if(5 != g.type)throw Error("<int> expected");q = g.L;S(b);g = Q(b);}if(13 != g.type)throw Error("'}' expected");d.push(gh(d.pop(),p,q));break;case 17:m = l();if(0 < e.length)throw Error("unclosed '" + e.pop().Ab + "'");break;default:throw Error("unexpected token");}S(b);kh(c)?a.b[c] = m:a.g[c] = 1 != m.b.length || m.b[0].f?new Qg(m):m.b[0].b;}}function nh(a,b){for(var c={},d=0;d < b.length;d++) for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f < e.length;f++) {var g=e[f],h=a.l[g];h?c[g] = h:v.b("Unknown property in makePropSet:",g);}return c;}function oh(a,b,c,d,e){var f="",g=b;b = b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h && (f = h[1],b = h[2]);if((h = a.C[b]) && h[f])if(f = a.g[b])(a = c === fd || c.Se()?c:c.ca(f))?e.Eb(b,a,d):e.Yc(g,c);else if((b = a.h[b].clone(),c === fd))for(c = 0;c < b.b.length;c++) e.Eb(b.b[c],fd,d);else {c.ca(b);if(b.error)d = !1;else {for(a = 0;a < b.b.length;a++) f = b.b[a],e.Eb(f,b.values[f] || b.f.l[f],d);d = !0;}d || e.Yc(g,c);}else e.Ud(g,c);}var ph=new te(function(){var a=J("loadValidatorSet.load"),b=pa("validation.txt",oa),c=ff(b),d=new eh();jh(d);c.then(function(c){try{if(c.responseText){var e=new cf(c.responseText,null);for(mh(d,e);;) {var g=lh(d,e,2);if(!g)break;for(c = [];;) {S(e);var h=Q(e);if(17 == h.type){S(e);break;}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Cc(h.L));break;case 5:c.push(new Dc(h.L));break;case 3:c.push(new D(h.L,h.text));break;default:throw Error("unexpected token");}}d.l[g] = 1 < c.length?new tc(c):c[0];}for(;;) {var l=lh(d,e,3);if(!l)break;var k=R(e,1),m;1 == k.type && dh[k.text]?(m = new dh[k.text](),S(e)):m = new Zg();m.f = d;g = !1;h = [];c = !1;for(var p=[],q=[];!g;) switch((S(e),k = Q(e),k.type)){case 1:if(d.g[k.text])h.push(new Ug(m.f,k.text)),q.push(k.text);else if(d.h[k.text] instanceof $g){var r=d.h[k.text];h.push(new Vg(r.f,r.b));q.push.apply(q,r.b);}else throw Error("'" + k.text + "' is neither a simple property nor an inset shorthand");break;case 19:if(0 < h.length || c)throw Error("unexpected slash");c = !0;break;case 14:p.push({df:c,lb:h});h = [];c = !1;break;case 15:var z=new Wg(h,c),u=p.pop(),h=u.lb;c = u.df;h.push(z);break;case 17:g = !0;S(e);break;default:throw Error("unexpected token");}m.He(h,q);d.h[l] = m;}d.j = nh(d,["background"]);d.A = nh(d,"margin border padding columns column-gap column-rule column-fill".split(" "));}else v.error("Error: missing",b);}catch(A) {v.error(A,"Error:");}M(a,d);});return a.result();},"validatorFetcher");var qh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},rh=["box-decoration-break","image-resolution","orphans","widows"];function sh(){return Ud("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b());},[].concat(rh));}for(var th={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},uh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),vh=["left","right","top","bottom"],wh={width:!0,height:!0},xh=0;xh < uh.length;xh++) for(var yh=0;yh < vh.length;yh++) {var zh=uh[xh].replace("%",vh[yh]);wh[zh] = !0;}function Ah(a){for(var b={},c=0;c < uh.length;c++) for(var d in a) {var e=uh[c].replace("%",d),f=uh[c].replace("%",a[d]);b[e] = f;b[f] = e;}return b;}var Bh=Ah({before:"right",after:"left",start:"top",end:"bottom"}),Ch=Ah({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value = a;this.Ua = b;}n = V.prototype;n.Cf = function(){return this;};n.Cd = function(a){a = this.value.ca(a);return a === this.value?this:new V(a,this.Ua);};n.Ef = function(a){return a?new V(this.value,this.Ua + a):this;};n.evaluate = function(a,b){return Zf(a,this.value,b);};n.kf = function(){return !0;};function Dh(a,b,c){V.call(this,a,b);this.ga = c;}t(Dh,V);Dh.prototype.Cf = function(){return new V(this.value,this.Ua);};Dh.prototype.Cd = function(a){a = this.value.ca(a);return a === this.value?this:new Dh(a,this.Ua,this.ga);};Dh.prototype.Ef = function(a){return a?new Dh(this.value,this.Ua + a,this.ga):this;};Dh.prototype.kf = function(a){return !!this.ga.evaluate(a);};function Eh(a,b,c){return (!b || c.Ua > b.Ua) && c.kf(a)?c.Cf():b;}var Fh={"region-id":!0,"fragment-selector-id":!0};function Gh(a){return "_" != a.charAt(0) && !Fh[a];}function Hh(a,b,c){c?a[b] = c:delete a[b];}function Ih(a,b){var c=a[b];c || (c = {},a[b] = c);return c;}function Jh(a){var b=a._viewConditionalStyles;b || (b = [],a._viewConditionalStyles = b);return b;}function Kh(a,b){var c=a[b];c || (c = [],a[b] = c);return c;}function Lh(a,b,c,d,e,f,g){[{id:e,Xf:"_pseudos"},{id:f,Xf:"_regions"}].forEach(function(a){if(a.id){var c=Ih(b,a.Xf);b = c[a.id];b || (b = {},c[a.id] = b);}});g && (e = Jh(b),b = {},e.push({yg:b,mg:g}));for(var h in c) "_" != h.charAt(0) && (Fh[h]?(g = c[h],e = Kh(b,h),Array.prototype.push.apply(e,g)):Hh(b,h,Eh(a,b[h],c[h].Ef(d))));}function Mh(a,b){if(0 < a.length){a.sort(function(a,b){return b.f() - a.f();});for(var c=null,d=a.length - 1;0 <= d;d--) c = a[d],c.b = b,b = c;return c;}return b;}function Nh(a,b){this.g = a;this.f = b;this.b = "";}t(Nh,sc);function Oh(a){a = a.g["font-size"].value;var b;a: switch(a.ha.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b = !0;break a;default:b = !1;}if(!b)throw Error("Unexpected state");return a.L * Ab[a.ha];}Nh.prototype.Rc = function(a){if("font-size" === this.b){var b=Oh(this),c=this.f;a = Ph(a,b,c);var d=a.ha,e=a.L;return "px" === d?a:"%" === d?new D(e / 100 * b,"px"):new D(e * Eb(c,d,!1),"px");}if("em" == a.ha || "ex" == a.ha || "rem" == a.ha)return Ph(a,Oh(this),this.f);if("%" == a.ha){if("line-height" === this.b)return a;b = this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.L,b);}return a;};Nh.prototype.Oc = function(a){return "font-size" == this.b?Zf(this.f,a,this.b).ca(this):a;};function Ph(a,b,c){var d=a.ha,e=a.L;return "em" === d || "ex" === d?new D(Ab[d] / Ab.em * e * b,"px"):"rem" === d?new D(e * c.fontSize(),"px"):a;}function Qh(){}Qh.prototype.apply = function(){};Qh.prototype.l = function(a){return new Rh([this,a]);};Qh.prototype.clone = function(){return this;};function Sh(a){this.b = a;}t(Sh,Qh);Sh.prototype.apply = function(a){var b=this.b.f(a);a.h[a.h.length - 1].push(b);};function Rh(a){this.b = a;}t(Rh,Qh);Rh.prototype.apply = function(a){for(var b=0;b < this.b.length;b++) this.b[b].apply(a);};Rh.prototype.l = function(a){this.b.push(a);return this;};Rh.prototype.clone = function(){return new Rh([].concat(this.b));};function Th(a,b,c,d,e){this.style = a;this.$ = b;this.b = c;this.h = d;this.j = e;}t(Th,Qh);Th.prototype.apply = function(a){Lh(a.l,a.G,this.style,this.$,this.b,this.h,Uh(a,this.j));};function W(){this.b = null;}t(W,Qh);W.prototype.apply = function(a){this.b.apply(a);};W.prototype.f = function(){return 0;};W.prototype.g = function(){return !1;};function Vh(a){this.b = null;this.h = a;}t(Vh,W);Vh.prototype.apply = function(a){0 <= a.H.indexOf(this.h) && this.b.apply(a);};Vh.prototype.f = function(){return 10;};Vh.prototype.g = function(a){this.b && Wh(a.Ga,this.h,this.b);return !0;};function Xh(a){this.b = null;this.id = a;}t(Xh,W);Xh.prototype.apply = function(a){a.X != this.id && a.ja != this.id || this.b.apply(a);};Xh.prototype.f = function(){return 11;};Xh.prototype.g = function(a){this.b && Wh(a.g,this.id,this.b);return !0;};function Yh(a){this.b = null;this.localName = a;}t(Yh,W);Yh.prototype.apply = function(a){a.f == this.localName && this.b.apply(a);};Yh.prototype.f = function(){return 8;};Yh.prototype.g = function(a){this.b && Wh(a.md,this.localName,this.b);return !0;};function Zh(a,b){this.b = null;this.h = a;this.localName = b;}t(Zh,W);Zh.prototype.apply = function(a){a.f == this.localName && a.j == this.h && this.b.apply(a);};Zh.prototype.f = function(){return 8;};Zh.prototype.g = function(a){if(this.b){var b=a.b[this.h];b || (b = "ns" + a.j++ + ":",a.b[this.h] = b);Wh(a.h,b + this.localName,this.b);}return !0;};function $h(a){this.b = null;this.h = a;}t($h,W);$h.prototype.apply = function(a){var b=a.b;if(b && "a" == a.f){var c=b.getAttribute("href");c && c.match(/^#/) && (b = b.ownerDocument.getElementById(c.substring(1))) && (b = b.getAttributeNS("http://www.idpf.org/2007/ops","type")) && b.match(this.h) && this.b.apply(a);}};function ai(a){this.b = null;this.h = a;}t(ai,W);ai.prototype.apply = function(a){a.j == this.h && this.b.apply(a);};function bi(a,b){this.b = null;this.h = a;this.name = b;}t(bi,W);bi.prototype.apply = function(a){a.b && a.b.hasAttributeNS(this.h,this.name) && this.b.apply(a);};function ci(a,b,c){this.b = null;this.h = a;this.name = b;this.value = c;}t(ci,W);ci.prototype.apply = function(a){a.b && a.b.getAttributeNS(this.h,this.name) == this.value && this.b.apply(a);};ci.prototype.f = function(){return "type" == this.name && "http://www.idpf.org/2007/ops" == this.h?9:0;};ci.prototype.g = function(a){return "type" == this.name && "http://www.idpf.org/2007/ops" == this.h?(this.b && Wh(a.f,this.value,this.b),!0):!1;};function di(a,b){this.b = null;this.h = a;this.name = b;}t(di,W);di.prototype.apply = function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b && th[b] && this.b.apply(a);}};di.prototype.f = function(){return 0;};di.prototype.g = function(){return !1;};function ei(a,b,c){this.b = null;this.j = a;this.name = b;this.h = c;}t(ei,W);ei.prototype.apply = function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b && b.match(this.h) && this.b.apply(a);}};function fi(a){this.b = null;this.h = a;}t(fi,W);fi.prototype.apply = function(a){a.lang.match(this.h) && this.b.apply(a);};function gi(){this.b = null;}t(gi,W);gi.prototype.apply = function(a){a.ib && this.b.apply(a);};gi.prototype.f = function(){return 6;};function hi(){this.b = null;}t(hi,W);hi.prototype.apply = function(a){a.sa && this.b.apply(a);};hi.prototype.f = function(){return 12;};function ii(a,b){this.b = null;this.h = a;this.Ab = b;}t(ii,W);function ji(a,b,c){a -= c;return b?!(a % b) && 0 <= a / b:!a;}function ki(a,b){ii.call(this,a,b);}t(ki,ii);ki.prototype.apply = function(a){ji(a.Ka,this.h,this.Ab) && this.b.apply(a);};ki.prototype.f = function(){return 5;};function li(a,b){ii.call(this,a,b);}t(li,ii);li.prototype.apply = function(a){ji(a.xb[a.j][a.f],this.h,this.Ab) && this.b.apply(a);};li.prototype.f = function(){return 5;};function mi(a,b){ii.call(this,a,b);}t(mi,ii);mi.prototype.apply = function(a){var b=a.R;null === b && (b = a.R = a.b.parentNode.childElementCount - a.Ka + 1);ji(b,this.h,this.Ab) && this.b.apply(a);};mi.prototype.f = function(){return 4;};function ni(a,b){ii.call(this,a,b);}t(ni,ii);ni.prototype.apply = function(a){var b=a.wb;if(!b[a.j]){var c=a.b;do {var d=c.namespaceURI,e=c.localName,f=b[d];f || (f = b[d] = {});f[e] = (f[e] || 0) + 1;}while(c = c.nextElementSibling);}ji(b[a.j][a.f],this.h,this.Ab) && this.b.apply(a);};ni.prototype.f = function(){return 4;};function oi(){this.b = null;}t(oi,W);oi.prototype.apply = function(a){for(var b=a.b.firstChild;b;) {switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0 < b.length)return;}b = b.nextSibling;}this.b.apply(a);};oi.prototype.f = function(){return 4;};function pi(){this.b = null;}t(pi,W);pi.prototype.apply = function(a){!1 === a.b.disabled && this.b.apply(a);};pi.prototype.f = function(){return 5;};function qi(){this.b = null;}t(qi,W);qi.prototype.apply = function(a){!0 === a.b.disabled && this.b.apply(a);};qi.prototype.f = function(){return 5;};function ri(){this.b = null;}t(ri,W);ri.prototype.apply = function(a){var b=a.b;!0 !== b.selected && !0 !== b.checked || this.b.apply(a);};ri.prototype.f = function(){return 5;};function si(a){this.b = null;this.ga = a;}t(si,W);si.prototype.apply = function(a){if(a.ia[this.ga])try{a.$a.push(this.ga),this.b.apply(a);}finally {a.$a.pop();}};si.prototype.f = function(){return 5;};function ti(){this.b = !1;}t(ti,Qh);ti.prototype.apply = function(){this.b = !0;};ti.prototype.clone = function(){var a=new ti();a.b = this.b;return a;};function ui(a){this.b = null;this.h = new ti();this.j = Mh(a,this.h);}t(ui,W);ui.prototype.apply = function(a){this.j.apply(a);this.h.b || this.b.apply(a);this.h.b = !1;};ui.prototype.f = function(){return this.j.f();};function vi(a,b,c){this.ga = a;this.b = b;this.h = c;}function wi(a,b){var c=a.ga,d=a.h;b.ia[c] = (b.ia[c] || 0) + 1;d && (b.C[c]?b.C[c].push(d):b.C[c] = [d]);}function xi(a,b){yi(b,a.ga,a.h);}function zi(a,b,c){vi.call(this,a,b,c);}t(zi,vi);zi.prototype.f = function(a){return new zi(this.ga,this.b,Uh(a,this.b));};zi.prototype.push = function(a,b){b || wi(this,a);return !1;};zi.prototype.pop = function(a,b){return b?!1:(xi(this,a),!0);};function Ai(a,b,c){vi.call(this,a,b,c);}t(Ai,vi);Ai.prototype.f = function(a){return new Ai(this.ga,this.b,Uh(a,this.b));};Ai.prototype.push = function(a,b){b?1 == b && xi(this,a):wi(this,a);return !1;};Ai.prototype.pop = function(a,b){if(b)1 == b && wi(this,a);else return xi(this,a),!0;return !1;};function Bi(a,b,c){vi.call(this,a,b,c);this.g = !1;}t(Bi,vi);Bi.prototype.f = function(a){return new Bi(this.ga,this.b,Uh(a,this.b));};Bi.prototype.push = function(a){return this.g?(xi(this,a),!0):!1;};Bi.prototype.pop = function(a,b){if(this.g)return xi(this,a),!0;b || (this.g = !0,wi(this,a));return !1;};function Ci(a,b,c){vi.call(this,a,b,c);this.g = !1;}t(Ci,vi);Ci.prototype.f = function(a){return new Ci(this.ga,this.b,Uh(a,this.b));};Ci.prototype.push = function(a,b){this.g && (-1 == b?wi(this,a):b || xi(this,a));return !1;};Ci.prototype.pop = function(a,b){if(this.g){if(-1 == b)return xi(this,a),!0;b || wi(this,a);}else b || (this.g = !0,wi(this,a));return !1;};function Di(a,b){this.b = a;this.element = b;}Di.prototype.f = function(){return this;};Di.prototype.push = function(){return !1;};Di.prototype.pop = function(a,b){return b?!1:(Ei(a,this.b,this.element),!0);};function Fi(a){this.lang = a;}Fi.prototype.f = function(){return this;};Fi.prototype.push = function(){return !1;};Fi.prototype.pop = function(a,b){return b?!1:(a.lang = this.lang,!0);};function Gi(a){this.b = a;}Gi.prototype.f = function(){return this;};Gi.prototype.push = function(){return !1;};Gi.prototype.pop = function(a,b){return b?!1:(a.J = this.b,!0);};function Hi(a){this.element = a;}t(Hi,sc);function Ii(a,b){switch(b){case "url":return a?new Fc(a):new Fc("about:invalid");default:return a?new Ac(a):new Ac("");}}Hi.prototype.Jb = function(a){if("attr" !== a.name)return sc.prototype.Jb.call(this,a);var b="string",c;a.values[0] instanceof tc?(2 <= a.values[0].values.length && (b = a.values[0].values[1].stringValue()),c = a.values[0].values[0].stringValue()):c = a.values[0].stringValue();a = 1 < a.values.length?Ii(a.values[1].stringValue(),b):Ii(null,b);return this.element && this.element.hasAttribute(c)?Ii(this.element.getAttribute(c),b):a;};function Ji(a,b,c){this.f = a;this.element = b;this.b = c;}t(Ji,sc);Ji.prototype.ac = function(a){var b=this.f,c=b.J,d=Math.floor(c.length / 2) - 1;switch(a.name){case "open-quote":a = c[2 * Math.min(d,b.D)];b.D++;break;case "close-quote":return 0 < b.D && b.D--,c[2 * Math.min(d,b.D) + 1];case "no-open-quote":return b.D++,new Ac("");case "no-close-quote":return 0 < b.D && b.D--,new Ac("");}return a;};var Ki={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"ք",8E3,"փ",7E3,"ւ",6E3,"ց",5E3,"ր",4E3,"տ",3E3,"վ",2E3,"ս",1E3,"ռ",900,"ջ",800,"պ",700,"չ",600,"ո",500,"շ",400,"ն",300,"յ",200,"մ",100,"ճ",90,"ղ",80,"ձ",70,"հ",60,"կ",50,"ծ",40,"խ",30,"լ",20,"ի",10,"ժ",9,"թ",8,"ը",7,"է",6,"զ",5,"ե",4,"դ",3,"գ",2,"բ",1,"ա"],georgian:[19999,1E4,"ჵ",9E3,"ჰ",8E3,"ჯ",7E3,"ჴ",6E3,"ხ",5E3,"ჭ",4E3,"წ",3E3,"ძ",2E3,"ც",1E3,"ჩ",900,"შ",800,"ყ",700,"ღ",600,"ქ",500,"ფ",400,"ჳ",300,"ტ",200,"ს",100,"რ",90,"ჟ",80,"პ",70,"ო",60,"ჲ",50,"ნ",40,"მ",30,"ლ",20,"კ",10,"ი",9,"თ",8,"ჱ",7,"ზ",6,"ვ",5,"ე",4,"დ",3,"გ",2,"ბ",1,"ა"],hebrew:[999,400,"ת",300,"ש",200,"ר",100,"ק",90,"צ",80,"פ",70,"ע",60,"ס",50,"נ",40,"מ",30,"ל",20,"כ",19,"יט",18,"יח",17,"יז",16,"טז",15,"טו",10,"י",9,"ט",8,"ח",7,"ז",6,"ו",5,"ה",4,"ד",3,"ג",2,"ב",1,"א"]},Li={latin:"a-z",alpha:"a-z",greek:"α-ρσ-ω",russian:"а-ик-щэ-я"},Mi={square:"■",disc:"•",circle:"◦",none:""},Ni={Zg:!1,Uc:"零一二三四五六七八九",Hd:"十百千",pg:"負"};function Oi(a){if(9999 < a || -9999 > a)return "" + a;if(!a)return Ni.Uc.charAt(0);var b=new Ea();0 > a && (b.append(Ni.pg),a = -a);if(10 > a)b.append(Ni.Uc.charAt(a));else if(Ni.$g && 19 >= a)b.append(Ni.Hd.charAt(0)),a && b.append(Ni.Hd.charAt(a - 10));else {var c=Math.floor(a / 1E3);c && (b.append(Ni.Uc.charAt(c)),b.append(Ni.Hd.charAt(2)));if(c = Math.floor(a / 100) % 10)b.append(Ni.Uc.charAt(c)),b.append(Ni.Hd.charAt(1));if(c = Math.floor(a / 10) % 10)b.append(Ni.Uc.charAt(c)),b.append(Ni.Hd.charAt(0));(a %= 10) && b.append(Ni.Uc.charAt(a));}return b.toString();}Ji.prototype.format = function(a,b){var c=!1,d=!1,e;if(e = b.match(/^upper-(.*)/))c = !0,b = e[1];else if(e = b.match(/^lower-(.*)/))d = !0,b = e[1];e = "";if(Ki[b])a: {e = Ki[b];var f=a;if(f > e[0] || 0 >= f || f != Math.round(f))e = "";else {for(var g="",h=1;h < e.length;h += 2) {var l=e[h],k=Math.floor(f / l);if(20 < k){e = "";break a;}for(f -= k * l;0 < k;) g += e[h + 1],k--;}e = g;}}else if(Li[b])if((e = a,0 >= e || e != Math.round(e)))e = "";else {g = Li[b];f = [];for(h = 0;h < g.length;) if("-" == g.substr(h + 1,1))for(k = g.charCodeAt(h),l = g.charCodeAt(h + 2),h += 3;k <= l;k++) f.push(String.fromCharCode(k));else f.push(g.substr(h++,1));g = "";do e--,h = e % f.length,g = f[h] + g,e = (e - h) / f.length;while(0 < e);e = g;}else null != Mi[b]?e = Mi[b]:"decimal-leading-zero" == b?(e = a + "",1 == e.length && (e = "0" + e)):"cjk-ideographic" == b || "trad-chinese-informal" == b?e = Oi(a):e = a + "";return c?e.toUpperCase():d?e.toLowerCase():e;};function Pi(a,b){var c=b[0].toString(),d=1 < b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e && e.length)return new Ac(a.format(e && e.length && e[e.length - 1] || 0,d));c = new E(Qi(a.b,c,function(b){return a.format(b || 0,d);}));return new tc([c]);}function Ri(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2 < b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Ea();if(f && f.length)for(var h=0;h < f.length;h++) 0 < h && g.append(d),g.append(a.format(f[h],e));c = new E(Si(a.b,c,function(b){var c=[];if(b.length)for(var f=0;f < b.length;f++) c.push(a.format(b[f],e));b = g.toString();b.length && c.push(b);return c.length?c.join(d):a.format(0,e);}));return new tc([c]);}function Ti(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=2 < b.length?b[2].stringValue():"decimal",c=new E(Ui(a.b,c,d,function(b){return a.format(b || 0,e);}));return new tc([c]);}function Vi(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3 < b.length?b[3].stringValue():"decimal",c=new E(Wi(a.b,c,d,function(b){b = b.map(function(b){return a.format(b,f);});return b.length?b.join(e):a.format(0,f);}));return new tc([c]);}Ji.prototype.Jb = function(a){switch(a.name){case "counter":if(2 >= a.values.length)return Pi(this,a.values);break;case "counters":if(3 >= a.values.length)return Ri(this,a.values);break;case "target-counter":if(3 >= a.values.length)return Ti(this,a.values);break;case "target-counters":if(4 >= a.values.length)return Vi(this,a.values);}v.b("E_CSS_CONTENT_PROP:",a.toString());return new Ac("");};var Xi=1 / 1048576;function Yi(a,b){for(var c in a) b[c] = a[c].clone();}function Zi(){this.j = 0;this.b = {};this.md = {};this.h = {};this.f = {};this.Ga = {};this.g = {};this.ad = {};this.order = 0;}Zi.prototype.clone = function(){var a=new Zi();a.j = this.j;for(var b in this.b) a.b[b] = this.b[b];Yi(this.md,a.md);Yi(this.h,a.h);Yi(this.f,a.f);Yi(this.Ga,a.Ga);Yi(this.g,a.g);Yi(this.ad,a.ad);a.order = this.order;return a;};function Wh(a,b,c){var d=a[b];d && (c = d.l(c));a[b] = c;}Zi.prototype.$e = function(){return this.order += Xi;};function $i(a,b,c,d){this.A = a;this.l = b;this.yc = c;this.vb = d;this.h = [[],[]];this.ia = {};this.H = this.G = this.Fa = this.b = null;this.Ja = this.ja = this.X = this.j = this.f = "";this.Z = this.O = null;this.sa = this.ib = !0;this.g = {};this.I = [{}];this.J = [new Ac("“"),new Ac("”"),new Ac("‘"),new Ac("’")];this.D = 0;this.lang = "";this.fc = [0];this.Ka = 0;this.oa = [{}];this.xb = this.oa[0];this.R = null;this.Kb = [this.R];this.ec = [{}];this.wb = this.oa[0];this.C = {};this.$a = [];this.yb = [];}function yi(a,b,c){a.ia[b]--;a.C[b] && (a.C[b] = a.C[b].filter(function(a){return a !== c;}),a.C[b].length || delete a.C[b]);}function Uh(a,b){var c=null;b && (c = aj(a.Fa,b));var d=a.$a.map((function(a){return (a = this.C[a]) && 0 < a.length?1 === a.length?a[0]:new bj([].concat(a)):null;}).bind(a)).filter(function(a){return a;});return 0 >= d.length?c:c?new cj([c].concat(d)):1 === d.length?d[0]:new cj(d);}function dj(a,b,c){(b = b[c]) && b.apply(a);}var ej=[];function fj(a,b,c,d){a.b = null;a.Fa = null;a.G = d;a.j = "";a.f = "";a.X = "";a.ja = "";a.H = b;a.Ja = "";a.O = ej;a.Z = c;gj(a);}function hj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b] = [c];c = a.I[a.I.length - 1];c || (c = {},a.I[a.I.length - 1] = c);c[b] = !0;}function ij(a,b){var c=gd,d=b.display;d && (c = d.evaluate(a.l));var e=null,f=d = null,g=b["counter-reset"];g && (g = g.evaluate(a.l)) && (e = Dg(g,!0));(g = b["counter-set"]) && (g = g.evaluate(a.l)) && (f = Dg(g,!1));(g = b["counter-increment"]) && (g = g.evaluate(a.l)) && (d = Dg(g,!1));"ol" != a.f && "ul" != a.f || "http://www.w3.org/1999/xhtml" != a.j || (e || (e = {}),e["ua-list-item"] = 0);c === nd && (d || (d = {}),d["ua-list-item"] = 1);if(e)for(var h in e) hj(a,h,e[h]);if(f)for(var l in f) a.g[l]?(h = a.g[l],h[h.length - 1] = f[l]):hj(a,l,f[l]);if(d)for(var k in d) a.g[k] || hj(a,k,0),h = a.g[k],h[h.length - 1] += d[k];c === nd && (c = a.g["ua-list-item"],b["ua-list-item-count"] = new V(new Cc(c[c.length - 1]),0));a.I.push(null);}function jj(a){var b=a.I.pop();if(b)for(var c in b) (b = a.g[c]) && (1 == b.length?delete a.g[c]:b.pop());}function Ei(a,b,c){ij(a,b);b.content && (b.content = b.content.Cd(new Ji(a,c,a.vb)));jj(a);}var kj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");function lj(a,b,c,d){a.yb.push(b);a.Z = null;a.b = b;a.Fa = d;a.G = c;a.j = b.namespaceURI;a.f = b.localName;d = a.A.b[a.j];a.Ja = d?d + a.f:"";a.X = b.getAttribute("id");a.ja = b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d = b.getAttribute("class"))?a.H = d.split(/\s+/):a.H = ej;(d = b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O = d.split(/\s+/):a.O = ej;"style" == a.f && "http://www.gribuser.ru/xml/fictionbook/2.0" == a.j && (a.H = [b.getAttribute("name") || ""]);if(d = Da(b))a.h[a.h.length - 1].push(new Fi(a.lang)),a.lang = d.toLowerCase();d = a.sa;var e=a.fc;a.Ka = ++e[e.length - 1];e.push(0);var e=a.oa,f=a.xb = e[e.length - 1],g=f[a.j];g || (g = f[a.j] = {});g[a.f] = (g[a.f] || 0) + 1;e.push({});e = a.Kb;null !== e[e.length - 1]?a.R = --e[e.length - 1]:a.R = null;e.push(null);e = a.ec;(f = a.wb = e[e.length - 1]) && f[a.j] && f[a.j][a.f]--;e.push({});gj(a);mj(a,b);e = c.quotes;c = null;e && (e = e.evaluate(a.l)) && (c = new Gi(a.J),e === F?a.J = [new Ac(""),new Ac("")]:e instanceof tc && (a.J = e.values));ij(a,a.G);e = a.X || a.ja || b.getAttribute("name") || "";if(d || e){var h={};Object.keys(a.g).forEach(function(a){h[a] = Array.from(this.g[a]);},a);nj(a.yc,e,h);}if(d = a.G._pseudos)for(e = !0,f = 0;f < kj.length;f++) (g = kj[f]) || (e = !1),(g = d[g]) && (e?Ei(a,g,b):a.h[a.h.length - 2].push(new Di(g,b)));c && a.h[a.h.length - 2].push(c);}function oj(a,b){for(var c in b) Gh(c) && (b[c] = b[c].Cd(a));}function mj(a,b){var c=new Hi(b),d=a.G,e=d._pseudos,f;for(f in e) oj(c,e[f]);oj(c,d);}function gj(a){var b;for(b = 0;b < a.H.length;b++) dj(a,a.A.Ga,a.H[b]);for(b = 0;b < a.O.length;b++) dj(a,a.A.f,a.O[b]);dj(a,a.A.g,a.X);dj(a,a.A.md,a.f);"" != a.f && dj(a,a.A.md,"*");dj(a,a.A.h,a.Ja);null !== a.Z && (dj(a,a.A.ad,a.Z),dj(a,a.A.ad,"*"));a.b = null;a.h.push([]);for(var c=1;-1 <= c;--c) {var d=a.h[a.h.length - c - 2];for(b = 0;b < d.length;) d[b].push(a,c)?d.splice(b,1):b++;}a.ib = !0;a.sa = !1;}$i.prototype.pop = function(){for(var a=1;-1 <= a;--a) for(var b=this.h[this.h.length - a - 2],c=0;c < b.length;) b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.ib = !1;};var pj=null;function qj(a,b,c,d,e,f,g){sf.call(this,a,b,g);this.b = null;this.$ = 0;this.h = this.bb = null;this.D = !1;this.ga = c;this.l = d?d.l:pj?pj.clone():new Zi();this.H = e;this.C = f;this.A = 0;this.j = null;}t(qj,tf);qj.prototype.Gf = function(a){Wh(this.l.md,"*",a);};function rj(a,b){var c=Mh(a.b,b);c !== b && c.g(a.l) || a.Gf(c);}qj.prototype.Ib = function(a,b){if(b || a)this.$ += 1,b && a?this.b.push(new Zh(a,b.toLowerCase())):b?this.b.push(new Yh(b.toLowerCase())):this.b.push(new ai(a));};qj.prototype.be = function(a){this.h?(v.b("::" + this.h,"followed by ." + a),this.b.push(new si(""))):(this.$ += 256,this.b.push(new Vh(a)));};var sj={"nth-child":ki,"nth-of-type":li,"nth-last-child":mi,"nth-last-of-type":ni};qj.prototype.cd = function(a,b){if(this.h)v.b("::" + this.h,"followed by :" + a),this.b.push(new si(""));else {switch(a.toLowerCase()){case "enabled":this.b.push(new pi());break;case "disabled":this.b.push(new qi());break;case "checked":this.b.push(new ri());break;case "root":this.b.push(new hi());break;case "link":this.b.push(new Yh("a"));this.b.push(new bi("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b && 1 == b.length && "string" == typeof b[0]){var c=new RegExp("(^|s)" + ra(b[0]) + "($|s)");this.b.push(new $h(c));}else this.b.push(new si(""));break;case "-adapt-footnote-content":case "footnote-content":this.D = !0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new si(""));break;case "lang":b && 1 == b.length && "string" == typeof b[0]?this.b.push(new fi(new RegExp("^" + ra(b[0].toLowerCase()) + "($|-)"))):this.b.push(new si(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c = sj[a.toLowerCase()];b && 2 == b.length?this.b.push(new c(b[0],b[1])):this.b.push(new si(""));break;case "first-child":this.b.push(new gi());break;case "last-child":this.b.push(new mi(0,1));break;case "first-of-type":this.b.push(new li(0,1));break;case "last-of-type":this.b.push(new ni(0,1));break;case "only-child":this.b.push(new gi());this.b.push(new mi(0,1));break;case "only-of-type":this.b.push(new li(0,1));this.b.push(new ni(0,1));break;case "empty":this.b.push(new oi());break;case "before":case "after":case "first-line":case "first-letter":this.dd(a,b);return;default:v.b("unknown pseudo-class selector: " + a),this.b.push(new si(""));}this.$ += 256;}};qj.prototype.dd = function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(v.b("Double pseudoelement ::" + this.h + "::" + a),this.b.push(new si(""))):this.h = a;break;case "first-n-lines":if(b && 1 == b.length && "number" == typeof b[0]){var c=Math.round(b[0]);if(0 < c && c == b[0]){this.h?(v.b("Double pseudoelement ::" + this.h + "::" + a),this.b.push(new si(""))):this.h = "first-" + c + "-lines";break;}}case "nth-fragment":b && 2 == b.length?this.j = "NFS_" + b[0] + "_" + b[1]:this.b.push(new si(""));break;default:v.b("Unrecognized pseudoelement: ::" + a),this.b.push(new si(""));}this.$ += 1;};qj.prototype.oe = function(a){this.$ += 65536;this.b.push(new Xh(a));};qj.prototype.vd = function(a,b,c,d){this.$ += 256;b = b.toLowerCase();d = d || "";var e;switch(c){case 0:e = new bi(a,b);break;case 39:e = new ci(a,b,d);break;case 45:!d || d.match(/\s/)?e = new si(""):e = new ei(a,b,new RegExp("(^|\\s)" + ra(d) + "($|\\s)"));break;case 44:e = new ei(a,b,new RegExp("^" + ra(d) + "($|-)"));break;case 43:d?e = new ei(a,b,new RegExp("^" + ra(d))):e = new si("");break;case 42:d?e = new ei(a,b,new RegExp(ra(d) + "$")):e = new si("");break;case 46:d?e = new ei(a,b,new RegExp(ra(d))):e = new si("");break;case 50:"supported" == d?e = new di(a,b):(v.b("Unsupported :: attr selector op:",d),e = new si(""));break;default:v.b("Unsupported attr selector:",c),e = new si("");}this.b.push(e);};var tj=0;n = qj.prototype;n.Pb = function(){var a="d" + tj++;rj(this,new Sh(new zi(a,this.j,null)));this.b = [new si(a)];this.j = null;};n.ae = function(){var a="c" + tj++;rj(this,new Sh(new Ai(a,this.j,null)));this.b = [new si(a)];this.j = null;};n.Zd = function(){var a="a" + tj++;rj(this,new Sh(new Bi(a,this.j,null)));this.b = [new si(a)];this.j = null;};n.he = function(){var a="f" + tj++;rj(this,new Sh(new Ci(a,this.j,null)));this.b = [new si(a)];this.j = null;};n.Ic = function(){uj(this);this.h = null;this.D = !1;this.$ = 0;this.b = [];};n.Fb = function(){var a;0 != this.A?(vf(this,"E_CSS_UNEXPECTED_SELECTOR"),a = !0):a = !1;a || (this.A = 1,this.bb = {},this.h = null,this.$ = 0,this.D = !1,this.b = []);};n.error = function(a,b){tf.prototype.error.call(this,a,b);1 == this.A && (this.A = 0);};n.Mc = function(a){tf.prototype.Mc.call(this,a);this.A = 0;};n.Ba = function(){uj(this);tf.prototype.Ba.call(this);1 == this.A && (this.A = 0);};n.Qb = function(){tf.prototype.Qb.call(this);};function uj(a){if(a.b){var b=a.$ + a.l.$e();rj(a,a.Lf(b));a.b = null;a.h = null;a.j = null;a.D = !1;a.$ = 0;}}n.Lf = function(a){var b=this.H;this.D && (b = b?"xxx-bogus-xxx":"footnote");return new Th(this.bb,a,this.h,b,this.j);};n.Db = function(a,b,c){oh(this.C,a,b,c,this);};n.Yc = function(a,b){uf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};n.Ud = function(a,b){uf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};n.Eb = function(a,b,c){"display" != a || b !== rd && b !== qd || (this.Eb("flow-options",new tc([Yc,yd]),c),this.Eb("flow-into",b,c),b = Oc);Ud("SIMPLE_PROPERTY").forEach(function(d){d = d({name:a,value:b,important:c});a = d.name;b = d.value;c = d.important;});var d=c?of(this):pf(this);Hh(this.bb,a,this.ga?new Dh(b,d,this.ga):new V(b,d));};n.jd = function(a){switch(a){case "not":a = new vj(this),a.Fb(),rf(this.ma,a);}};function vj(a){qj.call(this,a.f,a.ma,a.ga,a,a.H,a.C,!1);this.parent = a;this.g = a.b;}t(vj,qj);n = vj.prototype;n.jd = function(a){"not" == a && vf(this,"E_CSS_UNEXPECTED_NOT");};n.Ba = function(){vf(this,"E_CSS_UNEXPECTED_RULE_BODY");};n.Ic = function(){vf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR");};n.Bd = function(){this.b && 0 < this.b.length && this.g.push(new ui(this.b));this.parent.$ += this.$;var a=this.ma;a.b = a.g.pop();};n.error = function(a,b){qj.prototype.error.call(this,a,b);var c=this.ma;c.b = c.g.pop();};function wj(a,b){sf.call(this,a,b,!1);}t(wj,tf);wj.prototype.Db = function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED " + a,this.Xc());else {var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new gc(this.f,100,c),c=b.ua(this.f,c);this.f.values[a] = c;}};function xj(a,b,c,d,e){sf.call(this,a,b,!1);this.bb = d;this.ga = c;this.b = e;}t(xj,tf);xj.prototype.Db = function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):oh(this.b,a,b,c,this);};xj.prototype.Yc = function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a + ":",b.toString());};xj.prototype.Ud = function(a,b){v.b("E_INVALID_PROPERTY",a + ":",b.toString());};xj.prototype.Eb = function(a,b,c){c = c?of(this):pf(this);c += this.order;this.order += Xi;Hh(this.bb,a,this.ga?new Dh(b,c,this.ga):new V(b,c));};function yj(a,b){Sf.call(this,a);this.bb = {};this.b = b;this.order = 0;}t(yj,Sf);yj.prototype.Db = function(a,b,c){oh(this.b,a,b,c,this);};yj.prototype.Yc = function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a + ":",b.toString());};yj.prototype.Ud = function(a,b){v.b("E_INVALID_PROPERTY",a + ":",b.toString());};yj.prototype.Eb = function(a,b,c){c = (c?67108864:50331648) + this.order;this.order += Xi;Hh(this.bb,a,new V(b,c));};function zj(a,b,c){return (a = a["writing-mode"]) && (b = a.evaluate(b,"writing-mode")) && b !== fd?b === Id:c;}function Aj(a,b,c,d){var e={},f;for(f in a) Gh(f) && (e[f] = a[f]);Bj(e,b,a);Cj(a,c,d,function(a,c){Dj(e,c,b);Bj(e,b,c);});return e;}function Cj(a,b,c,d){a = a._regions;if((b || c) && a)for(c && (c = ["footnote"],b = b?b.concat(c):c),c = 0;c < b.length;c++) {var e=b[c],f=a[e];f && d(e,f);}}function Dj(a,b,c){for(var d in b) Gh(d) && (a[d] = Eh(c,a[d],b[d]));}function Ej(a,b,c,d){c = c?Bh:Ch;for(var e in a) if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h && h.Ua > f.Ua)continue;g = wh[g]?g:e;}else g = e;b[g] = d(e,f);}}};var Fj=!1,Gj={Og:"ltr",Pg:"rtl"};ba("vivliostyle.constants.PageProgression",Gj);Gj.LTR = "ltr";Gj.RTL = "rtl";var Hj={$f:"left",ag:"right"};ba("vivliostyle.constants.PageSide",Hj);Hj.LEFT = "left";Hj.RIGHT = "right";var Ij={LOADING:"loading",Ng:"interactive",Kg:"complete"};ba("vivliostyle.constants.ReadyState",Ij);Ij.LOADING = "loading";Ij.INTERACTIVE = "interactive";Ij.COMPLETE = "complete";function Jj(a,b,c){this.A = a;this.url = b;this.b = c;this.lang = null;this.h = -1;this.root = c.documentElement;b = a = null;if("http://www.w3.org/1999/xhtml" == this.root.namespaceURI){for(var d=this.root.firstChild;d;d = d.nextSibling) if(1 == d.nodeType && (c = d,"http://www.w3.org/1999/xhtml" == c.namespaceURI))switch(c.localName){case "head":b = c;break;case "body":a = c;}this.lang = this.root.getAttribute("lang");}else if("http://www.gribuser.ru/xml/fictionbook/2.0" == this.root.namespaceURI){b = this.root;for(d = this.root.firstChild;d;d = d.nextSibling) 1 == d.nodeType && (c = d,"http://www.gribuser.ru/xml/fictionbook/2.0" == c.namespaceURI && "body" == c.localName && (a = c));c = Kj(Kj(Kj(Kj(new Lj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0 < c.length && (this.lang = c[0]);}else if("http://example.com/sse" == this.root.namespaceURI)for(c = this.root.firstElementChild;c;c = c.nextElementSibling) d = c.localName,"meta" === d?b = c:"body" === d && (a = c);this.body = a;this.l = b;this.g = this.root;this.j = 1;this.g.setAttribute("data-adapt-eloff","0");}function Mj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d != b;) {var e=d.firstChild;if(!e)for(;!(e = d.nextSibling);) if((d = d.parentNode,!d))throw Error("Internal error");d = e;1 == e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c += e.textContent.length;}a.j = c;a.g = b;return c - 1;}function Nj(a,b,c,d){var e=0;if(1 == b.nodeType){if(!d)return Mj(a,b);}else {e = c;c = b.previousSibling;if(!c)return b = b.parentNode,e += 1,Mj(a,b) + e;b = c;}for(;;) {for(;b.lastChild;) b = b.lastChild;if(1 == b.nodeType)break;e += b.textContent.length;c = b.previousSibling;if(!c){b = b.parentNode;break;}b = c;}e += 1;return Mj(a,b) + e;}function Oj(a){0 > a.h && (a.h = Nj(a,a.root,0,!0));return a.h;}function Pj(a,b){for(var c,d=a.root;;) {c = Mj(a,d);if(c >= b)return d;var e=d.children;if(!e)break;var f=Ma(e.length,function(c){return Mj(a,e[c]) > b;});if(!f)break;if(f < e.length && Mj(a,e[f]) <= b)throw Error("Consistency check failed!");d = e[f - 1];}c += 1;for(var f=d,g=f.firstChild || f.nextSibling,h=null;;) {if(g){if(1 == g.nodeType)break;h = f = g;c += g.textContent.length;if(c > b)break;}else if((f = f.parentNode,!f))break;g = f.nextSibling;}return h || d;}function Qj(a,b){var c=b.getAttribute("id");c && !a.f[c] && (a.f[c] = b);(c = b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id")) && !a.f[c] && (a.f[c] = b);for(c = b.firstElementChild;c;c = c.nextElementSibling) Qj(a,c);}function Rj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c || c[1] && c[1] != a.url)return null;var c=c[2],d=a.b.getElementById(c);!d && a.b.getElementsByName && (d = a.b.getElementsByName(c)[0]);d || (a.f || (a.f = {},Qj(a,a.b.documentElement)),d = a.f[c]);return d;}var Sj={Sg:"text/html",Tg:"text/xml",Fg:"application/xml",Eg:"application/xhtml_xml",Mg:"image/svg+xml"};function Tj(a,b,c){c = c || new DOMParser();var d;try{d = c.parseFromString(a,b);}catch(e) {}if(d){a = d.documentElement;if("parsererror" === a.localName)return null;for(a = a.firstChild;a;a = a.nextSibling) if("parsererror" === a.localName)return null;}else return null;return d;}function Uj(a){var b=a.contentType;if(b){for(var c=Object.keys(Sj),d=0;d < c.length;d++) if(Sj[c[d]] === b)return b;if(b.match(/\+xml$/))return "application/xml";}if(a = a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return "text/html";case "xhtml":case "xht":return "application/xhtml_xml";case "svg":case "svgz":return "image/svg+xml";case "opf":case "xml":return "application/xml";}return null;}function Vj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser(),e=a.responseText;if(e){var f=Uj(a);(c = Tj(e,f || "application/xml",d)) && !f && (f = c.documentElement,"html" !== f.localName.toLowerCase() || f.namespaceURI?"svg" === f.localName.toLowerCase() && "image/svg+xml" !== c.contentType && (c = Tj(e,"image/svg+xml",d)):c = Tj(e,"text/html",d));c || (c = Tj(e,"text/html",d));}}c = c?new Jj(b,a.url,c):null;return L(c);}function Wj(a){this.Fc = a;}function Xj(){var a=Yj;return new Wj(function(b){return a.Fc(b) && 1 == b.nodeType && "http://www.idpf.org/2008/embedding" == b.getAttribute("Algorithm");});}function Zj(){var a=Xj(),b=Yj;return new Wj(function(c){if(!b.Fc(c))return !1;c = new Lj([c]);c = Kj(c,"EncryptionMethod");a && (c = ak(c,a));return 0 < c.b.length;});}var Yj=new Wj(function(){return !0;});function Lj(a){this.b = a;}function ak(a,b){for(var c=[],d=0;d < a.b.length;d++) {var e=a.b[d];b.Fc(e) && c.push(e);}return new Lj(c);}function bk(a,b){function c(a){d.push(a);}for(var d=[],e=0;e < a.b.length;e++) b(a.b[e],c);return new Lj(d);}Lj.prototype.forEach = function(a){for(var b=[],c=0;c < this.b.length;c++) b.push(a(this.b[c]));return b;};function ck(a,b){for(var c=[],d=0;d < a.b.length;d++) {var e=b(a.b[d]);null != e && c.push(e);}return c;}function Kj(a,b){return bk(a,function(a,d){for(var c=a.firstChild;c;c = c.nextSibling) c.localName == b && d(c);});}function dk(a){return bk(a,function(a,c){for(var b=a.firstChild;b;b = b.nextSibling) 1 == b.nodeType && c(b);});}function ek(a,b){return ck(a,function(a){return 1 == a.nodeType?a.getAttribute(b):null;});}Lj.prototype.textContent = function(){return this.forEach(function(a){return a.textContent;});};var fk={transform:!0,"transform-origin":!0},gk={top:!0,bottom:!0,left:!0,right:!0};function hk(a,b,c){this.target = a;this.name = b;this.value = c;}var ik={show:function show(a){a.style.visibility = "visible";},hide:function hide(a){a.style.visibility = "hidden";},play:function play(a){a.currentTime = 0;a.play();},pause:function pause(a){a.pause();},resume:function resume(a){a.play();},mute:function mute(a){a.muted = !0;},unmute:function unmute(a){a.muted = !1;}};function jk(a,b){var c=ik[b];return c?function(){for(var b=0;b < a.length;b++) try{c(a[b]);}catch(e) {}}:null;}function kk(a,b){this.h = {};this.M = a;this.g = b;this.O = null;this.A = [];var c=this;this.J = function(a){var b=a.currentTarget,d=b.getAttribute("href") || b.getAttributeNS("http://www.w3.org/1999/xlink","href");d && Ua(c,{type:"hyperlink",target:null,currentTarget:null,Xg:b,href:d,preventDefault:function preventDefault(){a.preventDefault();}});};this.b = {};this.f = {width:0,height:0};this.C = this.H = !1;this.D = this.G = !0;this.T = 0;this.position = null;this.offset = -1;this.l = null;this.j = [];this.I = {top:{},bottom:{},left:{},right:{}};}t(kk,Ta);function lk(a,b){(a.G = b)?a.M.setAttribute("data-vivliostyle-auto-page-width",!0):a.M.removeAttribute("data-vivliostyle-auto-page-width");}function mk(a,b){(a.D = b)?a.M.setAttribute("data-vivliostyle-auto-page-height",!0):a.M.removeAttribute("data-vivliostyle-auto-page-height");}function nk(a,b,c){var d=a.b[c];d?d.push(b):a.b[c] = [b];}function ok(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c < b.length;) this.M.contains(b[c])?c++:b.splice(c,1);b.length || delete this.b[a];},a);for(var d=a.A,e=0;e < d.length;e++) {var f=d[e];w(f.target,f.name,f.value.toString());}e = pk(c,a.M);a.f.width = e.width;a.f.height = e.height;for(e = 0;e < b.length;e++) if((c = b[e],f = a.b[c.ed],d = a.b[c.rg],f && d && (f = jk(f,c.action))))for(var g=0;g < d.length;g++) d[g].addEventListener(c.event,f,!1);}kk.prototype.zoom = function(a){w(this.M,"transform","scale(" + a + ")");};function qk(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null;}}function rk(a,b){if(1 == a.nodeType)return !1;var c=a.textContent;switch(b){case 0:return !!c.match(/^\s*$/);case 1:return !!c.match(/^[ \t\f]*$/);case 2:return !c.length;}throw Error("Unexpected whitespace: " + b);}function sk(a){this.f = a;this.b = [];this.F = null;}function tk(a,b,c,d,e,f,g,h,l){this.b = a;this.element = b;this.f = c;this.Ua = d;this.l = e;this.h = f;this.vg = g;this.j = h;this.kb = -1;this.g = l;}function uk(a,b){return a.h?!b.h || a.Ua > b.Ua?!0:a.j:!1;}function vk(a,b){return a.top - b.top;}function wk(a,b){return b.right - a.right;}function xk(_x,_x2){var _left;var _again=true;_function: while(_again) {var a=_x,b=_x2;_again = false;if(a === b){return !0;}else {if(a && b){if(!(_left = a.node === b.node && a.Za === b.Za && yk(a.ra,b.ra) && yk(a.Aa,b.Aa))){return _left;}_x = a.xa;_x2 = b.xa;_again = true;continue _function;}else {return !1;}}}}function zk(a,b){if(a === b)return !0;if(!a || !b || a.la !== b.la || a.K !== b.K || a.na.length !== b.na.length)return !1;for(var c=0;c < a.na.length;c++) if(!xk(a.na[c],b.na[c]))return !1;return !0;}function Ak(a){return {na:[{node:a.N,Za:Bk,ra:a.ra,Aa:null,xa:null,Ma:0}],la:0,K:!1,Ia:a.Ia};}function Ck(a,b){var c=new Dk(a.node,b,0);c.Za = a.Za;c.ra = a.ra;c.Aa = a.Aa;c.xa = a.xa?Ck(a.xa,Ek(b)):null;c.F = a.F;c.Ma = a.Ma + 1;return c;}var Bk=0;function Fk(a,b,c,d,e,f,g){this.ma = a;this.bd = d;this.gf = null;this.root = b;this.ba = c;this.type = f;e && (e.gf = this);this.b = g;}function yk(_x3,_x4){var _left2;var _again2=true;_function2: while(_again2) {var a=_x3,b=_x4;_again2 = false;if(_left2 = a === b){return _left2;}if(!(_left2 = !!a && !!b)){return _left2;}if(b){if(!(_left2 = a.ma === b.ma && a.ba === b.ba && a.type === b.type)){return _left2;}_x3 = a.bd;_x4 = b.bd;_again2 = true;continue _function2;}else {return !1;}}}function Gk(a,b){this.sg = a;this.count = b;}function Dk(a,b,c){this.N = a;this.parent = b;this.Ca = c;this.la = 0;this.K = !1;this.Za = Bk;this.ra = b?b.ra:null;this.xa = this.Aa = null;this.oa = !1;this.ta = !0;this.b = !1;this.j = b?b.j:0;this.display = null;this.W = Hk;this.X = this.kc = this.h = this.va = null;this.R = "baseline";this.Z = "top";this.$d = this.ia = 0;this.H = !1;this.dc = b?b.dc:0;this.D = b?b.D:null;this.A = b?b.A:!1;this.J = this.Wc = !1;this.C = this.B = this.G = this.g = null;this.Cb = b?b.Cb:{};this.u = b?b.u:!1;this.sa = b?b.sa:"ltr";this.f = b?b.f:null;this.Ia = this.lang = null;this.F = b?b.F:null;this.l = null;this.ja = {};this.Ma = 1;this.O = this.I = null;}function Ik(a){a.ta = !0;a.j = a.parent?a.parent.j:0;a.B = null;a.C = null;a.la = 0;a.K = !1;a.display = null;a.W = Hk;a.va = null;a.h = null;a.kc = null;a.X = null;a.R = "baseline";a.H = !1;a.dc = a.parent?a.parent.dc:0;a.D = a.parent?a.parent.D:null;a.A = a.parent?a.parent.A:!1;a.g = null;a.G = null;a.Aa = null;a.Wc = !1;a.J = !1;a.u = a.parent?a.parent.u:!1;a.Aa = null;a.Ia = null;a.F = a.parent?a.parent.F:null;a.l = null;a.ja = {};a.Ma = 1;a.I = null;a.O = null;}function Jk(a){var b=new Dk(a.N,a.parent,a.Ca);b.la = a.la;b.K = a.K;b.Aa = a.Aa;b.Za = a.Za;b.ra = a.ra;b.xa = a.xa;b.ta = a.ta;b.j = a.j;b.display = a.display;b.W = a.W;b.va = a.va;b.h = a.h;b.kc = a.kc;b.X = a.X;b.R = a.R;b.Z = a.Z;b.ia = a.ia;b.$d = a.$d;b.Wc = a.Wc;b.J = a.J;b.H = a.H;b.dc = a.dc;b.D = a.D;b.A = a.A;b.g = a.g;b.G = a.G;b.B = a.B;b.C = a.C;b.f = a.f;b.u = a.u;b.b = a.b;b.Ia = a.Ia;b.F = a.F;b.l = a.l;b.ja = Object.create(a.ja);b.Ma = a.Ma;b.I = a.I;b.O = a.O;return b;}Dk.prototype.modify = function(){return this.oa?Jk(this):this;};function Ek(a){var b=a;do {if(b.oa)break;b.oa = !0;b = b.parent;}while(b);return a;}Dk.prototype.clone = function(){for(var a=Jk(this),b=a,c;c = b.parent;) c = Jk(c),b = b.parent = c;return a;};function Kk(a){return {node:a.N,Za:a.Za,ra:a.ra,Aa:a.Aa,xa:a.xa?Kk(a.xa):null,F:a.F,Ma:a.Ma};}function Lk(a){var b=a,c=[];do b.f && b.parent && b.parent.f !== b.f || c.push(Kk(b)),b = b.parent;while(b);b = a.Ia?Mk(a.Ia,a.la,-1):a.la;return {na:c,la:b,K:a.K,Ia:a.Ia};}function Nk(a){for(a = a.parent;a;) {if(a.Wc)return !0;a = a.parent;}return !1;}function Ok(a,b){for(var c=a;c;) c.ta || b(c),c = c.parent;}function Pk(a,b){return a.F === b && !!a.parent && a.parent.F === b;}function Qk(a){this.f = a;this.b = null;}Qk.prototype.clone = function(){var a=new Qk(this.f);if(this.b){a.b = [];for(var b=0;b < this.b.length;++b) a.b[b] = this.b[b];}return a;};function Rk(a,b){if(!b)return !1;if(a === b)return !0;if(!zk(a.f,b.f))return !1;if(a.b){if(!b.b || a.b.length !== b.b.length)return !1;for(var c=0;c < a.b.length;c++) if(!zk(a.b[c],b.b[c]))return !1;}else if(b.b)return !1;return !0;}function Sk(a,b){this.f = a;this.b = b;}Sk.prototype.clone = function(){return new Sk(this.f.clone(),this.b);};function Tk(){this.b = [];this.g = "any";this.f = null;}Tk.prototype.clone = function(){for(var a=new Tk(),b=this.b,c=a.b,d=0;d < b.length;d++) c[d] = b[d].clone();a.g = this.g;a.f = this.f;return a;};function Uk(a,b){if(a === b)return !0;if(!b || a.b.length !== b.b.length)return !1;for(var c=0;c < a.b.length;c++) {var d=a.b[c],e=b.b[c];if(!e || d !== e && !Rk(d.f,e.f))return !1;}return !0;}function Vk(){this.page = 0;this.f = {};this.b = {};this.g = 0;}Vk.prototype.clone = function(){var a=new Vk();a.page = this.page;a.h = this.h;a.g = this.g;a.j = this.j;a.f = this.f;for(var b in this.b) a.b[b] = this.b[b].clone();return a;};function Wk(a,b){if(a === b)return !0;if(!b || a.page !== b.page || a.g !== b.g)return !1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length !== d.length)return !1;for(d = 0;d < c.length;d++) {var e=c[d];if(!Uk(a.b[e],b.b[e]))return !1;}return !0;}function Xk(a){this.element = a;this.G = this.D = this.height = this.width = this.O = this.I = this.R = this.H = this.Fa = this.Z = this.Ja = this.X = this.marginBottom = this.marginTop = this.marginRight = this.marginLeft = this.top = this.left = 0;this.xb = this.$a = null;this.ib = this.zd = this.Kb = this.Ad = this.g = 0;this.u = !1;}function Yk(a){return a.marginTop + a.Z + a.I;}function Zk(a){return a.marginBottom + a.Fa + a.O;}function $k(a){return a.marginLeft + a.X + a.H;}function al(a){return a.marginRight + a.Ja + a.R;}function bl(a){return a.u?-1:1;}function cl(a,b){a.element = b.element;a.left = b.left;a.top = b.top;a.marginLeft = b.marginLeft;a.marginRight = b.marginRight;a.marginTop = b.marginTop;a.marginBottom = b.marginBottom;a.X = b.X;a.Ja = b.Ja;a.Z = b.Z;a.Fa = b.Fa;a.H = b.H;a.R = b.R;a.I = b.I;a.O = b.O;a.width = b.width;a.height = b.height;a.D = b.D;a.G = b.G;a.xb = b.xb;a.$a = b.$a;a.g = b.g;a.Ad = b.Ad;a.Kb = b.Kb;a.u = b.u;}function dl(a,b,c){a.top = b;a.height = c;w(a.element,"top",b + "px");w(a.element,"height",c + "px");}function el(a,b,c){a.left = b;a.width = c;w(a.element,"left",b + "px");w(a.element,"width",c + "px");}function fl(a,b,c){a.u?el(a,b + c * bl(a),c):dl(a,b,c);}function gl(a,b,c){a.u?dl(a,b,c):el(a,b,c);}function hl(a){a = a.element;for(var b;b = a.lastChild;) a.removeChild(b);}function il(a){var b=a.D + a.left + a.marginLeft + a.X,c=a.G + a.top + a.marginTop + a.Z;return new $f(b,c,b + (a.H + a.width + a.R),c + (a.I + a.height + a.O));}function jl(a,b,c){a = kl(a);return Bg(b,a.V,a.S,a.U - a.V,a.P - a.S,c);}function kl(a){var b=a.D + a.left,c=a.G + a.top;return new $f(b,c,b + ($k(a) + a.width + al(a)),c + (Yk(a) + a.height + Zk(a)));}function ll(a,b,c,d){this.b = a;this.f = b;this.h = c;this.g = d;}t(ll,rc);ll.prototype.od = function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Nc));return null;};ll.prototype.Sc = function(a){if(this.h.url)this.b.setAttribute("src",a.url);else {var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);}return null;};ll.prototype.Gb = function(a){this.bc(a.values);return null;};ll.prototype.Oc = function(a){var b=a.ua();a = b.evaluate(this.f);"string" === typeof a && ((b = this.g(b,a,this.b.ownerDocument)) || (b = this.b.ownerDocument.createTextNode(a)),this.b.appendChild(b));return null;};function ml(a){return !!a && a !== pd && a !== F && a !== fd;};function nl(a,b,c){this.g = a;this.f = b;this.b = c;}function ol(){this.map = [];}function pl(a){return a.map.length?a.map[a.map.length - 1].b:0;}function ql(a,b){if(a.map.length){var c=a.map[a.map.length - 1],d=c.b + b - c.f;c.f == c.g?(c.f = b,c.g = b,c.b = d):a.map.push(new nl(b,b,d));}else a.map.push(new nl(b,b,b));}function rl(a,b){a.map.length?a.map[a.map.length - 1].f = b:a.map.push(new nl(b,0,0));}function sl(a,b){var c=Ma(a.map.length,function(c){return b <= a.map[c].f;}),c=a.map[c];return c.b - Math.max(0,c.g - b);}function tl(a,b){var c=Ma(a.map.length,function(c){return b <= a.map[c].b;}),c=a.map[c];return c.g - (c.b - b);}function ul(a,b,c,d,e,f,g,h){this.D = a;this.style = b;this.offset = c;this.G = d;this.j = e;this.b = e.b;this.Wa = f;this.cb = g;this.H = h;this.l = this.A = null;this.C = {};this.g = this.f = this.h = null;vl(this) && (b = b._pseudos) && b.before && (a = new ul(a,b.before,c,!1,e,wl(this),g,!0),c = xl(a,"content"),ml(c) && (this.h = a,this.g = a.g));this.g = yl(zl(this,"before"),this.g);this.cb && Al[this.g] && (e.g = yl(e.g,this.g));}function xl(a,b,c){if(!(b in a.C)){var d=a.style[b];a.C[b] = d?d.evaluate(a.D,b):c || null;}return a.C[b];}function Bl(a){return xl(a,"display",gd);}function wl(a){if(null === a.A){var b=Bl(a),c=xl(a,"position"),d=xl(a,"float");a.A = Cl(b,c,d,a.G).display === Oc;}return a.A;}function vl(a){null === a.l && (a.l = a.H && Bl(a) !== F);return a.l;}function zl(a,b){var c=null;if(wl(a)){var d=xl(a,"break-" + b);d && (c = d.toString());}return c;}function Dl(a){this.g = a;this.b = [];this.cb = this.Wa = !0;this.f = [];}function El(a){return a.b[a.b.length - 1];}function Fl(a){return a.b.every(function(a){return Bl(a) !== F;});}Dl.prototype.push = function(a,b,c,d){var e=El(this);d && e && d.b !== e.b && this.f.push({Wa:this.Wa,cb:this.cb});e = d || e.j;d = this.cb || !!d;var f=Fl(this);a = new ul(this.g,a,b,c,e,d || this.Wa,d,f);this.b.push(a);this.Wa = vl(a)?!a.h && wl(a):this.Wa;this.cb = vl(a)?!a.h && d:this.cb;return a;};Dl.prototype.pop = function(a){var b=this.b.pop(),c=this.Wa,d=this.cb;if(vl(b)){var e=b.style._pseudos;e && e.after && (a = new ul(b.D,e.after,a,!1,b.j,c,d,!0),c = xl(a,"content"),ml(c) && (b.f = a));}this.cb && b.f && (a = zl(b.f,"before"),b.j.g = yl(b.j.g,a));if(a = El(this))a.b === b.b?vl(b) && (this.Wa = this.cb = !1):(a = this.f.pop(),this.Wa = a.Wa,this.cb = a.cb);return b;};function Gl(a,b){if(!b.Wa)return b.offset;var c=a.b.length - 1,d=a.b[c];d === b && (c--,d = a.b[c]);for(;0 <= c;) {if(d.b !== b.b)return b.offset;if(!d.Wa || d.G)return d.offset;b = d;d = a.b[--c];}throw Error("No block start offset found!");}function Hl(a,b,c,d,e,f,g,h){this.ba = a;this.root = a.root;this.$a = c;this.h = d;this.C = f;this.f = this.root;this.R = {};this.X = {};this.G = {};this.I = [];this.D = this.O = this.J = null;this.Ja = g;this.Z = new $i(b,d,g,h);this.g = new ol();this.A = !0;this.ja = [];this.Ka = e;this.Fa = this.sa = !1;this.b = a = Mj(a,this.root);this.ia = {};this.j = new Dl(d);ql(this.g,a);d = Il(this,this.root);lj(this.Z,this.root,d,a);Jl(this,d,!1);this.H = !0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H = !1;}this.ja.push(!0);this.X = {};this.X["e" + a] = d;this.b++;Kl(this,-1);}function Ll(a,b,c,d){return (b = b[d]) && b.evaluate(a.h) !== c[d];}function Ml(a,b,c){for(var d in c) {var e=b[d];e?(a.R[d] = e,delete b[d]):(e = c[d]) && (a.R[d] = new V(e,33554432));}}var Nl=["column-count","column-width","column-fill"];function Jl(a,b,c){c || ["writing-mode","direction"].forEach(function(a){b[a] && (this.R[a] = b[a]);},a);if(!a.sa){var d=Ll(a,b,a.C.j,"background-color")?b["background-color"].evaluate(a.h):null,e=Ll(a,b,a.C.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d && d !== fd || e && e !== fd)Ml(a,b,a.C.j),a.sa = !0;}if(!a.Fa)for(d = 0;d < Nl.length;d++) if(Ll(a,b,a.C.A,Nl[d])){Ml(a,b,a.C.A);a.Fa = !0;break;}if(!c && (c = b["font-size"])){d = c.evaluate(a.h);c = d.L;switch(d.ha){case "em":case "rem":c *= a.h.A;break;case "ex":c *= a.h.A * Ab.ex / Ab.em;break;case "%":c *= a.h.A / 100;break;default:(d = Ab[d.ha]) && (c *= d);}a.h.oa = c;}}function Ol(a){for(var b=0;!a.H && (b += 5E3,Pl(a,b,0) != Number.POSITIVE_INFINITY););return a.R;}function Il(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ba.url,e=new yj(a.$a,a.C),c=new cf(c,e);try{Rf(new If(xf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1);}catch(f) {v.b(f,"Style attribute parse error:");}return e.bb;}}return {};}function Kl(a,b){if(!(b >= a.b)){var c=a.h,d=Mj(a.ba,a.root);if(b < d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=Ql(a,f,e,a.root,d);!a.j.b.length && a.j.push(e,d,!0,f);}d = Pj(a.ba,b);e = Nj(a.ba,d,0,!1);if(!(e >= a.b))for(;;) {if(1 != d.nodeType)e += d.textContent.length;else {var g=d;if(e != Mj(a.ba,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f = h["flow-into"])f = f.evaluate(c,"flow-into").toString(),Ql(a,f,h,g,e);e++;}if(e >= a.b)break;f = d.firstChild;if(!f)for(;!(f = d.nextSibling);) if((d = d.parentNode,d === a.root))return;d = f;}}}function Rl(a,b){a.J = b;for(var c=0;c < a.I.length;c++) Sl(a.J,a.I[c],a.G[a.I[c].b]);}function Ql(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a: {if(h = m.evaluate(a.h,"flow-options")){l = new xg();try{h.ca(l);p = l.b;break a;}catch(q) {v.b(q,"toSet:");}}p = {};}h = !!p.exclusive;l = !!p["static"];k = !!p.last;}(p = c["flow-linger"]) && (g = zg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c = c["flow-priority"]) && (f = zg(c.evaluate(a.h,"flow-priority"),0));c = a.ia[e] || null;p = a.G[b];p || (p = El(a.j),p = a.G[b] = new sk(p?p.j.b:null));d = new tk(b,d,e,f,g,h,l,k,c);a.I.push(d);a.O == b && (a.O = null);a.J && Sl(a.J,d,p);return d;}function Tl(a,b,c,d){Al[b] && (d = a.G[d].b,(!d.length || d[d.length - 1] < c) && d.push(c));a.ia[c] = yl(a.ia[c],b);}function Pl(a,b,c){var d=-1;if(b <= a.b && (d = sl(a.g,b),d += c,d < pl(a.g)))return tl(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;) {var f=a.f.firstChild;if(!f)for(;;) {if(1 == a.f.nodeType){var f=a.Z,g=a.f;if(f.yb.pop() !== g)throw Error("Invalid call to popElement");f.fc.pop();f.oa.pop();f.Kb.pop();f.ec.pop();f.pop();jj(f);a.A = a.ja.pop();g = a.j.pop(a.b);f = null;g.f && (f = zl(g.f,"before"),Tl(a,f,g.f.Wa?Gl(a.j,g):g.f.offset,g.b),f = zl(g.f,"after"));f = yl(f,zl(g,"after"));Tl(a,f,a.b,g.b);}if(f = a.f.nextSibling)break;a.f = a.f.parentNode;if(a.f === a.root)return a.f = null,b < a.b && (0 > d && (d = sl(a.g,b),d += c),d <= pl(a.g))?tl(a.g,d):Number.POSITIVE_INFINITY;}a.f = f;if(1 != a.f.nodeType){a.b += a.f.textContent.length;var f=a.j,g=a.f,h=El(f);(f.Wa || f.cb) && vl(h) && (h = xl(h,"white-space",pd).toString(),rk(g,qk(h)) || (f.Wa = !1,f.cb = !1));a.A?ql(a.g,a.b):rl(a.g,a.b);}else {g = a.f;f = Il(a,g);a.ja.push(a.A);lj(a.Z,g,f,a.b);(h = g.getAttribute("id") || g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id")) && h === a.D && (a.D = null);a.H || "body" != g.localName || g.parentNode != a.root || (Jl(a,f,!0),a.H = !0);if(h = f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=Ql(a,h,f,g,a.b);a.A = !!a.Ka[h];g = a.j.push(f,a.b,g === a.root,l);}else g = a.j.push(f,a.b,g === a.root);h = Gl(a.j,g);Tl(a,g.g,h,g.b);g.h && (l = zl(g.h,"after"),Tl(a,l,g.h.Wa?h:g.offset,g.b));a.A && Bl(g) === F && (a.A = !1);if(Mj(a.ba,a.f) != a.b)throw Error("Inconsistent offset");a.X["e" + a.b] = f;a.b++;a.A?ql(a.g,a.b):rl(a.g,a.b);if(b < a.b && (0 > d && (d = sl(a.g,b),d += c),d <= pl(a.g)))return tl(a.g,d);}}}Hl.prototype.l = function(a,b){var c=Mj(this.ba,a),d="e" + c;b && (c = Nj(this.ba,a,0,!0));this.b <= c && Pl(this,c,0);return this.X[d];};Hl.prototype.oa = function(){};var Ul={"font-style":pd,"font-variant":pd,"font-weight":pd},Vl="OTTO" + new Date().valueOf(),Wl=1;function Xl(a,b){var c={},d;for(d in a) c[d] = a[d].evaluate(b,d);for(var e in Ul) c[e] || (c[e] = Ul[e]);return c;}function Yl(a){a = this.rc = a;var b=new Ea(),c;for(c in Ul) b.append(" "),b.append(a[c].toString());this.f = b.toString();this.src = this.rc.src?this.rc.src.toString():null;this.g = [];this.h = [];this.b = (c = this.rc["font-family"])?c.stringValue():null;}function Zl(a,b,c){var d=new Ea();d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in Ul) d.append(e),d.append(": "),a.rc[e].Ta(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b = (window.URL || window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString();}function $l(a){this.f = a;this.b = {};}function am(a,b){if(b instanceof uc){for(var c=b.values,d=[],e=0;e < c.length;e++) {var f=c[e],g=a.b[f.stringValue()];g && d.push(C(g));d.push(f);}return new uc(d);}return (c = a.b[b.stringValue()])?new uc([C(c),b]):b;}function bm(a,b){this.b = a;this.body = b;this.f = {};this.g = 0;}function cm(a,b,c){b = b.b;var d=c.b[b];if(d)return d;d = "Fnt_" + ++a.g;return c.b[b] = d;}function dm(a,b,c,d){var e=J("initFont"),f=b.src,g={},h;for(h in Ul) g[h] = b.rc[h];d = cm(a,b,d);g["font-family"] = C(d);var l=new Yl(g),k=a.body.ownerDocument.createElement("span");k.textContent = "M";var m=new Date().valueOf() + 1E3;b = a.b.ownerDocument.createElement("style");h = Vl + Wl++;b.textContent = Zl(l,"",gf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility = "hidden";k.style.fontFamily = d;for(var p in Ul) w(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right - g.left,r=g.bottom - g.top;b.textContent = Zl(l,f,c);v.g("Starting to load font:",f);var z=!1;qe(function(){var a=k.getBoundingClientRect(),b=a.bottom - a.top;return q != a.right - a.left || r != b?(z = !0,L(!1)):new Date().valueOf() > m?L(!1):pe(10);}).then(function(){z?v.g("Loaded font:",f):v.b("Failed to load font:",f);a.body.removeChild(k);M(e,l);});return e.result();}function em(a,b,c){var d=b.src,e=a.f[d];e?ue(e,function(a){if(a.f == b.f){var e=b.b,f=c.b[e];a = a.b;if(f){if(f != a)throw Error("E_FONT_FAMILY_INCONSISTENT " + b.b);}else c.b[e] = a;v.b("Found already-loaded font:",d);}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src);}):(e = new te(function(){var e=J("loadFont"),g=c.f?c.f(d):null;g?ff(d,"blob").then(function(d){d.Ld?g(d.Ld).then(function(d){dm(a,b,d,c).Ea(e);}):M(e,null);}):dm(a,b,null,c).Ea(e);return e.result();},"loadFont " + d),a.f[d] = e,e.start());return e;}function fm(a,b,c){for(var d=[],e=0;e < b.length;e++) {var f=b[e];f.src && f.b?d.push(em(a,f,c)):v.b("E_FONT_FACE_INVALID");}return ve(d);};Td("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return {name:b.replace(/^page-/,""),value:c === Kc?sd:c,important:a.important};default:return a;}});var Al={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},gm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};function yl(a,b){if(a)if(b){var c=!!Al[a],d=!!Al[b];if(c && d)switch(b){case "column":return a;case "region":return "column" === a?b:a;default:return b;}else return d?b:c?a:gm[b]?b:gm[a]?a:b;}else return a;else return b;}function hm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return "any";}};function im(){}n = im.prototype;n.Ff = function(a){return {w:a,ud:!1,Hb:!1};};n.ff = function(){};n.pf = function(){};n.Vf = function(){};n.nf = function(){};n.pd = function(){};n.cc = function(){};function jm(a,b){this.b = a;this.f = b;}function km(a,b){var c=a.b,d=c.Ff(b),e=J("LayoutIterator");re((function(a){for(var b;d.w;) {b = d.w.B?1 !== d.w.B.nodeType?rk(d.w.B,d.w.dc)?void 0:d.w.K?c.pf(d):c.ff(d):d.w.ta?d.w.K?c.nf(d):c.Vf(d):d.w.K?c.cc(d):c.pd(d):void 0;b = (b && b.Ra()?b:L(!0)).fa((function(){return d.Hb?L(null):lm(this.f,d.w,d.ud);}).bind(this));if(b.Ra()){b.then(function(b){d.Hb?P(a):(d.w = b,O(a));});return;}if(d.Hb){P(a);return;}d.w = b.get();}P(a);}).bind(a)).then(function(){M(e,d.w);});return e.result();}function mm(a){this.Tb = a;}t(mm,im);n = mm.prototype;n.Wf = function(){};n.zf = function(){};n.Ff = function(a){return {w:a,ud:!!this.Tb && a.K,Hb:!1,Tb:this.Tb,Bc:null,ve:!1,Jf:[],Hc:null};};n.ff = function(a){a.ve = !1;};n.pd = function(a){a.Jf.push(Ek(a.w));a.Bc = yl(a.Bc,a.w.g);a.ve = !0;return this.Wf(a);};n.cc = function(a){var b;a.ve?(b = (b = void 0,L(!0)),b = b.fa(function(){a.Hb || (a.Jf = [],a.Tb = !1,a.ud = !1,a.Bc = null);return L(!0);})):b = (b = this.zf(a)) && b.Ra()?b:L(!0);return b.fa(function(){a.Hb || (a.ve = !1,a.Hc = Ek(a.w),a.Bc = yl(a.Bc,a.w.G));return L(!0);});};function nm(a,b,c){this.ef = [];this.b = Object.create(a);this.b.element = b;this.b.j = a.j.clone();this.b.l = !1;this.b.Ye = c.F;this.b.wd = a;a = om(this.b,c);this.b.ja -= a;var d=this;this.b.fc = function(a){return pm.prototype.fc.call(this,a).fa(function(a){d.ef.push(Ek(a));return L(a);});};}function qm(a,b){return rm(a.b,b,!0);}nm.prototype.Rb = function(a){var b=this.b.Rb();if(a){a = Ek(this.ef[0]);var c=new sm(a,null,a.b,0);c.f(this.b,0);if(!b.w)return {pb:c,w:a};}return b;};nm.prototype.Da = function(a,b,c){return this.b.Da(a,b,c);};function tm(){this.H = this.C = null;}function um(a,b,c){a.I(b,c);return vm(a,b,c);}function vm(a,b,c){var d=J("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.l(b,c);var e=a.j(b);e.b(b,c).then((function(a){var f=e.f(a,c);(f = e.g(a,this.h,c,f))?M(d,a):(this.g(this.h),this.f(b,c),vm(this,this.h,c).Ea(d));}).bind(a));return d.result();}tm.prototype.I = function(){};tm.prototype.g = function(a){a = a.B || a.parent.B;for(var b;b = a.lastChild;) a.removeChild(b);for(;b = a.nextSibling;) b.parentNode.removeChild(b);};tm.prototype.l = function(a,b){this.h = Ek(a);this.C = [].concat(b.J);this.O = [].concat(b.A);a.F && (this.H = a.F.Le());};tm.prototype.f = function(a,b){b.J = this.C;b.A = this.O;a.F && a.F.Ke(this.H);};function wm(a,b,c,d){d = d[b];if(!d)throw Error("unknown writing-mode: " + b);b = d[c || "ltr"];if(!b)throw Error("unknown direction: " + c);for(c = 0;c < b.length;c++) if((d = b[c],d = a.replace(d.h,d.b),d !== a))return d;return a;}function xm(a){var b=ym,c={};Object.keys(b).forEach(function(d){var e=c[d] = {},f=b[d];Object.keys(f).forEach(function(b){e[b] = f[b].map(function(b){return {h:new RegExp("(-?)" + (a?b.da:b.ea) + "(-?)"),b:"$1" + (a?b.ea:b.da) + "$2"};});});});return c;}var ym={"horizontal-tb":{ltr:[{da:"inline-start",ea:"left"},{da:"inline-end",ea:"right"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}],rtl:[{da:"inline-start",ea:"right"},{da:"inline-end",ea:"left"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}]},"vertical-rl":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"right"},{da:"block-end",ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",ea:"top"},{da:"block-start",ea:"right"},{da:"block-end",ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]},"vertical-lr":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",ea:"top"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]}},zm=xm(!0),Am=xm(!1);var Hk="inline";function Bm(a){switch(a){case "inline":return Hk;case "column":return "column";case "region":return "region";case "page":return "page";default:throw Error("Unknown float-reference: " + a);}}function Cm(a){switch(a){case Hk:return !1;case "column":case "region":case "page":return !0;default:throw Error("Unknown float-reference: " + a);}}function Dm(a,b,c,d,e,f){this.b = a;this.W = b;this.va = c;this.h = d;this.f = e;this.kc = f;this.id = this.order = null;}Dm.prototype.za = function(){if(null === this.order)throw Error("The page float is not yet added");return this.order;};function Em(a){if(!a.id)throw Error("The page float is not yet added");return a.id;}Dm.prototype.Re = function(){return !1;};function Fm(){this.b = [];this.f = 0;}Fm.prototype.$e = function(){return this.f++;};Fm.prototype.Yd = function(a){if(0 <= this.b.findIndex(function(b){return zk(b.b,a.b);}))throw Error("A page float with the same source node is already registered");var b=a.order = this.$e();a.id = "pf" + b;this.b.push(a);};Fm.prototype.Qe = function(a){var b=this.b.findIndex(function(b){return zk(b.b,a);});return 0 <= b?this.b[b]:null;};function Gm(a,b,c,d,e){this.W = a;this.va = b;this.Bb = c;this.zb = d;this.f = e;}function Hm(a,b){return a.Bb.some(function(a){return a.qa === b;});}Gm.prototype.za = function(){var a=this.Bb.map(function(a){return a.qa;});return Math.min.apply(null,a.map(function(a){return a.za();}));};Gm.prototype.b = function(a){return this.za() < a.za();};function Im(a,b){this.qa = a;this.b = b;}function Jm(a,b,c,d,e,f,g){(this.parent = a) && a.g.push(this);this.g = [];this.W = b;this.M = c;this.j = d;this.O = e;this.I = f || a && a.I || ed;this.H = g || a && a.H || od;this.Gc = !1;this.C = a?a.C:new Fm();this.D = [];this.b = [];this.l = [];this.A = {};this.f = [];a: {b = this;for(a = this.parent;a;) {if(b = Km(a,b,this.W,this.j,this.O)){a = b;break a;}b = a;a = a.parent;}a = null;}this.J = a?[].concat(a.f):[];this.G = [];this.h = !1;}function Lm(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for " + b);return a.parent;}function Km(a,b,c,d,e){b = a.g.indexOf(b);0 > b && (b = a.g.length);for(--b;0 <= b;b--) {var f=a.g[b];if(f.W === c && f.j === d && zk(f.O,e) || (f = Km(f,null,c,d,e)))return f;}return null;}function Mm(_x5,_x6){var _again3=true;_function3: while(_again3) {var a=_x5,b=_x6;_again3 = false;if(b && b !== a.W){_x5 = Lm(a,b);_x6 = b;_again3 = true;continue _function3;}else {return a.M;}}}function Nm(a,b){a.M = b;Om(a);}Jm.prototype.Yd = function(a){this.C.Yd(a);};function Pm(_x7,_x8){var _again4=true;_function4: while(_again4) {var a=_x7,b=_x8;_again4 = false;if(b === a.W){return a;}else {_x7 = Lm(a,b);_x8 = b;_again4 = true;continue _function4;}}}Jm.prototype.Qe = function(a){return this.C.Qe(a);};function Qm(a,b){var c=Em(b),d=b.W;d === a.W?0 > a.D.indexOf(c) && (a.D.push(c),Rm(b).Zf(b,a)):Qm(Lm(a,d),b);}function Sm(_x9,_x10){var _again5=true;_function5: while(_again5) {var a=_x9,b=_x10;_again5 = false;var c=Em(b),d=b.W;if(d === a.W){return 0 <= a.D.indexOf(c);}else {_x9 = Lm(a,d);_x10 = b;_again5 = true;c = d = undefined;continue _function5;}}}function Tm(a,b,c){var d=b.W;d !== a.W?Tm(Lm(a,d),b,c):0 > a.b.indexOf(b) && (a.b.push(b),a.b.sort(function(a,b){return a.za() - b.za();}));c || Um(a);}function Vm(a,b,c){var d=b.W;d !== a.W?Vm(Lm(a,d),b,c):(b = a.b.indexOf(b),0 <= b && (b = a.b.splice(b,1)[0],(b = b.zb && b.zb.element) && b.parentNode && b.parentNode.removeChild(b),c || Um(a)));}function Wm(_x11,_x12){var _again6=true;_function6: while(_again6) {var a=_x11,b=_x12;_again6 = false;if(b.W !== a.W){_x11 = Lm(a,b.W);_x12 = b;_again6 = true;continue _function6;}var c=a.b.findIndex(function(a){return Hm(a,b);});return 0 <= c?a.b[c]:null;}}function Xm(_x13,_x14){var _again7=true;_function7: while(_again7) {var a=_x13,b=_x14;_again7 = false;if(0 < a.b.length && (!b || a.b.some(b))){return !0;}else {if(a.parent){_x13 = a.parent;_x14 = b;_again7 = true;continue _function7;}else {return !1;}}}}function Ym(a,b){return Xm(a,function(a){return a.f && a.Bb[0].qa.f === b;});}function Zm(a,b,c){a.A[Em(b)] = c;}function $m(a){var b=Object.assign({},a.A);return a.g.reduce(function(a,b){return Object.assign(a,$m(b));},b);}function an(a,b){if(bn(a).some(function(a){return Em(a.qa) === b;}))return !0;var c=$m(a)[b];return c?a.M && a.M.element?a.M.element.contains(c):!1:!1;}function cn(a,b){var c=b.qa;if(c.W === a.W){var d=a.f.findIndex(function(a){return a.qa === c;});0 <= d?a.f.splice(d,1,b):a.f.push(b);}else cn(Lm(a,c.W),b);}function dn(_x15,_x16,_x17){var _again8=true;_function8: while(_again8) {var a=_x15,b=_x16,c=_x17;_again8 = false;if(!c && b.W !== a.W){_x15 = Lm(a,b.W);_x16 = b;_x17 = !1;_again8 = true;continue _function8;}var d=b.za();if(a.f.some(function(a){return a.qa.za() < d && !b.Re(a.qa);})){return !0;}else {if(a.parent){_x15 = a.parent;_x16 = b;_x17 = !0;_again8 = true;d = undefined;continue _function8;}else {return !1;}}}}function bn(a,b){b = b || a.j;var c=a.J.filter(function(a){return !b || a.qa.f === b;});a.parent && (c = bn(a.parent,b).concat(c));return c.sort(function(a,b){return a.qa.za() - b.qa.za();});}function en(a,b){b = b || a.j;var c=a.f.filter(function(a){return !b || a.qa.f === b;});return a.parent?en(a.parent,b).concat(c):c;}function fn(a){for(var b=[],c=[],d=a.g.length - 1;0 <= d;d--) {var e=a.g[d];0 <= c.indexOf(e.j) || (c.push(e.j),b = b.concat(e.f.map(function(a){return a.qa;})),b = b.concat(fn(e)));}return b;}function gn(_x18){var _again9=true;_function9: while(_again9) {var a=_x18;_again9 = false;if(hn(a))return !0;for(var b=a.b.length - 1;0 <= b;b--) {var c=a.b[b],d;a: {d = c;for(var e=a,f=d.Bb.length - 1;0 <= f;f--) {var g=d.Bb[f].qa;if(!an(e,Em(g))){d = g;break a;}}d = null;}if(d){if(a.h)Um(a);else if((Vm(a,c),Qm(a,d),c = jn(a,c.va),"block-end" === c || "inline-end" === c))for(b = 0;b < a.b.length;) d = a.b[b],jn(a,d.va) === c?Vm(a,d):b++;return !0;}}if("region" === a.W && a.parent.h){_x18 = a.parent;_again9 = true;b = c = d = e = f = g = undefined;continue _function9;}else {return !1;}}}function hn(a){var b=fn(a),c=a.b.reduce(function(a,b){return a.concat(b.Bb.map(function(a){return a.qa;}));},[]);c.sort(function(a,b){return b.za() - a.za();});for(var d=0;d < c.length;d++) {var e=c[d],f=e.za();if(b.some(function(a){return !e.Re(a) && f > a.za();}))return a.h?Um(a):(Qm(a,e),b = Wm(a,e),Vm(a,b)),!0;}return !1;}function kn(a){if(!gn(a)){for(var b=a.f.length - 1;0 <= b;b--) if(!an(a,Em(a.f[b].qa))){if(a.h){Um(a);return;}a.f.splice(b,1);}a.J.forEach(function(a){0 <= this.f.findIndex(function(b){return b?a === b?!0:a.qa === b.qa && zk(a.b,b.b):!1;}) || this.b.some(function(b){return Hm(b,a.qa);}) || this.f.push(a);},a);}}function ln(a,b){return !!a.M && !!b.M && a.M.element === b.M.element;}function Um(a){a.Gc = !0;a.h || (a.M && (a.g.forEach(function(a){ln(this,a) && a.b.forEach(function(a){(a = a.zb.element) && a.parentNode && a.parentNode.removeChild(a);});},a),hl(a.M)),a.g.forEach(function(a){a.G.splice(0);}),a.g.splice(0),Object.keys(a.A).forEach(function(a){delete this.A[a];},a));}function mn(a){a = a.g.splice(0);a.forEach(function(a){a.b.forEach(function(a){(a = a.zb.element) && a.parentNode && a.parentNode.removeChild(a);});});return a;}function nn(a,b){b.forEach(function(a){this.g.push(a);Om(a);},a);}function on(_x19){var _left3;var _again10=true;_function10: while(_again10) {var a=_x19;_again10 = false;if(_left3 = a.Gc){return _left3;}if(!(_left3 = !!a.parent)){return _left3;}_x19 = a.parent;_again10 = true;continue _function10;}}function jn(a,b){return wm(b,a.I.toString(),a.H.toString() || null,Am);}function pn(a,b){var c=b.W;if(c !== a.W)pn(Lm(a,c),b);else if((c = jn(a,b.va),"block-end" === c || "snap-block" === c || "inline-end" === c))for(var d=0;d < a.b.length;) {var e=a.b[d],f=jn(a,e.va);(f === c || "snap-block" === c && "block-end" === f) && e.b(b)?(a.l.push(e),a.b.splice(d,1)):d++;}}function qn(a,b){b !== a.W?qn(Lm(a,b),b):(a.l.forEach(function(a){Tm(this,a,!0);},a),a.l.splice(0));}function rn(a,b){b !== a.W?rn(Lm(a,b),b):a.l.splice(0);}function sn(_x20,_x21){var _again11=true;_function11: while(_again11) {var a=_x20,b=_x21;_again11 = false;if(b === a.W){return a.l.concat().sort(function(a,b){return b.za() - a.za();});}else {_x20 = Lm(a,b);_x21 = b;_again11 = true;continue _function11;}}}function tn(a,b,c,d,e){var f=jn(a,b);b = wm(b,a.I.toString(),a.H.toString() || null,zm);a: {var g=un(a,c,d,e);switch(f){case "block-start":f = a.M.u?g.right:g.top;break a;case "block-end":f = a.M.u?g.left:g.bottom;break a;case "inline-start":f = a.M.u?g.top:g.left;break a;case "inline-end":f = a.M.u?g.bottom:g.right;break a;default:throw Error("Unknown logical side: " + f);}}if(a.parent && a.parent.M)switch((a = tn(a.parent,b,c,d,e),b)){case "top":return Math.max(f,a);case "left":return Math.max(f,a);case "bottom":return Math.min(f,a);case "right":return Math.min(f,a);default:fa("Should be unreachable");}return f;}function un(a,b,c,d){function e(a,d,e){if("%" === a.ha)a = e * a.L / 100;else {e = a.L;var f=a.ha,g;b: switch(f.toLowerCase()){case "em":case "ex":case "rem":g = !0;break b;default:g = !1;}if(g){for(;d && 1 !== d.nodeType;) d = d.parentNode;d = parseFloat(vn(c,d)["font-size"]);a = Ph(a,d,b.b).L;}else a = (d = Eb(b.b,f,!1))?e * d:a;}return a;}var f=a.M.D,g=a.M.G,h=il(a.M),l={top:h.S - g,left:h.V - f,bottom:h.P - g,right:h.U - f,Ec:0,Dc:0},k=a.b;0 < k.length && (l = k.reduce((function(a,b){if(d && !d(b,this))return a;var c=jn(this,b.va),f=b.zb,g=b.Bb[0].qa.kc,k=a.top,l=a.left,m=a.bottom,p=a.right,K=a.Ec,I=a.Dc;switch(c){case "inline-start":f.u?k = Math.max(k,f.top + f.height):l = Math.max(l,f.left + f.width);break;case "block-start":f.u?(g && f.left < p && (K = e(g,f.gd[0],h.U - h.V)),p = Math.min(p,f.left)):(g && f.top + f.height > k && (K = e(g,f.gd[0],h.P - h.S)),k = Math.max(k,f.top + f.height));break;case "inline-end":f.u?m = Math.min(m,f.top):p = Math.min(p,f.left);break;case "block-end":f.u?(g && f.left + f.width > l && (I = e(g,f.gd[0],h.U - h.V)),l = Math.max(l,f.left + f.width)):(g && f.top < m && (I = e(g,f.gd[0],h.P - h.S)),m = Math.min(m,f.top));break;default:throw Error("Unknown logical float side: " + c);}return {top:k,left:l,bottom:m,right:p,Ec:K,Dc:I};}).bind(a),l));l.left += f;l.right += f;l.top += g;l.bottom += g;return l;}function wn(_x22,_x23,_x24,_x25,_x26,_x27,_x28,_x29){var _again12=true;_function12: while(_again12) {var a=_x22,b=_x23,c=_x24,d=_x25,e=_x26,f=_x27,g=_x28,h=_x29;var l=function l(a,c){var d=a(b.vb,c);return d?(b.u && (d = new $f(-d.P,d.V,-d.S,d.U)),m = b.u?Math.min(m,d.U):Math.max(m,d.S),p = b.u?Math.max(p,d.V):Math.min(p,d.P),!0):g;};_again12 = false;if(c !== a.W){_x22 = Lm(a,c);_x23 = b;_x24 = c;_x25 = d;_x26 = e;_x27 = f;_x28 = g;_x29 = h;_again12 = true;continue _function12;}var k=jn(a,d);if("snap-block" === k){if(!h["block-start"] && !h["block-end"])return null;}else if(!h[k])return null;var m=tn(a,"block-start",b.j,b.b),p=tn(a,"block-end",b.j,b.b);c = tn(a,"inline-start",b.j,b.b);var q=tn(a,"inline-end",b.j,b.b),r=b.u?b.D:b.G,z=b.u?b.G:b.D,m=b.u?Math.min(m,b.left + $k(b) + b.width + al(b) + r):Math.max(m,b.top + r),p=b.u?Math.max(p,b.left + r):Math.min(p,b.top + Yk(b) + b.height + Zk(b) + r),u;if(f){a = b.u?qg(new $f(p,c,m,q)):new $f(c,m,q,p);if(("block-start" === k || "snap-block" === k || "inline-start" === k) && !l(vg,a) || ("block-end" === k || "snap-block" === k || "inline-end" === k) && !l(wg,a))return null;u = (p - m) * bl(b);f = u - (b.u?al(b):Yk(b)) - (b.u?$k(b):Zk(b));e = q - c;a = e - (b.u?Yk(b):$k(b)) - (b.u?Zk(b):al(b));if(!g && (0 >= f || 0 >= a))return null;}else {f = b.g;u = f + (b.u?al(b):Yk(b)) + (b.u?$k(b):Zk(b));var A=(p - m) * bl(b);if("snap-block" === k && (null === e?k = "block-start":(k = il(a.M),k = bl(a.M) * (e - (a.M.u?k.U:k.S)) <= bl(a.M) * ((a.M.u?k.V:k.P) - e - u)?"block-start":"block-end"),!h[k]))if(h["block-end"])k = "block-end";else return null;if(!g && A < u)return null;a = "inline-start" === k || "inline-end" === k?xn(b.b,b.element,[yn])[yn]:b.ge?zn(b):b.u?b.height:b.width;e = a + (b.u?Yk(b):$k(b)) + (b.u?Zk(b):al(b));if(!g && q - c < e)return null;}m -= r;p -= r;c -= z;q -= z;switch(k){case "inline-start":case "block-start":case "snap-block":gl(b,c,a);fl(b,m,f);break;case "inline-end":case "block-end":gl(b,q - e,a);fl(b,p - u * bl(b),f);break;default:throw Error("unknown float direction: " + d);}return k;}}function An(a){var b=a.b.map(function(a){return jl(a.zb,null,null);});return a.parent?An(a.parent).concat(b):b;}function Om(a){var b=a.M.element && a.M.element.parentNode;b && a.b.forEach(function(a){b.appendChild(a.zb.element);});}function Bn(a){var b=Mm(a).u;return a.b.reduce(function(a,d){var c=kl(d.zb);return b?Math.min(a,c.V):Math.max(a,c.P);},b?Infinity:0);}function Cn(a){var b=Mm(a).u;return a.b.filter(function(a){return "block-end" === a.va;}).reduce(function(a,d){var c=kl(d.zb);return b?Math.max(a,c.U):Math.min(a,c.S);},b?0:Infinity);}function Dn(a,b){function c(a){return function(b){return an(a,Em(b.qa));};}function d(a,b){return a.Bb.some(c(b));}for(var e=il(b),e=b.u?e.V:e.P,f=a;f;) {if(f.f.some(c(f)))return e;f = f.parent;}f = tn(a,"block-start",b.j,b.b,d);return tn(a,"block-end",b.j,b.b,d) * bl(b) < e * bl(b)?e:f;}function En(_x30,_x31,_x32,_x33){var _again13=true;_function13: while(_again13) {var a=_x30,b=_x31,c=_x32,d=_x33;var e=function e(a){return function(b){return b.va === a && b.za() < l;};};var f=function f(a,b){return a.g.some(function(a){return a.b.some(e(b)) || f(a,b);});};var g=function g(_x34,_x35){var _left4;var _again14=true;_function14: while(_again14) {var a=_x34,b=_x35;_again14 = false;var c=a.parent;if(!(_left4 = !!c)){return _left4;}if(_left4 = c.b.some(e(b))){return _left4;}_x34 = c;_x35 = b;_again14 = true;c = undefined;continue _function14;}};_again13 = false;if(b.W !== a.W){_x30 = Lm(a,b.W);_x31 = b;_x32 = c;_x33 = d;_again13 = true;continue _function13;}var h={"block-start":!0,"block-end":!0,"inline-start":!0,"inline-end":!0};if(!d)return h;c = jn(a,c);d = jn(a,d);d = "all" === d?["block-start","block-end","inline-start","inline-end"]:"same" === d?"snap-block" === c?["block-start","block-end"]:[c]:[d];var l=b.za();d.forEach(function(a){switch(a){case "block-start":case "inline-start":h[a] = !f(this,a);break;case "block-end":case "inline-end":h[a] = !g(this,a);break;default:throw Error("Unexpected side: " + a);}},a);return h;}}function Fn(a){return (a.parent?Fn(a.parent):[]).concat(a.G);}function Gn(a,b,c){c === a.W?a.G.push(b):Gn(Lm(a,c),b,c);}function Hn(a,b){for(var c=b.j,d=b.b,e=a,f=null;e && e.M;) {var g=un(e,c,d);f?b.u?(g.right < f.right && (f.right = g.right,f.Ec = g.Ec),g.left > f.left && (f.left = g.left,f.Dc = g.Dc)):(g.top > f.top && (f.top = g.top,f.Ec = g.Ec),g.bottom < f.bottom && (f.bottom = g.bottom,f.Dc = g.Dc)):f = g;e = e.parent;}return (b.u?f.right - f.left:f.bottom - f.top) <= Math.max(f.Ec,f.Dc);}function In(a){var b=Mm(a).u;return a.b.length?Math.max.apply(null,a.b.map(function(a){a = a.zb;return b?a.width:a.height;})):0;}var Jn=[];function Kn(a){for(var b=Jn.length - 1;0 <= b;b--) {var c=Jn[b];if(c.rf(a))return c;}throw Error("No PageFloatLayoutStrategy found for " + a);}function Rm(a){for(var b=Jn.length - 1;0 <= b;b--) {var c=Jn[b];if(c.qf(a))return c;}throw Error("No PageFloatLayoutStrategy found for " + a);}function Ln(){}n = Ln.prototype;n.rf = function(a){return Cm(a.W);};n.qf = function(){return !0;};n.xf = function(a,b,c){var d=a.W,e=a.va,f=Lk(a);return Mn(c,d,a.X,a).fa(function(c){d = c;c = new Dm(f,d,e,a.h,b.j,a.kc);b.Yd(c);return L(c);});};n.yf = function(a,b,c,d){return new Gm(a[0].qa.W,b,a,c,d);};n.jf = function(a,b){return Wm(b,a);};n.mf = function(){};n.Zf = function(){};Jn.push(new Ln());var Nn={img:!0,svg:!0,audio:!0,video:!0};function On(a,b,c,d){var e=a.B;if(!e)return NaN;if(1 == e.nodeType){if(a.K){var f=pk(b,e);if(f.right >= f.left && f.bottom >= f.top)return d?f.left:f.bottom;}return NaN;}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K && (c += h);c >= h && (c = h - 1);g.setStart(e,c);g.setEnd(e,c + 1);a = Pn(b,g);if(c = d){c = document.body;if(null == Va){var l=c.ownerDocument,g=l.createElement("div");g.style.position = "absolute";g.style.top = "0px";g.style.left = "0px";g.style.width = "100px";g.style.height = "100px";g.style.overflow = "hidden";g.style.lineHeight = "16px";g.style.fontSize = "16px";w(g,"writing-mode","vertical-rl");c.appendChild(g);h = l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l = l.createRange();l.setStart(h,0);l.setEnd(h,1);h = l.getBoundingClientRect();Va = 10 > h.right - h.left;c.removeChild(g);}c = Va;}if(c){c = e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b = Pn(b,c);e = [];for(c = 0;c < a.length;c++) {g = a[c];for(h = 0;h < b.length;h++) if((l = b[h],g.top >= l.top && g.bottom <= l.bottom && 1 > Math.abs(g.left - l.left))){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break;}h == b.length && (v.b("Could not fix character box"),e.push(g));}a = e;}for(e = b = 0;e < a.length;e++) c = a[e],g = d?c.bottom - c.top:c.right - c.left,c.right > c.left && c.bottom > c.top && (isNaN(f) || g > b) && (f = d?c.left:c.bottom,b = g);return f;}function Qn(a){for(var b=Ud("RESOLVE_LAYOUT_PROCESSOR"),c=0;c < b.length;c++) {var d=b[c](a);if(d)return d;}throw Error("No processor found for a formatting context: " + a.Je());}function Rn(a){this.yd = a;}Rn.prototype.ob = function(a){return this.yd.every(function(b){return b.ob(a);});};function Sn(){}Sn.prototype.A = function(){};Sn.prototype.g = function(){return null;};function Tn(a,b){return {current:b.reduce(function(b,d){return b + d.b(a);},0),te:b.reduce(function(b,d){return b + d.G(a);},0)};}function Un(a,b){this.h = a;this.Kc = b;this.j = !1;this.l = null;}t(Un,Sn);Un.prototype.f = function(a,b){if(b < this.b())return null;this.j || (this.l = Vn(a,this,0 < b),this.j = !0);return this.l;};Un.prototype.b = function(){return this.Kc;};Un.prototype.g = function(){return this.j?this.l:this.h[this.h.length - 1];};function sm(a,b,c,d){this.position = a;this.G = b;this.C = this.j = c;this.D = d;this.h = !1;this.jc = 0;}t(sm,Sn);sm.prototype.f = function(a,b){if(!this.h){var c=om(a,this.position);this.jc = On(this.position,a.b,0,a.u) + c;this.h = !0;}var c=this.jc,d=Tn(this.g(),Wn(a));this.C = Xn(a,c + (a.u?-1:1) * d.te);this.j = this.position.b = Xn(a,c + (a.u?-1:1) * d.current);b < this.b()?c = null:(a.g = this.D + Yn(a,this),c = this.position);return c;};sm.prototype.b = function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a = this.g()) && a.parent){var b=Zn(a.parent);a = b?(b = b.b)?a && b.g === a.N:!1:!1;}else a = !1;a = a && !this.C;return (gm[this.G]?1:0) + (this.j && !a?3:0) + (this.position.parent?this.position.parent.j:0);};sm.prototype.g = function(){return this.position;};function $n(a){for(var b=1;b < a.length;b++) {var c=a[b - 1],d=a[b];c === d?v.b("validateCheckPoints: duplicate entry"):c.Ca >= d.Ca?v.b("validateCheckPoints: incorrect boxOffset"):c.N == d.N && (d.K?c.K && v.b("validateCheckPoints: duplicate after points"):c.K || d.Ca - c.Ca != d.la - c.la && v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"));}}function ao(a){this.parent = a;}ao.prototype.Je = function(){return "Block formatting context (adapt.layout.BlockFormattingContext)";};ao.prototype.Te = function(a,b){return b;};ao.prototype.Le = function(){};ao.prototype.Ke = function(){};function pm(a,b,c,d,e){Xk.call(this,a);this.j = b;this.b = c;this.ec = d;this.ug = a.ownerDocument;this.h = e;Nm(e,this);this.Ye = null;this.If = this.Sf = !1;this.ja = this.ia = this.C = this.Ka = this.sa = 0;this.vb = this.Of = this.Kf = null;this.yc = !1;this.f = this.J = null;this.wb = !0;this.ie = this.ne = this.ke = 0;this.l = !0;this.yb = null;this.A = [];this.oa = this.wd = null;this.Xe = NaN;}t(pm,Xk);function bo(a,b){return !!b.va && (!a.Sf || !!b.parent);}function Xn(a,b){return a.u?b < a.ja:b > a.ja;}pm.prototype.fc = function(a){var b=this,c=J("openAllViews"),d=a.na;co(b.j,b.element,b.If);var e=d.length - 1,f=null;qe(function(){for(;0 <= e;) {f = Ck(d[e],f);e !== d.length - 1 || f.F || (f.F = b.Ye);if(!e){var c=f,h;h = a;h = h.Ia?Mk(h.Ia,h.la,1):h.la;c.la = h;f.K = a.K;f.Ia = a.Ia;if(f.K)break;}c = eo(b.j,f,!e && !f.la);e--;if(c.Ra())return c;}return L(!1);}).then(function(){M(c,f);});return c.result();};var fo=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;function go(a,b){if(b.f && b.ta && !b.K && !b.f.count && 1 != b.B.nodeType){var c=b.B.textContent.match(fo);return ho(a.j,b,c[0].length);}return L(b);}function io(a,b,c){var d=!1,e=J("buildViewToNextBlockEdge");re(function(e){b.B && !jo(b) && c.push(Ek(b));go(a,b).then(function(f){f !== b && (b = f,jo(b) || c.push(Ek(b)));ko(a,b).then(function(c){if(b = c){if(d || !a.ec.ob(b))d = !0,b = b.modify(),b.b = !0;bo(a,b) && !a.u?lo(a,b).then(function(c){b = c;on(a.h) && (b = null);b?O(e):P(e);}):b.ta?O(e):P(e);}else P(e);});});}).then(function(){M(e,b);});return e.result();}function ko(a,b,c){b = lm(a.j,b,c);return mo(b,a);}function no(a,b){if(!b.B)return L(b);var c=[],d=b.N,e=J("buildDeepElementView");re(function(e){b.B && b.ta && !jo(b)?c.push(Ek(b)):(0 < c.length && oo(a,b,c),c = []);go(a,b).then(function(f){if(f !== b){for(var g=f;g && g.N != d;) g = g.parent;if(!g){b = f;P(e);return;}jo(f) || c.push(Ek(f));}ko(a,f).then(function(c){(b = c) && b.N != d?a.ec.ob(b)?O(e):(b = b.modify(),b.b = !0,a.l?P(e):O(e)):P(e);});});}).then(function(){0 < c.length && oo(a,b,c);M(e,b);});return e.result();}function po(a,b,c,d,e){var f=a.ug.createElement("div");a.u?(e >= a.height && (e -= .1),w(f,"height",d + "px"),w(f,"width",e + "px")):(d >= a.width && (d -= .1),w(f,"width",d + "px"),w(f,"height",e + "px"));w(f,"float",c);w(f,"clear",c);a.element.insertBefore(f,b);return f;}function qo(a){for(var b=a.element.firstChild;b;) {var c=b.nextSibling;if(1 == b.nodeType){var d=b.style.cssFloat;if("left" == d || "right" == d)a.element.removeChild(b);else break;}b = c;}}function ro(a){for(var b=a.element.firstChild,c=a.vb,d=a.u?a.u?a.sa:a.C:a.u?a.ia:a.sa,e=a.u?a.u?a.Ka:a.ia:a.u?a.C:a.Ka,f=0;f < c.length;f++) {var g=c[f],h=g.P - g.S;g.left = po(a,b,"left",g.V - d,h);g.right = po(a,b,"right",e - g.U,h);}}function so(a,b,c,d,e){var f;if(b && to(b.B))return NaN;if(b && b.K && !b.ta && (f = On(b,a.b,0,a.u),!isNaN(f)))return f;b = c[d];for(e -= b.Ca;;) {f = On(b,a.b,e,a.u);if(!isNaN(f))return f;if(0 < e)e--;else {d--;if(0 > d)return a.C;b = c[d];1 != b.B.nodeType && (e = b.B.textContent.length);}}}function X(a){return "number" == typeof a?a:(a = a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0;}function uo(a,b){var c=vn(a.b,b),d=new bg();c && (d.left = X(c.marginLeft),d.top = X(c.marginTop),d.right = X(c.marginRight),d.bottom = X(c.marginBottom));return d;}function vo(a,b){var c=vn(a.b,b),d=new bg();c && (d.left = X(c.borderLeftWidth) + X(c.paddingLeft),d.top = X(c.borderTopWidth) + X(c.paddingTop),d.right = X(c.borderRightWidth) + X(c.paddingRight),d.bottom = X(c.borderBottomWidth) + X(c.paddingBottom));return d;}function wo(a,b){var c=J("layoutFloat"),d=b.B,e=b.va;w(d,"float","none");w(d,"display","inline-block");w(d,"vertical-align","top");no(a,b).then(function(f){for(var g=pk(a.b,d),h=uo(a,d),g=new $f(g.left - h.left,g.top - h.top,g.right + h.right,g.bottom + h.bottom),h=a.sa,l=a.Ka,k=b.parent;k && k.ta;) k = k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left = "0px";m.style.top = "0px";a.u?(m.style.bottom = "0px",m.style.width = "1px"):(m.style.right = "0px",m.style.height = "1px");k.B.appendChild(m);var p=pk(a.b,m),h=Math.max(a.u?p.top:p.left,h),l=Math.min(a.u?p.bottom:p.right,l);k.B.removeChild(m);m = a.u?g.P - g.S:g.U - g.V;"left" == e?l = Math.max(l,h + m):h = Math.min(h,l - m);k.B.appendChild(b.B);}m = new $f(h,bl(a) * a.C,l,bl(a) * a.ia);h = g;a.u && (h = qg(g));l = bl(a);h.S < a.ie * l && (p = h.P - h.S,h.S = a.ie * l,h.P = h.S + p);a: for(var l=a.vb,p=h,q=p.S,r=p.U - p.V,z=p.P - p.S,u=ug(l,q);;) {var A=q + z;if(A > m.P)break a;for(var H=m.V,G=m.U,K=u;K < l.length && l[K].S < A;K++) {var I=l[K];I.V > H && (H = I.V);I.U < G && (G = I.U);}if(H + r <= G || u >= l.length){"left" == e?(p.V = H,p.U = H + r):(p.V = G - r,p.U = G);p.P += q - p.S;p.S = q;break a;}q = l[u].P;u++;}a.u && (g = new $f(-h.P,h.V,-h.S,h.U));a: {m = vn(a.b,d);l = new bg();if(m){if("border-box" == m.boxSizing){m = uo(a,d);break a;}l.left = X(m.marginLeft) + X(m.borderLeftWidth) + X(m.paddingLeft);l.top = X(m.marginTop) + X(m.borderTopWidth) + X(m.paddingTop);l.right = X(m.marginRight) + X(m.borderRightWidth) + X(m.paddingRight);l.bottom = X(m.marginBottom) + X(m.borderBottomWidth) + X(m.paddingBottom);}m = l;}w(d,"width",g.U - g.V - m.left - m.right + "px");w(d,"height",g.P - g.S - m.top - m.bottom + "px");w(d,"position","absolute");w(d,"display",b.display);l = null;if(k)if(k.J)l = k;else a: {for(k = k.parent;k;) {if(k.J){l = k;break a;}k = k.parent;}l = null;}l?(m = l.B.ownerDocument.createElement("div"),m.style.position = "absolute",l.u?m.style.right = "0":m.style.left = "0",m.style.top = "0",l.B.appendChild(m),k = pk(a.b,m),l.B.removeChild(m)):k = {left:(a.u?a.ia:a.sa) - a.H,right:(a.u?a.C:a.Ka) + a.R,top:(a.u?a.sa:a.C) - a.I};(l?l.u:a.u)?w(d,"right",k.right - g.U + "px"):w(d,"left",g.V - k.left + "px");w(d,"top",g.S - k.top + "px");b.C && (b.C.parentNode.removeChild(b.C),b.C = null);k = a.u?g.V:g.P;g = a.u?g.U:g.S;if(Xn(a,k) && a.J.length)b = b.modify(),b.b = !0,M(c,b);else {qo(a);m = new $f(a.u?a.ia:a.sa,a.u?a.sa:a.C,a.u?a.C:a.Ka,a.u?a.Ka:a.ia);a.u && (m = qg(m));l = a.vb;for(h = [new dg(h.S,h.P,h.V,h.U)];0 < h.length && h[0].P <= m.S;) h.shift();if(h.length){h[0].S < m.S && (h[0].S = m.S);p = l.length?l[l.length - 1].P:m.S;p < m.P && l.push(new dg(p,m.P,m.V,m.U));q = ug(l,h[0].S);for(r = 0;r < h.length;r++) {z = h[r];if(q == l.length)break;l[q].S < z.S && (p = l[q],q++,l.splice(q,0,new dg(z.S,p.P,p.V,p.U)),p.P = z.S);for(;q < l.length && (p = l[q++],p.P > z.P && (l.splice(q,0,new dg(z.P,p.P,p.V,p.U)),p.P = z.P),z.V != z.U && ("left" == e?p.V = Math.min(z.U,m.U):p.U = Math.max(z.V,m.V)),p.P != z.P););}tg(m,l);}ro(a);"left" == e?a.ke = k:a.ne = k;a.ie = g;xo(a,k);M(c,f);}});return c.result();}function yo(a,b,c,d,e,f){var g=a.element.ownerDocument.createElement("div");w(g,"position","absolute");var h=Pm(a.h,b.W),l=new Jm(h,"column",null,a.h.j,b.b,null,null),h=Mm(h),g=new zo(c,g,a.j.clone(),a.b,a.ec,l,h);Nm(l,g);var h=b.W,k=a.h;b = Mm(k,h);l = g.element;b.element.parentNode.appendChild(l);g.Sf = !0;g.D = b.D;g.G = b.G;g.u = b.u;g.marginLeft = g.marginRight = g.marginTop = g.marginBottom = 0;g.X = g.Ja = g.Z = g.Fa = 0;g.H = g.R = g.I = g.O = 0;g.$a = (b.$a || []).concat();g.wb = !Xm(k);g.xb = null;var m=il(b);el(g,m.V - b.D,m.U - m.V);dl(g,m.S - b.G,m.P - m.S);e.mf(g,b,a);Ao(g);(a = !!wn(k,g,h,c,d,!0,!Xm(k),f))?(qo(g),Ao(g)):b.element.parentNode.removeChild(l);return a?g:null;}function Bo(a,b,c,d,e,f,g,h){var l=a.h;b = (h?h.Bb:[]).concat(b);var k=b[0].qa,m=En(l,k,c,d),p=yo(a,k,c,g,f,m),q={Bf:p,bf:null,Ze:null};if(!p)return L(q);var r=J("layoutSinglePageFloatFragment"),z=!1,u=0;re(function(a){u >= b.length?P(a):rm(p,new Qk(b[u].b),!0).then(function(b){q.Ze = b;!b || e?(u++,O(a)):(z = !0,P(a));});}).then(function(){if(!z){var a=wn(l,p,k.W,c,g,!1,e,m);a?(a = f.yf(b,a,p,!!q.Ze),Tm(l,a,!0),q.bf = a):z = !0;}M(r,q);});return r.result();}function Co(a,b,c,d,e){function f(a,c){c?Vm(g,c,!0):a && a.element.parentNode.removeChild(a.element);qn(g,h.W);cn(g,b);}var g=a.h,h=b.qa;pn(g,h);var l=J("layoutPageFloatInner");Bo(a,[b],h.va,h.h,!Xm(g),c,d,e).then(function(b){var c=b.Bf,d=b.bf,k=b.Ze;d?Do(a,h.W,[e]).then(function(a){a?(Tm(g,d),rn(g,h.W),k && cn(g,new Im(h,k.f)),M(l,!0)):(f(c,d),M(l,!1));}):(f(c,d),M(l,!1));});return l.result();}function Do(a,b,c){var d=a.h,e=sn(d,b),f=[],g=[],h=!1,l=J("layoutStashedPageFloats"),k=0;re(function(b){if(k >= e.length)P(b);else {var d=e[k];if(0 <= c.indexOf(d))k++,O(b);else {var l=Rm(d.Bb[0].qa);Bo(a,d.Bb,d.va,null,!1,l,null).then(function(a){var c=a.Bf;c && f.push(c);(a = a.bf)?(g.push(a),k++,O(b)):(h = !0,P(b));});}}}).then(function(){h?(g.forEach(function(a){Vm(d,a,!0);}),f.forEach(function(a){(a = a.element) && a.parentNode && a.parentNode.removeChild(a);})):e.forEach(function(a){(a = a.zb.element) && a.parentNode && a.parentNode.removeChild(a);});M(l,!h);});return l.result();}function Eo(a,b){var c=b.B.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote" === b.va && Fo(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.B);c = b.modify();c.K = !0;c.B = d;return c;}function Mn(a,b,c,d){var e=J("resolveFloatReferenceFromColumnSpan"),f=a.h,g=Pm(f,"region");Mm(f).width < Mm(g).width && "column" === b?c === Lc?no(a,Ek(d)).then(function(c){var d=c.B;c = xn(a.b,d,[Go])[Go];d = uo(a,d);c = a.u?c + (d.top + d.bottom):c + (d.left + d.right);c > a.width?M(e,"region"):M(e,b);}):c === Jc?M(e,"region"):M(e,b):M(e,b);return e.result();}function Ho(a,b){var c=a.h,d=Kn(b),e=c.Qe(Lk(b));return (e?L(e):d.xf(b,c,a)).fa(function(e){var f=Ak(b),h=Eo(a,b),l=d.jf(e,c),f=new Im(e,f);if(l && Hm(l,e))return Zm(c,e,h.B),L(h);if(Sm(c,e) || dn(c,e))return cn(c,f),Zm(c,e,h.B),L(h);if(a.oa)return L(null);var k=On(h,a.b,0,a.u);return Xn(a,k)?L(h):Co(a,f,d,k,l).fa(function(a){if(a)return L(null);Zm(c,e,h.B);return L(h);});});}function Io(a,b,c){if(!b.K || b.ta){if(c){for(var d="",e=b.parent;e && !d;e = e.parent) !e.ta && e.B && (d = e.B.style.textAlign);if("justify" !== d)return;}var f=b.B,g=f.ownerDocument,h=c && (b.K || 1 != f.nodeType);(d = h?f.nextSibling:f) && !d.parentNode && (d = null);if(e = f.parentNode || b.parent && b.parent.B){var l=d,k=document.body;if(null === Xa){var m=k.ownerDocument,p=m.createElement("div");p.style.position = "absolute";p.style.top = "0px";p.style.left = "0px";p.style.width = "40px";p.style.height = "100px";p.style.lineHeight = "16px";p.style.fontSize = "16px";p.style.textAlign = "justify";k.appendChild(p);var q=m.createTextNode("a a-");p.appendChild(q);var r=m.createElement("span");r.style.display = "inline-block";r.style.width = "40px";p.appendChild(r);m = m.createRange();m.setStart(q,2);m.setEnd(q,4);Xa = 37 > m.getBoundingClientRect().right;k.removeChild(p);}Xa && (h = (h = h?f:f.previousSibling)?h.textContent:"",h.charAt(h.length - 1) === Jo(b) && (h = f.ownerDocument,f = f.parentNode,k = document.body,null === Ya && (m = k.ownerDocument,p = m.createElement("div"),p.style.position = "absolute",p.style.top = "0px",p.style.left = "0px",p.style.width = "40px",p.style.height = "100px",p.style.lineHeight = "16px",p.style.fontSize = "16px",p.style.textAlign = "justify",k.appendChild(p),q = m.createTextNode("a a-"),p.appendChild(q),p.appendChild(m.createElement("wbr")),r = m.createElement("span"),r.style.display = "inline-block",r.style.width = "40px",p.appendChild(r),m = m.createRange(),m.setStart(q,2),m.setEnd(q,4),Ya = 37 > m.getBoundingClientRect().right,k.removeChild(p)),Ya?f.insertBefore(h.createTextNode(" "),l):f.insertBefore(h.createElement("wbr"),l)));h = b.u;f = g.createElement("span");f.style.visibility = "hidden";f.style.verticalAlign = "top";f.setAttribute("data-adapt-spec","1");k = g.createElement("span");k.style.fontSize = "0";k.style.lineHeight = "0";k.textContent = " #";f.appendChild(k);f.style.display = "block";f.style.textIndent = "0";f.style.textAlign = "left";e.insertBefore(f,l);l = pk(a.b,k);f.style.textAlign = "right";k = pk(a.b,k);f.style.textAlign = "";p = document.body;if(null === Wa){r = p.ownerDocument;q = r.createElement("div");q.style.position = "absolute";q.style.top = "0px";q.style.left = "0px";q.style.width = "30px";q.style.height = "100px";q.style.lineHeight = "16px";q.style.fontSize = "16px";q.style.textAlign = "justify";p.appendChild(q);m = r.createTextNode("a | ");q.appendChild(m);var z=r.createElement("span");z.style.display = "inline-block";z.style.width = "30px";q.appendChild(z);r = r.createRange();r.setStart(m,0);r.setEnd(m,3);Wa = 27 > r.getBoundingClientRect().right;p.removeChild(q);}Wa?f.style.display = "inline":f.style.display = "inline-block";l = h?k.top - l.top:k.left - l.left;l = 1 <= l?l - 1 + "px":"100%";h?f.style.paddingTop = l:f.style.paddingLeft = l;c || (c = g.createElement("div"),e.insertBefore(c,d),d = pk(a.b,f),a = pk(a.b,c),b.u?(c.style.marginRight = a.right - d.right + "px",c.style.width = "0px"):(c.style.marginTop = d.top - a.top + "px",c.style.height = "0px"),c.setAttribute("data-adapt-spec","1"));}}}function Ko(a,b,c,d){var e=J("processLineStyling");$n(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0 == h.count && (h = h.sg);re(function(d){if(h){var e=Lo(a,f),l=h.count - g;if(e.length <= l)P(d);else {var p=Mo(a,f,e[l - 1]);p?a.Da(p,!1,!1).then(function(){g += l;ho(a.j,p,0).then(function(e){b = e;Io(a,b,!1);h = b.f;f = [];io(a,b,f).then(function(a){c = a;O(d);});});}):P(d);}}else P(d);}).then(function(){Array.prototype.push.apply(d,f);$n(d);M(e,c);});return e.result();}function No(a,b){for(var c=0,d=0,e=b.length - 1;0 <= e;e--) {var f=b[e];if(!f.K || !f.B || 1 != f.B.nodeType)break;f = uo(a,f.B);f = a.u?-f.left:f.bottom;0 < f?c = Math.max(c,f):d = Math.min(d,f);}return c - d;}function Oo(a,b){var c=J("layoutBreakableBlock"),d=[];io(a,b,d).then(function(e){var f=d.length - 1;if(0 > f)M(c,e);else {var f=so(a,e,d,f,d[f].Ca),g=!1;if(!e || !to(e.B)){var h=Tn(e,Wn(a)),g=Xn(a,f + (a.u?-1:1) * h.te);Xn(a,f + (a.u?-1:1) * h.current) && !a.oa && (a.oa = e);}e || (f += No(a,d));xo(a,f);var l;b.f?l = Ko(a,b,e,d):l = L(e);l.then(function(b){oo(a,b,d);0 < d.length && (a.J.push(new Un(d,d[0].j)),g && (2 != d.length && 0 < a.J.length || d[0].N != d[1].N || !Nn[d[0].N.localName]) && b && (b = b.modify(),b.b = !0));M(c,b);});}});return c.result();}function oo(a,b,c){Ud("POST_LAYOUT_BLOCK").forEach((function(a){a(b,c,this);}).bind(a));}function Mo(a,b,c){$n(b);for(var d=0,e=b[0].Ca,f=d,g=b.length - 1,h=b[g].Ca,l;e < h;) {l = e + Math.ceil((h - e) / 2);for(var f=d,k=g;f < k;) {var m=f + Math.ceil((k - f) / 2);b[m].Ca > l?k = m - 1:f = m;}k = so(a,null,b,f,l);if(a.u?k < c:k > c){for(h = l - 1;b[f].Ca == l;) f--;g = f;}else xo(a,k),e = l,d = f;}b = b[f];c = e;e = b;b = e.B;1 != b.nodeType && (Po(e),e.K?e.la = b.length:(d = c - e.Ca,c = b.data,173 == c.charCodeAt(d)?(b.replaceData(d,c.length - d,e.A?"":Jo(e)),b = d + 1):(f = c.charAt(d),d++,g = c.charAt(d),b.replaceData(d,c.length - d,!e.A && Ja(f) && Ja(g)?Jo(e):""),b = d),d = b,0 < d && (b = d,e = e.modify(),e.la += b,e.g = null)));Qo(a,e,!1);return e;}function Po(a){Ud("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a) || b;},Ro);}var Ro=new function(){}();function Jo(a){return a.D || a.parent && a.parent.D || "-";}function jo(a){return a?(a = a.B) && 1 === a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1;}function Lo(a,b){for(var c=[],d=b[0].B,e=b[b.length - 1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;) {var p=!0;do {var q=null;d == e && (m = 1 === e.nodeType?!(!e.firstChild || h):!1);1 != d.nodeType?(k || (g.setStartBefore(d),k = !0),l = d):h?h = !1:d.getAttribute("data-adapt-spec")?p = !k:q = d.firstChild;q || (q = d.nextSibling,q || (h = !0,q = d.parentNode));d = q;}while(p && m);if(k){g.setEndAfter(l);k = Pn(a.b,g);for(p = 0;p < k.length;p++) f.push(k[p]);k = !1;}}f.sort(a.u?wk:vk);l = d = h = g = e = 0;for(m = bl(a);;) {if(l < f.length && (k = f[l],p = 1,0 < d && (p = Math.max(a.u?k.right - k.left:k.bottom - k.top,1),p = m * (a.u?k.right:k.top) < m * e?m * ((a.u?k.left:k.bottom) - e) / p:m * (a.u?k.left:k.bottom) > m * g?m * (g - (a.u?k.right:k.top)) / p:1),!d || .6 <= p || .2 <= p && (a.u?k.top:k.left) >= h - 1)){h = a.u?k.bottom:k.right;a.u?(e = d?Math.max(e,k.right):k.right,g = d?Math.min(g,k.left):k.left):(e = d?Math.min(e,k.top):k.top,g = d?Math.max(g,k.bottom):k.bottom);d++;l++;continue;}0 < d && (c.push(g),d = 0);if(l >= f.length)break;}c.sort(Na);a.u && c.reverse();return c;}function om(a,b){var c=0;Ok(b,(function(a){if("clone" === a.Cb["box-decoration-break"]){var b=vo(this,a.B);c += a.u?-b.left:b.bottom;"table" === a.display && (c += a.$d);}}).bind(a));return c;}function Yn(a,b){return (b?Tn(b.g(),Wn(a)):Tn(null,Wn(a))).current;}function Vn(a,b,c){for(var d=b.h,e=d[0];e.parent && e.ta;) e = e.parent;var f;c?f = c = 1:(c = Math.max((e.Cb.widows || 2) - 0,1),f = Math.max((e.Cb.orphans || 2) - 0,1));var e=om(a,e),g=Lo(a,d),h=a.ja - e,e=bl(a),l=Yn(a,b),h=h - e * l,k=So(a,d);isNaN(k.jc) && (k.jc = Infinity * e);var d=Ma(g.length,function(b){b = g[b];return a.u?b < h || b <= k.jc:b > h || b >= k.jc;}),m=0 >= d;m && (d = Ma(g.length,function(b){return a.u?g[b] < h:g[b] > h;}));d = Math.min(g.length - c,d);if(d < f)return null;h = g[d - 1];if(b = m?k.uf:Mo(a,b.h,h))c = To(a,b),!isNaN(c) && c < h && (h = c),a.g = e * (h - a.C) + l;return b;}function To(a,b){var c=b;do c = c.parent;while(c && c.ta);return c?(c = Ek(c).modify(),c.K = !0,On(c,a.b,0,a.u)):NaN;}function So(a,b){var c=b.findIndex(function(a){return a.b;});if(0 > c)return {jc:NaN,uf:null};var d=b[c];return {jc:so(a,null,b,c,d.Ca),uf:d};}pm.prototype.Da = function(a,b,c){var d=Qn(a.F).Da(this,a,b,c);d || (d = Uo.Da(this,a,b,c));return d;};pm.prototype.Rb = function(){var a=null,b=null,c,d=0;do {c = d;for(var d=Number.MAX_VALUE,e=this.J.length - 1;0 <= e && !b;--e) {var a=this.J[e],b=a.f(this,c),f=a.b();f > c && (d = Math.min(d,f));}}while(d > c && !b && this.wb);return {pb:b?a:null,w:b};};function Vo(a,b,c,d,e){if(on(a.h) || a.f || !c)return L(b);var f=J("doFinishBreak"),g=!1;if(!b){if(a.wb)return v.b("Could not find any page breaks?!!"),Wo(a,c).then(function(b){b?(b = b.modify(),b.b = !1,a.Da(b,g,!0).then(function(){M(f,b);})):M(f,b);}),f.result();b = d;g = !0;a.g = e;}a.Da(b,g,!0).then(function(){M(f,b);});return f.result();}function Xo(a){a = a.toString();return "" == a || "auto" == a || !!a.match(/^0+(.0*)?[^0-9]/);}function Yo(a,b,c,d,e){if(!b || to(b.B))return !1;var f=On(b,a.b,0,a.u),g=Tn(b,Wn(a)),h=Xn(a,f + (a.u?-1:1) * g.te);Xn(a,f + (a.u?-1:1) * g.current) && !a.oa && (a.oa = b);c && (f += No(a,c));xo(a,f);d = a.l?d:!0;!d && h || Zo(a,b,e,h);return h;}function $o(a,b){if(!b.B.parentNode)return !1;var c=uo(a,b.B),d=b.B.ownerDocument.createElement("div");a.u?(d.style.bottom = "0px",d.style.width = "1px",d.style.marginRight = c.right + "px"):(d.style.right = "0px",d.style.height = "1px",d.style.marginTop = c.top + "px");b.B.parentNode.insertBefore(d,b.B);var e=pk(a.b,d),e=a.u?e.right:e.top,f=bl(a),g=b.h,h=Infinity * -bl(a);"all" === g && (h = Dn(a.h,a));switch(g){case "left":h = f * Math.max(h * f,a.ke * f);break;case "right":h = f * Math.max(h * f,a.ne * f);break;default:h = f * Math.max(h * f,Math.max(a.ne * f,a.ke * f));}if(e * f >= h * f)return b.B.parentNode.removeChild(d),!1;e = Math.max(1,(h - e) * f);a.u?d.style.width = e + "px":d.style.height = e + "px";e = pk(a.b,d);e = a.u?e.left:e.bottom;a.u?(h = e + c.right - h,0 < h == 0 <= c.right && (h += c.right),d.style.marginLeft = h + "px"):(h -= e + c.top,0 < h == 0 <= c.top && (h += c.top),d.style.marginBottom = h + "px");b.C = d;return !0;}function ap(a){return a instanceof ao?!0:a instanceof bp?!1:a instanceof cp?!0:!1;}function dp(a,b,c,d){function e(){return !!d || !c && !!Al[m];}function f(){b = q[0] || b;b.B.parentNode.removeChild(b.B);h.f = m;}var g=b.K?b.parent && b.parent.F:b.F;if(g && !ap(g))return L(b);var h=a,l=J("skipEdges"),k=!d && c && b && b.K,m=d,p=null,q=[],r=[],z=!1;re(function(a){for(;b;) {var d=Qn(b.F);do if(b.B){if(b.ta && 1 != b.B.nodeType){if(rk(b.B,b.dc))break;if(!b.K){e()?f():Yo(h,p,null,!0,m)?(b = (h.l?p || b:b).modify(),b.b = !0):(b = b.modify(),b.g = m);P(a);return;}}if(!b.K){if(d && d.Me(b))break;b.h && $o(h,b) && c && !h.J.length && Zo(h,Ek(b),m,!1);if(!ap(b.F) || b.F instanceof cp || bo(h,b) || b.H){q.push(Ek(b));m = yl(m,b.g);if(e())f();else if(Yo(h,p,null,!0,m) || !h.ec.ob(b))b = (h.l?p || b:b).modify(),b.b = !0;P(a);return;}}if(1 == b.B.nodeType){var g=b.B.style;if(b.K){if(!(b.ta || d && d.lf(b,h.l))){if(z){if(e()){f();P(a);return;}q = [];k = c = !1;m = null;}z = !1;p = Ek(b);r.push(p);m = yl(m,b.G);!g || Xo(g.paddingBottom) && Xo(g.borderBottomWidth) || (r = [p]);}}else {q.push(Ek(b));m = yl(m,b.g);if(!h.ec.ob(b) && (Yo(h,p,null,!1,m),b = b.modify(),b.b = !0,h.l)){P(a);return;}if(Nn[b.B.localName]){e()?f():Yo(h,p,null,!0,m) && (b = (h.l?p || b:b).modify(),b.b = !0);P(a);return;}!g || Xo(g.paddingTop) && Xo(g.borderTopWidth) || (k = !1,r = []);z = !0;}}}while(0);d = ko(h,b,k);if(d.Ra()){d.then(function(c){b = c;O(a);});return;}b = d.get();}Yo(h,p,r,!1,m)?p && h.l && (b = p.modify(),b.b = !0):Al[m] && (h.f = m);P(a);}).then(function(){p && (h.yb = Lk(p));M(l,b);});return l.result();}function Wo(a,b){var c=Ek(b),d=J("skipEdges"),e=null,f=!1;re(function(d){for(;b;) {do if(b.B){if(b.ta && 1 != b.B.nodeType){if(rk(b.B,b.dc))break;if(!b.K){Al[e] && (a.f = e);P(d);return;}}if(!b.K && (bo(a,b) || b.H)){e = yl(e,b.g);Al[e] && (a.f = e);P(d);return;}if(1 == b.B.nodeType){var g=b.B.style;if(b.K){if(f){if(Al[e]){a.f = e;P(d);return;}e = null;}f = !1;e = yl(e,b.G);}else {e = yl(e,b.g);if(Nn[b.B.localName]){Al[e] && (a.f = e);P(d);return;}if(g && (!Xo(g.paddingTop) || !Xo(g.borderTopWidth))){P(d);return;}}f = !0;}}while(0);g = lm(a.j,b);if(g.Ra()){g.then(function(a){b = a;O(d);});return;}b = g.get();}c = null;P(d);}).then(function(){M(d,c);});return d.result();}function lo(a,b){return Cm(b.W) || "footnote" === b.va?Ho(a,b):wo(a,b);}function ep(a,b,c,d){var e=J("layoutNext");dp(a,b,c,d || null).then(function(d){b = d;!b || a.f || a.l && b && b.b?M(e,b):Qn(b.F).Xd(b,a,c).Ea(e);});return e.result();}function Qo(a,b,c){if(b)for(var d=b.parent;b;b = d,d = d?d.parent:null) Qn((d || b).F).sd(a,d,b,c),c = !1;}function Ao(a){a.Of = [];w(a.element,"width",a.width + "px");w(a.element,"height",a.height + "px");var b=a.element.ownerDocument.createElement("div");b.style.position = "absolute";b.style.top = a.I + "px";b.style.right = a.R + "px";b.style.bottom = a.O + "px";b.style.left = a.H + "px";a.element.appendChild(b);var c=pk(a.b,b);a.element.removeChild(b);var b=a.D + a.left + $k(a),d=a.G + a.top + Yk(a);a.Kf = new $f(b,d,b + a.width,d + a.height);a.sa = c?a.u?c.top:c.left:0;a.Ka = c?a.u?c.bottom:c.right:0;a.C = c?a.u?c.right:c.top:0;a.ia = c?a.u?c.left:c.bottom:0;a.ke = a.C;a.ne = a.C;a.ie = a.C;a.ja = a.ia;var c=a.Kf,e,b=a.D + a.left + $k(a),d=a.G + a.top + Yk(a);e = new $f(b,d,b + a.width,d + a.height);if(a.xb){b = a.xb;d = e.V;e = e.S;for(var f=[],g=0;g < b.b.length;g++) {var h=b.b[g];f.push(new ag(h.f + d,h.b + e));}b = new fg(f);}else b = ig(e.V,e.S,e.U,e.P);b = [b];d = An(a.h);a.vb = sg(c,b,a.$a.concat(d),a.Kb,a.u);ro(a);a.g = 0;a.yc = !1;a.f = null;a.yb = null;}function Zo(a,b,c,d){var e=Ek(b);b = Qn(b.F);var f=om(a,e);c = b.wf(e,c,d,a.g + f);a.J.push(c);}function xo(a,b){isNaN(b) || (a.g = Math.max(bl(a) * (b - a.C),a.g));}function rm(a,b,c,d){a.Of.push(b);b.f.K && (a.yb = b.f);if(a.l && a.yc)return L(b);if(Hn(a.h,a))return b.f.K && 1 === b.f.na.length?L(null):L(b);var e=J("layout");a.fc(b.f).then(function(b){var f=null;if(b.B)f = Ek(b);else {var h=function h(b){b.w.B && (f = b.w,a.j.removeEventListener("nextInTree",h));};a.j.addEventListener("nextInTree",h);}var l=new fp(c,d);um(l,b,a).then(function(b){Vo(a,b,l.A.Id,f,l.b).then(function(b){var c=null;a.wd?c = L(null):c = gp(a,b);c.then(function(){if(on(a.h))M(e,null);else if(b){a.yc = !0;var c=new Qk(Lk(b));M(e,c);}else M(e,null);});});});});return e.result();}function gp(a,b){var c=J("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.A);d.sort(function(a,b){return a.je() - b.je();});var e=0;qe((function(){return e < d.length?d[e++].Da(b,this).wc(!0):L(!1);}).bind(a)).then(function(){M(c,!0);});return c.result();}function hp(a,b,c,d){var e=J("doLayout"),f=null;a.J = [];a.oa = null;re(function(e){for(;b;) {var g=!0;ep(a,b,c,d || null).then(function(h){c = !1;d = null;a.oa && a.l?(a.f = null,b = a.oa,b.b = !0):b = h;on(a.h)?P(e):a.f?P(e):b && a.l && b && b.b?(f = b,h = a.Rb(),b = h.w,h.pb && h.pb.A(a),P(e)):g?g = !1:O(e);});if(g){g = !1;return;}}a.g += Yn(a);P(e);}).then(function(){M(e,{w:b,Id:f});});return e.result();}function ip(a){var b=Cn(a.h);0 < b && isFinite(b) && (a.Xe = bl(a) * (b - a.C - a.g));}function to(a){for(;a;) {if(a.parentNode === a.ownerDocument)return !1;a = a.parentNode;}return !0;}function fp(a,b){tm.call(this);this.Tb = a;this.J = b || null;this.G = null;this.b = 0;this.D = !1;this.A = {Id:null};}t(fp,tm);fp.prototype.j = function(){return new jp(this.Tb,this.J,this.A);};fp.prototype.I = function(a,b){b.A = [];b.wd || (kp = []);};fp.prototype.l = function(a,b){tm.prototype.l.call(this,a,b);this.G = b.f;this.b = b.g;this.D = b.yc;};fp.prototype.f = function(a,b){tm.prototype.f.call(this,a,b);b.f = this.G;b.g = this.b;b.yc = this.D;};function jp(a,b,c){this.Tb = a;this.j = b;this.h = c;}jp.prototype.b = function(a,b){var c=J("adapt.layout.DefaultLayoutMode.doLayout");lp(a,b).then((function(){hp(b,a,this.Tb,this.j).then((function(a){this.h.Id = a.Id;M(c,a.w);}).bind(this));}).bind(this));return c.result();};jp.prototype.f = function(a,b){return on(b.h) || b.f || 0 >= b.A.length?!0:b.A.every((function(c){return c.ob(a,this.h.Id,b);}).bind(this));};jp.prototype.g = function(a,b,c,d){d || (d = !c.A.some(function(b){return b.$c(a);}));c.A.forEach(function(e){e.Tc(d,a,b,c);});return d;};function mp(){}n = mp.prototype;n.Xd = function(a,b){var c;if(bo(b,a))c = lo(b,a);else {a: if(a.K)c = !0;else {switch(a.N.namespaceURI){case "http://www.w3.org/2000/svg":c = !1;break a;}c = !a.H;}c = c?Oo(b,a):no(b,a);}return c;};n.wf = function(a,b,c,d){return new sm(Ek(a),b,c,d);};n.Me = function(){return !1;};n.lf = function(){return !1;};n.sd = function(a,b,c,d){if(c.B && c.B.parentNode){a = c.B.parentNode;b = c.B;if(a)for(var e;(e = a.lastChild) != b;) a.removeChild(e);d && a.removeChild(c.B);}};n.Da = function(a,b,c,d){c = c || !!b.B && 1 == b.B.nodeType && !b.K;Qo(a,b,c);d && (Io(a,b,!0),pp(c?b:b.parent));return L(!0);};var Uo=new mp();Td("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b = a.parent;return !b && a.F?null:b && a.F !== b.F?null:a.Wc || !a.F && Cl(c,d,e,f).display === Oc?new ao(b?b.F:null):null;});Td("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof ao?Uo:null;});function zo(a,b,c,d,e,f,g){pm.call(this,b,c,d,e,f);this.va = a;this.Tf = g;this.gd = [];this.Rf = [];this.ge = !0;}t(zo,pm);zo.prototype.fc = function(a){return pm.prototype.fc.call(this,a).fa((function(a){if(a){for(var b=a;b.parent;) b = b.parent;b = b.B;this.gd.push(b);this.ge && qp(this,b);this.Rf.push(uo(this,b));if(this.ge){var d=this.va;if(this.Tf.u){if("block-end" === d || "left" === d)d = Ca(b,"height"),"" !== d && "auto" !== d && w(b,"margin-top","auto");}else if("block-end" === d || "bottom" === d)d = Ca(b,"width"),"" !== d && "auto" !== d && w(b,"margin-left","auto");}}return L(a);}).bind(this));};function qp(a,b){function c(a,c){a.forEach(function(a){var d=Ca(b,a);d && "%" === d.charAt(d.length - 1) && w(b,a,c * parseFloat(d) / 100 + "px");});}var d=il(a.Tf),e=d.U - d.V,d=d.P - d.S;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto" === Ca(b,a) && w(b,a,"0");});}function zn(a){return Math.max.apply(null,a.gd.map(function(a,c){var b=pk(this.b,a),e=this.Rf[c];return this.u?e.top + b.height + e.bottom:e.left + b.width + e.right;},a));}function rp(a,b,c){var d=pk(b.b,a);a = uo(b,a);return c?d.width + a.left + a.right:d.height + a.top + a.bottom;};function sp(a,b){this.b = a;this.aa = b;}function tp(a,b,c,d){this.b = a;this.g = b;this.j = c;this.f = d;this.h = null;}function up(a,b){this.b = a;this.f = b;}function vp(a){var b={};Object.keys(a).forEach(function(c){b[c] = Array.from(a[c]);});return b;}function wp(a,b){this.vc = a;this.fd = b;this.xe = null;this.aa = this.T = -1;}function nj(a,b,c){b = a.b.J.Ee(b,a.f);a.b.l[b] = c;}function xp(a){return (a = a.match(/^[^#]*#(.*)$/))?a[1]:null;}function yp(a,b){var c=a.b.J.nd(pa(b,a.g),a.g);"#" === c.charAt(0) && (c = c.substring(1));return c;}function Qi(a,b,c){var d=new xb(a.f,function(){var d=a.b.b[b];return c(d && d.length?d[d.length - 1]:null);},"page-counter-" + b);zp(a.b,b,function(a){return c(a[0]);},d);return d;}function Si(a,b,c){var d=new xb(a.f,function(){return c(a.b.b[b] || []);},"page-counters-" + b);zp(a.b,b,c,d);return d;}function Ap(a,b,c,d){var e=a.b.l[c];if(!e && d && b){d = a.h;if(b){d.D = b;for(b = 0;d.D && (b += 5E3,Pl(d,b,0) !== Number.POSITIVE_INFINITY););d.D = null;}e = a.b.l[c];}return e || null;}function Ui(a,b,c,d){var e=xp(b),f=yp(a,b),g=Ap(a,e,f,!1);return g && g[c]?(b = g[c],new vb(a.j,d(b[b.length - 1] || null))):new xb(a.f,function(){if(g = Ap(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length - 1] || null);}if(b = a.b.j.b[f]?a.b.b:a.b.C[f] || null)return Bp(a.b,f),b[c]?(b = b[c],d(b[b.length - 1] || null)):d(0);Cp(a.b,f,!1);return "??";}Cp(a.b,f,!1);return "??";},"target-counter-" + c + "-of-" + b);}function Wi(a,b,c,d){var e=xp(b),f=yp(a,b);return new xb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.C[f] || null;if(b){Bp(a.b,f);var b=b[c] || [],h=Ap(a,e,f,!0)[c] || [];return d(b.concat(h));}Cp(a.b,f,!1);return "??";},"target-counters-" + c + "-of-" + b);}function Dp(a){this.J = a;this.l = {};this.C = {};this.b = {};this.b.page = [0];this.H = {};this.G = [];this.D = {};this.j = null;this.A = [];this.g = [];this.I = [];this.f = {};this.h = {};this.ze = [];}function Ep(a,b){var c=a.b.page;c && c.length?c[c.length - 1] = b:a.b.page = [b];}function Fp(a,b,c){a.H = vp(a.b);var d,e=b["counter-reset"];e && (e = e.evaluate(c)) && (d = Dg(e,!0));if(d)for(var f in d) {var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g] = [h];}var l;(b = b["counter-increment"]) && (c = b.evaluate(c)) && (l = Dg(c,!1));l?"page" in l || (l.page = 1):l = {page:1};for(var k in l) a.b[k] || (c = a,b = k,c.b[b]?c.b[b].push(0):c.b[b] = [0]),c = a.b[k],c[c.length - 1] += l[k];}function Gp(a,b){a.G.push(a.b);a.b = vp(b);}function Bp(a,b){var c=a.f[b],d=a.h[b];d || (d = a.h[b] = []);for(var e=!1,f=0;f < a.g.length;) {var g=a.g[f];g.vc === b?(g.fd = !0,a.g.splice(f,1),c && (e = c.indexOf(g),0 <= e && c.splice(e,1)),d.push(g),e = !0):f++;}e || Cp(a,b,!0);}function Cp(a,b,c){a.A.some(function(a){return a.vc === b;}) || a.A.push(new wp(b,c));}function Hp(a,b,c){var d=Object.keys(a.j.b);if(0 < d.length){var e=vp(a.b);d.forEach(function(a){this.C[a] = e;var d=this.D[a];if(d && d.aa < c && (d = this.h[a])){var f=this.f[a];f || (f = this.f[a] = []);for(var g;g = d.shift();) g.fd = !1,f.push(g);}this.D[a] = {T:b,aa:c};},a);}for(var d=a.H,f;f = a.A.shift();) {f.xe = d;f.T = b;f.aa = c;var g;f.fd?(g = a.h[f.vc]) || (g = a.h[f.vc] = []):(g = a.f[f.vc]) || (g = a.f[f.vc] = []);g.every(function(a){return !(f === a || a && f.vc === a.vc && f.fd === a.fd && f.T === a.T && f.aa === a.aa);}) && g.push(f);}a.j = null;}function Ip(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a = this.f[a]) && (c = c.concat(a));},a);c.sort(function(a,b){return a.T - b.T || a.aa - b.aa;});var d=[],e=null;c.forEach(function(a){e && e.T === a.T && e.aa === a.aa?e.Kd.push(a):(e = {T:a.T,aa:a.aa,xe:a.xe,Kd:[a]},d.push(e));});return d;}function Jp(a,b){a.I.push(a.g);a.g = b;}function zp(a,b,c,d){"pages" === b && a.ze.push({Cc:d,format:c});}function Kp(a){return a.O.bind(a);}Dp.prototype.O = function(a,b,c){return 0 <= this.ze.findIndex(function(b){return b.Cc === a;})?(c = c.createElement("span"),c.textContent = b,c.setAttribute("data-vivliostyle-pages-counter",a.g),c):null;};function Lp(a,b){var c=a.b.page[0];Array.from(b.root.querySelectorAll("[data-vivliostyle-pages-counter]")).forEach(function(a){var b=a.getAttribute("data-vivliostyle-pages-counter"),d=this.ze.findIndex(function(a){return a.Cc.g === b;});a.textContent = this.ze[d].format([c]);},a);}sp.prototype.ob = function(a){if(!a || a.K)return !0;a = a.B;if(!a || 1 !== a.nodeType)return !0;a = a.getAttribute("id") || a.getAttribute("name");return a && (this.b.h[a] || this.b.f[a])?(a = this.b.D[a])?this.aa >= a.aa:!0:!0;};var Mp=1;function Np(a,b,c,d,e){this.b = {};this.j = [];this.g = null;this.index = 0;this.f = a;this.name = b;this.Zb = c;this.Ga = d;this.parent = e;this.l = "p" + Mp++;e && (this.index = e.j.length,e.j.push(this));}Np.prototype.h = function(){throw Error("E_UNEXPECTED_CALL");};Np.prototype.clone = function(){throw Error("E_UNEXPECTED_CALL");};function Op(a,b){var c=a.b,d=b.b,e;for(e in c) Object.prototype.hasOwnProperty.call(c,e) && (d[e] = c[e]);}function Pp(a,b){for(var c=0;c < a.j.length;c++) a.j[c].clone({parent:b});}function Qp(a){Np.call(this,a,null,null,[],null);this.b.width = new V(Md,0);this.b.height = new V(Nd,0);}t(Qp,Np);function Rp(a,b){this.g = b;var c=this;ub.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.A[d[1]];if(e && (e = this.Fa[e])){if(b){var d=d[2],h=e.ia[d];if(h)e = h;else {switch(d){case "columns":var h=e.b.f,l=new mc(h,0),k=Sp(e,"column-count"),m=Sp(e,"column-width"),p=Sp(e,"column-gap"),h=y(h,oc(h,new jc(h,"min",[l,k]),x(h,m,p)),p);}h && (e.ia[d] = h);e = h;}}else e = Sp(e,d[2]);return e;}}return null;});}t(Rp,ub);function Tp(a,b,c,d,e,f,g){a = a instanceof Rp?a:new Rp(a,this);Np.call(this,a,b,c,d,e);this.g = this;this.ga = f;this.$ = g;this.b.width = new V(Md,0);this.b.height = new V(Nd,0);this.b["wrap-flow"] = new V(Lc,0);this.b.position = new V(td,0);this.b.overflow = new V(Jd,0);this.b.top = new V(new D(-1,"px"),0);this.A = {};}t(Tp,Np);Tp.prototype.h = function(a){return new Up(a,this);};Tp.prototype.clone = function(a){a = new Tp(this.f,this.name,a.Zb || this.Zb,this.Ga,this.parent,this.ga,this.$);Op(this,a);Pp(this,a);return a;};function Vp(a,b,c,d,e){Np.call(this,a,b,c,d,e);this.g = e.g;b && (this.g.A[b] = this.l);this.b["wrap-flow"] = new V(Lc,0);}t(Vp,Np);Vp.prototype.h = function(a){return new Wp(a,this);};Vp.prototype.clone = function(a){a = new Vp(a.parent.f,this.name,this.Zb,this.Ga,a.parent);Op(this,a);Pp(this,a);return a;};function Xp(a,b,c,d,e){Np.call(this,a,b,c,d,e);this.g = e.g;b && (this.g.A[b] = this.l);}t(Xp,Np);Xp.prototype.h = function(a){return new Yp(a,this);};Xp.prototype.clone = function(a){a = new Xp(a.parent.f,this.name,this.Zb,this.Ga,a.parent);Op(this,a);Pp(this,a);return a;};function Y(a,b,c){return b && b !== Lc?b.ua(a,c):null;}function Zp(a,b,c){return b && b !== Lc?b.ua(a,c):a.b;}function $p(a,b,c){return b?b === Lc?null:b.ua(a,c):a.b;}function aq(a,b,c,d){return b && c !== F?b.ua(a,d):a.b;}function bq(a,b,c){return b?b === Kd?a.j:b === Zc?a.h:b.ua(a,a.b):c;}function cq(a,b){this.f = a;this.b = b;this.J = {};this.style = {};this.C = this.D = null;this.A = [];this.O = this.R = this.g = this.h = !1;this.H = this.I = 0;this.G = null;this.ja = {};this.ia = {};this.sa = this.u = !1;a && a.A.push(this);}function dq(a){a.I = 0;a.H = 0;}function eq(a,b,c){b = Sp(a,b);c = Sp(a,c);if(!b || !c)throw Error("E_INTERNAL");return x(a.b.f,b,c);}function Sp(a,b){var c=a.ja[b];if(c)return c;var d=a.style[b];d && (c = d.ua(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c = Sp(a,"left");break;case "margin-top-edge":c = Sp(a,"top");break;case "margin-right-edge":c = eq(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c = eq(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c = eq(a,"margin-left-edge","margin-left");break;case "border-top-edge":c = eq(a,"margin-top-edge","margin-top");break;case "border-right-edge":c = eq(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c = eq(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c = eq(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c = eq(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c = eq(a,"right-edge","padding-right");break;case "padding-bottom-edge":c = eq(a,"bottom-edge","padding-bottom");break;case "left-edge":c = eq(a,"padding-left-edge","padding-left");break;case "top-edge":c = eq(a,"padding-top-edge","padding-top");break;case "right-edge":c = eq(a,"left-edge","width");break;case "bottom-edge":c = eq(a,"top-edge","height");}if(!c){if("extent" == b)d = a.u?"width":"height";else if("measure" == b)d = a.u?"height":"width";else {var e=a.u?Bh:Ch,d=b,f;for(f in e) d = d.replace(f,e[f]);}d != b && (c = Sp(a,d));}c && (a.ja[b] = c);return c;}function fq(a){var b=a.b.f,c=a.style,d=bq(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new hc(b,"page-number"),d=nc(b,d,new $b(b,e,f));(e = Y(b,c["min-page-width"],b.b)) && (d = nc(b,d,new Zb(b,new hc(b,"page-width"),e)));(e = Y(b,c["min-page-height"],b.b)) && (d = nc(b,d,new Zb(b,new hc(b,"page-height"),e)));d = a.X(d);c.enabled = new E(d);}cq.prototype.X = function(a){return a;};cq.prototype.pe = function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ua(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=aq(a,b["border-left-width"],b["border-left-style"],c),g=Zp(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=Zp(a,b["padding-right"],c),m=aq(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=x(a,f,g),z=x(a,f,k);d && q && h?(r = y(a,c,x(a,h,x(a,x(a,d,r),z))),e?p?q = y(a,r,p):p = y(a,r,x(a,q,e)):(r = y(a,r,q),p?e = y(a,r,p):p = e = oc(a,r,new vb(a,.5)))):(e || (e = a.b),p || (p = a.b),d || q || h || (d = a.b),d || h?d || q?h || q || (h = this.D,this.h = !0):d = a.b:(h = this.D,this.h = !0),r = y(a,c,x(a,x(a,e,r),x(a,p,z))),this.h && (l || (l = y(a,r,d?d:q)),this.u || !Y(a,b["column-width"],null) && !Y(a,b["column-count"],null) || (h = l,this.h = !1)),d?h?q || (q = y(a,r,x(a,d,h))):h = y(a,r,x(a,d,q)):d = y(a,r,x(a,q,h)));a = Zp(a,b["snap-width"] || (this.f?this.f.style["snap-width"]:null),c);b.left = new E(d);b["margin-left"] = new E(e);b["border-left-width"] = new E(f);b["padding-left"] = new E(g);b.width = new E(h);b["max-width"] = new E(l?l:h);b["padding-right"] = new E(k);b["border-right-width"] = new E(m);b["margin-right"] = new E(p);b.right = new E(q);b["snap-width"] = new E(a);};cq.prototype.qe = function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ua(a,null):null,d=this.f?this.f.style.height.ua(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=aq(a,b["border-top-width"],b["border-top-style"],c),h=Zp(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=Zp(a,b["padding-bottom"],c),p=aq(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=x(a,g,h),u=x(a,p,m);e && r && l?(d = y(a,d,x(a,l,x(a,x(a,e,z),u))),f?q?r = y(a,d,f):q = y(a,d,x(a,r,f)):(d = y(a,d,r),q?f = y(a,d,q):q = f = oc(a,d,new vb(a,.5)))):(f || (f = a.b),q || (q = a.b),e || r || l || (e = a.b),e || l?e || r?l || r || (l = this.C,this.g = !0):e = a.b:(l = this.C,this.g = !0),d = y(a,d,x(a,x(a,f,z),x(a,q,u))),this.g && (k || (k = y(a,d,e?e:r)),this.u && (Y(a,b["column-width"],null) || Y(a,b["column-count"],null)) && (l = k,this.g = !1)),e?l?r || (r = y(a,d,x(a,e,l))):l = y(a,d,x(a,r,e)):e = y(a,d,x(a,r,l)));a = Zp(a,b["snap-height"] || (this.f?this.f.style["snap-height"]:null),c);b.top = new E(e);b["margin-top"] = new E(f);b["border-top-width"] = new E(g);b["padding-top"] = new E(h);b.height = new E(l);b["max-height"] = new E(k?k:l);b["padding-bottom"] = new E(m);b["border-bottom-width"] = new E(p);b["margin-bottom"] = new E(q);b.bottom = new E(r);b["snap-height"] = new E(a);};function gq(a){var b=a.b.f,c=a.style;a = Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f = (f = c["column-gap"]) && f !== pd?f.ua(b,null):null) || (f = new gc(b,1,"em"));d && !e && (e = new jc(b,"floor",[pc(b,x(b,a,f),x(b,d,f))]),e = new jc(b,"max",[b.f,e]));e || (e = b.f);d = y(b,pc(b,x(b,a,f),e),f);c["column-width"] = new E(d);c["column-count"] = new E(e);c["column-gap"] = new E(f);}function hq(a,b,c,d){a = a.style[b].ua(a.b.f,null);return Jb(a,c,d,{});}function iq(a,b){b.Fa[a.b.l] = a;var c=a.b.f,d=a.style,e=a.f?jq(a.f,b):null,e=Aj(a.J,b,e,!1);a.u = zj(e,b,a.f?a.f.u:!1);Ej(e,d,a.u,function(a,b){return b.value;});a.D = new xb(c,function(){return a.I;},"autoWidth");a.C = new xb(c,function(){return a.H;},"autoHeight");a.pe();a.qe();gq(a);fq(a);}function kq(a,b,c){(a = a.style[c]) && (a = Zf(b,a,c));return a;}function Z(a,b,c){(a = a.style[c]) && (a = Zf(b,a,c));return Hc(a,b);}function jq(a,b){var c;a: {if(c = a.J["region-id"]){for(var d=[],e=0;e < c.length;e++) {var f=c[e].evaluate(b,"");f && f !== B && d.push(f);}if(d.length){c = d;break a;}}c = null;}if(c){d = [];for(e = 0;e < c.length;e++) d[e] = c[e].toString();return d;}return null;}function lq(a,b,c,d,e){if(a = kq(a,b,d))a.nc() && Bb(a.ha) && (a = new D(Hc(a,b),"px")),"font-family" === d && (a = am(e,a)),w(c,d,a.toString());}function mq(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a = Z(a,b,"width");el(c,d,a);w(c.element,"margin-left",e + "px");w(c.element,"padding-left",f + "px");w(c.element,"border-left-width",g + "px");c.marginLeft = e;c.X = g;c.H = f;}function nq(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b = Z(a,b,"border-right-width");w(c.element,"margin-right",f + "px");w(c.element,"padding-right",g + "px");w(c.element,"border-right-width",b + "px");c.marginRight = f;c.Ja = b;a.u && 0 < e && (a = d + al(c),a -= Math.floor(a / e) * e,0 < a && (c.zd = e - a,g += c.zd));c.R = g;c.Ad = e;}function oq(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b = Z(a,b,"border-top-width");c.top = e;c.marginTop = f;c.Z = b;c.Kb = d;!a.u && 0 < d && (a = e + Yk(c),a -= Math.floor(a / d) * d,0 < a && (c.ib = d - a,g += c.ib));c.I = g;w(c.element,"top",e + "px");w(c.element,"margin-top",f + "px");w(c.element,"padding-top",g + "px");w(c.element,"border-top-width",b + "px");}function pq(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a = Z(a,b,"height") - c.ib;w(c.element,"height",a + "px");w(c.element,"margin-bottom",d + "px");w(c.element,"padding-bottom",e + "px");w(c.element,"border-bottom-width",f + "px");c.height = a - c.ib;c.marginBottom = d;c.Fa = f;c.O = e;}function qq(a,b,c){a.u?(oq(a,b,c),pq(a,b,c)):(nq(a,b,c),mq(a,b,c));}function rq(a,b,c){w(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.R?dl(c,0,d):(oq(a,b,c),d -= c.ib,c.height = d,w(c.element,"height",d + "px"));}function sq(a,b,c){w(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?el(c,0,d):(nq(a,b,c),d -= c.zd,c.width = d,a = Z(a,b,"right"),w(c.element,"right",a + "px"),w(c.element,"width",d + "px"));}var tq="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),uq="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),vq="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),wq=["width","height"],xq=["transform","transform-origin"];cq.prototype.Xb = function(a,b,c,d){this.f && this.u == this.f.u || w(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?sq(this,a,b):rq(this,a,b):(this.u?nq(this,a,b):oq(this,a,b),this.u?mq(this,a,b):pq(this,a,b));(this.u?this.g:this.h)?this.u?rq(this,a,b):sq(this,a,b):qq(this,a,b);for(c = 0;c < tq.length;c++) lq(this,a,b.element,tq[c],d);};function yq(a,b,c,d){for(var e=0;e < vq.length;e++) lq(a,b,c.element,vq[e],d);}function zq(a,b,c,d){for(var e=0;e < wq.length;e++) lq(a,b,c,wq[e],d);}cq.prototype.Dd = function(a,b,c,d,e,f,g){this.u?this.I = b.g + b.zd:this.H = b.g + b.ib;var h=(this.u || !d) && this.g,l=(!this.u || !d) && this.h;if(l || h)l && w(b.element,"width","auto"),h && w(b.element,"height","auto"),d = pk(f,d?d.element:b.element),l && (this.I = Math.ceil(d.right - d.left - b.H - b.X - b.R - b.Ja),this.u && (this.I += b.zd)),h && (this.H = d.bottom - d.top - b.I - b.Z - b.O - b.Fa,this.u || (this.H += b.ib));(this.u?this.g:this.h) && qq(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.R)this.u?nq(this,a,b):oq(this,a,b);this.u?mq(this,a,b):pq(this,a,b);}if(1 < e && (l = Z(this,a,"column-rule-width"),d = kq(this,a,"column-rule-style"),f = kq(this,a,"column-rule-color"),0 < l && d && d != F && f != Gd))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,p=this.u?"border-top":"border-left",h=1;h < e;h++) {var q=(m + k) * h / e - k / 2 + b.H - l / 2,r=b.height + b.I + b.O,z=b.element.ownerDocument.createElement("div");w(z,"position","absolute");w(z,this.u?"left":"top","0px");w(z,this.u?"top":"left",q + "px");w(z,this.u?"height":"width","0px");w(z,this.u?"width":"height",r + "px");w(z,p,l + "px " + d.toString() + (f?" " + f.toString():""));b.element.insertBefore(z,b.element.firstChild);}for(h = 0;h < uq.length;h++) lq(this,a,b.element,uq[h],g);for(h = 0;h < xq.length;h++) e = b,g = xq[h],l = c.A,(d = kq(this,a,g)) && l.push(new hk(e.element,g,d));};cq.prototype.j = function(a,b){var c=this.J,d=this.b.b,e;for(e in d) Gh(e) && Hh(c,e,d[e]);if("background-host" == this.b.Zb)for(e in b) if(e.match(/^background-/) || "writing-mode" == e)c[e] = b[e];if("layout-host" == this.b.Zb)for(e in b) e.match(/^background-/) || "writing-mode" == e || (c[e] = b[e]);fj(a,this.b.Ga,null,c);c.content && (c.content = c.content.Cd(new Ji(a,null,a.vb)));iq(this,a.l);for(c = 0;c < this.b.j.length;c++) this.b.j[c].h(this).j(a,b);a.pop();};function Aq(a,b){a.h && (a.O = hq(a,"right",a.D,b) || hq(a,"margin-right",a.D,b) || hq(a,"border-right-width",a.D,b) || hq(a,"padding-right",a.D,b));a.g && (a.R = hq(a,"top",a.C,b) || hq(a,"margin-top",a.C,b) || hq(a,"border-top-width",a.C,b) || hq(a,"padding-top",a.C,b));for(var c=0;c < a.A.length;c++) Aq(a.A[c],b);}function Bq(a){cq.call(this,null,a);}t(Bq,cq);Bq.prototype.j = function(a,b){cq.prototype.j.call(this,a,b);this.A.sort(function(a,b){return b.b.$ - a.b.$ || a.b.index - b.b.index;});};function Up(a,b){cq.call(this,a,b);this.G = this;}t(Up,cq);Up.prototype.X = function(a){var b=this.b.g;b.ga && (a = nc(b.f,a,b.ga));return a;};Up.prototype.Z = function(){};function Wp(a,b){cq.call(this,a,b);this.G = a.G;}t(Wp,cq);function Yp(a,b){cq.call(this,a,b);this.G = a.G;}t(Yp,cq);function Cq(a,b,c,d){var e=null;c instanceof Bc && (e = [c]);c instanceof uc && (e = c.values);if(e)for(a = a.b.f,c = 0;c < e.length;c++) if(e[c] instanceof Bc){var f=sb(e[c].name,"enabled"),f=new hc(a,f);d && (f = new Qb(a,f));b = nc(a,b,f);}return b;}Yp.prototype.X = function(a){var b=this.b.f,c=this.style,d=bq(b,c.required,b.h) !== b.h;if(d || this.g){var e;e = (e = c["flow-from"])?e.ua(b,b.b):new vb(b,"body");e = new jc(b,"has-content",[e]);a = nc(b,a,e);}a = Cq(this,a,c["required-partitions"],!1);a = Cq(this,a,c["conflicting-partitions"],!0);d && (c = (c = this.G.style.enabled)?c.ua(b,null):b.j,c = nc(b,c,a),this.G.style.enabled = new E(c));return a;};Yp.prototype.Xb = function(a,b,c,d,e){w(b.element,"overflow","hidden");cq.prototype.Xb.call(this,a,b,c,d,e);};function Dq(a,b,c,d){sf.call(this,a,b,!1);this.target = c;this.b = d;}t(Dq,tf);Dq.prototype.Db = function(a,b,c){oh(this.b,a,b,c,this);};Dq.prototype.Ud = function(a,b){uf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};Dq.prototype.Yc = function(a,b){uf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};Dq.prototype.Eb = function(a,b,c){this.target.b[a] = new V(b,c?50331648:67108864);};function Eq(a,b,c,d){Dq.call(this,a,b,c,d);}t(Eq,Dq);function Fq(a,b,c,d){Dq.call(this,a,b,c,d);c.b.width = new V(Ld,0);c.b.height = new V(Ld,0);}t(Fq,Dq);Fq.prototype.ld = function(a,b,c){a = new Xp(this.f,a,b,c,this.target);rf(this.ma,new Eq(this.f,this.ma,a,this.b));};Fq.prototype.kd = function(a,b,c){a = new Vp(this.f,a,b,c,this.target);a = new Fq(this.f,this.ma,a,this.b);rf(this.ma,a);};function Gq(a,b,c,d){Dq.call(this,a,b,c,d);}t(Gq,Dq);Gq.prototype.ld = function(a,b,c){a = new Xp(this.f,a,b,c,this.target);rf(this.ma,new Eq(this.f,this.ma,a,this.b));};Gq.prototype.kd = function(a,b,c){a = new Vp(this.f,a,b,c,this.target);a = new Fq(this.f,this.ma,a,this.b);rf(this.ma,a);};function Hq(a){a = a.toString();switch(a){case "inline-flex":a = "flex";break;case "inline-grid":a = "grid";break;case "inline-table":a = "table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a = "block";}return C(a);}function Cl(a,b,c,d){if(a !== F)if(b === Ic || b === $c)c = F,a = Hq(a);else if(c && c !== F || d)a = Hq(a);return {display:a,position:b,qa:c};}function Iq(a,b,c,d,e,f,g){e = e || f || ed;return !!g || !!c && c !== F || b === Ic || b === $c || a === hd || a === Cd || a === Bd || a == ad || (a === Oc || a === nd) && !!d && d !== Jd || !!f && e !== f;};function Jq(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return 'url("' + c.nd(e,b) + '"';}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return "url('" + c.nd(e,b) + "'";}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return "url(" + c.nd(e,b);});};var Kq={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},Lq={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},Mq={"margin-top":"0px"},Nq={"margin-right":"0px"},Oq={};function Pq(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem = {name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function hasFeature(a){switch(a){case "mouse-events":return !0;}return !1;}};},!1);}var Qq=new DOMParser().parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Rq="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");function Sq(a,b){a.setAttribute("data-adapt-pseudo",b);}function Tq(a,b,c,d,e){this.style = b;this.element = a;this.b = c;this.g = d;this.h = e;this.f = {};}Tq.prototype.l = function(a){var b=a.getAttribute("data-adapt-pseudo") || "";this.b && b && b.match(/after$/) && (this.style = this.b.l(this.element,!0),this.b = null);a = this.style._pseudos[b] || {};if(b.match(/^first-/) && !a["x-first-pseudo"]){var c=1;if("first-letter" == b)c = 0;else if(b = b.match(/^first-([0-9]+)-lines$/))c = b[1] - 0;a["x-first-pseudo"] = new V(new Dc(c),0);}return a;};Tq.prototype.oa = function(a,b){var c=a.getAttribute("data-adapt-pseudo") || "";this.f[c] || (this.f[c] = !0,(c = b.content) && ml(c) && c.ca(new ll(a,this.g,c,this.h)));};function Uq(a,b,c,d,e,f,g,h,l,k,m,p,q){this.h = {};this.I = a;this.b = b;this.viewport = c;this.G = c.b;this.l = d;this.C = Kp(d.Ja.b);this.A = e;this.ba = f;this.J = g;this.D = h;this.O = l;this.page = k;this.g = m;this.H = p;this.j = q;this.R = this.w = null;this.f = !1;this.N = null;this.la = 0;this.B = null;}t(Uq,Ta);Uq.prototype.clone = function(){return new Uq(this.I,this.b,this.viewport,this.l,this.A,this.ba,this.J,this.D,this.O,this.page,this.g,this.H,this.j);};function Vq(a,b,c,d){a = a._pseudos;if(!a)return null;var e={},f;for(f in a) {var g=e[f] = {};Dj(g,a[f],d);Bj(g,d,a[f]);Cj(a[f],b,c,function(a,b){Dj(g,b,d);Wq(b,function(a){Dj(g,a,d);});});}return e;}function Xq(a,b,c,d,e,f){var g=J("createRefShadow");a.ba.A.load(b).then(function(h){if(h){var l=Rj(h,b);if(l){var k=a.O,m=k.I[h.url];if(!m){var m=k.style.l.f[h.url],p=new Cb(0,k.Wb(),k.Vb(),k.A),m=new Hl(h,m.g,m.f,p,k.l,m.A,new up(k.h,h.url),new tp(k.h,h.url,m.f,m.b));k.I[h.url] = m;}f = new Fk(d,l,h,e,f,c,m);}}M(g,f);});return g.result();}function Yq(a,b,c,d,e,f,g,h){var l=J("createShadows"),k=e.template,m;k instanceof Fc?m = Xq(a,k.url,2,b,h,null):m = L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow" == b.namespaceURI && "include" == b.localName){var p=b.getAttribute("href"),z=null;p?z = h?h.ba:a.ba:h && (p = "http://www.w3.org/1999/xhtml" == h.ma.namespaceURI?h.ma.getAttribute("href"):h.ma.getAttributeNS("http://www.w3.org/1999/xlink","href"),z = h.bd?h.bd.ba:a.ba);p && (p = pa(p,z.url),m = Xq(a,p,3,b,h,k));}m || (m = L(k));var u=null;m.then(function(c){e.display === Cd?u = Xq(a,pa("user-agent.xml#table-cell",oa),2,b,h,c):u = L(c);});u.then(function(k){var m=Vq(d,a.A,a.f,g);if(m){for(var p=[],q=Qq.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=0;u < Rq.length;u++) {var z=Rq[u],A;if(z){if(!m[z])continue;if(!("footnote-marker" != z || c && a.f))continue;if(z.match(/^first-/) && (A = e.display,!A || A === gd))continue;if("before" === z || "after" === z)if((A = m[z].content,!A || A === pd || A === F))continue;p.push(z);A = Qq.createElementNS("http://www.w3.org/1999/xhtml","span");Sq(A,z);}else A = Qq.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/) && (r = A);}k = p.length?new Fk(b,q,null,h,k,2,new Tq(b,d,f,g,a.C)):k;}M(l,k);});});return l.result();}function co(a,b,c){a.R = b;a.f = c;}function Zq(a,b,c,d){var e=a.b;c = Aj(c,e,a.A,a.f);b = zj(c,e,b);Ej(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family" == b && (d = am(a.J,d));return d;});var f=Cl(d.display || gd,d.position,d["float"],a.N === a.ba.root);["display","position","float"].forEach(function(a){f[a] && (d[a] = f[a]);});return b;}function $q(a,b){for(var c=a.w.N,d=[],e=null,f=a.w.ra,g=-1;c && 1 == c.nodeType;) {var h=f && f.root == c;if(!h || 2 == f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e = e || Da(c);}h?(c = f.ma,f = f.bd):(c = c.parentNode,g++);}c = Eb(a.b,"em",!g);c = {"font-size":new V(new D(c,"px"),0)};f = new Nh(c,a.b);for(g = d.length - 1;0 <= g;--g) {var h=d[g],l=[],k;for(k in h) qh[k] && l.push(k);l.sort(Qd);for(var m=0;m < l.length;m++) {var p=l[m];f.b = p;var q=h[p];q.value !== fd && (c[p] = q.Cd(f));}}for(var r in b) qh[r] || (c[r] = b[r]);return {lang:e,bb:c};}var ar={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function br(a,b){b = pa(b,a.ba.url);return a.H[b] || b;}function cr(a){a.w.lang = Da(a.w.N) || a.w.parent && a.w.parent.lang || a.w.lang;}function dr(a,b){var c=sh().filter(function(a){return b[a];});if(c.length){var d=a.w.Cb;if(a.w.parent){var d=a.w.Cb = {},e;for(e in a.w.parent.Cb) d[e] = a.w.parent.Cb[e];}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Dc)d[a] = c.L;else if(c instanceof Bc)d[a] = c.name;else if(c instanceof D)switch(c.ha){case "dpi":case "dpcm":case "dppx":d[a] = c.L * Ab[c.ha];}else d[a] = c;delete b[a];}});}}function er(a,b,c,d,e,f){for(var g=Ud("RESOLVE_FORMATTING_CONTEXT"),h=0;h < g.length;h++) {var l=g[h](a,b,c,d,e,f);if(l){a.F = l;break;}}}function fr(a,b,c){var d=!0,e=J("createElementView"),f=a.N,g=a.w.ra?a.w.ra.b:a.l,h=g.l(f,!1);if(!a.w.ra){var l=Mj(a.ba,f);gr(l,a.w.Ma,0);}var k={};a.w.parent || (l = $q(a,h),h = l.bb,a.w.lang = l.lang);var m=h["float-reference"] && Bm(h["float-reference"].value.toString());a.w.parent && m && Cm(m) && (l = $q(a,h),h = l.bb,a.w.lang = l.lang);a.w.u = Zq(a,a.w.u,h,k);g.oa(f,k);dr(a,k);cr(a);k.direction && (a.w.sa = k.direction.toString());if((l = k["flow-into"]) && l.toString() != a.I)return M(e,!1),e.result();var p=k.display;if(p === F)return M(e,!1),e.result();var q=!a.w.parent;a.w.H = p === ad;Yq(a,f,q,h,k,g,a.b,a.w.ra).then(function(l){a.w.Aa = l;l = k.position;var r=k["float"],u=k.clear,A=a.w.u?Id:ed,H=a.w.parent?a.w.parent.u?Id:ed:A,G="true" === f.getAttribute("data-vivliostyle-flow-root");a.w.Wc = Iq(p,l,r,k.overflow,A,H,G);a.w.J = l === td || l === Ic || l === $c;!Nk(a.w) || r === bd || m && Cm(m) || (u = r = null);A = r === ld || r === ud || r === Fd || r === Sc || r === jd || r === id || r === Qc || r === Pc || r === xd || r === bd;r && (delete k["float"],r === bd && (a.f?(A = !1,k.display = Oc):k.display = gd));u && (u === fd && a.w.parent && a.w.parent.h && (u = C(a.w.parent.h)),u === ld || u === ud || u === Fd || u === Sc || u === Rc || u === Jc || u === vd) && (delete k.clear,k.display && k.display != gd && (a.w.h = u.toString()));var K=p === nd && k["ua-list-item-count"];(A || k["break-inside"] && k["break-inside"] !== Lc) && a.w.j++;if(!(u = !A && !p))a: switch(p.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":u = !0;break a;default:u = !1;}if(!u)a: switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u = !0;break a;default:u = !1;}a.w.ta = u;a.w.display = p?p.toString():"inline";a.w.va = A?r.toString():null;a.w.W = m || Hk;a.w.kc = k["float-min-wrap-block"] || null;a.w.X = k["column-span"];if(!a.w.ta){if(u = k["break-after"])a.w.G = u.toString();if(u = k["break-before"])a.w.g = u.toString();}a.w.R = k["vertical-align"] && k["vertical-align"].toString() || "baseline";a.w.Z = k["caption-side"] && k["caption-side"].toString() || "top";u = k["border-collapse"];if(!u || u === C("separate"))if(A = k["border-spacing"])A.Gd()?(u = A.values[0],A = A.values[1]):u = A,u.nc() && (a.w.ia = Hc(u,a.b)),A.nc() && (a.w.$d = Hc(A,a.b));a.w.O = k["footnote-policy"];if(u = k["x-first-pseudo"])a.w.f = new Gk(a.w.parent?a.w.parent.f:null,u.L);a.w.ta || hr(a,f,h,g,a.b);if(u = k["white-space"])u = qk(u.toString()),null !== u && (a.w.dc = u);(u = k["hyphenate-character"]) && u !== Lc && (a.w.D = u.Nc);u = k["overflow-wrap"] || ["word-wrap"];a.w.A = k["word-break"] === Uc || u === Vc;er(a.w,b,p,l,r,q);a.w.parent && a.w.parent.F && (b = a.w.parent.F.Te(a.w,b));a.w.ta || (a.w.l = ir(k),jr(a,f,g));var I=!1,ia=null,Aa=[],Ba=f.namespaceURI,N=f.localName;if("http://www.w3.org/1999/xhtml" == Ba)"html" == N || "body" == N || "script" == N || "link" == N || "meta" == N?N = "div":"vide_" == N?N = "video":"audi_" == N?N = "audio":"object" == N && (I = !!a.g),f.getAttribute("data-adapt-pseudo") && h.content && h.content.value && h.content.value.url && (N = "img");else if("http://www.idpf.org/2007/ops" == Ba)N = "span",Ba = "http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0" == Ba){Ba = "http://www.w3.org/1999/xhtml";if("image" == N){if((N = "div",(l = f.getAttributeNS("http://www.w3.org/1999/xlink","href")) && "#" == l.charAt(0) && (l = Rj(a.ba,l))))ia = kr(a,Ba,"img"),l = "data:" + (l.getAttribute("content-type") || "image/jpeg") + ";base64," + l.textContent.replace(/[ \t\n\t]/g,""),Aa.push(we(ia,l));}else N = ar[N];N || (N = a.w.ta?"span":"div");}else if("http://www.daisy.org/z3986/2005/ncx/" == Ba)if((Ba = "http://www.w3.org/1999/xhtml","ncx" == N || "navPoint" == N))N = "div";else if("navLabel" == N){if((N = "span",r = f.parentNode)){l = null;for(r = r.firstChild;r;r = r.nextSibling) if(1 == r.nodeType && (u = r,"http://www.daisy.org/z3986/2005/ncx/" == u.namespaceURI && "content" == u.localName)){l = u.getAttribute("src");break;}l && (N = "a",f = f.ownerDocument.createElementNS(Ba,"a"),f.setAttribute("href",l));}}else N = "span";else "http://www.pyroxy.com/ns/shadow" == Ba?(Ba = "http://www.w3.org/1999/xhtml",N = a.w.ta?"span":"div"):I = !!a.g;K?b?N = "li":(N = "div",p = Oc,k.display = p):"body" == N || "li" == N?N = "div":"q" == N?N = "span":"a" == N && (l = k["hyperlink-processing"]) && "normal" != l.toString() && (N = "span");k.behavior && "none" != k.behavior.toString() && a.g && (I = !0);f.dataset && "true" === f.getAttribute("data-math-typeset") && (I = !0);var ob;I?ob = a.g(f,a.w.parent?a.w.parent.B:null,k):ob = L(null);ob.then(function(g){g?I && (d = "true" == g.getAttribute("data-adapt-process-children")):g = kr(a,Ba,N);"a" == N && g.addEventListener("click",a.page.J,!1);ia && (Fo(a,a.w,"inner",ia),g.appendChild(ia));"iframe" == g.localName && "http://www.w3.org/1999/xhtml" == g.namespaceURI && Pq(g);var h=a.w.Cb["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m === Lc || !m && !q,p=p === Lc || !p && !r;if("http://www.gribuser.ru/xml/fictionbook/2.0" != f.namespaceURI || "td" == N){for(var q=f.attributes,u=q.length,r=null,z=0;z < u;z++) {var A=q[z],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/" == H)continue;else "http://www.w3.org/1999/xlink" == H && "href" == G && (A = br(a,A));else {if(G.match(/^on/))continue;if("style" == G)continue;if(("id" == G || "name" == G) && b){A = a.j.Ee(A,a.ba.url);g.setAttribute(G,A);nk(a.page,g,A);continue;}"src" == G || "href" == G || "poster" == G?(A = br(a,A),"href" === G && (A = a.j.nd(A,a.ba.url))):"srcset" == G && (A = A.split(",").map(function(b){return br(a,b.trim());}).join(","));if("poster" === G && "video" === N && "http://www.w3.org/1999/xhtml" === Ba && m && p){var ob=new Image(),np=we(ob,A);Aa.push(np);l.push({Df:ob,element:g,Af:np});}}"http://www.w3.org/2000/svg" == Ba && /^[A-Z\-]+$/.test(G) && (G = G.toLowerCase());-1 != lr.indexOf(G.toLowerCase()) && (A = Jq(A,a.ba.url,a.j));H && (ob = Oq[H]) && (G = ob + ":" + G);"src" != G || H || "img" != N && "input" != N || "http://www.w3.org/1999/xhtml" != Ba?"href" == G && "image" == N && "http://www.w3.org/2000/svg" == Ba && "http://www.w3.org/1999/xlink" == H?a.page.j.push(we(g,A)):H?g.setAttributeNS(H,G,A):g.setAttribute(G,A):r = A;}r && (ob = "input" === N?new Image():g,q = we(ob,r),ob !== g && (g.src = r),m || p?(m && p && h && 1 !== h && l.push({Df:ob,element:g,Af:q}),Aa.push(q)):a.page.j.push(q));}delete k.content;(m = k["list-style-image"]) && m instanceof Fc && (m = m.url,Aa.push(we(new Image(),m)));mr(a,k);nr(a,g,k);if(!a.w.ta && (m = null,b?c && (m = a.w.u?Nq:Mq):m = "clone" !== a.w.Cb["box-decoration-break"]?a.w.u?Lq:Kq:a.w.u?Nq:Mq,m))for(var op in m) w(g,op,m[op]);K && g.setAttribute("value",k["ua-list-item-count"].stringValue());a.B = g;Aa.length?ve(Aa).then(function(){0 < h && or(a,l,h,k,a.w.u);M(e,d);}):oe().then(function(){M(e,d);});});});return e.result();}function hr(a,b,c,d,e){var f=Vq(c,a.A,a.f,e);f && f["after-if-continues"] && f["after-if-continues"].content && (a.w.I = new pr(b,new Tq(b,c,d,e,a.C)));}var lr="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");function or(a,b,c,d,e){b.forEach(function(b){if("load" === b.Af.get().get()){var f=b.Df,h=f.width / c,f=f.height / c;b = b.element;if(0 < h && 0 < f)if((d["box-sizing"] === Tc && (d["border-left-style"] !== F && (h += Hc(d["border-left-width"],a.b)),d["border-right-style"] !== F && (h += Hc(d["border-right-width"],a.b)),d["border-top-style"] !== F && (f += Hc(d["border-top-width"],a.b)),d["border-bottom-style"] !== F && (f += Hc(d["border-bottom-width"],a.b))),1 < c)){var l=d["max-width"] || F,k=d["max-height"] || F;l === F && k === F?w(b,"max-width",h + "px"):l !== F && k === F?w(b,"width",h + "px"):l === F && k !== F?w(b,"height",f + "px"):"%" !== l.ha?w(b,"max-width",Math.min(h,Hc(l,a.b)) + "px"):"%" !== k.ha?w(b,"max-height",Math.min(f,Hc(k,a.b)) + "px"):e?w(b,"height",f + "px"):w(b,"width",h + "px");}else 1 > c && (l = d["min-width"] || Od,k = d["min-height"] || Od,l.L || k.L?l.L && !k.L?w(b,"width",h + "px"):!l.L && k.L?w(b,"height",f + "px"):"%" !== l.ha?w(b,"min-width",Math.max(h,Hc(l,a.b)) + "px"):"%" !== k.ha?w(b,"min-height",Math.max(f,Hc(k,a.b)) + "px"):e?w(b,"height",f + "px"):w(b,"width",h + "px"):w(b,"min-width",h + "px"));}});}function mr(a,b){Ud("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.w,b);});}function jr(a,b,c){for(b = b.firstChild;b;b = b.nextSibling) if(1 === b.nodeType){var d={},e=c.l(b,!1);Zq(a,a.w.u,e,d);if(ir(d)){if(a.w.F instanceof cp && !Pk(a.w,a.w.F))break;c = a.w.parent;a.w.F = new cp(c && c.F,a.w.N);qr(a.w.F,a.w.u);break;}}}function ir(a){var b=a["repeat-on-break"];return b !== F && (b === Lc && (b = a.display === Ed?dd:a.display === Dd?cd:F),b && b !== F)?b.toString():null;}function rr(a){var b=J("createTextNodeView");sr(a).then(function(){var c=a.la || 0,c=tr(a.w.Ia).substr(c);a.B = document.createTextNode(c);M(b,!0);});return b.result();}function sr(a){if(a.w.Ia)return L(!0);var b,c=b = a.N.textContent,d=J("preprocessTextContent"),e=Ud("PREPROCESS_TEXT_CONTENT"),f=0;qe(function(){return f >= e.length?L(!1):e[f++](a.w,c).fa(function(a){c = a;return L(!0);});}).then(function(){a.w.Ia = ur(b,c,0);M(d,!0);});return d.result();}function vr(a,b,c){var d=J("createNodeView"),e=!0;1 == a.N.nodeType?b = fr(a,b,c):8 == a.N.nodeType?(a.B = null,b = L(!0)):b = rr(a);b.then(function(b){e = b;(a.w.B = a.B) && (b = a.w.parent?a.w.parent.B:a.R) && b.appendChild(a.B);M(d,e);});return d.result();}function eo(a,b,c,d){(a.w = b)?(a.N = b.N,a.la = b.la):(a.N = null,a.la = -1);a.B = null;return a.w?vr(a,c,!!d):L(!0);}function wr(a){if(null == a.ra || "content" != a.N.localName || "http://www.pyroxy.com/ns/shadow" != a.N.namespaceURI)return a;var b=a.Ca,c=a.ra,d=a.parent,e,f;c.gf?(f = c.gf,e = c.root,c = c.type,2 == c && (e = e.firstChild)):(f = c.bd,e = c.ma.firstChild,c = 2);var g=a.N.nextSibling;g?(a.N = g,Ik(a)):a.xa?a = a.xa:e?a = null:(a = a.parent.modify(),a.K = !0);if(e)return b = new Dk(e,d,b),b.ra = f,b.Za = c,b.xa = a,b;a.Ca = b;return a;}function xr(a){var b=a.Ca + 1;if(a.K){if(!a.parent)return null;if(3 != a.Za){var c=a.N.nextSibling;if(c)return a = a.modify(),a.Ca = b,a.N = c,Ik(a),wr(a);}if(a.xa)return a = a.xa.modify(),a.Ca = b,a;a = a.parent.modify();}else {if(a.Aa && (c = a.Aa.root,2 == a.Aa.type && (c = c.firstChild),c))return b = new Dk(c,a,b),b.ra = a.Aa,b.Za = a.Aa.type,wr(b);if(c = a.N.firstChild)return wr(new Dk(c,a,b));1 != a.N.nodeType && (c = tr(a.Ia),b += c.length - 1 - a.la);a = a.modify();}a.Ca = b;a.K = !0;return a;}function lm(a,b,c){b = xr(b);if(!b || b.K)return L(b);var d=J("nextInTree");eo(a,b,!0,c).then((function(a){b.B && a || (b = b.modify(),b.K = !0,b.B || (b.ta = !0));Ua(this,{type:"nextInTree",w:b});M(d,b);}).bind(a));return d.result();}function yr(a,b){if(b instanceof uc)for(var c=b.values,d=0;d < c.length;d++) yr(a,c[d]);else b instanceof Fc && (c = b.url,a.page.j.push(we(new Image(),c)));}var zr={"box-decoration-break":!0,"float-min-wrap-block":!0,"float-reference":!0,"flow-into":!0,"flow-linger":!0,"flow-options":!0,"flow-priority":!0,"footnote-policy":!0,page:!0};function nr(a,b,c){var d=c["background-image"];d && yr(a,d);var d=c.position === td,e;for(e in c) if(!zr[e]){var f=c[e],f=f.ca(new Eg(a.ba.url,a.j));f.nc() && Bb(f.ha) && (f = new D(Hc(f,a.b),"px"));fk[e] || d && gk[e]?a.page.A.push(new hk(b,e,f)):w(b,e,f.toString());}}function Fo(a,b,c,d){if(!b.K){var e=(b.ra?b.ra.b:a.l).l(a.N,!1);if(e = e._pseudos)if(e = e[c])c = {},b.u = Zq(a,b.u,e,c),b = c.content,ml(b) && (b.ca(new ll(d,a.b,b,a.C)),delete c.content),nr(a,d,c);}}function ho(a,b,c){var d=J("peelOff"),e=b.f,f=b.la,g=b.K;if(0 < c)b.B.textContent = b.B.textContent.substr(0,c),f += c;else if(!g && b.B && !f){var h=b.B.parentNode;h && h.removeChild(b.B);}for(var l=b.Ca + c,k=[];b.f === e;) k.push(b),b = b.parent;var m=k.pop(),p=m.xa;qe(function(){for(;0 < k.length;) {m = k.pop();b = new Dk(m.N,b,l);k.length || (b.la = f,b.K = g);b.Za = m.Za;b.ra = m.ra;b.Aa = m.Aa;b.xa = m.xa?m.xa:p;p = null;var c=eo(a,b,!1);if(c.Ra())return c;}return L(!1);}).then(function(){M(d,b);});return d.result();}function kr(a,b,c){return "http://www.w3.org/1999/xhtml" == b?a.G.createElement(c):a.G.createElementNS(b,c);}function pp(a){a && Ok(a,function(a){var b=a.Cb["box-decoration-break"];b && "slice" !== b || (b = a.B,a.u?(w(b,"padding-left","0"),w(b,"border-left","none"),w(b,"border-top-left-radius","0"),w(b,"border-bottom-left-radius","0")):(w(b,"padding-bottom","0"),w(b,"border-bottom","none"),w(b,"border-bottom-left-radius","0"),w(b,"border-bottom-right-radius","0")));});}function Ar(a){this.b = a.h;this.window = a.window;}function Br(a,b){var c=b.left,d=b.top;return {left:a.left - c,top:a.top - d,right:a.right - c,bottom:a.bottom - d,width:a.width,height:a.height};}function Pn(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Br(a,d);},a);}function pk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Br(c,d);}function vn(a,b){return a.window.getComputedStyle(b,null);}function Cr(a,b,c,d,e){this.window = a;this.fontSize = b;this.b = a.document;this.root = c || this.b.body;b = this.root.firstElementChild;b || (b = this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c = b.firstElementChild;c || (c = this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f || (f = this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));this.g = b;this.f = c;this.h = f;b = vn(new Ar(this),this.root);this.width = d || parseFloat(b.width) || a.innerWidth;this.height = e || parseFloat(b.height) || a.innerHeight;}Cr.prototype.zoom = function(a,b,c){w(this.g,"width",a * c + "px");w(this.g,"height",b * c + "px");w(this.f,"width",a + "px");w(this.f,"height",b + "px");w(this.f,"transform","scale(" + c + ")");};var Go="min-content inline size",yn="fit-content inline size";function xn(a,b,c){function d(c){return vn(a,b).getPropertyValue(c);}function e(){w(b,"display","block");w(b,"position","static");return d(ia);}function f(){w(b,"display","inline-block");w(G,ia,"99999999px");var a=d(ia);w(G,ia,"");return a;}function g(){w(b,"display","inline-block");w(G,ia,"0");var a=d(ia);w(G,ia,"");return a;}function h(){var a=e(),b=g(),c=parseFloat(a);if(c <= parseFloat(b))return b;b = f();return c <= parseFloat(b)?a:b;}function l(){throw Error("Getting fill-available block size is not implemented");}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,G=b.ownerDocument.createElement("div");w(G,"position",m);H.insertBefore(G,b);G.appendChild(b);w(b,"width","auto");w(b,"max-width","none");w(b,"min-width","0");w(b,"height","auto");w(b,"max-height","none");w(b,"min-height","0");var K=za("writing-mode"),K=(K?d(K[0]):null) || d("writing-mode"),I="vertical-rl" === K || "tb-rl" === K || "vertical-lr" === K || "tb-lr" === K,ia=I?"height":"width",Aa=I?"width":"height",Ba={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c = e();break;case "max-content inline size":c = f();break;case Go:c = g();break;case yn:c = h();break;case "fill-available block size":c = l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c = d(Aa);break;case "fill-available width":c = I?l():e();break;case "fill-available height":c = I?e():l();break;case "max-content width":c = I?d(Aa):f();break;case "max-content height":c = I?f():d(Aa);break;case "min-content width":c = I?d(Aa):g();break;case "min-content height":c = I?g():d(Aa);break;case "fit-content width":c = I?d(Aa):h();break;case "fit-content height":c = I?h():d(Aa);}Ba[a] = parseFloat(c);w(b,"position",m);w(b,"display",k);});w(b,"width",p);w(b,"max-width",q);w(b,"min-width",r);w(b,"height",z);w(b,"max-height",u);w(b,"min-height",A);H.insertBefore(b,G);H.removeChild(G);return Ba;};function Dr(a){var b=a["writing-mode"],b=b && b.value;a = (a = a.direction) && a.value;return b === Hd || b !== Id && a !== zd?"ltr":"rtl";}var Er={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),height:new D(17,"in")}},Fr=new D(.24,"pt"),Gr=new D(3,"mm"),Hr=new D(10,"mm"),Ir=new D(13,"mm");function Jr(a){var b={width:Md,height:Nd,Mb:Od,Nb:Od},c=a.size;if(c && c.value !== Lc){var d=c.value;d.Gd()?(c = d.values[0],d = d.values[1]):(c = d,d = null);if(c.nc())b.width = c,b.height = d || c;else if(c = Er[c.name.toLowerCase()])d && d === kd?(b.width = c.height,b.height = c.width):(b.width = c.width,b.height = c.height);}(c = a.marks) && c.value !== F && (b.Nb = Ir);a = a.bleed;a && a.value !== Lc?a.value && a.value.nc() && (b.Mb = a.value):c && (a = !1,c.value.Gd()?a = c.value.values.some(function(a){return a === Wc;}):a = c.value === Wc,a && (b.Mb = new D(6,"pt")));return b;}function Kr(a,b){var c={},d=a.Mb.L * Eb(b,a.Mb.ha,!1),e=a.Nb.L * Eb(b,a.Nb.ha,!1),f=d + e,g=a.width;c.Wb = g === Md?b.Y.hc?b.Y.hc.width * Eb(b,"px",!1):(b.Y.ub?Math.floor(b.Ka / 2) - b.Y.Jc:b.Ka) - 2 * f:g.L * Eb(b,g.ha,!1);g = a.height;c.Vb = g === Nd?b.Y.hc?b.Y.hc.height * Eb(b,"px",!1):b.yb - 2 * f:g.L * Eb(b,g.ha,!1);c.Mb = d;c.Nb = e;c.de = f;return c;}function Lr(a,b,c){a = a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position = "absolute";return a;}function Mr(a,b,c){a = a.createElementNS("http://www.w3.org/2000/svg",c || "polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a;}var Nr={Vg:"top left",Wg:"top right",Ig:"bottom left",Jg:"bottom right"};function Or(a,b,c,d,e,f){var g=d;g <= e + 2 * Ab.mm && (g = e + d / 2);var h=Math.max(d,g),l=e + h + c / 2,k=Lr(a,l,l),g=[[0,e + d],[d,e + d],[d,e + d - g]];d = g.map(function(a){return [a[1],a[0]];});if("top right" === b || "bottom right" === b)g = g.map(function(a){return [e + h - a[0],a[1]];}),d = d.map(function(a){return [e + h - a[0],a[1]];});if("bottom left" === b || "bottom right" === b)g = g.map(function(a){return [a[0],e + h - a[1]];}),d = d.map(function(a){return [a[0],e + h - a[1]];});l = Mr(a,c);l.setAttribute("points",g.map(function(a){return a.join(",");}).join(" "));k.appendChild(l);a = Mr(a,c);a.setAttribute("points",d.map(function(a){return a.join(",");}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a] = f + "px";});return k;}var Pr={Ug:"top",Hg:"bottom",$f:"left",ag:"right"};function Qr(a,b,c,d,e){var f=2 * d,g;"top" === b || "bottom" === b?(g = f,f = d):g = d;var h=Lr(a,g,f),l=Mr(a,c);l.setAttribute("points","0," + f / 2 + " " + g + "," + f / 2);h.appendChild(l);l = Mr(a,c);l.setAttribute("points",g / 2 + ",0 " + g / 2 + "," + f);h.appendChild(l);a = Mr(a,c,"circle");a.setAttribute("cx",g / 2);a.setAttribute("cy",f / 2);a.setAttribute("r",d / 4);h.appendChild(a);var k;switch(b){case "top":k = "bottom";break;case "bottom":k = "top";break;case "left":k = "right";break;case "right":k = "left";}Object.keys(Pr).forEach(function(a){a = Pr[a];a === b?h.style[a] = e + "px":a !== k && (h.style[a] = "0",h.style["margin-" + a] = "auto");});return h;}function Rr(a,b,c,d){var e=!1,f=!1;if(a = a.marks)a = a.value,a.Gd()?a.values.forEach(function(a){a === Wc?e = !0:a === Xc && (f = !0);}):a === Wc?e = !0:a === Xc && (f = !0);if(e || f){var g=c.M,h=g.ownerDocument,l=b.Mb,k=Hc(Fr,d),m=Hc(Gr,d),p=Hc(Hr,d);e && Object.keys(Nr).forEach(function(a){a = Or(h,Nr[a],k,p,l,m);g.appendChild(a);});f && Object.keys(Pr).forEach(function(a){a = Qr(h,Pr[a],k,p,m);g.appendChild(a);});}}var Sr=(function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-" + b] = !0;a["padding-" + b] = !0;a["border-" + b + "-width"] = !0;a["border-" + b + "-style"] = !0;a["border-" + b + "-color"] = !0;});return a;})(),Tr={"top-left-corner":{order:1,Qa:!0,Na:!1,Oa:!0,Pa:!0,wa:null},"top-left":{order:2,Qa:!0,Na:!1,Oa:!1,Pa:!1,wa:"start"},"top-center":{order:3,Qa:!0,Na:!1,Oa:!1,Pa:!1,wa:"center"},"top-right":{order:4,Qa:!0,Na:!1,Oa:!1,Pa:!1,wa:"end"},"top-right-corner":{order:5,Qa:!0,Na:!1,Oa:!1,Pa:!0,wa:null},"right-top":{order:6,Qa:!1,Na:!1,Oa:!1,Pa:!0,wa:"start"},"right-middle":{order:7,Qa:!1,Na:!1,Oa:!1,Pa:!0,wa:"center"},"right-bottom":{order:8,Qa:!1,Na:!1,Oa:!1,Pa:!0,wa:"end"},"bottom-right-corner":{order:9,Qa:!1,Na:!0,Oa:!1,Pa:!0,wa:null},"bottom-right":{order:10,Qa:!1,Na:!0,Oa:!1,Pa:!1,wa:"end"},"bottom-center":{order:11,Qa:!1,Na:!0,Oa:!1,Pa:!1,wa:"center"},"bottom-left":{order:12,Qa:!1,Na:!0,Oa:!1,Pa:!1,wa:"start"},"bottom-left-corner":{order:13,Qa:!1,Na:!0,Oa:!0,Pa:!1,wa:null},"left-bottom":{order:14,Qa:!1,Na:!1,Oa:!0,Pa:!1,wa:"end"},"left-middle":{order:15,Qa:!1,Na:!1,Oa:!0,Pa:!1,wa:"center"},"left-top":{order:16,Qa:!1,Na:!1,Oa:!0,Pa:!1,wa:"start"}},Ur=Object.keys(Tr).sort(function(a,b){return Tr[a].order - Tr[b].order;});function Vr(a,b,c){Tp.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a = Jr(c);new Wr(this.f,this,c,a);this.D = {};Xr(this,c);this.b.position = new V(td,0);this.b.width = new V(a.width,0);this.b.height = new V(a.height,0);for(var d in c) Sr[d] || "background-clip" === d || (this.b[d] = c[d]);}t(Vr,Tp);function Xr(a,b){var c=b._marginBoxes;c && Ur.forEach(function(d){c[d] && (a.D[d] = new Yr(a.f,a,d,b));});}Vr.prototype.h = function(a){return new Zr(a,this);};function Wr(a,b,c,d){Xp.call(this,a,null,null,[],b);this.G = d;this.b["z-index"] = new V(new Dc(0),0);this.b["flow-from"] = new V(C("body"),0);this.b.position = new V(Ic,0);this.b.overflow = new V(Jd,0);for(var e in Sr) Sr.hasOwnProperty(e) && (this.b[e] = c[e]);}t(Wr,Xp);Wr.prototype.h = function(a){return new $r(a,this);};function Yr(a,b,c,d){Xp.call(this,a,null,null,[],b);this.C = c;a = d._marginBoxes[this.C];for(var e in d) if((b = d[e],c = a[e],qh[e] || c && c.value === fd))this.b[e] = b;for(e in a) Object.prototype.hasOwnProperty.call(a,e) && (b = a[e]) && b.value !== fd && (this.b[e] = b);}t(Yr,Xp);Yr.prototype.h = function(a){return new as(a,this);};function Zr(a,b){Up.call(this,a,b);this.l = null;this.oa = {};}t(Zr,Up);Zr.prototype.j = function(a,b){var c=this.J,d;for(d in b) if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d] = b[d];}Up.prototype.j.call(this,a,b);};Zr.prototype.pe = function(){var a=this.style;a.left = Od;a["margin-left"] = Od;a["border-left-width"] = Od;a["padding-left"] = Od;a["padding-right"] = Od;a["border-right-width"] = Od;a["margin-right"] = Od;a.right = Od;};Zr.prototype.qe = function(){var a=this.style;a.top = new D(-1,"px");a["margin-top"] = Od;a["border-top-width"] = Od;a["padding-top"] = Od;a["padding-bottom"] = Od;a["border-bottom-width"] = Od;a["margin-bottom"] = Od;a.bottom = Od;};Zr.prototype.Z = function(a,b,c){b = b.I;var d={start:this.l.marginLeft,end:this.l.marginRight,pa:this.l.Ac},e={start:this.l.marginTop,end:this.l.marginBottom,pa:this.l.zc};bs(this,b.top,!0,d,a,c);bs(this,b.bottom,!0,d,a,c);bs(this,b.left,!1,e,a,c);bs(this,b.right,!1,e,a,c);};function cs(a,b,c,d,e){this.M = a;this.D = e;this.j = c;this.C = !Y(d,b[c?"width":"height"],new gc(d,0,"px"));this.l = null;}cs.prototype.b = function(){return this.C;};function ds(a){a.l || (a.l = xn(a.D,a.M.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l;}cs.prototype.g = function(){var a=ds(this);return this.j?$k(this.M) + a["max-content width"] + al(this.M):Yk(this.M) + a["max-content height"] + Zk(this.M);};cs.prototype.h = function(){var a=ds(this);return this.j?$k(this.M) + a["min-content width"] + al(this.M):Yk(this.M) + a["min-content height"] + Zk(this.M);};cs.prototype.f = function(){return this.j?$k(this.M) + this.M.width + al(this.M):Yk(this.M) + this.M.height + Zk(this.M);};function es(a){this.j = a;}es.prototype.b = function(){return this.j.some(function(a){return a.b();});};es.prototype.g = function(){var a=this.j.map(function(a){return a.g();});return Math.max.apply(null,a) * a.length;};es.prototype.h = function(){var a=this.j.map(function(a){return a.h();});return Math.max.apply(null,a) * a.length;};es.prototype.f = function(){var a=this.j.map(function(a){return a.f();});return Math.max.apply(null,a) * a.length;};function fs(a,b,c,d,e,f){cs.call(this,a,b,c,d,e);this.A = f;}t(fs,cs);fs.prototype.b = function(){return !1;};fs.prototype.g = function(){return this.f();};fs.prototype.h = function(){return this.f();};fs.prototype.f = function(){return this.j?$k(this.M) + this.A + al(this.M):Yk(this.M) + this.A + Zk(this.M);};function bs(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b) {var p=Tr[m];if(p){var q=b[m],r=a.oa[m],z=new cs(q,r.style,c,g,f);h[p.wa] = q;l[p.wa] = r;k[p.wa] = z;}}a = d.start.evaluate(e);d.end.evaluate(e);b = d.pa.evaluate(e);var u=gs(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.pa);b && (b = b.evaluate(e),u[a] > b && (b = k[a] = new fs(h[a],l[a].style,c,g,f,b),H[a] = b.f(),A = !0));});A && (u = gs(k,b),A = !1,["start","center","end"].forEach(function(a){u[a] = H[a] || u[a];}));var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.pa);b && (b = b.evaluate(e),u[a] < b && (b = k[a] = new fs(h[a],l[a].style,c,g,f,b),G[a] = b.f(),A = !0));});A && (u = gs(k,b),["start","center","end"].forEach(function(a){u[a] = G[a] || u[a];}));var K=a + b,I=a + (a + b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e = c?d.left:d.top;break;case "center":e = (I - b) / 2;break;case "end":e = K - b;}c?el(d,e,b - $k(d) - al(d)):dl(d,e,b - Yk(d) - Zk(d));}});}function gs(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a;}),g=hs(d,g.length?new es(g):null,b);g.mb && (f.center = g.mb);d = g.mb || d.f();d = (b - d) / 2;c && c.b() && (f.start = d);e && e.b() && (f.end = d);}else c = hs(c,e,b),c.mb && (f.start = c.mb),c.qd && (f.end = c.qd);return f;}function hs(a,b,c){var d={mb:null,qd:null};if(a && b)if(a.b() && b.b()){var e=a.g(),f=b.g();0 < e && 0 < f?(f = e + f,f < c?d.mb = c * e / f:(a = a.h(),b = b.h(),b = a + b,b < c?d.mb = a + (c - b) * (e - a) / (f - b):0 < b && (d.mb = c * a / b)),0 < d.mb && (d.qd = c - d.mb)):0 < e?d.mb = c:0 < f && (d.qd = c);}else a.b()?d.mb = Math.max(c - b.f(),0):b.b() && (d.qd = Math.max(c - a.f(),0));else a?a.b() && (d.mb = c):b && b.b() && (d.qd = c);return d;}Zr.prototype.Xb = function(a,b,c,d,e){Zr.Yf.Xb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0);};function $r(a,b){Yp.call(this,a,b);this.marginLeft = this.marginBottom = this.marginRight = this.marginTop = this.zc = this.Ac = null;}t($r,Yp);$r.prototype.j = function(a,b){var c=this.J,d;for(d in b) Object.prototype.hasOwnProperty.call(b,d) && (d.match(/^column.*$/) || d.match(/^background-/)) && (c[d] = b[d]);Yp.prototype.j.call(this,a,b);d = this.f;c = {Ac:this.Ac,zc:this.zc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l = c;d = d.style;d.width = new E(c.Ac);d.height = new E(c.zc);d["padding-left"] = new E(c.marginLeft);d["padding-right"] = new E(c.marginRight);d["padding-top"] = new E(c.marginTop);d["padding-bottom"] = new E(c.marginBottom);};$r.prototype.pe = function(){var a=is(this,{start:"left",end:"right",pa:"width"});this.Ac = a.sf;this.marginLeft = a.Nf;this.marginRight = a.Mf;};$r.prototype.qe = function(){var a=is(this,{start:"top",end:"bottom",pa:"height"});this.zc = a.sf;this.marginTop = a.Nf;this.marginBottom = a.Mf;};function is(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.pa,h=a.b.G[g].ua(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-" + e],h),m=Y(d,c["margin-" + f],h),p=Zp(d,c["padding-" + e],h),q=Zp(d,c["padding-" + f],h),r=aq(d,c["border-" + e + "-width"],c["border-" + e + "-style"],h),z=aq(d,c["border-" + f + "-width"],c["border-" + f + "-style"],h),u=y(d,h,x(d,x(d,r,p),x(d,z,q)));l?(u = y(d,u,l),k || m?k?m = y(d,u,k):k = y(d,u,m):m = k = oc(d,u,new vb(d,.5))):(k || (k = d.b),m || (m = d.b),l = y(d,u,x(d,k,m)));c[e] = new E(k);c[f] = new E(m);c["margin-" + e] = Od;c["margin-" + f] = Od;c["padding-" + e] = new E(p);c["padding-" + f] = new E(q);c["border-" + e + "-width"] = new E(r);c["border-" + f + "-width"] = new E(z);c[g] = new E(l);c["max-" + g] = new E(l);return {sf:y(d,h,x(d,k,m)),Nf:k,Mf:m};}$r.prototype.Xb = function(a,b,c,d,e){Yp.prototype.Xb.call(this,a,b,c,d,e);c.O = b.element;};function as(a,b){Yp.call(this,a,b);var c=b.C;this.l = Tr[c];a.oa[c] = this;this.sa = !0;}t(as,Yp);n = as.prototype;n.Xb = function(a,b,c,d,e){var f=b.element;w(f,"display","flex");var g=kq(this,a,"vertical-align"),h=null;g === C("middle")?h = "center":g === C("top")?h = "flex-start":g === C("bottom") && (h = "flex-end");h && (w(f,"flex-flow",this.u?"row":"column"),w(f,"justify-content",h));Yp.prototype.Xb.call(this,a,b,c,d,e);};n.wa = function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left" === e,h=g?b.Ac:b.zc,l=Y(d,c[a.pa],h),g=g?b.marginLeft:b.marginTop;if("start" === this.l.wa)c[e] = new E(g);else if(l){var k=Zp(d,c["margin-" + e],h),m=Zp(d,c["margin-" + f],h),p=Zp(d,c["padding-" + e],h),q=Zp(d,c["padding-" + f],h),r=aq(d,c["border-" + e + "-width"],c["border-" + e + "-style"],h),f=aq(d,c["border-" + f + "-width"],c["border-" + f + "-style"],h),l=x(d,l,x(d,x(d,p,q),x(d,x(d,r,f),x(d,k,m))));switch(this.l.wa){case "center":c[e] = new E(x(d,g,pc(d,y(d,h,l),new vb(d,2))));break;case "end":c[e] = new E(y(d,x(d,g,h),l));}}};function js(a,b,c){function d(a){if(u)return u;u = {pa:z?z.evaluate(a):null,fb:l?l.evaluate(a):null,gb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b && (c += b.evaluate(a));});(null === u.fb || null === u.gb) && c + u.pa + u.fb + u.gb > b && (null === u.fb && (u.fb = 0),null === u.gb && (u.ah = 0));null !== u.pa && null !== u.fb && null !== u.gb && (u.gb = null);null === u.pa && null !== u.fb && null !== u.gb?u.pa = b - c - u.fb - u.gb:null !== u.pa && null === u.fb && null !== u.gb?u.fb = b - c - u.pa - u.gb:null !== u.pa && null !== u.fb && null === u.gb?u.gb = b - c - u.pa - u.fb:null === u.pa?(u.fb = u.gb = 0,u.pa = b - c):u.fb = u.gb = (b - c - u.pa) / 2;return u;}var e=a.style;a = a.b.f;var f=b.re,g=b.we;b = b.pa;var h=c["margin" + g.charAt(0).toUpperCase() + g.substring(1)],l=$p(a,e["margin-" + f],h),k=$p(a,e["margin-" + g],h),m=Zp(a,e["padding-" + f],h),p=Zp(a,e["padding-" + g],h),q=aq(a,e["border-" + f + "-width"],e["border-" + f + "-style"],h),r=aq(a,e["border-" + g + "-width"],e["border-" + g + "-style"],h),z=Y(a,e[b],h),u=null;e[b] = new E(new xb(a,function(){var a=d(this).pa;return null === a?0:a;},b));e["margin-" + f] = new E(new xb(a,function(){var a=d(this).fb;return null === a?0:a;},"margin-" + f));e["margin-" + g] = new E(new xb(a,function(){var a=d(this).gb;return null === a?0:a;},"margin-" + g));"left" === f?e.left = new E(x(a,c.marginLeft,c.Ac)):"top" === f && (e.top = new E(x(a,c.marginTop,c.zc)));}n.pe = function(){var a=this.f.l;this.l.Oa?js(this,{re:"right",we:"left",pa:"width"},a):this.l.Pa?js(this,{re:"left",we:"right",pa:"width"},a):this.wa({start:"left",end:"right",pa:"width"},a);};n.qe = function(){var a=this.f.l;this.l.Qa?js(this,{re:"bottom",we:"top",pa:"height"},a):this.l.Na?js(this,{re:"top",we:"bottom",pa:"height"},a):this.wa({start:"top",end:"bottom",pa:"height"},a);};n.Dd = function(a,b,c,d,e,f,g){Yp.prototype.Dd.call(this,a,b,c,d,e,f,g);a = c.I;c = this.b.C;d = this.l;d.Oa || d.Pa?d.Qa || d.Na || (d.Oa?a.left[c] = b:d.Pa && (a.right[c] = b)):d.Qa?a.top[c] = b:d.Na && (a.bottom[c] = b);};function ks(a,b,c,d,e){this.b = a;this.l = b;this.h = c;this.f = d;this.g = e;this.j = {};a = this.l;b = new hc(a,"page-number");b = new $b(a,new fc(a,b,new vb(a,2)),a.b);c = new Qb(a,b);a.values["recto-page"] = c;a.values["verso-page"] = b;"ltr" === Dr(this.g)?(a.values["left-page"] = b,b = new Qb(a,b),a.values["right-page"] = b):(c = new Qb(a,b),a.values["left-page"] = c,a.values["right-page"] = b);}function ls(a){var b={};fj(a.b,[],"",b);a.b.pop();return b;}function ms(a,b){var c=[],d;for(d in b) if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f = e instanceof V?e.value + "":ms(a,e);c.push(d + f + (e.Ua || ""));}return c.sort().join("^");}function ns(a,b,c){c = c.clone({Zb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=Jr(b),e=e.Ua;d.width = Eh(a.f,d.width,new V(f.width,e));d.height = Eh(a.f,d.height,new V(f.height,e));}["counter-reset","counter-increment"].forEach(function(a){d[a] && (b[a] = d[a]);});c = c.h(a.h);c.j(a.b,a.g);Aq(c,a.f);return c;}function os(a){this.b = null;this.h = a;}t(os,W);os.prototype.apply = function(a){a.Z === this.h && this.b.apply(a);};os.prototype.f = function(){return 3;};os.prototype.g = function(a){this.b && Wh(a.ad,this.h,this.b);return !0;};function ps(a){this.b = null;this.h = a;}t(ps,W);ps.prototype.apply = function(a){1 === new hc(this.h,"page-number").evaluate(a.l) && this.b.apply(a);};ps.prototype.f = function(){return 2;};function qs(a){this.b = null;this.h = a;}t(qs,W);qs.prototype.apply = function(a){new hc(this.h,"left-page").evaluate(a.l) && this.b.apply(a);};qs.prototype.f = function(){return 1;};function rs(a){this.b = null;this.h = a;}t(rs,W);rs.prototype.apply = function(a){new hc(this.h,"right-page").evaluate(a.l) && this.b.apply(a);};rs.prototype.f = function(){return 1;};function ss(a){this.b = null;this.h = a;}t(ss,W);ss.prototype.apply = function(a){new hc(this.h,"recto-page").evaluate(a.l) && this.b.apply(a);};ss.prototype.f = function(){return 1;};function ts(a){this.b = null;this.h = a;}t(ts,W);ts.prototype.apply = function(a){new hc(this.h,"verso-page").evaluate(a.l) && this.b.apply(a);};ts.prototype.f = function(){return 1;};function us(a,b){Th.call(this,a,b,null,null,null);}t(us,Th);us.prototype.apply = function(a){var b=a.l,c=a.G,d=this.style;a = this.$;Lh(b,c,d,a,null,null,null);if(d = d._marginBoxes){var c=Ih(c,"_marginBoxes"),e;for(e in d) if(d.hasOwnProperty(e)){var f=c[e];f || (f = {},c[e] = f);Lh(b,f,d[e],a,null,null,null);}}};function vs(a,b,c,d,e){qj.call(this,a,b,null,c,null,d,!1);this.R = e;this.I = [];this.g = "";this.G = [];}t(vs,qj);n = vs.prototype;n.Lc = function(){this.Fb();};n.Ib = function(a,b){if(this.g = b)this.b.push(new os(b)),this.$ += 65536;};n.cd = function(a,b){b && vf(this,"E_INVALID_PAGE_SELECTOR :" + a + "(" + b.join("") + ")");this.G.push(":" + a);switch(a.toLowerCase()){case "first":this.b.push(new ps(this.f));this.$ += 256;break;case "left":this.b.push(new qs(this.f));this.$ += 1;break;case "right":this.b.push(new rs(this.f));this.$ += 1;break;case "recto":this.b.push(new ss(this.f));this.$ += 1;break;case "verso":this.b.push(new ts(this.f));this.$ += 1;break;default:vf(this,"E_INVALID_PAGE_SELECTOR :" + a);}};function ws(a){var b;a.g || a.G.length?b = [a.g].concat(a.G.sort()):b = null;a.I.push({cf:b,$:a.$});a.g = "";a.G = [];}n.Ic = function(){ws(this);qj.prototype.Ic.call(this);};n.Ba = function(){ws(this);qj.prototype.Ba.call(this);};n.Eb = function(a,b,c){if("bleed" !== a && "marks" !== a || this.I.some(function(a){return !a.cf;})){qj.prototype.Eb.call(this,a,b,c);var d=this.bb[a],e=this.R;if("bleed" === a || "marks" === a)e[""] || (e[""] = {}),Object.keys(e).forEach(function(b){Hh(e[b],a,d);});else if("size" === a){var f=e[""];this.I.forEach(function(b){var c=new V(d.value,d.Ua + b.$);b = b.cf?b.cf.join(""):"";var g=e[b];g?(c = (b = g[a])?Eh(null,c,b):c,Hh(g,a,c)):(g = e[b] = {},Hh(g,a,c),f && ["bleed","marks"].forEach(function(a){f[a] && Hh(g,a,f[a]);},this));},this);}}};n.Gf = function(a){Wh(this.l.ad,"*",a);};n.Lf = function(a){return new us(this.bb,a);};n.De = function(a){var b=Ih(this.bb,"_marginBoxes"),c=b[a];c || (c = {},b[a] = c);rf(this.ma,new xs(this.f,this.ma,this.C,c));};function xs(a,b,c,d){sf.call(this,a,b,!1);this.g = c;this.b = d;}t(xs,tf);xs.prototype.Db = function(a,b,c){oh(this.g,a,b,c,this);};xs.prototype.Yc = function(a,b){uf(this,"E_INVALID_PROPERTY_VALUE " + a + ": " + b.toString());};xs.prototype.Ud = function(a,b){uf(this,"E_INVALID_PROPERTY " + a + ": " + b.toString());};xs.prototype.Eb = function(a,b,c){Hh(this.b,a,new V(b,c?of(this):pf(this)));};function ys(a){if(1 >= a.length)return !1;var b=a[a.length - 1].g;return a.slice(0,a.length - 1).every(function(a){return b > a.g;});}function zs(a,b){a.u?a.width = b:a.height = b;}function As(a){return a.u?a.width:a.height;}function Bs(a,b){this.Zc = a;this.Kc = b;}function Cs(a,b,c){this.b = a;this.G = b;this.C = c;this.f = As(a);}function Ds(a,b){var c=J("ColumnBalancer#balanceColumns");a.A(b);Es(a,b);hl(a.b);var d=[Fs(a,b)];re(function(b){a.l(d)?(a.D(d),a.G().then(function(c){Es(a,c);hl(a.b);c?(d.push(Fs(a,c)),O(b)):P(b);})):P(b);}).then(function(){var b=d.reduce(function(a,b){return b.Kc < a.Kc?b:a;},d[0]);Gs(a,b.Zc);zs(a.b,a.f);M(c,b.Zc);});return c.result();}function Fs(a,b){var c=a.j(b);return new Bs(b,c);}Cs.prototype.A = function(){};function Es(a,b){var c=mn(a.C);b && (b.eg = c);}function Gs(a,b){var c=a.b.element;b.qb.forEach(function(a){c.appendChild(a.element);});nn(a.C,b.eg);}function Hs(a){var b=a[a.length - 1];if(!b.Kc || (a = a[a.length - 2]) && b.Kc >= a.Kc)return !1;a = b.Zc.qb;b = Math.max.apply(null,a.map(function(a){return a.g;}));a = Math.max.apply(null,a.map(function(a){return In(a.h);}));return b > a + 1;}function Is(a,b){var c=Math.max.apply(null,a[a.length - 1].Zc.qb.map(function(a){return isNaN(a.Xe)?a.g:a.g - a.Xe + 1;})) - 1;c < As(b)?zs(b,c):zs(b,As(b) - 1);}function Js(a,b,c,d){Cs.call(this,c,a,b);this.H = d;this.h = null;this.g = !1;}t(Js,Cs);Js.prototype.A = function(a){var b=a.qb.reduce(function(a,b){return a + b.g;},0);zs(this.b,b / this.H);this.h = a.position;};function Ks(a,b){return a.h?Wk(a.h,b):!b;}Js.prototype.j = function(a){if(!Ks(this,a.position))return Infinity;a = a.qb;return ys(a)?Infinity:Math.max.apply(null,a.map(function(a){return a.g;}));};Js.prototype.l = function(a){if(1 === a.length)return !0;if(this.g)return Hs(a);a = a[a.length - 1];return Ks(this,a.Zc.position) && !ys(a.Zc.qb)?this.g = !0:As(this.b) < this.f;};Js.prototype.D = function(a){this.g?Is(a,this.b):zs(this.b,Math.min(this.f,As(this.b) + .1 * this.f));};function Ls(a,b,c){Cs.call(this,c,a,b);}t(Ls,Cs);Ls.prototype.j = function(a){if(a.qb.every(function(a){return !a.g;}))return Infinity;a = a.qb.filter(function(a){return !a.f;}).map(function(a){return a.g;});return Ms(a);};Ls.prototype.l = function(a){return Hs(a);};Ls.prototype.D = function(a){Is(a,this.b);};function Ns(a,b,c,d,e,f,g){if(b === Lc)return null;f = f[f.length - 1];f = !(!f || !f.f);return !g.b.length || f?new Js(c,d,e,a):b === Nc?new Ls(c,d,e):null;};var Os=new te(function(){var a=J("uaStylesheetBase");ph.get().then(function(b){var c=pa("user-agent-base.css",oa);b = new qj(null,null,null,null,null,b,!0);b.Mc("UA");pj = b.l;Vf(c,b,null,null).Ea(a);});return a.result();},"uaStylesheetBaseFetcher");function Ps(a,b,c,d,e,f,g,h,l,k){this.l = a;this.f = b;this.b = c;this.g = d;this.I = e;this.j = f;this.D = a.R;this.G = g;this.h = h;this.C = l;this.H = k;this.A = a.l;zb(this.b,function(a){var b=this.b,c;c = (c = b.b[a])?(c = c.b[0])?c.b:null:null;var d;d = b.b[a];if(d = Qs(this,d?d.g:"any"))d = (a = b.b[a])?0 < a.b.length && a.b[0].b.f <= this.D:!1;return d && !!c && !Rs(this,c);});yb(this.b,new xb(this.b,function(){return this.Z + this.b.page;},"page-number"));}function Ss(a,b,c,d){if(a.C.length){var e=new Cb(0,b,c,d);a = a.C;for(var f={},g=0;g < a.length;g++) Lh(e,f,a[g],0,null,null,null);g = f.width;a = f.height;var h=f["text-zoom"];if(g && a || h)if((f = Ab.em,(h?h.evaluate(e,"text-zoom"):null) === wd && (h = f / d,d = f,b *= h,c *= h),g && a && (g = Hc(g.evaluate(e,"width"),e),e = Hc(a.evaluate(e,"height"),e),0 < g && 0 < e)))return {width:g,height:e,fontSize:d};}return {width:b,height:c,fontSize:d};}function Ts(a,b,c,d,e,f,g,h,l,k,m){Cb.call(this,0,d.width,d.height,d.fontSize);this.style = a;this.ba = b;this.lang = b.lang || c;this.viewport = d;this.l = {body:!0};this.g = e;this.C = this.b = this.I = this.f = this.G = null;this.D = 0;this.wb = f;this.j = new $l(this.style.D);this.Fa = {};this.X = null;this.h = m;this.xb = new Jm(null,null,null,null,null,null,null);this.R = {};this.sa = null;this.$a = g;this.vb = h;this.Z = l;this.ib = k;for(var p in a.h) (b = a.h[p]["flow-consume"]) && (b.evaluate(this,"flow-consume") == Jc?this.l[p] = !0:delete this.l[p]);this.Ja = {};this.ja = this.ia = 0;}t(Ts,Cb);function Us(a){var b=J("StyleInstance.init"),c=new up(a.h,a.ba.url),d=new tp(a.h,a.ba.url,a.style.f,a.style.b);a.f = new Hl(a.ba,a.style.g,a.style.f,a,a.l,a.style.A,c,d);d.h = a.f;Rl(a.f,a);a.I = {};a.I[a.ba.url] = a.f;var e=Ol(a.f);a.sa = Dr(e);a.G = new Bq(a.style.I);c = new $i(a.style.g,a,c,d);a.G.j(c,e);Aq(a.G,a);a.X = new ks(c,a.style.b,a.G,a,e);e = [];for(c = 0;c < a.style.j.length;c++) if((d = a.style.j[c],!d.ga || d.ga.evaluate(a)))d = Xl(d.rc,a),d = new Yl(d),e.push(d);fm(a.wb,e,a.j).Ea(b);var f=a.style.H;Object.keys(f).forEach(function(a){var b=Kr(Jr(f[a]),this);this.Ja[a] = {width:b.Wb + 2 * b.de,height:b.Vb + 2 * b.de};},a);return b.result();}function Sl(a,b,c){if(a = a.b)a.f[b.b] || (a.f[b.b] = c),c = a.b[b.b],c || (c = new Tk(),a.b[b.b] = c),c.b.push(new Sk(new Qk({na:[{node:b.element,Za:Bk,ra:null,Aa:null,xa:null,Ma:0}],la:0,K:!1,Ia:null}),b));}function Vs(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d < b.b.length;d++) {for(var e=b.b[d].f.f,f=e.na[0].node,g=e.la,h=e.K,l=0;f.ownerDocument != a.ba.b;) l++,f = e.na[l].node,h = !1,g = 0;e = Nj(a.ba,f,g,h);e < c && (c = e);}return c;}function Ws(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l) {var f=b.b[e];if(!(c || f && f.b.length) && a.b){f = a.f;f.O = e;for(var g=0;null != f.O && (g += 5E3,Pl(f,g,0) != Number.POSITIVE_INFINITY););f = a.b.b[e];b != a.b && f && (f = f.clone(),b.b[e] = f);}f && (f = Vs(a,f),f < d && (d = f));}return d;}function Qs(a,b){switch(b){case "left":case "right":case "recto":case "verso":return new hc(a.style.b,b + "-page").evaluate(a);default:return !0;}}function Xs(a,b){var c=a.b,d=Ws(a,c);if(d == Number.POSITIVE_INFINITY)return null;for(var e=a.G.A,f,g=0;g < e.length;g++) if((f = e[g],"vivliostyle-page-rule-master" !== f.b.Zb)){var h=1,l=kq(f,a,"utilization");l && l.Ve() && (h = l.L);var l=Eb(a,"em",!1),k=a.Wb() * a.Vb();a.D = Pl(a.f,d,Math.ceil(h * k / (l * l)));h = a;l = c;k = void 0;for(k in l.b) {var m=l.b[k];if(m && 0 < m.b.length){var p=m.b[0].b;if(Vs(h,m) === p.f){a: switch((p = m.g,p)){case "left":case "right":case "recto":case "verso":break a;default:p = null;}m.g = hm(yl(p,m.b[0].b.g));}}}a.C = c.clone();h = a;l = h.b.page;k = void 0;for(k in h.b.b) for(m = h.b.b[k],p = m.b.length - 1;0 <= p;p--) {var q=m.b[p];0 > q.b.kb && q.b.f < h.D && (q.b.kb = l);}Db(a,a.style.b);h = kq(f,a,"enabled");if(!h || h === Kd){c = a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.D);d = void 0;for(d in c.b.b) for(e = c.b.b[d],g = 0;g < e.b.length;g++) v.debug("  Chunk",d + ":",e.b[g].b.f);d = a.X;e = f;f = b;c = e.b;Object.keys(f).length?(e = c,g = ms(d,f),e = e.l + "^" + g,g = d.j[e],g || ("background-host" === c.Zb?(c = d,f = new Vr(c.l,c.h.b,f).h(c.h),f.j(c.b,c.g),Aq(f,c.f),g = f):g = ns(d,f,c),d.j[e] = g),f = g.b,f.f.g = f,f = g):(c.f.g = c,f = e);return f;}}throw Error("No enabled page masters");}function Rs(a,b){var c=a.C.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length || e < f[0])return !1;var c=Ma(f.length,function(a){return f[a] > e;}) - 1,c=f[c],d=a.C.b[d],g=Vs(a,d);return c < g?!1:g < c?!0:!Qs(a,d.g);}return !1;}function Ys(a,b,c){a = a.b.f[c];a.F || (a.F = new ao(null));b.Ye = a.F;}function Zs(a){var b=a.h,c=bn(b),d=J("layoutDeferredPageFloats"),e=!1,f=0;re(function(d){if(f === c.length)P(d);else {var g=c[f++],l=g.qa,k=Rm(l),m=k.jf(l,b);m && Hm(m,l)?O(d):Sm(b,l) || dn(b,l)?(cn(b,g),P(d)):Co(a,g,k,null,m).then(function(a){a?(a = on(b.parent))?P(d):(on(b) && !a && (e = !0,b.Gc = !1),O(d)):P(d);});}}).then(function(){e && Um(b);M(d,!0);});return d.result();}function $s(a,b,c){var d=a.b.b[c];if(!d || !Qs(a,d.g))return L(!0);d.g = "any";Ys(a,b,c);Ao(b);a.l[c] && 0 < b.vb.length && (b.wb = !1);var e=J("layoutColumn");Zs(b).then(function(){if(on(b.h))M(e,!0);else {var f=[],g=[],h=!0;re(function(e){if(!Ym(b.h,c))for(;0 < d.b.length - g.length;) {for(var k=0;0 <= g.indexOf(k);) k++;var l=d.b[k];if(l.b.f > a.D || Rs(a,l.b))break;for(var p=k + 1;p < d.b.length;p++) if(!(0 <= g.indexOf(p))){var q=d.b[p];if(q.b.f > a.D || Rs(a,q.b))break;uk(q.b,l.b) && (l = q,k = p);}var r=l.b,z=!0;rm(b,l.f,h,d.f).then(function(a){if(on(b.h))P(e);else if((h = !1,!l.b.vg || a && !r.h || f.push(k),r.h))g.push(k),P(e);else {var c=!!a || !!b.f,m;0 < en(b.h).length && b.yb?a?(m = a.clone(),m.f = b.yb):m = new Qk(b.yb):m = null;if(b.f && m)l.f = m,d.f = b.f,b.f = null;else {g.push(k);if(a || m)l.f = a || m,f.push(k);b.f && (d.g = hm(b.f));}c?P(e):(b.wb = !1,z?z = !1:O(e));}});if(z){z = !1;return;}}P(e);}).then(function(){if(!on(b.h)){d.b = d.b.filter(function(a,b){return 0 <= f.indexOf(b) || 0 > g.indexOf(b);});"column" === d.f && (d.f = null);ip(b);var a=Bn(b.h);xo(b,a);}M(e,!0);});}});return e.result();}function at(a,b,c,d,e,f,g,h,l,k,m,p,q,r,z){var u=b.u?b.h && b.O:b.g && b.R,A=f.element,H=new Jm(l,"column",null,h,null,null,null),G=a.b.clone(),K=J("createAndLayoutColumn"),I;re(function(b){var K=new Rn([new sp(a.h,a.b.page - 1)].concat(Fn(H)));if(1 < k){var ia=a.viewport.b.createElement("div");w(ia,"position","absolute");A.appendChild(ia);I = new pm(ia,r,a.g,K,H);I.wb = z;I.u = f.u;I.Kb = f.Kb;I.Ad = f.Ad;f.u?(K = g * (p + m) + f.I,el(I,f.H,f.width),dl(I,K,p)):(K = g * (p + m) + f.H,dl(I,f.I,f.height),el(I,K,p));I.D = c;I.G = d;}else I = new pm(A,r,a.g,K,H),cl(I,f);I.$a = u?[]:e.concat();I.xb = q;Nm(H,I);0 <= I.width?$s(a,I,h).then(function(){on(H) || kn(H);on(I.h) && !on(l)?(I.h.Gc = !1,a.b = G.clone(),I.element !== A && A.removeChild(I.element),O(b)):P(b);}):(kn(H),P(b));}).then(function(){M(K,I);});return K.result();}function bt(a,b,c,d,e){var f=kq(c,a,"writing-mode") || null;a = kq(c,a,"direction") || null;return new Jm(b,"region",d,e,null,f,a);}function ct(a,b,c,d,e,f,g,h,l,k){function m(){p.b = q.clone();return dt(p,b,c,d,e,f,g,r,h,l,k,z).fa(function(a){return a?L({qb:a,position:p.b}):L(null);});}var p=a,q=p.b.clone(),r=bt(p,g,c,h,l),z=!0;return m().fa(function(a){if(!a)return L(null);if(1 >= k)return L(a.qb);var b=kq(c,p,"column-fill") || Mc,b=Ns(k,b,m,r,h,a.qb,p.b.b[l]);if(!b)return L(a.qb);z = !1;g.h = !0;r.h = !0;return Ds(b,a).fa(function(a){g.h = !1;g.Gc = !1;r.h = !1;p.b = a.position;return L(a.qb);});});}function dt(a,b,c,d,e,f,g,h,l,k,m,p){var q=J("layoutFlowColumns"),r=a.b.clone(),z=Z(c,a,"column-gap"),u=1 < m?Z(c,a,"column-width"):l.width,A=jq(c,a),H=kq(c,a,"shape-inside"),G=Bg(H,0,0,l.width,l.height,a),K=new Uq(k,a,a.viewport,a.f,A,a.ba,a.j,a.style.G,a,b,a.$a,a.vb,a.ib),I=0,ia=null,Aa=[];re(function(b){at(a,c,d,e,f,l,I++,k,h,m,z,u,G,K,p).then(function(c){on(g)?(Aa = null,P(b)):((c.f && "column" !== c.f || I === m) && !on(h) && kn(h),on(h)?(I = 0,a.b = r.clone(),h.Gc = !1,h.h?(Aa = null,P(b)):O(b)):(ia = c,Aa[I - 1] = ia,ia.f && "column" != ia.f && (I = m,"region" != ia.f && (a.R[k] = !0)),I < m?O(b):P(b)));});}).then(function(){M(q,Aa);});return q.result();}function et(a,b,c,d,e,f,g,h){dq(c);var l=kq(c,a,"enabled");if(l && l !== Kd)return L(!0);var k=J("layoutContainer"),m=kq(c,a,"wrap-flow") === Lc,l=kq(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=kq(c,a,"position");w(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new Xk(p);r.u = c.u;r.$a = g;c.Xb(a,r,b,a.j,a.g);r.D = e;r.G = f;e += r.left + r.marginLeft + r.X;f += r.top + r.marginTop + r.Z;(c instanceof $r || c instanceof Up && !(c instanceof Zr)) && Nm(h,r);var z=!1;if(l && l.Hf())if(a.R[l.toString()])on(h) || c.Dd(a,r,b,null,1,a.g,a.j),l = L(!0);else {var u=J("layoutContainer.inner"),A=l.toString(),H=Z(c,a,"column-count");ct(a,b,c,e,f,g,h,r,A,H).then(function(d){if(!on(h)){var e=d[0];e.element === p && (r = e);r.g = Math.max.apply(null,d.map(function(a){return a.g;}));c.Dd(a,r,b,e,H,a.g,a.j);(d = a.b.b[A]) && "region" === d.f && (d.f = null);}M(u,!0);});l = u.result();}else {if((l = kq(c,a,"content")) && ml(l)){q = "span";l.url && (q = "img");var G=a.viewport.b.createElement(q);l.ca(new ll(G,a,l,Kp(a.h)));p.appendChild(G);"img" == q && zq(c,a,G,a.j);yq(c,a,r,a.j);}else c.sa && (d.removeChild(p),z = !0);z || c.Dd(a,r,b,null,1,a.g,a.j);l = L(!0);}l.then(function(){if(on(h))M(k,!0);else {if(!c.g || 0 < Math.floor(r.g)){if(!z && !m){var l=kq(c,a,"shape-outside"),l=jl(r,l,a);g.push(l);}}else if(!c.A.length){d.removeChild(p);M(k,!0);return;}var q=c.A.length - 1;qe(function(){for(;0 <= q;) {var d=c.A[q--],d=et(a,b,d,p,e,f,g,h);if(d.Ra())return d.fa(function(){return L(!on(h));});if(on(h))break;}return L(!1);}).then(function(){M(k,!0);});}});return k.result();}function ft(a){var b=a.b.page,c;for(c in a.b.b) for(var d=a.b.b[c],e=d.b.length - 1;0 <= e;e--) {var f=d.b[e];0 <= f.b.kb && f.b.kb + f.b.l - 1 <= b && d.b.splice(e,1);}}function gt(a,b){for(var c in a.l) {var d=b.b[c];if(d && 0 < d.b.length)return !1;}return !0;}function ht(a,b,c){a.R = {};c?(a.b = c.clone(),Kl(a.f,c.g)):(a.b = new Vk(),Kl(a.f,-1));a.lang && b.g.setAttribute("lang",a.lang);c = a.b;c.page++;Db(a,a.style.b);a.C = c.clone();var d=ls(a.X),e=Xs(a,d);if(!e)return L(null);lk(b,e.b.b.width.value === Md);mk(b,e.b.b.height.value === Nd);a.h.j = b;Fp(a.h,d,a);var f=Kr(Jr(d),a);it(a,f,b);Rr(d,f,b,a);var g=f.Nb + f.Mb,d=kq(e,a,"writing-mode") || ed,f=kq(e,a,"direction") || od,h=new Jm(a.xb,"page",null,null,null,d,f),l=J("layoutNextPage");re(function(c){et(a,b,e,b.g,g,g + 1,[],h).then(function(){on(h) || kn(h);on(h)?(a.b = a.C.clone(),h.Gc = !1,O(c)):P(c);});}).then(function(){e.Z(a,b,a.g);var d=new hc(e.b.f,"left-page");b.l = d.evaluate(a)?"left":"right";ft(a);c = a.b;Object.keys(c.b).forEach(function(b){b = c.b[b];var d=b.f;!d || "page" !== d && Qs(a,d) || (b.f = null);});a.b = a.C = null;c.g = a.f.b;ok(b,a.style.l.O[a.ba.url],a.g);gt(a,c) && (c = null);M(l,c);});return l.result();}function it(a,b,c){a.O = b.Wb;a.J = b.Vb;a.ja = b.Wb + 2 * b.de;a.ia = b.Vb + 2 * b.de;c.M.style.width = a.ja + "px";c.M.style.height = a.ia + "px";c.g.style.left = b.Nb + "px";c.g.style.right = b.Nb + "px";c.g.style.top = b.Nb + "px";c.g.style.bottom = b.Nb + "px";c.g.style.padding = b.Mb + "px";c.g.style.paddingTop = b.Mb + 1 + "px";}function jt(a,b,c,d){qj.call(this,a.j,a,b,c,d,a.h,!c);this.g = a;this.G = !1;}t(jt,qj);n = jt.prototype;n.Rd = function(){};n.Qd = function(a,b,c){a = new Tp(this.g.A,a,b,c,this.g.H,this.ga,pf(this.ma));rf(this.g,new Gq(a.f,this.g,a,this.C));};n.uc = function(a){a = a.Cc;this.ga && (a = nc(this.f,this.ga,a));rf(this.g,new jt(this.g,a,this,this.H));};n.Nd = function(){rf(this.g,new wj(this.f,this.ma));};n.Pd = function(){var a={};this.g.C.push({rc:a,ga:this.ga});rf(this.g,new xj(this.f,this.ma,null,a,this.g.h));};n.Od = function(a){var b=this.g.l[a];b || (b = {},this.g.l[a] = b);rf(this.g,new xj(this.f,this.ma,null,b,this.g.h));};n.Td = function(){var a={};this.g.I.push(a);rf(this.g,new xj(this.f,this.ma,this.ga,a,this.g.h));};n.hd = function(a){var b=this.g.D;if(a){var c=Ih(b,"_pseudos"),b=c[a];b || (b = {},c[a] = b);}rf(this.g,new xj(this.f,this.ma,null,b,this.g.h));};n.Sd = function(){this.G = !0;this.Fb();};n.Lc = function(){var a=new vs(this.g.A,this.g,this,this.C,this.g.G);rf(this.g,a);a.Lc();};n.Ba = function(){qj.prototype.Ba.call(this);if(this.G){this.G = !1;var a="R" + this.g.O++,b=C(a),c;this.ga?c = new Dh(b,0,this.ga):c = new V(b,0);Kh(this.bb,"region-id").push(c);this.Qb();a = new jt(this.g,this.ga,this,a);rf(this.g,a);a.Ba();}};function kt(a){var b=a.getAttribute("content");if(!b)return "";a = {};for(var c;c = b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);) b = b.substr(c[0].length),a[c[1]] = c[2];b = a.width - 0;a = a.height - 0;return b && a?"@-epubx-viewport{width:" + b + "px;height:" + a + "px;}":"";}function lt(a){qf.call(this);this.h = a;this.j = new ub(null);this.A = new ub(this.j);this.H = new Qp(this.j);this.J = new jt(this,null,null,null);this.O = 0;this.C = [];this.D = {};this.l = {};this.I = [];this.G = {};this.b = this.J;}t(lt,qf);lt.prototype.error = function(a){v.b("CSS parser:",a);};function mt(a,b){return nt(b,a);}function ot(a){jf.call(this,mt,"document");this.R = a;this.I = {};this.A = {};this.f = {};this.O = {};this.l = null;this.b = [];this.J = !1;}t(ot,jf);function pt(a,b,c){qt(a,b,c);var d=pa("user-agent.xml",oa),e=J("OPSDocStore.init");ph.get().then(function(b){a.l = b;Os.get().then(function(){a.load(d).then(function(){a.J = !0;M(e,!0);});});});return e.result();}function qt(a,b,c){a.b.splice(0);b && b.forEach(a.X,a);c && c.forEach(a.Z,a);}ot.prototype.X = function(a){var b=a.url;b && (b = pa(b,na));this.b.push({url:b,text:a.text,eb:"Author",Ga:null,media:null});};ot.prototype.Z = function(a){var b=a.url;b && (b = pa(b,na));this.b.push({url:b,text:a.text,eb:"User",Ga:null,media:null});};function nt(a,b){var c=J("OPSDocStore.load"),d=b.url;Vj(b,a).then(function(b){if(b){if(a.J)for(var e=Ud("PREPROCESS_SINGLE_DOCUMENT"),g=0;g < e.length;g++) try{e[g](b.b);}catch(u) {v.b("Error during single document preprocessing:",u);}for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g < h.length;g++) {var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k && m && p && l && e.push({rg:k,event:m,action:p,ed:l});}a.O[d] = e;var q=[];q.push({url:pa("user-agent-page.css",oa),text:null,eb:"UA",Ga:null,media:null});if(g = b.l)for(g = g.firstChild;g;g = g.nextSibling) if(1 == g.nodeType)if((e = g,h = e.namespaceURI,k = e.localName,"http://www.w3.org/1999/xhtml" == h))if("style" == k)q.push({url:d,text:e.textContent,eb:"Author",Ga:null,media:null});else if("link" == k){if((m = e.getAttribute("rel"),h = e.getAttribute("class"),k = e.getAttribute("media"),"stylesheet" == m || "alternate stylesheet" == m && h))e = e.getAttribute("href"),e = pa(e,d),q.push({url:e,text:null,Ga:h,media:k,eb:"Author"});}else "meta" == k && "viewport" == e.getAttribute("name") && q.push({url:d,text:kt(e),eb:"Author",Ga:null,media:null});else "http://www.gribuser.ru/xml/fictionbook/2.0" == h?"stylesheet" == k && "text/css" == e.getAttribute("type") && q.push({url:d,text:e.textContent,eb:"Author",Ga:null,media:null}):"http://example.com/sse" == h && "property" === k && (h = e.getElementsByTagName("name")[0]) && "stylesheet" === h.textContent && (e = e.getElementsByTagName("value")[0]) && (e = pa(e.textContent,d),q.push({url:e,text:null,Ga:null,media:null,eb:"Author"}));for(g = 0;g < a.b.length;g++) q.push(a.b[g]);for(var r="",g=0;g < q.length;g++) r += q[g].url,r += "^",q[g].text && (r += q[g].text),r += "^";var z=a.I[r];z?(a.f[d] = z,M(c,b)):(g = a.A[r],g || (g = new te(function(){var b=J("fetchStylesheet"),c=0,d=new lt(a.l);qe(function(){if(c < q.length){var a=q[c++];d.Mc(a.eb);return null !== a.text?Wf(a.text,d,a.url,a.Ga,a.media).wc(!0):Vf(a.url,d,a.Ga,a.media);}return L(!1);}).then(function(){z = new Ps(a,d.j,d.A,d.J.l,d.H,d.C,d.D,d.l,d.I,d.G);a.I[r] = z;delete a.A[r];M(b,z);});return b.result();},"FetchStylesheet " + d),a.A[r] = g,g.start()),g.get().then(function(e){a.f[d] = e;M(c,b);}));}else M(c,null);});return c.result();};function rt(a){return String.fromCharCode(a >>> 24 & 255,a >>> 16 & 255,a >>> 8 & 255,a & 255);}function st(a){var b=new Ea();b.append(a);var c=55 - a.length & 63;for(b.append("");0 < c;) c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(rt(8 * a.length));a = b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e < a.length;e += 64) {for(d = 0;16 > d;d++) {var f=a.substr(e + 4 * d,4);c[d] = (f.charCodeAt(0) & 255) << 24 | (f.charCodeAt(1) & 255) << 16 | (f.charCodeAt(2) & 255) << 8 | f.charCodeAt(3) & 255;}for(;80 > d;d++) f = c[d - 3] ^ c[d - 8] ^ c[d - 14] ^ c[d - 16],c[d] = f << 1 | f >>> 31;var f=b[0],g=b[1],h=b[2],l=b[3],k=b[4],m;for(d = 0;80 > d;d++) m = 20 > d?(g & h | ~g & l) + 1518500249:40 > d?(g ^ h ^ l) + 1859775393:60 > d?(g & h | g & l | h & l) + 2400959708:(g ^ h ^ l) + 3395469782,m += (f << 5 | f >>> 27) + k + c[d],k = l,l = h,h = g << 30 | g >>> 2,g = f,f = m;b[0] = b[0] + f | 0;b[1] = b[1] + g | 0;b[2] = b[2] + h | 0;b[3] = b[3] + l | 0;b[4] = b[4] + k | 0;}return b;}function tt(a){a = st(a);for(var b=[],c=0;c < a.length;c++) {var d=a[c];b.push(d >>> 24 & 255,d >>> 16 & 255,d >>> 8 & 255,d & 255);}return b;}function ut(a){a = st(a);for(var b=new Ea(),c=0;c < a.length;c++) b.append(rt(a[c]));a = b.toString();b = new Ea();for(c = 0;c < a.length;c++) b.append((a.charCodeAt(c) | 256).toString(16).substr(1));return b.toString();};function vt(a,b,c,d,e,f,g,h,l,k){this.b = a;this.url = b;this.lang = c;this.f = d;this.l = e;this.Y = lb(f);this.A = g;this.j = h;this.h = l;this.g = k;this.Xa = this.page = null;}function wt(a,b,c){if(c--)for(b = b.firstChild;b;b = b.nextSibling) if(1 == b.nodeType){var d=b;"auto" != Ca(d,"height","auto") && (w(d,"height","auto"),wt(a,d,c));"absolute" == Ca(d,"position","static") && (w(d,"position","relative"),wt(a,d,c));}}function xt(a){var b=a.target,c="▸" == b.textContent;b.textContent = c?"▾":"▸";for(b = b.parentNode.firstChild;b;) if(1 != b.nodeType)b = b.nextSibling;else {var d=b;"toc-container" == d.getAttribute("data-adapt-class")?b = d.firstChild:("toc-node" == d.getAttribute("data-adapt-class") && (d.style.height = c?"auto":"0px"),b = b.nextSibling);}a.stopPropagation();}vt.prototype.se = function(a){var b=this.A.se(a);return function(a,d,e){var c=e.behavior;if(!c || "toc-node" != c.toString() && "toc-container" != c.toString())return b(a,d,e);a = d.getAttribute("data-adapt-class");"toc-node" == a && (e = d.firstChild,"▸" != e.textContent && (e.textContent = "▸",w(e,"cursor","pointer"),e.addEventListener("click",xt,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node" == c.toString()?(e = d.ownerDocument.createElement("div"),e.textContent = "▹",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node" != a && "toc-container" != a || w(g,"height","0px")):"toc-node" == a && g.setAttribute("data-adapt-class","toc-container");return L(g);};};vt.prototype.Md = function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=J("showTOC"),h=new kk(a,a);this.page = h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=Ss(k,c,1E5,e);b = new Cr(b.window,l.fontSize,b.root,l.width,l.height);var p=new Ts(k,d,f.lang,b,f.f,f.l,f.se(d),f.j,0,f.h,f.g);f.Xa = p;p.Y = f.Y;Us(p).then(function(){ht(p,h,null).then(function(){wt(f,a,2);M(g,h);});});});return g.result();};vt.prototype.Fd = function(){if(this.page){var a=this.page;this.Xa = this.page = null;w(a.M,"visibility","none");var b=a.M.parentNode;b && b.removeChild(a.M);}};vt.prototype.We = function(){return !!this.page;};function yt(){ot.call(this,zt(this));this.g = new jf(Vj,"document");this.G = new jf(lf,"text");this.H = {};this.ja = {};this.C = {};this.D = {};}t(yt,ot);function zt(a){return function(b){return a.C[b];};}function At(a,b,c){var d=J("loadEPUBDoc");"/" !== b.substring(b.length - 1) && (b += "/");c && a.G.fetch(b + "?r=list");a.g.fetch(b + "META-INF/encryption.xml");var e=b + "META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from " + e).then(function(f){if(f){f = ek(Kj(Kj(Kj(new Lj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g < f.length;g++) {var h=f[g];if(h){Bt(a,b,h,c).Ea(d);return;}}M(d,null);}else v.error("Received an empty response for EPUB container.xml " + e + ". This may be caused by the server not allowing cross origin requests.");});return d.result();}function Bt(a,b,c,d){var e=b + c,f=a.H[e];if(f)return L(f);var g=J("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b + "META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.G.load(b + "?r=list"):L(null)).then(function(d){f = new Ct(a,b);Dt(f,c,h,d,b + "?r=manifest").then(function(){a.H[e] = f;a.ja[b] = f;M(g,f);});});}):v.error("Received an empty response for EPUB OPF " + e + ". This may be caused by the server not allowing cross origin requests.");});return g.result();}function Et(a,b,c){var d=J("EPUBDocStore.load");b = ma(b);(a.D[b] = nt(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Ld:null})).Ea(d);return d.result();}yt.prototype.load = function(a){var b=ma(a);if(a = this.D[b])return a.Ra()?a:L(a.get());var c=J("EPUBDocStore.load");a = yt.Yf.load.call(this,b,!0,"Failed to fetch a source document from " + b);a.then(function(a){a?M(c,a):v.error("Received an empty response for " + b + ". This may be caused by the server not allowing cross origin requests.");});return c.result();};function Ft(){this.id = null;this.src = "";this.h = this.f = null;this.T = -1;this.l = 0;this.A = null;this.b = this.g = 0;this.sc = this.kb = null;this.j = Pa;}function Gt(a){return a.id;}function Ht(a){var b=tt(a);return function(a){var c=J("deobfuscator"),e,f;a.slice?(e = a.slice(0,1040),f = a.slice(1040,a.size)):(e = a.webkitSlice(0,1040),f = a.webkitSlice(1040,a.size - 1040));hf(e).then(function(a){a = new DataView(a);for(var d=0;d < a.byteLength;d++) {var e=a.getUint8(d),e=e ^ b[d % 20];a.setUint8(d,e);}M(c,gf([a,f]));});return c.result();};}var It={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Jt=It.dcterms + "language",Kt=It.dcterms + "title";function Lt(a,b){var c={};return function(d,e){var f,g,h=d.r || c,l=e.r || c;if(a == Kt && (f = "main" == h["http://idpf.org/epub/vocab/package/#title-type"],g = "main" == l["http://idpf.org/epub/vocab/package/#title-type"],f != g))return f?-1:1;f = parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f) && (f = Number.MAX_VALUE);g = parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g) && (g = Number.MAX_VALUE);return f != g?f - g:a != Jt && b && (f = (h[Jt] || h["http://idpf.org/epub/vocab/package/#alternate-script"]) == b,g = (l[Jt] || l["http://idpf.org/epub/vocab/package/#alternate-script"]) == b,f != g)?f?-1:1:d.o - e.o;};}function Mt(a,b){function c(a){for(var b in a) {var d=a[b];d.sort(Lt(b,k));for(var e=0;e < d.length;e++) {var f=d[e].r;f && c(f);}}}function d(a){return Sa(a,function(a){return Ra(a,function(a){var b={v:a.value,o:a.order};a.bh && (b.s = a.scheme);if(a.id || a.lang){var c=l[a.id];if(c || a.lang)a.lang && (a = {name:Jt,value:a.lang,lang:null,id:null,Be:a.id,scheme:null,order:a.order},c?c.push(a):c = [a]),c = Qa(c,function(a){return a.name;}),b.r = d(c);}return b;});});}function e(a){if(a && (a = a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b + a[3];}return null;}var f;if(b){f = {};for(var g in It) f[g] = It[g];for(;g = b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);) b = b.substr(g[0].length),f[g[1]] = g[2];}else f = It;var h=1;g = ck(dk(a),function(a){if("meta" == a.localName){var b=e(a.getAttribute("property"));if(b)return {name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Be:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))};}else if("http://purl.org/dc/elements/1.1/" == a.namespaceURI)return {name:It.dcterms + a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Be:null,scheme:null};return null;});var l=Qa(g,function(a){return a.Be;});g = d(Qa(g,function(a){return a.Be?null:a.name;}));var k=null;g[Jt] && (k = g[Jt][0].v);c(g);return g;}function Nt(){var a=window.MathJax;return a?a.Hub:null;}var Ot={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};function Ct(a,b){this.h = a;this.l = this.f = this.b = this.j = this.g = null;this.D = b;this.C = null;this.R = {};this.lang = null;this.G = 0;this.J = {};this.X = this.O = this.Z = null;this.H = {};this.I = null;this.A = Pt(this);Nt() && (th["http://www.w3.org/1998/Math/MathML"] = !0);}function Pt(a){function b(){}b.prototype.Ee = function(a,b){return "viv-id-" + ra(b + (a?"#" + a:""),":");};b.prototype.nd = function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1] || d,c=c[2];if(f && a.j.some(function(a){return a.src === f;}))return "#" + this.Ee(c,f);}return b;};b.prototype.wg = function(a){"#" === a.charAt(0) && (a = a.substring(1));a.indexOf("viv-id-") || (a = a.substring(7));return (a = Ka(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[];};return new b();}function Qt(a,b){return a.D?b.substr(0,a.D.length) == a.D?decodeURI(b.substr(a.D.length)):null:b;}function Dt(a,b,c,d,e){a.g = b;var f=Kj(new Lj([b.b]),"package"),g=ek(f,"unique-identifier")[0];g && (g = Rj(b,b.url + "#" + g)) && (a.C = g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j = Ra(Kj(Kj(f,"manifest"),"item").b,function(c){var d=new Ft(),e=b.url;d.id = c.getAttribute("id");d.src = pa(c.getAttribute("href"),e);d.f = c.getAttribute("media-type");if(e = c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g < e.length;g++) f[e[g]] = !0;d.j = f;}(c = c.getAttribute("fallback")) && !Ot[d.f] && (h[d.src] = c);!a.O && d.j.nav && (a.O = d);!a.X && d.j["cover-image"] && (a.X = d);return d;});a.f = Oa(a.j,Gt);a.l = Oa(a.j,function(b){return Qt(a,b.src);});for(var l in h) for(g = l;;) {g = a.f[h[g]];if(!g)break;if(Ot[g.f]){a.H[l] = g.src;break;}g = g.src;}a.b = Ra(Kj(Kj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d = a.f[d])d.h = b,d.T = c;return d;});if(l = ek(Kj(f,"spine"),"toc")[0])a.Z = a.f[l];if(l = ek(Kj(f,"spine"),"page-progression-direction")[0]){a: switch(l){case "ltr":l = "ltr";break a;case "rtl":l = "rtl";break a;default:throw Error("unknown PageProgression: " + l);}a.I = l;}var g=c?ek(Kj(Kj(ak(Kj(Kj(new Lj([c.b]),"encryption"),"EncryptedData"),Zj()),"CipherData"),"CipherReference"),"URI"):[],k=Kj(Kj(f,"bindings"),"mediaType").b;for(c = 0;c < k.length;c++) {var m=k[c].getAttribute("handler");(l = k[c].getAttribute("media-type")) && m && a.f[m] && (a.R[l] = a.f[m].src);}a.J = Mt(Kj(f,"metadata"),ek(f,"prefix")[0]);a.J[Jt] && (a.lang = a.J[Jt][0].v);if(!d){if(0 < g.length && a.C)for(d = Ht(a.C),c = 0;c < g.length;c++) a.h.C[a.D + g[c]] = d;return L(!0);}f = new Ea();k = {};if(0 < g.length && a.C)for(l = "1040:" + ut(a.C),c = 0;c < g.length;c++) k[g[c]] = l;for(c = 0;c < d.length;c++) {var p=d[c];if(m = p.n){var q=decodeURI(m),g=a.l[q];l = null;g && (g.A = 0 != p.m,g.l = p.c,g.f && (l = g.f.replace(/\s+/g,"")));g = k[q];if(l || g)f.append(m),f.append(" "),f.append(l || "application/octet-stream"),g && (f.append(" "),f.append(g)),f.append("\n");}}Rt(a);return ff(e,"","POST",f.toString(),"text/plain");}function Rt(a){for(var b=0,c=0;c < a.b.length;c++) {var d=a.b[c],e=Math.ceil(d.l / 1024);d.g = b;d.b = e;b += e;}a.G = b;}function St(a,b,c){a.f = {};a.l = {};a.j = [];a.b = a.j;var d=a.g = new Jj(null,"",new DOMParser().parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Ft();b.T = a.index;b.id = "item" + (a.index + 1);b.src = a.url;b.kb = a.kb;b.sc = a.sc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h = c;this.f[b.id] = b;this.l[a.url] = b;this.j.push(b);},a);return c?Et(a.h,b[0].url,c):L(null);}function Tt(a,b,c){var d=a.b[b],e=J("getCFI");a.h.load(d.src).then(function(a){var b=Pj(a,c),f=null;b && (a = Nj(a,b,0,!1),f = new gb(),jb(f,b,c - a),d.h && jb(f,d.h,0),f = f.toString());M(e,f);});return e.result();}function Ut(a,b){return $d("resolveFragment",function(c){if(b){var d=new gb();hb(d,b);var e;if(a.g){var f=ib(d,a.g.b);if(1 != f.node.nodeType || f.K || !f.ed){M(c,null);return;}var g=f.node,h=g.getAttribute("idref");if("itemref" != g.localName || !h || !a.f[h]){M(c,null);return;}e = a.f[h];d = f.ed;}else e = a.b[0];a.h.load(e.src).then(function(a){var b=ib(d,a.b);a = Nj(a,b.node,b.offset,b.K);M(c,{T:e.T,Ha:a,aa:-1});});}else M(c,null);},function(a,d){v.b(d,"Cannot resolve fragment:",b);M(a,null);});}function Vt(a,b){return $d("resolveEPage",function(c){if(0 >= b)M(c,{T:0,Ha:0,aa:-1});else {var d=Ma(a.b.length,function(c){c = a.b[c];return c.g + c.b > b;}),e=a.b[d];a.h.load(e.src).then(function(a){b -= e.g;b > e.b && (b = e.b);var f=0;0 < b && (a = Oj(a),f = Math.round(a * b / e.b),f == a && f--);M(c,{T:d,Ha:f,aa:-1});});}},function(a,d){v.b(d,"Cannot resolve epage:",b);M(a,null);});}function Wt(a,b){var c=a.b[b.T];if(0 >= b.Ha)return L(c.g);var d=J("getEPage");a.h.load(c.src).then(function(a){a = Oj(a);M(d,c.g + Math.min(a,b.Ha) * c.b / a);});return d.result();}function Xt(a,b){return {page:a,position:{T:a.T,aa:b,Ha:a.offset}};}function Yt(a,b,c,d,e){this.b = a;this.viewport = b;this.j = c;this.A = e;this.tc = [];this.l = [];this.Y = lb(d);this.h = new Ar(b);this.f = new Dp(a.A);}function Zt(a,b){var c=a.tc[b.T];return c?c.sb[b.aa]:null;}n = Yt.prototype;n.Sb = function(a){return this.b.I?this.b.I:(a = this.tc[a?a.T:0])?a.Xa.sa:null;};function $t(a,b,c,d){c.M.style.display = "none";c.M.style.visibility = "visible";c.M.style.position = "";c.M.style.top = "";c.M.style.left = "";c.M.setAttribute("data-vivliostyle-page-side",c.l);var e=b.sb[d];c.H = !b.item.T && !d;b.sb[d] = c;e?(b.Xa.viewport.f.replaceChild(c.M,e.M),Ua(e,{type:"replaced",target:null,currentTarget:null,Pf:c})):b.Xa.viewport.f.appendChild(c.M);a.A({width:b.Xa.ja,height:b.Xa.ia},b.Xa.Ja,b.item.T,b.Xa.Z + d);}function au(a,b,c){var d=J("renderSinglePage"),e=bu(a,b,c);ht(b.Xa,e,c).then(function(f){var g=(c = f)?c.page - 1:b.Ya.length - 1;$t(a,b,e,g);Hp(a.f,e.T,g);f = null;if(c){var h=b.Ya[c.page];b.Ya[c.page] = c;h && b.sb[c.page] && (Wk(c,h) || (f = au(a,b,c)));}f || (f = L(!0));f.then(function(){var f=Ip(a.f,e),h=0;re(function(b){h++;if(h > f.length)P(b);else {var c=f[h - 1];c.Kd = c.Kd.filter(function(a){return !a.fd;});c.Kd.length?cu(a,c.T).then(function(d){d?(Gp(a.f,c.xe),Jp(a.f,c.Kd),au(a,d,d.Ya[c.aa]).then(function(c){var d=a.f;d.b = d.G.pop();d = a.f;d.g = d.I.pop();d = c.Jd.position;d.T === e.T && d.aa === g && (e = c.Jd.page);O(b);})):O(b);}):O(b);}}).then(function(){e.C = !c && b.item.T === a.b.b.length - 1;e.C && Lp(a.f,a.viewport);M(d,{Jd:Xt(e,g),Qf:c});});});});return d.result();}function du(a,b){var c=a.aa,d=-1;0 > c && (d = a.Ha,c = Ma(b.Ya.length,function(a){return Ws(b.Xa,b.Ya[a],!0) > d;}),c = c === b.Ya.length?b.complete?b.Ya.length - 1:Number.POSITIVE_INFINITY:c - 1);return {T:a.T,aa:c,Ha:d};}function eu(a,b,c){var d=J("findPage");cu(a,b.T).then(function(e){if(e){var f=null,g;re(function(d){var h=du(b,e);g = h.aa;(f = e.sb[g])?P(d):e.complete?(g = e.Ya.length - 1,f = e.sb[g],P(d)):c?fu(a,h).then(function(a){a && (f = a.page);P(d);}):pe(100).then(function(){O(d);});}).then(function(){M(d,Xt(f,g));});}else M(d,null);});return d.result();}function fu(a,b){var c=J("renderPage");cu(a,b.T).then(function(d){if(d){var e=du(b,d),f=e.aa,g=e.Ha,h=d.sb[f];h?M(c,Xt(h,f)):re(function(b){if(f < d.Ya.length)P(b);else if(d.complete)f = d.Ya.length - 1,P(b);else {var c=d.Ya[d.Ya.length - 1];au(a,d,c).then(function(a){var e=a.Jd.page;(c = a.Qf)?0 <= g && Ws(d.Xa,c) > g?(h = e,f = d.Ya.length - 2,P(b)):O(b):(h = e,f = a.Jd.position.aa,d.complete = !0,P(b));});}}).then(function(){h = h || d.sb[f];var b=d.Ya[f];h?M(c,Xt(h,f)):au(a,d,b).then(function(a){a.Qf || (d.complete = !0);M(c,a.Jd);});});}else M(c,null);});return c.result();}n.Ce = function(){return gu(this,{T:this.b.b.length - 1,aa:Number.POSITIVE_INFINITY,Ha:-1});};function gu(a,b){var c=J("renderAllPages");b || (b = {T:0,aa:0,Ha:0});var d=b.T,e=b.aa,f=0,g;re(function(c){fu(a,{T:f,aa:f === d?e:Number.POSITIVE_INFINITY,Ha:f === d?b.Ha:-1}).then(function(a){g = a;++f > d?P(c):O(c);});}).then(function(){M(c,g);});return c.result();}n.hg = function(){return eu(this,{T:0,aa:0,Ha:-1});};n.kg = function(){return eu(this,{T:this.b.b.length - 1,aa:Number.POSITIVE_INFINITY,Ha:-1});};n.nextPage = function(a,b){var c=this,d=a.T,e=a.aa,f=J("nextPage");cu(c,d).then(function(a){if(a){if(a.complete && e == a.Ya.length - 1){if(d >= c.b.b.length - 1){M(f,null);return;}d++;e = 0;}else e++;eu(c,{T:d,aa:e,Ha:-1},b).Ea(f);}else M(f,null);});return f.result();};n.Ae = function(a){var b=a.T;if(a = a.aa)a--;else {if(!b)return L(null);b--;a = Number.POSITIVE_INFINITY;}return eu(this,{T:b,aa:a,Ha:-1});};function hu(a,b,c){b = "left" === b.l;a = "ltr" === a.Sb(c);return !b && a || b && !a;}function iu(a,b,c){var d=J("getCurrentSpread"),e=Zt(a,b);if(!e)return L({left:null,right:null});var f="left" === e.l;(hu(a,e,b)?a.Ae(b):a.nextPage(b,c)).then(function(a){a = a && a.page;f?M(d,{left:e,right:a}):M(d,{left:a,right:e});});return d.result();}n.qg = function(a,b){var c=Zt(this,a);if(!c)return L(null);var c=hu(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.fa(function(a){return a?e.nextPage(a.position,!!b):L(null);});};n.tg = function(a){var b=Zt(this,a);if(!b)return L(null);b = hu(this,b,a);a = this.Ae(a);if(b){var c=this;return a.fa(function(a){return a?c.Ae(a.position):L(null);});}return a;};function ju(a,b){var c=J("navigateToEPage");Vt(a.b,b).then(function(b){b?eu(a,b).Ea(c):M(c,null);});return c.result();}function ku(a,b){var c=J("navigateToCFI");Ut(a.b,b).then(function(b){b?eu(a,b).Ea(c):M(c,null);});return c.result();}function lu(a,b,c){v.debug("Navigate to",b);var d=Qt(a.b,ma(b));if(!d){if(a.b.g && b.match(/^#epubcfi\(/))d = Qt(a.b,a.b.g.url);else if("#" === b.charAt(0)){var e=a.b.A.wg(b);a.b.g?d = Qt(a.b,e[0]):d = e[0];b = d + (e[1]?"#" + e[1]:"");}if(null == d)return L(null);}var f=a.b.l[d];if(!f)return a.b.g && d == Qt(a.b,a.b.g.url) && (d = b.indexOf("#"),0 <= d)?ku(a,b.substr(d + 1)):L(null);var g=J("navigateTo");cu(a,f.T).then(function(d){var e=Rj(d.ba,b);e?eu(a,{T:f.T,aa:-1,Ha:Mj(d.ba,e)}).Ea(g):c.T !== f.T?eu(a,{T:f.T,aa:0,Ha:-1}).Ea(g):M(g,null);});return g.result();}function bu(a,b,c){var d=b.Xa.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position = "absolute";e.style.top = "0";e.style.left = "0";Fj || (e.style.visibility = "hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new kk(e,f);g.T = b.item.T;g.position = c;g.offset = Ws(b.Xa,c);g.offset || (b = a.b.A.Ee("",b.item.src),f.setAttribute("id",b),nk(g,f,b));d !== a.viewport && (a = Xf(null,new cf(pb(a.viewport.width,a.viewport.height,d.width,d.height),null)),g.A.push(new hk(e,"transform",a)));return g;}function mu(a,b){var c=Nt();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d = d.importNode(a,!0);e.appendChild(d);d = c.queue;d.Push(["Typeset",c,e]);var c=J("makeMathJaxView"),f=je(c);d.Push(function(){f.hb(e);});return c.result();}return L(null);}n.se = function(a){var b=this;return function(c,d){var e;if("object" == c.localName && "http://www.w3.org/1999/xhtml" == c.namespaceURI){var f=c.getAttribute("data");e = null;if(f){var f=pa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=Qt(b.b,f);h && (h = b.b.l[h]) && (g = h.f);}if(g && (h = b.b.R[g])){e = b.viewport.b.createElement("iframe");e.style.border = "none";var f=Ia(f),l=Ia(g),g=new Ea();g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h = c.firstChild;h;h = h.nextSibling) 1 == h.nodeType && (l = h,"param" == l.localName && "http://www.w3.org/1999/xhtml" == l.namespaceURI && (f = l.getAttribute("name"),l = l.getAttribute("value"),f && l && (g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g = c.getAttribute("width")) && e.setAttribute("width",g);(g = c.getAttribute("height")) && e.setAttribute("height",g);}}e || (e = b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e = L(e);}else if("http://www.w3.org/1998/Math/MathML" == c.namespaceURI)e = mu(c,d);else if("http://example.com/sse" == c.namespaceURI){e = d?d.ownerDocument:b.viewport.b;g = c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g = "span";break;case "ruby":case "rp":case "rt":break;default:g = "div";}e = e.createElement(g);e.setAttribute("data-adapt-process-children","true");e = L(e);}else e = c.dataset && "true" == c.dataset.mathTypeset?mu(c,d):L(null);return e;};};function cu(a,b){if(b >= a.b.b.length)return L(null);var c=a.tc[b];if(c)return L(c);var d=J("getPageViewItem"),e=a.l[b];if(e){var f=je(d);e.push(f);return d.result();}var e=a.l[b] = [],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b || 1 != a.b.b.length || (g.b = Math.ceil(Oj(f) / 2700),a.b.G = g.b);var k=h.f[f.url],l=a.se(f),p=a.viewport,q=Ss(k,p.width,p.height,p.fontSize);if(q.width != p.width || q.height != p.height || q.fontSize != p.fontSize)p = new Cr(p.window,q.fontSize,p.root,q.width,q.height);q = a.tc[b - 1];null !== g.kb?q = g.kb - 1:(q = q?q.Xa.Z + q.sb.length:0,null !== g.sc && (q += g.sc));Ep(a.f,q);var r=new Ts(k,f,a.b.lang,p,a.h,a.j,l,a.b.H,q,a.b.A,a.f);r.Y = a.Y;Us(r).then(function(){c = {item:g,ba:f,Xa:r,Ya:[null],sb:[],complete:!1};a.tc[b] = c;M(d,c);e.forEach(function(a){a.hb(c);});});});return d.result();}function nu(a){return a.tc.some(function(a){return a && 0 < a.sb.length;});}n.Md = function(){var a=this.b,b=a.O || a.Z;if(!b)return L(null);var c=J("showTOC");this.g || (this.g = new vt(a.h,b.src,a.lang,this.h,this.j,this.Y,this,a.H,a.A,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67 * a.width) - 16),d=a.height - 6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position = "absolute";e.style.visibility = "hidden";e.style.left = "3px";e.style.top = "3px";e.style.width = b + 10 + "px";e.style.maxHeight = d + "px";e.style.overflow = "scroll";e.style.overflowX = "hidden";e.style.background = "#EEE";e.style.border = "1px outset #999";e.style.borderRadius = "2px";e.style.boxShadow = " 5px 5px rgba(128,128,128,0.3)";this.g.Md(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility = "visible";M(c,a);});return c.result();};n.Fd = function(){this.g && this.g.Fd();};n.We = function(){return this.g && this.g.We();};var ou={Qg:"singlePage",Rg:"spread",Gg:"autoSpread"};function pu(a,b,c,d){var e=this;this.window = a;this.Vd = b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);Fj && b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Ka = c;this.Ja = d;a = a.document;this.sa = new bm(a.head,b);this.C = "loading";this.O = [];this.h = null;this.Ub = this.Sa = !1;this.f = this.j = this.g = this.D = null;this.fontSize = 16;this.zoom = 1;this.G = !1;this.X = "singlePage";this.ja = !1;this.Ce = !0;this.Y = kb();this.ia = [];this.J = function(){};this.A = function(){};this.Z = function(){e.Sa = !0;e.J();};this.ye = this.ye.bind(this);this.H = function(){};this.I = a.getElementById("vivliostyle-page-rules");this.R = !1;this.l = null;this.oa = {loadEPUB:this.bg,loadXML:this.cg,configure:this.Ne,moveTo:this.Fa,toc:this.Md};qu(this);}function qu(a){la(1,(function(a){ru(this,{t:"debug",content:a});}).bind(a));la(2,(function(a){ru(this,{t:"info",content:a});}).bind(a));la(3,(function(a){ru(this,{t:"warn",content:a});}).bind(a));la(4,(function(a){ru(this,{t:"error",content:a});}).bind(a));}function ru(a,b){b.i = a.Ka;a.Ja(b);}function su(a,b){a.C !== b && (a.C = b,a.Vd.setAttribute("data-vivliostyle-viewer-status",b),ru(a,{t:"readystatechange"}));}n = pu.prototype;n.bg = function(a){tu.f("beforeRender");su(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport = null;var g=J("loadEPUB"),h=this;h.Ne(a).then(function(){var a=new yt();pt(a,e,f).then(function(){var e=pa(b,h.window.location.href);h.O = [e];At(a,e,d).then(function(a){h.h = a;uu(h,c).then(function(){M(g,!0);});});});});return g.result();};n.cg = function(a){tu.f("beforeRender");su(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport = null;var g=J("loadXML"),h=this;h.Ne(a).then(function(){var a=new yt();pt(a,e,f).then(function(){var e=b.map(function(a,b){return {url:pa(a.url,h.window.location.href),index:b,kb:a.kb,sc:a.sc};});h.O = e.map(function(a){return a.url;});h.h = new Ct(a,"");St(h.h,e,c).then(function(){uu(h,d).then(function(){M(g,!0);});});});});return g.result();};function uu(a,b){vu(a);var c;b?c = Ut(a.h,b).fa(function(b){a.f = b;return L(!0);}):c = L(!0);return c.fa(function(){tu.b("beforeRender");return wu(a);});}function xu(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string" === typeof b && (e = b.match(d))){d = e[0];if("em" === d || "rem" === d)return c * a.fontSize;if("ex" === d)return c * Ab.ex * a.fontSize / Ab.em;if(d = Ab[d])return c * d;}return c;}n.Ne = function(a){"boolean" == typeof a.autoresize && (a.autoresize?(this.D = null,this.window.addEventListener("resize",this.Z,!1),this.Sa = !0):this.window.removeEventListener("resize",this.Z,!1));if("number" == typeof a.fontSize){var b=a.fontSize;5 <= b && 72 >= b && this.fontSize != b && (this.fontSize = b,this.Sa = !0);}"object" == typeof a.viewport && a.viewport && (b = a.viewport,b = {marginLeft:xu(this,b["margin-left"]) || 0,marginRight:xu(this,b["margin-right"]) || 0,marginTop:xu(this,b["margin-top"]) || 0,marginBottom:xu(this,b["margin-bottom"]) || 0,width:xu(this,b.width) || 0,height:xu(this,b.height) || 0},200 <= b.width || 200 <= b.height) && (this.window.removeEventListener("resize",this.Z,!1),this.D = b,this.Sa = !0);"boolean" == typeof a.hyphenate && (this.Y.me = a.hyphenate,this.Sa = !0);"boolean" == typeof a.horizontal && (this.Y.le = a.horizontal,this.Sa = !0);"boolean" == typeof a.nightMode && (this.Y.ue = a.nightMode,this.Sa = !0);"number" == typeof a.lineHeight && (this.Y.lineHeight = a.lineHeight,this.Sa = !0);"number" == typeof a.columnWidth && (this.Y.ce = a.columnWidth,this.Sa = !0);"string" == typeof a.fontFamily && (this.Y.fontFamily = a.fontFamily,this.Sa = !0);"boolean" == typeof a.load && (this.ja = a.load);"boolean" == typeof a.renderAllPages && (this.Ce = a.renderAllPages);"string" == typeof a.userAgentRootURL && (na = a.userAgentRootURL.replace(/resources\/?$/,""),oa = a.userAgentRootURL);"string" == typeof a.rootURL && (na = a.rootURL,oa = na + "resources/");"string" == typeof a.pageViewMode && a.pageViewMode !== this.X && (this.X = a.pageViewMode,this.Sa = !0);"number" == typeof a.pageBorder && a.pageBorder !== this.Y.Jc && (this.viewport = null,this.Y.Jc = a.pageBorder,this.Sa = !0);"number" == typeof a.zoom && a.zoom !== this.zoom && (this.zoom = a.zoom,this.Ub = !0);"boolean" == typeof a.fitToScreen && a.fitToScreen !== this.G && (this.G = a.fitToScreen,this.Ub = !0);"object" == typeof a.defaultPaperSize && "number" == typeof a.defaultPaperSize.width && "number" == typeof a.defaultPaperSize.height && (this.viewport = null,this.Y.hc = a.defaultPaperSize,this.Sa = !0);yu(this,a);return L(!0);};function yu(a,b){Ud("CONFIGURATION").forEach((function(a){a = a(b);this.Sa = a.Sa || this.Sa;this.Ub = a.Ub || this.Ub;}).bind(a));}n.ye = function(a){var b=this.g,c=this.j,d=a.target;c?c.left !== d && c.right !== d || zu(this,a.Pf):b === a.target && zu(this,a.Pf);};function Au(a,b){var c=[];a.g && c.push(a.g);a.j && (c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a && b(a);});}function Bu(a){Au(a,(function(a){a.removeEventListener("hyperlink",this.H,!1);a.removeEventListener("replaced",this.ye,!1);}).bind(a));}function Cu(a){Bu(a);Au(a,function(a){w(a.M,"display","none");});a.g = null;a.j = null;}function Du(a,b){b.addEventListener("hyperlink",a.H,!1);b.addEventListener("replaced",a.ye,!1);w(b.M,"visibility","visible");w(b.M,"display","block");}function Eu(a,b){Cu(a);a.g = b;Du(a,b);}function Fu(a){var b=J("reportPosition");Tt(a.h,a.f.T,a.f.Ha).then(function(c){var d=a.g;(a.ja && 0 < d.j.length?ve(d.j):L(!0)).then(function(){Gu(a,d,c).Ea(b);});});return b.result();}function Hu(a){var b=a.Vd;if(a.D){var c=a.D;b.style.marginLeft = c.marginLeft + "px";b.style.marginRight = c.marginRight + "px";b.style.marginTop = c.marginTop + "px";b.style.marginBottom = c.marginBottom + "px";return new Cr(a.window,a.fontSize,b,c.width,c.height);}return new Cr(a.window,a.fontSize,b);}function Iu(a){var b=Hu(a),c;a: switch(a.X){case "singlePage":c = !1;break a;case "spread":c = !0;break a;default:c = 1.45 <= b.width / b.height && 800 < b.width;}var d=a.Y.ub !== c;a.Y.ub = c;a.Vd.setAttribute("data-vivliostyle-spread-view",c);if(a.D || !a.viewport || a.viewport.fontSize != a.fontSize)return !1;if(!d && b.width == a.viewport.width && b.height == a.viewport.height)return !0;if(d = a.b && nu(a.b)){a: {d = a.b.tc;for(c = 0;c < d.length;c++) {var e=d[c];if(e)for(var e=e.sb,f=0;f < e.length;f++) {var g=e[f];if(g.G && g.D){d = !0;break a;}}}d = !1;}d = !d;}return d?(a.viewport.width = b.width,a.viewport.height = b.height,a.Ub = !0):!1;}n.xg = function(a,b,c,d){this.ia[d] = a;Ju(this,b);};function Ju(a,b){if(!a.R && a.I){var c="";Object.keys(b).forEach(function(a){c += "@page " + a + "{size:";a = b[a];c += a.width + "px " + a.height + "px;}";});a.I.textContent = c;a.R = !0;}}function Ku(a){if(a.b){a.b.Fd();for(var b=a.b,c=b.tc,d=0;d < c.length;d++) {var e=c[d];e && e.sb.splice(0);}for(b = b.viewport.root;b.lastChild;) b.removeChild(b.lastChild);}a.I && (a.I.textContent = "",a.R = !1);a.viewport = Hu(a);b = a.viewport;w(b.g,"width","");w(b.g,"height","");w(b.f,"width","");w(b.f,"height","");w(b.f,"transform","");a.b = new Yt(a.h,a.viewport,a.sa,a.Y,a.xg.bind(a));}function zu(a,b,c){a.Ub = !1;Bu(a);if(a.Y.ub)return iu(a.b,a.f,c).fa(function(c){Cu(a);a.j = c;c.left && (Du(a,c.left),c.right || c.left.M.setAttribute("data-vivliostyle-unpaired-page",!0));c.right && (Du(a,c.right),c.left || c.right.M.setAttribute("data-vivliostyle-unpaired-page",!0));c = Lu(a,c);a.viewport.zoom(c.width,c.height,a.G?Mu(a,c):a.zoom);a.g = b;return L(null);});Eu(a,b);a.viewport.zoom(b.f.width,b.f.height,a.G?Mu(a,b.f):a.zoom);a.g = b;return L(null);}function Lu(a,b){var c=0,d=0;b.left && (c += b.left.f.width,d = b.left.f.height);b.right && (c += b.right.f.width,d = Math.max(d,b.right.f.height));b.left && b.right && (c += 2 * a.Y.Jc);return {width:c,height:d};}var Nu={Lg:"fit inside viewport"};function Mu(a,b){return Math.min(a.viewport.width / b.width,a.viewport.height / b.height);}function Ou(){this.name = "RenderingCanceledError";this.message = "Page rendering has been canceled";this.stack = Error().stack;}t(Ou,Error);function vu(a){if(a.l){var b=a.l;ae(b,new Ou());if(b !== Vd && b.b){b.b.g = !0;var c=new ke(b);b.l = "interrupt";b.b = c;b.f.hb(c);}}a.l = null;}function wu(a){a.Sa = !1;a.Ub = !1;if(Iu(a))return L(!0);su(a,"loading");vu(a);var b=ce(Vd.f,function(){return $d("resize",function(c){a.l = b;tu.f("render (resize)");Ku(a);a.f && (a.f.aa = -1);gu(a.b,a.f).then(function(d){a.f = d.position;zu(a,d.page,!0).then(function(){Fu(a).then(function(d){su(a,"interactive");(a.Ce?a.b.Ce():L(null)).then(function(){a.l === b && (a.l = null);tu.b("render (resize)");su(a,"complete");ru(a,{t:"loaded"});M(c,d);});});});});},function(a,b){if(b instanceof Ou)tu.b("render (resize)"),v.debug(b.message);else throw b;});});return L(!0);}function Gu(a,b,c){var d=J("sendLocationNotification"),e={t:"nav",first:b.H,last:b.C};Wt(a.h,a.f).then(function(b){e.epage = b;e.epageCount = a.h.G;c && (e.cfi = c);ru(a,e);M(d,!0);});return d.result();}pu.prototype.Sb = function(){return this.b?this.b.Sb(this.f):null;};pu.prototype.Fa = function(a){var b=this;"complete" !== this.C && su(this,"loading");if("string" == typeof a.where){switch(a.where){case "next":a = this.Y.ub?this.b.qg:this.b.nextPage;break;case "previous":a = this.Y.ub?this.b.tg:this.b.Ae;break;case "last":a = this.b.kg;break;case "first":a = this.b.hg;break;default:return L(!0);}if(a){var c=a;a = function(){return c.call(b.b,b.f);};}}else if("number" == typeof a.epage){var d=a.epage;a = function(){return ju(b.b,d);};}else if("string" == typeof a.url){var e=a.url;a = function(){return lu(b.b,e,b.f);};}else return L(!0);var f=J("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f = a.position;var d=J("moveTo.showCurrent");c = d.result();zu(b,a.page).then(function(){Fu(b).Ea(d);});}else c = L(!0);c.then(function(a){"loading" === b.C && su(b,"interactive");M(f,a);});});return f.result();};pu.prototype.Md = function(a){var b=!!a.autohide;a = a.v;var c=this.b.We();if(c){if("show" == a)return L(!0);}else if("hide" == a)return L(!0);if(c)return this.b.Fd(),L(!0);var d=this,e=J("showTOC");this.b.Md(b).then(function(a){if(a){if(b){var c=function c(){d.b.Fd();};a.addEventListener("hyperlink",c,!1);a.M.addEventListener("click",c,!1);}a.addEventListener("hyperlink",d.H,!1);}M(e,!0);});return e.result();};function Pu(a,b){var c=b.a || "";return $d("runCommand",function(d){var e=a.oa[c];e?e.call(a,b).then(function(){ru(a,{t:"done",a:c});M(d,!0);}):(v.error("No such action:",c),M(d,!0));},function(a,b){v.error(b,"Error during action:",c);M(a,!0);});}function Qu(a){return "string" == typeof a?JSON.parse(a):a;}function Ru(a,b){var c=Qu(b),d=null;be(function(){var b=J("commandLoop"),f=Vd.f;a.H = function(b){var c="#" === b.href.charAt(0) || a.O.some(function(a){return b.href.substr(0,a.length) == a;});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};ce(f,function(){ru(a,d);return L(!0);});}};re(function(b){if(a.Sa)wu(a).then(function(){O(b);});else if(a.Ub)a.g && zu(a,a.g).then(function(){O(b);});else if(c){var e=c;c = null;Pu(a,e).then(function(){O(b);});}else e = J("waitForCommand"),d = je(e,self),e.result().then(function(){O(b);});}).Ea(b);return b.result();});a.J = function(){var a=d;a && (d = null,a.hb());};a.A = function(b){if(c)return !1;c = Qu(b);a.J();return !0;};a.window.adapt_command = a.A;};function ur(a,b,c){if(a == b)return a?[[0,a]]:[];if(0 > c || a.length < c)c = null;var d=Su(a,b),e=a.substring(0,d);a = a.substring(d);b = b.substring(d);var d=Tu(a,b),f=a.substring(a.length - d);a = a.substring(0,a.length - d);b = b.substring(0,b.length - d);a = Uu(a,b);e && a.unshift([0,e]);f && a.push([0,f]);Vu(a);null != c && (a = Wu(a,c));return a;}function Uu(a,b){var c;if(!a)return [[1,b]];if(!b)return [[-1,a]];c = a.length > b.length?a:b;var d=a.length > b.length?b:a,e=c.indexOf(d);if(-1 != e)return c = [[1,c.substring(0,e)],[0,d],[1,c.substring(e + d.length)]],a.length > b.length && (c[0][0] = c[2][0] = -1),c;if(1 == d.length)return [[-1,a],[1,b]];var f=Xu(a,b);if(f)return d = f[1],e = f[3],c = f[4],f = ur(f[0],f[2]),d = ur(d,e),f.concat([[0,c]],d);a: {c = a.length;for(var d=b.length,e=Math.ceil((c + d) / 2),f=2 * e,g=Array(f),h=Array(f),l=0;l < f;l++) g[l] = -1,h[l] = -1;g[e + 1] = 0;h[e + 1] = 0;for(var l=c - d,k=!!(l % 2),m=0,p=0,q=0,r=0,z=0;z < e;z++) {for(var u=-z + m;u <= z - p;u += 2) {var A=e + u,H;H = u == -z || u != z && g[A - 1] < g[A + 1]?g[A + 1]:g[A - 1] + 1;for(var G=H - u;H < c && G < d && a.charAt(H) == b.charAt(G);) H++,G++;g[A] = H;if(H > c)p += 2;else if(G > d)m += 2;else if(k && (A = e + l - u,0 <= A && A < f && -1 != h[A])){var K=c - h[A];if(H >= K){c = Yu(a,b,H,G);break a;}}}for(u = -z + q;u <= z - r;u += 2) {A = e + u;K = u == -z || u != z && h[A - 1] < h[A + 1]?h[A + 1]:h[A - 1] + 1;for(H = K - u;K < c && H < d && a.charAt(c - K - 1) == b.charAt(d - H - 1);) K++,H++;h[A] = K;if(K > c)r += 2;else if(H > d)q += 2;else if(!k && (A = e + l - u,0 <= A && A < f && -1 != g[A] && (H = g[A],G = e + H - A,K = c - K,H >= K))){c = Yu(a,b,H,G);break a;}}}c = [[-1,a],[1,b]];}return c;}function Yu(a,b,c,d){var e=a.substring(c),f=b.substring(d);a = ur(a.substring(0,c),b.substring(0,d));e = ur(e,f);return a.concat(e);}function Su(a,b){if(!a || !b || a.charAt(0) != b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c < e;) a.substring(f,e) == b.substring(f,e)?f = c = e:d = e,e = Math.floor((d - c) / 2 + c);return e;}function Tu(a,b){if(!a || !b || a.charAt(a.length - 1) != b.charAt(b.length - 1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c < e;) a.substring(a.length - e,a.length - f) == b.substring(b.length - e,b.length - f)?f = c = e:d = e,e = Math.floor((d - c) / 2 + c);return e;}function Xu(a,b){function c(a,b,c){for(var d=a.substring(c,c + Math.floor(a.length / 4)),e=-1,f="",g,h,k,l;-1 != (e = b.indexOf(d,e + 1));) {var m=Su(a.substring(c),b.substring(e)),K=Tu(a.substring(0,c),b.substring(0,e));f.length < K + m && (f = b.substring(e - K,e) + b.substring(e,e + m),g = a.substring(0,c - K),h = a.substring(c + m),k = b.substring(0,e - K),l = b.substring(e + m));}return 2 * f.length >= a.length?[g,h,k,l,f]:null;}var d=a.length > b.length?a:b,e=a.length > b.length?b:a;if(4 > d.length || 2 * e.length < d.length)return null;var f=c(d,e,Math.ceil(d.length / 4)),d=c(d,e,Math.ceil(d.length / 2)),g;if(f || d)d?g = f?f[4].length > d[4].length?f:d:d:g = f;else return null;var h;a.length > b.length?(f = g[0],d = g[1],e = g[2],h = g[3]):(e = g[0],h = g[1],f = g[2],d = g[3]);return [f,d,e,h,g[4]];}function Vu(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b < a.length;) switch(a[b][0]){case 1:d++;f += a[b][1];b++;break;case -1:c++;e += a[b][1];b++;break;case 0:if(1 < c + d){if(c && d){if(g = Su(f,e))0 < b - c - d && 0 == a[b - c - d - 1][0]?a[b - c - d - 1][1] += f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f = f.substring(g),e = e.substring(g);if(g = Tu(f,e))a[b][1] = f.substring(f.length - g) + a[b][1],f = f.substring(0,f.length - g),e = e.substring(0,e.length - g);}c?d?a.splice(b - c - d,c + d,[-1,e],[1,f]):a.splice(b - c,c + d,[-1,e]):a.splice(b - d,c + d,[1,f]);b = b - c - d + (c?1:0) + (d?1:0) + 1;}else b && 0 == a[b - 1][0]?(a[b - 1][1] += a[b][1],a.splice(b,1)):b++;c = d = 0;f = e = "";}"" === a[a.length - 1][1] && a.pop();c = !1;for(b = 1;b < a.length - 1;) 0 == a[b - 1][0] && 0 == a[b + 1][0] && (a[b][1].substring(a[b][1].length - a[b - 1][1].length) == a[b - 1][1]?(a[b][1] = a[b - 1][1] + a[b][1].substring(0,a[b][1].length - a[b - 1][1].length),a[b + 1][1] = a[b - 1][1] + a[b + 1][1],a.splice(b - 1,1),c = !0):a[b][1].substring(0,a[b + 1][1].length) == a[b + 1][1] && (a[b - 1][1] += a[b + 1][1],a[b][1] = a[b][1].substring(a[b + 1][1].length) + a[b + 1][1],a.splice(b + 1,1),c = !0)),b++;c && Vu(a);}ur.f = 1;ur.b = -1;ur.g = 0;function Wu(a,b){var c;a: {var d=a;if(0 === b)c = [0,d];else {var e=0;for(c = 0;c < d.length;c++) {var f=d[c];if(-1 === f[0] || 0 === f[0]){var g=e + f[1].length;if(b === g){c = [c + 1,d];break a;}if(b < g){d = d.slice();g = b - e;e = [f[0],f[1].slice(0,g)];f = [f[0],f[1].slice(g)];d.splice(c,1,e,f);c = [c + 1,d];break a;}e = g;}}throw Error("cursor_pos is out of bounds!");}}d = c[1];c = c[0];e = d[c];f = d[c + 1];return null == e || 0 !== e[0]?a:null != f && e[1] + f[1] === f[1] + e[1]?(d.splice(c,2,f,e),Zu(d,c,2)):null != f && 0 === f[1].indexOf(e[1])?(d.splice(c,2,[f[0],e[1]],[0,e[1]]),e = f[1].slice(e[1].length),0 < e.length && d.splice(c + 2,0,[f[0],e]),Zu(d,c,3)):a;}function Zu(a,b,c){for(c = b + c - 1;0 <= c && c >= b - 1;c--) if(c + 1 < a.length){var d=a[c],e=a[c + 1];d[0] === e[1] && a.splice(c,2,[d[0],d[1] + e[1]]);}return a;};function tr(a){return a.reduce(function(a,c){return c[0] === ur.b?a:a + c[1];},"");}function Mk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f < a[1].length;f++) {switch(a[0] * c){case ur.f:d++;break;case ur.b:d--;e++;break;case ur.g:e++;}if(e > b)return !0;}return !1;});return Math.max(Math.min(b,e - 1) + d,0);};function $u(a,b,c,d,e){Dm.call(this,a,b,"block-end",null,c,e);this.g = d;}t($u,Dm);$u.prototype.Re = function(a){return !(a instanceof $u);};function av(a,b,c,d){Gm.call(this,a,"block-end",b,c,d);}t(av,Gm);av.prototype.za = function(){return Infinity;};av.prototype.b = function(a){return a instanceof $u?!0:this.za() < a.za();};function bv(a){this.b = a;}bv.prototype.ob = function(a){a = Lk(a);return !zk(a,this.b.b);};function cv(){}n = cv.prototype;n.rf = function(a){return "footnote" === a.va;};n.qf = function(a){return a instanceof $u;};n.xf = function(a,b){var c="region",d=Pm(b,c);ln(Pm(b,"page"),d) && (c = "page");d = Lk(a);c = new $u(d,c,b.j,a.O,a.kc);b.Yd(c);return L(c);};n.yf = function(a,b,c,d){return new av(a[0].qa.W,a,c,d);};n.jf = function(a,b){return Pm(b,a.W).b.filter(function(a){return a instanceof av;})[0] || null;};n.mf = function(a,b,c){a.If = !0;a.ge = !1;var d=a.element,e=c.j;b = b.u;var f={},g;g = e.D._pseudos;b = Zq(e,b,e.D,f);if(g && g.before){var h={},l=kr(e,"http://www.w3.org/1999/xhtml","span");Sq(l,"before");d.appendChild(l);Zq(e,b,g.before,h);delete h.content;nr(e,l,h);}delete f.content;nr(e,d,f);a.u = b;qp(a,d);if(e = vn(c.b,d))a.marginLeft = X(e.marginLeft),a.X = X(e.borderLeftWidth),a.H = X(e.paddingLeft),a.marginTop = X(e.marginTop),a.Z = X(e.borderTopWidth),a.I = X(e.paddingTop),a.marginRight = X(e.marginRight),a.Ja = X(e.borderRightWidth),a.R = X(e.paddingRight),a.marginBottom = X(e.marginBottom),a.Fa = X(e.borderBottomWidth),a.O = X(e.paddingBottom);if(c = vn(c.b,d))a.width = X(c.width),a.height = X(c.height);};n.Zf = function(a,b){switch(a.g){case md:Gn(b,new bv(a),a.W);}};Jn.push(new cv());function dv(a){return a.reduce(function(a,c){return a + c;},0) / a.length;}function Ms(a){var b=dv(a);return dv(a.map(function(a){a -= b;return a * a;}));};function ev(a,b){this.g(a,"end",b);}function fv(a,b){this.g(a,"start",b);}function gv(a,b,c){c || (c = this.j.now());var d=this.h[a];d || (d = this.h[a] = []);var e;for(a = d.length - 1;0 <= a && (!(e = d[a]) || e[b]);a--) e = null;e || (e = {},d.push(e));e[b] = c;}function hv(){}function iv(a){this.j = a;this.h = {};this.registerEndTiming = this.b = this.registerStartTiming = this.f = this.g = hv;}iv.prototype.l = function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f < e;f++) {var g=d[f];b += c;1 < e && (b += "(" + f + ")");b += " => start: " + g.start + ", end: " + g.end + ", duration: " + (g.end - g.start) + "\n";}});v.g(b);};iv.prototype.A = function(){this.registerEndTiming = this.b = this.registerStartTiming = this.f = this.g = hv;};iv.prototype.C = function(){this.g = gv;this.registerStartTiming = this.f = fv;this.registerEndTiming = this.b = ev;};var jv={now:Date.now},tu,kv=tu = new iv(window && window.performance || jv);gv.call(kv,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",kv);iv.prototype.printTimings = iv.prototype.l;iv.prototype.disable = iv.prototype.A;iv.prototype.enable = iv.prototype.C;function Zn(a){return (a = a.F) && a instanceof cp?a:null;}function lv(a,b,c){var d=a.b;return d && !d.oc && (a = mv(a,b),a.B)?!d.lc || d.oc?L(!0):nv(d,d.lc,a,null,c):L(!0);}function ov(a,b,c){var d=a.b;return d && (a = mv(a,b),a.B)?!d.mc || d.qc?L(!0):nv(d,d.mc,a,a.B.firstChild,c):L(!0);}function pv(a,b){a && qv(a.K?a.parent:a,function(a,d){a instanceof bp || b.A.push(new rv(d));});}function qv(a,b){for(var c=a;c;c = c.parent) {var d=c.F;d && d instanceof cp && !Pk(c,d) && b(d,c);}}function cp(a,b){this.parent = a;this.j = b;this.b = null;}cp.prototype.Je = function(){return "Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)";};cp.prototype.Te = function(a,b){return b;};function sv(a,b){var c=mv(a,b);return c?c.B:null;}function mv(a,b){do if(!Pk(b,a) && b.N === a.j)return b;while(b = b.parent);return null;}function qr(a,b){a.b || kp.some((function(a){return a.root === this.j?(this.b = a.elements,!0):!1;}).bind(a)) || (a.b = new tv(b,a.j),kp.push({root:a.j,elements:a.b}));}cp.prototype.Le = function(){};cp.prototype.Ke = function(){};var kp=[];function tv(a,b){this.u = a;this.lc = this.mc = this.A = this.D = this.l = this.C = null;this.H = this.I = 0;this.oc = this.qc = !1;this.Vc = this.ee = !0;this.j = !1;this.X = b;this.J = this.g = null;this.O = [];this.R = [];}function uv(a,b){a.mc || (a.mc = Ak(b),a.C = b.N,a.D = b.B);}function vv(a,b){a.lc || (a.lc = Ak(b),a.l = b.N,a.A = b.B);}function nv(a,b,c,d,e){var f=c.B,g=c.B.ownerDocument.createElement("div");f.appendChild(g);var h=new nm(e,g,c),l=h.b.f;h.b.f = null;a.h = !0;return qm(h,new Qk(b)).fa((function(){this.h = !1;f.removeChild(g);if(f)for(;g.firstChild;) {var a=g.firstChild;g.removeChild(a);a.setAttribute("data-adapt-spec","1");d?f.insertBefore(a,d):f.appendChild(a);}h.b.f = l;return L(!0);}).bind(a));}tv.prototype.b = function(a){var b=0;if(a && !this.f(a))return b;if(!this.oc || a && wv(this,a))b += this.H;this.qc || (b += this.I);return b;};tv.prototype.G = function(a){var b=0;if(a && !this.f(a))return b;a && wv(this,a) && (b += this.H);this.Vc || (b += this.I);return b;};function wv(a,b){return xv(b,a.R,(function(){return yv(this.J,b,!1);}).bind(a));}tv.prototype.f = function(a){return xv(a,this.O,(function(){return yv(this.X,a,!0);}).bind(this));};function xv(a,b,c){var d=b.filter(function(b){return b.w.N === a.N && b.w.K === a.K;});if(0 < d.length)return d[0].result;c = c(a);b.push({w:a,result:c});return c;}function yv(a,b,c){for(var d=[];a;a = a.parentNode) {if(b.N === a)return b.K;d.push(a);}for(a = b.N;a;a = a.parentNode) {var e=d.indexOf(a);if(0 <= e)return c?!e:!1;for(e = a;e;e = e.previousElementSibling) if(0 <= d.indexOf(e))return !0;}return b.K;}function zv(a){return !a.oc && a.ee && a.lc || !a.qc && a.Vc && a.mc?!0:!1;}function Av(a){this.F = a;}Av.prototype.b = function(){};Av.prototype.f = function(a){return !!a;};Av.prototype.g = function(a,b,c,d){(a = this.F.b) && !a.j && (a.D && (a.I = rp(a.D,c,a.u),a.D = null),a.A && (a.H = rp(a.A,c,a.u),a.A = null),a.j = !0);return d;};function Bv(a){this.F = a;}Bv.prototype.b = function(){};Bv.prototype.f = function(){return !0;};Bv.prototype.g = function(a,b,c,d){return d;};function Cv(a){this.F = a;}t(Cv,Av);Cv.prototype.b = function(a,b){Av.prototype.b.call(this,a,b);var c=J("BlockLayoutProcessor.doInitialLayout");km(new jm(new Dv(a.F),b.j),a).Ea(c);return c.result();};Cv.prototype.f = function(){return !1;};function Ev(a){this.F = a;}t(Ev,Bv);Ev.prototype.b = function(a,b){Pk(a,this.F) || a.K || b.A.unshift(new rv(a));return Fv(a,b);};function rv(a){this.w = mv(a.F,a);}n = rv.prototype;n.ob = function(a,b){var c=this.w.F.b;return c && !to(this.w.B) && zv(c)?b && !a || a && a.b?!1:!0:!0;};n.$c = function(){var a=this.w.F.b;return a && zv(a)?(!a.oc && a.ee && a.lc?a.oc = !0:!a.qc && a.Vc && a.mc && (a.qc = !0),!0):!1;};n.Tc = function(a,b,c,d){(c = this.w.F.b) && a && d.l && (!b || wv(c,b)) && (c.oc = !1,c.ee = !1);};n.Da = function(a,b){var c=this.w.F,d=this.w.F.b;if(!d)return L(!0);var e=this.w;return ov(c,e,b).fa(function(){return lv(c,e,b).fa(function(){d.qc = d.oc = !1;d.ee = !0;d.Vc = !0;return L(!0);});});};n.fe = function(a){return a instanceof rv?this.w.F === a.w.F:!1;};n.je = function(){return 10;};function Gv(a){tm.call(this);this.F = a;}t(Gv,tm);Gv.prototype.j = function(a){var b=this.F.b;return Pk(a,this.F) || b.j?(Pk(a,this.F) || a.K || !b || (b.qc = !1,b.Vc = !1),new Ev(this.F)):new Cv(this.F);};function Dv(a){this.F = a;}t(Dv,mm);Dv.prototype.pd = function(a){var b=this.F,c=a.w,d=b.b;if(c.parent && b.j === c.parent.N){switch(c.l){case "header":if(d.mc)c.l = "none";else return uv(d,c),L(!0);break;case "footer":if(d.lc)c.l = "none";else return vv(d,c),L(!0);}d.g || (d.g = c.N);}return mm.prototype.pd.call(this,a);};Dv.prototype.cc = function(a){var b=this.F,c=a.w;c.N === b.j && (b.b.J = a.Hc && a.Hc.N,a.Hb = !0);return "header" === c.l || "footer" === c.l?L(!0):mm.prototype.cc.call(this,a);};function Hv(){}t(Hv,mp);Hv.prototype.Xd = function(a,b,c){if(bo(b,a))return lo(b,a);var d=a.F;return sv(d,a)?(c && pv(a.parent,b),Pk(a,d)?mp.prototype.Xd.call(this,a,b,c):um(new Gv(d),a,b)):no(b,a);};Hv.prototype.Me = function(a){var b=Zn(a).b;if(!b)return !1;b.h || b.C !== a.N && b.l !== a.N || a.B.parentNode.removeChild(a.B);return !1;};function Fv(a,b){var c=a.F,d=J("doLayout"),e=lm(b.j,a,!1);mo(e,b).then(function(a){var e=a;re(function(a){for(;e;) {var d=!0;ep(b,e,!1).then(function(f){e = f;on(b.h)?P(a):b.f?P(a):e && b.l && e && e.b?P(a):e && e.K && e.N == c.j?P(a):d?d = !1:O(a);});if(d){d = !1;return;}}P(a);}).then(function(){M(d,e);});});return d.result();}Hv.prototype.Da = function(a,b,c,d){return mp.prototype.Da.call(this,a,b,c,d);};Hv.prototype.sd = function(a,b,c,d){mp.prototype.sd(a,b,c,d);};function Wn(a){for(var b=[],c=a;c;c = c.wd) c.A.forEach(function(c){if(c instanceof rv){var d=c.w.F.b;b.push(d);}c instanceof Iv && (d = new Jv(c.w,c.f),b.push(d));c instanceof Kv && Lv(c,a).forEach(function(a){b.push(a);});});return b;}var Mv=new Hv();Td("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof cp && !(a instanceof bp)?Mv:null;});function Nv(a,b){if(!a || !a.I || a.K)return L(a);var c=a.I;return Ov(c,b,a).fa(function(d){var e=a.B;e.appendChild(d);var f=rp(d,b,a.u);e.removeChild(d);b.A.push(new Iv(a,c,f));return L(a);});}function Pv(a,b,c){this.b = a;this.f = b;this.Ab = c;}Pv.prototype.matches = function(){var a=Qv[this.b];return !!a && null != a.Ma && ji(a.Ma,this.f,this.Ab);};function bj(a){this.b = a;}bj.prototype.matches = function(){return this.b.some(function(a){return a.matches();});};function cj(a){this.b = a;}cj.prototype.matches = function(){return this.b.every(function(a){return a.matches();});};function aj(a,b){var c=b.split("_");if("NFS" == c[0])return new Pv(a,parseInt(c[1],10),parseInt(c[2],10));fa("unknown view condition. condition=" + b);return null;}function Bj(a,b,c){Wq(c,function(c){Dj(a,c,b);});}function Wq(a,b){var c=a._viewConditionalStyles;c && c.forEach(function(a){a.mg.matches() && b(a.yg);});}function gr(a,b,c){var d=Qv;if(!d[a] || d[a].Ua <= c)d[a] = {Ma:b,Ua:c};}var Qv={};function pr(a,b){this.b = b;this.N = a;}function Ov(a,b,c){var d=c.B.ownerDocument.createElement("div"),e=new nm(b,d,c),f=e.b.f;e.b.f = null;return qm(e,Rv(a)).fa((function(){this.b.f["after-if-continues"] = !1;e.b.f = f;var a=d.firstChild;w(a,"display","block");return L(a);}).bind(a));}function Rv(a){var b=Qq.createElementNS("http://www.w3.org/1999/xhtml","div");Sq(b,"after-if-continues");a = new Fk(a.N,b,null,null,null,3,a.b);return new Qk({na:[{node:b,Za:a.type,ra:a,Aa:null,xa:null}],la:0,K:!1,Ia:null});}function Iv(a,b,c){this.w = a;this.b = b;this.f = c;}n = Iv.prototype;n.ob = function(a,b){return b && !a || a && a.b?!1:!0;};n.$c = function(){return !1;};n.Tc = function(){};n.Da = function(a,b){return new Jv(this.w,this.f).f(a)?Ov(this.b,b,this.w).fa((function(a){this.w.B.appendChild(a);return L(!0);}).bind(this)):L(!0);};n.fe = function(a){return a instanceof Iv?this.b == a.b:!1;};n.je = function(){return 9;};function Jv(a,b){this.w = a;this.g = b;}Jv.prototype.b = function(a){return this.f(a)?this.g:0;};Jv.prototype.G = function(a){return this.b(a);};Jv.prototype.f = function(a){if(!a)return !1;var b=a.ra?a.ra.ma:a.N;if(b === this.w.N)return !!a.K;for(a = b.parentNode;a;a = a.parentNode) if(a === this.w.N)return !0;return !1;};function mo(a,b){return a.fa(function(a){return Nv(a,b);});}function lp(a,b){var c=J("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;qe(function(){if(d){var a=Nv(d,b);d = d.parent;return a.wc(!0);}return L(!1);}).then(function(){M(c,!0);});return c.result();};function Sv(a){var b=Tv.findIndex(function(b){return b.root === a;});return (b = Tv[b])?b.zg:null;}function Uv(a,b,c){var d=a.w,e=d.display,f=d.parent?d.parent.display:null;return "table-row" === e && !Vv(f) && "table" !== f && "inline-table" !== f || "table-cell" === e && "table-row" !== f && !Vv(f) && "table" !== f && "inline-table" !== f || d.F instanceof bp && d.F !== b?no(c,d).fa(function(b){a.w = b;return L(!0);}):null;}function Vv(a){return "table-row-group" === a || "table-header-group" === a || "table-footer-group" === a;}function Wv(a,b){this.rowIndex = a;this.N = b;this.cells = [];}function Xv(a){return Math.min.apply(null,a.cells.map(function(a){return a.height;}));}function Yv(a,b,c){this.rowIndex = a;this.La = b;this.f = c;this.b = c.colSpan || 1;this.rowSpan = c.rowSpan || 1;this.height = 0;this.gc = null;}function Zv(a,b,c){this.rowIndex = a;this.La = b;this.Ob = c;}function $v(a,b,c){this.g = a;this.b = c;this.Yb = new nm(a,b,c);this.f = !1;}$v.prototype.Rb = function(){var a=this.b.B,b=this.b.R;"middle" !== b && "bottom" !== b || w(a,"vertical-align","top");var c=this.Yb.Rb(!0);w(a,"vertical-align",b);return c;};function aw(a,b){this.B = a;this.b = b;}function bw(a,b,c,d){sm.call(this,a,b,c,d);this.F = a.F;this.rowIndex = this.l = null;}t(bw,sm);bw.prototype.f = function(a,b){var c=sm.prototype.f.call(this,a,b);return b < this.b()?null:cw(this).every(function(a){return !!a.w;})?c:null;};bw.prototype.b = function(){var a=sm.prototype.b.call(this);cw(this).forEach(function(b){a += b.pb.b();});return a;};function cw(a){a.l || (a.l = dw(a).map(function(a){return a.Rb();}));return a.l;}function dw(a){return ew(a.F,null != a.rowIndex?a.rowIndex:a.rowIndex = fw(a.F,a.position.N)).map(a.F.Ed,a.F);}function gw(a,b,c){this.rowIndex = a;this.j = b;this.F = c;this.h = null;}t(gw,Sn);gw.prototype.f = function(a,b){if(b < this.b())return null;var c=hw(this),d=iw(this),e=d.every(function(a){return !!a.w;}) && d.some(function(a,b){var d=a.w,e=c[b].Yb.ef[0];return !(e.B === d.B && e.K === d.K && e.la === d.la);});this.j.b = d.some(function(a){return a.w && a.w.b;});return e?this.j:null;};gw.prototype.b = function(){var a=this.F,b=0;jw(a,a.g[this.rowIndex]) || (b += 10);iw(this).forEach(function(a){b += a.pb.b();});return b;};function iw(a){a.h || (a.h = hw(a).map(function(a){return a.Rb();}));return a.h;}function hw(a){return kw(a.F,a.rowIndex).map(a.F.Ed,a.F);}function bp(a,b){cp.call(this,a,b);this.D = b;this.u = !1;this.G = -1;this.J = 0;this.H = [];this.I = this.A = null;this.O = 0;this.g = [];this.l = [];this.f = [];this.C = null;this.h = [];this.b = null;}t(bp,cp);n = bp.prototype;n.Je = function(){return "Table formatting context (vivliostyle.table.TableFormattingContext)";};n.Te = function(a,b){if(!b)return b;switch(a.display){case "table-row":return !this.h.length;case "table-cell":return !this.h.some(function(b){return b.xd.na[0].node === a.N;});default:return b;}};function lw(a,b){var c=a.l[b];c || (c = a.l[b] = []);return c;}function fw(a,b){return a.g.findIndex(function(a){return b === a.N;});}function kw(a,b){return lw(a,b).reduce(function(a,b){return b.Ob !== a[a.length - 1]?a.concat(b.Ob):a;},[]);}function ew(a,b){return kw(a,b).filter(function(a){return a.rowIndex + a.rowSpan - 1 > b;});}n.Ed = function(a){return this.f[a.rowIndex] && this.f[a.rowIndex][a.La];};function jw(a,b){return Xv(b) > a.J / 2;}function mw(a){0 > a.G && (a.G = Math.max.apply(null,a.g.map(function(a){return a.cells.reduce(function(a,b){return a + b.b;},0);})));return a.G;}function nw(a,b){a.g.forEach(function(a){a.cells.forEach(function(a){var c=pk(b,a.f);a.f = null;a.height = this.u?c.width:c.height;},this);},a);}function ow(a,b){if(!b)return null;var c=null,d=0;a: for(;d < a.f.length;d++) if(a.f[d])for(var e=0;e < a.f[d].length;e++) if(a.f[d][e] && b === a.f[d][e].Yb.b){c = a.g[d].cells[e];break a;}if(!c)return null;for(;d < a.l.length;d++) for(;e < a.l[d].length;e++) {var f=a.l[d][e];if(f.Ob === c)return {rowIndex:f.rowIndex,La:f.La};}return null;}function pw(a,b){var c=[];return a.l.reduce((function(a,e,f){if(f >= b.rowIndex)return a;e = this.Ed(e[b.La].Ob);if(!e || 0 <= c.indexOf(e))return a;qw(e.Yb.b,a);c.push(e);return a;}).bind(a),[]);}function rw(a){var b=[];a.g.forEach((function(a){a.cells.forEach((function(a,c){b[c] || (b[c] = {vf:[],elements:[]});var d=b[c],e=this.Ed(a);!e || 0 <= d.vf.indexOf(e) || (qw(e.Yb.b,d.elements),d.vf.push(e));}).bind(this));}).bind(a));return [new sw(b.map(function(a){return a.elements;}))];}function qw(a,b){a.A.forEach(function(a){a instanceof rv && b.push(a.w.F.b);a instanceof Kv && Lv(a,null).forEach(function(a){b.push(a);});});}n.Le = function(){return [].concat(this.h);};n.Ke = function(a){this.h = a;};function sw(a){this.f = a;}sw.prototype.b = function(a){return tw(this,a,function(a){return a.current;});};sw.prototype.G = function(a){return tw(this,a,function(a){return a.te;});};function tw(a,b,c){var d=0;a.f.forEach(function(a){a = Tn(b,a);d = Math.max(d,c(a));});return d;}function uw(a,b){this.F = a;this.h = b;this.rowIndex = -1;this.La = 0;this.g = !1;this.f = [];}t(uw,mm);n = uw.prototype;n.pd = function(a){var b=this.F,c=Uv(a,b,this.h);if(c)return c;vw(this,a);var c=a.w,d=b.b;switch(c.display){case "table":b.O = c.ia;break;case "table-caption":b.H.push(new aw(c.B,c.Z));break;case "table-header-group":return d.mc || (this.b = !0,uv(d,c)),L(!0);case "table-footer-group":return d.lc || (this.b = !0,vv(d,c)),L(!0);case "table-row":this.b || (this.g = !0,this.rowIndex++,this.La = 0,b.g[this.rowIndex] = new Wv(this.rowIndex,c.N),d.g || (d.g = c.N));}return mm.prototype.pd.call(this,a);};n.cc = function(a){var b=this.F,c=a.w,d=c.display,e=this.h.b;vw(this,a);if(c.N === b.D)d = vn(e,sv(b,c)),b.J = parseFloat(d[b.u?"height":"width"]),b.b.J = a.Hc && a.Hc.N,a.Hb = !0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b = !1,L(!0);break;case "table-row":this.b || (b.C = c.B,this.g = !1);break;case "table-cell":if(!this.b){this.g || (this.rowIndex++,this.La = 0,this.g = !0);d = this.rowIndex;c = new Yv(this.rowIndex,this.La,c.B);e = b.g[d];e || (b.g[d] = new Wv(d,null),e = b.g[d]);e.cells.push(c);for(var e=d + c.rowSpan,f=lw(b,d),g=0;f[g];) g++;for(;d < e;d++) for(var f=lw(b,d),h=g;h < g + c.b;h++) {var l=f[h] = new Zv(d,h,c);c.gc || (c.gc = l);}this.La++;}}return mm.prototype.cc.call(this,a);};n.ff = function(a){ww(this,a);};n.pf = function(a){ww(this,a);};n.Vf = function(a){ww(this,a);};n.nf = function(a){ww(this,a);};function ww(a,b){var c=b.w;c && c.B && !jo(c) && a.f.push(c.clone());}function vw(a,b){0 < a.f.length && oo(a.h,b.w,a.f);a.f = [];}function xw(a,b){this.Tb = !0;this.F = a;this.f = b;this.l = !1;this.b = -1;this.g = 0;this.A = b.l;b.l = !1;}t(xw,mm);var yw={"table-caption":!0,"table-column-group":!0,"table-column":!0};function zw(a,b,c,d){var e=b.rowIndex,f=b.La,g=c.B;if(1 < b.b){w(g,"box-sizing","border-box");for(var h=a.F.I,l=0,k=0;k < b.b;k++) l += h[b.gc.La + k];l += a.F.O * (b.b - 1);w(g,a.F.u?"height":"width",l + "px");}b = g.ownerDocument.createElement("div");g.appendChild(b);c = new $v(a.f,b,c);a = a.F;(g = a.f[e]) || (g = a.f[e] = []);g[f] = c;1 === d.f.na.length && d.f.K && (c.f = !0);return qm(c.Yb,d).wc(!0);}function Aw(a,b){var c=a.F.h[0];return c?c.Ob.gc.La === b:!1;}function Bw(a){var b=a.F.h;if(!b.length)return [];var c=[],d=0;do {var e=b[d],f=e.Ob.rowIndex;if(f < a.b){var g=c[f];g || (g = c[f] = []);g.push(e);b.splice(d,1);}else d++;}while(d < b.length);return c;}function Cw(a,b){var c=a.F,d=Bw(a),e=d.reduce(function(a){return a + 1;},0);if(0 === e)return L(!0);var f=a.f.j,g=b.w;g.B.parentNode.removeChild(g.B);var h=J("layoutRowSpanningCellsFromPreviousFragment"),l=L(!0),k=0,m=[];d.forEach(function(a){l = l.fa((function(){var b=Ck(a[0].xd.na[1],g.parent);return eo(f,b,!1).fa((function(){function d(a){for(;h < a;) {if(!(0 <= m.indexOf(h))){var c=b.B.ownerDocument.createElement("td");w(c,"padding","0");b.B.appendChild(c);}h++;}}var g=L(!0),h=0;a.forEach(function(a){g = g.fa((function(){var c=a.Ob;d(c.gc.La);var g=a.xd,l=Ck(g.na[0],b);l.la = g.la;l.K = g.K;l.Ma = g.na[0].Ma + 1;return eo(f,l,!1).fa((function(){for(var b=a.tf,d=0;d < c.b;d++) m.push(h + d);h += c.b;return zw(this,c,l,b).fa((function(){l.B.rowSpan = c.rowIndex + c.rowSpan - this.b + e - k;return L(!0);}).bind(this));}).bind(this));}).bind(this));},this);return g.fa(function(){d(mw(c));k++;return L(!0);});}).bind(this));}).bind(this));},a);l.then(function(){eo(f,g,!0,b.ud).then(function(){M(h,!0);});});return h.result();}function Dw(a,b){if(a.j || a.h)return L(!0);var c=b.w,d=a.F;0 > a.b?a.b = fw(d,c.N):a.b++;a.g = 0;a.l = !0;return Cw(a,b).fa((function(){Ew(this);Yo(this.f,b.Hc,null,!0,b.Bc) && !ew(d,this.b - 1).length && (this.f.l = this.A,c.b = !0,b.Hb = !0);return L(!0);}).bind(a));}function Ew(a){a.F.g[a.b].cells.forEach((function(a){var b=this.F.h[a.La];b && b.Ob.gc.La == a.gc.La && (a = b.xd.na[0],b = Mj(this.f.j.ba,a.node),gr(b,a.Ma + 1,1));}).bind(a));}function Fw(a,b){if(a.j || a.h)return L(!0);var c=b.w;a.l || (0 > a.b?a.b = 0:a.b++,a.g = 0,a.l = !0);var d=a.F.g[a.b].cells[a.g],e=Ek(c).modify();e.K = !0;b.w = e;var f=J("startTableCell");Aw(a,d.gc.La)?(e = a.F.h.shift(),c.Ma = e.xd.na[0].Ma + 1,e = L(e.tf)):e = ko(a.f,c,b.ud).fa(function(a){a.B && c.B.removeChild(a.B);return L(new Qk(Ak(a)));});e.then((function(a){zw(this,d,c,a).then((function(){this.cc(b);this.g++;M(f,!0);}).bind(this));}).bind(a));return f.result();}xw.prototype.Wf = function(a){var b=Uv(a,this.F,this.f);if(b)return b;var b=a.w,c=this.F.b,d=b.display;return "table-header-group" === d && c && c.C === b.N?(this.j = !0,L(!0)):"table-footer-group" === d && c && c.l === b.N?(this.h = !0,L(!0)):"table-row" === d?Dw(this,a):"table-cell" === d?Fw(this,a):L(!0);};xw.prototype.zf = function(a){a = a.w;"table-row" === a.display && (this.l = !1,this.j || this.h || (a = Ek(a).modify(),a.K = !1,this.f.J.push(new gw(this.b,a,this.F))));return L(!0);};xw.prototype.cc = function(a){var b=a.w,c=this.F.b,d=b.display;"table-header-group" === d?c && !c.h && c.C === b.N?(this.j = !1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"):"table-footer-group" === d && (c && !c.h && c.l === b.N?(this.h = !1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"));if(d && yw[d])b.B.parentNode.removeChild(b.B);else if(b.N === this.F.D)!(c = b.B.style) || Xo(c.paddingBottom) && Xo(c.borderBottomWidth) || (b.b = Yo(this.f,a.Hc,null,!1,a.Bc)),this.f.l = this.A,a.Hb = !0;else return mm.prototype.cc.call(this,a);return L(!0);};var Tv=[];function Gw(){}function Hw(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h < b;h++) {var l=e.createElement("td");f.appendChild(l);g.push(l);}a.parentNode.insertBefore(f,a.nextSibling);b = g.map(function(a){a = pk(d,a);return c?a.height:a.width;});a.parentNode.removeChild(f);return b;}function Iw(a){var b=[];for(a = a.firstElementChild;a;) "colgroup" === a.localName && b.push(a),a = a.nextElementSibling;return b;}function Jw(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;) {if("col" === e.localName){var f=e.span;e.removeAttribute("span");for(c -= f;1 < f--;) {var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g);}b.push(e);}e = e.nextElementSibling;}for(;0 < c--;) e = a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e);});return b;}function Kw(a,b,c,d){if(a.length < c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b = a.length;b < c;b++) {var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f);}}}function Lw(a,b,c){var d=a.u,e=a.C;if(e){a.C = null;var f=e.ownerDocument.createDocumentFragment(),g=mw(a);if(0 < g){var h=a.I = Hw(e,g,d,c.b);c = Iw(b);e = Jw(c);Kw(e,c,g,b);e.forEach(function(a,b){w(a,d?"height":"width",h[b] + "px");});c.forEach(function(a){f.appendChild(a.cloneNode(!0));});}a.A = f;}}function Mw(a,b,c){var d=b.F;d.u = b.u;qr(d,b.u);var e=Sv(b.N);Tv = [];var f=J("TableLayoutProcessor.doInitialLayout"),g=Ek(b);km(new jm(new uw(b.F,c),c.j),b).then((function(a){var h=a.B,k=pk(c.b,h),k=c.u?k.left:k.bottom,k=k + (c.u?-1:1) * Tn(b,Wn(c)).current;Xn(c,k) || e && e.dg?(Lw(d,h,c),nw(d,c.b),M(f,null)):(c.J.push(new Nw(g)),M(f,a));}).bind(a));return f.result();}function Ow(a,b,c){var d=a.H;d.forEach(function(a,f){a && (b.insertBefore(a.B,c),"top" === a.b && (d[f] = null));});}function Pw(a,b){if(a.A && b){var c=Iw(b);c && c.forEach(function(a){b.removeChild(a);});}}function Qw(a,b){var c=a.F,d=sv(c,a),e=d.firstChild;Ow(c,d,e);c.A && !Iw(d).length && d.insertBefore(c.A.cloneNode(!0),e);c = new xw(c,b);c = new jm(c,b.j);d = J("TableFormattingContext.doLayout");km(c,a).Ea(d);return d.result();}n = Gw.prototype;n.Xd = function(a,b,c){var d=a.F;return sv(d,a)?(c && pv(a.parent,b),um(new Rw(d,this),a,b)):no(b,a);};n.wf = function(a,b,c,d){return new bw(a,b,c,d);};n.Me = function(){return !1;};n.lf = function(){return !1;};n.Da = function(a,b,c,d){var e=b.F;if("table-row" === b.display){var f=fw(e,b.N);e.h = [];var g;g = b.K?ew(e,f):kw(e,f);if(g.length){var h=J("TableLayoutProcessor.finishBreak"),l=0;re(function(a){if(l === g.length)P(a);else {var b=g[l++],c=e.Ed(b),d=c.Rb().w,h=c.b,k=Lk(h),u=new Qk(Lk(d));e.h.push({xd:k,tf:u,Ob:b});h = h.B;pp(c.b);f < b.rowIndex + b.rowSpan - 1 && (h.rowSpan = f - b.rowIndex + 1);c.f?O(a):c.Yb.Da(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.Yb.b.element,k=c.b.B,l=pk(g.b,k),k=vo(g,k);f?(b = l.right - g.ja - b.b(d) - k.right,w(h,"max-width",b + "px")):(b = g.ja - b.b(d) - l.top - k.top,w(h,"max-height",b + "px"));w(h,"overflow","hidden");}O(a);});}}).then(function(){Qo(a,b,!1);pp(b);e.f = [];M(h,!0);});return h.result();}}e.f = [];return Uo.Da(a,b,c,d);};n.sd = function(a,b,c,d){mp.prototype.sd(a,b,c,d);};function Rw(a,b){tm.call(this);this.A = b;this.b = a;}t(Rw,tm);Rw.prototype.j = function(a){var b=this.b.b;return b && b.j?(a.N === this.b.D && !a.K && b && (b.qc = !1,b.Vc = !1),new Sw(this.b)):new Tw(this.b,this.A);};Rw.prototype.g = function(a){tm.prototype.g.call(this,a);Pw(this.b,sv(this.b,a));};Rw.prototype.f = function(a,b){tm.prototype.f.call(this,a,b);this.b.f = [];};function Tw(a,b){this.F = a;this.h = b;}t(Tw,Av);Tw.prototype.b = function(a,b){Av.prototype.b.call(this,a,b);return Mw(this.h,a,b);};function Nw(a){sm.call(this,a,null,a.b,0);}t(Nw,sm);Nw.prototype.b = function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return (this.j?3:0) + (this.position.parent?this.position.parent.j:0);};Nw.prototype.A = function(a){a.A.push(new Uw(this.position.N));};function Uw(a){this.b = a;}n = Uw.prototype;n.ob = function(){return !1;};n.$c = function(){return !0;};n.Tc = function(a,b){Tv.push({root:b.N,zg:{dg:!0}});};n.Da = function(){return L(!0);};n.fe = function(a){return a instanceof Uw && a.b === this.b;};n.je = function(){return 0;};function Sw(a){this.F = a;}t(Sw,Bv);Sw.prototype.b = function(a,b){var c=this.F.b;if(c && !wv(c,a)){var d=new Kv(a);b.A.some(function(a){return d.fe(a);}) || b.A.unshift(d);}return Qw(a,b);};function Kv(a){rv.call(this,a);this.b = [];}t(Kv,rv);n = Kv.prototype;n.ob = function(a,b,c){var d=this.w.F.b;return !d || c.wd || to(this.w.B) || !zv(d)?!0:b && !a || a && a.b?!1:!0;};n.$c = function(a){return Vw(a,this.w.F).some(function(b){return b.yd.some(function(b){return b.$c(a);});})?!0:rv.prototype.$c.call(this,a);};n.Tc = function(a,b,c,d){var e=this.w.F;this.b = Vw(b,e);this.b.forEach(function(b){b.yd.forEach(function(e){e.Tc(a,b.pb,c,d);});});a || (Pw(e,sv(e,this.w)),Ww(c));rv.prototype.Tc.call(this,a,b,c,d);};n.Da = function(a,b){var c=J("finishBreak"),d=this.b.reduce(function(a,b){return a.concat(b.yd.map(function(a){return {fg:a,pb:b.pb};}));},[]),e=0;qe(function(){if(e < d.length){var a=d[e++];return a.fg.Da(a.pb,b).wc(!0);}return L(!1);}).then(function(){M(c,!0);});return c.result().fa((function(){return rv.prototype.Da.call(this,a,b);}).bind(this));};function Ww(a){if(a && "table-row" === a.display && a.B)for(;a.B.previousElementSibling;) {var b=a.B.previousElementSibling;b.parentNode && b.parentNode.removeChild(b);}}function Vw(a,b){return Xw(a,b).map(function(a){return {yd:a.ig.Yb.b.A,pb:a.pb};});}function Xw(a,b){var c=Number.MAX_VALUE;a && "table-row" === a.display && (c = fw(b,a.N) + 1);for(var c=Math.min(b.f.length,c),d=[],e=0;e < c;e++) b.f[e] && b.f[e].forEach(function(a){a && d.push({ig:a,pb:a.Rb().w});});return d;}function Lv(a,b){var c=a.w.F,d=ow(c,b);return d?pw(c,d):rw(c);}n.fe = function(a){return a instanceof Kv?this.w.F === a.w.F:!1;};var Yw=new Gw();Td("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c === Ad?(b = a.parent,new bp(b?b.F:null,a.N)):null:null;});Td("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof bp?Yw:null;});Array.from || (Array.from = function(a,b,c){b && c && (b = b.bind(c));c = [];for(var d=a.length,e=0;e < d;e++) c[e] = b?b(a[e],e):a[e];return c;});Array.prototype.findIndex || Object.defineProperty(Array.prototype,"findIndex",{value:function value(a,b){if(null == this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function" !== typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length >>> 0,e,f=0;f < d;f++) if((e = c[f],a.call(b,e,f,c)))return f;return -1;},enumerable:!1,configurable:!1,writable:!1});Object.assign || (Object.assign = function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c] = b[c];});return a;});function Zw(a){function b(a){return "number" === typeof a?a:null;}function c(a){return "string" === typeof a?{url:a,kb:null,sc:null}:{url:a.url,kb:b(a.startPage),sc:b(a.skipPagesBefore)};}return Array.isArray(a)?a.map(c):a?[c(a)]:null;}function $w(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize = d;break;case "pageBorderWidth":b.pageBorder = d;break;default:b[c] = d;}});return b;}function ax(a,b){Fj = a.debug;this.g = !1;this.h = a;this.Lb = new pu(a.window || window,a.viewportElement,"main",this.gg.bind(this));this.f = {autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b && this.Uf(b);this.b = new Ta();Object.defineProperty(this,"readyState",{get:function get(){return this.Lb.C;}});}n = ax.prototype;n.Uf = function(a){var b=Object.assign({a:"configure"},$w(a));this.Lb.A(b);Object.assign(this.f,a);};n.gg = function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t" !== c && (b[c] = a[c]);});Ua(this.b,b);};n.Ag = function(a,b){this.b.addEventListener(a,b,!1);};n.Dg = function(a,b){this.b.removeEventListener(a,b,!1);};n.lg = function(a,b,c){a || Ua(this.b,{type:"error",content:"No URL specified"});bx(this,a,null,b,c);};n.Bg = function(a,b,c){a || Ua(this.b,{type:"error",content:"No URL specified"});bx(this,null,a,b,c);};function bx(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return {url:a.url || null,text:a.text || null};});}d = d || {};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e && Object.assign(a.f,e);b = Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:Zw(b) || c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},$w(a.f));a.g?a.Lb.A(b):(a.g = !0,Ru(a.Lb,b));}n.Sb = function(){return this.Lb.Sb();};n.og = function(a){a: switch(a){case "left":a = "ltr" === this.Sb()?"previous":"next";break a;case "right":a = "ltr" === this.Sb()?"next":"previous";}this.Lb.A({a:"moveTo",where:a});};n.ng = function(a){this.Lb.A({a:"moveTo",url:a});};n.Cg = function(a){a: {var b=this.Lb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a = Mu(b,b.Y.ub?Lu(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: " + a);}}return a;};n.jg = function(){return this.Lb.ia;};ba("vivliostyle.viewer.Viewer",ax);ax.prototype.setOptions = ax.prototype.Uf;ax.prototype.addListener = ax.prototype.Ag;ax.prototype.removeListener = ax.prototype.Dg;ax.prototype.loadDocument = ax.prototype.lg;ax.prototype.loadEPUB = ax.prototype.Bg;ax.prototype.getCurrentPageProgression = ax.prototype.Sb;ax.prototype.navigateToPage = ax.prototype.og;ax.prototype.navigateToInternalUrl = ax.prototype.ng;ax.prototype.queryZoomFactor = ax.prototype.Cg;ax.prototype.getPageSizes = ax.prototype.jg;ba("vivliostyle.viewer.ZoomType",Nu);Nu.FIT_INSIDE_VIEWPORT = "fit inside viewport";ba("vivliostyle.viewer.PageViewMode",ou);ou.SINGLE_PAGE = "singlePage";ou.SPREAD = "spread";ou.AUTO_SPREAD = "autoSpread";gv.call(tu,"load_vivliostyle","end",void 0);var cx=16,dx="ltr";function ex(a){window.adapt_command(a);}function fx(){ex({a:"moveTo",where:"ltr" === dx?"previous":"next"});}function gx(){ex({a:"moveTo",where:"ltr" === dx?"next":"previous"});}function hx(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End" === b || "End" === c)ex({a:"moveTo",where:"last"}),a.preventDefault();else if("Home" === b || "Home" === c)ex({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp" === b || "Up" === b || "Up" === c)ex({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown" === b || "Down" === b || "Down" === c)ex({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight" === b || "Right" === b || "Right" === c)gx(),a.preventDefault();else if("ArrowLeft" === b || "Left" === b || "Left" === c)fx(),a.preventDefault();else if("0" === b || "U+0030" === c)ex({a:"configure",fontSize:Math.round(cx)}),a.preventDefault();else if("t" === b || "U+0054" === c)ex({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+" === b || "Add" === b || "U+002B" === c || "U+00BB" === c || "U+004B" === c && d === KeyboardEvent.b)cx *= 1.2,ex({a:"configure",fontSize:Math.round(cx)}),a.preventDefault();else if("-" === b || "Subtract" === b || "U+002D" === c || "U+00BD" === c || "U+004D" === c && d === KeyboardEvent.b)cx /= 1.2,ex({a:"configure",fontSize:Math.round(cx)}),a.preventDefault();}function ix(a){switch(a.t){case "loaded":a = a.viewer;var b=dx = a.Sb();a.Vd.setAttribute("data-vivliostyle-page-progression",b);a.Vd.setAttribute("data-vivliostyle-spread-view",a.Y.ub);window.addEventListener("keydown",hx,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a = document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",fx,!1);b = document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",gx,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state","attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state");},1E3);});break;case "nav":(a = a.cfi) && location.replace(sa(location.href,Ia(a || "")));break;case "hyperlink":a.internal && ex({a:"moveTo",url:a.href});}}ba("vivliostyle.viewerapp.main",function(a){var b=a && a.fragment || qa("f"),c=a && a.epubURL || qa("b"),d=a && a.xmlURL || qa("x"),e=a && a.defaultPageWidth || qa("w"),f=a && a.defaultPageHeight || qa("h"),g=a && a.defaultPageSize || qa("size"),h=a && a.orientation || qa("orientation"),l=qa("spread"),l=a && a.spreadView || !!l && "false" != l,k=a && a.viewportElement || document.body;a = {a:c?"loadEPUB":"loadXML",url:c || d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a && a.uaRoot || null,document:a && a.document || null,userStyleSheet:a && a.userStyleSheet || null,spreadView:l,pageBorder:1};var m;if(e && f)m = e + " " + f;else {switch(g){case "A5":e = "148mm";f = "210mm";break;case "A4":e = "210mm";f = "297mm";break;case "A3":e = "297mm";f = "420mm";break;case "B5":e = "176mm";f = "250mm";break;case "B4":e = "250mm";f = "353mm";break;case "letter":e = "8.5in";f = "11in";break;case "legal":e = "8.5in";f = "14in";break;case "ledger":e = "11in",f = "17in";}e && f && (m = g,"landscape" === h && (m = m?m + " landscape":null,g = e,e = f,f = g));}e && f && (a.viewport = {width:e,height:f},g = document.createElement("style"),g.textContent = "@page { size: " + m + "; margin: 0; }",document.head.appendChild(g));Ru(new pu(window,k,"main",ix),a);});return enclosingObject.vivliostyle;}).bind(window));

},{}]},{},[4]);
