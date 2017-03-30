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
 * Vivliostyle core 2017.2.1-pre.20170330022032
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
function t(a,b){function c(){}c.prototype=b.prototype;a.uf=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.ng=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}t(ca,Error);ca.prototype.name="CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift()}t(ea,ca);ea.prototype.name="AssertionError";function fa(a,b){throw new ea("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ha(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ia(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.w=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function ja(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ka(a,b){var c=v,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ia.prototype.debug=function(a){var b=ha(arguments);this.h(ga(b));ja(this,1,b)};ia.prototype.g=function(a){var b=ha(arguments);this.l(ga(b));ja(this,2,b)};ia.prototype.b=function(a){var b=ha(arguments);this.w(ga(b));ja(this,3,b)};ia.prototype.error=function(a){var b=ha(arguments);this.j(ga(b));ja(this,4,b)};var v=new ia;function la(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ma=window.location.href,na=window.location.href;
function oa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function pa(a){a=new RegExp("#(.*&)?"+qa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ra(a,b){var c=new RegExp("#(.*&)?"+qa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function sa(a){return null==a?a:a.toString()}function ta(){this.b=[null]}
ta.prototype.length=function(){return this.b.length-1};function va(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};
function ya(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[va(a,b)]}
function za(a){var b=xa[a];if(b||null===b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<wa.length;b++){var c=wa[b];if(ya(c,a))return b=c+a,xa[a]=[b],[b]}v.b("Property not supported by the browser: ",a);return xa[a]=null}
function w(a,b,c){try{var d=za(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){v.b(e)}}function Aa(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Ba(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Da(){this.b=[]}Da.prototype.append=function(a){this.b.push(a);return this};Da.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ea(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Fa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ea)}
function Ga(a){return a.replace(/[\u0000-\u001F"]/g,Ea)}function Ha(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ia(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function qa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ja(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(qa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ka(a){if(!a)throw"Assert failed";}function La(a,b){for(var c=0,d=a;;){Ka(c<=d);Ka(!c||!b(c-1));Ka(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ma(a,b){return a-b}
function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Pa={};function Qa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Ra(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Sa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Ta(){this.h={}}function Ua(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Ta.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Ta.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Va=null,Wa=null;function Xa(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Za(a){return"^"+a}function $a(a){return a.substr(1)}function ab(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,$a):a}
function bb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=ab(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function cb(){}cb.prototype.g=function(a){a.append("!")};cb.prototype.h=function(){return!1};function db(a,b,c){this.index=a;this.id=b;this.tb=c}
db.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.tb)a.append("["),this.id&&a.append(this.id),this.tb&&(a.append(";s="),a.append(this.tb)),a.append("]")};
db.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.M=!0),a.node=c);if(this.id&&(a.M||this.id!=Xa(a.node)))throw Error("E_CFI_ID_MISMATCH");a.tb=this.tb;return!0};function eb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.tb=d}
eb.prototype.h=function(a){if(0<this.offset&&!a.M){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.tb=this.tb;return!0};
eb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.tb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Za)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Za));this.tb&&(a.append(";s="),a.append(this.tb));a.append("]")}};function fb(){this.pa=null}
function gb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=bb(c[4]);f.push(new db(g,h,sa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=ab(h));var l=c[7];l&&(l=ab(l));c=bb(c[10]);f.push(new eb(g,h,l,sa(c.s)));break;case "!":e++;f.push(new cb);break;case "~":case "@":case "":a.pa=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function hb(a,b){for(var c={node:b.documentElement,offset:0,M:!1,tb:null,Wc:null},d=0;d<a.pa.length;d++)if(!a.pa[d].h(c)){++d<a.pa.length&&(c.Wc=new fb,c.Wc.pa=a.pa.slice(d));break}return c}
fb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ib(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new eb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Xa(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new db(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.pa?(f.push(new cb),a.pa=f.concat(a.pa)):a.pa=f}fb.prototype.toString=function(){if(!this.pa)return"";var a=new Da;a.append("epubcfi(");for(var b=0;b<this.pa.length;b++)this.pa[b].g(a);a.append(")");return a.toString()};function jb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Vd:!0,Pd:25,Ud:!1,ce:!1,ub:!1,Ac:1,Be:{print:!0},dc:void 0}}function kb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Vd:a.Vd,Pd:a.Pd,Ud:a.Ud,ce:a.ce,ub:a.ub,Ac:a.Ac,Be:Object.assign({},a.Be),dc:a.dc?Object.assign({},a.dc):void 0}}var lb=jb(),mb={};function nb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ob(a){return'"'+Ga(a+"")+'"'}function pb(a){return Fa(a+"")}
function qb(a,b){return a?Fa(a)+"."+Fa(b):Fa(b)}var rb=0;
function sb(a,b){this.parent=a;this.w="S"+rb++;this.C=[];this.b=new tb(this,0);this.f=new tb(this,1);this.j=new tb(this,!0);this.h=new tb(this,!1);a&&a.C.push(this);this.values={};this.G={};this.D={};this.l=b;if(!a){var c=this.D;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=nb;c["css-string"]=ob;c["css-name"]=pb;c["typeof"]=function(a){return typeof a};ub(this,"page-width",function(){return this.Sb()});ub(this,"page-height",function(){return this.Rb()});
ub(this,"pref-font-family",function(){return this.Y.fontFamily});ub(this,"pref-night-mode",function(){return this.Y.ce});ub(this,"pref-hyphenate",function(){return this.Y.Vd});ub(this,"pref-margin",function(){return this.Y.margin});ub(this,"pref-line-height",function(){return this.Y.lineHeight});ub(this,"pref-column-width",function(){return this.Y.Pd*this.fontSize});ub(this,"pref-horizontal",function(){return this.Y.Ud});ub(this,"pref-spread-view",function(){return this.Y.ub})}}
function ub(a,b,c){a.values[b]=new vb(a,c,b)}function wb(a,b){a.values["page-number"]=b}function xb(a,b){a.D["has-content"]=b}var yb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function zb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function Ab(a,b,c,d){this.bb=b;this.Fb=c;this.O=null;this.Sb=function(){return this.O?this.O:this.Y.ub?Math.floor(b/2)-this.Y.Ac:b};this.J=null;this.Rb=function(){return this.J?this.J:c};this.w=d;this.qa=null;this.fontSize=function(){return this.qa?this.qa:d};this.Y=lb;this.H={}}function Bb(a,b){a.H[b.w]={};for(var c=0;c<b.C.length;c++)Bb(a,b.C[c])}
function Cb(a,b,c){return"vw"==b?a.Sb()/100:"vh"==b?a.Rb()/100:"em"==b||"rem"==b?c?a.w:a.fontSize():"ex"==b||"rex"==b?yb.ex*(c?a.w:a.fontSize())/yb.em:yb[b]}function Db(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Eb(a,b,c,d,e){do{var f=b.G[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.D[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new tb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Fb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Sb();break;case "height":f=a.Rb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Gb(a){this.b=a;this.h="_"+rb++}n=Gb.prototype;n.toString=function(){var a=new Da;this.va(a,0);return a.toString()};n.va=function(){throw Error("F_ABSTRACT");};n.kb=function(){throw Error("F_ABSTRACT");};n.Wa=function(){return this};n.ec=function(a){return a===this};function Hb(a,b,c,d){var e=d[a.h];if(null!=e)return e===mb?!1:e;d[a.h]=mb;b=a.ec(b,c,d);return d[a.h]=b}
n.evaluate=function(a){var b;b=(b=a.H[this.b.w])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.kb(a);var c=this.h,d=this.b,e=a.H[d.w];e||(e={},a.H[d.w]=e);return e[c]=b};n.Ge=function(){return!1};function Ib(a,b){Gb.call(this,a);this.f=b}t(Ib,Gb);n=Ib.prototype;n.qe=function(){throw Error("F_ABSTRACT");};n.Ce=function(){throw Error("F_ABSTRACT");};n.kb=function(a){a=this.f.evaluate(a);return this.Ce(a)};n.ec=function(a,b,c){return a===this||Hb(this.f,a,b,c)};
n.va=function(a,b){10<b&&a.append("(");a.append(this.qe());this.f.va(a,10);10<b&&a.append(")")};n.Wa=function(a,b){var c=this.f.Wa(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Jb(a,b,c){Gb.call(this,a);this.f=b;this.g=c}t(Jb,Gb);n=Jb.prototype;n.gd=function(){throw Error("F_ABSTRACT");};n.Qa=function(){throw Error("F_ABSTRACT");};n.rb=function(){throw Error("F_ABSTRACT");};n.kb=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.rb(b,a)};
n.ec=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.g,a,b,c)};n.va=function(a,b){var c=this.gd();c<=b&&a.append("(");this.f.va(a,c);a.append(this.Qa());this.g.va(a,c);c<=b&&a.append(")")};n.Wa=function(a,b){var c=this.f.Wa(a,b),d=this.g.Wa(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Kb(a,b,c){Jb.call(this,a,b,c)}t(Kb,Jb);Kb.prototype.gd=function(){return 1};function Lb(a,b,c){Jb.call(this,a,b,c)}t(Lb,Jb);Lb.prototype.gd=function(){return 2};
function Mb(a,b,c){Jb.call(this,a,b,c)}t(Mb,Jb);Mb.prototype.gd=function(){return 3};function Nb(a,b,c){Jb.call(this,a,b,c)}t(Nb,Jb);Nb.prototype.gd=function(){return 4};function Ob(a,b){Ib.call(this,a,b)}t(Ob,Ib);Ob.prototype.qe=function(){return"!"};Ob.prototype.Ce=function(a){return!a};function Pb(a,b){Ib.call(this,a,b)}t(Pb,Ib);Pb.prototype.qe=function(){return"-"};Pb.prototype.Ce=function(a){return-a};function Qb(a,b,c){Jb.call(this,a,b,c)}t(Qb,Kb);Qb.prototype.Qa=function(){return"&&"};
Qb.prototype.kb=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Rb(a,b,c){Jb.call(this,a,b,c)}t(Rb,Qb);Rb.prototype.Qa=function(){return" and "};function Sb(a,b,c){Jb.call(this,a,b,c)}t(Sb,Kb);Sb.prototype.Qa=function(){return"||"};Sb.prototype.kb=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Tb(a,b,c){Jb.call(this,a,b,c)}t(Tb,Sb);Tb.prototype.Qa=function(){return", "};function Ub(a,b,c){Jb.call(this,a,b,c)}t(Ub,Lb);Ub.prototype.Qa=function(){return"<"};
Ub.prototype.rb=function(a,b){return a<b};function Vb(a,b,c){Jb.call(this,a,b,c)}t(Vb,Lb);Vb.prototype.Qa=function(){return"<="};Vb.prototype.rb=function(a,b){return a<=b};function Wb(a,b,c){Jb.call(this,a,b,c)}t(Wb,Lb);Wb.prototype.Qa=function(){return">"};Wb.prototype.rb=function(a,b){return a>b};function Xb(a,b,c){Jb.call(this,a,b,c)}t(Xb,Lb);Xb.prototype.Qa=function(){return">="};Xb.prototype.rb=function(a,b){return a>=b};function Yb(a,b,c){Jb.call(this,a,b,c)}t(Yb,Lb);Yb.prototype.Qa=function(){return"=="};
Yb.prototype.rb=function(a,b){return a==b};function Zb(a,b,c){Jb.call(this,a,b,c)}t(Zb,Lb);Zb.prototype.Qa=function(){return"!="};Zb.prototype.rb=function(a,b){return a!=b};function $b(a,b,c){Jb.call(this,a,b,c)}t($b,Mb);$b.prototype.Qa=function(){return"+"};$b.prototype.rb=function(a,b){return a+b};function ac(a,b,c){Jb.call(this,a,b,c)}t(ac,Mb);ac.prototype.Qa=function(){return" - "};ac.prototype.rb=function(a,b){return a-b};function bc(a,b,c){Jb.call(this,a,b,c)}t(bc,Nb);bc.prototype.Qa=function(){return"*"};
bc.prototype.rb=function(a,b){return a*b};function cc(a,b,c){Jb.call(this,a,b,c)}t(cc,Nb);cc.prototype.Qa=function(){return"/"};cc.prototype.rb=function(a,b){return a/b};function dc(a,b,c){Jb.call(this,a,b,c)}t(dc,Nb);dc.prototype.Qa=function(){return"%"};dc.prototype.rb=function(a,b){return a%b};function ec(a,b,c){Gb.call(this,a);this.K=b;this.ga=c.toLowerCase()}t(ec,Gb);ec.prototype.va=function(a){a.append(this.K.toString());a.append(Fa(this.ga))};
ec.prototype.kb=function(a){return this.K*Cb(a,this.ga,!1)};function fc(a,b){Gb.call(this,a);this.f=b}t(fc,Gb);fc.prototype.va=function(a){a.append(this.f)};fc.prototype.kb=function(a){return Db(a,this.b,this.f).evaluate(a)};fc.prototype.ec=function(a,b,c){return a===this||Hb(Db(b,this.b,this.f),a,b,c)};function gc(a,b,c){Gb.call(this,a);this.f=b;this.name=c}t(gc,Gb);gc.prototype.va=function(a){this.f&&a.append("not ");a.append(Fa(this.name))};
gc.prototype.kb=function(a){var b=this.name;a="all"===b||!!a.Y.Be[b];return this.f?!a:a};gc.prototype.ec=function(a,b,c){return a===this||Hb(this.value,a,b,c)};gc.prototype.Ge=function(){return!0};function vb(a,b,c){Gb.call(this,a);this.xc=b;this.Dc=c}t(vb,Gb);vb.prototype.va=function(a){a.append(this.Dc)};vb.prototype.kb=function(a){return this.xc.call(a)};function hc(a,b,c){Gb.call(this,a);this.g=b;this.f=c}t(hc,Gb);
hc.prototype.va=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].va(a,0);a.append(")")};hc.prototype.kb=function(a){return Eb(a,this.b,this.g,this.f,!1).Wa(a,this.f).evaluate(a)};hc.prototype.ec=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Hb(this.f[d],a,b,c))return!0;return Hb(Eb(b,this.b,this.g,this.f,!0),a,b,c)};
hc.prototype.Wa=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Wa(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new hc(this.b,this.g,c)};function ic(a,b,c,d){Gb.call(this,a);this.f=b;this.j=c;this.g=d}t(ic,Gb);ic.prototype.va=function(a,b){0<b&&a.append("(");this.f.va(a,0);a.append("?");this.j.va(a,0);a.append(":");this.g.va(a,0);0<b&&a.append(")")};
ic.prototype.kb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};ic.prototype.ec=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.j,a,b,c)||Hb(this.g,a,b,c)};ic.prototype.Wa=function(a,b){var c=this.f.Wa(a,b),d=this.j.Wa(a,b),e=this.g.Wa(a,b);return c===this.f&&d===this.j&&e===this.g?this:new ic(this.b,c,d,e)};function tb(a,b){Gb.call(this,a);this.f=b}t(tb,Gb);
tb.prototype.va=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ga(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};tb.prototype.kb=function(){return this.f};function jc(a,b,c){Gb.call(this,a);this.name=b;this.value=c}t(jc,Gb);jc.prototype.va=function(a){a.append("(");a.append(Ga(this.name.name));a.append(":");this.value.va(a,0);a.append(")")};
jc.prototype.kb=function(a){return Fb(a,this.name.name,this.value)};jc.prototype.ec=function(a,b,c){return a===this||Hb(this.value,a,b,c)};jc.prototype.Wa=function(a,b){var c=this.value.Wa(a,b);return c===this.value?this:new jc(this.b,this.name,c)};function kc(a,b){Gb.call(this,a);this.index=b}t(kc,Gb);kc.prototype.va=function(a){a.append("$");a.append(this.index.toString())};kc.prototype.Wa=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function lc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Qb(a,b,c)}function x(a,b,c){return b===a.b?c:c===a.b?b:new $b(a,b,c)}function y(a,b,c){return b===a.b?new Pb(a,c):c===a.b?b:new ac(a,b,c)}function mc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new bc(a,b,c)}function nc(a,b,c){return b===a.b?a.b:c===a.f?b:new cc(a,b,c)};var oc={};function pc(){}n=pc.prototype;n.Yb=function(a){for(var b=0;b<a.length;b++)a[b].ba(this)};n.ne=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.oe=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.dd=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Xb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Ic=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Hc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Gc=function(a){return this.Hc(a)};
n.Gd=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Jc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Ab=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Wb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Ib=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Fc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function qc(){}t(qc,pc);n=qc.prototype;
n.Yb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.ba(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.dd=function(a){return a};n.Xb=function(a){return a};n.oe=function(a){return a};n.Ic=function(a){return a};n.Hc=function(a){return a};n.Gc=function(a){return a};n.Gd=function(a){return a};n.Jc=function(a){return a};n.Ab=function(a){var b=this.Yb(a.values);return b===a.values?a:new rc(b)};
n.Wb=function(a){var b=this.Yb(a.values);return b===a.values?a:new sc(b)};n.Ib=function(a){var b=this.Yb(a.values);return b===a.values?a:new tc(a.name,b)};n.Fc=function(a){return a};function uc(){}n=uc.prototype;n.toString=function(){var a=new Da;this.Pa(a,!0);return a.toString()};n.stringValue=function(){var a=new Da;this.Pa(a,!1);return a.toString()};n.ta=function(){throw Error("F_ABSTRACT");};n.Pa=function(a){a.append("[error]")};n.Ee=function(){return!1};n.ic=function(){return!1};n.He=function(){return!1};
n.jf=function(){return!1};n.qd=function(){return!1};function vc(){if(B)throw Error("E_INVALID_CALL");}t(vc,uc);vc.prototype.ta=function(a){return new tb(a,"")};vc.prototype.Pa=function(){};vc.prototype.ba=function(a){return a.ne(this)};var B=new vc;function wc(){if(xc)throw Error("E_INVALID_CALL");}t(wc,uc);wc.prototype.ta=function(a){return new tb(a,"/")};wc.prototype.Pa=function(a){a.append("/")};wc.prototype.ba=function(a){return a.oe(this)};var xc=new wc;function yc(a){this.Dc=a}t(yc,uc);
yc.prototype.ta=function(a){return new tb(a,this.Dc)};yc.prototype.Pa=function(a,b){b?(a.append('"'),a.append(Ga(this.Dc)),a.append('"')):a.append(this.Dc)};yc.prototype.ba=function(a){return a.dd(this)};function zc(a){this.name=a;if(oc[a])throw Error("E_INVALID_CALL");oc[a]=this}t(zc,uc);zc.prototype.ta=function(a){return new tb(a,this.name)};zc.prototype.Pa=function(a,b){b?a.append(Fa(this.name)):a.append(this.name)};zc.prototype.ba=function(a){return a.Xb(this)};zc.prototype.jf=function(){return!0};
function C(a){var b=oc[a];b||(b=new zc(a));return b}function D(a,b){this.K=a;this.ga=b.toLowerCase()}t(D,uc);D.prototype.ta=function(a,b){return this.K?b&&"%"==this.ga?100==this.K?b:new bc(a,b,new tb(a,this.K/100)):new ec(a,this.K,this.ga):a.b};D.prototype.Pa=function(a){a.append(this.K.toString());a.append(this.ga)};D.prototype.ba=function(a){return a.Ic(this)};D.prototype.ic=function(){return!0};function Ac(a){this.K=a}t(Ac,uc);
Ac.prototype.ta=function(a){return this.K?1==this.K?a.f:new tb(a,this.K):a.b};Ac.prototype.Pa=function(a){a.append(this.K.toString())};Ac.prototype.ba=function(a){return a.Hc(this)};Ac.prototype.He=function(){return!0};function Bc(a){this.K=a}t(Bc,Ac);Bc.prototype.ba=function(a){return a.Gc(this)};function Cc(a){this.f=a}t(Cc,uc);Cc.prototype.Pa=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};Cc.prototype.ba=function(a){return a.Gd(this)};
function Dc(a){this.url=a}t(Dc,uc);Dc.prototype.Pa=function(a){a.append('url("');a.append(Ga(this.url));a.append('")')};Dc.prototype.ba=function(a){return a.Jc(this)};function Ec(a,b,c,d){var e=b.length;b[0].Pa(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Pa(a,d)}function rc(a){this.values=a}t(rc,uc);rc.prototype.Pa=function(a,b){Ec(a,this.values," ",b)};rc.prototype.ba=function(a){return a.Ab(this)};rc.prototype.qd=function(){return!0};function sc(a){this.values=a}t(sc,uc);
sc.prototype.Pa=function(a,b){Ec(a,this.values,",",b)};sc.prototype.ba=function(a){return a.Wb(this)};function tc(a,b){this.name=a;this.values=b}t(tc,uc);tc.prototype.Pa=function(a,b){a.append(Fa(this.name));a.append("(");Ec(a,this.values,",",b);a.append(")")};tc.prototype.ba=function(a){return a.Ib(this)};function E(a){this.b=a}t(E,uc);E.prototype.ta=function(){return this.b};E.prototype.Pa=function(a){a.append("-epubx-expr(");this.b.va(a,0);a.append(")")};E.prototype.ba=function(a){return a.Fc(this)};
E.prototype.Ee=function(){return!0};function Hc(a,b){if(a){if(a.ic())return Cb(b,a.ga,!1)*a.K;if(a.He())return a.K}return 0}var Ic=C("absolute"),Jc=C("all"),Kc=C("always"),Lc=C("auto");C("avoid");var Mc=C("block"),Nc=C("block-end"),Oc=C("block-start"),Pc=C("both"),Qc=C("bottom"),Rc=C("border-box"),Sc=C("break-all"),Tc=C("break-word"),Uc=C("crop"),Vc=C("cross");C("column");var Wc=C("exclusive"),Xc=C("false"),Yc=C("fixed"),Zc=C("flex"),$c=C("footnote"),ad=C("footer"),bd=C("header");C("hidden");
var cd=C("horizontal-tb"),dd=C("inherit"),ed=C("inline"),fd=C("inline-block"),gd=C("inline-end"),hd=C("inline-start"),id=C("landscape"),jd=C("left"),kd=C("list-item"),ld=C("ltr");C("manual");var F=C("none"),md=C("normal"),nd=C("oeb-page-foot"),od=C("oeb-page-head"),pd=C("page"),qd=C("relative"),rd=C("right"),sd=C("scale");C("spread");var td=C("static"),ud=C("rtl"),vd=C("table"),wd=C("table-caption"),xd=C("table-cell"),yd=C("table-footer-group"),zd=C("table-header-group");C("table-row");
var Ad=C("top"),Bd=C("transparent"),Cd=C("vertical-lr"),Dd=C("vertical-rl"),Ed=C("visible"),Fd=C("true"),Gd=new D(100,"%"),Hd=new D(100,"vw"),Id=new D(100,"vh"),Jd=new D(0,"px"),Kd={"font-size":1,color:2};function Ld(a,b){return(Kd[a]||Number.MAX_VALUE)-(Kd[b]||Number.MAX_VALUE)};var Md={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Nd={};
function Od(a,b){if(Md[a]){var c=Nd[a];c||(c=Nd[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}function Pd(a){return Nd[a]||[]}ba("vivliostyle.plugin.registerHook",Od);ba("vivliostyle.plugin.removeHook",function(a,b){if(Md[a]){var c=Nd[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Qd=null,Rd=null;function K(a){if(!Qd)throw Error("E_TASK_NO_CONTEXT");Qd.name||(Qd.name=a);var b=Qd;a=new Sd(b,b.top,a);b.top=a;a.b=Td;return a}function L(a){return new Ud(a)}function Vd(a,b,c){a=K(a);a.j=c;try{b(a)}catch(d){Wd(a.f,d,a)}return a.result()}function Xd(a){var b=Yd,c;Qd?c=Qd.f:(c=Rd)||(c=new Zd(new $d));b(c,a,void 0)}var Td=1;function $d(){}$d.prototype.currentTime=function(){return(new Date).valueOf()};function ae(a,b){return setTimeout(a,b)}
function Zd(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new ta;this.b=this.w=null;this.j=!1;this.order=0;Rd||(Rd=this)}
function be(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.w)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.w=c+b;a.b=ae(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<ce(f.b[k],g))k+1<h&&0<ce(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<ce(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.g){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Qd,Qd=m,N(m.top,l.result),Qd=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){v.error(p)}a.j=!1;a.f.length()&&be(a)},b)}}Zd.prototype.jb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<ce(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}be(this)};
function Yd(a,b,c){var d=new de(a,c||"");d.top=new Sd(d,null,"bootstrap");d.top.b=Td;d.top.then(function(){function a(){d.j=!1;for(var a=0;a<d.h.length;a++){var b=d.h[a];try{b()}catch(h){v.error(h)}}}try{b().then(function(b){d.result=b;a()})}catch(f){Wd(d,f),a()}});c=Qd;Qd=d;a.jb(ee(d.top,"bootstrap"));Qd=c;return d}function fe(a){this.f=a;this.order=this.b=0;this.result=null;this.g=!1}function ce(a,b){return b.b-a.b||b.order-a.order}fe.prototype.jb=function(a,b){this.result=a;this.f.f.jb(this,b)};
function de(a,b){this.f=a;this.name=b;this.h=[];this.g=null;this.j=!0;this.b=this.top=this.l=this.result=null}function ge(a,b){a.h.push(b)}de.prototype.join=function(){var a=K("Task.join");if(this.j){var b=ee(a,this),c=this;ge(this,function(){b.jb(c.result)})}else N(a,this.result);return a.result()};
function Wd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&v.error(a.g,"Unhandled exception in task",a.name)}function Ud(a){this.value=a}n=Ud.prototype;n.then=function(a){a(this.value)};n.na=function(a){return a(this.value)};n.Ec=function(a){return new Ud(a)};
n.Ea=function(a){N(a,this.value)};n.Ba=function(){return!1};n.get=function(){return this.value};function he(a){this.b=a}n=he.prototype;n.then=function(a){this.b.then(a)};n.na=function(a){if(this.Ba()){var b=new Sd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Td;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){N(b,a)})});return b.result()}return a(this.b.g)};n.Ec=function(a){return this.Ba()?this.na(function(){return new Ud(a)}):new Ud(a)};
n.Ea=function(a){this.Ba()?this.then(function(b){N(a,b)}):N(a,this.b.g)};n.Ba=function(){return this.b.b==Td};n.get=function(){if(this.Ba())throw Error("Result is pending");return this.b.g};function Sd(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function ie(a){if(!Qd)throw Error("F_TASK_NO_CONTEXT");if(a!==Qd.top)throw Error("F_TASK_NOT_TOP_FRAME");}Sd.prototype.result=function(){return new he(this)};
function N(a,b){ie(a);Qd.g||(a.g=b);a.b=2;var c=a.parent;Qd.top=c;if(a.h){try{a.h(b)}catch(d){Wd(a.f,d,c)}a.b=3}}Sd.prototype.then=function(a){switch(this.b){case Td:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Wd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function je(){var a=K("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(v.debug("-- time slice --"),ee(a).jb(!0)):N(a,!0);return a.result()}function ke(a){var b=K("Frame.sleep");ee(b).jb(!0,a);return b.result()}function le(a){function b(d){try{for(;d;){var e=a();if(e.Ba()){e.then(b);return}e.then(function(a){d=a})}N(c,!0)}catch(f){Wd(c.f,f,c)}}var c=K("Frame.loop");b(!0);return c.result()}
function me(a){var b=Qd;if(!b)throw Error("E_TASK_NO_CONTEXT");return le(function(){var c;do c=new ne(b,b.top),b.top=c,c.b=Td,a(c),c=c.result();while(!c.Ba()&&c.get());return c})}function ee(a,b){ie(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new fe(a.f);a.f.b=c;Qd=null;a.f.l=b||null;return c}function ne(a,b){Sd.call(this,a,b,"loop")}t(ne,Sd);function O(a){N(a,!0)}function P(a){N(a,!1)};function oe(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}oe.prototype.start=function(){if(!this.b){var a=this;this.b=Yd(Qd.f,function(){var b=K("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}N(b,c)});return b.result()},this.name)}};function pe(a,b){a.f?b(a.h):a.g.push(b)}oe.prototype.get=function(){if(this.f)return L(this.h);this.start();return this.b.join()};
function qe(a){if(!a.length)return L(!0);if(1==a.length)return a[0].get().Ec(!0);var b=K("waitForFetches"),c=0;le(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Ec(!0)}return L(!1)}).then(function(){N(b,!0)});return b.result()}
function re(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new oe(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.jb(b?b.type:"timeout"))}var g=K("loadImage"),h=ee(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return g.result()},"loadElement "+b);e.start();return e};function se(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function te(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,se)}function ue(){this.type=0;this.b=!1;this.K=0;this.text="";this.position=0}
function ve(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var we=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];we[NaN]=80;
var xe=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];xe[NaN]=43;
var ye=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];xe[NaN]=43;
var ze=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ze[NaN]=35;
var Ae=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Ae[NaN]=45;
var Be=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Be[NaN]=37;
var Ce=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Ce[NaN]=38;
var De=ve(35,[61,36]),Ee=ve(35,[58,77]),Fe=ve(35,[61,36,124,50]),Ge=ve(35,[38,51]),He=ve(35,[42,54]),Ie=ve(39,[42,55]),Je=ve(54,[42,55,47,56]),Ke=ve(62,[62,56]),Le=ve(35,[61,36,33,70]),Me=ve(62,[45,71]),Ne=ve(63,[45,56]),Oe=ve(76,[9,72,10,72,13,72,32,72]),Pe=ve(39,[39,46,10,72,13,72,92,48]),Qe=ve(39,[34,46,10,72,13,72,92,49]),Re=ve(39,[39,47,10,74,13,74,92,48]),Se=ve(39,[34,47,10,74,13,74,92,49]),Te=ve(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Ue=ve(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Ve=ve(39,[39,68,10,74,13,74,92,75,NaN,67]),We=ve(39,[34,68,10,74,13,74,92,75,NaN,67]),Xe=ve(72,[9,39,10,39,13,39,32,39,41,69]);function Ye(a,b){this.l=b;this.g=15;this.w=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new ue}function Q(a){a.h==a.f&&Ze(a);return a.j[a.f]}function R(a,b){(a.h-a.f&a.g)<=b&&Ze(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function $e(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Ye.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Ze(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new ue;b=a.h;c=d=a.g}for(var e=we,f=a.w,g=a.position,h=a.j,l=0,k=0,m="",p=0,r=!1,q=h[b],z=-9;;){var u=f.charCodeAt(g);switch(e[u]||e[65]){case 72:l=51;m=isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:k=
g++;e=Be;continue;case 3:l=1;k=g++;e=xe;continue;case 4:k=g++;l=31;e=De;continue;case 33:l=2;k=++g;e=Pe;continue;case 34:l=2;k=++g;e=Qe;continue;case 6:k=++g;l=7;e=xe;continue;case 7:k=g++;l=32;e=De;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Ge;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=De;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ze;continue;case 16:k=g++;e=ye;continue;case 78:k=g++;l=9;e=xe;continue;case 17:k=g++;
l=19;e=He;continue;case 18:k=g++;l=18;e=Ee;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Le;continue;case 21:k=g++;l=39;e=De;continue;case 22:k=g++;l=37;e=De;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=xe;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=Oe;continue;case 30:k=g++;l=33;e=De;continue;case 31:k=g++;l=34;e=Fe;continue;case 32:k=g++;l=35;e=De;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=xe;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=Ce;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=Oe;continue;case 45:m=te(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=te(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=Re;continue;
case 49:z=g;g+=2;e=Se;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Te;continue}l=6}break;case 53:m=te(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Te;continue}l=6}break;case 54:e=Ie;g++;continue;case 55:e=Je;g++;continue;case 56:e=we;g++;continue;case 57:e=Ke;g++;continue;case 58:l=5;e=Be;g++;continue;case 59:l=4;e=Ce;g++;continue;case 60:l=1;e=xe;g++;continue;case 61:l=1;e=Oe;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Ue;continue;case 65:k=++g;e=Ve;continue;case 66:k=++g;e=We;continue;case 67:l=8;m=te(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Me;g++;continue;case 71:e=Ne;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=te(f.substring(k,g));g++;e=Xe;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=te(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=Ae;continue;default:e!==we?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}q.type=l;q.b=r;q.K=p;q.text=m;q.position=k;b++;if(b>=c)break;e=we;r=!1;q=h[b&d]}a.position=g;a.h=b&d};function af(a,b,c,d,e){var f=K("ajax"),g=new XMLHttpRequest,h=ee(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,vd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;
else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.vd=bf([c]):l.vd=c:v.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.jb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):(a.match(/file:\/\/.*(\.html$|\.htm$)/)&&g.overrideMimeType("text/html"),g.send(null))}catch(k){v.b(k,
"Error fetching "+a),h.jb(l)}return f.result()}function bf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function cf(a){var b=K("readBlob"),c=new FileReader,d=ee(b,c);c.addEventListener("load",function(){d.jb(c.result)},!1);c.readAsArrayBuffer(a);return b.result()}function df(a,b){this.ha=a;this.type=b;this.h={};this.j={}}
df.prototype.load=function(a,b,c){a=la(a);var d=this.h[a];return"undefined"!=typeof d?L(d):this.fetch(a,b,c).get()};function ef(a,b,c,d){var e=K("fetch");af(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.ha(f,a).then(function(c){delete a.j[b];a.h[b]=c;N(e,c)})});return e.result()}
df.prototype.fetch=function(a,b,c){a=la(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new oe(function(){return ef(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};df.prototype.get=function(a){return this.h[la(a)]};function ff(a){a=a.responseText;return L(a?JSON.parse(a):null)};function gf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Cc(b);if(3==a.length)return new Cc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function hf(a){this.f=a;this.eb="Author"}n=hf.prototype;n.Pc=function(){return null};n.ia=function(){return this.f};n.error=function(){};n.Cc=function(a){this.eb=a};n.Hb=function(){};n.Od=function(){};n.Uc=function(){};n.Vc=function(){};n.Wd=function(){};n.kd=function(){};
n.Lb=function(){};n.Nd=function(){};n.Kd=function(){};n.Sd=function(){};n.zc=function(){};n.zb=function(){};n.zd=function(){};n.Yc=function(){};n.Dd=function(){};n.xd=function(){};n.Cd=function(){};n.Bc=function(){};n.le=function(){};n.qc=function(){};n.yd=function(){};n.Bd=function(){};n.Ad=function(){};n.ad=function(){};n.$c=function(){};n.xa=function(){};n.xb=function(){};n.Mb=function(){};n.Zc=function(){};n.ld=function(){};
function jf(a){switch(a.eb){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function kf(a){switch(a.eb){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function lf(){hf.call(this,null);this.g=[];this.b=null}t(lf,hf);function mf(a,b){a.g.push(a.b);a.b=b}n=lf.prototype;n.Pc=function(){return null};n.ia=function(){return this.b.ia()};n.error=function(a,b){this.b.error(a,b)};
n.Cc=function(a){hf.prototype.Cc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Cc(a)};n.Hb=function(a,b){this.b.Hb(a,b)};n.Od=function(a){this.b.Od(a)};n.Uc=function(a,b){this.b.Uc(a,b)};n.Vc=function(a,b){this.b.Vc(a,b)};n.Wd=function(a){this.b.Wd(a)};n.kd=function(a,b,c,d){this.b.kd(a,b,c,d)};n.Lb=function(){this.b.Lb()};n.Nd=function(){this.b.Nd()};n.Kd=function(){this.b.Kd()};n.Sd=function(){this.b.Sd()};n.zc=function(){this.b.zc()};n.zb=function(){this.b.zb()};n.zd=function(){this.b.zd()};
n.Yc=function(a){this.b.Yc(a)};n.Dd=function(){this.b.Dd()};n.xd=function(){this.b.xd()};n.Cd=function(){this.b.Cd()};n.Bc=function(){this.b.Bc()};n.le=function(a){this.b.le(a)};n.qc=function(a){this.b.qc(a)};n.yd=function(a){this.b.yd(a)};n.Bd=function(){this.b.Bd()};n.Ad=function(a,b,c){this.b.Ad(a,b,c)};n.ad=function(a,b,c){this.b.ad(a,b,c)};n.$c=function(a,b,c){this.b.$c(a,b,c)};n.xa=function(){this.b.xa()};n.xb=function(a,b,c){this.b.xb(a,b,c)};n.Mb=function(){this.b.Mb()};n.Zc=function(a){this.b.Zc(a)};
n.ld=function(){this.b.ld()};function nf(a,b,c){hf.call(this,a);this.J=c;this.I=0;if(this.ma=b)this.eb=b.eb}t(nf,hf);nf.prototype.Pc=function(){return this.ma.Pc()};nf.prototype.error=function(a){v.b(a)};nf.prototype.xa=function(){this.I++};nf.prototype.Mb=function(){if(!--this.I&&!this.J){var a=this.ma;a.b=a.g.pop()}};function of(a,b,c){nf.call(this,a,b,c)}t(of,nf);function pf(a,b){a.error(b,a.Pc())}function qf(a,b){pf(a,b);mf(a.ma,new nf(a.f,a.ma,!1))}n=of.prototype;n.zb=function(){qf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.zd=function(){qf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.Yc=function(){qf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.Dd=function(){qf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.xd=function(){qf(this,"E_CSS_UNEXPECTED_DEFINE")};n.Cd=function(){qf(this,"E_CSS_UNEXPECTED_REGION")};n.Bc=function(){qf(this,"E_CSS_UNEXPECTED_PAGE")};n.qc=function(){qf(this,"E_CSS_UNEXPECTED_WHEN")};n.yd=function(){qf(this,"E_CSS_UNEXPECTED_FLOW")};n.Bd=function(){qf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Ad=function(){qf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.ad=function(){qf(this,"E_CSS_UNEXPECTED_PARTITION")};n.$c=function(){qf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.Zc=function(){qf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.ld=function(){qf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.xb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Pc())};var rf=[],sf=[],T=[],tf=[],uf=[],vf=[],wf=[],xf=[],yf=[],zf=[],Af=[],Bf=[],Cf=[];rf[1]=28;rf[36]=29;rf[7]=29;rf[9]=29;rf[14]=29;rf[18]=29;rf[20]=30;rf[13]=27;rf[0]=200;sf[1]=46;sf[0]=200;vf[1]=2;
vf[36]=4;vf[7]=6;vf[9]=8;vf[14]=10;vf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;tf[1]=1;tf[36]=3;tf[7]=5;tf[9]=7;tf[14]=9;tf[11]=200;tf[18]=55;uf[1]=2;uf[36]=4;uf[7]=6;uf[9]=8;uf[18]=14;uf[50]=42;uf[14]=10;uf[12]=13;wf[1]=15;wf[7]=16;wf[4]=17;wf[5]=18;wf[3]=19;wf[2]=20;wf[8]=21;wf[16]=22;wf[19]=23;wf[6]=24;wf[11]=25;wf[17]=26;wf[13]=48;wf[31]=47;wf[23]=54;wf[0]=44;xf[1]=31;xf[4]=32;xf[5]=32;xf[3]=33;xf[2]=34;xf[10]=40;xf[6]=38;
xf[31]=36;xf[24]=36;xf[32]=35;yf[1]=45;yf[16]=37;yf[37]=37;yf[38]=37;yf[47]=37;yf[48]=37;yf[39]=37;yf[49]=37;yf[26]=37;yf[25]=37;yf[23]=37;yf[24]=37;yf[19]=37;yf[21]=37;yf[36]=37;yf[18]=37;yf[22]=37;yf[11]=39;yf[12]=43;yf[17]=49;zf[0]=200;zf[12]=50;zf[13]=51;zf[14]=50;zf[15]=51;zf[10]=50;zf[11]=51;zf[17]=53;Af[0]=200;Af[12]=50;Af[13]=52;Af[14]=50;Af[15]=51;Af[10]=50;Af[11]=51;Af[17]=53;Bf[0]=200;Bf[12]=50;Bf[13]=51;Bf[14]=50;Bf[15]=51;Bf[10]=50;Bf[11]=51;Cf[11]=0;Cf[16]=0;Cf[22]=1;Cf[18]=1;
Cf[26]=2;Cf[25]=2;Cf[38]=3;Cf[37]=3;Cf[48]=3;Cf[47]=3;Cf[39]=3;Cf[49]=3;Cf[41]=3;Cf[23]=4;Cf[24]=4;Cf[36]=5;Cf[19]=5;Cf[21]=5;Cf[0]=6;Cf[52]=2;function Df(a,b,c,d){this.b=a;this.f=b;this.w=c;this.Z=d;this.G=[];this.O={};this.g=this.I=null;this.D=!1;this.j=2;this.result=null;this.H=!1;this.C=this.J=null;this.l=[];this.h=[];this.U=this.X=!1}function Ef(a,b){for(var c=[],d=a.G;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Ff(a,b,c){var d=a.G,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new rc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.w.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Af,null;a=new tc(d[e-1],Ef(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.w.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Af,null):1<
g?new sc(Ef(a,e+1)):d[0]}function Gf(a,b,c){a.b=a.g?Af:zf;a.w.error(b,c)}
function Hf(a,b,c){for(var d=a.G,e=a.w,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Tb(e.ia(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new hc(e.ia(),qb(f,b),g);b=0;continue}}if(10==h){f.Ge()&&(f=new jc(e.ia(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Ob(e.ia(),f);else if(-24==h)f=new Pb(e.ia(),
f);else return Gf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Cf[b]>Cf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Qb(e.ia(),g,f);break;case 52:f=new Rb(e.ia(),g,f);break;case 25:f=new Sb(e.ia(),g,f);break;case 38:f=new Ub(e.ia(),g,f);break;case 37:f=new Wb(e.ia(),g,f);break;case 48:f=new Vb(e.ia(),g,f);break;case 47:f=new Xb(e.ia(),g,f);break;case 39:case 49:f=new Yb(e.ia(),g,f);break;case 41:f=new Zb(e.ia(),g,f);break;case 23:f=new $b(e.ia(),g,f);break;case 24:f=new ac(e.ia(),g,f);break;case 36:f=
new bc(e.ia(),g,f);break;case 19:f=new cc(e.ia(),g,f);break;case 21:f=new dc(e.ia(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ic(e.ia(),d.pop(),g,f);break;case 10:if(g.Ge())f=new jc(e.ia(),g,f);else return Gf(a,"E_CSS_MEDIA_TEST",c),!1}else return Gf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Gf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Gf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function If(a){for(var b=[];;){var c=Q(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.K);break;default:return b}S(a.f)}}
function Jf(a){var b=!1,c=Q(a.f);if(23===c.type)b=!0,S(a.f),c=Q(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.K)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.K);var d=0;S(a.f);var c=Q(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=Q(a.f));if(5===c.type){d=c.K;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.K),S(a.f),c=Q(a.f),5===c.type&&!(0>c.K||1/c.K===1/-0))return S(a.f),[b,c.K]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.K:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.K))return S(a.f),[0,c.K]}return null}
function Kf(a,b,c){a=a.w.ia();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=lc(a,c,new Ob(a,new fc(a,"pref-horizontal")));break;case "horizontal":c=lc(a,c,new fc(a,"pref-horizontal"));break;case "day":c=lc(a,c,new Ob(a,new fc(a,"pref-night-mode")));break;case "night":c=lc(a,c,new fc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function Lf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Mf(a,b,c,d,e,f){var g=a.w,h=a.f,l=a.G,k,m,p,r;e&&(a.j=2,a.G.push("{"));a:for(;0<b;--b)switch(k=Q(h),a.b[k.type]){case 28:if(18!=R(h,1).type){Lf(a)?(g.error("E_CSS_COLON_EXPECTED",R(h,1)),a.b=Af):(a.b=vf,g.zb());continue}m=R(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.D=!1;S(h);S(h);a.b=wf;l.splice(0,l.length);continue;case 46:if(18!=R(h,1).type){a.b=Af;g.error("E_CSS_COLON_EXPECTED",R(h,1));continue}a.g=k.text;a.D=!1;S(h);S(h);
a.b=wf;l.splice(0,l.length);continue;case 29:a.b=vf;g.zb();continue;case 1:if(!k.b){a.b=Bf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.Lb();case 2:if(34==R(h,1).type)if(S(h),S(h),p=a.O[k.text],null!=p)switch(k=Q(h),k.type){case 1:g.Hb(p,k.text);a.b=f?tf:T;S(h);break;case 36:g.Hb(p,null);a.b=f?tf:T;S(h);break;default:a.b=zf,g.error("E_CSS_NAMESPACE",k)}else a.b=zf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Hb(a.I,k.text),a.b=f?tf:T,S(h);continue;case 3:if(!k.b){a.b=Bf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.Lb();case 4:if(34==R(h,1).type)switch(S(h),S(h),k=Q(h),k.type){case 1:g.Hb(null,k.text);a.b=f?tf:T;S(h);break;case 36:g.Hb(null,null);a.b=f?tf:T;S(h);break;default:a.b=zf,g.error("E_CSS_NAMESPACE",k)}else g.Hb(a.I,null),a.b=f?tf:T,S(h);continue;case 5:k.b&&g.Lb();case 6:g.Wd(k.text);a.b=f?tf:T;S(h);continue;case 7:k.b&&g.Lb();case 8:g.Od(k.text);a.b=f?tf:T;S(h);continue;case 55:k.b&&g.Lb();case 14:S(h);k=Q(h);b:switch(k.type){case 1:g.Uc(k.text,null);S(h);a.b=f?tf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=vf;g.Zc("not");Mf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=Bf;break a;case "lang":case "href-epub-type":if(k=Q(h),1===k.type){p=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Jf(a))break;else break b;default:p=If(a)}k=Q(h);if(11==k.type){g.Uc(m,p);S(h);a.b=f?tf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=zf;continue;case 42:S(h);k=Q(h);switch(k.type){case 1:g.Vc(k.text,
null);a.b=f?tf:T;S(h);continue;case 6:if(m=k.text,S(h),p=If(a),k=Q(h),11==k.type){g.Vc(m,p);a.b=f?tf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=zf;continue;case 9:k.b&&g.Lb();case 10:S(h);k=Q(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=Bf;g.error("E_CSS_ATTR",k);S(h);continue}k=Q(h);if(34==k.type){p=m?a.O[m]:m;if(null==p){a.b=Bf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=Q(h);if(1!=k.type){a.b=Bf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;S(h);k=Q(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:r=k.type;S(h);k=Q(h);break;case 15:g.kd(p,m,0,null);a.b=f?tf:T;S(h);continue;default:a.b=Bf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.kd(p,m,r,k.text);S(h);k=Q(h);break;default:a.b=Bf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Bf;g.error("E_CSS_ATTR",k);continue}a.b=f?tf:T;S(h);continue;case 11:g.Nd();a.b=uf;S(h);continue;case 12:g.Kd();
a.b=uf;S(h);continue;case 56:g.Sd();a.b=uf;S(h);continue;case 13:a.X?(a.h.push("-epubx-region"),a.X=!1):a.U?(a.h.push("page"),a.U=!1):a.h.push("[selector]");g.xa();a.b=rf;S(h);continue;case 41:g.zc();a.b=vf;S(h);continue;case 15:l.push(C(k.text));S(h);continue;case 16:try{l.push(gf(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=zf}S(h);continue;case 17:l.push(new Ac(k.K));S(h);continue;case 18:l.push(new Bc(k.K));S(h);continue;case 19:l.push(new D(k.K,k.text));S(h);continue;case 20:l.push(new yc(k.text));
S(h);continue;case 21:l.push(new Dc(oa(k.text,a.Z)));S(h);continue;case 22:Ff(a,",",k);l.push(",");S(h);continue;case 23:l.push(xc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=xf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Ff(a,")",k);S(h);continue;case 47:S(h);k=Q(h);m=R(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){S(h);a.D=!0;continue}Gf(a,"E_CSS_SYNTAX",k);continue;case 54:m=R(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);
continue}}a.b===wf&&0<=h.b?($e(h),a.b=vf,g.zb()):Gf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Ff(a,";",k))&&a.g&&g.xb(a.g,m,a.D);a.b=d?sf:rf;continue;case 44:S(h);h.b=-1;m=Ff(a,";",k);if(c)return a.result=m,!0;a.g&&m&&g.xb(a.g,m,a.D);if(d)return!0;Gf(a,"E_CSS_SYNTAX",k);continue;case 31:m=R(h,1);9==m.type?(10!=R(h,2).type||R(h,2).b?(l.push(new fc(g.ia(),qb(k.text,m.text))),a.b=yf):(l.push(k.text,m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new gc(g.ia(),
!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new gc(g.ia(),!1,k.text))):l.push(new fc(g.ia(),k.text)),a.b=yf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new tb(g.ia(),k.K));S(h);a.b=yf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new ec(g.ia(),k.K,m));S(h);a.b=yf;continue;case 34:l.push(new tb(g.ia(),k.text));S(h);a.b=yf;continue;case 35:S(h);k=Q(h);5!=k.type||k.b?Gf(a,"E_CSS_SYNTAX",k):(l.push(new kc(g.ia(),
k.K)),S(h),a.b=yf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=xf;Hf(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=xf,Hf(a,52,k),l.push(52),S(h)):Gf(a,"E_CSS_SYNTAX",k);continue;case 39:Hf(a,k.type,k)&&(a.g?a.b=wf:Gf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:Hf(a,11,k)&&(a.g||3==a.j?Gf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.qc(l.pop()):(k=l.pop(),g.qc(k)),a.h.push("media"),g.xa(),a.b=rf));S(h);continue;case 49:if(Hf(a,11,k))if(a.g||3!=a.j)Gf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.C=l.pop(),a.H=!0,a.b=rf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=rf;S(h);g.Mb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=Q(h);if(2==k.type||8==k.type){a.J=k.text;S(h);k=Q(h);if(17==k.type||0==k.type)return a.H=!0,S(h),!1;a.g=null;a.j=3;a.b=xf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=zf;continue;case "namespace":S(h);k=Q(h);switch(k.type){case 1:m=k.text;S(h);
k=Q(h);if((2==k.type||8==k.type)&&17==R(h,1).type){a.O[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==R(h,1).type){a.I=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=zf;continue;case "charset":S(h);k=Q(h);if(2==k.type&&17==R(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=zf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
R(h,1).type){S(h);S(h);switch(m){case "font-face":g.zd();break;case "-epubx-page-template":g.Bd();break;case "-epubx-define":g.xd();break;case "-epubx-viewport":g.Dd()}a.h.push(m);g.xa();continue}break;case "-adapt-footnote-area":S(h);k=Q(h);switch(k.type){case 12:S(h);g.Yc(null);a.h.push(m);g.xa();continue;case 50:if(S(h),k=Q(h),1==k.type&&12==R(h,1).type){m=k.text;S(h);S(h);g.Yc(m);a.h.push("-adapt-footnote-area");g.xa();continue}}break;case "-epubx-region":S(h);g.Cd();a.X=!0;a.b=vf;continue;case "page":S(h);
g.Bc();a.U=!0;a.b=uf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k=Q(h);if(12==k.type){S(h);g.le(m);a.h.push(m);g.xa();continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=xf;l.push("{");continue;case "media":S(h);
a.g=null;a.j=2;a.b=xf;l.push("{");continue;case "-epubx-flow":if(1==R(h,1).type&&12==R(h,2).type){g.yd(R(h,1).text);S(h);S(h);S(h);a.h.push(m);g.xa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=Q(h);r=p=null;var q=[];1==k.type&&(p=k.text,S(h),k=Q(h));18==k.type&&1==R(h,1).type&&(r=R(h,1).text,S(h),S(h),k=Q(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==R(h,1).type&&11==R(h,2).type;)q.push(R(h,1).text),S(h),S(h),S(h),k=Q(h);if(12==k.type){S(h);
switch(m){case "-epubx-page-master":g.Ad(p,r,q);break;case "-epubx-partition":g.ad(p,r,q);break;case "-epubx-partition-group":g.$c(p,r,q)}a.h.push(m);g.xa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Bf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=zf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=zf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=rf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();
a.l.length||13!=k.type||(a.b=rf);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=rf);S(h);continue;case 200:return f&&(S(h),g.ld()),!0;default:if(c||d)return!0;if(e)return Hf(a,11,k)?(a.result=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===wf&&0<=h.b?($e(h),a.b=vf,g.zb()):a.b!==zf&&a.b!==Bf&&a.b!==Af?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=Lf(a)?Af:Bf):S(h)}return!1}function Nf(a){hf.call(this,null);this.f=a}t(Nf,hf);
Nf.prototype.error=function(a){throw Error(a);};Nf.prototype.ia=function(){return this.f};
function Of(a,b,c,d,e){var f=K("parseStylesheet"),g=new Df(rf,a,b,c),h=null;e&&(h=Pf(new Ye(e,b),b,c));if(h=Kf(g,d,h&&h.ta()))b.qc(h),b.xa();le(function(){for(;!Mf(g,100,!1,!1,!1,!1);){if(g.H){var a=oa(g.J,c);g.C&&(b.qc(g.C),b.xa());var d=K("parseStylesheet.import");Qf(a,b,null,null).then(function(){g.C&&b.Mb();g.H=!1;g.J=null;g.C=null;N(d,!0)});return d.result()}a=je();if(a.Ba)return a}return L(!1)}).then(function(){h&&b.Mb();N(f,!0)});return f.result()}
function Rf(a,b,c,d,e){return Vd("parseStylesheetFromText",function(f){var g=new Ye(a,b);Of(g,b,c,d,e).Ea(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);N(b,!1)})}function Qf(a,b,c,d){return Vd("parseStylesheetFromURL",function(e){af(a).then(function(f){f.responseText?Rf(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);N(e,!0)}):N(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);N(b,!0)})}
function Sf(a,b){var c=new Df(wf,b,new Nf(a),"");Mf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result}function Pf(a,b,c){a=new Df(xf,a,b,c);Mf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result}var Tf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Uf(a,b,c){if(b.Ee())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Tf[c]?a==Math.round(a)?new Bc(a):new Ac(a):new D(a,"px");break a;case "string":c=a?Sf(b.b,new Ye(a,null)):B;break a;case "boolean":c=a?Fd:Xc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Vf(a,b,c,d){this.V=a;this.S=b;this.T=c;this.P=d}function Wf(a,b){this.f=a;this.b=b}function Xf(){this.bottom=this.right=this.top=this.left=0}function Yf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Zf(a,b,c,d){this.S=a;this.P=b;this.V=c;this.T=d;this.right=this.left=null}function $f(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function ag(a){this.b=a}function bg(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Yf(e,g,1,c):new Yf(g,e,-1,c));e=g}}
function cg(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Wf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new ag(e)}function dg(a,b,c,d){return new ag([new Wf(a,b),new Wf(c,b),new Wf(c,d),new Wf(a,d)])}function eg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function fg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function gg(a,b,c,d){var e,f;b.f.b<c&&v.b("Error: inconsistent segment (1)");b.b.b<=c?(c=fg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=fg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new eg(c,e,b.g,-1)),a.push(new eg(d,f,b.g,1))):(a.push(new eg(d,f,b.g,-1)),a.push(new eg(c,e,b.g,1)))}
function hg(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function ig(a,b){return b?Math.ceil(a/b)*b:a}function jg(a,b){return b?Math.floor(a/b)*b:a}function kg(a){return new Wf(a.b,-a.f)}function lg(a){return new Vf(a.S,-a.T,a.P,-a.V)}
function mg(a){return new Vf(-a.P,a.V,-a.S,a.T)}function ng(a){return new ag(Ra(a.b,kg))}
function og(a,b,c,d,e){e&&(a=lg(a),b=Ra(b,ng),c=Ra(c,ng));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)bg(b[l],h,l);for(l=0;l<f;l++)bg(c[l],h,l+e);b=h.length;h.sort($f);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.S&&g.push(new Zf(a.S,c,a.T,a.T));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var r=a.P,q=Math.min(ig(Math.ceil(c+8),d),a.P);for(k=0;k<p.length&&r>q;k++)m=p[k],m.b.f==m.f.f?m.f.b<r&&(r=Math.max(jg(m.f.b,d),q)):m.b.f!=m.f.f&&(r=q);r>a.P&&(r=
a.P);for(;l<b&&(m=h[l]).b.b<r;)if(m.f.b<c)l++;else if(m.b.b<q){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),r=q;l++}else{k=jg(m.b.b,d);k<r&&(r=k);break}q=[];for(k=0;k<p.length;k++)gg(q,p[k],c,r);q.sort(function(a,b){return a.f-b.f||a.g-b.g});q=hg(q,e,f);if(q.length){var z=0,u=a.V;for(k=0;k<q.length;k+=2){var A=Math.max(a.V,q[k]),H=Math.min(a.T,q[k+1])-A;H>z&&(z=H,u=A)}z?g.push(new Zf(c,r,Math.max(u,a.V),Math.min(u+z,a.T))):g.push(new Zf(c,r,a.T,a.T))}else g.push(new Zf(c,r,a.T,a.T));if(r==a.P)break;c=r;for(k=
p.length-1;0<=k;k--)p[k].f.b<=r&&p.splice(k,1)}pg(a,g);return g}function pg(a,b){for(var c=b.length-1,d=new Zf(a.P,a.P,a.V,a.T);0<=c;){var e=d,d=b[c];if(1>d.P-d.S||d.V==e.V&&d.T==e.T)e.S=d.S,b.splice(c,1),d=e;c--}}function qg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function rg(a,b){if(!a.length)return b;for(var c=b.S,d,e=0;e<a.length&&!(d=a[e],d.P>b.S&&d.V-.1<=b.V&&d.T+.1>=b.T);e++)c=Math.max(c,d.P);for(var f=c;e<a.length&&!(d=a[e],d.S>=b.P||d.V-.1>b.V||d.T+.1<b.T);e++)f=d.P;f=e===a.length?b.P:Math.min(f,b.P);return f<=c?null:new Vf(b.V,c,b.T,f)}
function sg(a,b){if(!a.length)return b;for(var c=b.P,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.P<b.P)&&!(d.S<b.P&&d.V-.1<=b.V&&d.T+.1>=b.T);e--)c=Math.min(c,d.S);for(var f=Math.min(c,d.P);0<=e&&!(d=a[e],d.P<=b.S||d.V-.1>b.V||d.T+.1<b.T);e--)f=d.S;f=Math.max(f,b.S);return c<=f?null:new Vf(b.V,f,b.T,c)};function tg(){this.b={}}t(tg,pc);tg.prototype.Xb=function(a){this.b[a.name]=!0;return a};tg.prototype.Ab=function(a){this.Yb(a.values);return a};function ug(a){this.value=a}t(ug,pc);ug.prototype.Gc=function(a){this.value=a.K;return a};function vg(a,b){if(a){var c=new ug(b);try{return a.ba(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function wg(){this.f=!1;this.b=[];this.name=null}t(wg,pc);wg.prototype.Ic=function(a){this.f&&this.b.push(a);return null};
wg.prototype.Hc=function(a){this.f&&!a.K&&this.b.push(new D(0,"px"));return null};wg.prototype.Ab=function(a){this.Yb(a.values);return null};wg.prototype.Ib=function(a){this.f||(this.f=!0,this.Yb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function xg(a,b,c,d,e,f){if(a){var g=new wg;try{a.ba(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ga){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.K*m/100)}else a.push(k.K*Cb(f,k.ga,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Wf(b+a[g],c+a[g+1]));h=new ag(f);break a}break;case "rectangle":if(4==a.length){h=dg(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=cg(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=cg(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){v.b(p,"toShape:")}}return dg(b,c,b+d,c+e)}function yg(a){this.f=a;this.b={};this.name=null}t(yg,pc);yg.prototype.Xb=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};yg.prototype.Gc=function(a){this.name&&(this.b[this.name]+=a.K-(this.f?0:1));return a};yg.prototype.Ab=function(a){this.Yb(a.values);return a};
function zg(a,b){var c=new yg(b);try{a.ba(c)}catch(d){v.b(d,"toCounters:")}return c.b}function Ag(a,b){this.b=a;this.f=b}t(Ag,qc);Ag.prototype.Jc=function(a){return new Dc(this.f.cd(a.url,this.b))};function Bg(a){this.g=this.h=null;this.f=0;this.b=a}function Cg(a,b){this.b=-1;this.f=a;this.g=b}function Dg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}Dg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
Dg.prototype.clone=function(){for(var a=new Dg,b=0;b<this.b.length;b++){var c=this.b[b],d=new Bg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new Cg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function Eg(a,b,c,d){var e=a.b.length,f=new Bg(Fg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new Cg(e,!0);e=new Cg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function Gg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof Hg}
function Ig(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&Gg(b)&&Gg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new Hg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function Jg(){}t(Jg,pc);Jg.prototype.h=function(a,b){var c=a[b].ba(this);return c?[c]:null};function Hg(a,b,c){this.b=a;this.f=b;this.g=c}t(Hg,Jg);n=Hg.prototype;n.ne=function(a){return this.b&1?a:null};
n.oe=function(a){return this.b&2048?a:null};n.dd=function(a){return this.b&2?a:null};n.Xb=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Ic=function(a){return a.K||this.b&512?0>a.K&&!(this.b&256)?null:this.g[a.ga]?a:null:"%"==a.ga&&this.b&1024?a:null};n.Hc=function(a){return a.K?0>=a.K&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.Gc=function(a){return a.K?0>=a.K&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.K])?a:null:this.b&512?a:null};
n.Gd=function(a){return this.b&64?a:null};n.Jc=function(a){return this.b&128?a:null};n.Ab=function(){return null};n.Wb=function(){return null};n.Ib=function(){return null};n.Fc=function(){return null};var Fg=new Hg(0,U,U);
function Kg(a){this.b=new Bg(null);var b=this.g=new Bg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(Kg,Jg);
function Lg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Mg&&a instanceof Mg){if(m=(new rc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Ng&&a instanceof Mg){if(m=(new sc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else m=
k.ba(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Kg.prototype;n.pb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.ba(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};n.ne=function(a){return this.pb(a)};n.oe=function(a){return this.pb(a)};n.dd=function(a){return this.pb(a)};n.Xb=function(a){return this.pb(a)};n.Ic=function(a){return this.pb(a)};n.Hc=function(a){return this.pb(a)};
n.Gc=function(a){return this.pb(a)};n.Gd=function(a){return this.pb(a)};n.Jc=function(a){return this.pb(a)};n.Ab=function(){return null};n.Wb=function(){return null};n.Ib=function(a){return this.pb(a)};n.Fc=function(){return null};function Mg(a){Kg.call(this,a)}t(Mg,Kg);Mg.prototype.Ab=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new rc(b):null};
Mg.prototype.Wb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Ng){c=!0;break}b=b.g}return c?(b=Lg(this,a.values,!1,0),b===a.values?a:b?new sc(b):null):null};Mg.prototype.h=function(a,b){return Lg(this,a,!0,b)};function Ng(a){Kg.call(this,a)}t(Ng,Kg);Ng.prototype.Ab=function(a){return this.pb(a)};Ng.prototype.Wb=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new sc(b):null};Ng.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Og(a,b){Kg.call(this,b);this.name=a}t(Og,Kg);Og.prototype.pb=function(){return null};Og.prototype.Ib=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new tc(a.name,b):null};function Pg(){}Pg.prototype.b=function(a,b){return b};Pg.prototype.g=function(){};function Qg(a,b){this.name=b;this.h=a.g[this.name]}t(Qg,Pg);
Qg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new rc(a):a[0],c);return b+d}return b};Qg.prototype.g=function(a,b){b.values[this.name]=a};function Rg(a,b){Qg.call(this,a,b[0]);this.f=b}t(Rg,Qg);Rg.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Sg(a,b){this.f=a;this.Me=b}t(Sg,Pg);
Sg.prototype.b=function(a,b,c){var d=b;if(this.Me)if(a[b]==xc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Tg(){this.b=this.nb=null;this.error=!1;this.values={};this.f=null}n=Tg.prototype;n.clone=function(){var a=new this.constructor;a.nb=this.nb;a.b=this.b;a.f=this.f;return a};n.pe=function(a,b){this.nb=a;this.b=b};n.sc=function(){this.error=!0;return 0};
function Ug(a,b){a.sc([b]);return null}n.ne=function(a){return Ug(this,a)};n.dd=function(a){return Ug(this,a)};n.Xb=function(a){return Ug(this,a)};n.Ic=function(a){return Ug(this,a)};n.Hc=function(a){return Ug(this,a)};n.Gc=function(a){return Ug(this,a)};n.Gd=function(a){return Ug(this,a)};n.Jc=function(a){return Ug(this,a)};n.Ab=function(a){this.sc(a.values);return null};n.Wb=function(){this.error=!0;return null};n.Ib=function(a){return Ug(this,a)};n.Fc=function(){this.error=!0;return null};
function Vg(){Tg.call(this)}t(Vg,Tg);Vg.prototype.sc=function(a){for(var b=0,c=0;b<a.length;){var d=this.nb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.nb.length){this.error=!0;break}}return b};function Wg(){Tg.call(this)}t(Wg,Tg);Wg.prototype.sc=function(a){if(a.length>this.nb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.nb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.nb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Xg(){Tg.call(this)}t(Xg,Tg);
Xg.prototype.sc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===xc){b=c;break}if(b>this.nb.length||!a.length)return this.error=!0,0;for(c=0;c<this.nb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.nb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Yg(){Tg.call(this)}t(Yg,Vg);
Yg.prototype.Wb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof sc)this.error=!0;else{a.values[c].ba(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new sc(b[k]);return null};
function Zg(){Tg.call(this)}t(Zg,Vg);Zg.prototype.pe=function(a,b){Vg.prototype.pe.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Zg.prototype.sc=function(a){var b=Vg.prototype.sc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].ba(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===xc){b++;if(b+2>a.length||!a[b].ba(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new rc(a.slice(b,a.length));if(!d.ba(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Zg.prototype.Wb=function(a){a.values[0].ba(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new sc(b);a.ba(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Zg.prototype.Xb=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var $g={SIMPLE:Vg,INSETS:Wg,INSETS_SLASH:Xg,COMMA:Yg,FONT:Zg};
function ah(){this.g={};this.C={};this.l={};this.b={};this.f={};this.h={};this.w=[];this.j=[]}function bh(a,b){var c;if(3==b.type)c=new D(b.K,b.text);else if(7==b.type)c=gf(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(Gg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function ch(a,b,c){for(var d=new Dg,e=0;e<b;e++)Ig(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Ig(d,a,3);else for(e=b;e<c;e++)Ig(d,a.clone(),2);return d}function dh(a){var b=new Dg,c=b.b.length;b.b.push(new Bg(a));a=new Cg(c,!0);var d=new Cg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function eh(a,b){var c;switch(a){case "COMMA":c=new Ng(b);break;case "SPACE":c=new Mg(b);break;default:c=new Og(a.toLowerCase(),b)}return dh(c)}
function fh(a){a.b.HASHCOLOR=dh(new Hg(64,U,U));a.b.POS_INT=dh(new Hg(32,U,U));a.b.POS_NUM=dh(new Hg(16,U,U));a.b.POS_PERCENTAGE=dh(new Hg(8,U,{"%":B}));a.b.NEGATIVE=dh(new Hg(256,U,U));a.b.ZERO=dh(new Hg(512,U,U));a.b.ZERO_PERCENTAGE=dh(new Hg(1024,U,U));a.b.POS_LENGTH=dh(new Hg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=dh(new Hg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=dh(new Hg(8,U,{s:B,ms:B}));a.b.FREQUENCY=dh(new Hg(8,U,{Hz:B,
kHz:B}));a.b.RESOLUTION=dh(new Hg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI=dh(new Hg(128,U,U));a.b.IDENT=dh(new Hg(4,U,U));a.b.STRING=dh(new Hg(2,U,U));a.b.SLASH=dh(new Hg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function gh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function hh(a,b,c){var d=Q(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=Q(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=Q(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=Q(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=Q(b).type)throw Error("'=' expected");gh(d)||(a.C[d]=e)}else if(18!=Q(b).type)throw Error("':' expected");return d}
function ih(a,b){for(;;){var c=hh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new Dg;if("||"==b){for(b=0;b<c.length;b++){var e=new Dg,g=e;if(g.b.length)throw Error("invalid call");var h=new Bg(Fg);h.f=2*b+1;g.b.push(h);var h=new Cg(0,!0),k=new Cg(0,!1);g.g.push(g.f.length);g.f.push(k);g.match.push(g.f.length);g.f.push(h);Ig(e,c[b],1);Eg(e,e.match,!1,b);Ig(a,e,b?4:1)}c=new Dg;if(c.b.length)throw Error("invalid call");
Eg(c,c.match,!0,-1);Ig(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)Eg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Ig(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(S(b),g=Q(b),g.type){case 1:h||k(" ");if(gh(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text.toLowerCase()]=C(g.text),d.push(dh(new Hg(0,p,U)));h=!1;break;case 5:p={};p[""+g.K]=new Bc(g.K);d.push(dh(new Hg(0,p,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({Pe:d,Ke:f,Lc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({Pe:d,Ke:f,Lc:"(",xc:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.Lc)throw Error("']' unexpected");d=p.Pe;d.push(g);f=p.Ke;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.Lc)throw Error("')' unexpected");
d=p.Pe;d.push(eh(p.xc,g));f=p.Ke;h=!1;break;case 18:if(h)throw Error("':' unexpected");S(b);d.push(bh(d.pop(),Q(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(ch(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(ch(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(ch(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);g=Q(b);if(5!=g.type)throw Error("<int> expected");var r=p=g.K;S(b);g=Q(b);if(16==g.type){S(b);g=Q(b);
if(5!=g.type)throw Error("<int> expected");r=g.K;S(b);g=Q(b)}if(13!=g.type)throw Error("'}' expected");d.push(ch(d.pop(),p,r));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().Lc+"'");break;default:throw Error("unexpected token");}S(b);gh(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Mg(m):m.b[0].b}}
function jh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:v.b("Unknown property in makePropSet:",g)}return c}
function kh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.C[b])&&h[f])if(f=a.g[b])(a=c===dd||c.Ee()?c:c.ba(f))?e.yb(b,a,d):e.Qc(g,c);else if(b=a.h[b].clone(),c===dd)for(c=0;c<b.b.length;c++)e.yb(b.b[c],dd,d);else{c.ba(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.yb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.Qc(g,c)}else e.Ed(g,c)}
var lh=new oe(function(){var a=K("loadValidatorSet.load"),b=oa("validation.txt",na),c=af(b),d=new ah;fh(d);c.then(function(c){try{if(c.responseText){var e=new Ye(c.responseText,null);for(ih(d,e);;){var g=hh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=Q(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Ac(h.K));break;case 5:c.push(new Bc(h.K));break;case 3:c.push(new D(h.K,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new rc(c):
c[0]}for(;;){var l=hh(d,e,3);if(!l)break;var k=R(e,1),m;1==k.type&&$g[k.text]?(m=new $g[k.text],S(e)):m=new Vg;m.f=d;g=!1;h=[];c=!1;for(var p=[],r=[];!g;)switch(S(e),k=Q(e),k.type){case 1:if(d.g[k.text])h.push(new Qg(m.f,k.text)),r.push(k.text);else if(d.h[k.text]instanceof Wg){var q=d.h[k.text];h.push(new Rg(q.f,q.b));r.push.apply(r,q.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Me:c,
nb:h});h=[];c=!1;break;case 15:var z=new Sg(h,c),u=p.pop(),h=u.nb;c=u.Me;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.pe(h,r);d.h[l]=m}d.j=jh(d,["background"]);d.w=jh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(A){v.error(A,"Error:")}N(a,d)});return a.result()},"validatorFetcher");var mh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},nh=["box-decoration-break","image-resolution","orphans","widows"];function oh(){return Pd("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(nh))}
for(var ph={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},qh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),rh=["left","right","top","bottom"],sh={width:!0,height:!0},th=0;th<qh.length;th++)for(var uh=0;uh<rh.length;uh++){var vh=qh[th].replace("%",rh[uh]);sh[vh]=!0}function wh(a){for(var b={},c=0;c<qh.length;c++)for(var d in a){var e=qh[c].replace("%",d),f=qh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var xh=wh({before:"right",after:"left",start:"top",end:"bottom"}),yh=wh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.$a=b}n=V.prototype;n.bf=function(){return this};n.md=function(a){a=this.value.ba(a);return a===this.value?this:new V(a,this.$a)};n.ff=function(a){return a?new V(this.value,this.$a+a):this};n.evaluate=function(a,b){return Uf(a,this.value,b)};n.Qe=function(){return!0};function zh(a,b,c){V.call(this,a,b);this.W=c}t(zh,V);
zh.prototype.bf=function(){return new V(this.value,this.$a)};zh.prototype.md=function(a){a=this.value.ba(a);return a===this.value?this:new zh(a,this.$a,this.W)};zh.prototype.ff=function(a){return a?new zh(this.value,this.$a+a,this.W):this};zh.prototype.Qe=function(a){return!!this.W.evaluate(a)};function Ah(a,b,c){return(!b||c.$a>b.$a)&&c.Qe(a)?c.bf():b}var Bh={"region-id":!0};function Ch(a){return"_"!=a.charAt(0)&&!Bh[a]}function Dh(a,b,c){c?a[b]=c:delete a[b]}
function Eh(a,b){var c=a[b];c||(c={},a[b]=c);return c}function Fh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function Gh(a,b,c,d,e,f){if(e){var g=Eh(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Eh(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(Bh[h]?(f=c[h],e=Fh(b,h),Array.prototype.push.apply(e,f)):Dh(b,h,Ah(a,b[h],c[h].ff(d))))}
function Hh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function Ih(a,b){this.g=a;this.b=b;this.f=""}t(Ih,qc);function Jh(a){a=a.g["font-size"].value;var b;a:switch(a.ga.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.K*yb[a.ga]}
Ih.prototype.Ic=function(a){if("em"==a.ga||"ex"==a.ga){var b=Cb(this.b,a.ga,!1)/Cb(this.b,"em",!1);return new D(a.K*b*Jh(this),"px")}if("rem"==a.ga||"rex"==a.ga)return b=Cb(this.b,a.ga,!1)/Cb(this.b,"rem",!1),new D(a.K*b*this.b.fontSize(),"px");if("%"==a.ga){if("font-size"===this.f)return new D(a.K/100*Jh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.K,b)}return a};
Ih.prototype.Fc=function(a){return"font-size"==this.f?Uf(this.b,a,this.f).ba(this):a};function Kh(){}Kh.prototype.apply=function(){};Kh.prototype.l=function(a){return new Lh([this,a])};Kh.prototype.clone=function(){return this};function Mh(a){this.b=a}t(Mh,Kh);Mh.prototype.apply=function(a){a.h[a.h.length-1].push(this.b.b())};function Lh(a){this.b=a}t(Lh,Kh);Lh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Lh.prototype.l=function(a){this.b.push(a);return this};
Lh.prototype.clone=function(){return new Lh([].concat(this.b))};function Nh(a,b,c,d){this.style=a;this.$=b;this.b=c;this.h=d}t(Nh,Kh);Nh.prototype.apply=function(a){Gh(a.l,a.G,this.style,this.$,this.b,this.h)};function W(){this.b=null}t(W,Kh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function Oh(a){this.b=null;this.h=a}t(Oh,W);Oh.prototype.apply=function(a){0<=a.H.indexOf(this.h)&&this.b.apply(a)};Oh.prototype.f=function(){return 10};
Oh.prototype.g=function(a){this.b&&Ph(a.Fa,this.h,this.b);return!0};function Qh(a){this.b=null;this.id=a}t(Qh,W);Qh.prototype.apply=function(a){a.X!=this.id&&a.ha!=this.id||this.b.apply(a)};Qh.prototype.f=function(){return 11};Qh.prototype.g=function(a){this.b&&Ph(a.g,this.id,this.b);return!0};function Rh(a){this.b=null;this.localName=a}t(Rh,W);Rh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Rh.prototype.f=function(){return 8};
Rh.prototype.g=function(a){this.b&&Ph(a.bd,this.localName,this.b);return!0};function Sh(a,b){this.b=null;this.h=a;this.localName=b}t(Sh,W);Sh.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Sh.prototype.f=function(){return 8};Sh.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Ph(a.h,b+this.localName,this.b)}return!0};function Th(a){this.b=null;this.h=a}t(Th,W);
Th.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Uh(a){this.b=null;this.h=a}t(Uh,W);Uh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Vh(a,b){this.b=null;this.h=a;this.name=b}t(Vh,W);Vh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Wh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Wh,W);Wh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Wh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Wh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Ph(a.f,this.value,this.b),!0):!1};function Xh(a,b){this.b=null;this.h=a;this.name=b}t(Xh,W);
Xh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&ph[b]&&this.b.apply(a)}};Xh.prototype.f=function(){return 0};Xh.prototype.g=function(){return!1};function Yh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t(Yh,W);Yh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Zh(a){this.b=null;this.h=a}t(Zh,W);Zh.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function $h(){this.b=null}t($h,W);$h.prototype.apply=function(a){a.Va&&this.b.apply(a)};$h.prototype.f=function(){return 6};function ai(){this.b=null}t(ai,W);ai.prototype.apply=function(a){a.qa&&this.b.apply(a)};ai.prototype.f=function(){return 12};function bi(a,b){this.b=null;this.h=a;this.Lc=b}t(bi,W);function ci(a,b){var c=a.h;b-=a.Lc;return c?!(b%c)&&0<=b/c:!b}function di(a,b){bi.call(this,a,b)}t(di,bi);di.prototype.apply=function(a){ci(this,a.Oa)&&this.b.apply(a)};di.prototype.f=function(){return 5};
function ei(a,b){bi.call(this,a,b)}t(ei,bi);ei.prototype.apply=function(a){ci(this,a.Bb[a.j][a.f])&&this.b.apply(a)};ei.prototype.f=function(){return 5};function fi(a,b){bi.call(this,a,b)}t(fi,bi);fi.prototype.apply=function(a){var b=a.U;null===b&&(b=a.U=a.b.parentNode.childElementCount-a.Oa+1);ci(this,b)&&this.b.apply(a)};fi.prototype.f=function(){return 4};function gi(a,b){bi.call(this,a,b)}t(gi,bi);
gi.prototype.apply=function(a){var b=a.vb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}ci(this,b[a.j][a.f])&&this.b.apply(a)};gi.prototype.f=function(){return 4};function hi(){this.b=null}t(hi,W);hi.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};hi.prototype.f=function(){return 4};
function ii(){this.b=null}t(ii,W);ii.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};ii.prototype.f=function(){return 5};function ji(){this.b=null}t(ji,W);ji.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};ji.prototype.f=function(){return 5};function ki(){this.b=null}t(ki,W);ki.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};ki.prototype.f=function(){return 5};function li(a){this.b=null;this.W=a}t(li,W);
li.prototype.apply=function(a){a.w[this.W]&&this.b.apply(a)};li.prototype.f=function(){return 5};function mi(){this.b=!1}t(mi,Kh);mi.prototype.apply=function(){this.b=!0};mi.prototype.clone=function(){var a=new mi;a.b=this.b;return a};function ni(a){this.b=null;this.h=new mi;this.j=Hh(a,this.h)}t(ni,W);ni.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};ni.prototype.f=function(){return this.j.f()};function oi(a){this.W=a}oi.prototype.b=function(){return this};
oi.prototype.push=function(a,b){b||pi(a,this.W);return!1};oi.prototype.pop=function(a,b){return b?!1:(a.w[this.W]--,!0)};function qi(a){this.W=a}qi.prototype.b=function(){return this};qi.prototype.push=function(a,b){b?1==b&&a.w[this.W]--:pi(a,this.W);return!1};qi.prototype.pop=function(a,b){if(b)1==b&&pi(a,this.W);else return a.w[this.W]--,!0;return!1};function ri(a){this.W=a;this.f=!1}ri.prototype.b=function(){return new ri(this.W)};
ri.prototype.push=function(a){return this.f?(a.w[this.W]--,!0):!1};ri.prototype.pop=function(a,b){if(this.f)return a.w[this.W]--,!0;b||(this.f=!0,pi(a,this.W));return!1};function si(a){this.W=a;this.f=!1}si.prototype.b=function(){return new si(this.W)};si.prototype.push=function(a,b){this.f&&(-1==b?pi(a,this.W):b||a.w[this.W]--);return!1};si.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.w[this.W]--,!0;b||pi(a,this.W)}else b||(this.f=!0,pi(a,this.W));return!1};
function ti(a,b){this.f=a;this.element=b}ti.prototype.b=function(){return this};ti.prototype.push=function(){return!1};ti.prototype.pop=function(a,b){return b?!1:(ui(a,this.f,this.element),!0)};function vi(a){this.lang=a}vi.prototype.b=function(){return this};vi.prototype.push=function(){return!1};vi.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function wi(a){this.f=a}wi.prototype.b=function(){return this};wi.prototype.push=function(){return!1};
wi.prototype.pop=function(a,b){return b?!1:(a.J=this.f,!0)};function xi(a){this.element=a}t(xi,qc);function yi(a,b){switch(b){case "url":return a?new Dc(a):new Dc("about:invalid");default:return a?new yc(a):new yc("")}}
xi.prototype.Ib=function(a){if("attr"!==a.name)return qc.prototype.Ib.call(this,a);var b="string",c;a.values[0]instanceof rc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?yi(a.values[1].stringValue(),b):yi(null,b);return this.element&&this.element.hasAttribute(c)?yi(this.element.getAttribute(c),b):a};function zi(a,b,c){this.f=a;this.element=b;this.b=c}t(zi,qc);
zi.prototype.Xb=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.D)];b.D++;break;case "close-quote":return 0<b.D&&b.D--,c[2*Math.min(d,b.D)+1];case "no-open-quote":return b.D++,new yc("");case "no-close-quote":return 0<b.D&&b.D--,new yc("")}return a};
var Ai={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Bi={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Ci={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Di={og:!1,Mc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",rd:"\u5341\u767e\u5343",If:"\u8ca0"};
function Ei(a){if(9999<a||-9999>a)return""+a;if(!a)return Di.Mc.charAt(0);var b=new Da;0>a&&(b.append(Di.If),a=-a);if(10>a)b.append(Di.Mc.charAt(a));else if(Di.pg&&19>=a)b.append(Di.rd.charAt(0)),a&&b.append(Di.rd.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Di.Mc.charAt(c)),b.append(Di.rd.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Di.Mc.charAt(c)),b.append(Di.rd.charAt(1));if(c=Math.floor(a/10)%10)b.append(Di.Mc.charAt(c)),b.append(Di.rd.charAt(0));(a%=10)&&b.append(Di.Mc.charAt(a))}return b.toString()}
function Fi(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(Ai[b])a:{e=Ai[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(Bi[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Bi[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=Ci[b]?e=Ci[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Ei(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Gi(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new yc(Fi(e&&e.length&&e[e.length-1]||0,d));c=new E(Hi(a.b,c,function(a){return Fi(a||0,d)}));return new rc([c])}
function Ii(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Da;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Fi(f[h],e));c=new E(Ji(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Fi(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Fi(0,e)}));return new rc([c])}
function Ki(a,b){var c=b[0],c=c instanceof Dc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Li(a.b,c,d,function(a){return Fi(a||0,e)}));return new rc([c])}function Mi(a,b){var c=b[0],c=c instanceof Dc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Ni(a.b,c,d,function(a){a=a.map(function(a){return Fi(a,f)});return a.length?a.join(e):Fi(0,f)}));return new rc([c])}
zi.prototype.Ib=function(a){switch(a.name){case "counter":if(2>=a.values.length)return Gi(this,a.values);break;case "counters":if(3>=a.values.length)return Ii(this,a.values);break;case "target-counter":if(3>=a.values.length)return Ki(this,a.values);break;case "target-counters":if(4>=a.values.length)return Mi(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new yc("")};var Oi=1/1048576;function Pi(a,b){for(var c in a)b[c]=a[c].clone()}
function Qi(){this.j=0;this.b={};this.bd={};this.h={};this.f={};this.Fa={};this.g={};this.Tc={};this.order=0}Qi.prototype.clone=function(){var a=new Qi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Pi(this.bd,a.bd);Pi(this.h,a.h);Pi(this.f,a.f);Pi(this.Fa,a.Fa);Pi(this.g,a.g);Pi(this.Tc,a.Tc);a.order=this.order;return a};function Ph(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}Qi.prototype.Je=function(){return this.order+=Oi};
function Ri(a,b,c,d){this.C=a;this.l=b;this.Kc=c;this.bb=d;this.h=[[],[]];this.w={};this.H=this.G=this.b=null;this.ya=this.ha=this.X=this.j=this.f="";this.Z=this.O=null;this.qa=this.Va=!0;this.g={};this.I=[{}];this.J=[new yc("\u201c"),new yc("\u201d"),new yc("\u2018"),new yc("\u2019")];this.D=0;this.lang="";this.Fb=[0];this.Oa=0;this.ka=[{}];this.Bb=this.ka[0];this.U=null;this.Db=[this.U];this.Eb=[{}];this.vb=this.ka[0];this.Cb=[]}function pi(a,b){a.w[b]=(a.w[b]||0)+1}
function Si(a,b,c){(b=b[c])&&b.apply(a)}var Ti=[];function Ui(a,b,c,d){a.b=null;a.G=d;a.j="";a.f="";a.X="";a.ha="";a.H=b;a.ya="";a.O=Ti;a.Z=c;Vi(a)}function Wi(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.I[a.I.length-1];c||(c={},a.I[a.I.length-1]=c);c[b]=!0}
function Xi(a,b){var c=ed,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=zg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=zg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=zg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===kd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Wi(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Wi(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Wi(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===kd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Ac(c[c.length-1]),0));a.I.push(null)}function Yi(a){var b=a.I.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function ui(a,b,c){Xi(a,b);b.content&&(b.content=b.content.md(new zi(a,c,a.bb)));Yi(a)}var Zi="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function $i(a,b,c){a.Cb.push(b);a.Z=null;a.b=b;a.G=c;a.j=b.namespaceURI;a.f=b.localName;var d=a.C.b[a.j];a.ya=d?d+a.f:"";a.X=b.getAttribute("id");a.ha=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.H=d.split(/\s+/):a.H=Ti;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O=d.split(/\s+/):a.O=Ti;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.H=[b.getAttribute("name")||""]);if(d=Ba(b))a.h[a.h.length-1].push(new vi(a.lang)),
a.lang=d.toLowerCase();var d=a.qa,e=a.Fb;a.Oa=++e[e.length-1];e.push(0);var e=a.ka,f=a.Bb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Db;null!==e[e.length-1]?a.U=--e[e.length-1]:a.U=null;e.push(null);e=a.Eb;(f=a.vb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});Vi(a);aj(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new wi(a.J),e===F?a.J=[new yc(""),new yc("")]:e instanceof rc&&(a.J=e.values));Xi(a,a.G);e=a.X||a.ha||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);bj(a.Kc,e,h)}if(d=a.G._pseudos)for(e=!0,f=0;f<Zi.length;f++)(g=Zi[f])||(e=!1),(g=d[g])&&(e?ui(a,g,b):a.h[a.h.length-2].push(new ti(g,b)));c&&a.h[a.h.length-2].push(c)}function cj(a,b){for(var c in b)Ch(c)&&(b[c]=b[c].md(a))}function aj(a,b){var c=new xi(b),d=a.G,e=d._pseudos,f;for(f in e)cj(c,e[f]);cj(c,d)}
function Vi(a){var b;for(b=0;b<a.H.length;b++)Si(a,a.C.Fa,a.H[b]);for(b=0;b<a.O.length;b++)Si(a,a.C.f,a.O[b]);Si(a,a.C.g,a.X);Si(a,a.C.bd,a.f);""!=a.f&&Si(a,a.C.bd,"*");Si(a,a.C.h,a.ya);null!==a.Z&&(Si(a,a.C.Tc,a.Z),Si(a,a.C.Tc,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Va=!0;a.qa=!1}
Ri.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.Va=!1};var dj=null;function ej(a,b,c,d,e,f,g){nf.call(this,a,b,g);this.b=null;this.$=0;this.h=this.Za=null;this.C=!1;this.W=c;this.j=d?d.j:dj?dj.clone():new Qi;this.G=e;this.w=f;this.l=0}t(ej,of);ej.prototype.hf=function(a){Ph(this.j.bd,"*",a)};function fj(a,b){var c=Hh(a.b,b);c!==b&&c.g(a.j)||a.hf(c)}
ej.prototype.Hb=function(a,b){if(b||a)this.$+=1,b&&a?this.b.push(new Sh(a,b.toLowerCase())):b?this.b.push(new Rh(b.toLowerCase())):this.b.push(new Uh(a))};ej.prototype.Od=function(a){this.h?(v.b("::"+this.h,"followed by ."+a),this.b.push(new li(""))):(this.$+=256,this.b.push(new Oh(a)))};var gj={"nth-child":di,"nth-of-type":ei,"nth-last-child":fi,"nth-last-of-type":gi};
ej.prototype.Uc=function(a,b){if(this.h)v.b("::"+this.h,"followed by :"+a),this.b.push(new li(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new ii);break;case "disabled":this.b.push(new ji);break;case "checked":this.b.push(new ki);break;case "root":this.b.push(new ai);break;case "link":this.b.push(new Rh("a"));this.b.push(new Vh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+qa(b[0])+"($|s)");this.b.push(new Th(c))}else this.b.push(new li(""));
break;case "-adapt-footnote-content":case "footnote-content":this.C=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new li(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Zh(new RegExp("^"+qa(b[0].toLowerCase())+"($|-)"))):this.b.push(new li(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=gj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new li(""));break;case "first-child":this.b.push(new $h);
break;case "last-child":this.b.push(new fi(0,1));break;case "first-of-type":this.b.push(new ei(0,1));break;case "last-of-type":this.b.push(new gi(0,1));break;case "only-child":this.b.push(new $h);this.b.push(new fi(0,1));break;case "only-of-type":this.b.push(new ei(0,1));this.b.push(new gi(0,1));break;case "empty":this.b.push(new hi);break;case "before":case "after":case "first-line":case "first-letter":this.Vc(a,b);return;default:v.b("unknown pseudo-class selector: "+a),this.b.push(new li(""))}this.$+=
256}};
ej.prototype.Vc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new li(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new li(""))):this.h="first-"+c+"-lines";break}}default:v.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new li(""))}this.$+=1};ej.prototype.Wd=function(a){this.$+=65536;this.b.push(new Qh(a))};
ej.prototype.kd=function(a,b,c,d){this.$+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Vh(a,b);break;case 39:e=new Wh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new li(""):e=new Yh(a,b,new RegExp("(^|\\s)"+qa(d)+"($|\\s)"));break;case 44:e=new Yh(a,b,new RegExp("^"+qa(d)+"($|-)"));break;case 43:d?e=new Yh(a,b,new RegExp("^"+qa(d))):e=new li("");break;case 42:d?e=new Yh(a,b,new RegExp(qa(d)+"$")):e=new li("");break;case 46:d?e=new Yh(a,b,new RegExp(qa(d))):e=new li("");break;case 50:"supported"==
d?e=new Xh(a,b):(v.b("Unsupported :: attr selector op:",d),e=new li(""));break;default:v.b("Unsupported attr selector:",c),e=new li("")}this.b.push(e)};var hj=0;n=ej.prototype;n.Lb=function(){var a="d"+hj++;fj(this,new Mh(new oi(a)));this.b=[new li(a)]};n.Nd=function(){var a="c"+hj++;fj(this,new Mh(new qi(a)));this.b=[new li(a)]};n.Kd=function(){var a="a"+hj++;fj(this,new Mh(new ri(a)));this.b=[new li(a)]};n.Sd=function(){var a="f"+hj++;fj(this,new Mh(new si(a)));this.b=[new li(a)]};
n.zc=function(){ij(this);this.h=null;this.C=!1;this.$=0;this.b=[]};n.zb=function(){var a;0!=this.l?(qf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.l=1,this.Za={},this.h=null,this.$=0,this.C=!1,this.b=[])};n.error=function(a,b){of.prototype.error.call(this,a,b);1==this.l&&(this.l=0)};n.Cc=function(a){of.prototype.Cc.call(this,a);this.l=0};n.xa=function(){ij(this);of.prototype.xa.call(this);1==this.l&&(this.l=0)};n.Mb=function(){of.prototype.Mb.call(this)};
function ij(a){if(a.b){var b=a.$+a.j.Je();fj(a,a.lf(b));a.b=null;a.h=null;a.C=!1;a.$=0}}n.lf=function(a){var b=this.G;this.C&&(b=b?"xxx-bogus-xxx":"footnote");return new Nh(this.Za,a,this.h,b)};n.xb=function(a,b,c){kh(this.w,a,b,c,this)};n.Qc=function(a,b){pf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.Ed=function(a,b){pf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.yb=function(a,b,c){"display"!=a||b!==od&&b!==nd||(this.yb("flow-options",new rc([Wc,td]),c),this.yb("flow-into",b,c),b=Mc);Pd("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?jf(this):kf(this);Dh(this.Za,a,this.W?new zh(b,d,this.W):new V(b,d))};n.Zc=function(a){switch(a){case "not":a=new jj(this),a.zb(),mf(this.ma,a)}};function jj(a){ej.call(this,a.f,a.ma,a.W,a,a.G,a.w,!1);this.parent=a;this.g=a.b}t(jj,ej);n=jj.prototype;
n.Zc=function(a){"not"==a&&qf(this,"E_CSS_UNEXPECTED_NOT")};n.xa=function(){qf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.zc=function(){qf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.ld=function(){this.b&&0<this.b.length&&this.g.push(new ni(this.b));this.parent.$+=this.$;var a=this.ma;a.b=a.g.pop()};n.error=function(a,b){ej.prototype.error.call(this,a,b);var c=this.ma;c.b=c.g.pop()};function kj(a,b){nf.call(this,a,b,!1)}t(kj,of);
kj.prototype.xb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Pc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new ec(this.f,100,c),c=b.ta(this.f,c);this.f.values[a]=c}};function lj(a,b,c,d,e){nf.call(this,a,b,!1);this.Za=d;this.W=c;this.b=e}t(lj,of);lj.prototype.xb=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):kh(this.b,a,b,c,this)};lj.prototype.Qc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
lj.prototype.Ed=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};lj.prototype.yb=function(a,b,c){c=c?jf(this):kf(this);c+=this.order;this.order+=Oi;Dh(this.Za,a,this.W?new zh(b,c,this.W):new V(b,c))};function mj(a,b){Nf.call(this,a);this.Za={};this.b=b;this.order=0}t(mj,Nf);mj.prototype.xb=function(a,b,c){kh(this.b,a,b,c,this)};mj.prototype.Qc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};mj.prototype.Ed=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
mj.prototype.yb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Oi;Dh(this.Za,a,new V(b,c))};function nj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==dd?b===Dd:c}function oj(a,b,c,d){var e={},f;for(f in a)Ch(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)Ch(g)&&(e[g]=Ah(b,e[g],f[g]))}return e}
function pj(a,b,c,d){c=c?xh:yh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.$a>f.$a)continue;g=sh[g]?g:e}else g=e;b[g]=d(e,f)}}};var qj=!1,rj={dg:"ltr",eg:"rtl"};ba("vivliostyle.constants.PageProgression",rj);rj.LTR="ltr";rj.RTL="rtl";var sj={vf:"left",wf:"right"};ba("vivliostyle.constants.PageSide",sj);sj.LEFT="left";sj.RIGHT="right";var tj={LOADING:"loading",cg:"interactive",$f:"complete"};ba("vivliostyle.constants.ReadyState",tj);tj.LOADING="loading";tj.INTERACTIVE="interactive";tj.COMPLETE="complete";function uj(a,b,c){this.w=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=vj(vj(vj(vj(new wj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function xj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function yj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return xj(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,xj(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return xj(a,b)+e}function zj(a){0>a.h&&(a.h=yj(a,a.root,0,!0));return a.h}
function Aj(a,b){for(var c,d=a.root;;){c=xj(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=La(e.length,function(c){return xj(a,e[c])>b});if(!f)break;if(f<e.length&&xj(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function Bj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Bj(a,c)}function Cj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},Bj(a,a.b.documentElement)),d=a.f[c]);return d}
var Dj={hg:"text/html",ig:"text/xml",Vf:"application/xml",Uf:"application/xhtml_xml",bg:"image/svg+xml"};function Ej(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Fj(a){var b=a.contentType;if(b){for(var c=Object.keys(Dj),d=0;d<c.length;d++)if(Dj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Gj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Fj(a);(c=Ej(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Ej(e,"image/svg+xml",d)):c=Ej(e,"text/html",d));c||(c=Ej(e,"text/html",d))}}c=c?new uj(b,a.url,c):null;return L(c)}function Hj(a){this.xc=a}
function Ij(){var a=Jj;return new Hj(function(b){return a.xc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Kj(){var a=Ij(),b=Jj;return new Hj(function(c){if(!b.xc(c))return!1;c=new wj([c]);c=vj(c,"EncryptionMethod");a&&(c=Lj(c,a));return 0<c.b.length})}var Jj=new Hj(function(){return!0});function wj(a){this.b=a}function Lj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.xc(e)&&c.push(e)}return new wj(c)}
function Mj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new wj(d)}wj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Nj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function vj(a,b){return Mj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Oj(a){return Mj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Pj(a,b){return Nj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}wj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Qj={transform:!0,"transform-origin":!0},Rj={top:!0,bottom:!0,left:!0,right:!0};function Sj(a,b,c){this.target=a;this.name=b;this.value=c}var Tj={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Uj(a,b){var c=Tj[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Vj(a,b){this.h={};this.N=a;this.g=b;this.O=null;this.w=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ua(c,{type:"hyperlink",target:null,currentTarget:null,mg:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.C=this.H=!1;this.D=this.G=!0;this.R=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.I={top:{},bottom:{},left:{},right:{}}}
t(Vj,Ta);function Wj(a,b){(a.G=b)?a.N.setAttribute("data-vivliostyle-auto-page-width",!0):a.N.removeAttribute("data-vivliostyle-auto-page-width")}function Xj(a,b){(a.D=b)?a.N.setAttribute("data-vivliostyle-auto-page-height",!0):a.N.removeAttribute("data-vivliostyle-auto-page-height")}function Yj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Zj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.N.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.w,e=0;e<d.length;e++){var f=d[e];w(f.target,f.name,f.value.toString())}e=ak(c,a.N);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.Wc],d=a.b[c.Kf],f&&d&&(f=Uj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Vj.prototype.zoom=function(a){w(this.N,"transform","scale("+a+")")};function bk(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function ck(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function dk(a){this.f=a;this.b=[];this.F=null}
function ek(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.$a=d;this.l=e;this.h=f;this.Nf=g;this.j=h;this.mb=-1;this.g=l}function gk(a,b){return a.h?!b.h||a.$a>b.$a?!0:a.j:!1}function hk(a,b){return a.top-b.top}function ik(a,b){return b.right-a.right}
function jk(a,b){if(a===b)return!0;if(!a||!b||a.ja!==b.ja||a.M!==b.M||a.pa.length!==b.pa.length)return!1;for(var c=0;c<a.pa.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.ab===e.ab&&d.sa===e.sa&&d.Ca===e.Ca&&d.wa===e.wa))return!1}return!0}function kk(a){return{pa:[{node:a.L,ab:lk,sa:a.sa,Ca:null,wa:null}],ja:0,M:!1,Na:a.Na}}function mk(a,b){var c=new nk(a.node,b,0);c.ab=a.ab;c.sa=a.sa;c.Ca=a.Ca;c.wa=a.wa?mk(a.wa,ok(b)):null;c.F=a.F;return c}var lk=0;
function pk(a,b,c,d,e,f,g){this.ma=a;this.he=d;this.Oe=null;this.root=b;this.fa=c;this.type=f;e&&(e.Oe=this);this.b=g}function qk(a,b){this.Lf=a;this.count=b}
function nk(a,b,c){this.L=a;this.parent=b;this.ra=c;this.ja=0;this.M=!1;this.ab=lk;this.sa=b?b.sa:null;this.wa=this.Ca=null;this.ka=!1;this.Aa=!0;this.b=!1;this.w=b?b.w:0;this.display=null;this.J=rk;this.X=this.D=this.l=null;this.U="baseline";this.Z="top";this.Md=this.ha=0;this.I=!1;this.$b=b?b.$b:0;this.h=b?b.h:null;this.C=b?b.C:!1;this.O=this.Oc=!1;this.G=this.B=this.H=this.g=null;this.wb=b?b.wb:{};this.u=b?b.u:!1;this.qa=b?b.qa:"ltr";this.f=b?b.f:null;this.Na=this.lang=null;this.F=b?b.F:null;this.j=
null}function sk(a){a.Aa=!0;a.w=a.parent?a.parent.w:0;a.B=null;a.G=null;a.ja=0;a.M=!1;a.display=null;a.J=rk;a.l=null;a.D=null;a.X=null;a.U="baseline";a.I=!1;a.$b=a.parent?a.parent.$b:0;a.h=a.parent?a.parent.h:null;a.C=a.parent?a.parent.C:!1;a.g=null;a.H=null;a.Ca=null;a.Oc=!1;a.O=!1;a.u=a.parent?a.parent.u:!1;a.Ca=null;a.Na=null;a.F=a.parent?a.parent.F:null;a.j=null}
function tk(a){var b=new nk(a.L,a.parent,a.ra);b.ja=a.ja;b.M=a.M;b.Ca=a.Ca;b.ab=a.ab;b.sa=a.sa;b.wa=a.wa;b.Aa=a.Aa;b.w=a.w;b.display=a.display;b.J=a.J;b.l=a.l;b.D=a.D;b.X=a.X;b.U=a.U;b.Z=a.Z;b.ha=a.ha;b.Md=a.Md;b.Oc=a.Oc;b.O=a.O;b.I=a.I;b.$b=a.$b;b.h=a.h;b.C=a.C;b.g=a.g;b.H=a.H;b.B=a.B;b.G=a.G;b.f=a.f;b.u=a.u;b.b=a.b;b.Na=a.Na;b.F=a.F;b.j=a.j;return b}nk.prototype.modify=function(){return this.ka?tk(this):this};function ok(a){var b=a;do{if(b.ka)break;b.ka=!0;b=b.parent}while(b);return a}
nk.prototype.clone=function(){for(var a=tk(this),b=a,c;c=b.parent;)c=tk(c),b=b.parent=c;return a};function uk(a){return{node:a.L,ab:a.ab,sa:a.sa,Ca:a.Ca,wa:a.wa?uk(a.wa):null,F:a.F}}function vk(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(uk(b)),b=b.parent;while(b);b=a.Na?wk(a.Na,a.ja,-1):a.ja;return{pa:c,ja:b,M:a.M,Na:a.Na}}function xk(a){for(a=a.parent;a;){if(a.Oc)return!0;a=a.parent}return!1}function yk(a,b){for(var c=a;c;)c.Aa||b(c),c=c.parent}
function zk(a,b){return a.F===b&&!!a.parent&&a.parent.F===b}function Ak(a){this.Da=a;this.b=this.f=null}Ak.prototype.clone=function(){var a=new Ak(this.Da);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function Bk(a,b){if(!b)return!1;if(a===b)return!0;if(!jk(a.Da,b.Da))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!jk(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!jk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function Ck(a,b){this.f=a;this.b=b}Ck.prototype.clone=function(){return new Ck(this.f.clone(),this.b)};function Dk(){this.b=[];this.g="any";this.f=null}
Dk.prototype.clone=function(){for(var a=new Dk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function Ek(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!Bk(d.f,e.f))return!1}return!0}function Fk(){this.page=0;this.f={};this.b={};this.g=0}
Fk.prototype.clone=function(){var a=new Fk;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function Gk(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!Ek(a.b[e],b.b[e]))return!1}return!0}
function Hk(a){this.element=a;this.ib=this.hb=this.height=this.width=this.H=this.C=this.I=this.w=this.ha=this.borderTop=this.ka=this.borderLeft=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Oa=this.Nb=null;this.qa=this.Eb=this.vb=this.Fb=this.la=0;this.u=!1}function Ik(a){return a.marginTop+a.borderTop+a.C}function Jk(a){return a.marginBottom+a.ha+a.H}function Kk(a){return a.marginLeft+a.borderLeft+a.w}function Lk(a){return a.marginRight+a.ka+a.I}
function Mk(a){return a.u?-1:1}function Nk(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.borderLeft=b.borderLeft;a.ka=b.ka;a.borderTop=b.borderTop;a.ha=b.ha;a.w=b.w;a.I=b.I;a.C=b.C;a.H=b.H;a.width=b.width;a.height=b.height;a.hb=b.hb;a.ib=b.ib;a.Oa=b.Oa;a.Nb=b.Nb;a.la=b.la;a.Fb=b.Fb;a.vb=b.vb;a.u=b.u}
function Ok(a,b,c){a.top=b;a.height=c;w(a.element,"top",b+"px");w(a.element,"height",c+"px")}function Pk(a,b,c){a.left=b;a.width=c;w(a.element,"left",b+"px");w(a.element,"width",c+"px")}function Qk(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Rk(a){var b=a.hb+a.left+a.marginLeft+a.borderLeft,c=a.ib+a.top+a.marginTop+a.borderTop;return new Vf(b,c,b+(a.w+a.width+a.I),c+(a.C+a.height+a.H))}Hk.prototype.Td=function(a,b){var c=Sk(this);return xg(a,c.V,c.S,c.T-c.V,c.P-c.S,b)};
function Sk(a){var b=a.hb+a.left,c=a.ib+a.top;return new Vf(b,c,b+(Kk(a)+a.width+Lk(a)),c+(Ik(a)+a.height+Jk(a)))}function Tk(a,b,c){this.b=a;this.f=b;this.g=c}t(Tk,pc);Tk.prototype.dd=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Dc));return null};Tk.prototype.Jc=function(a){if(this.g.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Tk.prototype.Ab=function(a){this.Yb(a.values);return null};Tk.prototype.Fc=function(a){a=a.ta().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Uk(a){return!!a&&a!==md&&a!==F&&a!==dd};function Vk(a,b,c){this.g=a;this.f=b;this.b=c}function Wk(){this.map=[]}function Xk(a){return a.map.length?a.map[a.map.length-1].b:0}function Yk(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Vk(b,b,d))}else a.map.push(new Vk(b,b,b))}function Zk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Vk(b,0,0))}function $k(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function al(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function bl(a,b,c,d,e,f,g,h){this.D=a;this.style=b;this.offset=c;this.G=d;this.j=e;this.b=e.b;this.Ra=f;this.cb=g;this.H=h;this.l=this.w=null;this.C={};this.g=this.f=this.h=null;cl(this)&&(b=b._pseudos)&&b.before&&(a=new bl(a,b.before,c,!1,e,dl(this),g,!0),c=el(a,"content"),Uk(c)&&(this.h=a,this.g=a.g));this.g=fl(gl(this,"before"),this.g);this.cb&&hl[this.g]&&(e.g=fl(e.g,this.g))}
function el(a,b,c){if(!(b in a.C)){var d=a.style[b];a.C[b]=d?d.evaluate(a.D,b):c||null}return a.C[b]}function il(a){return el(a,"display",ed)}function dl(a){if(null===a.w){var b=il(a),c=el(a,"position"),d=el(a,"float");a.w=jl(b,c,d,a.G).display===Mc}return a.w}function cl(a){null===a.l&&(a.l=a.H&&il(a)!==F);return a.l}function gl(a,b){var c=null;if(dl(a)){var d=el(a,"break-"+b);d&&(c=d.toString())}return c}function kl(a){this.g=a;this.b=[];this.cb=this.Ra=!0;this.f=[]}
function ll(a){return a.b[a.b.length-1]}function ml(a){return a.b.every(function(a){return il(a)!==F})}kl.prototype.push=function(a,b,c,d){var e=ll(this);d&&e&&d.b!==e.b&&this.f.push({Ra:this.Ra,cb:this.cb});e=d||e.j;d=this.cb||!!d;var f=ml(this);a=new bl(this.g,a,b,c,e,d||this.Ra,d,f);this.b.push(a);this.Ra=cl(a)?!a.h&&dl(a):this.Ra;this.cb=cl(a)?!a.h&&d:this.cb;return a};
kl.prototype.pop=function(a){var b=this.b.pop(),c=this.Ra,d=this.cb;if(cl(b)){var e=b.style._pseudos;e&&e.after&&(a=new bl(b.D,e.after,a,!1,b.j,c,d,!0),c=el(a,"content"),Uk(c)&&(b.f=a))}this.cb&&b.f&&(a=gl(b.f,"before"),b.j.g=fl(b.j.g,a));if(a=ll(this))a.b===b.b?cl(b)&&(this.Ra=this.cb=!1):(a=this.f.pop(),this.Ra=a.Ra,this.cb=a.cb);return b};
function nl(a,b){if(!b.Ra)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Ra||d.G)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function ol(a,b,c,d,e,f,g,h){this.fa=a;this.root=a.root;this.Oa=c;this.h=d;this.w=f;this.f=this.root;this.O={};this.U={};this.D={};this.H=[];this.C=this.J=this.I=null;this.X=new Ri(b,d,g,h);this.g=new Wk;this.Da=!0;this.ha=[];this.ya=e;this.qa=this.ka=!1;this.b=a=xj(a,this.root);this.Z={};this.j=new kl(d);Yk(this.g,a);d=pl(this,this.root);$i(this.X,this.root,d);ql(this,d,!1);this.G=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.G=
!1}this.ha.push(!0);this.U={};this.U["e"+a]=d;this.b++;rl(this,-1)}function sl(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function tl(a,b,c){for(var d in c){var e=b[d];e?(a.O[d]=e,delete b[d]):(e=c[d])&&(a.O[d]=new V(e,33554432))}}var ul=["column-count","column-width"];
function ql(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.O[a]=b[a])},a);if(!a.ka){var d=sl(a,b,a.w.j,"background-color")?b["background-color"].evaluate(a.h):null,e=sl(a,b,a.w.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==dd||e&&e!==dd)tl(a,b,a.w.j),a.ka=!0}if(!a.qa)for(d=0;d<ul.length;d++)if(sl(a,b,a.w.w,ul[d])){tl(a,b,a.w.w);a.qa=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.K;switch(d.ga){case "em":case "rem":c*=a.h.w;break;case "ex":case "rex":c*=
a.h.w*yb.ex/yb.em;break;case "%":c*=a.h.w/100;break;default:(d=yb[d.ga])&&(c*=d)}a.h.qa=c}}function vl(a){for(var b=0;!a.G&&(b+=5E3,wl(a,b,0)!=Number.POSITIVE_INFINITY););return a.O}function pl(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.fa.url,e=new mj(a.Oa,a.w),c=new Ye(c,e);try{Mf(new Df(sf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.Za}}return{}}
function rl(a,b){if(!(b>=a.b)){var c=a.h,d=xj(a.fa,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=xl(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=Aj(a.fa,b);e=yj(a.fa,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=xj(a.fa,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),xl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function yl(a,b){a.I=b;for(var c=0;c<a.H.length;c++)zl(a.I,a.H[c],a.D[a.H[c].b])}
function xl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new tg;try{h.ba(l);p=l.b;break a}catch(r){v.b(r,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=vg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=vg(c.evaluate(a.h,"flow-priority"),0));c=a.Z[e]||null;p=a.D[b];p||(p=ll(a.j),p=a.D[b]=new dk(p?p.j.b:null));d=new ek(b,d,e,f,g,h,l,k,c);
a.H.push(d);a.J==b&&(a.J=null);a.I&&zl(a.I,d,p);return d}function Al(a,b,c,d){hl[b]&&(d=a.D[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.Z[c]=fl(a.Z[c],b)}
function wl(a,b,c){var d=-1;if(b<=a.b&&(d=$k(a.g,b),d+=c,d<Xk(a.g)))return al(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.X,g=a.f;if(f.Cb.pop()!==g)throw Error("Invalid call to popElement");f.Fb.pop();f.ka.pop();f.Db.pop();f.Eb.pop();f.pop();Yi(f);a.Da=a.ha.pop();g=a.j.pop(a.b);f=null;g.f&&(f=gl(g.f,"before"),Al(a,f,g.f.Ra?nl(a.j,g):g.f.offset,g.b),f=gl(g.f,"after"));f=fl(f,gl(g,"after"));Al(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=$k(a.g,b),d+=c),d<=Xk(a.g))?al(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=ll(f);(f.Ra||f.cb)&&cl(h)&&(h=el(h,"white-space",md).toString(),ck(g,bk(h))||(f.Ra=!1,f.cb=!1));a.Da?Yk(a.g,a.b):Zk(a.g,a.b)}else{g=a.f;f=pl(a,g);a.ha.push(a.Da);$i(a.X,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.C&&(a.C=null);a.G||"body"!=g.localName||
g.parentNode!=a.root||(ql(a,f,!0),a.G=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=xl(a,h,f,g,a.b);a.Da=!!a.ya[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=nl(a.j,g);Al(a,g.g,h,g.b);g.h&&(l=gl(g.h,"after"),Al(a,l,g.h.Ra?h:g.offset,g.b));a.Da&&il(g)===F&&(a.Da=!1);if(xj(a.fa,a.f)!=a.b)throw Error("Inconsistent offset");a.U["e"+a.b]=f;a.b++;a.Da?Yk(a.g,a.b):Zk(a.g,a.b);if(b<a.b&&(0>d&&(d=$k(a.g,b),d+=c),d<=Xk(a.g)))return al(a.g,d)}}}
ol.prototype.l=function(a,b){var c=xj(this.fa,a),d="e"+c;b&&(c=yj(this.fa,a,0,!0));this.b<=c&&wl(this,c,0);return this.U[d]};var Bl={"font-style":md,"font-variant":md,"font-weight":md},Cl="OTTO"+(new Date).valueOf(),Dl=1;function El(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in Bl)c[e]||(c[e]=Bl[e]);return c}function Fl(a){a=this.mc=a;var b=new Da,c;for(c in Bl)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.mc.src?this.mc.src.toString():null;this.g=[];this.h=[];this.b=(c=this.mc["font-family"])?c.stringValue():null}
function Gl(a,b,c){var d=new Da;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in Bl)d.append(e),d.append(": "),a.mc[e].Pa(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function Hl(a){this.f=a;this.b={}}
function Il(a,b){if(b instanceof sc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new sc(d)}return(c=a.b[b.stringValue()])?new sc([C(c),b]):b}function Jl(a,b){this.b=a;this.body=b;this.f={};this.g=0}function Kl(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function Ll(a,b,c,d){var e=K("initFont"),f=b.src,g={},h;for(h in Bl)g[h]=b.mc[h];d=Kl(a,b,d);g["font-family"]=C(d);var l=new Fl(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=Cl+Dl++;b.textContent=Gl(l,"",bf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in Bl)w(k,p,g[p].toString());var g=k.getBoundingClientRect(),r=g.right-g.left,q=g.bottom-g.top;
b.textContent=Gl(l,f,c);v.g("Starting to load font:",f);var z=!1;le(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return r!=a.right-a.left||q!=b?(z=!0,L(!1)):(new Date).valueOf()>m?L(!1):ke(10)}).then(function(){z?v.g("Loaded font:",f):v.b("Failed to load font:",f);a.body.removeChild(k);N(e,l)});return e.result()}
function Ml(a,b,c){var d=b.src,e=a.f[d];e?pe(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new oe(function(){var e=K("loadFont"),g=c.f?c.f(d):null;g?af(d,"blob").then(function(d){d.vd?g(d.vd).then(function(d){Ll(a,b,d,c).Ea(e)}):N(e,null)}):Ll(a,b,null,c).Ea(e);return e.result()},"loadFont "+d),a.f[d]=e,e.start());return e}
function Nl(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(Ml(a,f,c)):v.b("E_FONT_FACE_INVALID")}return qe(d)};Od("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Kc?pd:c,important:a.important};default:return a}});var hl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Ol={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function fl(a,b){if(a)if(b){var c=!!hl[a],d=!!hl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Ol[b]?b:Ol[a]?a:b}else return a;else return b}function Pl(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Ql(){}Ql.prototype.gf=function(a){return{A:a,jd:!1,Gb:!1}};Ql.prototype.sf=function(){};Ql.prototype.ed=function(){};Ql.prototype.Zb=function(){};function Rl(a,b){this.b=a;this.f=b}
function Sl(a,b){var c=a.b,d=c.gf(b),e=K("LayoutIterator");me(function(a){for(var b;d.A;){b=d.A.B?1!==d.A.B.nodeType?ck(d.A.B,d.A.$b)?void 0:d.A.M?void 0:c.sf(d):d.A.Aa?void 0:d.A.M?c.Zb(d):c.ed(d):void 0;b=(b&&b.Ba()?b:L(!0)).na(function(){return d.Gb?L(null):Tl(this.f,d.A,d.jd)}.bind(this));if(b.Ba()){b.then(function(b){d.Gb?P(a):(d.A=b,O(a))});return}if(d.Gb){P(a);return}d.A=b.get()}P(a)}.bind(a)).then(function(){N(e,d.A)});return e.result()}function Ul(a){this.Pb=a}t(Ul,Ql);n=Ul.prototype;
n.tf=function(){};n.Xe=function(){};n.gf=function(a){return{A:a,jd:!!this.Pb&&a.M,Gb:!1,Pb:this.Pb,wc:null,de:!1,kf:[],yc:null}};n.sf=function(a){a.de=!1};n.ed=function(a){a.kf.push(ok(a.A));a.wc=fl(a.wc,a.A.g);a.de=!0;return this.tf(a)};n.Zb=function(a){var b;a.de?(b=(b=void 0,L(!0)),b=b.na(function(){a.Gb||(a.kf=[],a.Pb=!1,a.jd=!1,a.wc=null);return L(!0)})):b=(b=this.Xe(a))&&b.Ba()?b:L(!0);return b.na(function(){a.Gb||(a.de=!1,a.yc=ok(a.A),a.wc=fl(a.wc,a.A.H));return L(!0)})};
function Vl(a,b,c){this.Ne=[];this.ca=Object.create(a);this.ca.element=b;this.ca.h=a.h.clone();this.ca.j=!1;this.ca.Ae=c.F;this.ca.Db=a;a=Wl(this.ca,c);this.ca.G-=a;var d=this;this.ca.Bb=function(a){return Xl.prototype.Bb.call(this,a).na(function(a){d.Ne.push(ok(a));return L(a)})}}function Yl(a,b){return Zl(a.ca,b,!0)}Vl.prototype.fc=function(a){var b=this.ca.fc();if(a){a=ok(this.Ne[0]);var c=new $l(a,null,a.b,0);c.f(this.ca,0);if(!b.A)return{we:c,A:a}}return b};
Vl.prototype.Ha=function(a,b,c){return this.ca.Ha(a,b,c)};function am(){this.H=this.C=null}function bm(a,b,c){a.I(b,c);return cm(a,b,c)}function cm(a,b,c){var d=K("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.l(b,c);var e=a.j(b);e.b(b,c).then(function(a){var f=e.f(a,c);e.lc(a,this.h,c,f);f?N(d,a):(this.g(this.h),this.f(b,c),cm(this,this.h,c).Ea(d))}.bind(a));return d.result()}am.prototype.I=function(){};
am.prototype.g=function(a){a=a.B||a.parent.B;for(var b;b=a.lastChild;)a.removeChild(b);for(;b=a.nextSibling;)b.parentNode.removeChild(b)};am.prototype.l=function(a,b){this.h=ok(a);this.C=[].concat(b.D);this.O=[].concat(b.Sa);a.F&&(this.H=a.F.te())};am.prototype.f=function(a,b){b.D=this.C;b.Sa=this.O;a.F&&a.F.se(this.H)};function dm(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function em(a){var b=fm,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.da:b.ea)+"(-?)"),b:"$1"+(a?b.ea:b.da)+"$2"}})})});return c}
var fm={"horizontal-tb":{ltr:[{da:"inline-start",ea:"left"},{da:"inline-end",ea:"right"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}],rtl:[{da:"inline-start",ea:"right"},{da:"inline-end",ea:"left"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}]},"vertical-rl":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"right"},{da:"block-end",
ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",ea:"top"},{da:"block-start",ea:"right"},{da:"block-end",ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]},"vertical-lr":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",
ea:"top"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]}},gm=em(!0),hm=em(!1);var rk="inline";function im(a){switch(a){case "inline":return rk;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function jm(a){switch(a){case rk:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function km(a,b,c){this.L=a;this.b=b;this.f=c;this.id=this.order=null}
function lm(a){if(null===a.order)throw Error("The page float is not yet added");return a.order}function mm(a){if(!a.id)throw Error("The page float is not yet added");return a.id}function nm(){this.b=[];this.f=0}nm.prototype.Je=function(){return this.f++};nm.prototype.ve=function(a){if(0<=this.b.findIndex(function(b){return b.L===a.L}))throw Error("A page float with the same source node is already registered");var b=a.order=this.Je();a.id="pf"+b;this.b.push(a)};
nm.prototype.De=function(a){var b=this.b.findIndex(function(b){return b.L===a});return 0<=b?this.b[b]:null};function om(a,b){var c=a.b.findIndex(function(a){return a.id===b});return 0<=c?a.b[c]:null}function pm(a,b,c){this.b=mm(a);this.f=b;this.ac=c}pm.prototype.Td=function(){return this.ac.Td(null,null)};function qm(a,b,c){this.lb=a;this.b=b;this.f=c}
function rm(a,b,c,d,e,f,g){(this.parent=a)&&a.j.push(this);this.j=[];this.f=b;this.N=c;this.h=d;this.J=e;this.H=f||a&&a.H||cd;this.G=g||a&&a.G||ld;this.Rc=!1;this.C=a?a.C:new nm;this.D=[];this.b=[];this.l=[];this.w={};this.g=[];a:{b=this;for(a=this.parent;a;){if(b=sm(a,b,this.f,this.h,this.J)){a=b;break a}b=a;a=a.parent}a=null}this.I=a?[].concat(a.g):[]}function tm(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function sm(a,b,c,d,e){b=a.j.indexOf(b);0>b&&(b=a.j.length);for(--b;0<=b;b--){var f=a.j[b];if(f.f===c&&f.h===d&&f.J===e||(f=sm(f,null,c,d,e)))return f}return null}function um(a,b){return b&&b!==a.f?um(tm(a,b),b):a.N}function vm(a,b){a.N=b;wm(a)}rm.prototype.ve=function(a){this.C.ve(a)};function xm(a,b){return b===a.f?a:xm(tm(a,b),b)}rm.prototype.De=function(a){return this.C.De(a)};function ym(a,b){var c=mm(b),d=b.b;d===a.f?0>a.D.indexOf(c)&&a.D.push(c):ym(tm(a,d),b)}
function zm(a,b){var c=mm(b),d=b.b;return d===a.f?0<=a.D.indexOf(c):zm(tm(a,d),b)}function Am(a,b){return om(a.C,b.b)}function Bm(a,b,c){var d=Am(a,b).b;d!==a.f?Bm(tm(a,d),b,c):0>a.b.indexOf(b)&&(a.b.push(b),a.b.sort(function(a,b){var c=Am(this,a),d=Am(this,b);return lm(c)-lm(d)}.bind(a)));c||Cm(a)}function Dm(a,b,c){var d=Am(a,b).b;d!==a.f?Dm(tm(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.ac&&b.ac.element)&&b.parentNode&&b.parentNode.removeChild(b),c||Cm(a)))}
function Em(a,b){if(b.b!==a.f)return Em(tm(a,b.b),b);var c=mm(b),d=a.b.findIndex(function(a){return a.b===c});return 0<=d?a.b[d]:null}function Fm(a){return 0<a.b.length?!0:a.parent?Fm(a.parent):!1}function Gm(a,b,c){b.b===a.f?a.w[mm(b)]=c:Gm(tm(a,b.b),b,c)}function Hm(a,b){if(Im(a).some(function(a){return mm(a.lb)===b}))return!0;var c=a.w[b];return c?a.N&&a.N.element?a.N.element.contains(c):!1:!1}
function Jm(a,b,c,d){d=d||a.h;b.b===a.f?(c=new qm(b,c,d),d=a.g.findIndex(function(a){return a.lb===b}),0<=d?a.g.splice(d,1,c):a.g.push(c)):Jm(tm(a,b.b),b,c,d)}function Km(a){return 0<a.g.length?!0:a.parent?Km(a.parent):!1}function Lm(a,b){var c=lm(b);return a.g.some(function(a){return lm(a.lb)<c})?!0:a.parent?Lm(a.parent,b):!1}function Im(a,b){b=b||a.h;var c=a.I.filter(function(a){return!b||a.f===b});a.parent&&(c=Im(a.parent,b).concat(c));return c.sort(function(a,b){return lm(a.lb)-lm(b.lb)})}
function Mm(a,b){b=b||a.h;var c=a.g.filter(function(a){return!b||a.f===b});return a.parent?Mm(a.parent,b).concat(c):c}function Nm(a){for(var b=a.b.length-1;0<=b;b--){var c=a.b[b];if(!Hm(a,c.b)){Dm(a,c);b=Am(a,c);ym(a,b);Om(a,b);return}}for(b=a.g.length-1;0<=b;b--)Hm(a,mm(a.g[b].lb))||a.g.splice(b,1);a.I.forEach(function(a){if(!(0<=this.g.findIndex(function(b){return b?a===b?!0:a.lb===b.lb&&jk(a.b,b.b):!1}))){var b=mm(a.lb);this.b.some(function(a){return a.b===b})||this.g.push(a)}},a)}
function Cm(a){a.N&&(a.j.forEach(function(a){a.N&&a.N.element===this.N.element&&a.b.forEach(function(a){(a=a.ac.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),Qk(a.N));a.j.splice(0);Object.keys(a.w).forEach(function(a){delete this.w[a]},a);a.Rc=!0}function Pm(a){return a.Rc||!!a.parent&&Pm(a.parent)}function Qm(a,b){return dm(b,a.H.toString(),a.G.toString()||null,hm)}
function Om(a,b){var c=Qm(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];Qm(a,Am(a,e).f)===c?Dm(a,e):d++}}function Rm(a,b){if(b.b!==a.f)Rm(tm(a,b.b),b);else{var c=Qm(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];Qm(a,Am(a,e).f)===c?(a.l.push(e),a.b.splice(d,1)):d++}}}function Sm(a,b){b!==a.f?Sm(tm(a,b),b):(a.l.forEach(function(a){Bm(this,a,!0)},a),a.l.splice(0))}function Tm(a,b){b!==a.f?Tm(tm(a,b),b):a.l.splice(0)}
function Um(a,b){return b===a.f?a.l.concat().sort(function(a,b){var c=Am(this,a);return lm(Am(this,b))-lm(c)}.bind(a)):Um(tm(a,b),b)}function Vm(a,b){var c=Qm(a,b),d=dm(b,a.H.toString(),a.G.toString()||null,gm),c=Wm(a,c);if(a.parent&&a.parent.N){var e=Vm(a.parent,d);switch(d){case "top":return Math.max(c,e);case "left":return Math.max(c,e);case "bottom":return Math.min(c,e);case "right":return Math.min(c,e);default:fa("Should be unreachable")}}return c}
function Wm(a,b){var c=a.N.hb,d=a.N.ib,e=Rk(a.N),e={top:e.S-d,left:e.V-c,bottom:e.P-d,right:e.T-c},f=a.b;0<f.length&&(e=f.reduce(function(b,c){var d=Am(a,c),d=Qm(this,d.f),e=c.ac,f=b.top,g=b.left,h=b.bottom,q=b.right;switch(d){case "inline-start":e.u?f=Math.max(f,e.top+e.height):g=Math.max(g,e.left+e.width);break;case "block-start":e.u?q=Math.min(q,e.left):f=Math.max(f,e.top+e.height);break;case "inline-end":e.u?h=Math.min(h,e.top):q=Math.min(q,e.left);break;case "block-end":e.u?g=Math.max(g,e.left+
e.width):h=Math.min(h,e.top);break;default:throw Error("Unknown logical float side: "+d);}return{top:f,left:g,bottom:h,right:q}}.bind(a),e));e.left+=c;e.right+=c;e.top+=d;e.bottom+=d;switch(b){case "block-start":return a.N.u?e.right:e.top;case "block-end":return a.N.u?e.left:e.bottom;case "inline-start":return a.N.u?e.top:e.left;case "inline-end":return a.N.u?e.bottom:e.right;default:throw Error("Unknown logical side: "+b);}}
function Xm(a,b,c,d,e){if(c.b!==a.f)return Xm(tm(a,c.b),b,c,d,e);var f=Qm(a,c.f),g=Vm(a,"block-start"),h=Vm(a,"block-end"),l=Vm(a,"inline-start");a=Vm(a,"inline-end");var k=b.u?b.hb:b.ib,m=b.u?b.ib:b.hb,g=b.u?Math.min(g,b.left+b.width+k):Math.max(g,b.top+k),h=b.u?Math.max(h,b.left+k):Math.min(h,b.top+b.height+k),p;if(d){d=b.u?lg(new Vf(h,l,g,a)):new Vf(l,g,a,h);switch(f){case "block-start":case "inline-start":if(d=rg(b.J,d))b.u&&(d=mg(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.S),h=b.u?Math.max(h,d.V):
Math.min(h,d.P);else if(!e)return!1;break;case "block-end":case "inline-end":if(d=sg(b.J,d))b.u&&(d=mg(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.S),h=b.u?Math.max(h,d.V):Math.min(h,d.P);else if(!e)return!1}d=(h-g)*Mk(b);p=a-l;if(!e&&(0>=d||0>=p))return!1}else{d=b.la;var r=(h-g)*Mk(b);if(!e&&r<d)return!1;var q=b.Ze;d=Math.min(d+(b.u?q.left:q.bottom),r);"inline-start"===f||"inline-end"===f?p=Ym(b.b,b.element,[Zm])[Zm]:p=ak(b.b,b.df)[b.u?"height":"width"]+(b.u?q.top:q.left)+(b.u?q.bottom:q.right);if(!e&&
a-l<p)return!1}g-=k;h-=k;l-=m;a-=m;switch(f){case "inline-start":case "block-start":h=l;c=p;b.u?Ok(b,h,c):Pk(b,h,c);h=d;b.u?Pk(b,g+h*Mk(b),h):Ok(b,g,h);break;case "inline-end":case "block-end":g=a-p;c=p;b.u?Ok(b,g,c):Pk(b,g,c);g=h-d*Mk(b);h=d;b.u?Pk(b,g+h*Mk(b),h):Ok(b,g,h);break;default:throw Error("unknown float direction: "+c.f);}return!0}function $m(a){var b=a.b.map(function(a){return a.Td()});return a.parent?$m(a.parent).concat(b):b}
function wm(a){var b=a.N.element&&a.N.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.ac.element)})}function an(a){var b=um(a).u;return a.b.reduce(function(a,d){var c=Sk(d.ac);return b?Math.min(a,c.V):Math.max(a,c.P)},b?Infinity:0)};var bn={img:!0,svg:!0,audio:!0,video:!0};
function cn(a,b,c,d){var e=a.B;if(!e)return NaN;if(1==e.nodeType){if(a.M){var f=ak(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.M&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=dn(b,g);if(c=d){c=document.body;if(null==Va){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";w(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Va=10>h.right-h.left;c.removeChild(g)}c=Va}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=dn(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(v.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}function en(a){for(var b=Pd("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.re());}
function fn(){}fn.prototype.g=function(){return null};function gn(a,b){return{current:b.reduce(function(b,d){return b+d.g(a)},0),ae:b.reduce(function(b,d){return b+d.I(a)},0)}}function hn(a,b){this.l=a;this.w=b;this.h=!1;this.j=null}t(hn,fn);hn.prototype.f=function(a,b){if(b<this.b())return null;this.h||(this.j=jn(a,this,0<b),this.h=!0);return this.j};hn.prototype.b=function(){return this.w};function $l(a,b,c,d){this.position=a;this.D=b;this.w=this.C=c;this.la=d;this.h=!1;this.l=0}t($l,fn);
$l.prototype.f=function(a,b){this.h||(this.l=cn(this.position,a.b,0,a.u),this.h=!0);var c=this.l,d=gn(this.g(),kn(a));this.w=ln(a,c+(a.u?-1:1)*d.ae);this.C=this.position.b=ln(a,c+(a.u?-1:1)*d.current);b<this.b()?c=null:(a.la=this.la+mn(a,this),c=this.position);return c};
$l.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a=this.g())&&a.parent){var b=nn(a.parent);a=b?(b=b.b)?a&&b.b===a.L:!1:!1}else a=!1;a=a&&!this.w;return(Ol[this.D]?1:0)+(this.C&&!a?3:0)+(this.position.parent?this.position.parent.w:0)};$l.prototype.g=function(){return this.position};function on(a,b,c){this.ra=a;this.f=b;this.b=c}
function pn(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.ra>=d.ra?v.b("validateCheckPoints: incorrect boxOffset"):c.L==d.L&&(d.M?c.M&&v.b("validateCheckPoints: duplicate after points"):c.M?v.b("validateCheckPoints: inconsistent after point"):d.ra-c.ra!=d.ja-c.ja&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function qn(a){this.parent=a}qn.prototype.re=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};
qn.prototype.Fe=function(a,b){return b};qn.prototype.te=function(){};qn.prototype.se=function(){};function Xl(a,b,c,d,e){Hk.call(this,a);this.Cf=a.lastChild;this.h=b;this.b=c;this.bb=d;this.Df=a.ownerDocument;this.g=e;vm(e,this);this.Ae=null;this.We=this.af=!1;this.G=this.qb=this.za=this.X=this.U=0;this.J=this.xe=this.O=this.ya=null;this.Cb=!1;this.f=this.l=this.D=null;this.Hd=!0;this.Kc=this.Ld=this.Id=0;this.j=!0;this.Va=null;this.Sa=[];this.Z=this.Db=null}t(Xl,Hk);
function rn(a,b){return!!b.l&&(!a.af||!!b.parent)}function ln(a,b){return a.u?b<a.G:b>a.G}function sn(a){var b=$m(a.g);return a.Nb.concat(b)}Xl.prototype.Bb=function(a){var b=this,c=K("openAllViews"),d=a.pa;tn(b.h,b.element,b.We);var e=d.length-1,f=null;le(function(){for(;0<=e;){f=mk(d[e],f);e!==d.length-1||f.F||(f.F=b.Ae);if(!e){var c=f,h;h=a;h=h.Na?wk(h.Na,h.ja,1):h.ja;c.ja=h;f.M=a.M;f.Na=a.Na;if(f.M)break}c=un(b.h,f,!e&&!f.ja);e--;if(c.Ba())return c}return L(!1)}).then(function(){N(c,f)});return c.result()};
var vn=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;function wn(a,b){if(b.f&&b.Aa&&!b.M&&!b.f.count&&1!=b.B.nodeType){var c=b.B.textContent.match(vn);return xn(a.h,b,c[0].length)}return L(b)}
function yn(a,b,c){var d=K("buildViewToNextBlockEdge");me(function(d){b.B&&!zn(b)&&c.push(ok(b));wn(a,b).then(function(e){e!==b&&(b=e,zn(b)||c.push(ok(b)));Tl(a.h,b).then(function(c){if(b=c){if(!a.bb.tc(b)&&(b=b.modify(),b.b=!0,a.j)){P(d);return}rn(a,b)&&!a.u?An(a,b).then(function(a){(b=a)?O(d):P(d)}):b.Aa?O(d):P(d)}else P(d)})})}).then(function(){N(d,b)});return d.result()}
function Bn(a,b){if(!b.B)return L(b);var c=b.L,d=K("buildDeepElementView");me(function(d){wn(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.L!=c;)f=f.parent;if(!f){b=e;P(d);return}}Tl(a.h,e).then(function(e){(b=e)&&b.L!=c?a.bb.tc(b)?O(d):(b=b.modify(),b.b=!0,a.j?P(d):O(d)):P(d)})})}).then(function(){N(d,b)});return d.result()}
function Cn(a,b,c,d,e){var f=a.Df.createElement("div");a.u?(e>=a.height&&(e-=.1),w(f,"height",d+"px"),w(f,"width",e+"px")):(d>=a.width&&(d-=.1),w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.element.insertBefore(f,b);return f}function Dn(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function En(a){for(var b=a.element.firstChild,c=a.J,d=a.u?a.u?a.U:a.za:a.u?a.qb:a.U,e=a.u?a.u?a.X:a.qb:a.u?a.za:a.X,f=0;f<c.length;f++){var g=c[f],h=g.P-g.S;g.left=Cn(a,b,"left",g.V-d,h);g.right=Cn(a,b,"right",e-g.T,h)}}function Fn(a,b,c,d,e){var f;if(b&&Gn(b.B))return NaN;if(b&&b.M&&!b.Aa&&(f=cn(b,a.b,0,a.u),!isNaN(f)))return f;b=c[d];for(e-=b.ra;;){f=cn(b,a.b,e,a.u);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.za;b=c[d];1!=b.B.nodeType&&(e=b.B.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function Hn(a,b){var c=In(a.b,b),d=new Xf;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function Jn(a,b){var c=In(a.b,b),d=new Xf;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function Kn(a,b,c){if(a=In(a.b,b))c.marginLeft=X(a.marginLeft),c.borderLeft=X(a.borderLeftWidth),c.w=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.borderTop=X(a.borderTopWidth),c.C=X(a.paddingTop),c.marginRight=X(a.marginRight),c.ka=X(a.borderRightWidth),c.I=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.ha=X(a.borderBottomWidth),c.H=X(a.paddingBottom)}function Ln(a,b,c){b=new on(b,c,c);a.l?a.l.push(b):a.l=[b]}
function Mn(a,b,c,d){if(a.l&&a.l[a.l.length-1].b)return Ln(a,b,c),L(!0);var e=new Vf(a.U,a.za,a.X,a.qb),f=rg(a.J,e);f&&(d=Math.max(d,f.S*Mk(a)));d+=40*Mk(a);var g=a.O,h=!g;if(h){f=a.element.ownerDocument.createElement("div");w(f,"position","absolute");var l=a.h.clone(),k=new rm(a.g,"column",null,a.g.h,c.pa[0].node,null,null),g=new Xl(f,l,a.b,a.bb,k);g.Hd=!1;vm(k,g);a.O=g;g.u=Nn(a.h,a.u,f);g.We=!0;a.u?(g.left=0,w(g.element,"width","2em")):(g.top=a.qb,w(g.element,"height","2em"))}a.element.appendChild(g.element);
Kn(a,g.element,g);f=Mk(a)*(d-a.za);a.u?g.height=a.ya.P-a.ya.S-Ik(g)-Jk(g):g.width=a.ya.T-a.ya.V-Kk(g)-Lk(g);var m=(e=sg(a.J,e))?e.P:a.qb;d=Mk(a)*(m-d)-(a.u?Kk(g)-Lk(g):Ik(g)+Jk(g));if(h&&18>d)return a.element.removeChild(g.element),a.O=null,Ln(a,b,c),L(!0);if(!a.u&&g.top<f)return a.element.removeChild(g.element),Ln(a,b,c),L(!0);var p=K("layoutFootnoteInner");a.u?Pk(g,0,d):Ok(g,f,d);g.hb=a.hb+a.left+Kk(a);g.ib=a.ib+a.top+Ik(a);g.Nb=a.Nb;var r=new Ak(c);h?(On(g),d=L(!0)):sn(g).length?d=Pn(g):(Qn(g),
d=L(!0));d.then(function(){Zl(g,r).then(function(d){if(h&&d)a.element.removeChild(g.element),Ln(a,b,c),a.O=null,N(p,!0);else{g.la+=.01;a.u?(a.G=m+(g.la+Kk(g)+Lk(g)),Pk(g,0,g.la)):(a.G=m-(g.la+Ik(g)+Jk(g)),Ok(g,a.G-a.za,g.la));var e;!a.u&&0<sn(g).length?e=Pn(g):e=L(d);e.then(function(d){d=new on(b,c,d?d.Da:null);a.l?a.l.push(d):a.l=[d];N(p,!0)})}})});return p.result()}
function Rn(a,b){var c=K("layoutFootnote"),d=b.B;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=ak(a.b,d),f=a.u?e.left:e.bottom;d.textContent="";Sn(a.h,b,"footnote-call",d);d.textContent||(d.parentNode.removeChild(d),b.B=null);d=kk(b);e=b.ra;b=b.modify();b.M=!0;Mn(a,e,d,f).then(function(){a.O&&a.O.element.parentNode&&a.element.removeChild(a.O.element);ln(a,f)&&a.D.length&&(b.b=!0);N(c,b)});return c.result()}
function Tn(a,b){if(jm(b.J))return Un(a,b);var c=K("layoutFloat"),d=b.B,e=b.l;w(d,"float","none");w(d,"display","inline-block");w(d,"vertical-align","top");Bn(a,b).then(function(f){for(var g=ak(a.b,d),h=Hn(a,d),g=new Vf(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.U,l=a.X,k=b.parent;k&&k.Aa;)k=k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.u?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");
k.B.appendChild(m);var p=ak(a.b,m),h=Math.max(a.u?p.top:p.left,h),l=Math.min(a.u?p.bottom:p.right,l);k.B.removeChild(m);m=a.u?g.P-g.S:g.T-g.V;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.B.appendChild(b.B)}m=new Vf(h,Mk(a)*a.za,l,Mk(a)*a.qb);h=g;a.u&&(h=lg(g));l=Mk(a);h.S<a.Kc*l&&(p=h.P-h.S,h.S=a.Kc*l,h.P=h.S+p);a:for(var l=a.J,p=h,r=p.S,q=p.T-p.V,z=p.P-p.S,u=qg(l,r);;){var A=r+z;if(A>m.P)break a;for(var H=m.V,G=m.T,I=u;I<l.length&&l[I].S<A;I++){var J=l[I];J.V>H&&(H=J.V);J.T<G&&(G=J.T)}if(H+q<=
G||u>=l.length){"left"==e?(p.V=H,p.T=H+q):(p.V=G-q,p.T=G);p.P+=r-p.S;p.S=r;break a}r=l[u].P;u++}a.u&&(g=mg(h));a:{m=In(a.b,d);l=new Xf;if(m){if("border-box"==m.boxSizing){m=Hn(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}w(d,"width",g.T-g.V-m.left-m.right+"px");w(d,"height",g.P-
g.S-m.top-m.bottom+"px");w(d,"position","absolute");w(d,"display",b.display);l=null;if(k)if(k.O)l=k;else a:{for(k=k.parent;k;){if(k.O){l=k;break a}k=k.parent}l=null}l?(m=l.B.ownerDocument.createElement("div"),m.style.position="absolute",l.u?m.style.right="0":m.style.left="0",m.style.top="0",l.B.appendChild(m),k=ak(a.b,m),l.B.removeChild(m)):k={left:a.u?a.qb:a.U,right:a.u?a.za:a.X,top:a.u?a.U:a.za};(l?l.u:a.u)?w(d,"right",k.right-g.T+a.I+"px"):w(d,"left",g.V-k.left+a.w+"px");w(d,"top",g.S-k.top+a.C+
"px");b.G&&(b.G.parentNode.removeChild(b.G),b.G=null);k=a.u?g.V:g.P;g=a.u?g.T:g.S;if(ln(a,k)&&a.D.length)b=b.modify(),b.b=!0,N(c,b);else{Dn(a);m=new Vf(a.u?a.qb:a.U,a.u?a.U:a.za,a.u?a.za:a.X,a.u?a.X:a.qb);a.u&&(m=lg(m));l=a.J;for(h=[new Zf(h.S,h.P,h.V,h.T)];0<h.length&&h[0].P<=m.S;)h.shift();if(h.length){h[0].S<m.S&&(h[0].S=m.S);p=l.length?l[l.length-1].P:m.S;p<m.P&&l.push(new Zf(p,m.P,m.V,m.T));r=qg(l,h[0].S);for(q=0;q<h.length;q++){z=h[q];if(r==l.length)break;l[r].S<z.S&&(p=l[r],r++,l.splice(r,
0,new Zf(z.S,p.P,p.V,p.T)),p.P=z.S);for(;r<l.length&&(p=l[r++],p.P>z.P&&(l.splice(r,0,new Zf(z.P,p.P,p.V,p.T)),p.P=z.P),z.V!=z.T&&("left"==e?p.V=Math.min(z.T,m.T):p.T=Math.max(z.V,m.V)),p.P!=z.P););}pg(m,l)}En(a);"left"==e?a.Id=k:a.Ld=k;a.Kc=g;Vn(a,k);N(c,f)}});return c.result()}
function Wn(a,b){var c=a.element.ownerDocument.createElement("div");w(c,"position","absolute");var d=xm(a.g,b.b),e=new rm(d,"column",null,a.g.h,b.L,null,null),d=um(d),c=new Xn(b,c,a.h.clone(),a.b,a.bb,e,d);vm(e,c);var f=a.g,e=um(f,b.b),g=Rk(e),d=c.element;e.element.parentNode.appendChild(d);Nk(c,e);c.element=d;c.af=!0;c.width=g.T-g.V;c.height=g.P-g.S;c.marginLeft=c.marginRight=c.marginTop=c.marginBottom=0;c.borderLeft=c.ka=c.borderTop=c.ha=0;c.w=c.I=c.C=c.H=0;Pk(c,g.V-e.hb,c.width);Ok(c,g.S-e.ib,
c.height);c.Nb=(e.Nb||[]).concat();c.Hd=!Fm(f);c.Oa=null;On(c);(f=Xm(f,c,b,!0,!Fm(f)))?(Dn(c),On(c)):e.element.parentNode.removeChild(d);return f?c:null}
function Yn(a,b,c){var d=a.g;Rm(d,c);var e=Wn(a,c);if(!e)return Sm(d,c.b),Jm(d,c,b),L(null);var f=new Ak(b),g=K("layoutPageFloatInner");Zl(e,f,!0).then(function(f){if(f&&Fm(d))Sm(d,c.b),Jm(d,c,b),e.element.parentNode.removeChild(e.element),N(g,null);else if(Xm(d,e,c,!1,!Fm(d))){var h=new pm(c,b,e);Bm(d,h,!0);Zn(a,c.b).then(function(a){a?(Bm(d,h),Tm(d,c.b),f&&Jm(d,c,f.Da),N(g,e)):(Dm(d,h,!0),Sm(d,c.b),Jm(d,c,b),N(g,null))})}else Sm(d,c.b),Jm(d,c,b),e.element.parentNode.removeChild(e.element),N(g,null)});
return g.result()}
function Zn(a,b){var c=a.g,d=Um(c,b),e=[],f=[],g=!1,h=K("layoutStashedPageFloats"),l=0;me(function(b){if(l>=d.length)P(b);else{var h=d[l],k=Am(c,h),r=h.f,q=Wn(a,k);q?(e.push(q),Zl(q,new Ak(r),!0).then(function(a){a?(g=!0,P(b)):Xm(c,q,k,!1,!1)?(a=new pm(k,r,q),Bm(c,a,!0),f.push(a),l++,O(b)):(g=!0,P(b))})):(g=!0,P(b))}}).then(function(){g?(f.forEach(function(a){Dm(c,a,!0)}),e.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):d.forEach(function(a){(a=a.ac.element)&&a.parentNode&&
a.parentNode.removeChild(a)});N(h,!g)});return h.result()}function $n(a){var b=a.B.parentNode,c=b.ownerDocument.createElement("span");c.setAttribute("data-adapt-spec","1");b.appendChild(c);b.removeChild(a.B);a=a.modify();a.M=!0;a.B=c;return a}
function ao(a,b,c,d){var e=K("resolveFloatReferenceFromColumnSpan"),f=a.g,g=xm(f,"region");um(f).width<um(g).width&&"column"===b?c===Lc?Bn(a,ok(d)).then(function(c){var d=c.B;c=Ym(a.b,d,[bo])[bo];d=Hn(a,d);c=a.u?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?N(e,"region"):N(e,b)}):c===Jc?N(e,"region"):N(e,b):N(e,b);return e.result()}
function Un(a,b){var c=a.g,d=b.J,e=b.L,f=b.l,g=c.De(e);return(g?L(g):ao(a,d,b.X,b).na(function(a){d=a;g=new km(e,d,f);c.ve(g);return L(g)})).na(function(d){var e=kk(b),f=$n(b);return Em(c,d)?(Gm(c,d,f.B),L(f)):zm(c,d)||Lm(c,d)?(Jm(c,d,e),Gm(c,d,f.B),L(f)):a.Z?L(null):Yn(a,e,d).na(function(a){if(a)return L(null);Gm(c,d,f.B);return L(f)})})}
function co(a,b){if(!a.M||a.Aa){for(var c=a.B,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.B,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Wa){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Wa=27>g.getBoundingClientRect().right;f.removeChild(h)}Wa?a.u?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.u?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.M||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function eo(a,b,c,d){var e=K("processLineStyling");pn(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.Lf);me(function(d){if(h){var e=fo(a,f),l=h.count-g;if(e.length<=l)P(d);else{var p=go(a,f,e[l-1]);p?a.Ha(p,!1,!1).then(function(){g+=l;xn(a.h,p,0).then(function(e){b=e;co(b,!1);h=b.f;f=[];yn(a,b,f).then(function(a){c=a;O(d)})})}):P(d)}}else P(d)}).then(function(){Array.prototype.push.apply(d,f);pn(d);N(e,c)});return e.result()}
function ho(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.M||!f.B||1!=f.B.nodeType)break;f=Hn(a,f.B);f=a.u?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function io(a,b){var c=K("layoutBreakableBlock"),d=[];yn(a,b,d).then(function(e){var f=d.length-1;if(0>f)N(c,e);else{var f=Fn(a,e,d,f,d[f].ra),g=!1;if(!e||!Gn(e.B)){var h=gn(e,kn(a)),g=ln(a,f+(a.u?-1:1)*h.ae);ln(a,f+(a.u?-1:1)*h.current)&&!a.Z&&(a.Z=e)}e||(f+=ho(a,d));Vn(a,f);var l;b.f?l=eo(a,b,e,d):l=L(e);l.then(function(b){0<d.length&&(a.D.push(new hn(d,d[0].w)),g&&(2!=d.length&&0<a.D.length||d[0].L!=d[1].L||!bn[d[0].L.localName])&&b&&(b=b.modify(),b.b=!0));N(c,b)})}});return c.result()}
function go(a,b,c){pn(b);for(var d=0,e=b[0].ra,f=d,g=b.length-1,h=b[g].ra,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].ra>l?k=m-1:f=m}k=Fn(a,null,b,f,l);if(a.u?k<c:k>c){for(h=l-1;b[f].ra==l;)f--;g=f}else Vn(a,k),e=l,d=f}a=b[f];b=a.B;1!=b.nodeType?(jo(a),a.M?a.ja=b.length:(c=e-a.ra,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.C?"":a.h||a.parent&&a.parent.h||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.C&&Ia(d)&&Ia(f)?
a.h||a.parent&&a.parent.h||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ja+=e,a.g=null)),e=a):e=a;return e}function jo(a){Pd("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},ko)}var ko=new function(){};function zn(a){return a?(a=a.B)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function fo(a,b){for(var c=[],d=b[0].B,e=b[b.length-1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var r=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:r=d.firstChild;r||(r=d.nextSibling,r||(h=!0,r=d.parentNode));d=r}while(p&&m);if(k){g.setEndAfter(l);k=dn(a.b,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.u?ik:hk);l=d=h=g=e=0;for(m=Mk(a);;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.u?k.right-
k.left:k.bottom-k.top,1),p=m*(a.u?k.right:k.top)<m*e?m*((a.u?k.left:k.bottom)-e)/p:m*(a.u?k.left:k.bottom)>m*g?m*(g-(a.u?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.u?k.top:k.left)>=h-1)){h=a.u?k.bottom:k.right;a.u?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ma);a.u&&c.reverse();return c}
function lo(a,b){if(!a.l)return L(!0);for(var c=!1,d=a.l.length-1;0<=d;--d){var e=a.l[d];if(e.ra<=b)break;a.l.pop();e.b!==e.f&&(c=!0)}if(!c)return L(!0);var f=K("clearFootnotes"),g=a.la+a.za,h=a.l;a.O=null;a.l=null;var l=0;le(function(){for(;l<h.length;){var b=h[l++],b=Mn(a,b.ra,b.f,g);if(b.Ba())return b}return L(!1)}).then(function(){N(f,!0)});return f.result()}
function Wl(a,b){var c=0;yk(b,function(a){if("clone"===a.wb["box-decoration-break"]){var b=Jn(this,a.B);c+=a.u?-b.left:b.bottom;"table"===a.display&&(c+=a.Md)}}.bind(a));return c}function mn(a,b){return(b?gn(b.g(),kn(a)):gn(null,kn(a))).current}
function jn(a,b,c){for(var d=b.l,e=d[0];e.parent&&e.Aa;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.wb.widows||2)-0,1),f=Math.max((e.wb.orphans||2)-0,1));var e=Wl(a,e),g=fo(a,d),h=a.G-e,d=mn(a,b),h=h-Mk(a)*d,e=La(g.length,function(b){return a.u?g[b]<h:g[b]>h}),e=Math.min(g.length-c,e);if(e<f)return null;h=g[e-1];if(b=go(a,b.l,h))a.la=Mk(a)*(h-a.za)+d;return b}Xl.prototype.Ha=function(a,b,c){var d=en(a.F).Ha(this,a,b,c);d||(d=mo.Ha(this,a,b,c));return d};
Xl.prototype.fc=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.D.length-1;0<=e&&!b;--e){var a=this.D[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{we:b?a:null,A:b}};
function no(a,b,c,d,e){if(Pm(a.g)||a.f||!c)return L(b);var f=K("doFinishBreak"),g=!1;if(!b){v.b("Could not find any page breaks?!!");if(a.Hd)return oo(a,c).then(function(b){b?(b=b.modify(),b.b=!1,a.Ha(b,g,!0).then(function(){N(f,b)})):N(f,b)}),f.result();b=d;g=!0;a.la=e}a.Ha(b,g,!0).then(function(){N(f,b)});return f.result()}function po(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function qo(a,b,c,d,e){if(!b||Gn(b.B))return!1;var f=cn(b,a.b,0,a.u),g=gn(b,kn(a)),h=ln(a,f+(a.u?-1:1)*g.ae);ln(a,f+(a.u?-1:1)*g.current)&&!a.Z&&(a.Z=b);c&&(f+=ho(a,c));Vn(a,f);if((d=a.j?d:!0)||!h)c=ok(b),b=en(b.F).Ve(c,e,h,a.la),a.D.push(b);return h}
function ro(a,b){if(b.B.parentNode){var c=Hn(a,b.B),d=b.B.ownerDocument.createElement("div");a.u?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.B.parentNode.insertBefore(d,b.B);var e=ak(a.b,d),e=a.u?e.right:e.top,f=Mk(a),g;switch(b.D){case "left":g=a.Id;break;case "right":g=a.Ld;break;default:g=f*Math.max(a.Ld*f,a.Id*f)}e*f>=g*f?b.B.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.u?d.style.width=
e+"px":d.style.height=e+"px",e=ak(a.b,d),e=a.u?e.left:e.bottom,a.u?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.G=d)}}function to(a){return a instanceof qn?!0:a instanceof uo?!1:a instanceof vo?!0:!1}
function wo(a,b,c,d){function e(){return!!d||!c&&!!hl[m]}function f(){b=r[0]||b;b.B.parentNode.removeChild(b.B);h.f=m}var g=b.M?b.parent&&b.parent.F:b.F;if(g&&!to(g))return L(b);var h=a,l=K("skipEdges"),k=!d&&c&&b&&b.M,m=d,p=null,r=[],q=[],z=!1;me(function(a){for(;b;){var d=en(b.F);do if(b.B){if(b.Aa&&1!=b.B.nodeType){if(ck(b.B,b.$b))break;if(!b.M){e()?f():qo(h,p,null,!0,m)?(b=(h.j?p||b:b).modify(),b.b=!0):(b=b.modify(),b.g=m);P(a);return}}if(!b.M){if(d&&d.ue(b))break;b.D&&ro(h,b);if(!to(b.F)||b.F instanceof
vo||rn(h,b)||b.I){r.push(ok(b));m=fl(m,b.g);if(e())f();else if(qo(h,p,null,!0,m)||!h.bb.tc(b))b=(h.j?p||b:b).modify(),b.b=!0;P(a);return}}if(1==b.B.nodeType){var g=b.B.style;if(b.M){if(!d||!d.Re(b,h.j)){if(z){if(e()){f();P(a);return}r=[];k=c=!1;m=null}z=!1;p=ok(b);q.push(p);m=fl(m,b.H);if(g&&(!po(g.paddingBottom)||!po(g.borderBottomWidth))){if(qo(h,p,null,!0,m)&&(b=(h.j?p||b:b).modify(),b.b=!0,h.j)){P(a);return}q=[p];p=null}}}else{r.push(ok(b));m=fl(m,b.g);if(!h.bb.tc(b)&&(qo(h,p,null,!1,m),b=b.modify(),
b.b=!0,h.j)){P(a);return}if(bn[b.B.localName]){e()?f():qo(h,p,null,!0,m)&&(b=(h.j?p||b:b).modify(),b.b=!0);P(a);return}!g||po(g.paddingTop)&&po(g.borderTopWidth)||(k=!1,q=[]);z=!0}}}while(0);d=Tl(h.h,b,k);if(d.Ba()){d.then(function(c){b=c;O(a)});return}b=d.get()}qo(h,p,q,!1,m)?p&&h.j&&(b=p.modify(),b.b=!0):hl[m]&&(h.f=m);P(a)}).then(function(){p&&(h.Va=vk(p));N(l,b)});return l.result()}
function oo(a,b){var c=ok(b),d=K("skipEdges"),e=null,f=!1;me(function(d){for(;b;){do if(b.B){if(b.Aa&&1!=b.B.nodeType){if(ck(b.B,b.$b))break;if(!b.M){hl[e]&&(a.f=e);P(d);return}}if(!b.M&&(rn(a,b)||b.I)){e=fl(e,b.g);hl[e]&&(a.f=e);P(d);return}if(1==b.B.nodeType){var g=b.B.style;if(b.M){if(f){if(hl[e]){a.f=e;P(d);return}e=null}f=!1;e=fl(e,b.H)}else{e=fl(e,b.g);if(bn[b.B.localName]){hl[e]&&(a.f=e);P(d);return}if(g&&(!po(g.paddingTop)||!po(g.borderTopWidth))){P(d);return}}f=!0}}while(0);g=Tl(a.h,b);if(g.Ba()){g.then(function(a){b=
a;O(d)});return}b=g.get()}c=null;P(d)}).then(function(){N(d,c)});return d.result()}function An(a,b){return"footnote"==b.l?Rn(a,b):Tn(a,b)}function xo(a,b,c,d){var e=K("layoutNext");wo(a,b,c,d||null).then(function(d){b=d;!b||a.f||a.j&&b&&b.b?N(e,b):en(b.F).Jd(b,a,c).Ea(e)});return e.result()}function yo(a,b,c){if(b)for(var d=b.parent;b;b=d,d=d?d.parent:null)en((d||b).F).hd(a,d,b,c),c=!1}
function Qn(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.C+"px";b.style.right=a.I+"px";b.style.bottom=a.H+"px";b.style.left=a.w+"px";a.element.appendChild(b);var c=ak(a.b,b);a.element.removeChild(b);var b=a.hb+a.left+Kk(a),d=a.ib+a.top+Ik(a);a.ya=new Vf(b,d,b+a.width,d+a.height);a.U=c?a.u?c.top:c.left:0;a.X=c?a.u?c.bottom:c.right:0;a.za=c?a.u?c.right:c.top:0;a.qb=c?a.u?c.left:c.bottom:0;a.Id=a.za;a.Ld=a.za;a.Kc=a.za;a.G=a.qb;var c=a.ya,e,b=a.hb+a.left+
Kk(a),d=a.ib+a.top+Ik(a);e=new Vf(b,d,b+a.width,d+a.height);if(a.Oa){b=a.Oa;d=e.V;e=e.S;for(var f=[],g=0;g<b.b.length;g++){var h=b.b[g];f.push(new Wf(h.f+d,h.b+e))}b=new ag(f)}else b=dg(e.V,e.S,e.T,e.P);a.J=og(c,[b],sn(a),a.vb,a.u);En(a);a.l=null}function On(a){a.xe=[];w(a.element,"width",a.width+"px");w(a.element,"height",a.height+"px");Qn(a);a.la=0;a.Cb=!1;a.f=null;a.Va=null}function Vn(a,b){isNaN(b)||(a.la=Math.max(Mk(a)*(b-a.za),a.la))}
function zo(a,b){var c=b.b;if(!c)return L(!0);var d=K("layoutOverflownFootnotes"),e=0;le(function(){for(;e<c.length;){var b=c[e++],b=Mn(a,0,b,a.za);if(b.Ba())return b}return L(!1)}).then(function(){N(d,!0)});return d.result()}
function Zl(a,b,c,d){a.xe.push(b);b.Da.M&&(a.Va=b.Da);if(a.j&&a.Cb)return L(b);var e=K("layout");zo(a,b).then(function(){a.Bb(b.Da).then(function(b){var f=null;if(b.B)f=ok(b);else{var h=function(b){b.A.B&&(f=b.A,a.h.removeEventListener("nextInTree",h))};a.h.addEventListener("nextInTree",h)}var l=new Ao(c,d);bm(l,b,a).then(function(b){no(a,b,l.w.sd,f,l.b).then(function(b){var c=null;a.Db?c=L(null):c=Bo(a,b);c.then(function(){if(Pm(a.g))N(e,null);else{var c=a.O;c&&(a.element.appendChild(c.element),
a.u?a.la=this.za-this.qb:a.la=c.top+Ik(c)+c.la+Jk(c));if(b){a.Cb=!0;c=new Ak(vk(b));if(a.l){for(var d=[],f=0;f<a.l.length;f++){var g=a.l[f].b;g&&d.push(g)}c.b=d.length?d:null}N(e,c)}else N(e,null)}}.bind(this))})})})});return e.result()}function Bo(a,b){var c=K("resetConstraints"),d=0;le(function(){return d<this.Sa.length?this.Sa[d++].Ha(b,this).Ec(!0):L(!1)}.bind(a)).then(function(){N(c,!0)});return c.result()}
function Co(a,b,c,d){var e=K("doLayout"),f=null;a.D=[];a.Z=null;me(function(e){for(;b;){var g=!0;xo(a,b,c,d||null).then(function(h){c=!1;d=null;a.Z&&a.j?(a.f=null,b=a.Z,b.b=!0):b=h;Pm(a.g)?P(e):a.f?P(e):b&&a.j&&b&&b.b?(f=b,b=a.fc().A,P(e)):g?g=!1:O(e)});if(g){g=!1;return}}a.la+=mn(a);P(e)}).then(function(){N(e,{A:b,sd:f})});return e.result()}
function Pn(a){for(var b=a.xe,c=a.element.lastChild;c!=a.Cf;){var d=c.previousSibling;a.element===c.parentNode&&c.getAttribute("data-adapt-pseudo")||a.element.removeChild(c);c=d}Dn(a);On(a);var e=K("redoLayout"),f=0,g=null,h=!0;me(function(c){if(f<b.length){var d=b[f++];Zl(a,d,h).then(function(a){h=!1;a?(g=a,P(c)):O(c)})}else P(c)}).then(function(){N(e,g)});return e.result()}function Gn(a){for(;a;){if(a.parentNode===a.ownerDocument)return!1;a=a.parentNode}return!0}
function Ao(a,b){am.call(this);this.Pb=a;this.J=b||null;this.G=null;this.b=0;this.D=!1;this.w={sd:null}}t(Ao,am);Ao.prototype.j=function(){return new Do(this.Pb,this.J,this.w)};Ao.prototype.I=function(a,b){b.Sa=[];b.Db||(Eo=[])};Ao.prototype.l=function(a,b){am.prototype.l.call(this,a,b);this.G=b.f;this.b=b.la;this.D=b.Cb};Ao.prototype.f=function(a,b){am.prototype.f.call(this,a,b);b.f=this.G;b.la=this.b;b.Cb=this.D};function Do(a,b,c){this.Pb=a;this.h=b;this.g=c}
Do.prototype.b=function(a,b){var c=K("adapt.layout.DefaultLayoutMode.doLayout");Co(b,a,this.Pb,this.h).then(function(a){this.g.sd=a.sd;N(c,a.A)}.bind(this));return c.result()};Do.prototype.f=function(a,b){return Pm(b.g)||b.f||0>=b.Sa.length?!0:b.Sa.every(function(c){return c.tc(a,this.g.sd,b)}.bind(this))};Do.prototype.lc=function(a,b,c,d){d||c.Sa.some(function(b){return b.be(a)});c.Sa.forEach(function(e){e.lc(d,a,b,c)})};function Fo(){}n=Fo.prototype;
n.Jd=function(a,b){var c;if(rn(b,a))c=An(b,a);else{a:if(a.M)c=!0;else{switch(a.L.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.I}c=c?io(b,a):Bn(b,a)}return c};n.Ve=function(a,b,c,d){return new $l(ok(a),b,c,d)};n.ue=function(){return!1};n.Re=function(){return!1};n.hd=function(a,b,c,d){if(c.B&&c.B.parentNode){a=c.B.parentNode;b=c.B;if(a)for(var e;(e=a.lastChild)!=b;)a.removeChild(e);d&&a.removeChild(c.B)}};
n.Ha=function(a,b,c,d){c=c||!!b.B&&1==b.B.nodeType&&!b.M;yo(a,b,c);d&&(co(b,!0),Go(c?b:b.parent));return lo(a,b.ra)};var mo=new Fo;Od("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.F?null:b&&a.F!==b.F?null:a.Oc||!a.F&&jl(c,d,e,f).display===Mc?new qn(b?b.F:null):null});Od("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof qn?mo:null});function Xn(a,b,c,d,e,f,g){Xl.call(this,b,c,d,e,f);this.lb=a;this.cf=g;this.Ze=this.df=null}t(Xn,Xl);
Xn.prototype.Bb=function(a){return Xl.prototype.Bb.call(this,a).na(function(a){a&&Ho(this,a);return L(a)}.bind(this))};
function Ho(a,b){function c(a,b){a.forEach(function(a){var c=Aa(d,a);c&&"%"===c.charAt(c.length-1)&&w(d,a,b*parseFloat(c)/100+"px")})}for(;b.parent;)b=b.parent;var d=a.df=b.B,e=Rk(a.cf),f=e.T-e.V,e=e.P-e.S;c(["width","max-width","min-width"],f);c(["height","max-height","min-height"],e);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?e:f);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===
Aa(d,a)&&w(d,a,"0")});a.Ze=Hn(a,d);f=a.lb.f;if(a.cf.u){if("block-end"===f||"left"===f)f=Aa(d,"height"),""!==f&&"auto"!==f&&w(d,"margin-top","auto")}else if("block-end"===f||"bottom"===f)f=Aa(d,"width"),""!==f&&"auto"!==f&&w(d,"margin-left","auto")};function Io(a,b){this.b=a;this.aa=b}function Jo(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Ko(a,b){this.b=a;this.f=b}function Lo(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Mo(a,b){this.rc=a;this.Xc=b;this.fe=null;this.aa=this.R=-1}function bj(a,b,c){b=a.b.J.me(b,a.f);a.b.l[b]=c}function No(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}
function Oo(a,b){var c=a.b.J.cd(oa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}function Hi(a,b,c){return new vb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Ji(a,b,c){return new vb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function Po(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.C=b;for(b=0;d.C&&(b+=5E3,wl(d,b,0)!==Number.POSITIVE_INFINITY););d.C=null}e=a.b.l[c]}return e||null}
function Li(a,b,c,d){var e=No(b),f=Oo(a,b),g=Po(a,e,f,!1);return g&&g[c]?(b=g[c],new tb(a.j,d(b[b.length-1]||null))):new vb(a.f,function(){if(g=Po(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.C[f]||null)return Qo(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Ro(a.b,f,!1);return"??"}Ro(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Ni(a,b,c,d){var e=No(b),f=Oo(a,b);return new vb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.C[f]||null;if(b){Qo(a.b,f);var b=b[c]||[],h=Po(a,e,f,!0)[c]||[];return d(b.concat(h))}Ro(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function So(a){this.J=a;this.l={};this.C={};this.b={};this.b.page=[0];this.H={};this.G=[];this.D={};this.j=null;this.w=[];this.g=[];this.I=[];this.f={};this.h={}}function To(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function Uo(a,b,c){a.H=Lo(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=zg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=zg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function Vo(a,b){a.G.push(a.b);a.b=Lo(b)}
function Qo(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.rc===b?(g.Xc=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Ro(a,b,!0)}function Ro(a,b,c){a.w.some(function(a){return a.rc===b})||a.w.push(new Mo(b,c))}
function Wo(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=Lo(a.b);d.forEach(function(a){this.C[a]=e;var d=this.D[a];if(d&&d.aa<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.Xc=!1,f.push(g)}this.D[a]={R:b,aa:c}},a)}for(var d=a.H,f;f=a.w.shift();){f.fe=d;f.R=b;f.aa=c;var g;f.Xc?(g=a.h[f.rc])||(g=a.h[f.rc]=[]):(g=a.f[f.rc])||(g=a.f[f.rc]=[]);g.every(function(a){return!(f===a||a&&f.rc===a.rc&&f.Xc===a.Xc&&f.R===a.R&&f.aa===a.aa)})&&g.push(f)}a.j=null}
function Xo(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.R-b.R||a.aa-b.aa});var d=[],e=null;c.forEach(function(a){e&&e.R===a.R&&e.aa===a.aa?e.ud.push(a):(e={R:a.R,aa:a.aa,fe:a.fe,ud:[a]},d.push(e))});return d}function Yo(a,b){a.I.push(a.g);a.g=b}
Io.prototype.tc=function(a){if(!a||a.M)return!0;a=a.B;if(!a||1!==a.nodeType)return!0;a=a.getAttribute("id")||a.getAttribute("name");return a&&(this.b.h[a]||this.b.f[a])?(a=this.b.D[a])?this.aa>=a.aa:!0:!0};var Zo=1;function $o(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Vb=c;this.Fa=d;this.parent=e;this.l="p"+Zo++;e&&(this.index=e.j.length,e.j.push(this))}$o.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};$o.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function ap(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function bp(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function cp(a){$o.call(this,a,null,null,[],null);this.b.width=new V(Hd,0);this.b.height=new V(Id,0)}t(cp,$o);
function dp(a,b){this.g=b;var c=this;sb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.w[d[1]];if(e&&(e=this.Oa[e])){if(b){var d=d[2],h=e.ha[d];if(h)e=h;else{switch(d){case "columns":var h=e.b.f,l=new kc(h,0),k=ep(e,"column-count"),m=ep(e,"column-width"),p=ep(e,"column-gap"),h=y(h,mc(h,new hc(h,"min",[l,k]),x(h,m,p)),p)}h&&(e.ha[d]=h);e=h}}else e=ep(e,d[2]);return e}}return null})}t(dp,sb);
function fp(a,b,c,d,e,f,g){a=a instanceof dp?a:new dp(a,this);$o.call(this,a,b,c,d,e);this.g=this;this.W=f;this.$=g;this.b.width=new V(Hd,0);this.b.height=new V(Id,0);this.b["wrap-flow"]=new V(Lc,0);this.b.position=new V(qd,0);this.b.overflow=new V(Ed,0);this.w={}}t(fp,$o);fp.prototype.h=function(a){return new gp(a,this)};fp.prototype.clone=function(a){a=new fp(this.f,this.name,a.Vb||this.Vb,this.Fa,this.parent,this.W,this.$);ap(this,a);bp(this,a);return a};
function hp(a,b,c,d,e){$o.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l);this.b["wrap-flow"]=new V(Lc,0)}t(hp,$o);hp.prototype.h=function(a){return new ip(a,this)};hp.prototype.clone=function(a){a=new hp(a.parent.f,this.name,this.Vb,this.Fa,a.parent);ap(this,a);bp(this,a);return a};function jp(a,b,c,d,e){$o.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l)}t(jp,$o);jp.prototype.h=function(a){return new kp(a,this)};
jp.prototype.clone=function(a){a=new jp(a.parent.f,this.name,this.Vb,this.Fa,a.parent);ap(this,a);bp(this,a);return a};function Y(a,b,c){return b&&b!==Lc?b.ta(a,c):null}function lp(a,b,c){return b&&b!==Lc?b.ta(a,c):a.b}function mp(a,b,c){return b?b===Lc?null:b.ta(a,c):a.b}function np(a,b,c,d){return b&&c!==F?b.ta(a,d):a.b}function op(a,b,c){return b?b===Fd?a.j:b===Xc?a.h:b.ta(a,a.b):c}
function pp(a,b){this.f=a;this.b=b;this.J={};this.style={};this.C=this.D=null;this.w=[];this.O=this.U=this.g=this.h=!1;this.H=this.I=0;this.G=null;this.ka={};this.ha={};this.ya=this.u=!1;a&&a.w.push(this)}function qp(a){a.I=0;a.H=0}function rp(a,b,c){b=ep(a,b);c=ep(a,c);if(!b||!c)throw Error("E_INTERNAL");return x(a.b.f,b,c)}
function ep(a,b){var c=a.ka[b];if(c)return c;var d=a.style[b];d&&(c=d.ta(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c=ep(a,"left");break;case "margin-top-edge":c=ep(a,"top");break;case "margin-right-edge":c=rp(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=rp(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=rp(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=rp(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
rp(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=rp(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=rp(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=rp(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=rp(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=rp(a,"bottom-edge","padding-bottom");break;case "left-edge":c=rp(a,"padding-left-edge","padding-left");break;case "top-edge":c=
rp(a,"padding-top-edge","padding-top");break;case "right-edge":c=rp(a,"left-edge","width");break;case "bottom-edge":c=rp(a,"top-edge","height")}if(!c){if("extent"==b)d=a.u?"width":"height";else if("measure"==b)d=a.u?"height":"width";else{var e=a.u?xh:yh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=ep(a,d))}c&&(a.ka[b]=c);return c}
function sp(a){var b=a.b.f,c=a.style,d=op(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new fc(b,"page-number"),d=lc(b,d,new Yb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-height"),e)));d=a.X(d);c.enabled=new E(d)}pp.prototype.X=function(a){return a};
pp.prototype.Xd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ta(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=np(a,b["border-left-width"],b["border-left-style"],c),g=lp(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=lp(a,b["padding-right"],c),m=np(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),r=Y(a,b.right,c),q=x(a,f,g),z=x(a,f,k);d&&r&&h?(q=y(a,c,x(a,h,x(a,x(a,d,q),z))),e?p?r=y(a,q,p):p=y(a,q,x(a,r,e)):(q=y(a,q,
r),p?e=y(a,q,p):p=e=mc(a,q,new tb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||r||h||(d=a.b),d||h?d||r?h||r||(h=this.D,this.h=!0):d=a.b:(h=this.D,this.h=!0),q=y(a,c,x(a,x(a,e,q),x(a,p,z))),this.h&&(l||(l=y(a,q,d?d:r)),this.u||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.h=!1)),d?h?r||(r=y(a,q,x(a,d,h))):h=y(a,q,x(a,d,r)):d=y(a,q,x(a,r,h)));a=lp(a,b["snap-width"]||(this.f?this.f.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(p);b.right=new E(r);b["snap-width"]=new E(a)};
pp.prototype.Yd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ta(a,null):null,d=this.f?this.f.style.height.ta(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=np(a,b["border-top-width"],b["border-top-style"],c),h=lp(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=lp(a,b["padding-bottom"],c),p=np(a,b["border-bottom-width"],b["border-bottom-style"],c),r=Y(a,b["margin-bottom"],c),q=Y(a,b.bottom,d),z=x(a,g,h),u=x(a,p,m);e&&q&&l?(d=y(a,d,x(a,l,x(a,x(a,e,z),
u))),f?r?q=y(a,d,f):r=y(a,d,x(a,q,f)):(d=y(a,d,q),r?f=y(a,d,r):r=f=mc(a,d,new tb(a,.5)))):(f||(f=a.b),r||(r=a.b),e||q||l||(e=a.b),e||l?e||q?l||q||(l=this.C,this.g=!0):e=a.b:(l=this.C,this.g=!0),d=y(a,d,x(a,x(a,f,z),x(a,r,u))),this.g&&(k||(k=y(a,d,e?e:q)),this.u&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.g=!1)),e?l?q||(q=y(a,d,x(a,e,l))):l=y(a,d,x(a,q,e)):e=y(a,d,x(a,q,l)));a=lp(a,b["snap-height"]||(this.f?this.f.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(p);b["margin-bottom"]=new E(r);b.bottom=new E(q);b["snap-height"]=new E(a)};
function tp(a){var b=a.b.f,c=a.style;a=Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==md?f.ta(b,null):null)||(f=new ec(b,1,"em"));d&&!e&&(e=new hc(b,"floor",[nc(b,x(b,a,f),x(b,d,f))]),e=new hc(b,"max",[b.f,e]));e||(e=b.f);d=y(b,nc(b,x(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function up(a,b,c,d){a=a.style[b].ta(a.b.f,null);return Hb(a,c,d,{})}
function vp(a,b){b.Oa[a.b.l]=a;var c=a.b.f,d=a.style,e=a.f?wp(a.f,b):null,e=oj(a.J,b,e,!1);a.u=nj(e,b,a.f?a.f.u:!1);pj(e,d,a.u,function(a,b){return b.value});a.D=new vb(c,function(){return a.I},"autoWidth");a.C=new vb(c,function(){return a.H},"autoHeight");a.Xd();a.Yd();tp(a);sp(a)}function xp(a,b,c){(a=a.style[c])&&(a=Uf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Uf(b,a,c));return Hc(a,b)}
function wp(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function yp(a,b,c,d,e){if(a=xp(a,b,d))a.ic()&&zb(a.ga)&&(a=new D(Hc(a,b),"px")),"font-family"===d&&(a=Il(e,a)),w(c,d,a.toString())}
function zp(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Pk(c,d,a);w(c.element,"margin-left",e+"px");w(c.element,"padding-left",f+"px");w(c.element,"border-left-width",g+"px");c.marginLeft=e;c.borderLeft=g;c.w=f}
function Ap(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.element,"margin-right",f+"px");w(c.element,"padding-right",g+"px");w(c.element,"border-right-width",b+"px");c.marginRight=f;c.ka=b;a.u&&0<e&&(a=d+Lk(c),a-=Math.floor(a/e)*e,0<a&&(c.Eb=e-a,g+=c.Eb));c.I=g;c.Fb=e}
function Bp(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.borderTop=b;c.vb=d;!a.u&&0<d&&(a=e+Ik(c),a-=Math.floor(a/d)*d,0<a&&(c.qa=d-a,g+=c.qa));c.C=g;w(c.element,"top",e+"px");w(c.element,"margin-top",f+"px");w(c.element,"padding-top",g+"px");w(c.element,"border-top-width",b+"px")}
function Cp(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.qa;w(c.element,"height",a+"px");w(c.element,"margin-bottom",d+"px");w(c.element,"padding-bottom",e+"px");w(c.element,"border-bottom-width",f+"px");c.height=a-c.qa;c.marginBottom=d;c.ha=f;c.H=e}function Dp(a,b,c){a.u?(Bp(a,b,c),Cp(a,b,c)):(Ap(a,b,c),zp(a,b,c))}
function Ep(a,b,c){w(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.U?Ok(c,0,d):(Bp(a,b,c),d-=c.qa,c.height=d,w(c.element,"height",d+"px"))}function Fp(a,b,c){w(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?Pk(c,0,d):(Ap(a,b,c),d-=c.Eb,c.width=d,a=Z(a,b,"right"),w(c.element,"right",a+"px"),w(c.element,"width",d+"px"))}
var Gp="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Hp="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Ip="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Jp=["width","height"],Kp=["transform","transform-origin"];
pp.prototype.Tb=function(a,b,c,d){this.f&&this.u==this.f.u||w(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?Fp(this,a,b):Ep(this,a,b):(this.u?Ap(this,a,b):Bp(this,a,b),this.u?zp(this,a,b):Cp(this,a,b));(this.u?this.g:this.h)?this.u?Ep(this,a,b):Fp(this,a,b):Dp(this,a,b);for(c=0;c<Gp.length;c++)yp(this,a,b.element,Gp[c],d)};function Lp(a,b,c,d){for(var e=0;e<Ip.length;e++)yp(a,b,c.element,Ip[e],d)}
function Mp(a,b,c,d){for(var e=0;e<Jp.length;e++)yp(a,b,c,Jp[e],d)}
pp.prototype.nd=function(a,b,c,d,e,f,g){this.u?this.I=b.la+b.Eb:this.H=b.la+b.qa;var h=(this.u||!d)&&this.g,l=(!this.u||!d)&&this.h;if(l||h)l&&w(b.element,"width","auto"),h&&w(b.element,"height","auto"),d=ak(f,d?d.element:b.element),l&&(this.I=Math.ceil(d.right-d.left-b.w-b.borderLeft-b.I-b.ka),this.u&&(this.I+=b.Eb)),h&&(this.H=d.bottom-d.top-b.C-b.borderTop-b.H-b.ha,this.u||(this.H+=b.qa));(this.u?this.g:this.h)&&Dp(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.U)this.u?Ap(this,a,b):
Bp(this,a,b);this.u?zp(this,a,b):Cp(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=xp(this,a,"column-rule-style"),f=xp(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=Bd))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,p=this.u?"border-top":"border-left",h=1;h<e;h++){var r=(m+k)*h/e-k/2+b.w-l/2,q=b.height+b.C+b.H,z=b.element.ownerDocument.createElement("div");w(z,"position","absolute");w(z,this.u?"left":"top","0px");w(z,this.u?"top":"left",r+"px");w(z,this.u?"height":"width","0px");
w(z,this.u?"width":"height",q+"px");w(z,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<Hp.length;h++)yp(this,a,b.element,Hp[h],g);for(h=0;h<Kp.length;h++)e=b,g=Kp[h],l=c.w,(d=xp(this,a,g))&&l.push(new Sj(e.element,g,d))};
pp.prototype.j=function(a,b){var c=this.J,d=this.b.b,e;for(e in d)Ch(e)&&Dh(c,e,d[e]);if("background-host"==this.b.Vb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.b.Vb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Ui(a,this.b.Fa,null,c);c.content&&(c.content=c.content.md(new zi(a,null,a.bb)));vp(this,a.l);for(c=0;c<this.b.j.length;c++)this.b.j[c].h(this).j(a,b);a.pop()};
function Np(a,b){a.h&&(a.O=up(a,"right",a.D,b)||up(a,"margin-right",a.D,b)||up(a,"border-right-width",a.D,b)||up(a,"padding-right",a.D,b));a.g&&(a.U=up(a,"top",a.C,b)||up(a,"margin-top",a.C,b)||up(a,"border-top-width",a.C,b)||up(a,"padding-top",a.C,b));for(var c=0;c<a.w.length;c++)Np(a.w[c],b)}function Op(a){pp.call(this,null,a)}t(Op,pp);Op.prototype.j=function(a,b){pp.prototype.j.call(this,a,b);this.w.sort(function(a,b){return b.b.$-a.b.$||a.b.index-b.b.index})};
function gp(a,b){pp.call(this,a,b);this.G=this}t(gp,pp);gp.prototype.X=function(a){var b=this.b.g;b.W&&(a=lc(b.f,a,b.W));return a};gp.prototype.Z=function(){};function ip(a,b){pp.call(this,a,b);this.G=a.G}t(ip,pp);function kp(a,b){pp.call(this,a,b);this.G=a.G}t(kp,pp);function Pp(a,b,c,d){var e=null;c instanceof zc&&(e=[c]);c instanceof sc&&(e=c.values);if(e)for(a=a.b.f,c=0;c<e.length;c++)if(e[c]instanceof zc){var f=qb(e[c].name,"enabled"),f=new fc(a,f);d&&(f=new Ob(a,f));b=lc(a,b,f)}return b}
kp.prototype.X=function(a){var b=this.b.f,c=this.style,d=op(b,c.required,b.h)!==b.h;if(d||this.g){var e;e=(e=c["flow-from"])?e.ta(b,b.b):new tb(b,"body");e=new hc(b,"has-content",[e]);a=lc(b,a,e)}a=Pp(this,a,c["required-partitions"],!1);a=Pp(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.G.style.enabled)?c.ta(b,null):b.j,c=lc(b,c,a),this.G.style.enabled=new E(c));return a};kp.prototype.Tb=function(a,b,c,d,e){w(b.element,"overflow","hidden");pp.prototype.Tb.call(this,a,b,c,d,e)};
function Qp(a,b,c,d){nf.call(this,a,b,!1);this.target=c;this.b=d}t(Qp,of);Qp.prototype.xb=function(a,b,c){kh(this.b,a,b,c,this)};Qp.prototype.Ed=function(a,b){pf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Qp.prototype.Qc=function(a,b){pf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Qp.prototype.yb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function Rp(a,b,c,d){Qp.call(this,a,b,c,d)}t(Rp,Qp);
function Sp(a,b,c,d){Qp.call(this,a,b,c,d);c.b.width=new V(Gd,0);c.b.height=new V(Gd,0)}t(Sp,Qp);Sp.prototype.ad=function(a,b,c){a=new jp(this.f,a,b,c,this.target);mf(this.ma,new Rp(this.f,this.ma,a,this.b))};Sp.prototype.$c=function(a,b,c){a=new hp(this.f,a,b,c,this.target);a=new Sp(this.f,this.ma,a,this.b);mf(this.ma,a)};function Tp(a,b,c,d){Qp.call(this,a,b,c,d)}t(Tp,Qp);Tp.prototype.ad=function(a,b,c){a=new jp(this.f,a,b,c,this.target);mf(this.ma,new Rp(this.f,this.ma,a,this.b))};
Tp.prototype.$c=function(a,b,c){a=new hp(this.f,a,b,c,this.target);a=new Sp(this.f,this.ma,a,this.b);mf(this.ma,a)};function Up(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function jl(a,b,c,d){if(a!==F)if(b===Ic||b===Yc)c=F,a=Up(a);else if(c&&c!==F||d)a=Up(a);return{display:a,position:b,lb:c}}
function Vp(a,b,c,d,e,f,g){e=e||f||cd;return!!g||!!c&&c!==F||b===Ic||b===Yc||a===fd||a===xd||a===wd||a==Zc||(a===Mc||a===kd)&&!!d&&d!==Ed||!!f&&e!==f};function Wp(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.cd(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.cd(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.cd(e,b)})};var Xp={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},Yp={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},Zp={"margin-top":"0px"},$p={"margin-right":"0px"},aq={};
function bq(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var cq=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),dq="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function eq(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
eq.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),Uk(d)&&d.ba(new Tk(a,this.f,d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new V(new Bc(a),0)}return c};
function fq(a,b,c,d,e,f,g,h,l,k,m,p,r){this.h={};this.G=a;this.b=b;this.viewport=c;this.C=c.b;this.l=d;this.I=e;this.fa=f;this.H=g;this.w=h;this.J=l;this.page=k;this.f=m;this.D=p;this.g=r;this.O=this.A=null;this.j=!1;this.L=null;this.ja=0;this.B=null}t(fq,Ta);fq.prototype.clone=function(){return new fq(this.G,this.b,this.viewport,this.l,this.I,this.fa,this.H,this.w,this.J,this.page,this.f,this.D,this.g)};
function gq(a,b,c,d,e,f){var g=K("createRefShadow");a.fa.w.load(b).then(function(h){if(h){var l=Cj(h,b);if(l){var k=a.J,m=k.I[h.url];if(!m){var m=k.style.l.f[h.url],p=new Ab(0,k.Sb(),k.Rb(),k.w),m=new ol(h,m.g,m.f,p,k.l,m.w,new Ko(k.j,h.url),new Jo(k.j,h.url,m.f,m.b));k.I[h.url]=m}f=new pk(d,l,h,e,f,c,m)}}N(g,f)});return g.result()}
function hq(a,b,c,d,e,f,g,h){var l=K("createShadows"),k=e.template,m;k instanceof Dc?m=gq(a,k.url,2,b,h,null):m=L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),z=null;p?z=h?h.fa:a.fa:h&&(p="http://www.w3.org/1999/xhtml"==h.ma.namespaceURI?h.ma.getAttribute("href"):h.ma.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.he?h.he.fa:a.fa);p&&(p=oa(p,z.url),m=gq(a,p,3,b,h,k))}m||(m=L(k));var u=null;
m.then(function(c){e.display===xd?u=gq(a,oa("user-agent.xml#table-cell",na),2,b,h,c):u=L(c)});u.then(function(k){var m;if(m=d._pseudos){for(var p=[],r=cq.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=r,u=0;u<dq.length;u++){var z=dq[u],A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.j))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===ed))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===md||A===F)continue;p.push(z);A=cq.createElementNS("http://www.w3.org/1999/xhtml",
"span");A.setAttribute("data-adapt-pseudo",z)}else A=cq.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(A);z.match(/^first-/)&&(q=A)}k=p.length?new pk(b,r,null,h,k,2,new eq(b,d,f,g)):k}N(l,k)})});return l.result()}function tn(a,b,c){a.O=b;a.j=c}
function iq(a,b,c,d){var e=a.b;c=oj(c,e,a.I,a.j);b=nj(c,e,b);pj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=Il(a.H,d));return d});var f=jl(d.display||ed,d.position,d["float"],a.L===a.fa.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function jq(a,b){for(var c=a.A.L,d=[],e=null,f=a.A.sa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e=e||Ba(c)}h?(c=f.ma,f=f.he):(c=c.parentNode,g++)}c=Cb(a.b,"em",!g);c={"font-size":new V(new D(c,"px"),0)};f=new Ih(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)mh[k]&&l.push(k);l.sort(Ld);for(var m=0;m<l.length;m++){var p=l[m];f.f=p;var r=h[p];r.value!==dd&&(c[p]=r.md(f))}}for(var q in b)mh[q]||(c[q]=b[q]);return{lang:e,Za:c}}
var kq={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function lq(a,b){b=oa(b,a.fa.url);return a.D[b]||b}function mq(a){a.A.lang=Ba(a.A.L)||a.A.parent&&a.A.parent.lang||a.A.lang}
function nq(a,b){var c=oh().filter(function(a){return b[a]});if(c.length){var d=a.A.wb;if(a.A.parent){var d=a.A.wb={},e;for(e in a.A.parent.wb)d[e]=a.A.parent.wb[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Bc)d[a]=c.K;else if(c instanceof zc)d[a]=c.name;else if(c instanceof D)switch(c.ga){case "dpi":case "dpcm":case "dppx":d[a]=c.K*yb[c.ga]}else d[a]=c;delete b[a]}})}}
function oq(a,b,c,d,e,f){for(var g=Pd("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.F=l;break}}}
function pq(a,b,c){var d=!0,e=K("createElementView"),f=a.L,g=a.A.sa?a.A.sa.b:a.l,h=g.l(f,!1),l={};if(!a.A.parent){var k=jq(a,h),h=k.Za;a.A.lang=k.lang}var m=h["float-reference"]&&im(h["float-reference"].value.toString());a.A.parent&&m&&jm(m)&&(k=jq(a,h),h=k.Za,a.A.lang=k.lang);a.A.u=iq(a,a.A.u,h,l);nq(a,l);mq(a);l.direction&&(a.A.qa=l.direction.toString());if((k=l["flow-into"])&&k.toString()!=a.G)return N(e,!1),e.result();var p=l.display;if(p===F)return N(e,!1),e.result();var r=!a.A.parent;a.A.I=
p===Zc;hq(a,f,r,h,l,g,a.b,a.A.sa).then(function(k){a.A.Ca=k;k=l.position;var q=l["float"],u=l.clear,A=a.A.u?Dd:cd,H=a.A.parent?a.A.parent.u?Dd:cd:A,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.A.Oc=Vp(p,k,q,l.overflow,A,H,G);a.A.O=k===qd||k===Ic||k===Yc;xk(a.A)&&(u=null,q===$c||m&&jm(m)||(q=null));A=q===jd||q===rd||q===Ad||q===Qc||q===hd||q===gd||q===Oc||q===Nc||q===$c;q&&(delete l["float"],q===$c&&(a.j?(A=!1,l.display=Mc):l.display=ed));u&&(u===dd&&a.A.parent&&a.A.parent.D&&(u=C(a.A.parent.D)),
u===jd||u===rd||u===Pc)&&(delete l.clear,l.display&&l.display!=ed&&(a.A.D=u.toString()));var I=p===kd&&l["ua-list-item-count"];(A||l["break-inside"]&&l["break-inside"]!==Lc)&&a.A.w++;if(!(u=!A&&!p))a:switch(p.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":u=!0;break a;default:u=!1}if(!u)a:switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u=!0;break a;
default:u=!1}a.A.Aa=u;a.A.display=p?p.toString():"inline";a.A.l=A?q.toString():null;a.A.J=m||rk;a.A.X=l["column-span"];if(!a.A.Aa){if(u=l["break-after"])a.A.H=u.toString();if(u=l["break-before"])a.A.g=u.toString()}a.A.U=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.A.Z=l["caption-side"]&&l["caption-side"].toString()||"top";u=l["border-collapse"];if(!u||u===C("separate"))if(A=l["border-spacing"])A.qd()?(u=A.values[0],A=A.values[1]):u=A,u.ic()&&(a.A.ha=Hc(u,a.b)),A.ic()&&(a.A.Md=
Hc(A,a.b));if(u=l["x-first-pseudo"])a.A.f=new qk(a.A.parent?a.A.parent.f:null,u.K);if(u=l["white-space"])u=bk(u.toString()),null!==u&&(a.A.$b=u);(u=l["hyphenate-character"])&&u!==Lc&&(a.A.h=u.Dc);u=l["overflow-wrap"]||["word-wrap"];a.A.C=l["word-break"]===Sc||u===Tc;oq(a.A,b,p,k,q,r);a.A.parent&&a.A.parent.F&&(b=a.A.parent.F.Fe(a.A,b));a.A.Aa||(a.A.j=qq(l),rq(a,f,g));var J=!1,Oa=null,Ca=[],ua=f.namespaceURI,M=f.localName;if("http://www.w3.org/1999/xhtml"==ua)"html"==M||"body"==M||"script"==M||"link"==
M||"meta"==M?M="div":"vide_"==M?M="video":"audi_"==M?M="audio":"object"==M&&(J=!!a.f),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(M="img");else if("http://www.idpf.org/2007/ops"==ua)M="span",ua="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ua){ua="http://www.w3.org/1999/xhtml";if("image"==M){if(M="div",(k=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==k.charAt(0)&&(k=Cj(a.fa,k)))Oa=sq(a,ua,"img"),k="data:"+
(k.getAttribute("content-type")||"image/jpeg")+";base64,"+k.textContent.replace(/[ \t\n\t]/g,""),Ca.push(re(Oa,k))}else M=kq[M];M||(M=a.A.Aa?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ua)if(ua="http://www.w3.org/1999/xhtml","ncx"==M||"navPoint"==M)M="div";else if("navLabel"==M){if(M="span",q=f.parentNode){k=null;for(q=q.firstChild;q;q=q.nextSibling)if(1==q.nodeType&&(u=q,"http://www.daisy.org/z3986/2005/ncx/"==u.namespaceURI&&"content"==u.localName)){k=u.getAttribute("src");break}k&&
(M="a",f=f.ownerDocument.createElementNS(ua,"a"),f.setAttribute("href",k))}}else M="span";else"http://www.pyroxy.com/ns/shadow"==ua?(ua="http://www.w3.org/1999/xhtml",M=a.A.Aa?"span":"div"):J=!!a.f;I?b?M="li":(M="div",p=Mc,l.display=p):"body"==M||"li"==M?M="div":"q"==M?M="span":"a"==M&&(k=l["hyperlink-processing"])&&"normal"!=k.toString()&&(M="span");l.behavior&&"none"!=l.behavior.toString()&&a.f&&(J=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(J=!0);var Ya;J?Ya=a.f(f,a.A.parent?a.A.parent.B:null,
l):Ya=L(null);Ya.then(function(g){g?J&&(d="true"==g.getAttribute("data-adapt-process-children")):g=sq(a,ua,M);"a"==M&&g.addEventListener("click",a.page.J,!1);Oa&&(Sn(a,a.A,"inner",Oa),g.appendChild(Oa));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&bq(g);var h=a.A.wb["image-resolution"],k=[],m=l.width,p=l.height,r=f.getAttribute("width"),q=f.getAttribute("height"),m=m===Lc||!m&&!r,p=p===Lc||!p&&!q;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==M){for(var r=
f.attributes,u=r.length,q=null,z=0;z<u;z++){var A=r[z],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==G&&(A=lq(a,A));else{if(G.match(/^on/))continue;if("style"==G)continue;if(("id"==G||"name"==G)&&b){A=a.g.me(A,a.fa.url);g.setAttribute(G,A);Yj(a.page,g,A);continue}"src"==G||"href"==G||"poster"==G?(A=lq(a,A),"href"===G&&(A=a.g.cd(A,a.fa.url))):"srcset"==G&&(A=A.split(",").map(function(b){return lq(a,b.trim())}).join(","));
if("poster"===G&&"video"===M&&"http://www.w3.org/1999/xhtml"===ua&&m&&p){var Ya=new Image,Fc=re(Ya,A);Ca.push(Fc);k.push({ef:Ya,element:g,$e:Fc})}}"http://www.w3.org/2000/svg"==ua&&/^[A-Z\-]+$/.test(G)&&(G=G.toLowerCase());-1!=tq.indexOf(G.toLowerCase())&&(A=Wp(A,a.fa.url,a.g));H&&(Ya=aq[H])&&(G=Ya+":"+G);"src"!=G||H||"img"!=M&&"input"!=M||"http://www.w3.org/1999/xhtml"!=ua?"href"==G&&"image"==M&&"http://www.w3.org/2000/svg"==ua&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(re(g,A)):H?g.setAttributeNS(H,
G,A):g.setAttribute(G,A):q=A}q&&(Ya="input"===M?new Image:g,r=re(Ya,q),Ya!==g&&(g.src=q),m||p?(m&&p&&h&&1!==h&&k.push({ef:Ya,element:g,$e:r}),Ca.push(r)):a.page.j.push(r))}delete l.content;(m=l["list-style-image"])&&m instanceof Dc&&(m=m.url,Ca.push(re(new Image,m)));uq(a,l);vq(a,g,l);if(!a.A.Aa&&(m=null,b?c&&(m=a.A.u?$p:Zp):m="clone"!==a.A.wb["box-decoration-break"]?a.A.u?Yp:Xp:a.A.u?$p:Zp,m))for(var so in m)w(g,so,m[so]);I&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.B=g;Ca.length?
qe(Ca).then(function(){0<h&&wq(a,k,h,l,a.A.u);N(e,d)}):je().then(function(){N(e,d)})})});return e.result()}var tq="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function wq(a,b,c,d,e){b.forEach(function(b){if("load"===b.$e.get().get()){var f=b.ef,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Rc&&(d["border-left-style"]!==F&&(h+=Hc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Hc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Hc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Hc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?w(b,"max-width",
h+"px"):l!==F&&k===F?w(b,"width",h+"px"):l===F&&k!==F?w(b,"height",f+"px"):"%"!==l.ga?w(b,"max-width",Math.min(h,Hc(l,a.b))+"px"):"%"!==k.ga?w(b,"max-height",Math.min(f,Hc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Jd,k=d["min-height"]||Jd,l.K||k.K?l.K&&!k.K?w(b,"width",h+"px"):!l.K&&k.K?w(b,"height",f+"px"):"%"!==l.ga?w(b,"min-width",Math.max(h,Hc(l,a.b))+"px"):"%"!==k.ga?w(b,"min-height",Math.max(f,Hc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+
"px"):w(b,"min-width",h+"px"))}})}function uq(a,b){Pd("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.A,b)})}function rq(a,b,c){for(b=b.firstChild;b;b=b.nextSibling)if(1===b.nodeType){var d={},e=c.l(b,!1);iq(a,a.A.u,e,d);if(qq(d)){if(a.A.F instanceof vo&&!zk(a.A,a.A.F))break;c=a.A.parent;a.A.F=new vo(c&&c.F,a.A.L);xq(a.A.F,a.A.u);break}}}function qq(a){var b=a["repeat-on-break"];return b!==F&&(b===Lc&&(b=a.display===zd?bd:a.display===yd?ad:F),b&&b!==F)?b.toString():null}
function yq(a){var b=K("createTextNodeView");zq(a).then(function(){var c=a.ja||0,c=Aq(a.A.Na).substr(c);a.B=document.createTextNode(c);N(b,!0)});return b.result()}function zq(a){if(a.A.Na)return L(!0);var b,c=b=a.L.textContent,d=K("preprocessTextContent"),e=Pd("PREPROCESS_TEXT_CONTENT"),f=0;le(function(){return f>=e.length?L(!1):e[f++](a.A,c).na(function(a){c=a;return L(!0)})}).then(function(){a.A.Na=Bq(b,c,0);N(d,!0)});return d.result()}
function Cq(a,b,c){var d=K("createNodeView"),e=!0;1==a.L.nodeType?b=pq(a,b,c):8==a.L.nodeType?(a.B=null,b=L(!0)):b=yq(a);b.then(function(b){e=b;(a.A.B=a.B)&&(b=a.A.parent?a.A.parent.B:a.O)&&b.appendChild(a.B);N(d,e)});return d.result()}function un(a,b,c,d){(a.A=b)?(a.L=b.L,a.ja=b.ja):(a.L=null,a.ja=-1);a.B=null;return a.A?Cq(a,c,!!d):L(!0)}
function Dq(a){if(null==a.sa||"content"!=a.L.localName||"http://www.pyroxy.com/ns/shadow"!=a.L.namespaceURI)return a;var b=a.ra,c=a.sa,d=a.parent,e,f;c.Oe?(f=c.Oe,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.he,e=c.ma.firstChild,c=2);var g=a.L.nextSibling;g?(a.L=g,sk(a)):a.wa?a=a.wa:e?a=null:(a=a.parent.modify(),a.M=!0);if(e)return b=new nk(e,d,b),b.sa=f,b.ab=c,b.wa=a,b;a.ra=b;return a}
function Eq(a){var b=a.ra+1;if(a.M){if(!a.parent)return null;if(3!=a.ab){var c=a.L.nextSibling;if(c)return a=a.modify(),a.ra=b,a.L=c,sk(a),Dq(a)}if(a.wa)return a=a.wa.modify(),a.ra=b,a;a=a.parent.modify()}else{if(a.Ca&&(c=a.Ca.root,2==a.Ca.type&&(c=c.firstChild),c))return b=new nk(c,a,b),b.sa=a.Ca,b.ab=a.Ca.type,Dq(b);if(c=a.L.firstChild)return Dq(new nk(c,a,b));1!=a.L.nodeType&&(c=Aq(a.Na),b+=c.length-1-a.ja);a=a.modify()}a.ra=b;a.M=!0;return a}
function Tl(a,b,c){b=Eq(b);if(!b||b.M)return L(b);var d=K("nextInTree");un(a,b,!0,c).then(function(a){b.B&&a||(b=b.modify(),b.M=!0,b.B||(b.Aa=!0));Ua(this,{type:"nextInTree",A:b});N(d,b)}.bind(a));return d.result()}function Fq(a,b){if(b instanceof sc)for(var c=b.values,d=0;d<c.length;d++)Fq(a,c[d]);else b instanceof Dc&&(c=b.url,a.page.j.push(re(new Image,c)))}var Gq={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function vq(a,b,c){var d=c["background-image"];d&&Fq(a,d);var d=c.position===qd,e;for(e in c)if(!Gq[e]){var f=c[e],f=f.ba(new Ag(a.fa.url,a.g));f.ic()&&zb(f.ga)&&(f=new D(Hc(f,a.b),"px"));Qj[e]||d&&Rj[e]?a.page.w.push(new Sj(b,e,f)):w(b,e,f.toString())}}function Sn(a,b,c,d){if(!b.M){var e=(b.sa?b.sa.b:a.l).l(a.L,!1);if(e=e._pseudos)if(e=e[c])c={},b.u=iq(a,b.u,e,c),b=c.content,Uk(b)&&(b.ba(new Tk(d,a.b,b)),delete c.content),vq(a,d,c)}}
function xn(a,b,c){var d=K("peelOff"),e=b.f,f=b.ja,g=b.M;if(0<c)b.B.textContent=b.B.textContent.substr(0,c),f+=c;else if(!g&&b.B&&!f){var h=b.B.parentNode;h&&h.removeChild(b.B)}for(var l=b.ra+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.wa;le(function(){for(;0<k.length;){m=k.pop();b=new nk(m.L,b,l);k.length||(b.ja=f,b.M=g);b.ab=m.ab;b.sa=m.sa;b.Ca=m.Ca;b.wa=m.wa?m.wa:p;p=null;var c=un(a,b,!1);if(c.Ba())return c}return L(!1)}).then(function(){N(d,b)});return d.result()}
function sq(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.C.createElement(c):a.C.createElementNS(b,c)}function Nn(a,b,c){var d={},e=a.w._pseudos;b=iq(a,b,a.w,d);if(e&&e.before){var f={},g=sq(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);iq(a,b,e.before,f);delete f.content;vq(a,g,f)}delete d.content;vq(a,c,d);return b}
function Go(a){a&&yk(a,function(a){var b=a.wb["box-decoration-break"];b&&"slice"!==b||(b=a.B,a.u?(w(b,"padding-left","0"),w(b,"border-left","none"),w(b,"border-top-left-radius","0"),w(b,"border-bottom-left-radius","0")):(w(b,"padding-bottom","0"),w(b,"border-bottom","none"),w(b,"border-bottom-left-radius","0"),w(b,"border-bottom-right-radius","0")))})}function Hq(a){this.b=a.h;this.window=a.window}
function Iq(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function dn(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Iq(a,d)},a)}function ak(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Iq(c,d)}function In(a,b){return a.window.getComputedStyle(b,null)}
function Jq(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=In(new Hq(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}Jq.prototype.zoom=function(a,b,c){w(this.g,"width",a*c+"px");w(this.g,"height",b*c+"px");w(this.f,"width",a+"px");w(this.f,"height",b+"px");w(this.f,"transform","scale("+c+")")};var bo="min-content inline size",Zm="fit-content inline size";
function Ym(a,b,c){function d(c){return In(a,b).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(Oa)}function f(){w(b,"display","inline-block");w(G,Oa,"99999999px");var a=d(Oa);w(G,Oa,"");return a}function g(){w(b,"display","inline-block");w(G,Oa,"0");var a=d(Oa);w(G,Oa,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,p=b.style.width,r=b.style.maxWidth,q=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,G=b.ownerDocument.createElement("div");w(G,"position",m);H.insertBefore(G,b);G.appendChild(b);w(b,"width","auto");w(b,"max-width","none");w(b,"min-width","0");w(b,"height","auto");w(b,"max-height","none");w(b,"min-height","0");var I=za("writing-mode"),I=(I?d(I[0]):null)||d("writing-mode"),J="vertical-rl"===I||"tb-rl"===I||"vertical-lr"===
I||"tb-lr"===I,Oa=J?"height":"width",Ca=J?"width":"height",ua={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case bo:c=g();break;case Zm:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=J?l():e();break;case "fill-available height":c=J?e():l();break;case "max-content width":c=
J?d(Ca):f();break;case "max-content height":c=J?f():d(Ca);break;case "min-content width":c=J?d(Ca):g();break;case "min-content height":c=J?g():d(Ca);break;case "fit-content width":c=J?d(Ca):h();break;case "fit-content height":c=J?h():d(Ca)}ua[a]=parseFloat(c);w(b,"position",m);w(b,"display",k)});w(b,"width",p);w(b,"max-width",r);w(b,"min-width",q);w(b,"height",z);w(b,"max-height",u);w(b,"min-height",A);H.insertBefore(b,G);H.removeChild(G);return ua};function Kq(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Cd||b!==Dd&&a!==ud?"ltr":"rtl"}
var Lq={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},Mq=new D(.24,"pt"),Nq=new D(3,"mm"),Oq=new D(10,"mm"),Pq=new D(13,"mm");
function Qq(a){var b={width:Hd,height:Id,bc:Jd,Kb:Jd},c=a.size;if(c&&c.value!==Lc){var d=c.value;d.qd()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.ic())b.width=c,b.height=d||c;else if(c=Lq[c.name.toLowerCase()])d&&d===id?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.Kb=Pq);a=a.bleed;a&&a.value!==Lc?a.value&&a.value.ic()&&(b.bc=a.value):c&&(a=!1,c.value.qd()?a=c.value.values.some(function(a){return a===Uc}):a=c.value===Uc,a&&(b.bc=new D(6,
"pt")));return b}function Rq(a,b){var c={},d=a.bc.K*Cb(b,a.bc.ga,!1),e=a.Kb.K*Cb(b,a.Kb.ga,!1),f=d+e,g=a.width;c.Sb=g===Hd?b.Y.dc?b.Y.dc.width*Cb(b,"px",!1):(b.Y.ub?Math.floor(b.bb/2)-b.Y.Ac:b.bb)-2*f:g.K*Cb(b,g.ga,!1);g=a.height;c.Rb=g===Id?b.Y.dc?b.Y.dc.height*Cb(b,"px",!1):b.Fb-2*f:g.K*Cb(b,g.ga,!1);c.bc=d;c.Kb=e;c.Qd=f;return c}function Sq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function Tq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var Uq={kg:"top left",lg:"top right",Yf:"bottom left",Zf:"bottom right"};
function Vq(a,b,c,d,e,f){var g=d;g<=e+2*yb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=Sq(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=Tq(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=Tq(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var Wq={jg:"top",Xf:"bottom",vf:"left",wf:"right"};
function Xq(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=Sq(a,g,f),l=Tq(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=Tq(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=Tq(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(Wq).forEach(function(a){a=
Wq[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function Yq(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.qd()?a.values.forEach(function(a){a===Uc?e=!0:a===Vc&&(f=!0)}):a===Uc?e=!0:a===Vc&&(f=!0);if(e||f){var g=c.N,h=g.ownerDocument,l=b.bc,k=Hc(Mq,d),m=Hc(Nq,d),p=Hc(Oq,d);e&&Object.keys(Uq).forEach(function(a){a=Vq(h,Uq[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(Wq).forEach(function(a){a=Xq(h,Wq[a],k,p,m);g.appendChild(a)})}}
var Zq=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),$q={"top-left-corner":{order:1,La:!0,Ia:!1,Ja:!0,Ka:!0,ua:null},"top-left":{order:2,
La:!0,Ia:!1,Ja:!1,Ka:!1,ua:"start"},"top-center":{order:3,La:!0,Ia:!1,Ja:!1,Ka:!1,ua:"center"},"top-right":{order:4,La:!0,Ia:!1,Ja:!1,Ka:!1,ua:"end"},"top-right-corner":{order:5,La:!0,Ia:!1,Ja:!1,Ka:!0,ua:null},"right-top":{order:6,La:!1,Ia:!1,Ja:!1,Ka:!0,ua:"start"},"right-middle":{order:7,La:!1,Ia:!1,Ja:!1,Ka:!0,ua:"center"},"right-bottom":{order:8,La:!1,Ia:!1,Ja:!1,Ka:!0,ua:"end"},"bottom-right-corner":{order:9,La:!1,Ia:!0,Ja:!1,Ka:!0,ua:null},"bottom-right":{order:10,La:!1,Ia:!0,Ja:!1,Ka:!1,ua:"end"},
"bottom-center":{order:11,La:!1,Ia:!0,Ja:!1,Ka:!1,ua:"center"},"bottom-left":{order:12,La:!1,Ia:!0,Ja:!1,Ka:!1,ua:"start"},"bottom-left-corner":{order:13,La:!1,Ia:!0,Ja:!0,Ka:!1,ua:null},"left-bottom":{order:14,La:!1,Ia:!1,Ja:!0,Ka:!1,ua:"end"},"left-middle":{order:15,La:!1,Ia:!1,Ja:!0,Ka:!1,ua:"center"},"left-top":{order:16,La:!1,Ia:!1,Ja:!0,Ka:!1,ua:"start"}},ar=Object.keys($q).sort(function(a,b){return $q[a].order-$q[b].order});
function br(a,b,c){fp.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=Qq(c);new cr(this.f,this,c,a);this.D={};dr(this,c);this.b.position=new V(qd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)Zq[d]||"background-clip"===d||(this.b[d]=c[d])}t(br,fp);function dr(a,b){var c=b._marginBoxes;c&&ar.forEach(function(d){c[d]&&(a.D[d]=new er(a.f,a,d,b))})}br.prototype.h=function(a){return new fr(a,this)};
function cr(a,b,c,d){jp.call(this,a,null,null,[],b);this.G=d;this.b["z-index"]=new V(new Bc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Ic,0);this.b.overflow=new V(Ed,0);for(var e in Zq)Zq.hasOwnProperty(e)&&(this.b[e]=c[e])}t(cr,jp);cr.prototype.h=function(a){return new gr(a,this)};
function er(a,b,c,d){jp.call(this,a,null,null,[],b);this.C=c;a=d._marginBoxes[this.C];for(var e in d)if(b=d[e],c=a[e],mh[e]||c&&c.value===dd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==dd&&(this.b[e]=b)}t(er,jp);er.prototype.h=function(a){return new hr(a,this)};function fr(a,b){gp.call(this,a,b);this.l=null;this.qa={}}t(fr,gp);
fr.prototype.j=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}gp.prototype.j.call(this,a,b)};fr.prototype.Xd=function(){var a=this.style;a.left=Jd;a["margin-left"]=Jd;a["border-left-width"]=Jd;a["padding-left"]=Jd;a["padding-right"]=Jd;a["border-right-width"]=Jd;a["margin-right"]=Jd;a.right=Jd};
fr.prototype.Yd=function(){var a=this.style;a.top=Jd;a["margin-top"]=Jd;a["border-top-width"]=Jd;a["padding-top"]=Jd;a["padding-bottom"]=Jd;a["border-bottom-width"]=Jd;a["margin-bottom"]=Jd;a.bottom=Jd};fr.prototype.Z=function(a,b,c){b=b.I;var d={start:this.l.marginLeft,end:this.l.marginRight,oa:this.l.vc},e={start:this.l.marginTop,end:this.l.marginBottom,oa:this.l.uc};ir(this,b.top,!0,d,a,c);ir(this,b.bottom,!0,d,a,c);ir(this,b.left,!1,e,a,c);ir(this,b.right,!1,e,a,c)};
function jr(a,b,c,d,e){this.N=a;this.D=e;this.j=c;this.C=!Y(d,b[c?"width":"height"],new ec(d,0,"px"));this.l=null}jr.prototype.b=function(){return this.C};function kr(a){a.l||(a.l=Ym(a.D,a.N.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}jr.prototype.g=function(){var a=kr(this);return this.j?Kk(this.N)+a["max-content width"]+Lk(this.N):Ik(this.N)+a["max-content height"]+Jk(this.N)};
jr.prototype.h=function(){var a=kr(this);return this.j?Kk(this.N)+a["min-content width"]+Lk(this.N):Ik(this.N)+a["min-content height"]+Jk(this.N)};jr.prototype.f=function(){return this.j?Kk(this.N)+this.N.width+Lk(this.N):Ik(this.N)+this.N.height+Jk(this.N)};function lr(a){this.j=a}lr.prototype.b=function(){return this.j.some(function(a){return a.b()})};lr.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
lr.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};lr.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function mr(a,b,c,d,e,f){jr.call(this,a,b,c,d,e);this.w=f}t(mr,jr);mr.prototype.b=function(){return!1};mr.prototype.g=function(){return this.f()};mr.prototype.h=function(){return this.f()};mr.prototype.f=function(){return this.j?Kk(this.N)+this.w+Lk(this.N):Ik(this.N)+this.w+Jk(this.N)};
function ir(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b){var p=$q[m];if(p){var r=b[m],q=a.qa[m],z=new jr(r,q.style,c,g,f);h[p.ua]=r;l[p.ua]=q;k[p.ua]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.oa.evaluate(e);var u=nr(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.oa);b&&(b=b.evaluate(e),u[a]>b&&(b=k[a]=new mr(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(u=nr(k,b),A=!1,["start","center","end"].forEach(function(a){u[a]=H[a]||u[a]}));
var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.oa);b&&(b=b.evaluate(e),u[a]<b&&(b=k[a]=new mr(h[a],l[a].style,c,g,f,b),G[a]=b.f(),A=!0))});A&&(u=nr(k,b),["start","center","end"].forEach(function(a){u[a]=G[a]||u[a]}));var I=a+b,J=a+(a+b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(J-b)/2;break;case "end":e=I-b}c?Pk(d,e,b-Kk(d)-Lk(d)):Ok(d,e,b-Ik(d)-Jk(d))}})}
function nr(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=or(d,g.length?new lr(g):null,b);g.ob&&(f.center=g.ob);d=g.ob||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=or(c,e,b),c.ob&&(f.start=c.ob),c.fd&&(f.end=c.fd);return f}
function or(a,b,c){var d={ob:null,fd:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.ob=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.ob=a+(c-b)*(e-a)/(f-b):0<b&&(d.ob=c*a/b)),0<d.ob&&(d.fd=c-d.ob)):0<e?d.ob=c:0<f&&(d.fd=c)}else a.b()?d.ob=Math.max(c-b.f(),0):b.b()&&(d.fd=Math.max(c-a.f(),0));else a?a.b()&&(d.ob=c):b&&b.b()&&(d.fd=c);return d}fr.prototype.Tb=function(a,b,c,d,e){fr.uf.Tb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function gr(a,b){kp.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.uc=this.vc=null}t(gr,kp);
gr.prototype.j=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);kp.prototype.j.call(this,a,b);d=this.f;c={vc:this.vc,uc:this.uc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l=c;d=d.style;d.width=new E(c.vc);d.height=new E(c.uc);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};gr.prototype.Xd=function(){var a=pr(this,{start:"left",end:"right",oa:"width"});this.vc=a.Se;this.marginLeft=a.nf;this.marginRight=a.mf};gr.prototype.Yd=function(){var a=pr(this,{start:"top",end:"bottom",oa:"height"});this.uc=a.Se;this.marginTop=a.nf;this.marginBottom=a.mf};
function pr(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.oa,h=a.b.G[g].ta(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=lp(d,c["padding-"+e],h),r=lp(d,c["padding-"+f],h),q=np(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=np(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),u=y(d,h,x(d,x(d,q,p),x(d,z,r)));l?(u=y(d,u,l),k||m?k?m=y(d,u,k):k=y(d,u,m):m=k=mc(d,u,new tb(d,.5))):(k||(k=d.b),m||(m=d.b),l=y(d,u,x(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Jd;c["margin-"+f]=Jd;c["padding-"+e]=new E(p);c["padding-"+f]=new E(r);c["border-"+e+"-width"]=new E(q);c["border-"+f+"-width"]=new E(z);c[g]=new E(l);c["max-"+g]=new E(l);return{Se:y(d,h,x(d,k,m)),nf:k,mf:m}}gr.prototype.Tb=function(a,b,c,d,e){kp.prototype.Tb.call(this,a,b,c,d,e);c.O=b.element};function hr(a,b){kp.call(this,a,b);var c=b.C;this.l=$q[c];a.qa[c]=this;this.ya=!0}t(hr,kp);n=hr.prototype;
n.Tb=function(a,b,c,d,e){var f=b.element;w(f,"display","flex");var g=xp(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(w(f,"flex-flow",this.u?"row":"column"),w(f,"justify-content",h));kp.prototype.Tb.call(this,a,b,c,d,e)};
n.ua=function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left"===e,h=g?b.vc:b.uc,l=Y(d,c[a.oa],h),g=g?b.marginLeft:b.marginTop;if("start"===this.l.ua)c[e]=new E(g);else if(l){var k=lp(d,c["margin-"+e],h),m=lp(d,c["margin-"+f],h),p=lp(d,c["padding-"+e],h),r=lp(d,c["padding-"+f],h),q=np(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=np(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=x(d,l,x(d,x(d,p,r),x(d,x(d,q,f),x(d,k,m))));switch(this.l.ua){case "center":c[e]=new E(x(d,
g,nc(d,y(d,h,l),new tb(d,2))));break;case "end":c[e]=new E(y(d,x(d,g,h),l))}}};
function qr(a,b,c){function d(a){if(u)return u;u={oa:z?z.evaluate(a):null,fb:l?l.evaluate(a):null,gb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[r,m,p,q].forEach(function(b){b&&(c+=b.evaluate(a))});(null===u.fb||null===u.gb)&&c+u.oa+u.fb+u.gb>b&&(null===u.fb&&(u.fb=0),null===u.gb&&(u.qg=0));null!==u.oa&&null!==u.fb&&null!==u.gb&&(u.gb=null);null===u.oa&&null!==u.fb&&null!==u.gb?u.oa=b-c-u.fb-u.gb:null!==u.oa&&null===u.fb&&null!==u.gb?u.fb=b-c-u.oa-u.gb:null!==u.oa&&null!==u.fb&&null===u.gb?u.gb=
b-c-u.oa-u.fb:null===u.oa?(u.fb=u.gb=0,u.oa=b-c):u.fb=u.gb=(b-c-u.oa)/2;return u}var e=a.style;a=a.b.f;var f=b.Zd,g=b.ee;b=b.oa;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=mp(a,e["margin-"+f],h),k=mp(a,e["margin-"+g],h),m=lp(a,e["padding-"+f],h),p=lp(a,e["padding-"+g],h),r=np(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),q=np(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),u=null;e[b]=new E(new vb(a,function(){var a=d(this).oa;return null===a?0:a},b));e["margin-"+
f]=new E(new vb(a,function(){var a=d(this).fb;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new vb(a,function(){var a=d(this).gb;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(x(a,c.marginLeft,c.vc)):"top"===f&&(e.top=new E(x(a,c.marginTop,c.uc)))}n.Xd=function(){var a=this.f.l;this.l.Ja?qr(this,{Zd:"right",ee:"left",oa:"width"},a):this.l.Ka?qr(this,{Zd:"left",ee:"right",oa:"width"},a):this.ua({start:"left",end:"right",oa:"width"},a)};
n.Yd=function(){var a=this.f.l;this.l.La?qr(this,{Zd:"bottom",ee:"top",oa:"height"},a):this.l.Ia?qr(this,{Zd:"top",ee:"bottom",oa:"height"},a):this.ua({start:"top",end:"bottom",oa:"height"},a)};n.nd=function(a,b,c,d,e,f,g){kp.prototype.nd.call(this,a,b,c,d,e,f,g);a=c.I;c=this.b.C;d=this.l;d.Ja||d.Ka?d.La||d.Ia||(d.Ja?a.left[c]=b:d.Ka&&(a.right[c]=b)):d.La?a.top[c]=b:d.Ia&&(a.bottom[c]=b)};
function rr(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new fc(a,"page-number");b=new Yb(a,new dc(a,b,new tb(a,2)),a.b);c=new Ob(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===Kq(this.g)?(a.values["left-page"]=b,b=new Ob(a,b),a.values["right-page"]=b):(c=new Ob(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function sr(a){var b={};Ui(a.b,[],"",b);a.b.pop();return b}
function tr(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":tr(a,e);c.push(d+f+(e.$a||""))}return c.sort().join("^")}function ur(a,b,c){c=c.clone({Vb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=Qq(b),e=e.$a;d.width=Ah(a.f,d.width,new V(f.width,e));d.height=Ah(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.j(a.b,a.g);Np(c,a.f);return c}
function vr(a){this.b=null;this.h=a}t(vr,W);vr.prototype.apply=function(a){a.Z===this.h&&this.b.apply(a)};vr.prototype.f=function(){return 3};vr.prototype.g=function(a){this.b&&Ph(a.Tc,this.h,this.b);return!0};function wr(a){this.b=null;this.h=a}t(wr,W);wr.prototype.apply=function(a){1===(new fc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};wr.prototype.f=function(){return 2};function xr(a){this.b=null;this.h=a}t(xr,W);
xr.prototype.apply=function(a){(new fc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};xr.prototype.f=function(){return 1};function yr(a){this.b=null;this.h=a}t(yr,W);yr.prototype.apply=function(a){(new fc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};yr.prototype.f=function(){return 1};function zr(a){this.b=null;this.h=a}t(zr,W);zr.prototype.apply=function(a){(new fc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};zr.prototype.f=function(){return 1};
function Ar(a){this.b=null;this.h=a}t(Ar,W);Ar.prototype.apply=function(a){(new fc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Ar.prototype.f=function(){return 1};function Br(a,b){Nh.call(this,a,b,null,null)}t(Br,Nh);Br.prototype.apply=function(a){var b=a.l,c=a.G,d=this.style;a=this.$;Gh(b,c,d,a,null,null);if(d=d._marginBoxes){var c=Eh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);Gh(b,f,d[e],a,null,null)}}};
function Cr(a,b,c,d,e){ej.call(this,a,b,null,c,null,d,!1);this.O=e;this.H=[];this.g="";this.D=[]}t(Cr,ej);n=Cr.prototype;n.Bc=function(){this.zb()};n.Hb=function(a,b){if(this.g=b)this.b.push(new vr(b)),this.$+=65536};
n.Uc=function(a,b){b&&qf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.D.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new wr(this.f));this.$+=256;break;case "left":this.b.push(new xr(this.f));this.$+=1;break;case "right":this.b.push(new yr(this.f));this.$+=1;break;case "recto":this.b.push(new zr(this.f));this.$+=1;break;case "verso":this.b.push(new Ar(this.f));this.$+=1;break;default:qf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Dr(a){var b;a.g||a.D.length?b=[a.g].concat(a.D.sort()):b=null;a.H.push({Le:b,$:a.$});a.g="";a.D=[]}n.zc=function(){Dr(this);ej.prototype.zc.call(this)};n.xa=function(){Dr(this);ej.prototype.xa.call(this)};
n.yb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.H.some(function(a){return!a.Le})){ej.prototype.yb.call(this,a,b,c);var d=this.Za[a],e=this.O;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Dh(e[b],a,d)});else if("size"===a){var f=e[""];this.H.forEach(function(b){var c=new V(d.value,d.$a+b.$);b=b.Le?b.Le.join(""):"";var g=e[b];g?(c=(b=g[a])?Ah(null,c,b):c,Dh(g,a,c)):(g=e[b]={},Dh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Dh(g,a,f[a])},this))},this)}}};
n.hf=function(a){Ph(this.j.Tc,"*",a)};n.lf=function(a){return new Br(this.Za,a)};n.le=function(a){var b=Eh(this.Za,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);mf(this.ma,new Er(this.f,this.ma,this.w,c))};function Er(a,b,c,d){nf.call(this,a,b,!1);this.g=c;this.b=d}t(Er,of);Er.prototype.xb=function(a,b,c){kh(this.g,a,b,c,this)};Er.prototype.Qc=function(a,b){pf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Er.prototype.Ed=function(a,b){pf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Er.prototype.yb=function(a,b,c){Dh(this.b,a,new V(b,c?jf(this):kf(this)))};var Fr=new oe(function(){var a=K("uaStylesheetBase");lh.get().then(function(b){var c=oa("user-agent-base.css",na);b=new ej(null,null,null,null,null,b,!0);b.Cc("UA");dj=b.j;Qf(c,b,null,null).Ea(a)});return a.result()},"uaStylesheetBaseFetcher");
function Gr(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.I=e;this.j=f;this.D=a.U;this.G=g;this.h=h;this.C=l;this.H=k;this.w=a.l;xb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=Hr(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.D:!1;return d&&!!c&&!Ir(this,c)});wb(this.b,new vb(this.b,function(){return this.Z+this.b.page},"page-number"))}
function Jr(a,b,c,d){if(a.C.length){var e=new Ab(0,b,c,d);a=a.C;for(var f={},g=0;g<a.length;g++)Gh(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=yb.em,(h?h.evaluate(e,"text-zoom"):null)===sd&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Hc(g.evaluate(e,"width"),e),e=Hc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function Kr(a,b,c,d,e,f,g,h,l,k,m){Ab.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.fa=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.C=this.b=this.I=this.f=this.G=null;this.D=0;this.Db=f;this.h=new Hl(this.style.D);this.Oa={};this.X=null;this.j=m;this.Eb=new rm(null,null,null,null,null,null,null);this.U={};this.ya=null;this.vb=g;this.Cb=h;this.Z=l;this.Bb=k;for(var p in a.h)(b=a.h[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Jc?this.l[p]=!0:delete this.l[p]);
this.Va={};this.ka=this.ha=0}t(Kr,Ab);
function Lr(a){var b=K("StyleInstance.init"),c=new Ko(a.j,a.fa.url),d=new Jo(a.j,a.fa.url,a.style.f,a.style.b);a.f=new ol(a.fa,a.style.g,a.style.f,a,a.l,a.style.w,c,d);d.h=a.f;yl(a.f,a);a.I={};a.I[a.fa.url]=a.f;var e=vl(a.f);a.ya=Kq(e);a.G=new Op(a.style.I);c=new Ri(a.style.g,a,c,d);a.G.j(c,e);Np(a.G,a);a.X=new rr(c,a.style.b,a.G,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.W||d.W.evaluate(a))d=El(d.mc,a),d=new Fl(d),e.push(d);Nl(a.Db,e,a.h).Ea(b);var f=a.style.H;Object.keys(f).forEach(function(a){var b=
Rq(Qq(f[a]),this);this.Va[a]={width:b.Sb+2*b.Qd,height:b.Rb+2*b.Qd}},a);return b.result()}function zl(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new Dk,a.b[b.b]=c),c.b.push(new Ck(new Ak({pa:[{node:b.element,ab:lk,sa:null,Ca:null,wa:null}],ja:0,M:!1,Na:null}),b))}function Mr(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Da,f=e.pa[0].node,g=e.ja,h=e.M,l=0;f.ownerDocument!=a.fa.b;)l++,f=e.pa[l].node,h=!1,g=0;e=yj(a.fa,f,g,h);e<c&&(c=e)}return c}
function Nr(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.J=e;for(var g=0;null!=f.J&&(g+=5E3,wl(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=Mr(a,f),f<d&&(d=f))}return d}function Hr(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new fc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function Or(a,b){var c=a.b,d=Nr(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.G.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.b.Vb){var h=1,l=xp(f,a,"utilization");l&&l.He()&&(h=l.K);var l=Cb(a,"em",!1),k=a.Sb()*a.Rb();a.D=wl(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(Mr(h,m)===p.f){a:switch(p=m.g,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.g=Pl(fl(p,m.b[0].b.g))}}}a.C=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var r=m.b[p];0>r.b.mb&&r.b.f<h.D&&(r.b.mb=l)}Bb(a,a.style.b);h=xp(f,a,"enabled");if(!h||h===Fd){c=a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.D);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)v.debug("  Chunk",d+":",e.b[g].b.f);d=a.X;e=f;f=b;c=e.b;Object.keys(f).length?(e=c,g=tr(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Vb?(c=d,f=(new br(c.l,c.h.b,
f)).h(c.h),f.j(c.b,c.g),Np(f,c.f),g=f):g=ur(d,f,c),d.j[e]=g),f=g.b,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function Ir(a,b){var c=a.C.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=La(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.C.b[d],g=Mr(a,d);return c<g?!1:g<c?!0:!Hr(a,d.g)}return!1}function Pr(a,b,c){a=a.b.f[c];a.F||(a.F=new qn(null));b.Ae=a.F}
function Qr(a){var b=a.g,c=Im(b),d=K("layoutDeferredPageFloats"),e=!1,f=0;me(function(d){if(f===c.length||Km(b))P(d);else{var g=c[f++],l=g.lb;Em(b,l)?O(d):Yn(a,g.b,l).then(function(a){a?(a=Pm(b.parent))?P(d):(Pm(b)&&!a&&(e=!0,b.Rc=!1),O(d)):O(d)})}}).then(function(){e&&Cm(b);N(d,!0)});return d.result()}
function Rr(a,b,c){var d=a.b.b[c];if(!d||!Hr(a,d.g))return L(!0);d.g="any";Pr(a,b,c);On(b);a.l[c]&&0<b.J.length&&(b.Hd=!1);var e=K("layoutColumn");Qr(b).then(function(){if(Pm(b.g))N(e,!0);else{var c=[],g=[],h=!0;me(function(e){for(;0<d.b.length-g.length;){for(var f=0;0<=g.indexOf(f);)f++;var l=d.b[f];if(l.b.f>a.D||Ir(a,l.b))break;for(var p=f+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var r=d.b[p];if(r.b.f>a.D||Ir(a,r.b))break;gk(r.b,l.b)&&(l=r,f=p)}var q=l.b,z=!0;Zl(b,l.f,h,d.f).then(function(a){if(Pm(b.g))P(e);
else if(h=!1,!l.b.Nf||a&&!q.h||c.push(f),q.h)g.push(f),P(e);else{var k=!!a||!!b.f,m;0<Mm(b.g).length&&b.Va?a?(m=a.clone(),m.Da=b.Va):m=new Ak(b.Va):m=null;if(b.f&&m)l.f=m,d.f=b.f,b.f=null;else{g.push(f);if(a||m)l.f=a||m,c.push(f);b.f&&(d.g=Pl(b.f))}k?P(e):z?z=!1:O(e)}});if(z){z=!1;return}}P(e)}).then(function(){if(!Pm(b.g)){d.b=d.b.filter(function(a,b){return 0<=c.indexOf(b)||0>g.indexOf(b)});"column"===d.f&&(d.f=null);var a=an(b.g);Vn(b,a)}N(e,!0)})}});return e.result()}
function Sr(a,b,c,d,e,f,g,h,l,k,m,p,r,q,z){var u=b.u?b.h&&b.O:b.g&&b.U,A=f.element,H=new rm(l,"column",null,h,null,null,null),G=a.b.clone(),I=K("createAndLayoutColumn"),J;me(function(b){if(1<k){var I=a.viewport.b.createElement("div");w(I,"position","absolute");A.appendChild(I);J=new Xl(I,q,a.g,z,H);J.u=f.u;J.vb=f.vb;J.Fb=f.Fb;f.u?(I=g*(p+m)+f.C,Pk(J,f.w,f.width),Ok(J,I,p)):(I=g*(p+m)+f.w,Ok(J,f.C,f.height),Pk(J,I,p));J.hb=c;J.ib=d}else J=new Xl(A,q,a.g,z,H),Nk(J,f);J.Nb=u?[]:e.concat();J.Oa=r;vm(H,
J);0<=J.width?Rr(a,J,h).then(function(){Pm(H)||Nm(H);Pm(J.g)&&!Pm(l)?(J.g.Rc=!1,a.b=G.clone(),J.element!==A&&A.removeChild(J.element),O(b)):P(b)}):(Nm(H),P(b))}).then(function(){N(I,J)});return I.result()}function Tr(a,b,c,d,e){var f=xp(c,a,"writing-mode")||null;a=xp(c,a,"direction")||null;return new rm(b,"region",d,e,null,f,a)}
function Ur(a,b,c,d,e,f,g,h){qp(c);var l=xp(c,a,"enabled");if(l&&l!==Fd)return L(!0);var k=K("layoutContainer"),m=xp(c,a,"wrap-flow")===Lc,l=xp(c,a,"flow-from"),p=a.viewport.b.createElement("div"),r=xp(c,a,"position");w(p,"position",r?r.name:"absolute");d.insertBefore(p,d.firstChild);var q=new Hk(p);q.u=c.u;q.Nb=g;c.Tb(a,q,b,a.h,a.g);q.hb=e;q.ib=f;e+=q.left+q.marginLeft+q.borderLeft;f+=q.top+q.marginTop+q.borderTop;(c instanceof gr||c instanceof gp&&!(c instanceof fr))&&vm(h,q);var z=a.b.clone(),
u=!1;if(l&&l.jf())if(a.U[l.toString()])Pm(h)||c.nd(a,q,b,null,1,a.g,a.h),l=L(!0);else{var A=K("layoutContainer.inner"),H=l.toString(),G=Tr(a,h,c,q,H),I=Z(c,a,"column-count"),J=Z(c,a,"column-gap"),Oa=1<I?Z(c,a,"column-width"):q.width,l=wp(c,a),Ca=0,r=xp(c,a,"shape-inside"),ua=xg(r,0,0,q.width,q.height,a),M=new fq(H,a,a.viewport,a.f,l,a.fa,a.h,a.style.G,a,b,a.vb,a.Cb,a.Bb),Ya=new Io(a.j,a.b.page-1),Fc=0,Gc=null;me(function(b){Sr(a,c,e,f,g,q,Fc++,H,G,I,J,Oa,ua,M,Ya).then(function(c){Pm(h)?P(b):(Fc!==
I||Pm(G)||Nm(G),Pm(G)?(Fc=0,a.b=z.clone(),G.Rc=!1,O(b)):(Gc=c,Gc.f&&"column"!=Gc.f&&(Fc=I,"region"!=Gc.f&&(a.U[H]=!0)),Ca=Math.max(Ca,Gc.la),Fc<I?O(b):P(b)))})}).then(function(){if(!Pm(h)){Gc.element===p&&(q=Gc);q.la=Ca;c.nd(a,q,b,Gc,I,a.g,a.h);var d=a.b.b[H];d&&"region"===d.f&&(d.f=null)}N(A,!0)});l=A.result()}else{if((l=xp(c,a,"content"))&&Uk(l)){r="span";l.url&&(r="img");var fk=a.viewport.b.createElement(r);l.ba(new Tk(fk,a,l));p.appendChild(fk);"img"==r&&Mp(c,a,fk,a.h);Lp(c,a,q,a.h)}else c.ya&&
(d.removeChild(p),u=!0);u||c.nd(a,q,b,null,1,a.g,a.h);l=L(!0)}l.then(function(){if(Pm(h))N(k,!0);else{if(!c.g||0<Math.floor(q.la)){if(!u&&!m){var l=xp(c,a,"shape-outside"),l=q.Td(l,a);g.push(l)}}else if(!c.w.length){d.removeChild(p);N(k,!0);return}var r=c.w.length-1;le(function(){for(;0<=r;){var d=c.w[r--],d=Ur(a,b,d,p,e,f,g,h);if(d.Ba())return d.na(function(){return L(!Pm(h))});if(Pm(h))break}return L(!1)}).then(function(){N(k,!0)})}});return k.result()}
function Vr(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.b.mb&&f.b.mb+f.b.l-1<=b&&d.b.splice(e,1)}}function Wr(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function Xr(a,b,c){a.U={};c?(a.b=c.clone(),rl(a.f,c.g)):(a.b=new Fk,rl(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;Bb(a,a.style.b);a.C=c.clone();var d=sr(a.X),e=Or(a,d);if(!e)return L(null);Wj(b,e.b.b.width.value===Hd);Xj(b,e.b.b.height.value===Id);a.j.j=b;Uo(a.j,d,a);var f=Rq(Qq(d),a);Yr(a,f,b);Yq(d,f,b,a);var g=f.Kb+f.bc,d=xp(e,a,"writing-mode")||cd,f=xp(e,a,"direction")||ld,h=new rm(a.Eb,"page",null,null,null,d,f),l=K("layoutNextPage");me(function(c){Ur(a,b,e,b.g,g,g,[],h).then(function(){Pm(h)||
Nm(h);Pm(h)?(a.b=a.C.clone(),h.Rc=!1,O(c)):P(c)})}).then(function(){e.Z(a,b,a.g);var d=new fc(e.b.f,"left-page");b.l=d.evaluate(a)?"left":"right";Vr(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&Hr(a,d)||(b.f=null)});a.b=a.C=null;c.g=a.f.b;Zj(b,a.style.l.O[a.fa.url],a.g);Wr(a,c)&&(c=null);N(l,c)});return l.result()}
function Yr(a,b,c){a.O=b.Sb;a.J=b.Rb;a.ka=b.Sb+2*b.Qd;a.ha=b.Rb+2*b.Qd;c.N.style.width=a.ka+"px";c.N.style.height=a.ha+"px";c.g.style.left=b.Kb+"px";c.g.style.right=b.Kb+"px";c.g.style.top=b.Kb+"px";c.g.style.bottom=b.Kb+"px";c.g.style.padding=b.bc+"px"}function Zr(a,b,c,d){ej.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.D=!1}t(Zr,ej);n=Zr.prototype;n.Bd=function(){};n.Ad=function(a,b,c){a=new fp(this.g.w,a,b,c,this.g.H,this.W,kf(this.ma));mf(this.g,new Tp(a.f,this.g,a,this.w))};
n.qc=function(a){a=a.b;this.W&&(a=lc(this.f,this.W,a));mf(this.g,new Zr(this.g,a,this,this.G))};n.xd=function(){mf(this.g,new kj(this.f,this.ma))};n.zd=function(){var a={};this.g.C.push({mc:a,W:this.W});mf(this.g,new lj(this.f,this.ma,null,a,this.g.h))};n.yd=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);mf(this.g,new lj(this.f,this.ma,null,b,this.g.h))};n.Dd=function(){var a={};this.g.I.push(a);mf(this.g,new lj(this.f,this.ma,this.W,a,this.g.h))};
n.Yc=function(a){var b=this.g.D;if(a){var c=Eh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}mf(this.g,new lj(this.f,this.ma,null,b,this.g.h))};n.Cd=function(){this.D=!0;this.zb()};n.Bc=function(){var a=new Cr(this.g.w,this.g,this,this.w,this.g.G);mf(this.g,a);a.Bc()};n.xa=function(){ej.prototype.xa.call(this);if(this.D){this.D=!1;var a="R"+this.g.O++,b=C(a),c;this.W?c=new zh(b,0,this.W):c=new V(b,0);Fh(this.Za,"region-id").push(c);this.Mb();a=new Zr(this.g,this.W,this,a);mf(this.g,a);a.xa()}};
function $r(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function as(a){lf.call(this);this.h=a;this.j=new sb(null);this.w=new sb(this.j);this.H=new cp(this.j);this.J=new Zr(this,null,null,null);this.O=0;this.C=[];this.D={};this.l={};this.I=[];this.G={};this.b=this.J}t(as,lf);
as.prototype.error=function(a){v.b("CSS parser:",a)};function bs(a,b){return cs(b,a)}function ds(a){df.call(this,bs,"document");this.U=a;this.I={};this.w={};this.f={};this.O={};this.l=null;this.b=[];this.J=!1}t(ds,df);function es(a,b,c){fs(a,b,c);var d=oa("user-agent.xml",na),e=K("OPSDocStore.init");lh.get().then(function(b){a.l=b;Fr.get().then(function(){a.load(d).then(function(){a.J=!0;N(e,!0)})})});return e.result()}function fs(a,b,c){a.b.splice(0);b&&b.forEach(a.X,a);c&&c.forEach(a.Z,a)}
ds.prototype.X=function(a){this.b.push({url:a.url,text:a.text,eb:"Author",Fa:null,media:null})};ds.prototype.Z=function(a){this.b.push({url:a.url,text:a.text,eb:"User",Fa:null,media:null})};
function cs(a,b){var c=K("OPSDocStore.load"),d=b.url;Gj(b,a).then(function(b){if(b){if(a.J)for(var e=Pd("PREPROCESS_SINGLE_DOCUMENT"),g=0;g<e.length;g++)e[g](b.b);for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g<h.length;g++){var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&e.push({Kf:k,event:m,action:p,
Wc:l})}a.O[d]=e;var r=[];r.push({url:oa("user-agent-page.css",na),text:null,eb:"UA",Fa:null,media:null});if(g=b.l)for(g=g.firstChild;g;g=g.nextSibling)if(1==g.nodeType)if(e=g,h=e.namespaceURI,k=e.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)r.push({url:d,text:e.textContent,eb:"Author",Fa:null,media:null});else if("link"==k){if(m=e.getAttribute("rel"),h=e.getAttribute("class"),k=e.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)e=e.getAttribute("href"),e=oa(e,d),r.push({url:e,
text:null,Fa:h,media:k,eb:"Author"})}else"meta"==k&&"viewport"==e.getAttribute("name")&&r.push({url:d,text:$r(e),eb:"Author",Fa:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==e.getAttribute("type")&&r.push({url:d,text:e.textContent,eb:"Author",Fa:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=e.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(e=e.getElementsByTagName("value")[0])&&(e=oa(e.textContent,d),r.push({url:e,
text:null,Fa:null,media:null,eb:"Author"}));for(g=0;g<a.b.length;g++)r.push(a.b[g]);for(var q="",g=0;g<r.length;g++)q+=r[g].url,q+="^",r[g].text&&(q+=r[g].text),q+="^";var z=a.I[q];z?(a.f[d]=z,N(c,b)):(g=a.w[q],g||(g=new oe(function(){var b=K("fetchStylesheet"),c=0,d=new as(a.l);le(function(){if(c<r.length){var a=r[c++];d.Cc(a.eb);return null!==a.text?Rf(a.text,d,a.url,a.Fa,a.media).Ec(!0):Qf(a.url,d,a.Fa,a.media)}return L(!1)}).then(function(){z=new Gr(a,d.j,d.w,d.J.j,d.H,d.C,d.D,d.l,d.I,d.G);a.I[q]=
z;delete a.w[q];N(b,z)});return b.result()},"FetchStylesheet "+d),a.w[q]=g,g.start()),g.get().then(function(e){a.f[d]=e;N(c,b)}))}else N(c,null)});return c.result()};function gs(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function hs(a){var b=new Da;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(gs(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function is(a){a=hs(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function js(a){a=hs(a);for(var b=new Da,c=0;c<a.length;c++)b.append(gs(a[c]));a=b.toString();b=new Da;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function ks(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.Y=kb(f);this.w=g;this.j=h;this.h=l;this.g=k;this.Ta=this.page=null}function ls(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Aa(d,"height","auto")&&(w(d,"height","auto"),ls(a,d,c));"absolute"==Aa(d,"position","static")&&(w(d,"position","relative"),ls(a,d,c))}}
function ms(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
ks.prototype.$d=function(a){var b=this.w.$d(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",ms,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return L(g)}};
ks.prototype.wd=function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=K("showTOC"),h=new Vj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=Jr(k,c,1E5,e);b=new Jq(b.window,l.fontSize,b.root,l.width,l.height);var p=new Kr(k,d,f.lang,b,f.f,f.l,f.$d(d),f.j,0,f.h,f.g);f.Ta=p;p.Y=f.Y;Lr(p).then(function(){Xr(p,h,null).then(function(){ls(f,a,2);N(g,h)})})});return g.result()};
ks.prototype.pd=function(){if(this.page){var a=this.page;this.Ta=this.page=null;w(a.N,"visibility","none");var b=a.N.parentNode;b&&b.removeChild(a.N)}};ks.prototype.Ie=function(){return!!this.page};function ns(){ds.call(this,os(this));this.g=new df(Gj,"document");this.G=new df(ff,"text");this.H={};this.ka={};this.C={};this.D={}}t(ns,ds);function os(a){return function(b){return a.C[b]}}
function ps(a,b,c){var d=K("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.G.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Pj(vj(vj(vj(new wj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){qs(a,b,h,c).Ea(d);return}}N(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return d.result()}function qs(a,b,c,d){var e=b+c,f=a.H[e];if(f)return L(f);var g=K("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.G.load(b+"?r=list"):L(null)).then(function(d){f=new rs(a,b);ss(f,c,h,d,b+"?r=manifest").then(function(){a.H[e]=f;a.ka[b]=f;N(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return g.result()}
function ts(a,b,c){var d=K("EPUBDocStore.load");b=la(b);(a.D[b]=cs(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,vd:null})).Ea(d);return d.result()}
ns.prototype.load=function(a){var b=la(a);if(a=this.D[b])return a.Ba()?a:L(a.get());var c=K("EPUBDocStore.load");a=ns.uf.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?N(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return c.result()};function us(){this.id=null;this.src="";this.h=this.f=null;this.R=-1;this.l=0;this.w=null;this.b=this.g=0;this.nc=this.mb=null;this.j=Pa}
function vs(a){return a.id}function ws(a){var b=is(a);return function(a){var c=K("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));cf(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}N(c,bf([a,f]))});return c.result()}}
var xs={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},ys=xs.dcterms+"language",zs=xs.dcterms+"title";
function As(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==zs&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=ys&&b&&(f=(h[ys]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[ys]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Bs(a,b){function c(a){for(var b in a){var d=a[b];d.sort(As(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Sa(a,function(a){return Ra(a,function(a){var b={v:a.value,o:a.order};a.rg&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:ys,value:a.lang,lang:null,id:null,je:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Qa(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in xs)f[g]=xs[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=xs;var h=1;g=Nj(Oj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,je:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:xs.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),je:null,scheme:null};return null});var l=Qa(g,function(a){return a.je});g=d(Qa(g,function(a){return a.je?null:a.name}));var k=null;g[ys]&&(k=g[ys][0].v);c(g);return g}function Cs(){var a=window.MathJax;return a?a.Hub:null}var Ds={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function rs(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.D=b;this.C=null;this.U={};this.lang=null;this.G=0;this.J={};this.X=this.O=this.Z=null;this.H={};this.I=null;this.w=Es(this);Cs()&&(ph["http://www.w3.org/1998/Math/MathML"]=!0)}
function Es(a){function b(){}b.prototype.me=function(a,b){return"viv-id-"+qa(b+(a?"#"+a:""),":")};b.prototype.cd=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.me(c,f)}return b};b.prototype.Of=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ja(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function Fs(a,b){return a.D?b.substr(0,a.D.length)==a.D?decodeURI(b.substr(a.D.length)):null:b}
function ss(a,b,c,d,e){a.g=b;var f=vj(new wj([b.b]),"package"),g=Pj(f,"unique-identifier")[0];g&&(g=Cj(b,b.url+"#"+g))&&(a.C=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Ra(vj(vj(f,"manifest"),"item").b,function(c){var d=new us,e=b.url;d.id=c.getAttribute("id");d.src=oa(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!Ds[d.f]&&(h[d.src]=c);!a.O&&d.j.nav&&
(a.O=d);!a.X&&d.j["cover-image"]&&(a.X=d);return d});a.f=Na(a.j,vs);a.l=Na(a.j,function(b){return Fs(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(Ds[g.f]){a.H[l]=g.src;break}g=g.src}a.b=Ra(vj(vj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.R=c;return d});if(l=Pj(vj(f,"spine"),"toc")[0])a.Z=a.f[l];if(l=Pj(vj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.I=l}var g=c?Pj(vj(vj(Lj(vj(vj(new wj([c.b]),"encryption"),"EncryptedData"),Kj()),"CipherData"),"CipherReference"),"URI"):[],k=vj(vj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.U[l]=a.f[m].src)}a.J=Bs(vj(f,"metadata"),Pj(f,"prefix")[0]);a.J[ys]&&(a.lang=a.J[ys][0].v);if(!d){if(0<g.length&&a.C)for(d=ws(a.C),c=0;c<g.length;c++)a.h.C[a.D+g[c]]=d;return L(!0)}f=new Da;k={};if(0<g.length&&a.C)for(l="1040:"+
js(a.C),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var r=decodeURI(m),g=a.l[r];l=null;g&&(g.w=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[r];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Gs(a);return af(e,"","POST",f.toString(),"text/plain")}function Gs(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.G=b}
function Hs(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new uj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new us;b.R=a.index;b.id="item"+(a.index+1);b.src=a.url;b.mb=a.mb;b.nc=a.nc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?ts(a.h,b[0].url,c):L(null)}
function Is(a,b,c){var d=a.b[b],e=K("getCFI");a.h.load(d.src).then(function(a){var b=Aj(a,c),f=null;b&&(a=yj(a,b,0,!1),f=new fb,ib(f,b,c-a),d.h&&ib(f,d.h,0),f=f.toString());N(e,f)});return e.result()}
function Js(a,b){return Vd("resolveFragment",function(c){if(b){var d=new fb;gb(d,b);var e;if(a.g){var f=hb(d,a.g.b);if(1!=f.node.nodeType||f.M||!f.Wc){N(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){N(c,null);return}e=a.f[h];d=f.Wc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=hb(d,a.b);a=yj(a,b.node,b.offset,b.M);N(c,{R:e.R,Ga:a,aa:-1})})}else N(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);N(a,null)})}
function Ks(a,b){return Vd("resolveEPage",function(c){if(0>=b)N(c,{R:0,Ga:0,aa:-1});else{var d=La(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=zj(a),f=Math.round(a*b/e.b),f==a&&f--);N(c,{R:d,Ga:f,aa:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);N(a,null)})}
function Ls(a,b){var c=a.b[b.R];if(0>=b.Ga)return L(c.g);var d=K("getEPage");a.h.load(c.src).then(function(a){a=zj(a);N(d,c.g+Math.min(a,b.Ga)*c.b/a)});return d.result()}function Ms(a,b){return{page:a,position:{R:a.R,aa:b,Ga:a.offset}}}function Ns(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.w=e;this.oc=[];this.l=[];this.Y=kb(d);this.h=new Hq(b);this.f=new So(a.w)}function Os(a,b){var c=a.oc[b.R];return c?c.sb[b.aa]:null}n=Ns.prototype;
n.Ob=function(a){return this.b.I?this.b.I:(a=this.oc[a?a.R:0])?a.Ta.ya:null};
function Ps(a,b,c,d){c.N.style.display="none";c.N.style.visibility="visible";c.N.style.position="";c.N.style.top="";c.N.style.left="";c.N.setAttribute("data-vivliostyle-page-side",c.l);var e=b.sb[d];c.H=!b.item.R&&!d;b.sb[d]=c;e?(b.Ta.viewport.f.replaceChild(c.N,e.N),Ua(e,{type:"replaced",target:null,currentTarget:null,pf:c})):b.Ta.viewport.f.appendChild(c.N);a.w({width:b.Ta.ka,height:b.Ta.ha},b.Ta.Va,b.item.R,b.Ta.Z+d)}
function Qs(a,b,c){var d=K("renderSinglePage"),e=Rs(a,b,c);Xr(b.Ta,e,c).then(function(f){var g=(c=f)?c.page-1:b.Ua.length-1;Ps(a,b,e,g);Wo(a.f,e.R,g);f=null;if(c){var h=b.Ua[c.page];b.Ua[c.page]=c;h&&b.sb[c.page]&&(Gk(c,h)||(f=Qs(a,b,c)))}f||(f=L(!0));f.then(function(){var b=Xo(a.f,e),f=0;me(function(c){f++;if(f>b.length)P(c);else{var d=b[f-1];d.ud=d.ud.filter(function(a){return!a.Xc});d.ud.length?Ss(a,d.R).then(function(b){b?(Vo(a.f,d.fe),Yo(a.f,d.ud),Qs(a,b,b.Ua[d.aa]).then(function(b){var d=a.f;
d.b=d.G.pop();d=a.f;d.g=d.I.pop();d=b.Sc.position;d.R===e.R&&d.aa===g&&(e=b.Sc.page);O(c)})):O(c)}):O(c)}}).then(function(){N(d,{Sc:Ms(e,g),qf:c})})})});return d.result()}function Ts(a,b){var c=a.aa,d=-1;0>c&&(d=a.Ga,c=La(b.Ua.length,function(a){return Nr(b.Ta,b.Ua[a],!0)>d}),c=c===b.Ua.length?b.complete?b.Ua.length-1:Number.POSITIVE_INFINITY:c-1);return{R:a.R,aa:c,Ga:d}}
function Us(a,b,c){var d=K("findPage");Ss(a,b.R).then(function(e){if(e){var f=null,g;me(function(d){var h=Ts(b,e);g=h.aa;(f=e.sb[g])?P(d):e.complete?(g=e.Ua.length-1,f=e.sb[g],P(d)):c?Vs(a,h).then(function(a){a&&(f=a.page);P(d)}):ke(100).then(function(){O(d)})}).then(function(){N(d,Ms(f,g))})}else N(d,null)});return d.result()}
function Vs(a,b){var c=K("renderPage");Ss(a,b.R).then(function(d){if(d){var e=Ts(b,d),f=e.aa,g=e.Ga,h=d.sb[f];h?N(c,Ms(h,f)):me(function(b){if(f<d.Ua.length)P(b);else if(d.complete)f=d.Ua.length-1,P(b);else{var c=d.Ua[d.Ua.length-1];Qs(a,d,c).then(function(e){var k=e.Sc.page;(c=e.qf)?0<=g&&Nr(d.Ta,c)>g?(h=k,f=d.Ua.length-2,P(b)):O(b):(h=k,f=e.Sc.position.aa,d.complete=!0,k.C=d.item.R===a.b.b.length-1,P(b))})}}).then(function(){h=h||d.sb[f];var b=d.Ua[f];h?N(c,Ms(h,f)):Qs(a,d,b).then(function(b){b.qf||
(d.complete=!0,b.Sc.page.C=d.item.R===a.b.b.length-1);N(c,b.Sc)})})}else N(c,null)});return c.result()}n.ke=function(){return Ws(this,{R:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Ga:-1})};function Ws(a,b){var c=K("renderAllPages");b||(b={R:0,aa:0,Ga:0});var d=b.R,e=b.aa,f=0,g;me(function(c){Vs(a,{R:f,aa:f===d?e:Number.POSITIVE_INFINITY,Ga:f===d?b.Ga:-1}).then(function(a){g=a;++f>d?P(c):O(c)})}).then(function(){N(c,g)});return c.result()}n.Af=function(){return Us(this,{R:0,aa:0,Ga:-1})};
n.Ef=function(){return Us(this,{R:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Ga:-1})};n.nextPage=function(a,b){var c=this,d=a.R,e=a.aa,f=K("nextPage");Ss(c,d).then(function(a){if(a){if(a.complete&&e==a.Ua.length-1){if(d>=c.b.b.length-1){N(f,null);return}d++;e=0}else e++;Us(c,{R:d,aa:e,Ga:-1},b).Ea(f)}else N(f,null)});return f.result()};n.ie=function(a){var b=a.R;if(a=a.aa)a--;else{if(!b)return L(null);b--;a=Number.POSITIVE_INFINITY}return Us(this,{R:b,aa:a,Ga:-1})};
function Xs(a,b,c){b="left"===b.l;a="ltr"===a.Ob(c);return!b&&a||b&&!a}function Ys(a,b,c){var d=K("getCurrentSpread"),e=Os(a,b);if(!e)return L({left:null,right:null});var f="left"===e.l;(Xs(a,e,b)?a.ie(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?N(d,{left:e,right:a}):N(d,{left:a,right:e})});return d.result()}
n.Jf=function(a,b){var c=Os(this,a);if(!c)return L(null);var c=Xs(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.na(function(a){return a?e.nextPage(a.position,!!b):L(null)})};n.Mf=function(a){var b=Os(this,a);if(!b)return L(null);b=Xs(this,b,a);a=this.ie(a);if(b){var c=this;return a.na(function(a){return a?c.ie(a.position):L(null)})}return a};function Zs(a,b){var c=K("navigateToEPage");Ks(a.b,b).then(function(b){b?Us(a,b).Ea(c):N(c,null)});return c.result()}
function $s(a,b){var c=K("navigateToCFI");Js(a.b,b).then(function(b){b?Us(a,b).Ea(c):N(c,null)});return c.result()}
function at(a,b,c){v.debug("Navigate to",b);var d=Fs(a.b,la(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=Fs(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.w.Of(b);a.b.g?d=Fs(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return L(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==Fs(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?$s(a,b.substr(d+1)):L(null);var g=K("navigateTo");Ss(a,f.R).then(function(d){var e=Cj(d.fa,b);e?Us(a,{R:f.R,aa:-1,Ga:xj(d.fa,e)}).Ea(g):c.R!==f.R?Us(a,{R:f.R,aa:0,Ga:-1}).Ea(g):
N(g,null)});return g.result()}
function Rs(a,b,c){var d=b.Ta.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";qj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Vj(e,f);g.R=b.item.R;g.position=c;g.offset=Nr(b.Ta,c);g.offset||(b=a.b.w.me("",b.item.src),f.setAttribute("id",b),Yj(g,f,b));d!==a.viewport&&(a=Sf(null,new Ye(nb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.w.push(new Sj(e,"transform",a)));return g}function bt(a,b){var c=Cs();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=K("makeMathJaxView"),f=ee(c);d.Push(function(){f.jb(e)});return c.result()}return L(null)}
n.$d=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=oa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=Fs(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.U[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ha(f),l=Ha(g),g=new Da;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=L(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=bt(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=L(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?bt(c,d):L(null);return e}};
function Ss(a,b){if(b>=a.b.b.length)return L(null);var c=a.oc[b];if(c)return L(c);var d=K("getPageViewItem"),e=a.l[b];if(e){var f=ee(d);e.push(f);return d.result()}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(zj(f)/2700),a.b.G=g.b);var k=h.f[f.url],l=a.$d(f),p=a.viewport,r=Jr(k,p.width,p.height,p.fontSize);if(r.width!=p.width||r.height!=p.height||r.fontSize!=p.fontSize)p=new Jq(p.window,r.fontSize,p.root,r.width,r.height);r=a.oc[b-1];null!==
g.mb?r=g.mb-1:(r=r?r.Ta.Z+r.sb.length:0,null!==g.nc&&(r+=g.nc));To(a.f,r);var q=new Kr(k,f,a.b.lang,p,a.h,a.j,l,a.b.H,r,a.b.w,a.f);q.Y=a.Y;Lr(q).then(function(){c={item:g,fa:f,Ta:q,Ua:[null],sb:[],complete:!1};a.oc[b]=c;N(d,c);e.forEach(function(a){a.jb(c)})})});return d.result()}function ct(a){return a.oc.some(function(a){return a&&0<a.sb.length})}
n.wd=function(){var a=this.b,b=a.O||a.Z;if(!b)return L(null);var c=K("showTOC");this.g||(this.g=new ks(a.h,b.src,a.lang,this.h,this.j,this.Y,this,a.H,a.w,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.wd(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";N(c,a)});return c.result()};n.pd=function(){this.g&&this.g.pd()};n.Ie=function(){return this.g&&this.g.Ie()};var dt={fg:"singlePage",gg:"spread",Wf:"autoSpread"};
function et(a,b,c,d){var e=this;this.window=a;this.Fd=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);qj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.bb=c;this.Va=d;a=a.document;this.ya=new Jl(a.head,b);this.C="loading";this.O=[];this.h=null;this.Qb=this.Ma=!1;this.f=this.j=this.g=this.D=null;this.fontSize=16;this.zoom=1;this.G=!1;this.X="singlePage";this.ka=!1;this.ke=!0;this.Y=jb();this.ha=[];this.J=function(){};this.w=function(){};
this.Z=function(){e.Ma=!0;e.J()};this.ge=this.ge.bind(this);this.H=function(){};this.I=a.getElementById("vivliostyle-page-rules");this.U=!1;this.l=null;this.qa={loadEPUB:this.xf,loadXML:this.yf,configure:this.ze,moveTo:this.Oa,toc:this.wd};ft(this)}function ft(a){ka(1,function(a){gt(this,{t:"debug",content:a})}.bind(a));ka(2,function(a){gt(this,{t:"info",content:a})}.bind(a));ka(3,function(a){gt(this,{t:"warn",content:a})}.bind(a));ka(4,function(a){gt(this,{t:"error",content:a})}.bind(a))}
function gt(a,b){b.i=a.bb;a.Va(b)}function ht(a,b){a.C!==b&&(a.C=b,a.Fd.setAttribute("data-vivliostyle-viewer-status",b),gt(a,{t:"readystatechange"}))}n=et.prototype;
n.xf=function(a){it.f("beforeRender");ht(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=K("loadEPUB"),h=this;h.ze(a).then(function(){var a=new ns;es(a,e,f).then(function(){var e=oa(b,h.window.location.href);h.O=[e];ps(a,e,d).then(function(a){h.h=a;jt(h,c).then(function(){N(g,!0)})})})});return g.result()};
n.yf=function(a){it.f("beforeRender");ht(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=K("loadXML"),h=this;h.ze(a).then(function(){var a=new ns;es(a,e,f).then(function(){var e=b.map(function(a,b){return{url:oa(a.url,h.window.location.href),index:b,mb:a.mb,nc:a.nc}});h.O=e.map(function(a){return a.url});h.h=new rs(a,"");Hs(h.h,e,c).then(function(){jt(h,d).then(function(){N(g,!0)})})})});return g.result()};
function jt(a,b){kt(a);var c;b?c=Js(a.h,b).na(function(b){a.f=b;return L(!0)}):c=L(!0);return c.na(function(){it.b("beforeRender");return lt(a)})}function mt(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*yb.ex*a.fontSize/yb.em;if(d=yb[d])return c*d}return c}
n.ze=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.D=null,this.window.addEventListener("resize",this.Z,!1),this.Ma=!0):this.window.removeEventListener("resize",this.Z,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Ma=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:mt(this,b["margin-left"])||0,marginRight:mt(this,b["margin-right"])||0,marginTop:mt(this,b["margin-top"])||0,marginBottom:mt(this,b["margin-bottom"])||
0,width:mt(this,b.width)||0,height:mt(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Z,!1),this.D=b,this.Ma=!0);"boolean"==typeof a.hyphenate&&(this.Y.Vd=a.hyphenate,this.Ma=!0);"boolean"==typeof a.horizontal&&(this.Y.Ud=a.horizontal,this.Ma=!0);"boolean"==typeof a.nightMode&&(this.Y.ce=a.nightMode,this.Ma=!0);"number"==typeof a.lineHeight&&(this.Y.lineHeight=a.lineHeight,this.Ma=!0);"number"==typeof a.columnWidth&&(this.Y.Pd=a.columnWidth,this.Ma=
!0);"string"==typeof a.fontFamily&&(this.Y.fontFamily=a.fontFamily,this.Ma=!0);"boolean"==typeof a.load&&(this.ka=a.load);"boolean"==typeof a.renderAllPages&&(this.ke=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ma=a.userAgentRootURL.replace(/resources\/?$/,""),na=a.userAgentRootURL);"string"==typeof a.rootURL&&(ma=a.rootURL,na=ma+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.X&&(this.X=a.pageViewMode,this.Ma=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Y.Ac&&
(this.viewport=null,this.Y.Ac=a.pageBorder,this.Ma=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.Qb=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.G&&(this.G=a.fitToScreen,this.Qb=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.Y.dc=a.defaultPaperSize,this.Ma=!0);nt(this,a);return L(!0)};
function nt(a,b){Pd("CONFIGURATION").forEach(function(a){a=a(b);this.Ma=a.Ma||this.Ma;this.Qb=a.Qb||this.Qb}.bind(a))}n.ge=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||ot(this,a.pf):b===a.target&&ot(this,a.pf)};function pt(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function qt(a){pt(a,function(a){a.removeEventListener("hyperlink",this.H,!1);a.removeEventListener("replaced",this.ge,!1)}.bind(a))}
function rt(a){qt(a);pt(a,function(a){w(a.N,"display","none")});a.g=null;a.j=null}function st(a,b){b.addEventListener("hyperlink",a.H,!1);b.addEventListener("replaced",a.ge,!1);w(b.N,"visibility","visible");w(b.N,"display","block")}function tt(a,b){rt(a);a.g=b;st(a,b)}function ut(a){var b=K("reportPosition");Is(a.h,a.f.R,a.f.Ga).then(function(c){var d=a.g;(a.ka&&0<d.j.length?qe(d.j):L(!0)).then(function(){vt(a,d,c).Ea(b)})});return b.result()}
function wt(a){var b=a.Fd;if(a.D){var c=a.D;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Jq(a.window,a.fontSize,b,c.width,c.height)}return new Jq(a.window,a.fontSize,b)}
function xt(a){var b=wt(a),c;a:switch(a.X){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.Y.ub!==c;a.Y.ub=c;a.Fd.setAttribute("data-vivliostyle-spread-view",c);if(a.D||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&ct(a.b)){a:{d=a.b.oc;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.sb,f=0;f<e.length;f++){var g=e[f];if(g.G&&g.D){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.Qb=!0):!1}n.Pf=function(a,b,c,d){this.ha[d]=a;yt(this,b,c,d)};function yt(a,b,c,d){if(!a.U&&a.I&&!c&&!d){var e="";Object.keys(b).forEach(function(a){e+="@page "+a+"{size:";a=b[a];e+=a.width+"px "+a.height+"px;}"});a.I.textContent=e;a.U=!0}}
function zt(a){if(a.b){a.b.pd();for(var b=a.b,c=b.oc,d=0;d<c.length;d++){var e=c[d];e&&e.sb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.I&&(a.I.textContent="",a.U=!1);a.viewport=wt(a);b=a.viewport;w(b.g,"width","");w(b.g,"height","");w(b.f,"width","");w(b.f,"height","");w(b.f,"transform","");a.b=new Ns(a.h,a.viewport,a.ya,a.Y,a.Pf.bind(a))}
function ot(a,b,c){a.Qb=!1;qt(a);if(a.Y.ub)return Ys(a.b,a.f,c).na(function(c){rt(a);a.j=c;c.left&&(st(a,c.left),c.right||c.left.N.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(st(a,c.right),c.left||c.right.N.setAttribute("data-vivliostyle-unpaired-page",!0));c=At(a,c);a.viewport.zoom(c.width,c.height,a.G?Bt(a,c):a.zoom);a.g=b;return L(null)});tt(a,b);a.viewport.zoom(b.f.width,b.f.height,a.G?Bt(a,b.f):a.zoom);a.g=b;return L(null)}
function At(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.Y.Ac);return{width:c,height:d}}var Ct={ag:"fit inside viewport"};function Bt(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function Dt(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t(Dt,Error);
function kt(a){if(a.l){var b=a.l;Wd(b,new Dt);if(b!==Qd&&b.b){b.b.g=!0;var c=new fe(b);b.l="interrupt";b.b=c;b.f.jb(c)}}a.l=null}
function lt(a){a.Ma=!1;a.Qb=!1;if(xt(a))return L(!0);ht(a,"loading");kt(a);var b=Yd(Qd.f,function(){return Vd("resize",function(c){a.l=b;it.f("render (resize)");zt(a);a.f&&(a.f.aa=-1);Ws(a.b,a.f).then(function(d){a.f=d.position;ot(a,d.page,!0).then(function(){ut(a).then(function(d){ht(a,"interactive");(a.ke?a.b.ke():L(null)).then(function(){a.l===b&&(a.l=null);it.b("render (resize)");ht(a,"complete");gt(a,{t:"loaded"});N(c,d)})})})})},function(a,b){if(b instanceof Dt)it.b("render (resize)"),v.debug(b.message);
else throw b;})});return L(!0)}function vt(a,b,c){var d=K("sendLocationNotification"),e={t:"nav",first:b.H,last:b.C};Ls(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.G;c&&(e.cfi=c);gt(a,e);N(d,!0)});return d.result()}et.prototype.Ob=function(){return this.b?this.b.Ob(this.f):null};
et.prototype.Oa=function(a){var b=this;"complete"!==this.C&&ht(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.Y.ub?this.b.Jf:this.b.nextPage;break;case "previous":a=this.Y.ub?this.b.Mf:this.b.ie;break;case "last":a=this.b.Ef;break;case "first":a=this.b.Af;break;default:return L(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return Zs(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return at(b.b,
e,b.f)}}else return L(!0);var f=K("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=K("moveTo.showCurrent");c=d.result();ot(b,a.page).then(function(){ut(b).Ea(d)})}else c=L(!0);c.then(function(a){"loading"===b.C&&ht(b,"interactive");N(f,a)})});return f.result()};
et.prototype.wd=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Ie();if(c){if("show"==a)return L(!0)}else if("hide"==a)return L(!0);if(c)return this.b.pd(),L(!0);var d=this,e=K("showTOC");this.b.wd(b).then(function(a){if(a){if(b){var c=function(){d.b.pd()};a.addEventListener("hyperlink",c,!1);a.N.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.H,!1)}N(e,!0)});return e.result()};
function Et(a,b){var c=b.a||"";return Vd("runCommand",function(d){var e=a.qa[c];e?e.call(a,b).then(function(){gt(a,{t:"done",a:c});N(d,!0)}):(v.error("No such action:",c),N(d,!0))},function(a,b){v.error(b,"Error during action:",c);N(a,!0)})}function Ft(a){return"string"==typeof a?JSON.parse(a):a}
function Gt(a,b){var c=Ft(b),d=null;Xd(function(){var b=K("commandLoop"),f=Qd.f;a.H=function(b){var c="#"===b.href.charAt(0)||a.O.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Yd(f,function(){gt(a,d);return L(!0)})}};me(function(b){if(a.Ma)lt(a).then(function(){O(b)});else if(a.Qb)a.g&&ot(a,a.g).then(function(){O(b)});else if(c){var e=c;c=null;Et(a,e).then(function(){O(b)})}else e=K("waitForCommand"),d=ee(e,self),e.result().then(function(){O(b)})}).Ea(b);
return b.result()});a.J=function(){var a=d;a&&(d=null,a.jb())};a.w=function(b){if(c)return!1;c=Ft(b);a.J();return!0};a.window.adapt_command=a.w};function Bq(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=Ht(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=It(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=Jt(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);Kt(a);null!=c&&(a=Lt(a,c));return a}
function Jt(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=Mt(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Bq(f[0],f[2]),d=Bq(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,r=0,q=0,z=0;z<e;z++){for(var u=-z+m;u<=z-p;u+=2){var A=e+u,H;H=u==-z||u!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var G=H-u;H<c&&G<d&&a.charAt(H)==b.charAt(G);)H++,G++;g[A]=H;if(H>c)p+=2;else if(G>d)m+=2;else if(k&&(A=e+l-u,0<=A&&A<f&&-1!=h[A])){var I=c-h[A];if(H>=I){c=Nt(a,b,H,G);break a}}}for(u=-z+r;u<=z-q;u+=2){A=e+u;I=u==-z||u!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=I-u;I<c&&H<d&&a.charAt(c-I-1)==b.charAt(d-H-1);)I++,H++;h[A]=I;if(I>c)q+=2;else if(H>d)r+=2;else if(!k&&
(A=e+l-u,0<=A&&A<f&&-1!=g[A]&&(H=g[A],G=e+H-A,I=c-I,H>=I))){c=Nt(a,b,H,G);break a}}}c=[[-1,a],[1,b]]}return c}function Nt(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Bq(a.substring(0,c),b.substring(0,d));e=Bq(e,f);return a.concat(e)}function Ht(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function It(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function Mt(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=Ht(a.substring(c),b.substring(e)),I=It(a.substring(0,c),b.substring(0,e));f.length<I+m&&(f=b.substring(e-I,e)+b.substring(e,e+m),g=a.substring(0,c-I),h=a.substring(c+m),k=b.substring(0,e-I),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function Kt(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=Ht(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=It(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&Kt(a)}Bq.f=1;Bq.b=-1;Bq.g=0;
function Lt(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),Ot(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),Ot(d,c,3)):a}function Ot(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Aq(a){return a.reduce(function(a,c){return c[0]===Bq.b?a:a+c[1]},"")}function wk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Bq.f:d++;break;case Bq.b:d--;e++;break;case Bq.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function Pt(a,b){this.g(a,"end",b)}function Qt(a,b){this.g(a,"start",b)}function Rt(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function St(){}function Tt(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=St}
Tt.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.g(b)};Tt.prototype.w=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=St};Tt.prototype.C=function(){this.g=Rt;this.registerStartTiming=this.f=Qt;this.registerEndTiming=this.b=Pt};
var Ut={now:Date.now},it,Vt=it=new Tt(window&&window.performance||Ut);Rt.call(Vt,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Vt);Tt.prototype.printTimings=Tt.prototype.l;Tt.prototype.disable=Tt.prototype.w;Tt.prototype.enable=Tt.prototype.C;function nn(a){return(a=a.F)&&a instanceof vo?a:null}function Wt(a,b,c){var d=a.b;return d&&!d.jc&&(a=Xt(a,b),a.B)?!d.gc||d.jc?L(!0):Yt(d,d.gc,a,null,c):L(!0)}function Zt(a,b,c){var d=a.b;return d&&(a=Xt(a,b),a.B)?!d.hc||d.kc?L(!0):Yt(d,d.hc,a,a.B.firstChild,c):L(!0)}function $t(a,b){a&&au(a.M?a.parent:a,function(a,d){a instanceof uo||b.Sa.push(new bu(d))})}function au(a,b){for(var c=a;c;c=c.parent){var d=c.F;d&&d instanceof vo&&!zk(c,d)&&b(d,c)}}
function vo(a,b){this.parent=a;this.h=b;this.b=null}vo.prototype.re=function(){return"Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)"};vo.prototype.Fe=function(a,b){return b};function cu(a,b){var c=Xt(a,b);return c?c.B:null}function Xt(a,b){do if(!zk(b,a)&&b.L===a.h)return b;while(b=b.parent);return null}
function xq(a,b){a.b||Eo.some(function(a){return a.root===this.h?(this.b=a.elements,!0):!1}.bind(a))||(a.b=new du(b,a.h),Eo.push({root:a.h,elements:a.b}))}vo.prototype.te=function(){};vo.prototype.se=function(){};var Eo=[];function du(a,b){this.u=a;this.gc=this.hc=this.l=this.C=this.j=this.w=null;this.D=this.G=0;this.jc=this.kc=!1;this.Nc=this.Rd=!0;this.h=!1;this.U=b;this.H=this.b=null;this.J=[];this.O=[]}function eu(a,b){a.hc||(a.hc=kk(b),a.w=b.L,a.C=b.B)}
function fu(a,b){a.gc||(a.gc=kk(b),a.j=b.L,a.l=b.B)}function gu(a,b,c){var d=ak(c.b,b);b=Hn(c,b);return a.u?d.width+b.left+b.right:d.height+b.top+b.bottom}
function Yt(a,b,c,d,e){var f=c.B.ownerDocument,g=f.createElement("div");f.createDocumentFragment().appendChild(g);var h=new Vl(e,g,c),l=h.ca.f;h.ca.f=null;a.f=!0;return Yl(h,new Ak(b)).na(function(){this.f=!1;var a=c.B;if(a)for(;g.firstChild;){var b=g.firstChild;g.removeChild(b);b.setAttribute("data-adapt-spec","1");d?a.insertBefore(b,d):a.appendChild(b)}h.ca.f=l;return L(!0)}.bind(a))}
du.prototype.g=function(a){var b=0;if(a&&!hu(this,a))return b;if(!this.jc||a&&iu(this,a))b+=this.D;this.kc||(b+=this.G);return b};du.prototype.I=function(a){var b=0;if(a&&!hu(this,a))return b;a&&iu(this,a)&&(b+=this.D);this.Nc||(b+=this.G);return b};function iu(a,b){return ju(b,a.O,function(){return ku(this.H,b,!1)}.bind(a))}function hu(a,b){return ju(b,a.J,function(){return ku(this.U,b,!0)}.bind(a))}
function ju(a,b,c){var d=b.filter(function(b){return b.A.L===a.L&&b.A.M===a.M});if(0<d.length)return d[0].result;c=c(a);b.push({A:a,result:c});return c}function ku(a,b,c){for(var d=[];a;a=a.parentNode){if(b.L===a)return b.M;d.push(a)}for(a=b.L;a;a=a.parentNode){var e=d.indexOf(a);if(0<=e)return c?!e:!1;for(e=a;e;e=e.previousElementSibling)if(0<=d.indexOf(e))return!0}return b.M}function lu(a){return!a.jc&&a.Rd&&a.gc||!a.kc&&a.Nc&&a.hc?!0:!1}function mu(a){this.F=a}mu.prototype.b=function(){};
mu.prototype.f=function(a){return!!a};mu.prototype.lc=function(a,b,c){(a=this.F.b)&&!a.h&&(a.C&&(a.G=gu(a,a.C,c),a.C=null),a.l&&(a.D=gu(a,a.l,c),a.l=null),a.h=!0)};function nu(a){this.F=a}nu.prototype.b=function(){};nu.prototype.f=function(){return!0};nu.prototype.lc=function(){};function ou(a){this.F=a}t(ou,mu);ou.prototype.b=function(a,b){mu.prototype.b.call(this,a,b);var c=K("BlockLayoutProcessor.doInitialLayout");Sl(new Rl(new pu(a.F,b),b.h),a).Ea(c);return c.result()};ou.prototype.f=function(){return!1};
function qu(a){this.F=a}t(qu,nu);qu.prototype.b=function(a,b){zk(a,this.F)||a.M||b.Sa.unshift(new bu(a));return ru(a,b)};function bu(a){this.A=Xt(a.F,a)}n=bu.prototype;n.tc=function(a,b){var c=this.A.F.b;return c&&!Gn(this.A.B)&&lu(c)?b&&!a||a&&a.b?!1:!0:!0};n.be=function(){var a=this.A.F.b;return a&&lu(a)?(!a.jc&&a.Rd&&a.gc?a.jc=!0:!a.kc&&a.Nc&&a.hc&&(a.kc=!0),!0):!1};n.lc=function(a,b,c,d){(c=this.A.F.b)&&a&&d.j&&(!b||iu(c,b))&&(c.jc=!1,c.Rd=!1)};
n.Ha=function(a,b){var c=this.A.F,d=this.A.F.b;if(!d)return L(!0);var e=this.A;return Zt(c,e,b).na(function(){return Wt(c,e,b).na(function(){d.kc=d.jc=!1;d.Rd=!0;d.Nc=!0;return L(!0)})})};n.Ye=function(a){return a instanceof bu?this.A.F===a.A.F:!1};function su(a){am.call(this);this.F=a}t(su,am);su.prototype.j=function(a){var b=this.F.b;return zk(a,this.F)||b.h?(zk(a,this.F)||a.M||!b||(b.kc=!1,b.Nc=!1),new qu(this.F)):new ou(this.F)};function pu(a,b){this.F=a;this.ca=b}t(pu,Ul);
pu.prototype.ed=function(a){var b=this.F,c=a.A,d=b.b;if(c.parent&&b.h===c.parent.L){switch(c.j){case "header":if(d.hc)c.j="none";else return eu(d,c),L(!0);break;case "footer":if(d.gc)c.j="none";else return fu(d,c),L(!0)}d.b||(d.b=c.L)}return Ul.prototype.ed.call(this,a)};pu.prototype.Zb=function(a){var b=this.F,c=a.A;c.L===b.h&&(b.b.H=a.yc&&a.yc.L,a.Gb=!0);return"header"===c.j||"footer"===c.j?L(!0):Ul.prototype.Zb.call(this,a)};function tu(){}t(tu,Fo);
tu.prototype.Jd=function(a,b,c){if(rn(b,a))return An(b,a);var d=a.F;return cu(d,a)?(c&&$t(a.parent,b),zk(a,d)?Fo.prototype.Jd.call(this,a,b,c):bm(new su(d),a,b)):Bn(b,a)};tu.prototype.ue=function(a){var b=nn(a).b;if(!b)return!1;b.f||b.w!==a.L&&b.j!==a.L||a.B.parentNode.removeChild(a.B);return!1};
function ru(a,b){var c=a.F,d=K("doLayout");Tl(b.h,a,!1).then(function(a){var e=a;me(function(a){for(;e;){var d=!0;xo(b,e,!1).then(function(f){e=f;Pm(b.g)?P(a):b.f?P(a):e&&b.j&&e&&e.b?P(a):e&&e.M&&e.L==c.h?P(a):d?d=!1:O(a)});if(d){d=!1;return}}P(a)}).then(function(){N(d,e)})});return d.result()}tu.prototype.Ha=function(a,b,c,d){return Fo.prototype.Ha.call(this,a,b,c,d)};tu.prototype.hd=function(a,b,c,d){Fo.prototype.hd(a,b,c,d)};
function kn(a){for(var b=[],c=a;c;c=c.Db)c.Sa.forEach(function(c){c instanceof bu&&b.push(c.A.F.b);c instanceof uu&&vu(c,a).forEach(function(a){b.push(a)})});return b}var wu=new tu;Od("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof vo&&!(a instanceof uo)?wu:null});function xu(a,b,c){var d=a.A,e=d.display,f=d.parent?d.parent.display:null;return"table-row"===e&&!yu(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!yu(f)&&"table"!==f&&"inline-table"!==f||d.F instanceof uo&&d.F!==b?Bn(c,d).na(function(b){a.A=b;return L(!0)}):null}function yu(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function zu(a,b){this.rowIndex=a;this.L=b;this.cells=[]}
function Au(a){return Math.min.apply(null,a.cells.map(function(a){return a.height}))}function Bu(a,b,c){this.rowIndex=a;this.Ya=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function Cu(a,b,c){this.rowIndex=a;this.Ya=b;this.cc=c}function Du(a,b,c){this.ca=a;this.b=c;this.Ub=new Vl(a,b,c);this.f=!1}Du.prototype.fc=function(){var a=this.b.B,b=this.b.U;"middle"!==b&&"bottom"!==b||w(a,"vertical-align","top");var c=this.Ub.fc(!0);w(a,"vertical-align",b);return c};
function Eu(a,b){this.B=a;this.b=b}function Fu(a,b,c,d){$l.call(this,a,b,c,d);this.F=a.F;this.rowIndex=this.j=null}t(Fu,$l);Fu.prototype.f=function(a,b){var c=$l.prototype.f.call(this,a,b);return b<this.b()?null:Gu(this).every(function(a){return!!a.A})?c:null};Fu.prototype.b=function(){var a=$l.prototype.b.call(this);Gu(this).forEach(function(b){a+=b.we.b()});return a};function Gu(a){a.j||(a.j=Hu(a).map(function(a){return a.fc()}));return a.j}
function Hu(a){return Iu(a.F,null!=a.rowIndex?a.rowIndex:a.rowIndex=Ju(a.F,a.position.L)).map(a.F.od,a.F)}function Ku(a,b,c){this.rowIndex=a;this.j=b;this.F=c;this.h=null}t(Ku,fn);Ku.prototype.f=function(a,b){if(b<this.b())return null;var c=Lu(this),d=Mu(this),e=d.every(function(a){return!!a.A})&&d.some(function(a,b){var d=a.A,e=c[b].Ub.Ne[0];return!(e.B===d.B&&e.M===d.M&&e.ja===d.ja)});this.j.b=d.some(function(a){return a.A&&a.A.b});return e?this.j:null};
Ku.prototype.b=function(){var a=this.F,b=0;Nu(a,a.f[this.rowIndex])||(b+=10);Mu(this).forEach(function(a){b+=a.we.b()});return b};function Mu(a){a.h||(a.h=Lu(a).map(function(a){return a.fc()}));return a.h}function Lu(a){return Ou(a.F,a.rowIndex).map(a.F.od,a.F)}function uo(a,b){vo.call(this,a,b);this.D=b;this.u=!1;this.w=-1;this.I=0;this.G=[];this.H=this.l=null;this.J=0;this.f=[];this.j=[];this.Xa=[];this.C=null;this.g=[];this.b=null}t(uo,vo);n=uo.prototype;n.re=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};
n.Fe=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.g.length;case "table-cell":return!this.g.some(function(b){return b.ye.pa[0].node===a.L});default:return b}};function Pu(a,b){var c=a.j[b];c||(c=a.j[b]=[]);return c}function Ju(a,b){return a.f.findIndex(function(a){return b===a.L})}function Ou(a,b){return Pu(a,b).reduce(function(a,b){return b.cc!==a[a.length-1]?a.concat(b.cc):a},[])}function Iu(a,b){return Ou(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}
n.od=function(a){return this.Xa[a.rowIndex]&&this.Xa[a.rowIndex][a.Ya]};function Nu(a,b){return Au(b)>a.I/2}function Qu(a){0>a.w&&(a.w=Math.max.apply(null,a.f.map(function(a){return a.cells.reduce(function(a,b){return a+b.b},0)})));return a.w}function Ru(a,b){a.f.forEach(function(a){a.cells.forEach(function(a){var c=ak(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}
function Su(a,b){if(!b)return null;var c=null,d=0;a:for(;d<a.Xa.length;d++)if(a.Xa[d])for(var e=0;e<a.Xa[d].length;e++)if(a.Xa[d][e]&&b===a.Xa[d][e].Ub.ca){c=a.f[d].cells[e];break a}if(!c)return null;for(;d<a.j.length;d++)for(;e<a.j[d].length;e++){var f=a.j[d][e];if(f.cc===c)return{rowIndex:f.rowIndex,Ya:f.Ya}}return null}
function Tu(a,b){var c=[];return a.j.reduce(function(a,e,f){if(f>=b.rowIndex)return a;e=this.od(e[b.Ya].cc);if(!e||0<=c.indexOf(e))return a;Uu(e.Ub.ca,a);c.push(e);return a}.bind(a),[])}function Vu(a){var b=[];a.f.forEach(function(a){a.cells.forEach(function(a,c){b[c]||(b[c]={Ue:[],elements:[]});var d=b[c],e=this.od(a);!e||0<=d.Ue.indexOf(e)||(Uu(e.Ub.ca,d.elements),d.Ue.push(e))}.bind(this))}.bind(a));return[new Wu(b.map(function(a){return a.elements}))]}
function Uu(a,b){a.Sa.forEach(function(a){a instanceof bu&&b.push(a.A.F.b);a instanceof uu&&vu(a,null).forEach(function(a){b.push(a)})})}n.te=function(){return[].concat(this.g)};n.se=function(a){this.g=a};function Wu(a){this.b=a}Wu.prototype.g=function(a){return Xu(this,a,function(a){return a.current})};Wu.prototype.I=function(a){return Xu(this,a,function(a){return a.ae})};function Xu(a,b,c){var d=0;a.b.forEach(function(a){a=gn(b,a);d=Math.max(d,c(a))});return d}
function Yu(a,b){this.F=a;this.ca=b;this.rowIndex=-1;this.Ya=0;this.f=!1}t(Yu,Ul);
Yu.prototype.ed=function(a){var b=this.F,c=xu(a,b,this.ca);if(c)return c;var c=a.A,d=b.b;switch(c.display){case "table":b.J=c.ha;break;case "table-caption":b.G.push(new Eu(c.B,c.Z));break;case "table-header-group":return d.hc||(this.b=!0,eu(d,c)),L(!0);case "table-footer-group":return d.gc||(this.b=!0,fu(d,c)),L(!0);case "table-row":this.b||(this.f=!0,this.rowIndex++,this.Ya=0,b.f[this.rowIndex]=new zu(this.rowIndex,c.L),d.b||(d.b=c.L))}return Ul.prototype.ed.call(this,a)};
Yu.prototype.Zb=function(a){var b=this.F,c=a.A,d=c.display,e=this.ca.b;if(c.L===b.D)d=In(e,cu(b,c)),b.I=parseFloat(d[b.u?"height":"width"]),b.b.H=a.yc&&a.yc.L,a.Gb=!0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b=!1,L(!0);break;case "table-row":this.b||(b.C=c.B,this.f=!1);break;case "table-cell":if(!this.b){this.f||(this.rowIndex++,this.Ya=0,this.f=!0);d=this.rowIndex;c=new Bu(this.rowIndex,this.Ya,c.B);e=b.f[d];e||(b.f[d]=new zu(d,null),e=b.f[d]);e.cells.push(c);
for(var e=d+c.rowSpan,f=Pu(b,d),g=0;f[g];)g++;for(;d<e;d++)for(var f=Pu(b,d),h=g;h<g+c.b;h++){var l=f[h]=new Cu(d,h,c);c.f||(c.f=l)}this.Ya++}}return Ul.prototype.Zb.call(this,a)};function Zu(a,b){this.Pb=!0;this.F=a;this.ca=b;this.j=!1;this.b=-1;this.f=0;this.l=b.j;b.j=!1}t(Zu,Ul);var $u={"table-caption":!0,"table-column-group":!0,"table-column":!0};
function av(a,b,c,d){var e=b.rowIndex,f=b.Ya,g=c.B;if(1<b.b){w(g,"box-sizing","border-box");for(var h=a.F.H,l=0,k=0;k<b.b;k++)l+=h[b.f.Ya+k];l+=a.F.J*(b.b-1);w(g,a.F.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Du(a.ca,b,c);a=a.F;(g=a.Xa[e])||(g=a.Xa[e]=[]);g[f]=c;1===d.Da.pa.length&&d.Da.M&&(c.f=!0);return Yl(c.Ub,d).Ec(!0)}function bv(a,b){var c=a.F.g[0];return c?c.cc.f.Ya===b:!1}
function cv(a){var b=a.F.g;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.cc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function dv(a,b){var c=a.F,d=cv(a),e=d.reduce(function(a){return a+1},0);if(0===e)return L(!0);var f=a.ca.h,g=b.A;g.B.parentNode.removeChild(g.B);var h=K("layoutRowSpanningCellsFromPreviousFragment"),l=L(!0),k=0,m=[];d.forEach(function(a){l=l.na(function(){var b=mk(a[0].ye.pa[1],g.parent);return un(f,b,!1).na(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.B.ownerDocument.createElement("td");w(c,"padding","0");b.B.appendChild(c)}h++}}var g=L(!0),h=0;a.forEach(function(a){g=g.na(function(){var c=
a.cc;d(c.f.Ya);var g=a.ye,l=mk(g.pa[0],b);l.ja=g.ja;l.M=g.M;return un(f,l,!1).na(function(){for(var b=a.Te,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return av(this,c,l,b).na(function(){l.B.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return L(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.na(function(){d(Qu(c));k++;return L(!0)})}.bind(this))}.bind(this))},a);l.then(function(){un(f,g,!0,b.jd).then(function(){N(h,!0)})});return h.result()}
function ev(a,b){if(a.h||a.g)return L(!0);var c=b.A,d=a.F;0>a.b?a.b=Ju(d,c.L):a.b++;a.f=0;a.j=!0;return dv(a,b).na(function(){qo(this.ca,b.yc,null,!0,b.wc)&&!Iu(d,this.b-1).length&&(this.ca.j=this.l,c.b=!0,b.Gb=!0);return L(!0)}.bind(a))}
function fv(a,b){if(a.h||a.g)return L(!0);var c=b.A;a.j||(0>a.b?a.b=0:a.b++,a.f=0,a.j=!0);var d=a.F.f[a.b].cells[a.f],e=ok(c).modify();e.M=!0;b.A=e;var f=K("startTableCell");bv(a,d.f.Ya)?(e=a.F.g.shift(),e=L(e.Te)):e=Tl(a.ca.h,c,b.jd).na(function(a){a.B&&c.B.removeChild(a.B);return L(new Ak(kk(a)))});e.then(function(a){av(this,d,c,a).then(function(){this.Zb(b);this.f++;N(f,!0)}.bind(this))}.bind(a));return f.result()}
Zu.prototype.tf=function(a){var b=xu(a,this.F,this.ca);if(b)return b;var b=a.A,c=this.F.b,d=b.display;return"table-header-group"===d&&c&&c.w===b.L?(this.h=!0,L(!0)):"table-footer-group"===d&&c&&c.j===b.L?(this.g=!0,L(!0)):"table-row"===d?ev(this,a):"table-cell"===d?fv(this,a):L(!0)};Zu.prototype.Xe=function(a){a=a.A;"table-row"===a.display&&(this.j=!1,this.h||this.g||(a=ok(a).modify(),a.M=!1,this.ca.D.push(new Ku(this.b,a,this.F))));return L(!0)};
Zu.prototype.Zb=function(a){var b=a.A,c=this.F.b,d=b.display;"table-header-group"===d?c&&!c.f&&c.w===b.L?(this.h=!1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"):"table-footer-group"===d&&(c&&!c.f&&c.j===b.L?(this.g=!1,b.B.parentNode.removeChild(b.B)):w(b.B,"display","table-row-group"));if(d&&$u[d])b.B.parentNode.removeChild(b.B);else if(b.L===this.F.D)!(c=b.B.style)||po(c.paddingBottom)&&po(c.borderBottomWidth)||(b.b=qo(this.ca,a.yc,null,!1,a.wc)),this.ca.j=this.l,a.Gb=!0;else return Ul.prototype.Zb.call(this,
a);return L(!0)};function gv(){}function hv(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=ak(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function iv(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function jv(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function kv(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function lv(a,b,c){var d=a.u,e=a.C;if(e){a.C=null;var f=e.ownerDocument.createDocumentFragment(),g=Qu(a);if(0<g){var h=a.H=hv(e,g,d,c.b);c=iv(b);e=jv(c);kv(e,c,g,b);e.forEach(function(a,b){w(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.l=f}}
function mv(a,b,c){var d=b.F;d.u=b.u;xq(d,b.u);var e=K("TableLayoutProcessor.doInitialLayout");Sl(new Rl(new Yu(b.F,c),c.h),b).then(function(a){var f=a.B,h=ak(c.b,f),h=c.u?h.left:h.bottom,h=h+(c.u?-1:1)*gn(b,kn(c)).current;ln(c,h)?(lv(d,f,c),Ru(d,c.b),N(e,null)):N(e,a)}.bind(a));return e.result()}function nv(a,b,c){var d=a.G;d.forEach(function(a,f){a&&(b.insertBefore(a.B,c),"top"===a.b&&(d[f]=null))})}function ov(a,b){if(a.l&&b){var c=iv(b);c&&c.forEach(function(a){b.removeChild(a)})}}
function pv(a,b){var c=a.F,d=cu(c,a),e=d.firstChild;nv(c,d,e);c.l&&!iv(d).length&&d.insertBefore(c.l.cloneNode(!0),e);c=new Zu(c,b);c=new Rl(c,b.h);d=K("TableFormattingContext.doLayout");Sl(c,a).Ea(d);return d.result()}n=gv.prototype;n.Jd=function(a,b,c){var d=a.F;return cu(d,a)?(c&&$t(a.parent,b),bm(new qv(d,this),a,b)):Bn(b,a)};n.Ve=function(a,b,c,d){return new Fu(a,b,c,d)};n.ue=function(){return!1};n.Re=function(){return!1};
n.Ha=function(a,b,c,d){var e=b.F;if("table-row"===b.display){var f=Ju(e,b.L);e.g=[];var g;g=b.M?Iu(e,f):Ou(e,f);if(g.length){var h=K("TableLayoutProcessor.finishBreak"),l=0;me(function(a){if(l===g.length)P(a);else{var b=g[l++],c=e.od(b),d=c.fc().A,h=c.b,k=vk(h),u=new Ak(vk(d));e.g.push({ye:k,Te:u,cc:b});h=h.B;Go(c.b);f<b.rowIndex+b.rowSpan-1&&(h.rowSpan=f-b.rowIndex+1);c.f?O(a):c.Ub.Ha(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.ca,h=c.Ub.ca.element,k=c.b.B,l=ak(g.b,k),k=Jn(g,k);f?(b=l.right-
g.G-b.g(d)-k.right,w(h,"max-width",b+"px")):(b=g.G-b.g(d)-l.top-k.top,w(h,"max-height",b+"px"));w(h,"overflow","hidden")}O(a)})}}).then(function(){yo(a,b,!1);Go(b);e.Xa=[];N(h,!0)});return h.result()}}e.Xa=[];return mo.Ha(a,b,c,d)};n.hd=function(a,b,c,d){Fo.prototype.hd(a,b,c,d)};function qv(a,b){am.call(this);this.w=b;this.b=a}t(qv,am);qv.prototype.j=function(a){var b=this.b.b;return b&&b.h?(a.L===this.b.D&&!a.M&&b&&(b.kc=!1,b.Nc=!1),new rv(this.b)):new sv(this.b,this.w)};
qv.prototype.g=function(a){am.prototype.g.call(this,a);ov(this.b,cu(this.b,a))};qv.prototype.f=function(a,b){am.prototype.f.call(this,a,b);this.b.Xa=[]};function sv(a,b){this.F=a;this.g=b}t(sv,mu);sv.prototype.b=function(a,b){mu.prototype.b.call(this,a,b);return mv(this.g,a,b)};function rv(a){this.F=a}t(rv,nu);rv.prototype.b=function(a,b){var c=this.F.b;if(c&&!iu(c,a)){var d=new uu(a);b.Sa.some(function(a){return d.Ye(a)})||b.Sa.unshift(d)}return pv(a,b)};function uu(a){bu.call(this,a)}t(uu,bu);
n=uu.prototype;n.tc=function(a,b,c){var d=this.A.F.b;return!d||c.Db||Gn(this.A.B)||!lu(d)?!0:b&&!a||a&&a.b?!1:!0};n.be=function(a){return tv(a,this.A.F).some(function(b){return b.some(function(b){return b.be(a)})})?!0:bu.prototype.be.call(this,a)};n.lc=function(a,b,c,d){var e=this.A.F;this.b=tv(b,e);this.b.forEach(function(e){e.forEach(function(e){e.lc(a,b,c,d)})});a||(ov(e,cu(e,this.A)),uv(c));bu.prototype.lc.call(this,a,b,c,d)};
n.Ha=function(a,b){var c=K("finishBreak"),d=this.b.reduce(function(a,b){return b.concat(a)},[]),e=0;le(function(){return e<d.length?d[e++].Ha(a,b).Ec(!0):L(!1)}).then(function(){N(c,!0)});return c.result().na(function(){return bu.prototype.Ha.call(this,a,b)}.bind(this))};function uv(a){if(a&&"table-row"===a.display&&a.B)for(;a.B.previousElementSibling;){var b=a.B.previousElementSibling;b.parentNode&&b.parentNode.removeChild(b)}}function tv(a,b){return vv(a,b).map(function(a){return a.Ub.ca.Sa})}
function vv(a,b){var c=Number.MAX_VALUE;a&&"table-row"===a.display&&(c=Ju(b,a.L)+1);for(var c=Math.min(b.Xa.length,c),d=[],e=0;e<c;e++)b.Xa[e]&&(d=d.concat(b.Xa[e]));return d}function vu(a,b){var c=a.A.F,d=Su(c,b);return d?Tu(c,d):Vu(c)}n.Ye=function(a){return a instanceof uu?this.A.F===a.A.F:!1};var wv=new gv;Od("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===vd?(b=a.parent,new uo(b?b.F:null,a.L)):null:null});Od("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof uo?wv:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function xv(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,mb:null,nc:null}:{url:a.url,mb:b(a.startPage),nc:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function yv(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function zv(a,b){qj=a.debug;this.g=!1;this.h=a;this.Jb=new et(a.window||window,a.viewportElement,"main",this.zf.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.rf(b);this.b=new Ta;Object.defineProperty(this,"readyState",{get:function(){return this.Jb.C}})}n=zv.prototype;n.rf=function(a){var b=Object.assign({a:"configure"},yv(a));this.Jb.w(b);Object.assign(this.f,a)};
n.zf=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ua(this.b,b)};n.Qf=function(a,b){this.b.addEventListener(a,b,!1)};n.Tf=function(a,b){this.b.removeEventListener(a,b,!1)};n.Ff=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Av(this,a,null,b,c)};n.Rf=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Av(this,null,a,b,c)};
function Av(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:xv(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},yv(a.f));a.g?a.Jb.w(b):(a.g=!0,Gt(a.Jb,b))}n.Ob=function(){return this.Jb.Ob()};
n.Hf=function(a){a:switch(a){case "left":a="ltr"===this.Ob()?"previous":"next";break a;case "right":a="ltr"===this.Ob()?"next":"previous"}this.Jb.w({a:"moveTo",where:a})};n.Gf=function(a){this.Jb.w({a:"moveTo",url:a})};n.Sf=function(a){a:{var b=this.Jb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=Bt(b,b.Y.ub?At(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};n.Bf=function(){return this.Jb.ha};ba("vivliostyle.viewer.Viewer",zv);
zv.prototype.setOptions=zv.prototype.rf;zv.prototype.addListener=zv.prototype.Qf;zv.prototype.removeListener=zv.prototype.Tf;zv.prototype.loadDocument=zv.prototype.Ff;zv.prototype.loadEPUB=zv.prototype.Rf;zv.prototype.getCurrentPageProgression=zv.prototype.Ob;zv.prototype.navigateToPage=zv.prototype.Hf;zv.prototype.navigateToInternalUrl=zv.prototype.Gf;zv.prototype.queryZoomFactor=zv.prototype.Sf;zv.prototype.getPageSizes=zv.prototype.Bf;ba("vivliostyle.viewer.ZoomType",Ct);
Ct.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",dt);dt.SINGLE_PAGE="singlePage";dt.SPREAD="spread";dt.AUTO_SPREAD="autoSpread";Rt.call(it,"load_vivliostyle","end",void 0);var Bv=16,Cv="ltr";function Dv(a){window.adapt_command(a)}function Ev(){Dv({a:"moveTo",where:"ltr"===Cv?"previous":"next"})}function Fv(){Dv({a:"moveTo",where:"ltr"===Cv?"next":"previous"})}
function Gv(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Dv({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Dv({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Dv({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Dv({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Fv(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Ev(),a.preventDefault();else if("0"===b||"U+0030"===c)Dv({a:"configure",fontSize:Math.round(Bv)}),a.preventDefault();else if("t"===b||"U+0054"===c)Dv({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Bv*=1.2,Dv({a:"configure",fontSize:Math.round(Bv)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Bv/=1.2,Dv({a:"configure",
fontSize:Math.round(Bv)}),a.preventDefault()}
function Hv(a){switch(a.t){case "loaded":a=a.viewer;var b=Cv=a.Ob();a.Fd.setAttribute("data-vivliostyle-page-progression",b);a.Fd.setAttribute("data-vivliostyle-spread-view",a.Y.ub);window.addEventListener("keydown",Gv,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Ev,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Fv,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ra(location.href,Ha(a||"")));break;case "hyperlink":a.internal&&Dv({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||pa("f"),c=a&&a.epubURL||pa("b"),d=a&&a.xmlURL||pa("x"),e=a&&a.defaultPageWidth||pa("w"),f=a&&a.defaultPageHeight||pa("h"),g=a&&a.defaultPageSize||pa("size"),h=a&&a.orientation||pa("orientation"),l=pa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));Gt(new et(window,k,"main",Hv),a)});
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
