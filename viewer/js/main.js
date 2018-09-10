(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
 * Copyright 2015 Trim-marks Inc.
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
 * Copyright 2018 Vivliostyle Foundation
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

var xStart = null;
var yStart = null;
var arrowButton = null;

_knockout2["default"].bindingHandlers.swipePages = {
    init: function init(element, valueAccessor) {
        if (supportTouchEvents && _knockout2["default"].unwrap(valueAccessor())) {
            element.addEventListener("touchstart", function (event) {
                xStart = event.touches[0].clientX;
                yStart = event.touches[0].clientY;
            });
            element.addEventListener("touchmove", function (event) {
                if (xStart !== null && yStart !== null) {
                    var xDiff = event.touches[0].clientX - xStart;
                    var yDiff = event.touches[0].clientY - yStart;
                    if (Math.abs(xDiff) > Math.abs(yDiff)) {
                        if (xDiff < 0) {
                            // swipe to left = go to right
                            arrowButton = document.getElementById("vivliostyle-page-navigation-right");
                        } else {
                            // swipe to right = go to left
                            arrowButton = document.getElementById("vivliostyle-page-navigation-left");
                        }
                    }
                    if (Math.abs(xDiff) + Math.abs(yDiff) >= 16) {
                        if (arrowButton) {
                            arrowButton.click();
                            _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", true);
                        }
                        xStart = null;
                        yStart = null;
                    }
                }
            });
            element.addEventListener("touchend", function (event) {
                if (arrowButton) {
                    _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", false);
                }
                arrowButton = null;
                xStart = null;
                yStart = null;
            });
        }
    }
};

},{"knockout":1}],4:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

var Logger = (function () {
    function Logger() {
        _classCallCheck(this, Logger);

        this.logLevel = LogLevel.ERROR;
    }

    _createClass(Logger, [{
        key: "setLogLevel",
        value: function setLogLevel(logLevel) {
            this.logLevel = logLevel;
        }
    }, {
        key: "debug",
        value: function debug(content) {
            if (this.logLevel === LogLevel.DEBUG) {
                _modelsMessageQueue2["default"].push({
                    type: "debug",
                    content: content
                });
            }
        }
    }, {
        key: "info",
        value: function info(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
                _modelsMessageQueue2["default"].push({
                    type: "info",
                    content: content
                });
            }
        }
    }, {
        key: "warn",
        value: function warn(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
                _modelsMessageQueue2["default"].push({
                    type: "warn",
                    content: content
                });
            }
        }
    }, {
        key: "error",
        value: function error(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN || this.logLevel === LogLevel.ERROR) {
                _modelsMessageQueue2["default"].push({
                    type: "error",
                    content: content
                });
            }
        }
    }]);

    return Logger;
})();

Logger.LogLevel = LogLevel;

var instance = new Logger();

Logger.getLogger = function () {
    return instance;
};

exports["default"] = Logger;
module.exports = exports["default"];

},{"../models/message-queue":7}],5:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

},{"./models/vivliostyle":11,"./vivliostyle-viewer":22,"vivliostyle":23}],6:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

var DocumentOptions = (function () {
    function DocumentOptions() {
        _classCallCheck(this, DocumentOptions);

        var urlOptions = getDocumentOptionsFromURL();
        this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
        this.url = _knockout2["default"].observable(urlOptions.url || null);
        this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
        this.authorStyleSheet = _knockout2["default"].observable(urlOptions.authorStyleSheet);
        this.userStyleSheet = _knockout2["default"].observable(urlOptions.userStyleSheet);
        this.pageSize = new _pageSize2["default"]();

        // write fragment back to URL when updated
        this.fragment.subscribe(function (fragment) {
            if (urlOptions.epubUrl ? fragment == 'epubcfi(/6/2!)' : fragment == 'epubcfi(/2!)') {
                _storesUrlParameters2["default"].removeParameter("f");
            } else {
                var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
                _storesUrlParameters2["default"].setParameter("f", encoded, true);
            }
        });
    }

    _createClass(DocumentOptions, [{
        key: "toObject",
        value: function toObject() {
            function convertStyleSheetArray(arr) {
                return arr.map(function (url) {
                    return {
                        url: url
                    };
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
        }
    }]);

    return DocumentOptions;
})();

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-size":8,"knockout":1}],7:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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
 * Copyright 2015 Trim-marks Inc.
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

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var Mode = {
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom"
};

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "JIS-B5", description: "B5 (JIS)" }, { name: "JIS-B4", description: "B4 (JIS)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

var PageSize = (function () {
    function PageSize(pageSize) {
        _classCallCheck(this, PageSize);

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

    _createClass(PageSize, [{
        key: "copyFrom",
        value: function copyFrom(other) {
            this.mode(other.mode());
            this.presetSize(other.presetSize());
            this.isLandscape(other.isLandscape());
            this.customWidth(other.customWidth());
            this.customHeight(other.customHeight());
            this.isImportant(other.isImportant());
        }
    }, {
        key: "equivalentTo",
        value: function equivalentTo(other) {
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
        }
    }, {
        key: "toCSSDeclarationString",
        value: function toCSSDeclarationString() {
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
        }
    }]);

    return PageSize;
})();

PageSize.Mode = Mode;
PageSize.PresetSize = PageSize.prototype.PresetSize = PresetSize;

exports["default"] = PageSize;
module.exports = exports["default"];

},{"knockout":1}],9:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
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
 * Copyright 2015 Trim-marks Inc.
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

var ViewerOptions = (function () {
    function ViewerOptions(options) {
        _classCallCheck(this, ViewerOptions);

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

    _createClass(ViewerOptions, [{
        key: "copyFrom",
        value: function copyFrom(other) {
            this.fontSize(other.fontSize());
            this.profile(other.profile());
            this.pageViewMode(other.pageViewMode());
            this.zoom(other.zoom());
        }
    }, {
        key: "toObject",
        value: function toObject() {
            return {
                fontSize: this.fontSize(),
                pageViewMode: this.pageViewMode().toString(),
                zoom: this.zoom().zoom,
                fitToScreen: this.zoom().fitToScreen
            };
        }
    }]);

    return ViewerOptions;
})();

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-view-mode":9,"./zoom-options":12,"knockout":1}],11:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vivliostyle = (function () {
    function Vivliostyle() {
        _classCallCheck(this, Vivliostyle);

        this.viewer = null;
        this.constants = null;
        this.profile = null;
    }

    _createClass(Vivliostyle, [{
        key: "setInstance",
        value: function setInstance(vivliostyle) {
            this.viewer = vivliostyle.viewer;
            this.constants = vivliostyle.constants;
            this.profile = vivliostyle.profile;
        }
    }]);

    return Vivliostyle;
})();

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],12:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
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
 * Copyright 2015 Trim-marks Inc.
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

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)", "g");
}

var URLParameterStore = (function () {
    function URLParameterStore() {
        _classCallCheck(this, URLParameterStore);

        this.history = window ? window.history : {};
        this.location = window ? window.location : { url: "" };
    }

    _createClass(URLParameterStore, [{
        key: "getBaseURL",
        value: function getBaseURL() {
            var url = this.location.href;
            url = url.replace(/#.*$/, "");
            return url.replace(/\/[^/]*$/, "/");
        }
    }, {
        key: "getParameter",
        value: function getParameter(name, dontPercentDecode) {
            var url = this.location.href;
            var regexp = getRegExpForParameter(name);
            var results = [];
            var r = undefined;
            while (r = regexp.exec(url)) {
                var value = r[1];
                if (!dontPercentDecode) value = _utilsStringUtil2["default"].percentDecodeAmpersandAndPercent(value);
                results.push(value);
            }
            return results;
        }
    }, {
        key: "setParameter",
        value: function setParameter(name, value, dontPercentEncode) {
            var url = this.location.href;
            if (!dontPercentEncode) value = _utilsStringUtil2["default"].percentEncodeAmpersandAndPercent(value);
            var updated = undefined;
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
        }
    }, {
        key: "removeParameter",
        value: function removeParameter(name) {
            var url = this.location.href;
            var updated = undefined;
            var regexp = getRegExpForParameter(name);
            var r = regexp.exec(url);
            if (r) {
                var end = r.index + r[0].length;
                if (r[0].charAt(0) == '#') {
                    updated = url.substring(0, r.index + 1) + url.substring(end + 1);
                } else {
                    updated = url.substring(0, r.index) + url.substring(end);
                }
            }
            if (this.history.replaceState) {
                this.history.replaceState(null, "", updated);
            } else {
                this.location.href = updated;
            }
        }
    }]);

    return URLParameterStore;
})();

exports["default"] = new URLParameterStore();
module.exports = exports["default"];

},{"../utils/string-util":16}],14:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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
        if (event.metaKey) {
            // Mac Cmd+Down -> End
            return Keys.End;
        }
        return Keys.ArrowDown;
    } else if (key === Keys.ArrowLeft || key === "Left" || keyIdentifier === "Left") {
        return Keys.ArrowLeft;
    } else if (key === Keys.ArrowRight || key === "Right" || keyIdentifier === "Right") {
        return Keys.ArrowRight;
    } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
        if (event.metaKey) {
            // Mac Cmd+Up -> Home
            return Keys.Home;
        }
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
 * Copyright 2015 Trim-marks Inc.
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
 * Copyright 2015 Trim-marks Inc.
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

},{}],17:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var MessageDialog = (function () {
    function MessageDialog(queue) {
        _classCallCheck(this, MessageDialog);

        this.list = queue;
        this.visible = _knockout2["default"].pureComputed(function () {
            return queue().length > 0;
        });
    }

    _createClass(MessageDialog, [{
        key: "getDisplayMessage",
        value: function getDisplayMessage(errorInfo) {
            var e = errorInfo.error;
            var msg = e && (e.toString() || e.frameTrace || e.stack);
            if (msg) {
                msg = msg.split("\n", 1)[0];
            }
            if (!msg) {
                msg = errorInfo.messages.join("\n");
            }
            return msg;
        }
    }]);

    return MessageDialog;
})();

exports["default"] = MessageDialog;
module.exports = exports["default"];

},{"knockout":1}],18:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
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

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _utilsKeyUtil = require("../utils/key-util");

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Navigation = (function () {
    function Navigation(viewerOptions, viewer, settingsPanel, navigationOptions) {
        var _this = this;

        _classCallCheck(this, Navigation);

        this.viewerOptions_ = viewerOptions;
        this.viewer_ = viewer;
        this.settingsPanel_ = settingsPanel;

        this.isDisabled = _knockout2["default"].pureComputed(function () {
            return _this.settingsPanel_.opened() || !_this.viewer_.state.navigatable();
        });

        var navigationDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disablePageNavigation || _this.isDisabled();
        });

        var getSpreadContainerElement = function getSpreadContainerElement() {
            var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
            var outerZoomBoxElement = viewportElement && viewportElement.firstElementChild;
            return outerZoomBoxElement && outerZoomBoxElement.firstElementChild;
        };

        this.isNavigateToPreviousDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            var spreadContainerElement = getSpreadContainerElement();
            var firstPageContainer = spreadContainerElement && spreadContainerElement.firstElementChild;
            return !firstPageContainer || firstPageContainer.style.display != "none";
        });

        this.isNavigateToNextDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return false;
            }
            var spreadContainerElement = getSpreadContainerElement();
            var lastPageContainer = spreadContainerElement && spreadContainerElement.lastElementChild;
            return !lastPageContainer || lastPageContainer.style.display != "none";
        });

        this.isNavigateToLeftDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToPreviousDisabled();
            } else {
                return _this.isNavigateToNextDisabled();
            }
        });

        this.isNavigateToRightDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToNextDisabled();
            } else {
                return _this.isNavigateToPreviousDisabled();
            }
        });

        this.isNavigateToFirstDisabled = this.isNavigateToPreviousDisabled;

        this.isNavigateToLastDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return true;
            }
            var spreadContainerElement = getSpreadContainerElement();
            var lastPageContainer = spreadContainerElement && spreadContainerElement.lastElementChild;
            return !lastPageContainer || lastPageContainer.style.display != "none";
        });

        this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

        var zoomDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableZoom || _this.isDisabled();
        });

        this.isZoomOutDisabled = zoomDisabled;
        this.isZoomInDisabled = zoomDisabled;
        this.isZoomToActualSizeDisabled = zoomDisabled;
        this.isToggleFitToScreenDisabled = zoomDisabled;
        this.hideZoom = !!navigationOptions.disableZoom;

        this.fitToScreen = _knockout2["default"].pureComputed(function () {
            return viewerOptions.zoom().fitToScreen;
        });

        var fontSizeChangeDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableFontSizeChange || _this.isDisabled();
        });

        this.isIncreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDecreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
        this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

        ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomToActualSize", "toggleFitToScreen", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "handleKey"].forEach(function (methodName) {
            _this[methodName] = _this[methodName].bind(_this);
        });
    }

    _createClass(Navigation, [{
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            if (!this.isNavigateToPreviousDisabled()) {
                this.viewer_.navigateToPrevious();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            if (!this.isNavigateToNextDisabled()) {
                this.viewer_.navigateToNext();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            if (!this.isNavigateToLeftDisabled()) {
                this.viewer_.navigateToLeft();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            if (!this.isNavigateToRightDisabled()) {
                this.viewer_.navigateToRight();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            if (!this.isNavigateToFirstDisabled()) {
                this.viewer_.navigateToFirst();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            if (!this.isNavigateToLastDisabled()) {
                this.viewer_.navigateToLast();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomIn",
        value: function zoomIn() {
            if (!this.isZoomInDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomIn(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomOut",
        value: function zoomOut() {
            if (!this.isZoomOutDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomOut(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            if (!this.isZoomToActualSizeDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomToActualSize());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            if (!this.isToggleFitToScreenDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.toggleFitToScreen());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "increaseFontSize",
        value: function increaseFontSize() {
            if (!this.isIncreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                this.viewerOptions_.fontSize(fontSize * 1.25);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "decreaseFontSize",
        value: function decreaseFontSize() {
            if (!this.isDecreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                this.viewerOptions_.fontSize(fontSize * 0.8);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "defaultFontSize",
        value: function defaultFontSize() {
            if (!this.isDefaultFontSizeDisabled()) {
                var fontSize = _modelsViewerOptions2["default"].getDefaultValues().fontSize;
                this.viewerOptions_.fontSize(fontSize);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
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
        }
    }]);

    return Navigation;
})();

exports["default"] = Navigation;
module.exports = exports["default"];

},{"../models/viewer-options":10,"../models/vivliostyle":11,"../utils/key-util":14,"knockout":1}],19:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsPageSize = require("../models/page-size");

var _modelsPageSize2 = _interopRequireDefault(_modelsPageSize);

var _modelsPageViewMode = require("../models/page-view-mode");

var _modelsPageViewMode2 = _interopRequireDefault(_modelsPageViewMode);

var _utilsKeyUtil = require("../utils/key-util");

var SettingsPanel = (function () {
    function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog, settingsPanelOptions) {
        var _this = this;

        _classCallCheck(this, SettingsPanel);

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

    _createClass(SettingsPanel, [{
        key: "close",
        value: function close() {
            this.opened(false);
            return true;
        }
    }, {
        key: "toggle",
        value: function toggle() {
            this.opened(!this.opened());
        }
    }, {
        key: "apply",
        value: function apply() {
            if (this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
                this.viewerOptions_.copyFrom(this.state.viewerOptions);
            } else {
                this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
                this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
            }
        }
    }, {
        key: "reset",
        value: function reset() {
            this.state.viewerOptions.copyFrom(this.viewerOptions_);
            this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
            switch (key) {
                case _utilsKeyUtil.Keys.Escape:
                    this.close();
                    return true;
                default:
                    return true;
            }
        }
    }]);

    return SettingsPanel;
})();

exports["default"] = SettingsPanel;
module.exports = exports["default"];

},{"../models/page-size":8,"../models/page-view-mode":9,"../models/viewer-options":10,"../utils/key-util":14,"knockout":1}],20:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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
    var _this = this;

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

    this.handleKey = function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        var ret = _this.settingsPanel.handleKey(key);
        if (ret) {
            ret = _this.navigation.handleKey(key);
        }
        return ret;
    };

    this.viewer.loadDocument(this.documentOptions);
}

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":10,"../models/vivliostyle":11,"../models/zoom-options":12,"../stores/url-parameters":13,"../utils/key-util":14,"./message-dialog":17,"./navigation":18,"./settings-panel":19,"./viewer":21,"knockout":1}],21:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
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

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _utilsObservableUtil = require("../utils/observable-util");

var _utilsObservableUtil2 = _interopRequireDefault(_utilsObservableUtil);

var _loggingLogger = require("../logging/logger");

var _loggingLogger2 = _interopRequireDefault(_loggingLogger);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Viewer = (function () {
    function Viewer(viewerSettings, viewerOptions) {
        _classCallCheck(this, Viewer);

        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = null;
        this.viewer_ = new _modelsVivliostyle2["default"].viewer.Viewer(viewerSettings, viewerOptions.toObject());
        var state_ = this.state_ = {
            status: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.ReadyState.LOADING),
            pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.PageProgression.LTR)
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

    _createClass(Viewer, [{
        key: "setupViewerEventHandler",
        value: function setupViewerEventHandler() {
            var _this = this;

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
            this.viewer_.addListener("readystatechange", function () {
                var readyState = _this.viewer_.readyState;
                if (readyState === _modelsVivliostyle2["default"].constants.ReadyState.INTERACTIVE || readyState === _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                    _this.state_.pageProgression.value(_this.viewer_.getCurrentPageProgression());
                }
                _this.state_.status.value(readyState);
            });
            this.viewer_.addListener("loaded", function () {
                if (_this.viewerOptions_.profile()) {
                    _modelsVivliostyle2["default"].profile.profiler.printTimings();
                }
            });
            this.viewer_.addListener("nav", function (payload) {
                var cfi = payload.cfi;
                if (cfi) {
                    _this.documentOptions_.fragment(cfi);
                }
            });
            this.viewer_.addListener("hyperlink", function (payload) {
                if (payload.internal) {
                    _this.viewer_.navigateToInternalUrl(payload.href);
                    _this.afterNavigateToPage();
                } else {
                    window.location.href = payload.href;
                }
            });
        }
    }, {
        key: "setupViewerOptionSubscriptions",
        value: function setupViewerOptionSubscriptions() {
            _knockout2["default"].computed(function () {
                var viewerOptions = this.viewerOptions_.toObject();
                this.viewer_.setOptions(viewerOptions);
            }, this).extend({ rateLimit: 0 });
        }
    }, {
        key: "loadDocument",
        value: function loadDocument(documentOptions, viewerOptions) {
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
        }
    }, {
        key: "afterNavigateToPage",
        value: function afterNavigateToPage() {
            var _this2 = this;

            setTimeout(function () {
                // Update page navigation disable/enable
                _this2.state_.status.value(_modelsVivliostyle2["default"].constants.ReadyState.LOADING);
                _this2.state_.status.value(_this2.viewer_.readyState);
            }, 1);
        }
    }, {
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            this.viewer_.navigateToPage("previous");
            this.afterNavigateToPage();
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            this.viewer_.navigateToPage("next");
            this.afterNavigateToPage();
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            this.viewer_.navigateToPage("left");
            this.afterNavigateToPage();
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            this.viewer_.navigateToPage("right");
            this.afterNavigateToPage();
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            this.viewer_.navigateToPage("first");
            this.afterNavigateToPage();
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            this.viewer_.navigateToPage("last");
            this.afterNavigateToPage();
        }
    }, {
        key: "queryZoomFactor",
        value: function queryZoomFactor(type) {
            return this.viewer_.queryZoomFactor(type);
        }
    }]);

    return Viewer;
})();

exports["default"] = Viewer;
module.exports = exports["default"];

},{"../logging/logger":4,"../models/vivliostyle":11,"../utils/observable-util":15,"knockout":1}],22:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
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

var _bindingsSwipePagesJs = require("./bindings/swipePages.js");

var _bindingsSwipePagesJs2 = _interopRequireDefault(_bindingsSwipePagesJs);

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

},{"./bindings/menuButton.js":2,"./bindings/swipePages.js":3,"./viewmodels/viewer-app":20,"knockout":1}],23:[function(require,module,exports){
(function (global){
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 * Vivliostyle core 2018.8.100
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
    var n,aa="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},ba="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function ca(){ca=function(){};ba.Symbol||(ba.Symbol=da)}var ea=0;function da(a){return"jscomp_symbol_"+(a||"")+ea++}
function fa(){ca();var a=ba.Symbol.iterator;a||(a=ba.Symbol.iterator=ba.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&aa(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ga(this)}});fa=function(){}}function ga(a){var b=0;return ha(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function ha(a){fa();a={next:a};a[ba.Symbol.iterator]=function(){return this};return a}function t(a){fa();var b=a[Symbol.iterator];return b?b.call(a):ga(a)}
function ia(a){if(!(a instanceof Array)){a=t(a);for(var b,c=[];!(b=a.next()).done;)c.push(b.value);a=c}return a}function ka(a,b){if(b){for(var c=ba,d=a.split("."),e=0;e<d.length-1;e++){var f=d[e];f in c||(c[f]={});c=c[f]}d=d[d.length-1];e=c[d];f=b(e);f!=e&&null!=f&&aa(c,d,{configurable:!0,writable:!0,value:f})}}
ka("Array.from",function(a){return a?a:function(a,c,d){fa();c=c?c:function(a){return a};var b=[],f=a[Symbol.iterator];if("function"==typeof f)for(a=f.call(a);!(f=a.next()).done;)b.push(c.call(d,f.value));else for(var f=a.length,g=0;g<f;g++)b.push(c.call(d,a[g]));return b}});ka("Object.assign",function(a){return a?a:function(a,c){for(var b=1;b<arguments.length;b++){var e=arguments[b];if(e)for(var f in e)Object.prototype.hasOwnProperty.call(e,f)&&(a[f]=e[f])}return a}});
function la(a,b){fa();a instanceof String&&(a+="");var c=0,d={next:function(){if(c<a.length){var e=c++;return{value:b(e,a[e]),done:!1}}d.next=function(){return{done:!0,value:void 0}};return d.next()}};d[Symbol.iterator]=function(){return d};return d}ka("Array.prototype.values",function(a){return a?a:function(){return la(this,function(a,c){return c})}});
ka("String.prototype.includes",function(a){return a?a:function(a,c){if(null==this)throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");if(a instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");return-1!==(this+"").indexOf(a,c||0)}});
ka("Array.prototype.findIndex",function(a){return a?a:function(a,c){var b;a:{b=this;b instanceof String&&(b=String(b));for(var e=b.length,f=0;f<e;f++)if(a.call(c,b[f],f,b)){b=f;break a}b=-1}return b}});var ma=this;function na(a,b){var c="undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window,d=a.split("."),c=c||ma;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c[e]?c=c[e]:c=c[e]={}:c[e]=b}
function v(a,b){function c(){}c.prototype=b.prototype;a.hg=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.hh=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function oa(a){if(Error.captureStackTrace)Error.captureStackTrace(this,oa);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}v(oa,Error);oa.prototype.name="CustomError";function pa(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function qa(a,b){b.unshift(a);oa.call(this,pa.apply(null,b));b.shift()}v(qa,oa);qa.prototype.name="AssertionError";function ra(a,b){throw new qa("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function sa(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ta(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ua(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.u=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function va(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function wa(a,b){var c=w,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ua.prototype.debug=function(a){var b=ta(arguments);this.h(sa(b));va(this,1,b)};ua.prototype.g=function(a){var b=ta(arguments);this.l(sa(b));va(this,2,b)};ua.prototype.b=function(a){var b=ta(arguments);this.u(sa(b));va(this,3,b)};ua.prototype.error=function(a){var b=ta(arguments);this.j(sa(b));va(this,4,b)};var w=new ua;function xa(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ya=window.location.href,za=window.location.href;
function Aa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function Ba(a){a=new RegExp("#(.*&)?"+Ea(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function Fa(a,b){var c=new RegExp("#(.*&)?"+Ea("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function Ga(a){return null==a?a:a.toString()}function Ha(){this.b=[null]}
Ha.prototype.length=function(){return this.b.length-1};function Ia(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Ja=" -webkit- -moz- -ms- -o- -epub-".split(" "),Ka={};
function La(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[Ia(a,b)]}
function Ma(a){var b=Ka[a];if(b||null===b)return b;switch(a){case "writing-mode":if(La("-ms-","writing-mode"))return Ka[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(La("-webkit-","filter"))return Ka[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(La("-webkit-","clip-path"))return Ka[a]=["-webkit-clip-path","clip-path"]}for(var b=t(Ja),c=b.next();!c.done;c=b.next())if(c=c.value,La(c,a))return b=c+a,Ka[a]=[b],[b];w.b("Property not supported by the browser: ",
a);return Ka[a]=null}function x(a,b,c){try{var d=Ma(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){w.b(e)}}function Na(a,b,c){try{var d=Ka[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Oa(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Pa(){this.b=[]}Pa.prototype.append=function(a){this.b.push(a);return this};Pa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Qa(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ra(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Qa)}
function Sa(a){return a.replace(/[\u0000-\u001F"]/g,Qa)}function Ta(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ua(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Ea(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Va(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(Ea(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Wa(a){if(!a)throw"Assert failed";}function Xa(a,b){for(var c=0,d=a;;){Wa(c<=d);Wa(!c||!b(c-1));Wa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ya(a,b){return a-b}
function Za(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&!c[f]&&(c[f]=e)}return c}var $a={};function ab(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function bb(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function cb(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function db(){this.h={}}
function eb(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}db.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};db.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var fb=null,gb=null,hb=null,ib=null;function jb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function kb(a){return"^"+a}function lb(a){return a.substr(1)}function mb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,lb):a}
function nb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=mb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function ob(){}ob.prototype.g=function(a){a.append("!")};ob.prototype.h=function(){return!1};function pb(a,b,c){this.index=a;this.id=b;this.Db=c}
pb.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.Db)a.append("["),this.id&&a.append(this.id),this.Db&&(a.append(";s="),a.append(this.Db)),a.append("]")};
pb.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.J=!0),a.node=c);if(this.id&&(a.J||this.id!=jb(a.node)))throw Error("E_CFI_ID_MISMATCH");a.Db=this.Db;return!0};function rb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.Db=d}
rb.prototype.h=function(a){if(0<this.offset&&!a.J){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.Db=this.Db;return!0};
rb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.Db){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,kb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,kb));this.Db&&(a.append(";s="),a.append(this.Db));a.append("]")}};function sb(){this.oa=null}
function tb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=nb(c[4]);f.push(new pb(g,h,Ga(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=mb(h));var l=c[7];l&&(l=mb(l));c=nb(c[10]);f.push(new rb(g,h,l,Ga(c.s)));break;case "!":e++;f.push(new ob);break;case "~":case "@":case "":a.oa=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function ub(a,b){for(var c={node:b.documentElement,offset:0,J:!1,Db:null,kd:null},d=0;d<a.oa.length;d++)if(!a.oa[d].h(c)){++d<a.oa.length&&(c.kd=new sb,c.kd.oa=a.oa.slice(d));break}return c}
sb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function vb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new rb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:jb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new pb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.oa?(f.push(new ob),a.oa=f.concat(a.oa)):a.oa=f}sb.prototype.toString=function(){if(!this.oa)return"";var a=new Pa;a.append("epubcfi(");for(var b=0;b<this.oa.length;b++)this.oa[b].g(a);a.append(")");return a.toString()};function wb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,re:!1,je:25,qe:!1,Ce:!1,sb:!1,vc:1,We:{print:!0},mc:void 0}}function xb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,re:a.re,je:a.je,qe:a.qe,Ce:a.Ce,sb:a.sb,vc:a.vc,We:Object.assign({},a.We),mc:a.mc?Object.assign({},a.mc):void 0}}var yb=wb(),zb={};function Ab(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function Bb(a){return'"'+Sa(""+a)+'"'}function Cb(a){return Ra(""+a)}
function Db(a,b){return a?Ra(a)+"."+Ra(b):Ra(b)}var Eb=0;
function Fb(a,b){this.parent=a;this.u="S"+Eb++;this.children=[];this.b=new Gb(this,0);this.f=new Gb(this,1);this.j=new Gb(this,!0);this.h=new Gb(this,!1);a&&a.children.push(this);this.values={};this.C={};this.B={};this.l=b;if(!a){var c=this.B;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=Ab;c["css-string"]=Bb;c["css-name"]=Cb;c["typeof"]=function(a){return typeof a};Hb(this,"page-width",function(){return this.cc()});Hb(this,"page-height",
function(){return this.bc()});Hb(this,"pref-font-family",function(){return this.Z.fontFamily});Hb(this,"pref-night-mode",function(){return this.Z.Ce});Hb(this,"pref-hyphenate",function(){return this.Z.re});Hb(this,"pref-margin",function(){return this.Z.margin});Hb(this,"pref-line-height",function(){return this.Z.lineHeight});Hb(this,"pref-column-width",function(){return this.Z.je*this.fontSize});Hb(this,"pref-horizontal",function(){return this.Z.qe});Hb(this,"pref-spread-view",function(){return this.Z.sb})}}
function Hb(a,b,c){a.values[b]=new Ib(a,c,b)}function Jb(a,b){a.values["page-number"]=b}function Kb(a,b){a.B["has-content"]=b}var Lb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function Mb(a){switch(a){case "q":case "rem":return!0;default:return!1}}
function Nb(a,b,c,d){this.Pa=b;this.Fb=c;this.P=null;this.cc=function(){return this.P?this.P:this.Z.sb?Math.floor(b/2)-this.Z.vc:b};this.N=null;this.bc=function(){return this.N?this.N:c};this.u=d;this.sa=null;this.fontSize=function(){return this.sa?this.sa:d};this.Z=yb;this.H={}}function Ob(a,b){a.H[b.u]={};for(var c=0;c<b.children.length;c++)Ob(a,b.children[c])}
function Pb(a,b,c){return"vw"==b?a.cc()/100:"vh"==b?a.bc()/100:"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b?Lb.ex*(c?a.u:a.fontSize())/Lb.em:Lb[b]}function Qb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Rb(a,b,c,d,e){do{var f=b.C[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.B[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new Gb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Sb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.cc();break;case "height":f=a.bc();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Tb(a){this.b=a;this.g="_"+Eb++}n=Tb.prototype;n.toString=function(){var a=new Pa;this.Ea(a,0);return a.toString()};n.Ea=function(){throw Error("F_ABSTRACT");};n.rb=function(){throw Error("F_ABSTRACT");};n.jb=function(){return this};n.nc=function(a){return a===this};function Ub(a,b,c,d){var e=d[a.g];if(null!=e)return e===zb?!1:e;d[a.g]=zb;b=a.nc(b,c,d);return d[a.g]=b}
n.evaluate=function(a){var b;b=(b=a.H[this.b.u])?b[this.g]:void 0;if("undefined"!=typeof b)return b;b=this.rb(a);var c=this.g,d=this.b,e=a.H[d.u];e||(e={},a.H[d.u]=e);return e[c]=b};n.bf=function(){return!1};function Vb(a,b){Tb.call(this,a);this.f=b}v(Vb,Tb);n=Vb.prototype;n.Qe=function(){throw Error("F_ABSTRACT");};n.Xe=function(){throw Error("F_ABSTRACT");};n.rb=function(a){a=this.f.evaluate(a);return this.Xe(a)};n.nc=function(a,b,c){return a===this||Ub(this.f,a,b,c)};
n.Ea=function(a,b){10<b&&a.append("(");a.append(this.Qe());this.f.Ea(a,10);10<b&&a.append(")")};n.jb=function(a,b){var c=this.f.jb(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Wb(a,b,c){Tb.call(this,a);this.f=b;this.h=c}v(Wb,Tb);n=Wb.prototype;n.vd=function(){throw Error("F_ABSTRACT");};n.cb=function(){throw Error("F_ABSTRACT");};n.Bb=function(){throw Error("F_ABSTRACT");};n.rb=function(a){var b=this.f.evaluate(a);a=this.h.evaluate(a);return this.Bb(b,a)};
n.nc=function(a,b,c){return a===this||Ub(this.f,a,b,c)||Ub(this.h,a,b,c)};n.Ea=function(a,b){var c=this.vd();c<=b&&a.append("(");this.f.Ea(a,c);a.append(this.cb());this.h.Ea(a,c);c<=b&&a.append(")")};n.jb=function(a,b){var c=this.f.jb(a,b),d=this.h.jb(a,b);return c===this.f&&d===this.h?this:new this.constructor(this.b,c,d)};function Xb(a,b,c){Wb.call(this,a,b,c)}v(Xb,Wb);Xb.prototype.vd=function(){return 1};function Yb(a,b,c){Wb.call(this,a,b,c)}v(Yb,Wb);Yb.prototype.vd=function(){return 2};
function Zb(a,b,c){Wb.call(this,a,b,c)}v(Zb,Wb);Zb.prototype.vd=function(){return 3};function $b(a,b,c){Wb.call(this,a,b,c)}v($b,Wb);$b.prototype.vd=function(){return 4};function ac(a,b){Vb.call(this,a,b)}v(ac,Vb);ac.prototype.Qe=function(){return"!"};ac.prototype.Xe=function(a){return!a};function bc(a,b){Vb.call(this,a,b)}v(bc,Vb);bc.prototype.Qe=function(){return"-"};bc.prototype.Xe=function(a){return-a};function cc(a,b,c){Wb.call(this,a,b,c)}v(cc,Xb);cc.prototype.cb=function(){return"&&"};
cc.prototype.rb=function(a){return this.f.evaluate(a)&&this.h.evaluate(a)};function dc(a,b,c){Wb.call(this,a,b,c)}v(dc,cc);dc.prototype.cb=function(){return" and "};function ec(a,b,c){Wb.call(this,a,b,c)}v(ec,Xb);ec.prototype.cb=function(){return"||"};ec.prototype.rb=function(a){return this.f.evaluate(a)||this.h.evaluate(a)};function fc(a,b,c){Wb.call(this,a,b,c)}v(fc,ec);fc.prototype.cb=function(){return", "};function gc(a,b,c){Wb.call(this,a,b,c)}v(gc,Yb);gc.prototype.cb=function(){return"<"};
gc.prototype.Bb=function(a,b){return a<b};function hc(a,b,c){Wb.call(this,a,b,c)}v(hc,Yb);hc.prototype.cb=function(){return"<="};hc.prototype.Bb=function(a,b){return a<=b};function ic(a,b,c){Wb.call(this,a,b,c)}v(ic,Yb);ic.prototype.cb=function(){return">"};ic.prototype.Bb=function(a,b){return a>b};function jc(a,b,c){Wb.call(this,a,b,c)}v(jc,Yb);jc.prototype.cb=function(){return">="};jc.prototype.Bb=function(a,b){return a>=b};function kc(a,b,c){Wb.call(this,a,b,c)}v(kc,Yb);kc.prototype.cb=function(){return"=="};
kc.prototype.Bb=function(a,b){return a==b};function lc(a,b,c){Wb.call(this,a,b,c)}v(lc,Yb);lc.prototype.cb=function(){return"!="};lc.prototype.Bb=function(a,b){return a!=b};function mc(a,b,c){Wb.call(this,a,b,c)}v(mc,Zb);mc.prototype.cb=function(){return"+"};mc.prototype.Bb=function(a,b){return a+b};function nc(a,b,c){Wb.call(this,a,b,c)}v(nc,Zb);nc.prototype.cb=function(){return" - "};nc.prototype.Bb=function(a,b){return a-b};function oc(a,b,c){Wb.call(this,a,b,c)}v(oc,$b);oc.prototype.cb=function(){return"*"};
oc.prototype.Bb=function(a,b){return a*b};function pc(a,b,c){Wb.call(this,a,b,c)}v(pc,$b);pc.prototype.cb=function(){return"/"};pc.prototype.Bb=function(a,b){return a/b};function qc(a,b,c){Wb.call(this,a,b,c)}v(qc,$b);qc.prototype.cb=function(){return"%"};qc.prototype.Bb=function(a,b){return a%b};function rc(a,b,c){Tb.call(this,a);this.K=b;this.ka=c.toLowerCase()}v(rc,Tb);rc.prototype.Ea=function(a){a.append(this.K.toString());a.append(Ra(this.ka))};
rc.prototype.rb=function(a){return this.K*Pb(a,this.ka,!1)};function sc(a,b){Tb.call(this,a);this.f=b}v(sc,Tb);sc.prototype.Ea=function(a){a.append(this.f)};sc.prototype.rb=function(a){return Qb(a,this.b,this.f).evaluate(a)};sc.prototype.nc=function(a,b,c){return a===this||Ub(Qb(b,this.b,this.f),a,b,c)};function tc(a,b,c){Tb.call(this,a);this.f=b;this.name=c}v(tc,Tb);tc.prototype.Ea=function(a){this.f&&a.append("not ");a.append(Ra(this.name))};
tc.prototype.rb=function(a){var b=this.name;a="all"===b||!!a.Z.We[b];return this.f?!a:a};tc.prototype.nc=function(a,b,c){return a===this||Ub(this.value,a,b,c)};tc.prototype.bf=function(){return!0};function Ib(a,b,c){Tb.call(this,a);this.Jc=b;this.Pc=c}v(Ib,Tb);Ib.prototype.Ea=function(a){a.append(this.Pc)};Ib.prototype.rb=function(a){return this.Jc.call(a)};function uc(a,b,c){Tb.call(this,a);this.h=b;this.f=c}v(uc,Tb);
uc.prototype.Ea=function(a){a.append(this.h);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].Ea(a,0);a.append(")")};uc.prototype.rb=function(a){return Rb(a,this.b,this.h,this.f,!1).jb(a,this.f).evaluate(a)};uc.prototype.nc=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Ub(this.f[d],a,b,c))return!0;return Ub(Rb(b,this.b,this.h,this.f,!0),a,b,c)};
uc.prototype.jb=function(a,b){for(var c=this.f,d=c,e=0;e<c.length;e++){var f=c[e].jb(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new uc(this.b,this.h,c)};function vc(a,b,c,d){Tb.call(this,a);this.f=b;this.j=c;this.h=d}v(vc,Tb);vc.prototype.Ea=function(a,b){0<b&&a.append("(");this.f.Ea(a,0);a.append("?");this.j.Ea(a,0);a.append(":");this.h.Ea(a,0);0<b&&a.append(")")};
vc.prototype.rb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.h.evaluate(a)};vc.prototype.nc=function(a,b,c){return a===this||Ub(this.f,a,b,c)||Ub(this.j,a,b,c)||Ub(this.h,a,b,c)};vc.prototype.jb=function(a,b){var c=this.f.jb(a,b),d=this.j.jb(a,b),e=this.h.jb(a,b);return c===this.f&&d===this.j&&e===this.h?this:new vc(this.b,c,d,e)};function Gb(a,b){Tb.call(this,a);this.f=b}v(Gb,Tb);
Gb.prototype.Ea=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Sa(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};Gb.prototype.rb=function(){return this.f};function wc(a,b,c){Tb.call(this,a);this.name=b;this.value=c}v(wc,Tb);wc.prototype.Ea=function(a){a.append("(");a.append(Sa(this.name.name));a.append(":");this.value.Ea(a,0);a.append(")")};
wc.prototype.rb=function(a){return Sb(a,this.name.name,this.value)};wc.prototype.nc=function(a,b,c){return a===this||Ub(this.value,a,b,c)};wc.prototype.jb=function(a,b){var c=this.value.jb(a,b);return c===this.value?this:new wc(this.b,this.name,c)};function xc(a,b){Tb.call(this,a);this.index=b}v(xc,Tb);xc.prototype.Ea=function(a){a.append("$");a.append(this.index.toString())};xc.prototype.jb=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function yc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new cc(a,b,c)}function y(a,b,c){return b===a.b?c:c===a.b?b:new mc(a,b,c)}function B(a,b,c){return b===a.b?new bc(a,c):c===a.b?b:new nc(a,b,c)}function zc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new oc(a,b,c)}function Ac(a,b,c){return b===a.b?a.b:c===a.f?b:new pc(a,b,c)};var Bc={};function Cc(){}n=Cc.prototype;n.jc=function(a){for(var b=0;b<a.length;b++)a[b].ca(this)};n.Ne=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Oe=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.rd=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.ic=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Tc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Sc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Rc=function(a){return this.Sc(a)};
n.be=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Uc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Lb=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.hc=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Ob=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Qc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function Dc(){}v(Dc,Cc);n=Dc.prototype;
n.jc=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.ca(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.rd=function(a){return a};n.ic=function(a){return a};n.Oe=function(a){return a};n.Tc=function(a){return a};n.Sc=function(a){return a};n.Rc=function(a){return a};n.be=function(a){return a};n.Uc=function(a){return a};n.Lb=function(a){var b=this.jc(a.values);return b===a.values?a:new Ec(b)};
n.hc=function(a){var b=this.jc(a.values);return b===a.values?a:new Fc(b)};n.Ob=function(a){var b=this.jc(a.values);return b===a.values?a:new Gc(a.name,b)};n.Qc=function(a){return a};function Hc(){}n=Hc.prototype;n.toString=function(){var a=new Pa;this.Ya(a,!0);return a.toString()};n.stringValue=function(){var a=new Pa;this.Ya(a,!1);return a.toString()};n.za=function(){throw Error("F_ABSTRACT");};n.Ya=function(a){a.append("[error]")};n.$e=function(){return!1};n.sc=function(){return!1};n.cf=function(){return!1};
n.Pf=function(){return!1};n.Md=function(){return!1};function Ic(){if(C)throw Error("E_INVALID_CALL");}v(Ic,Hc);Ic.prototype.za=function(a){return new Gb(a,"")};Ic.prototype.Ya=function(){};Ic.prototype.ca=function(a){return a.Ne(this)};var C=new Ic;function Jc(){if(Kc)throw Error("E_INVALID_CALL");}v(Jc,Hc);Jc.prototype.za=function(a){return new Gb(a,"/")};Jc.prototype.Ya=function(a){a.append("/")};Jc.prototype.ca=function(a){return a.Oe(this)};var Kc=new Jc;function Lc(a){this.Pc=a}v(Lc,Hc);
Lc.prototype.za=function(a){return new Gb(a,this.Pc)};Lc.prototype.Ya=function(a,b){b?(a.append('"'),a.append(Sa(this.Pc)),a.append('"')):a.append(this.Pc)};Lc.prototype.ca=function(a){return a.rd(this)};function Mc(a){this.name=a;if(Bc[a])throw Error("E_INVALID_CALL");Bc[a]=this}v(Mc,Hc);Mc.prototype.za=function(a){return new Gb(a,this.name)};Mc.prototype.Ya=function(a,b){b?a.append(Ra(this.name)):a.append(this.name)};Mc.prototype.ca=function(a){return a.ic(this)};Mc.prototype.Pf=function(){return!0};
function D(a){var b=Bc[a];b||(b=new Mc(a));return b}function F(a,b){this.K=a;this.ka=b.toLowerCase()}v(F,Hc);F.prototype.za=function(a,b){return this.K?b&&"%"==this.ka?100==this.K?b:new oc(a,b,new Gb(a,this.K/100)):new rc(a,this.K,this.ka):a.b};F.prototype.Ya=function(a){a.append(this.K.toString());a.append(this.ka)};F.prototype.ca=function(a){return a.Tc(this)};F.prototype.sc=function(){return!0};function Nc(a){this.K=a}v(Nc,Hc);
Nc.prototype.za=function(a){return this.K?1==this.K?a.f:new Gb(a,this.K):a.b};Nc.prototype.Ya=function(a){a.append(this.K.toString())};Nc.prototype.ca=function(a){return a.Sc(this)};Nc.prototype.cf=function(){return!0};function Oc(a){this.K=a}v(Oc,Nc);Oc.prototype.ca=function(a){return a.Rc(this)};function Pc(a){this.b=a}v(Pc,Hc);Pc.prototype.Ya=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};Pc.prototype.ca=function(a){return a.be(this)};
function Qc(a){this.url=a}v(Qc,Hc);Qc.prototype.Ya=function(a){a.append('url("');a.append(Sa(this.url));a.append('")')};Qc.prototype.ca=function(a){return a.Uc(this)};function Rc(a,b,c,d){var e=b.length;b[0].Ya(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ya(a,d)}function Ec(a){this.values=a}v(Ec,Hc);Ec.prototype.Ya=function(a,b){Rc(a,this.values," ",b)};Ec.prototype.ca=function(a){return a.Lb(this)};Ec.prototype.Md=function(){return!0};function Fc(a){this.values=a}v(Fc,Hc);
Fc.prototype.Ya=function(a,b){Rc(a,this.values,",",b)};Fc.prototype.ca=function(a){return a.hc(this)};function Gc(a,b){this.name=a;this.values=b}v(Gc,Hc);Gc.prototype.Ya=function(a,b){a.append(Ra(this.name));a.append("(");Rc(a,this.values,",",b);a.append(")")};Gc.prototype.ca=function(a){return a.Ob(this)};function G(a){this.Gc=a}v(G,Hc);G.prototype.za=function(){return this.Gc};G.prototype.Ya=function(a){a.append("-epubx-expr(");this.Gc.Ea(a,0);a.append(")")};G.prototype.ca=function(a){return a.Qc(this)};
G.prototype.$e=function(){return!0};function Sc(a,b){if(a){if(a.sc())return Pb(b,a.ka,!1)*a.K;if(a.cf())return a.K}return 0}var Tc=D("absolute"),Uc=D("all"),Vc=D("always"),Wc=D("auto");D("avoid");var Xc=D("balance"),Yc=D("balance-all"),Zc=D("block"),$c=D("block-end"),ad=D("block-start"),bd=D("both"),cd=D("bottom"),dd=D("border-box"),ed=D("break-all"),fd=D("break-word"),gd=D("crop"),hd=D("cross");D("column");
var id=D("exclusive"),jd=D("false"),kd=D("fixed"),ld=D("flex"),md=D("footnote"),nd=D("footer"),od=D("header");D("hidden");var pd=D("horizontal-tb"),qd=D("inherit"),rd=D("inline"),sd=D("inline-block"),td=D("inline-end"),ud=D("inline-start"),vd=D("landscape"),wd=D("left"),xd=D("line"),yd=D("list-item"),zd=D("ltr");D("manual");var J=D("none"),Ad=D("normal"),Bd=D("oeb-page-foot"),Cd=D("oeb-page-head"),Dd=D("page"),Ed=D("relative"),Fd=D("right"),Gd=D("same"),Hd=D("scale"),Id=D("snap-block");D("spread");
var Jd=D("static"),Kd=D("rtl"),Ld=D("table"),Md=D("table-caption"),Nd=D("table-cell"),Od=D("table-footer-group"),Pd=D("table-header-group");D("table-row");var Qd=D("top"),Rd=D("transparent"),Sd=D("vertical-lr"),Td=D("vertical-rl"),Ud=D("visible"),Vd=D("true"),Wd=new F(100,"%"),Xd=new F(100,"vw"),Yd=new F(100,"vh"),Zd=new F(0,"px"),$d={"font-size":1,color:2};function ae(a,b){return($d[a]||Number.MAX_VALUE)-($d[b]||Number.MAX_VALUE)};var be={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR",POST_LAYOUT_BLOCK:"POST_LAYOUT_BLOCK"},ce={};
function de(a,b){if(be[a]){var c=ce[a];c||(c=ce[a]=[]);c.push(b)}else w.b(Error("Skipping unknown plugin hook '"+a+"'."))}function ee(a){return ce[a]||[]}na("vivliostyle.plugin.registerHook",de);na("vivliostyle.plugin.removeHook",function(a,b){if(be[a]){var c=ce[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else w.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var fe=null,ge=null;function L(a){if(!fe)throw Error("E_TASK_NO_CONTEXT");fe.name||(fe.name=a);var b=fe;a=new he(b,b.top,a);b.top=a;a.b=ie;return a}function M(a){return new je(a)}function ke(a,b,c){a=L(a);a.j=c;try{b(a)}catch(d){le(a.f,d,a)}return a.result()}function me(a){var b=ne,c;fe?c=fe.f:(c=ge)||(c=new oe(new pe));b(c,a,void 0)}var ie=1;function pe(){}pe.prototype.currentTime=function(){return(new Date).valueOf()};function qe(a,b){return setTimeout(a,b)}
function oe(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new Ha;this.b=this.u=null;this.j=!1;this.order=0;ge||(ge=this)}
function re(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=qe(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<se(f.b[k],g))k+1<h&&0<se(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<se(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.g){var m=c.f;c.f=null;m&&m.b==c&&(m.b=null,l=fe,fe=m,O(m.top,c.result),fe=l)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){w.error(p)}a.j=!1;a.f.length()&&re(a)},b)}}oe.prototype.pb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<se(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}re(this)};
function ne(a,b,c){var d=new te(a,c||"");d.top=new he(d,null,"bootstrap");d.top.b=ie;d.top.then(function(){function a(){d.j=!1;for(var a=t(d.h),b=a.next();!b.done;b=a.next()){b=b.value;try{b()}catch(h){w.error(h)}}}try{b().then(function(b){d.result=b;a()})}catch(f){le(d,f),a()}});c=fe;fe=d;a.pb(ue(d.top,"bootstrap"));fe=c;return d}function ve(a){this.f=a;this.order=this.b=0;this.result=null;this.g=!1}function se(a,b){return b.b-a.b||b.order-a.order}
ve.prototype.pb=function(a,b){this.result=a;this.f.f.pb(this,b)};function te(a,b){this.f=a;this.name=b;this.h=[];this.g=null;this.j=!0;this.b=this.top=this.l=this.result=null}function we(a,b){a.h.push(b)}te.prototype.join=function(){var a=L("Task.join");if(this.j){var b=ue(a,this),c=this;we(this,function(){b.pb(c.result)})}else O(a,this.result);return a.result()};
function le(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&w.error(a.g,"Unhandled exception in task",a.name)}function je(a){this.value=a}n=je.prototype;n.then=function(a){a(this.value)};n.fa=function(a){return a(this.value)};n.Bc=function(a){return new je(a)};
n.La=function(a){O(a,this.value)};n.Wa=function(){return!1};n.get=function(){return this.value};function xe(a){this.b=a}n=xe.prototype;n.then=function(a){this.b.then(a)};n.fa=function(a){if(this.Wa()){var b=new he(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=ie;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return b.result()}return a(this.b.g)};n.Bc=function(a){return this.Wa()?this.fa(function(){return new je(a)}):new je(a)};
n.La=function(a){this.Wa()?this.then(function(b){O(a,b)}):O(a,this.b.g)};n.Wa=function(){return this.b.b==ie};n.get=function(){if(this.Wa())throw Error("Result is pending");return this.b.g};function he(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function ye(a){if(!fe)throw Error("F_TASK_NO_CONTEXT");if(a!==fe.top)throw Error("F_TASK_NOT_TOP_FRAME");}he.prototype.result=function(){return new xe(this)};
function O(a,b){ye(a);fe.g||(a.g=b);a.b=2;var c=a.parent;fe.top=c;if(a.h){try{a.h(b)}catch(d){le(a.f,d,c)}a.b=3}}he.prototype.then=function(a){switch(this.b){case ie:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,le(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function ze(){var a=L("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(w.debug("-- time slice --"),ue(a).pb(!0)):O(a,!0);return a.result()}function Ae(a){var b=L("Frame.sleep");ue(b).pb(!0,a);return b.result()}function Be(a){function b(d){try{for(;d;){var e=a();if(e.Wa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){le(c.f,f,c)}}var c=L("Frame.loop");b(!0);return c.result()}
function Ce(a){var b=fe;if(!b)throw Error("E_TASK_NO_CONTEXT");return Be(function(){var c;do c=new De(b,b.top),b.top=c,c.b=ie,a(c),c=c.result();while(!c.Wa()&&c.get());return c})}function ue(a,b){ye(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ve(a.f);a.f.b=c;fe=null;a.f.l=b||null;return c}function De(a,b){he.call(this,a,b,"loop")}v(De,he);function P(a){O(a,!0)}function Q(a){O(a,!1)};function Ee(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}Ee.prototype.start=function(){if(!this.b){var a=this;this.b=ne(fe.f,function(){var b=L("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){w.error(f,"Error:")}O(b,c)});return b.result()},this.name)}};function Fe(a,b){a.f?b(a.h):a.g.push(b)}Ee.prototype.get=function(){if(this.f)return M(this.h);this.start();return this.b.join()};
function Ge(a){if(!a.length)return M(!0);if(1==a.length)return a[0].get().Bc(!0);var b=L("waitForFetches"),c=0;Be(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Bc(!0)}return M(!1)}).then(function(){O(b,!0)});return b.result()}
function He(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new Ee(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.pb(b?b.type:"timeout"))}var g=L("loadImage"),h=ue(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return g.result()},"loadElement "+b);e.start();return e};function Ie(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function Je(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,Ie)}function Ke(){this.type=0;this.b=!1;this.K=0;this.text="";this.position=0}
function Le(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var Me=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];Me[NaN]=80;
var Ne=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Ne[NaN]=43;
var Oe=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Ne[NaN]=43;
var Pe=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Pe[NaN]=35;
var Qe=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Qe[NaN]=45;
var Re=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Re[NaN]=37;
var Se=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Se[NaN]=38;
var Te=Le(35,[61,36]),Ue=Le(35,[58,77]),Ve=Le(35,[61,36,124,50]),We=Le(35,[38,51]),Xe=Le(35,[42,54]),Ye=Le(39,[42,55]),Ze=Le(54,[42,55,47,56]),$e=Le(62,[62,56]),af=Le(35,[61,36,33,70]),bf=Le(62,[45,71]),cf=Le(63,[45,56]),df=Le(76,[9,72,10,72,13,72,32,72]),ef=Le(39,[39,46,10,72,13,72,92,48]),ff=Le(39,[34,46,10,72,13,72,92,49]),gf=Le(39,[39,47,10,74,13,74,92,48]),hf=Le(39,[34,47,10,74,13,74,92,49]),jf=Le(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),kf=Le(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),lf=Le(39,[39,68,10,74,13,74,92,75,NaN,67]),mf=Le(39,[34,68,10,74,13,74,92,75,NaN,67]),nf=Le(72,[9,39,10,39,13,39,32,39,41,69]);function of(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new Ke}function R(a){a.h==a.f&&pf(a);return a.j[a.f]}function qf(a,b){(a.h-a.f&a.g)<=b&&pf(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function rf(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}of.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function pf(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new Ke;b=a.h;c=d=a.g}for(var e=Me,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;){var u=f.charCodeAt(g);switch(e[u]||e[65]){case 72:l=51;m=isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=Re;continue;case 3:l=1;k=g++;e=Ne;continue;case 4:k=g++;l=31;e=Te;continue;case 33:l=2;k=++g;e=ef;continue;case 34:l=2;k=++g;e=ff;continue;case 6:k=++g;l=7;e=Ne;continue;case 7:k=g++;l=32;e=Te;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=We;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=Te;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=Pe;continue;case 16:k=g++;e=Oe;continue;case 78:k=g++;l=9;e=Ne;continue;case 17:k=g++;
l=19;e=Xe;continue;case 18:k=g++;l=18;e=Ue;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=af;continue;case 21:k=g++;l=39;e=Te;continue;case 22:k=g++;l=37;e=Te;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=Ne;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=df;continue;case 30:k=g++;l=33;e=Te;continue;case 31:k=g++;l=34;e=Ve;continue;case 32:k=g++;l=35;e=Te;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=Ne;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=Se;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=df;continue;case 45:m=Je(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=Je(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=gf;continue;
case 49:z=g;g+=2;e=hf;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=jf;continue}l=6}break;case 53:m=Je(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=jf;continue}l=6}break;case 54:e=Ye;g++;continue;case 55:e=Ze;g++;continue;case 56:e=Me;g++;continue;case 57:e=$e;g++;continue;case 58:l=5;e=Re;g++;continue;case 59:l=4;e=Se;g++;continue;case 60:l=1;e=Ne;g++;continue;case 61:l=1;e=df;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=kf;continue;case 65:k=++g;e=lf;continue;case 66:k=++g;e=mf;continue;case 67:l=8;m=Je(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=bf;g++;continue;case 71:e=cf;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=Je(f.substring(k,g));g++;e=nf;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=Je(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=Qe;continue;default:e!==Me?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}r.type=l;r.b=q;r.K=p;r.text=m;r.position=k;b++;if(b>=c)break;e=Me;q=!1;r=h[b&d]}a.position=g;a.h=b&d};function sf(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,h=ue(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Rd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;
else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Rd=tf([c]):l.Rd=c:w.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.pb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):(a.match(/file:\/\/.*(\.html$|\.htm$)/)&&g.overrideMimeType("text/html"),g.send(null))}catch(k){w.b(k,
"Error fetching "+a),h.pb(l)}return f.result()}function tf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function uf(a){var b=L("readBlob"),c=new FileReader,d=ue(b,c);c.addEventListener("load",function(){d.pb(c.result)},!1);c.readAsArrayBuffer(a);return b.result()}function vf(a,b){this.ga=a;this.type=b;this.h={};this.j={}}
vf.prototype.load=function(a,b,c){a=xa(a);var d=this.h[a];return"undefined"!=typeof d?M(d):this.fetch(a,b,c).get()};function wf(a,b,c,d){var e=L("fetch");sf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.ga(f,a).then(function(c){delete a.j[b];a.h[b]=c;O(e,c)})});return e.result()}
vf.prototype.fetch=function(a,b,c){a=xa(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new Ee(function(){return wf(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};vf.prototype.get=function(a){return this.h[xa(a)]};function xf(a){a=a.responseText;return M(a?JSON.parse(a):null)};function yf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Pc(b);if(3==a.length)return new Pc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function zf(a){this.f=a;this.mb="Author"}n=zf.prototype;n.ad=function(){return null};n.la=function(){return this.f};n.error=function(){};n.Oc=function(a){this.mb=a};n.Nb=function(){};n.ie=function(){};n.hd=function(){};n.jd=function(){};n.te=function(){};n.yd=function(){};
n.Wb=function(){};n.he=function(){};n.ge=function(){};n.ne=function(){};n.Lc=function(){};n.Kb=function(){};n.Vd=function(){};n.md=function(){};n.Zd=function(){};n.Td=function(){};n.Yd=function(){};n.Nc=function(){};n.Le=function(){};n.zc=function(){};n.Ud=function(){};n.Xd=function(){};n.Wd=function(){};n.pd=function(){};n.od=function(){};n.Ha=function(){};n.Ib=function(){};n.Xb=function(){};n.nd=function(){};n.Fd=function(){};
function Af(a){switch(a.mb){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function Bf(a){switch(a.mb){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Cf(){zf.call(this,null);this.g=[];this.b=null}v(Cf,zf);function Df(a,b){a.g.push(a.b);a.b=b}n=Cf.prototype;n.ad=function(){return null};n.la=function(){return this.b.la()};n.error=function(a,b){this.b.error(a,b)};
n.Oc=function(a){zf.prototype.Oc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Oc(a)};n.Nb=function(a,b){this.b.Nb(a,b)};n.ie=function(a){this.b.ie(a)};n.hd=function(a,b){this.b.hd(a,b)};n.jd=function(a,b){this.b.jd(a,b)};n.te=function(a){this.b.te(a)};n.yd=function(a,b,c,d){this.b.yd(a,b,c,d)};n.Wb=function(){this.b.Wb()};n.he=function(){this.b.he()};n.ge=function(){this.b.ge()};n.ne=function(){this.b.ne()};n.Lc=function(){this.b.Lc()};n.Kb=function(){this.b.Kb()};n.Vd=function(){this.b.Vd()};
n.md=function(a){this.b.md(a)};n.Zd=function(){this.b.Zd()};n.Td=function(){this.b.Td()};n.Yd=function(){this.b.Yd()};n.Nc=function(){this.b.Nc()};n.Le=function(a){this.b.Le(a)};n.zc=function(a){this.b.zc(a)};n.Ud=function(a){this.b.Ud(a)};n.Xd=function(){this.b.Xd()};n.Wd=function(a,b,c){this.b.Wd(a,b,c)};n.pd=function(a,b,c){this.b.pd(a,b,c)};n.od=function(a,b,c){this.b.od(a,b,c)};n.Ha=function(){this.b.Ha()};n.Ib=function(a,b,c){this.b.Ib(a,b,c)};n.Xb=function(){this.b.Xb()};n.nd=function(a){this.b.nd(a)};
n.Fd=function(){this.b.Fd()};function Ef(a,b,c){zf.call(this,a);this.N=c;this.I=0;if(this.na=b)this.mb=b.mb}v(Ef,zf);Ef.prototype.ad=function(){return this.na.ad()};Ef.prototype.error=function(a){w.b(a)};Ef.prototype.Ha=function(){this.I++};Ef.prototype.Xb=function(){if(!--this.I&&!this.N){var a=this.na;a.b=a.g.pop()}};function Ff(a,b,c){Ef.call(this,a,b,c)}v(Ff,Ef);function Gf(a,b){a.error(b,a.ad())}function Hf(a,b){Gf(a,b);Df(a.na,new Ef(a.f,a.na,!1))}n=Ff.prototype;n.Kb=function(){Hf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.Vd=function(){Hf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.md=function(){Hf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.Zd=function(){Hf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Td=function(){Hf(this,"E_CSS_UNEXPECTED_DEFINE")};n.Yd=function(){Hf(this,"E_CSS_UNEXPECTED_REGION")};n.Nc=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE")};n.zc=function(){Hf(this,"E_CSS_UNEXPECTED_WHEN")};n.Ud=function(){Hf(this,"E_CSS_UNEXPECTED_FLOW")};n.Xd=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Wd=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.pd=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION")};n.od=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.nd=function(){Hf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Fd=function(){Hf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.Ib=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.ad())};var If=[],Jf=[],T=[],Kf=[],Lf=[],Mf=[],Nf=[],Of=[],Pf=[],Qf=[],Rf=[],Sf=[],Tf=[];If[1]=28;If[36]=29;If[7]=29;If[9]=29;If[14]=29;If[18]=29;If[20]=30;If[13]=27;If[0]=200;Jf[1]=46;Jf[0]=200;Mf[1]=2;
Mf[36]=4;Mf[7]=6;Mf[9]=8;Mf[14]=10;Mf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;Kf[1]=1;Kf[36]=3;Kf[7]=5;Kf[9]=7;Kf[14]=9;Kf[11]=200;Kf[18]=55;Lf[1]=2;Lf[36]=4;Lf[7]=6;Lf[9]=8;Lf[18]=14;Lf[50]=42;Lf[14]=10;Lf[12]=13;Nf[1]=15;Nf[7]=16;Nf[4]=17;Nf[5]=18;Nf[3]=19;Nf[2]=20;Nf[8]=21;Nf[16]=22;Nf[19]=23;Nf[6]=24;Nf[11]=25;Nf[17]=26;Nf[13]=48;Nf[31]=47;Nf[23]=54;Nf[0]=44;Of[1]=31;Of[4]=32;Of[5]=32;Of[3]=33;Of[2]=34;Of[10]=40;Of[6]=38;
Of[31]=36;Of[24]=36;Of[32]=35;Pf[1]=45;Pf[16]=37;Pf[37]=37;Pf[38]=37;Pf[47]=37;Pf[48]=37;Pf[39]=37;Pf[49]=37;Pf[26]=37;Pf[25]=37;Pf[23]=37;Pf[24]=37;Pf[19]=37;Pf[21]=37;Pf[36]=37;Pf[18]=37;Pf[22]=37;Pf[11]=39;Pf[12]=43;Pf[17]=49;Qf[0]=200;Qf[12]=50;Qf[13]=51;Qf[14]=50;Qf[15]=51;Qf[10]=50;Qf[11]=51;Qf[17]=53;Rf[0]=200;Rf[12]=50;Rf[13]=52;Rf[14]=50;Rf[15]=51;Rf[10]=50;Rf[11]=51;Rf[17]=53;Sf[0]=200;Sf[12]=50;Sf[13]=51;Sf[14]=50;Sf[15]=51;Sf[10]=50;Sf[11]=51;Tf[11]=0;Tf[16]=0;Tf[22]=1;Tf[18]=1;
Tf[26]=2;Tf[25]=2;Tf[38]=3;Tf[37]=3;Tf[48]=3;Tf[47]=3;Tf[39]=3;Tf[49]=3;Tf[41]=3;Tf[23]=4;Tf[24]=4;Tf[36]=5;Tf[19]=5;Tf[21]=5;Tf[0]=6;Tf[52]=2;function Uf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.Y=d;this.F=[];this.N={};this.g=this.H=null;this.C=!1;this.j=2;this.result=null;this.G=!1;this.B=this.I=null;this.l=[];this.h=[];this.P=this.X=!1}function Vf(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Wf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new Ec(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Rf,null;a=new Gc(d[e-1],Vf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Rf,null):1<
g?new Fc(Vf(a,e+1)):d[0]}function Xf(a,b,c){a.b=a.g?Rf:Qf;a.u.error(b,c)}
function Yf(a,b,c){for(var d=a.F,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new fc(e.la(),a,c),g.unshift(a);d.push(new G(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new uc(e.la(),Db(f,b),g);b=0;continue}}if(10==h){f.bf()&&(f=new wc(e.la(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new ac(e.la(),f);else if(-24==h)f=new bc(e.la(),
f);else return Xf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Tf[b]>Tf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new cc(e.la(),g,f);break;case 52:f=new dc(e.la(),g,f);break;case 25:f=new ec(e.la(),g,f);break;case 38:f=new gc(e.la(),g,f);break;case 37:f=new ic(e.la(),g,f);break;case 48:f=new hc(e.la(),g,f);break;case 47:f=new jc(e.la(),g,f);break;case 39:case 49:f=new kc(e.la(),g,f);break;case 41:f=new lc(e.la(),g,f);break;case 23:f=new mc(e.la(),g,f);break;case 24:f=new nc(e.la(),g,f);break;case 36:f=
new oc(e.la(),g,f);break;case 19:f=new pc(e.la(),g,f);break;case 21:f=new qc(e.la(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new vc(e.la(),d.pop(),g,f);break;case 10:if(g.bf())f=new wc(e.la(),g,f);else return Xf(a,"E_CSS_MEDIA_TEST",c),!1}else return Xf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Xf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Xf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Zf(a){for(var b=[];;){var c=R(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.K);break;default:return b}S(a.f)}}
function $f(a){var b=!1,c=R(a.f);if(23===c.type)b=!0,S(a.f),c=R(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.K)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.K);var d=0;S(a.f);var c=R(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=R(a.f));if(5===c.type){d=c.K;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.K),S(a.f),c=R(a.f),5===c.type&&!(0>c.K||1/c.K===1/-0))return S(a.f),[b,c.K]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.K:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.K))return S(a.f),[0,c.K]}return null}
function ag(a,b,c){a=a.u.la();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);b=t(b);for(var d=b.next();!d.done;d=b.next())switch(d.value){case "vertical":c=yc(a,c,new ac(a,new sc(a,"pref-horizontal")));break;case "horizontal":c=yc(a,c,new sc(a,"pref-horizontal"));break;case "day":c=yc(a,c,new ac(a,new sc(a,"pref-night-mode")));break;case "night":c=yc(a,c,new sc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new G(c)}
function bg(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function cg(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.F,k,m,p,q;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=R(h),a.b[k.type]){case 28:if(18!=qf(h,1).type){bg(a)?(g.error("E_CSS_COLON_EXPECTED",qf(h,1)),a.b=Rf):(a.b=Mf,g.Kb());continue}m=qf(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.C=!1;S(h);S(h);a.b=Nf;l.splice(0,l.length);continue;case 46:if(18!=qf(h,1).type){a.b=Rf;g.error("E_CSS_COLON_EXPECTED",qf(h,1));continue}a.g=k.text;a.C=!1;S(h);
S(h);a.b=Nf;l.splice(0,l.length);continue;case 29:a.b=Mf;g.Kb();continue;case 1:if(!k.b){a.b=Sf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.Wb();case 2:if(34==qf(h,1).type)if(S(h),S(h),p=a.N[k.text],null!=p)switch(k=R(h),k.type){case 1:g.Nb(p,k.text);a.b=f?Kf:T;S(h);break;case 36:g.Nb(p,null);a.b=f?Kf:T;S(h);break;default:a.b=Qf,g.error("E_CSS_NAMESPACE",k)}else a.b=Qf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Nb(a.H,k.text),a.b=f?Kf:T,S(h);continue;case 3:if(!k.b){a.b=Sf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.Wb();case 4:if(34==qf(h,1).type)switch(S(h),S(h),k=R(h),k.type){case 1:g.Nb(null,k.text);a.b=f?Kf:T;S(h);break;case 36:g.Nb(null,null);a.b=f?Kf:T;S(h);break;default:a.b=Qf,g.error("E_CSS_NAMESPACE",k)}else g.Nb(a.H,null),a.b=f?Kf:T,S(h);continue;case 5:k.b&&g.Wb();case 6:g.te(k.text);a.b=f?Kf:T;S(h);continue;case 7:k.b&&g.Wb();case 8:g.ie(k.text);a.b=f?Kf:T;S(h);continue;case 55:k.b&&g.Wb();case 14:S(h);k=R(h);b:switch(k.type){case 1:g.hd(k.text,null);S(h);a.b=f?Kf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=Mf;g.nd("not");cg(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=Sf;break a;case "lang":case "href-epub-type":if(k=R(h),1===k.type){p=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=$f(a))break;else break b;default:p=Zf(a)}k=R(h);if(11==k.type){g.hd(m,p);S(h);a.b=f?Kf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Qf;continue;case 42:S(h);k=R(h);switch(k.type){case 1:g.jd(k.text,
null);a.b=f?Kf:T;S(h);continue;case 6:m=k.text;S(h);if("nth-fragment"==m){if(p=$f(a),!p)break}else p=Zf(a);k=R(h);if(11==k.type){g.jd(m,p);a.b=f?Kf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Qf;continue;case 9:k.b&&g.Wb();case 10:S(h);k=R(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=Sf;g.error("E_CSS_ATTR",k);S(h);continue}k=R(h);if(34==k.type){p=m?a.N[m]:m;if(null==p){a.b=Sf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=
R(h);if(1!=k.type){a.b=Sf;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue}m=k.text;S(h);k=R(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;S(h);k=R(h);break;case 15:g.yd(p,m,0,null);a.b=f?Kf:T;S(h);continue;default:a.b=Sf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.yd(p,m,q,k.text);S(h);k=R(h);break;default:a.b=Sf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Sf;g.error("E_CSS_ATTR",k);continue}a.b=f?Kf:
T;S(h);continue;case 11:g.he();a.b=Lf;S(h);continue;case 12:g.ge();a.b=Lf;S(h);continue;case 56:g.ne();a.b=Lf;S(h);continue;case 13:a.X?(a.h.push("-epubx-region"),a.X=!1):a.P?(a.h.push("page"),a.P=!1):a.h.push("[selector]");g.Ha();a.b=If;S(h);continue;case 41:g.Lc();a.b=Mf;S(h);continue;case 15:l.push(D(k.text));S(h);continue;case 16:try{l.push(yf(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=Qf}S(h);continue;case 17:l.push(new Nc(k.K));S(h);continue;case 18:l.push(new Oc(k.K));S(h);continue;case 19:l.push(new F(k.K,
k.text));S(h);continue;case 20:l.push(new Lc(k.text));S(h);continue;case 21:l.push(new Qc(Aa(k.text,a.Y)));S(h);continue;case 22:Wf(a,",",k);l.push(",");S(h);continue;case 23:l.push(Kc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=Of,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Wf(a,")",k);S(h);continue;case 47:S(h);k=R(h);m=qf(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){S(h);a.C=!0;continue}Xf(a,"E_CSS_SYNTAX",
k);continue;case 54:m=qf(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);continue}}a.b===Nf&&0<=h.b?(rf(h),a.b=Mf,g.Kb()):Xf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Wf(a,";",k))&&a.g&&g.Ib(a.g,m,a.C);a.b=d?Jf:If;continue;case 44:S(h);h.b=-1;m=Wf(a,";",k);if(c)return a.result=m,!0;a.g&&m&&g.Ib(a.g,m,a.C);if(d)return!0;Xf(a,"E_CSS_SYNTAX",k);continue;case 31:m=qf(h,1);9==m.type?(10!=qf(h,2).type||qf(h,2).b?(l.push(new sc(g.la(),Db(k.text,m.text))),a.b=Pf):(l.push(k.text,
m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new tc(g.la(),!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new tc(g.la(),!1,k.text))):l.push(new sc(g.la(),k.text)),a.b=Pf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new Gb(g.la(),k.K));S(h);a.b=Pf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new rc(g.la(),k.K,m));S(h);a.b=Pf;continue;case 34:l.push(new Gb(g.la(),k.text));
S(h);a.b=Pf;continue;case 35:S(h);k=R(h);5!=k.type||k.b?Xf(a,"E_CSS_SYNTAX",k):(l.push(new xc(g.la(),k.K)),S(h),a.b=Pf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=Of;Yf(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=Of,Yf(a,52,k),l.push(52),S(h)):Xf(a,"E_CSS_SYNTAX",k);continue;case 39:Yf(a,k.type,k)&&(a.g?a.b=Nf:Xf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:Yf(a,11,k)&&(a.g||3==a.j?Xf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.zc(l.pop()):(k=
l.pop(),g.zc(k)),a.h.push("media"),g.Ha(),a.b=If));S(h);continue;case 49:if(Yf(a,11,k))if(a.g||3!=a.j)Xf(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.B=l.pop(),a.G=!0,a.b=If,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=If;S(h);g.Xb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=R(h);if(2==k.type||8==k.type){a.I=k.text;S(h);k=R(h);if(17==k.type||0==k.type)return a.G=!0,S(h),!1;a.g=null;a.j=3;a.b=Of;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",
k);a.b=Qf;continue;case "namespace":S(h);k=R(h);switch(k.type){case 1:m=k.text;S(h);k=R(h);if((2==k.type||8==k.type)&&17==qf(h,1).type){a.N[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==qf(h,1).type){a.H=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Qf;continue;case "charset":S(h);k=R(h);if(2==k.type&&17==qf(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Qf;
continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==qf(h,1).type){S(h);S(h);switch(m){case "font-face":g.Vd();break;case "-epubx-page-template":g.Xd();break;case "-epubx-define":g.Td();break;case "-epubx-viewport":g.Zd()}a.h.push(m);g.Ha();continue}break;case "-adapt-footnote-area":S(h);k=R(h);switch(k.type){case 12:S(h);g.md(null);a.h.push(m);g.Ha();continue;case 50:if(S(h),k=R(h),1==k.type&&12==qf(h,1).type){m=k.text;S(h);S(h);g.md(m);a.h.push("-adapt-footnote-area");
g.Ha();continue}}break;case "-epubx-region":S(h);g.Yd();a.X=!0;a.b=Mf;continue;case "page":S(h);g.Nc();a.P=!0;a.b=Lf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k=R(h);if(12==k.type){S(h);g.Le(m);a.h.push(m);g.Ha();
continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=Of;l.push("{");continue;case "media":S(h);a.g=null;a.j=2;a.b=Of;l.push("{");continue;case "-epubx-flow":if(1==qf(h,1).type&&12==qf(h,2).type){g.Ud(qf(h,1).text);S(h);S(h);S(h);a.h.push(m);g.Ha();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=R(h);q=p=null;var r=[];1==k.type&&(p=k.text,S(h),k=R(h));18==k.type&&1==qf(h,1).type&&(q=qf(h,1).text,S(h),S(h),k=R(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&
1==qf(h,1).type&&11==qf(h,2).type;)r.push(qf(h,1).text),S(h),S(h),S(h),k=R(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.Wd(p,q,r);break;case "-epubx-partition":g.pd(p,q,r);break;case "-epubx-partition-group":g.od(p,q,r)}a.h.push(m);g.Ha();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Sf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Qf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Qf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||
d)return!0;if(!a.l.length){a.b=If;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=If);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=If);S(h);continue;case 200:return f&&(S(h),g.Fd()),!0;default:if(c||d)return!0;if(e)return Yf(a,11,k)?(a.result=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===Nf&&0<=h.b?(rf(h),a.b=Mf,g.Kb()):a.b!==Qf&&a.b!==Sf&&a.b!==Rf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",
k),a.b=bg(a)?Rf:Sf):S(h)}return!1}function dg(a){zf.call(this,null);this.f=a}v(dg,zf);dg.prototype.error=function(a){throw Error(a);};dg.prototype.la=function(){return this.f};
function eg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Uf(If,a,b,c),h=null;e&&(h=fg(new of(e,b),b,c));if(h=ag(g,d,h&&h.za()))b.zc(h),b.Ha();Be(function(){for(var a={};!cg(g,100,!1,!1,!1,!1);){if(g.G){var d=Aa(g.I,c);g.B&&(b.zc(g.B),b.Ha());a.we=L("parseStylesheet.import");gg(d,b,null,null).then(function(a){return function(){g.B&&b.Xb();g.G=!1;g.I=null;g.B=null;O(a.we,!0)}}(a));return a.we.result()}d=ze();if(d.Wa)return d;a={we:a.we}}return M(!1)}).then(function(){h&&b.Xb();O(f,!0)});return f.result()}
function hg(a,b,c,d,e){return ke("parseStylesheetFromText",function(f){var g=new of(a,b);eg(g,b,c,d,e).La(f)},function(b,c){w.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function gg(a,b,c,d){return ke("parseStylesheetFromURL",function(e){sf(a).then(function(f){f.responseText?hg(f.responseText,b,a,c,d).then(function(b){b||w.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){w.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function ig(a,b){var c=new Uf(Nf,b,new dg(a),"");cg(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result}function fg(a,b,c){a=new Uf(Of,a,b,c);cg(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result}var jg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function kg(a,b,c){if(b.$e())a:{b=b.Gc;a=b.evaluate(a);switch(typeof a){case "number":c=jg[c]?a==Math.round(a)?new Oc(a):new Nc(a):new F(a,"px");break a;case "string":c=a?ig(b.b,new of(a,null)):C;break a;case "boolean":c=a?Vd:jd;break a;case "undefined":c=C;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function lg(a,b,c,d){this.U=a;this.R=b;this.T=c;this.O=d}function mg(a,b){this.f=a;this.b=b}function ng(){this.bottom=this.right=this.top=this.left=0}function og(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function pg(a,b,c,d){this.R=a;this.O=b;this.U=c;this.T=d;this.right=this.left=null}function qg(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function rg(a){this.b=a}function sg(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new og(e,g,1,c):new og(g,e,-1,c));e=g}}
function tg(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new mg(a+c*Math.sin(g),b+d*Math.cos(g)))}return new rg(e)}function ug(a,b,c,d){return new rg([new mg(a,b),new mg(c,b),new mg(c,d),new mg(a,d)])}function vg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function wg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function xg(a,b,c,d){var e,f;b.f.b<c&&w.b("Error: inconsistent segment (1)");b.b.b<=c?(c=wg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=wg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new vg(c,e,b.g,-1)),a.push(new vg(d,f,b.g,1))):(a.push(new vg(d,f,b.g,-1)),a.push(new vg(c,e,b.g,1)))}
function yg(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function zg(a,b){return b?Math.ceil(a/b)*b:a}function Ag(a,b){return b?Math.floor(a/b)*b:a}function Bg(a){return new mg(a.b,-a.f)}function Cg(a){return new lg(a.R,-a.T,a.O,-a.U)}
function Dg(a){return new rg(bb(a.b,Bg))}
function Eg(a,b,c,d,e){e&&(a=Cg(a),b=bb(b,Dg),c=bb(c,Dg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)sg(b[l],h,l);for(l=0;l<f;l++)sg(c[l],h,l+e);b=h.length;h.sort(qg);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.R&&g.push(new pg(a.R,c,a.T,a.T));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.O,r=Math.min(zg(Math.ceil(c+8),d),a.O);for(k=0;k<p.length&&q>r;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(Ag(m.f.b,d),r)):m.b.f!=m.f.f&&(q=r);q>a.O&&(q=
a.O);for(;l<b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<r){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=r;l++}else{k=Ag(m.b.b,d);k<q&&(q=k);break}r=[];for(k=0;k<p.length;k++)xg(r,p[k],c,q);r.sort(function(a,b){return a.f-b.f||a.g-b.g});r=yg(r,e,f);if(r.length){var z=0,u=a.U;for(k=0;k<r.length;k+=2){var A=Math.max(a.U,r[k]),H=Math.min(a.T,r[k+1])-A;H>z&&(z=H,u=A)}z?g.push(new pg(c,q,Math.max(u,a.U),Math.min(u+z,a.T))):g.push(new pg(c,q,a.T,a.T))}else g.push(new pg(c,q,a.T,a.T));if(q==a.O)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}Fg(a,g);return g}function Fg(a,b){for(var c=b.length-1,d=new pg(a.O,a.O,a.U,a.T);0<=c;){var e=d,d=b[c];if(1>d.O-d.R||d.U==e.U&&d.T==e.T)e.R=d.R,b.splice(c,1),d=e;c--}}function Gg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].O?c=e+1:d=e}return c}
function Hg(a,b){if(!a.length)return b;for(var c=b.R,d,e=0;e<a.length&&!(d=a[e],d.O>b.R&&d.U-.1<=b.U&&d.T+.1>=b.T);e++)c=Math.max(c,d.O);for(var f=c;e<a.length&&!(d=a[e],d.R>=b.O||d.U-.1>b.U||d.T+.1<b.T);e++)f=d.O;f=e===a.length?b.O:Math.min(f,b.O);return f<=c?null:new lg(b.U,c,b.T,f)}
function Ig(a,b){if(!a.length)return b;for(var c=b.O,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.O<b.O)&&!(d.R<b.O&&d.U-.1<=b.U&&d.T+.1>=b.T);e--)c=Math.min(c,d.R);for(var f=Math.min(c,d.O);0<=e&&!(d=a[e],d.O<=b.R||d.U-.1>b.U||d.T+.1<b.T);e--)f=d.R;f=Math.max(f,b.R);return c<=f?null:new lg(b.U,f,b.T,c)};function Jg(){this.b={}}v(Jg,Cc);Jg.prototype.ic=function(a){this.b[a.name]=!0;return a};Jg.prototype.Lb=function(a){this.jc(a.values);return a};function Kg(a){this.value=a}v(Kg,Cc);Kg.prototype.Rc=function(a){this.value=a.K;return a};function Lg(a,b){if(a){var c=new Kg(b);try{return a.ca(c),c.value}catch(d){w.b(d,"toInt: ")}}return b}function Mg(){this.b=!1;this.f=[];this.name=null}v(Mg,Cc);Mg.prototype.Tc=function(a){this.b&&this.f.push(a);return null};
Mg.prototype.Sc=function(a){this.b&&!a.K&&this.f.push(new F(0,"px"));return null};Mg.prototype.Lb=function(a){this.jc(a.values);return null};Mg.prototype.Ob=function(a){this.b||(this.b=!0,this.jc(a.values),this.b=!1,this.name=a.name.toLowerCase());return null};
function Ng(a,b,c,d,e,f){if(0<a.f.length){var g=[];a.f.forEach(function(b,c){if("%"==b.ka){var h=c%2?e:d;3==c&&"circle"==a.name&&(h=Math.sqrt((d*d+e*e)/2));g.push(b.K*h/100)}else g.push(b.K*Pb(f,b.ka,!1))});switch(a.name){case "polygon":if(!(g.length%2)){for(var h=[],l=0;l<g.length;l+=2)h.push(new mg(b+g[l],c+g[l+1]));return new rg(h)}break;case "rectangle":if(4==g.length)return ug(b+g[0],c+g[1],b+g[0]+g[2],c+g[1]+g[3]);break;case "ellipse":if(4==g.length)return tg(b+g[0],c+g[1],g[2],g[3]);break;
case "circle":if(3==g.length)return tg(b+g[0],c+g[1],g[2],g[2])}}return null}function Og(a,b,c,d,e,f){if(a){var g=new Mg;try{return a.ca(g),Ng(g,b,c,d,e,f)}catch(h){w.b(h,"toShape:")}}return ug(b,c,b+d,c+e)}function Pg(a){this.f=a;this.b={};this.name=null}v(Pg,Cc);Pg.prototype.ic=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};Pg.prototype.Rc=function(a){this.name&&(this.b[this.name]+=a.K-(this.f?0:1));return a};
Pg.prototype.Lb=function(a){this.jc(a.values);return a};function Qg(a,b){var c=new Pg(b);try{a.ca(c)}catch(d){w.b(d,"toCounters:")}return c.b}function Rg(a,b){this.b=a;this.f=b}v(Rg,Dc);Rg.prototype.Uc=function(a){return new Qc(this.f.gc(a.url,this.b))};function Sg(a){this.f=this.g=null;this.b=0;this.bb=a}function Tg(a,b){this.b=-1;this.f=a;this.g=b}function Ug(){this.W=[];this.b=[];this.match=[];this.f=[];this.error=[];this.g=!0}Ug.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.b[a[c]].b=b;a.splice(0,a.length)};
Ug.prototype.clone=function(){for(var a=new Ug,b=0;b<this.W.length;b++){var c=this.W[b],d=new Sg(c.bb);d.b=c.b;a.W.push(d)}for(b=0;b<this.b.length;b++)c=this.b[b],d=new Tg(c.f,c.g),d.b=c.b,a.b.push(d);a.match.push.apply(a.match,[].concat(ia(this.match)));a.f.push.apply(a.f,[].concat(ia(this.f)));a.error.push.apply(a.error,[].concat(ia(this.error)));return a};
function Vg(a,b,c,d){var e=a.W.length,f=new Sg(Wg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.W.push(f);a.connect(b,e);c=new Tg(e,!0);e=new Tg(e,!1);b.push(a.b.length);a.b.push(e);b.push(a.b.length);a.b.push(c)}function Xg(a){return 1==a.W.length&&!a.W[0].b&&a.W[0].bb instanceof Yg}
function Zg(a,b,c){if(b.W.length){var d=a.W.length;if(4==c&&1==d&&Xg(b)&&Xg(a)){c=a.W[0].bb;b=b.W[0].bb;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.W[0].bb=new Yg(c.b|b.b,d,e)}else{for(f=0;f<b.W.length;f++)a.W.push(b.W[f]);4==c?(a.g=!0,a.connect(a.f,d)):a.connect(a.match,d);g=a.b.length;for(f=0;f<b.b.length;f++)e=b.b[f],e.f+=d,0<=e.b&&(e.b+=d),a.b.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.f.length;f++)a.match.push(b.f[f]+g);else if(a.g){for(f=0;f<b.f.length;f++)a.f.push(b.f[f]+g);a.g=b.g}else for(f=0;f<b.f.length;f++)a.error.push(b.f[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.W=null;b.b=null}}}var U={};function $g(){}v($g,Cc);$g.prototype.h=function(a,b){var c=a[b].ca(this);return c?[c]:null};function Yg(a,b,c){this.b=a;this.f=b;this.g=c}v(Yg,$g);n=Yg.prototype;n.Ne=function(a){return this.b&1?a:null};
n.Oe=function(a){return this.b&2048?a:null};n.rd=function(a){return this.b&2?a:null};n.ic=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Tc=function(a){return a.K||this.b&512?0>a.K&&!(this.b&256)?null:this.g[a.ka]?a:null:"%"==a.ka&&this.b&1024?a:null};n.Sc=function(a){return a.K?0>=a.K&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.Rc=function(a){return a.K?0>=a.K&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.K])?a:null:this.b&512?a:null};
n.be=function(a){return this.b&64?a:null};n.Uc=function(a){return this.b&128?a:null};n.Lb=function(){return null};n.hc=function(){return null};n.Ob=function(){return null};n.Qc=function(){return null};var Wg=new Yg(0,U,U);
function ah(a){this.b=new Sg(null);var b=this.g=new Sg(null),c=a.W.length;a.W.push(this.b);a.W.push(b);a.connect(a.match,c);a.connect(a.f,c+1);a.connect(a.error,c+1);for(var b=t(a.b),d=b.next();!d.done;d=b.next())d=d.value,d.g?a.W[d.f].g=a.W[d.b]:a.W[d.f].f=a.W[d.b];for(b=0;b<c;b++)if(!a.W[b].f||!a.W[b].g)throw Error("Invalid validator state");this.f=a.W[0]}v(ah,$g);
function bh(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.f;else{var k=b[g],m;if(f.b)m=!0,-1==f.b?(h?h.push(l):h=[l],l=[]):-2==f.b?0<h.length?l=h.pop():l=null:0<f.b&&!(f.b%2)?l[Math.floor((f.b-1)/2)]="taken":m=null==l[Math.floor((f.b-1)/2)],f=m?f.g:f.f;else{if(!g&&!c&&f.bb instanceof ch&&a instanceof ch){if(m=(new Ec(b)).ca(f.bb)){g=b.length;f=f.g;continue}}else if(!g&&!c&&f.bb instanceof dh&&a instanceof ch){if(m=(new Fc(b)).ca(f.bb)){g=b.length;f=f.g;continue}}else m=
k.ca(f.bb);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.g}else f=f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=ah.prototype;n.yb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.b?c=c.g:(b=a.ca(c.bb))?(a=null,c=c.g):c=c.f:c=c.f;return c===this.b?b:null};n.Ne=function(a){return this.yb(a)};n.Oe=function(a){return this.yb(a)};n.rd=function(a){return this.yb(a)};n.ic=function(a){return this.yb(a)};n.Tc=function(a){return this.yb(a)};n.Sc=function(a){return this.yb(a)};
n.Rc=function(a){return this.yb(a)};n.be=function(a){return this.yb(a)};n.Uc=function(a){return this.yb(a)};n.Lb=function(){return null};n.hc=function(){return null};n.Ob=function(a){return this.yb(a)};n.Qc=function(){return null};function ch(a){ah.call(this,a)}v(ch,ah);ch.prototype.Lb=function(a){var b=bh(this,a.values,!1,0);return b===a.values?a:b?new Ec(b):null};
ch.prototype.hc=function(a){for(var b=this.f,c=!1;b;){if(b.bb instanceof dh){c=!0;break}b=b.f}return c?(b=bh(this,a.values,!1,0),b===a.values?a:b?new Fc(b):null):null};ch.prototype.h=function(a,b){return bh(this,a,!0,b)};function dh(a){ah.call(this,a)}v(dh,ah);dh.prototype.Lb=function(a){return this.yb(a)};dh.prototype.hc=function(a){var b=bh(this,a.values,!1,0);return b===a.values?a:b?new Fc(b):null};dh.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.bb.h(a,b))return d;c=c.f}return null};
function eh(a,b){ah.call(this,b);this.name=a}v(eh,ah);eh.prototype.yb=function(){return null};eh.prototype.Ob=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=bh(this,a.values,!1,0);return b===a.values?a:b?new Gc(a.name,b):null};function fh(){}fh.prototype.b=function(a,b){return b};fh.prototype.f=function(){};function gh(a,b){this.name=b;this.bb=a.g[this.name]}v(gh,fh);
gh.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.bb.h(a,b)){var d=a.length;this.f(1<d?new Ec(a):a[0],c);return b+d}return b};gh.prototype.f=function(a,b){b.values[this.name]=a};function hh(a,b){gh.call(this,a,b[0]);this.g=b}v(hh,gh);hh.prototype.f=function(a,b){for(var c=0;c<this.g.length;c++)b.values[this.g[c]]=a};function ih(a,b){this.W=a;this.mf=b}v(ih,fh);
ih.prototype.b=function(a,b,c){var d=b;if(this.mf)if(a[b]==Kc){if(++b==a.length)return d}else return d;var e=this.W[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.W.length&&b<a.length;d++){e=this.W[d].b(a,b,c);if(e==b)break;b=e}return b};function jh(){this.f=this.ub=null;this.error=!1;this.values={};this.b=null}n=jh.prototype;n.clone=function(){var a=new this.constructor;a.ub=this.ub;a.f=this.f;a.b=this.b;return a};n.Pe=function(a,b){this.ub=a;this.f=b};n.Cc=function(){this.error=!0;return 0};
function kh(a,b){a.Cc([b]);return null}n.Ne=function(a){return kh(this,a)};n.rd=function(a){return kh(this,a)};n.ic=function(a){return kh(this,a)};n.Tc=function(a){return kh(this,a)};n.Sc=function(a){return kh(this,a)};n.Rc=function(a){return kh(this,a)};n.be=function(a){return kh(this,a)};n.Uc=function(a){return kh(this,a)};n.Lb=function(a){this.Cc(a.values);return null};n.hc=function(){this.error=!0;return null};n.Ob=function(a){return kh(this,a)};n.Qc=function(){this.error=!0;return null};
function lh(){jh.call(this)}v(lh,jh);lh.prototype.Cc=function(a){for(var b=0,c=0;b<a.length;){var d=this.ub[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.ub.length){this.error=!0;break}}return b};function mh(){jh.call(this)}v(mh,jh);mh.prototype.Cc=function(a){if(a.length>this.ub.length||!a.length)return this.error=!0,0;for(var b=0;b<this.ub.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.ub[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function nh(){jh.call(this)}v(nh,jh);
nh.prototype.Cc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===Kc){b=c;break}if(b>this.ub.length||!a.length)return this.error=!0,0;for(c=0;c<this.ub.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.ub[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function oh(){jh.call(this)}v(oh,lh);
oh.prototype.hc=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof Fc)this.error=!0;else{a.values[c].ca(this);for(var d=this.values,e=t(this.f),f=e.next();!f.done;f=e.next()){var f=f.value,g=d[f]||this.b.l[f],h=b[f];h||(h=[],b[f]=h);h.push(g)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new Fc(b[l]);return null};
function ph(){jh.call(this)}v(ph,lh);ph.prototype.Pe=function(a,b){lh.prototype.Pe.call(this,a,b);this.f.push("font-family","line-height","font-size")};
ph.prototype.Cc=function(a){var b=lh.prototype.Cc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.b.g;if(!a[b].ca(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===Kc){b++;if(b+2>a.length||!a[b].ca(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new Ec(a.slice(b,a.length));if(!d.ca(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
ph.prototype.hc=function(a){a.values[0].ca(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new Fc(b);a.ca(this.b.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};ph.prototype.ic=function(a){if(a=this.b.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var qh={SIMPLE:lh,INSETS:mh,INSETS_SLASH:nh,COMMA:oh,FONT:ph};
function rh(){this.g={};this.B={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function sh(a,b){var c;if(3==b.type)c=new F(b.K,b.text);else if(7==b.type)c=yf(b.text);else if(1==b.type)c=D(b.text);else throw Error("unexpected replacement");if(Xg(a)){var d=a.W[0].bb.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function th(a,b,c){for(var d=new Ug,e=0;e<b;e++)Zg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Zg(d,a,3);else for(e=b;e<c;e++)Zg(d,a.clone(),2);return d}function uh(a){var b=new Ug,c=b.W.length;b.W.push(new Sg(a));a=new Tg(c,!0);var d=new Tg(c,!1);b.connect(b.match,c);b.g?(b.f.push(b.b.length),b.g=!1):b.error.push(b.b.length);b.b.push(d);b.match.push(b.b.length);b.b.push(a);return b}
function vh(a,b){var c;switch(a){case "COMMA":c=new dh(b);break;case "SPACE":c=new ch(b);break;default:c=new eh(a.toLowerCase(),b)}return uh(c)}
function wh(a){a.b.HASHCOLOR=uh(new Yg(64,U,U));a.b.POS_INT=uh(new Yg(32,U,U));a.b.POS_NUM=uh(new Yg(16,U,U));a.b.POS_PERCENTAGE=uh(new Yg(8,U,{"%":C}));a.b.NEGATIVE=uh(new Yg(256,U,U));a.b.ZERO=uh(new Yg(512,U,U));a.b.ZERO_PERCENTAGE=uh(new Yg(1024,U,U));a.b.POS_LENGTH=uh(new Yg(8,U,{em:C,ex:C,ch:C,rem:C,vh:C,vw:C,vmin:C,vmax:C,cm:C,mm:C,"in":C,px:C,pt:C,pc:C,q:C}));a.b.POS_ANGLE=uh(new Yg(8,U,{deg:C,grad:C,rad:C,turn:C}));a.b.POS_TIME=uh(new Yg(8,U,{s:C,ms:C}));a.b.FREQUENCY=uh(new Yg(8,U,{Hz:C,
kHz:C}));a.b.RESOLUTION=uh(new Yg(8,U,{dpi:C,dpcm:C,dppx:C}));a.b.URI=uh(new Yg(128,U,U));a.b.IDENT=uh(new Yg(4,U,U));a.b.STRING=uh(new Yg(2,U,U));a.b.SLASH=uh(new Yg(2048,U,U));var b={"font-family":D("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function xh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function yh(a,b,c){var d=R(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=R(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=R(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=R(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=R(b).type)throw Error("'=' expected");xh(d)||(a.B[d]=e)}else if(18!=R(b).type)throw Error("':' expected");return d}
function zh(a,b){for(var c={};;){var d=yh(a,b,1);if(!d)break;c.qa=[];var e=[];c.$a="";var f=void 0;c.Za=!0;c.cg=a;for(var g=function(a){return function(){if(!a.qa.length)throw Error("No values");var b;if(1==a.qa.length)b=a.qa[0];else{var c=a.$a,d=a.qa;b=new Ug;if("||"==c){for(c=0;c<d.length;c++){var e=new Ug;if(e.W.length)throw Error("invalid call");var f=new Sg(Wg);f.b=2*c+1;e.W.push(f);var f=new Tg(0,!0),g=new Tg(0,!1);e.f.push(e.b.length);e.b.push(g);e.match.push(e.b.length);e.b.push(f);Zg(e,d[c],
1);Vg(e,e.match,!1,c);Zg(b,e,c?4:1)}d=new Ug;if(d.W.length)throw Error("invalid call");Vg(d,d.match,!0,-1);Zg(d,b,3);b=[d.match,d.f,d.error];for(c=0;c<b.length;c++)Vg(d,b[c],!1,-1);b=d}else{switch(c){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(c=0;c<d.length;c++)Zg(b,d[c],c?e:1)}}return b}}(c),h=function(a){return function(b){if(a.Za)throw Error("'"+b+"': unexpected");if(a.$a&&a.$a!=b)throw Error("mixed operators: '"+b+"' and '"+a.$a+"'");a.$a=b;a.Za=
!0}}(c),l=null;!l;)switch(S(b),f=R(b),f.type){case 1:c.Za||h(" ");if(xh(f.text)){var k=a.b[f.text];if(!k)throw Error("'"+f.text+"' unexpected");c.qa.push(k.clone())}else k={},k[f.text.toLowerCase()]=D(f.text),c.qa.push(uh(new Yg(0,k,U)));c.Za=!1;break;case 5:k={};k[""+f.K]=new Oc(f.K);c.qa.push(uh(new Yg(0,k,U)));c.Za=!1;break;case 34:h("|");break;case 25:h("||");break;case 14:c.Za||h(" ");e.push({qa:c.qa,$a:c.$a,Gb:"["});c.$a="";c.qa=[];c.Za=!0;break;case 6:c.Za||h(" ");e.push({qa:c.qa,$a:c.$a,Gb:"(",
Jc:f.text});c.$a="";c.qa=[];c.Za=!0;break;case 15:f=g();k=e.pop();if("["!=k.Gb)throw Error("']' unexpected");c.qa=k.qa;c.qa.push(f);c.$a=k.$a;c.Za=!1;break;case 11:f=g();k=e.pop();if("("!=k.Gb)throw Error("')' unexpected");c.qa=k.qa;c.qa.push(vh(k.Jc,f));c.$a=k.$a;c.Za=!1;break;case 18:if(c.Za)throw Error("':' unexpected");S(b);c.qa.push(sh(c.qa.pop(),R(b)));break;case 22:if(c.Za)throw Error("'?' unexpected");c.qa.push(th(c.qa.pop(),0,1));break;case 36:if(c.Za)throw Error("'*' unexpected");c.qa.push(th(c.qa.pop(),
0,Number.POSITIVE_INFINITY));break;case 23:if(c.Za)throw Error("'+' unexpected");c.qa.push(th(c.qa.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");var m=k=f.K;S(b);f=R(b);if(16==f.type){S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");m=f.K;S(b);f=R(b)}if(13!=f.type)throw Error("'}' expected");c.qa.push(th(c.qa.pop(),k,m));break;case 17:l=g();if(0<e.length)throw Error("unclosed '"+e.pop().Gb+"'");break;default:throw Error("unexpected token");
}S(b);xh(d)?a.b[d]=l:a.g[d]=1!=l.W.length||l.W[0].b?new ch(l):l.W[0].bb;c={qa:c.qa,cg:c.cg,$a:c.$a,Za:c.Za}}}function Ah(a,b){for(var c={},d=t(b),e=d.next();!e.done;e=d.next())for(var e=e.value,f=a.h[e],e=t(f?f.f:[e]),f=e.next();!f.done;f=e.next()){var f=f.value,g=a.l[f];g?c[f]=g:w.b("Unknown property in makePropSet:",f)}return c}
function Bh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.B[b])&&h[f])if(f=a.g[b])(a=c===qd||c.$e()?c:c.ca(f))?e.Jb(b,a,d):e.bd(g,c);else if(b=a.h[b].clone(),c===qd)for(c=t(b.f),g=c.next();!g.done;g=c.next())e.Jb(g.value,qd,d);else{c.ca(b);if(b.error)d=!1;else{a=t(b.f);for(f=a.next();!f.done;f=a.next())f=f.value,e.Jb(f,b.values[f]||b.b.l[f],d);d=!0}d||e.bd(g,c)}else e.$d(g,c)}
var Ch=new Ee(function(){var a=L("loadValidatorSet.load"),b=Aa("validation.txt",za),c=sf(b),d=new rh;wh(d);c.then(function(c){try{if(c.responseText){var e=new of(c.responseText,null);for(zh(d,e);;){var g=yh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=R(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(D(h.text));break;case 4:c.push(new Nc(h.K));break;case 5:c.push(new Oc(h.K));break;case 3:c.push(new F(h.K,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new Ec(c):
c[0]}for(;;){var l=yh(d,e,3);if(!l)break;var k=qf(e,1),m;1==k.type&&qh[k.text]?(m=new qh[k.text],S(e)):m=new lh;m.b=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(S(e),k=R(e),k.type){case 1:if(d.g[k.text])h.push(new gh(m.b,k.text)),q.push(k.text);else if(d.h[k.text]instanceof mh){var r=d.h[k.text];h.push(new hh(r.b,r.f));q.push.apply(q,[].concat(ia(r.f)))}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");
c=!0;break;case 14:p.push({mf:c,ub:h});h=[];c=!1;break;case 15:var z=new ih(h,c),u=p.pop(),h=u.ub;c=u.mf;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.Pe(h,q);d.h[l]=m}d.j=Ah(d,["background"]);d.u=Ah(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else w.error("Error: missing",b)}catch(A){w.error(A,"Error:")}O(a,d)});return a.result()},"validatorFetcher");var Dh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Eh=["box-decoration-break","image-resolution","orphans","widows"];function Fh(){return ee("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(Eh))}
for(var Gh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Hh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Ih=["max-%","min-%","%"],Jh=["left","right","top","bottom"],Kh={width:!0,height:!0,"max-width":!0,"max-height":!0,"min-width":!0,"min-height":!0},Lh=0;Lh<Hh.length;Lh++)for(var Mh=0;Mh<Jh.length;Mh++){var Nh=Hh[Lh].replace("%",Jh[Mh]);Kh[Nh]=!0}
function Oh(a,b){for(var c={},d=t(Hh),e=d.next();!e.done;e=d.next()){var e=e.value,f;for(f in a){var g=e.replace("%",f),h=e.replace("%",a[f]);c[g]=h;c[h]=g}}d=t(Ih);for(f=d.next();!f.done;f=d.next()){f=f.value;for(var l in b)e=f.replace("%",l),g=f.replace("%",b[l]),c[e]=g,c[g]=e}return c}
var Ph=Oh({"block-start":"right","block-end":"left","inline-start":"top","inline-end":"bottom"},{"block-size":"width","inline-size":"height"}),Qh=Oh({"block-start":"top","block-end":"bottom","inline-start":"left","inline-end":"right"},{"block-size":"height","inline-size":"width"}),Rh=Oh({"block-start":"right","block-end":"left","inline-start":"bottom","inline-end":"top"},{"block-size":"width","inline-size":"height"}),Sh=Oh({"block-start":"top","block-end":"bottom","inline-start":"right","inline-end":"left"},
{"block-size":"height","inline-size":"width"});function V(a,b){this.value=a;this.ab=b}n=V.prototype;n.Kf=function(){return this};n.Hd=function(a){a=this.value.ca(a);return a===this.value?this:new V(a,this.ab)};n.Mf=function(a){return a?new V(this.value,this.ab+a):this};n.evaluate=function(a,b){return kg(a,this.value,b)};n.tf=function(){return!0};function Th(a,b,c){V.call(this,a,b);this.ia=c}v(Th,V);Th.prototype.Kf=function(){return new V(this.value,this.ab)};
Th.prototype.Hd=function(a){a=this.value.ca(a);return a===this.value?this:new Th(a,this.ab,this.ia)};Th.prototype.Mf=function(a){return a?new Th(this.value,this.ab+a,this.ia):this};Th.prototype.tf=function(a){return!!this.ia.evaluate(a)};function Uh(a,b,c){return(!b||c.ab>b.ab)&&c.tf(a)?c.Kf():b}var Vh={"region-id":!0,"fragment-selector-id":!0};function Wh(a){return"_"!=a.charAt(0)&&!Vh[a]}function Xh(a,b,c){c?a[b]=c:delete a[b]}function Yh(a,b){var c=a[b];c||(c={},a[b]=c);return c}
function Zh(a){var b=a._viewConditionalStyles;b||(b=[],a._viewConditionalStyles=b);return b}function $h(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function ai(a,b,c,d,e,f,g){[{id:e,gg:"_pseudos"},{id:f,gg:"_regions"}].forEach(function(a){if(a.id){var c=Yh(b,a.gg);b=c[a.id];b||(b={},c[a.id]=b)}});g&&(e=Zh(b),b={},e.push({Gg:b,wg:g}));for(var h in c)"_"!=h.charAt(0)&&(Vh[h]?(g=c[h],e=$h(b,h),Array.prototype.push.apply(e,g)):Xh(b,h,Uh(a,b[h],c[h].Mf(d))))}
function bi(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function ci(a,b){this.g=a;this.f=b;this.b=""}v(ci,Dc);function di(a){a=a.g["font-size"].value;var b;a:switch(a.ka.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.K*Lb[a.ka]}
ci.prototype.Tc=function(a){if("font-size"===this.b){var b=di(this),c=this.f;a=ei(a,b,c);var d=a.ka,e=a.K;return"px"===d?a:"%"===d?new F(e/100*b,"px"):new F(e*Pb(c,d,!1),"px")}if("em"==a.ka||"ex"==a.ka||"rem"==a.ka)return ei(a,di(this),this.f);if("%"==a.ka){if("line-height"===this.b)return a;b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new F(a.K,b)}return a};ci.prototype.Qc=function(a){return"font-size"==this.b?kg(this.f,a,this.b).ca(this):a};
function ei(a,b,c){var d=a.ka,e=a.K;return"em"===d||"ex"===d?new F(Lb[d]/Lb.em*e*b,"px"):"rem"===d?new F(e*c.fontSize(),"px"):a}function fi(){}fi.prototype.apply=function(){};fi.prototype.l=function(a){return new gi([this,a])};fi.prototype.clone=function(){return this};function hi(a){this.b=a}v(hi,fi);hi.prototype.apply=function(a){var b=this.b.g(a);a.h[a.h.length-1].push(b)};function gi(a){this.b=a}v(gi,fi);gi.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};
gi.prototype.l=function(a){this.b.push(a);return this};gi.prototype.clone=function(){return new gi([].concat(this.b))};function ii(a,b,c,d,e){this.style=a;this.$=b;this.b=c;this.h=d;this.j=e}v(ii,fi);ii.prototype.apply=function(a){ai(a.l,a.F,this.style,this.$,this.b,this.h,ji(a,this.j))};function W(){this.b=null}v(W,fi);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function ki(a){this.b=null;this.h=a}v(ki,W);
ki.prototype.apply=function(a){a.G.includes(this.h)&&this.b.apply(a)};ki.prototype.f=function(){return 10};ki.prototype.g=function(a){this.b&&li(a.Ma,this.h,this.b);return!0};function mi(a){this.b=null;this.id=a}v(mi,W);mi.prototype.apply=function(a){a.X!=this.id&&a.ha!=this.id||this.b.apply(a)};mi.prototype.f=function(){return 11};mi.prototype.g=function(a){this.b&&li(a.g,this.id,this.b);return!0};function ni(a){this.b=null;this.localName=a}v(ni,W);
ni.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};ni.prototype.f=function(){return 8};ni.prototype.g=function(a){this.b&&li(a.qd,this.localName,this.b);return!0};function oi(a,b){this.b=null;this.h=a;this.localName=b}v(oi,W);oi.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};oi.prototype.f=function(){return 8};oi.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);li(a.h,b+this.localName,this.b)}return!0};
function pi(a){this.b=null;this.h=a}v(pi,W);pi.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function qi(a){this.b=null;this.h=a}v(qi,W);qi.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function ri(a,b){this.b=null;this.h=a;this.name=b}v(ri,W);
ri.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};function si(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}v(si,W);si.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};si.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};si.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&li(a.f,this.value,this.b),!0):!1};
function ti(a,b){this.b=null;this.h=a;this.name=b}v(ti,W);ti.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&Gh[b]&&this.b.apply(a)}};ti.prototype.f=function(){return 0};ti.prototype.g=function(){return!1};function ui(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}v(ui,W);ui.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function vi(a){this.b=null;this.h=a}v(vi,W);
vi.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};function wi(){this.b=null}v(wi,W);wi.prototype.apply=function(a){a.qb&&this.b.apply(a)};wi.prototype.f=function(){return 6};function xi(){this.b=null}v(xi,W);xi.prototype.apply=function(a){a.sa&&this.b.apply(a)};xi.prototype.f=function(){return 12};function yi(a,b){this.b=null;this.h=a;this.Gb=b}v(yi,W);function zi(a,b,c){a-=c;return b?!(a%b)&&0<=a/b:!a}function Ai(a,b){yi.call(this,a,b)}v(Ai,yi);
Ai.prototype.apply=function(a){zi(a.Pa,this.h,this.Gb)&&this.b.apply(a)};Ai.prototype.f=function(){return 5};function Bi(a,b){yi.call(this,a,b)}v(Bi,yi);Bi.prototype.apply=function(a){zi(a.Eb[a.j][a.f],this.h,this.Gb)&&this.b.apply(a)};Bi.prototype.f=function(){return 5};function Ci(a,b){yi.call(this,a,b)}v(Ci,yi);Ci.prototype.apply=function(a){var b=a.P;null===b&&(b=a.P=a.b.parentNode.childElementCount-a.Pa+1);zi(b,this.h,this.Gb)&&this.b.apply(a)};Ci.prototype.f=function(){return 4};
function Di(a,b){yi.call(this,a,b)}v(Di,yi);Di.prototype.apply=function(a){var b=a.xb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}zi(b[a.j][a.f],this.h,this.Gb)&&this.b.apply(a)};Di.prototype.f=function(){return 4};function Ei(){this.b=null}v(Ei,W);Ei.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};
Ei.prototype.f=function(){return 4};function Fi(){this.b=null}v(Fi,W);Fi.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Fi.prototype.f=function(){return 5};function Gi(){this.b=null}v(Gi,W);Gi.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Gi.prototype.f=function(){return 5};function Hi(){this.b=null}v(Hi,W);Hi.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Hi.prototype.f=function(){return 5};
function Ii(a){this.b=null;this.ia=a}v(Ii,W);Ii.prototype.apply=function(a){if(a.ga[this.ia])try{a.ib.push(this.ia),this.b.apply(a)}finally{a.ib.pop()}};Ii.prototype.f=function(){return 5};function Ji(){this.b=!1}v(Ji,fi);Ji.prototype.apply=function(){this.b=!0};Ji.prototype.clone=function(){var a=new Ji;a.b=this.b;return a};function Ki(a){this.b=null;this.h=new Ji;this.j=bi(a,this.h)}v(Ki,W);Ki.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};Ki.prototype.f=function(){return this.j.f()};
function Li(a,b,c){this.ia=a;this.b=b;this.j=c}function Mi(a,b){var c=a.ia,d=a.j;b.ga[c]=(b.ga[c]||0)+1;d&&(b.B[c]?b.B[c].push(d):b.B[c]=[d])}function Ni(a,b){Oi(b,a.ia,a.j)}function Pi(a,b,c){Li.call(this,a,b,c)}v(Pi,Li);Pi.prototype.g=function(a){return new Pi(this.ia,this.b,ji(a,this.b))};Pi.prototype.push=function(a,b){b||Mi(this,a);return!1};Pi.prototype.f=function(a,b){return b?!1:(Ni(this,a),!0)};function Qi(a,b,c){Li.call(this,a,b,c)}v(Qi,Li);
Qi.prototype.g=function(a){return new Qi(this.ia,this.b,ji(a,this.b))};Qi.prototype.push=function(a,b){b?1==b&&Ni(this,a):Mi(this,a);return!1};Qi.prototype.f=function(a,b){if(b)1==b&&Mi(this,a);else return Ni(this,a),!0;return!1};function Ri(a,b,c){Li.call(this,a,b,c);this.h=!1}v(Ri,Li);Ri.prototype.g=function(a){return new Ri(this.ia,this.b,ji(a,this.b))};Ri.prototype.push=function(a){return this.h?(Ni(this,a),!0):!1};
Ri.prototype.f=function(a,b){if(this.h)return Ni(this,a),!0;b||(this.h=!0,Mi(this,a));return!1};function Si(a,b,c){Li.call(this,a,b,c);this.h=!1}v(Si,Li);Si.prototype.g=function(a){return new Si(this.ia,this.b,ji(a,this.b))};Si.prototype.push=function(a,b){this.h&&(-1==b?Mi(this,a):b||Ni(this,a));return!1};Si.prototype.f=function(a,b){if(this.h){if(-1==b)return Ni(this,a),!0;b||Mi(this,a)}else b||(this.h=!0,Mi(this,a));return!1};function Ti(a,b){this.b=a;this.element=b}Ti.prototype.g=function(){return this};
Ti.prototype.push=function(){return!1};Ti.prototype.f=function(a,b){return b?!1:(Ui(a,this.b,this.element),!0)};function Vi(a){this.lang=a}Vi.prototype.g=function(){return this};Vi.prototype.push=function(){return!1};Vi.prototype.f=function(a,b){return b?!1:(a.lang=this.lang,!0)};function Wi(a){this.b=a}Wi.prototype.g=function(){return this};Wi.prototype.push=function(){return!1};Wi.prototype.f=function(a,b){return b?!1:(a.I=this.b,!0)};function Xi(a){this.element=a}v(Xi,Dc);
function Yi(a,b){switch(b){case "url":return a?new Qc(a):new Qc("about:invalid");default:return a?new Lc(a):new Lc("")}}
Xi.prototype.Ob=function(a){if("attr"!==a.name)return Dc.prototype.Ob.call(this,a);var b="string",c;a.values[0]instanceof Ec?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?Yi(a.values[1].stringValue(),b):Yi(null,b);return this.element&&this.element.hasAttribute(c)?Yi(this.element.getAttribute(c),b):a};function Zi(a,b,c){this.f=a;this.element=b;this.b=c}v(Zi,Dc);
Zi.prototype.ic=function(a){var b=this.f,c=b.I,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.C)];b.C++;break;case "close-quote":return 0<b.C&&b.C--,c[2*Math.min(d,b.C)+1];case "no-open-quote":return b.C++,new Lc("");case "no-close-quote":return 0<b.C&&b.C--,new Lc("")}return a};
var $i={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},aj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
bj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},cj={ih:!1,Yc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Nd:"\u5341\u767e\u5343",zg:"\u8ca0"};
function dj(a){if(9999<a||-9999>a)return""+a;if(!a)return cj.Yc.charAt(0);var b=new Pa;0>a&&(b.append(cj.zg),a=-a);if(10>a)b.append(cj.Yc.charAt(a));else if(cj.jh&&19>=a)b.append(cj.Nd.charAt(0)),a&&b.append(cj.Nd.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(cj.Yc.charAt(c)),b.append(cj.Nd.charAt(2)));if(c=Math.floor(a/100)%10)b.append(cj.Yc.charAt(c)),b.append(cj.Nd.charAt(1));if(c=Math.floor(a/10)%10)b.append(cj.Yc.charAt(c)),b.append(cj.Nd.charAt(0));(a%=10)&&b.append(cj.Yc.charAt(a))}return b.toString()}
Zi.prototype.format=function(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if($i[b])a:{e=$i[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(aj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=aj[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=bj[b]?e=bj[b]:"decimal-leading-zero"==b?(e=""+a,1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=dj(a):e=""+a;return c?e.toUpperCase():d?e.toLowerCase():e};
function ej(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new Lc(a.format(e&&e.length&&e[e.length-1]||0,d));c=new G(fj(a.b,c,function(b){return a.format(b||0,d)}));return new Ec([c])}
function gj(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Pa;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(a.format(f[h],e));c=new G(hj(a.b,c,function(b){var c=[];if(b.length)for(var f=0;f<b.length;f++)c.push(a.format(b[f],e));b=g.toString();b.length&&c.push(b);return c.length?c.join(d):a.format(0,e)}));return new Ec([c])}
function ij(a,b){var c=b[0],c=c instanceof Qc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new G(jj(a.b,c,d,function(b){return a.format(b||0,e)}));return new Ec([c])}function kj(a,b){var c=b[0],c=c instanceof Qc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new G(lj(a.b,c,d,function(b){b=b.map(function(b){return a.format(b,f)});return b.length?b.join(e):a.format(0,f)}));return new Ec([c])}
Zi.prototype.Ob=function(a){switch(a.name){case "counter":if(2>=a.values.length)return ej(this,a.values);break;case "counters":if(3>=a.values.length)return gj(this,a.values);break;case "target-counter":if(3>=a.values.length)return ij(this,a.values);break;case "target-counters":if(4>=a.values.length)return kj(this,a.values)}w.b("E_CSS_CONTENT_PROP:",a.toString());return new Lc("")};var mj=1/1048576;function nj(a,b){for(var c in a)b[c]=a[c].clone()}
function oj(){this.j=0;this.b={};this.qd={};this.h={};this.f={};this.Ma={};this.g={};this.fd={};this.order=0}oj.prototype.clone=function(){var a=new oj;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];nj(this.qd,a.qd);nj(this.h,a.h);nj(this.f,a.f);nj(this.Ma,a.Ma);nj(this.g,a.g);nj(this.fd,a.fd);a.order=this.order;return a};function li(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}oj.prototype.hf=function(){return this.order+=mj};
function pj(a,b,c,d){this.u=a;this.l=b;this.Dc=c;this.wb=d;this.h=[[],[]];this.ga={};this.G=this.F=this.va=this.b=null;this.Ca=this.ha=this.X=this.j=this.f="";this.Y=this.N=null;this.sa=this.qb=!0;this.g={};this.H=[{}];this.I=[new Lc("\u201c"),new Lc("\u201d"),new Lc("\u2018"),new Lc("\u2019")];this.C=0;this.lang="";this.Rb=[0];this.Pa=0;this.ra=[{}];this.Eb=this.ra[0];this.P=null;this.Qb=[this.P];this.Pb=[{}];this.xb=this.ra[0];this.B={};this.ib=[];this.Fb=[]}
function Oi(a,b,c){a.ga[b]--;a.B[b]&&(a.B[b]=a.B[b].filter(function(a){return a!==c}),a.B[b].length||delete a.B[b])}function ji(a,b){var c=null;b&&(c=qj(a.va,b));var d=a.ib.map(function(b){return(b=a.B[b])&&0<b.length?1===b.length?b[0]:new rj([].concat(b)):null}).filter(function(a){return a});return 0>=d.length?c:c?new sj([c].concat(d)):1===d.length?d[0]:new sj(d)}function tj(a,b,c){(b=b[c])&&b.apply(a)}var uj=[];
function vj(a,b,c,d){a.b=null;a.va=null;a.F=d;a.j="";a.f="";a.X="";a.ha="";a.G=b;a.Ca="";a.N=uj;a.Y=c;wj(a)}function xj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function yj(a,b){var c=rd,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=Qg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=Qg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=Qg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===yd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)xj(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):xj(a,l,f[l]);if(d)for(var k in d)a.g[k]||
xj(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===yd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Nc(c[c.length-1]),0));a.H.push(null)}function zj(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function Ui(a,b,c){yj(a,b);b.content&&(b.content=b.content.Hd(new Zi(a,c,a.wb)));zj(a)}var Aj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Bj(a,b,c,d){a.Fb.push(b);a.Y=null;a.b=b;a.va=d;a.F=c;a.j=b.namespaceURI;a.f=b.localName;d=a.u.b[a.j];a.Ca=d?d+a.f:"";a.X=b.getAttribute("id");a.ha=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=uj;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.N=d.split(/\s+/):a.N=uj;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=Oa(b))a.h[a.h.length-1].push(new Vi(a.lang)),
a.lang=d.toLowerCase();d=a.sa;var e=a.Rb;a.Pa=++e[e.length-1];e.push(0);var e=a.ra,f=a.Eb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Qb;null!==e[e.length-1]?a.P=--e[e.length-1]:a.P=null;e.push(null);e=a.Pb;(f=a.xb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});wj(a);Cj(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new Wi(a.I),e===J?a.I=[new Lc(""),new Lc("")]:e instanceof Ec&&(a.I=e.values));yj(a,a.F);e=a.X||a.ha||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Dj(a.Dc,e,h)}if(d=a.F._pseudos)for(e=!0,f=t(Aj),g=f.next();!g.done;g=f.next())(g=g.value)||(e=!1),(g=d[g])&&(e?Ui(a,g,b):a.h[a.h.length-2].push(new Ti(g,b)));c&&a.h[a.h.length-2].push(c)}function Ej(a,b){for(var c in b)Wh(c)&&(b[c]=b[c].Hd(a))}function Cj(a,b){var c=new Xi(b),d=a.F,e=d._pseudos,f;for(f in e)Ej(c,e[f]);Ej(c,d)}
function wj(a){var b;for(b=0;b<a.G.length;b++)tj(a,a.u.Ma,a.G[b]);for(b=0;b<a.N.length;b++)tj(a,a.u.f,a.N[b]);tj(a,a.u.g,a.X);tj(a,a.u.qd,a.f);""!=a.f&&tj(a,a.u.qd,"*");tj(a,a.u.h,a.Ca);null!==a.Y&&(tj(a,a.u.fd,a.Y),tj(a,a.u.fd,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.qb=!0;a.sa=!1}
function Fj(a){for(var b=1;-1<=b;--b)for(var c=a.h[a.h.length-b-2],d=0;d<c.length;)c[d].f(a,b)?c.splice(d,1):d++;a.h.pop();a.qb=!1}var Gj=null;function Hj(a,b,c,d,e,f,g){Ef.call(this,a,b,g);this.b=null;this.$=0;this.h=this.kb=null;this.C=!1;this.ia=c;this.l=d?d.l:Gj?Gj.clone():new oj;this.G=e;this.B=f;this.u=0;this.j=null}v(Hj,Ff);Hj.prototype.Of=function(a){li(this.l.qd,"*",a)};function Ij(a,b){var c=bi(a.b,b);c!==b&&c.g(a.l)||a.Of(c)}
Hj.prototype.Nb=function(a,b){if(b||a)this.$+=1,b&&a?this.b.push(new oi(a,b.toLowerCase())):b?this.b.push(new ni(b.toLowerCase())):this.b.push(new qi(a))};Hj.prototype.ie=function(a){this.h?(w.b("::"+this.h,"followed by ."+a),this.b.push(new Ii(""))):(this.$+=256,this.b.push(new ki(a)))};var Jj={"nth-child":Ai,"nth-of-type":Bi,"nth-last-child":Ci,"nth-last-of-type":Di};
Hj.prototype.hd=function(a,b){if(this.h)w.b("::"+this.h,"followed by :"+a),this.b.push(new Ii(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Fi);break;case "disabled":this.b.push(new Gi);break;case "checked":this.b.push(new Hi);break;case "root":this.b.push(new xi);break;case "link":this.b.push(new ni("a"));this.b.push(new ri("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+Ea(b[0])+"($|s)");this.b.push(new pi(c))}else this.b.push(new Ii(""));
break;case "-adapt-footnote-content":case "footnote-content":this.C=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Ii(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new vi(new RegExp("^"+Ea(b[0].toLowerCase())+"($|-)"))):this.b.push(new Ii(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Jj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new Ii(""));break;case "first-child":this.b.push(new wi);
break;case "last-child":this.b.push(new Ci(0,1));break;case "first-of-type":this.b.push(new Bi(0,1));break;case "last-of-type":this.b.push(new Di(0,1));break;case "only-child":this.b.push(new wi);this.b.push(new Ci(0,1));break;case "only-of-type":this.b.push(new Bi(0,1));this.b.push(new Di(0,1));break;case "empty":this.b.push(new Ei);break;case "before":case "after":case "first-line":case "first-letter":this.jd(a,b);return;default:w.b("unknown pseudo-class selector: "+a),this.b.push(new Ii(""))}this.$+=
256}};
Hj.prototype.jd=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Ii(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Ii(""))):this.h="first-"+c+"-lines";break}}case "nth-fragment":b&&2==
b.length?this.j="NFS_"+b[0]+"_"+b[1]:this.b.push(new Ii(""));break;default:w.b("Unrecognized pseudoelement: ::"+a),this.b.push(new Ii(""))}this.$+=1};Hj.prototype.te=function(a){this.$+=65536;this.b.push(new mi(a))};
Hj.prototype.yd=function(a,b,c,d){this.$+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new ri(a,b);break;case 39:e=new si(a,b,d);break;case 45:!d||d.match(/\s/)?e=new Ii(""):e=new ui(a,b,new RegExp("(^|\\s)"+Ea(d)+"($|\\s)"));break;case 44:e=new ui(a,b,new RegExp("^"+Ea(d)+"($|-)"));break;case 43:d?e=new ui(a,b,new RegExp("^"+Ea(d))):e=new Ii("");break;case 42:d?e=new ui(a,b,new RegExp(Ea(d)+"$")):e=new Ii("");break;case 46:d?e=new ui(a,b,new RegExp(Ea(d))):e=new Ii("");break;case 50:"supported"==
d?e=new ti(a,b):(w.b("Unsupported :: attr selector op:",d),e=new Ii(""));break;default:w.b("Unsupported attr selector:",c),e=new Ii("")}this.b.push(e)};var Kj=0;n=Hj.prototype;n.Wb=function(){var a="d"+Kj++;Ij(this,new hi(new Pi(a,this.j,null)));this.b=[new Ii(a)];this.j=null};n.he=function(){var a="c"+Kj++;Ij(this,new hi(new Qi(a,this.j,null)));this.b=[new Ii(a)];this.j=null};n.ge=function(){var a="a"+Kj++;Ij(this,new hi(new Ri(a,this.j,null)));this.b=[new Ii(a)];this.j=null};
n.ne=function(){var a="f"+Kj++;Ij(this,new hi(new Si(a,this.j,null)));this.b=[new Ii(a)];this.j=null};n.Lc=function(){Lj(this);this.h=null;this.C=!1;this.$=0;this.b=[]};n.Kb=function(){var a;0!=this.u?(Hf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.u=1,this.kb={},this.h=null,this.$=0,this.C=!1,this.b=[])};n.error=function(a,b){Ff.prototype.error.call(this,a,b);1==this.u&&(this.u=0)};n.Oc=function(a){Ff.prototype.Oc.call(this,a);this.u=0};
n.Ha=function(){Lj(this);Ff.prototype.Ha.call(this);1==this.u&&(this.u=0)};n.Xb=function(){Ff.prototype.Xb.call(this)};function Lj(a){if(a.b){var b=a.$+a.l.hf();Ij(a,a.Rf(b));a.b=null;a.h=null;a.j=null;a.C=!1;a.$=0}}n.Rf=function(a){var b=this.G;this.C&&(b=b?"xxx-bogus-xxx":"footnote");return new ii(this.kb,a,this.h,b,this.j)};n.Ib=function(a,b,c){Bh(this.B,a,b,c,this)};n.bd=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};
n.$d=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};n.Jb=function(a,b,c){"display"!=a||b!==Cd&&b!==Bd||(this.Jb("flow-options",new Ec([id,Jd]),c),this.Jb("flow-into",b,c),b=Zc);ee("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Af(this):Bf(this);Xh(this.kb,a,this.ia?new Th(b,d,this.ia):new V(b,d))};n.nd=function(a){switch(a){case "not":a=new Mj(this),a.Kb(),Df(this.na,a)}};
function Mj(a){Hj.call(this,a.f,a.na,a.ia,a,a.G,a.B,!1);this.parent=a;this.g=a.b}v(Mj,Hj);n=Mj.prototype;n.nd=function(a){"not"==a&&Hf(this,"E_CSS_UNEXPECTED_NOT")};n.Ha=function(){Hf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Lc=function(){Hf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Fd=function(){this.b&&0<this.b.length&&this.g.push(new Ki(this.b));this.parent.$+=this.$;var a=this.na;a.b=a.g.pop()};n.error=function(a,b){Hj.prototype.error.call(this,a,b);var c=this.na;c.b=c.g.pop()};
function Nj(a,b){Ef.call(this,a,b,!1)}v(Nj,Ff);Nj.prototype.Ib=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.ad());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new rc(this.f,100,c),c=b.za(this.f,c);this.f.values[a]=c}};function Oj(a,b,c,d,e){Ef.call(this,a,b,!1);this.kb=d;this.ia=c;this.b=e}v(Oj,Ff);Oj.prototype.Ib=function(a,b,c){c?w.b("E_IMPORTANT_NOT_ALLOWED"):Bh(this.b,a,b,c,this)};Oj.prototype.bd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Oj.prototype.$d=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};Oj.prototype.Jb=function(a,b,c){c=c?Af(this):Bf(this);c+=this.order;this.order+=mj;Xh(this.kb,a,this.ia?new Th(b,c,this.ia):new V(b,c))};function Pj(a,b){dg.call(this,a);this.kb={};this.b=b;this.order=0}v(Pj,dg);Pj.prototype.Ib=function(a,b,c){Bh(this.b,a,b,c,this)};Pj.prototype.bd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Pj.prototype.$d=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};
Pj.prototype.Jb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=mj;Xh(this.kb,a,new V(b,c))};function Qj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==qd?b===Td:c}function Rj(a,b,c){return(a=a.direction)&&(b=a.evaluate(b,"direction"))&&b!==qd?b===Kd:c}function Sj(a,b,c,d){var e={},f;for(f in a)Wh(f)&&(e[f]=a[f]);Tj(e,b,a);Uj(a,c,d,function(a,c){Vj(e,c,b);Tj(e,b,c)});return e}
function Uj(a,b,c,d){a=a._regions;if((b||c)&&a)for(c&&(c=["footnote"],b=b?b.concat(c):c),b=t(b),c=b.next();!c.done;c=b.next()){c=c.value;var e=a[c];e&&d(c,e)}}function Vj(a,b,c){for(var d in b)Wh(d)&&(a[d]=Uh(c,a[d],b[d]))}function Wj(a,b,c,d,e){c=c?d?Rh:Ph:d?Sh:Qh;for(var f in a)if(a.hasOwnProperty(f)&&(d=a[f])){var g=c[f];if(g){var h=a[g];if(h&&h.ab>d.ab)continue;g=Kh[g]?g:f}else g=f;b[g]=e(f,d)}};var Xj=!1,Yj={Xg:"ltr",Yg:"rtl"};na("vivliostyle.constants.PageProgression",Yj);Yj.LTR="ltr";Yj.RTL="rtl";var Zj={jg:"left",kg:"right"};na("vivliostyle.constants.PageSide",Zj);Zj.LEFT="left";Zj.RIGHT="right";var ak={LOADING:"loading",Wg:"interactive",Tg:"complete"};na("vivliostyle.constants.ReadyState",ak);ak.LOADING="loading";ak.INTERACTIVE="interactive";ak.COMPLETE="complete";function bk(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=ck(ck(ck(ck(new dk([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function ek(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function fk(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return ek(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,ek(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return ek(a,b)+e}function gk(a){0>a.h&&(a.h=fk(a,a.root,0,!0));return a.h}
function hk(a,b){for(var c,d=a.root,e={};;){c=ek(a,d);if(c>=b)return d;e.children=d.children;if(!e.children)break;var f=Xa(e.children.length,function(c){return function(d){return ek(a,c.children[d])>b}}(e));if(!f)break;if(f<e.children.length&&ek(a,e.children[f])<=b)throw Error("Consistency check failed!");d=e.children[f-1];e={children:e.children}}c+=1;for(var e=d,f=e.firstChild||e.nextSibling,g=null;;){if(f){if(1==f.nodeType)break;g=e=f;c+=f.textContent.length;if(c>b)break}else if(e=e.parentNode,
!e)break;f=e.nextSibling}return g||d}function ik(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)ik(a,c)}function jk(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},ik(a,a.b.documentElement)),d=a.f[c]);return d}
var kk={ah:"text/html",bh:"text/xml",Og:"application/xml",Ng:"application/xhtml_xml",Vg:"image/svg+xml"};function lk(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function mk(a){var b=a.contentType;if(b){for(var c=Object.keys(kk),d=0;d<c.length;d++)if(kk[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function nk(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=mk(a);(c=lk(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=lk(e,"image/svg+xml",d)):c=lk(e,"text/html",d));c||(c=lk(e,"text/html",d))}}c=c?new bk(b,a.url,c):null;return M(c)}function ok(a){this.Jc=a}
function pk(){var a=qk;return new ok(function(b){return a.Jc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function rk(){var a=pk(),b=qk;return new ok(function(c){if(!b.Jc(c))return!1;c=new dk([c]);c=ck(c,"EncryptionMethod");a&&(c=sk(c,a));return 0<c.size()})}var qk=new ok(function(){return!0});function dk(a){this.W=a}dk.prototype.size=function(){return this.W.length};
function sk(a,b){for(var c=[],d=t(a.W),e=d.next();!e.done;e=d.next())e=e.value,b.Jc(e)&&c.push(e);return new dk(c)}function tk(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.W.length;e++)b(a.W[e],c);return new dk(d)}dk.prototype.forEach=function(a){for(var b=[],c=0;c<this.W.length;c++)b.push(a(this.W[c]));return b};function uk(a,b){for(var c=[],d=0;d<a.W.length;d++){var e=b(a.W[d]);null!=e&&c.push(e)}return c}
function ck(a,b){return tk(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}function vk(a){return tk(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function wk(a,b){return uk(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}dk.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var xk={transform:!0,"transform-origin":!0},yk={top:!0,bottom:!0,left:!0,right:!0};function zk(a,b,c){this.target=a;this.name=b;this.value=c}var Ak={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Bk(a,b){var c=Ak[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Ck(a,b){this.h={};this.L=a;this.g=b;this.N=null;this.u=[];var c=this;this.I=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&eb(c,{type:"hyperlink",target:null,currentTarget:null,gh:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.B=this.G=!1;this.C=this.F=!0;this.S=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
v(Ck,db);function Dk(a,b){(a.F=b)?a.L.setAttribute("data-vivliostyle-auto-page-width",!0):a.L.removeAttribute("data-vivliostyle-auto-page-width")}function Ek(a,b){(a.C=b)?a.L.setAttribute("data-vivliostyle-auto-page-height",!0):a.L.removeAttribute("data-vivliostyle-auto-page-height")}function Fk(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Gk(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.L.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.u,e=0;e<d.length;e++){var f=d[e];x(f.target,f.name,f.value.toString())}e=Hk(c,a.L);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.kd],d=a.b[c.Bg],f&&d&&(f=Bk(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Ck.prototype.zoom=function(a){x(this.L,"transform","scale("+a+")")};function Ik(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Jk(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function Kk(a){this.f=a;this.b=[];this.D=null}
function Lk(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.ab=d;this.l=e;this.h=f;this.u=g;this.j=h;this.tb=-1;this.g=l}function Mk(a,b){return a.h?!b.h||a.ab>b.ab?!0:a.j:!1}function Nk(a,b){return a.top-b.top}function Ok(a,b){return b.right-a.right}function Pk(a,b){return a===b?!0:a&&b?a.node===b.node&&a.hb===b.hb&&Qk(a.ua,b.ua)&&Qk(a.Ga,b.Ga)&&Pk(a.Da,b.Da):!1}
function Rk(a,b){if(a===b)return!0;if(!a||!b||a.ma!==b.ma||a.J!==b.J||a.oa.length!==b.oa.length)return!1;for(var c=0;c<a.oa.length;c++)if(!Pk(a.oa[c],b.oa[c]))return!1;return!0}function Sk(a){return{oa:[{node:a.M,hb:Tk,ua:a.ua,Ga:null,Da:null,Ra:0}],ma:0,J:!1,Oa:a.Oa}}function Uk(a,b){var c=new Vk(a.node,b,0);c.hb=a.hb;c.ua=a.ua;c.Ga=a.Ga;c.Da=a.Da?Uk(a.Da,Wk(b)):null;c.D=a.D;c.Ra=a.Ra+1;return c}var Tk=0;
function Xk(a,b,c,d,e,f,g){this.na=a;this.gd=d;this.qf=null;this.root=b;this.ba=c;this.type=f;e&&(e.qf=this);this.b=g}function Qk(a,b){return a===b||!!a&&!!b&&(b?a.na===b.na&&a.ba===b.ba&&a.type===b.type&&Qk(a.gd,b.gd):!1)}function Yk(a,b){this.Cg=a;this.count=b}
function Vk(a,b,c){this.M=a;this.parent=b;this.Ia=c;this.ma=0;this.J=!1;this.hb=Tk;this.ua=b?b.ua:null;this.Da=this.Ga=null;this.Ca=!1;this.xa=!0;this.wa=!1;this.l=b?b.l:0;this.display=null;this.V=Zk;this.ga=this.N=this.j=this.Aa=null;this.Y="baseline";this.ha="top";this.sa=this.ra=0;this.H=!1;this.lc=b?b.lc:0;this.F=b?b.F:null;this.B=b?b.B:!1;this.P=this.$c=!1;this.C=this.A=this.G=this.g=null;this.h=b?b.h:{};this.b=b?b.b:!1;this.direction=b?b.direction:"ltr";this.f=b?b.f:null;this.Oa=this.lang=null;
this.D=b?b.D:null;this.u=null;this.va={};this.Ra=1;this.X=this.I=null}function $k(a){a.xa=!0;a.l=a.parent?a.parent.l:0;a.A=null;a.C=null;a.ma=0;a.J=!1;a.display=null;a.V=Zk;a.Aa=null;a.j=null;a.N=null;a.ga=null;a.Y="baseline";a.H=!1;a.lc=a.parent?a.parent.lc:0;a.F=a.parent?a.parent.F:null;a.B=a.parent?a.parent.B:!1;a.g=null;a.G=null;a.Ga=null;a.$c=!1;a.P=!1;a.b=a.parent?a.parent.b:!1;a.Ga=null;a.Oa=null;a.D=a.parent?a.parent.D:null;a.u=null;a.va={};a.Ra=1;a.I=null;a.X=null}
function al(a){var b=new Vk(a.M,a.parent,a.Ia);b.ma=a.ma;b.J=a.J;b.Ga=a.Ga;b.hb=a.hb;b.ua=a.ua;b.Da=a.Da;b.xa=a.xa;b.l=a.l;b.display=a.display;b.V=a.V;b.Aa=a.Aa;b.j=a.j;b.N=a.N;b.ga=a.ga;b.Y=a.Y;b.ha=a.ha;b.ra=a.ra;b.sa=a.sa;b.$c=a.$c;b.P=a.P;b.H=a.H;b.lc=a.lc;b.F=a.F;b.B=a.B;b.g=a.g;b.G=a.G;b.A=a.A;b.C=a.C;b.f=a.f;b.b=a.b;b.wa=a.wa;b.Oa=a.Oa;b.D=a.D;b.u=a.u;b.va=Object.create(a.va);b.Ra=a.Ra;b.I=a.I;b.X=a.X;return b}Vk.prototype.modify=function(){return this.Ca?al(this):this};
function Wk(a){var b=a;do{if(b.Ca)break;b.Ca=!0;b=b.parent}while(b);return a}Vk.prototype.clone=function(){for(var a=al(this),b=a,c;c=b.parent;)c=al(c),b=b.parent=c;return a};function bl(a){return{node:a.M,hb:a.hb,ua:a.ua,Ga:a.Ga,Da:a.Da?bl(a.Da):null,D:a.D,Ra:a.Ra}}function cl(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(bl(b)),b=b.parent;while(b);b=a.Oa?dl(a.Oa,a.ma,-1):a.ma;return{oa:c,ma:b,J:a.J,Oa:a.Oa}}function el(a){for(a=a.parent;a;){if(a.$c)return!0;a=a.parent}return!1}
function fl(a,b){for(var c=a;c;)c.xa||b(c),c=c.parent}function gl(a,b){return a.D===b&&!!a.parent&&a.parent.D===b}function hl(a){this.f=a;this.b=null}hl.prototype.clone=function(){var a=new hl(this.f);if(this.b){a.b=[];for(var b=0;b<this.b.length;++b)a.b[b]=this.b[b]}return a};function il(a,b){if(!b)return!1;if(a===b)return!0;if(!Rk(a.f,b.f))return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++)if(!Rk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}
function jl(a,b){this.b=a;this.pa=b}jl.prototype.clone=function(){return new jl(this.b.clone(),this.pa)};function kl(){this.b=[];this.g="any";this.f=null}kl.prototype.clone=function(){for(var a=new kl,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function ll(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!il(d.b,e.b))return!1}return!0}
function ml(){this.page=0;this.f={};this.b={};this.g=0}ml.prototype.clone=function(){var a=new ml;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function nl(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;c=t(c);for(d=c.next();!d.done;d=c.next())if(d=d.value,!ll(a.b[d],b.b[d]))return!1;return!0}
function ol(a){this.element=a;this.G=this.F=this.height=this.width=this.P=this.I=this.X=this.H=this.Ca=this.ga=this.Pa=this.Y=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Qb=this.qb=null;this.xb=this.Gd=this.Rb=this.Jd=this.h=0;this.b=!1}function pl(a){return a.marginTop+a.ga+a.I}function ql(a){return a.marginBottom+a.Ca+a.P}function rl(a){return a.marginLeft+a.Y+a.H}function sl(a){return a.marginRight+a.Pa+a.X}function tl(a){return a.b?-1:1}
function ul(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Y=b.Y;a.Pa=b.Pa;a.ga=b.ga;a.Ca=b.Ca;a.H=b.H;a.X=b.X;a.I=b.I;a.P=b.P;a.width=b.width;a.height=b.height;a.F=b.F;a.G=b.G;a.Qb=b.Qb;a.qb=b.qb;a.h=b.h;a.Jd=b.Jd;a.Rb=b.Rb;a.b=b.b}function vl(a,b,c){a.top=b;a.height=c;x(a.element,"top",b+"px");x(a.element,"height",c+"px")}
function wl(a,b,c){a.left=b;a.width=c;x(a.element,"left",b+"px");x(a.element,"width",c+"px")}function xl(a,b,c){a.b?wl(a,b+c*tl(a),c):vl(a,b,c)}function yl(a,b,c){a.b?vl(a,b,c):wl(a,b,c)}function zl(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Al(a){var b=a.F+a.left+a.marginLeft+a.Y,c=a.G+a.top+a.marginTop+a.ga;return new lg(b,c,b+(a.H+a.width+a.X),c+(a.I+a.height+a.P))}function Bl(a,b,c){a=Cl(a);return Og(b,a.U,a.R,a.T-a.U,a.O-a.R,c)}
function Cl(a){var b=a.F+a.left,c=a.G+a.top;return new lg(b,c,b+(rl(a)+a.width+sl(a)),c+(pl(a)+a.height+ql(a)))}function Dl(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}v(Dl,Cc);Dl.prototype.rd=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Pc));return null};Dl.prototype.Uc=function(a){if(this.h.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Dl.prototype.Lb=function(a){this.jc(a.values);return null};Dl.prototype.Qc=function(a){var b=a.za();a=b.evaluate(this.f);"string"===typeof a&&((b=this.g(b,a,this.b.ownerDocument))||(b=this.b.ownerDocument.createTextNode(a)),this.b.appendChild(b));return null};function El(a){return!!a&&a!==Ad&&a!==J&&a!==qd};function Fl(a,b,c){this.g=a;this.f=b;this.b=c}function Gl(){this.map=[]}function Hl(a){return a.map.length?a.map[a.map.length-1].b:0}function Il(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Fl(b,b,d))}else a.map.push(new Fl(b,b,b))}function Jl(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Fl(b,0,0))}function Kl(a,b){var c=Xa(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Ll(a,b){var c=Xa(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Ml(a,b,c,d,e,f,g,h){this.B=a;this.style=b;this.offset=c;this.C=d;this.pa=e;this.b=e.b;this.eb=f;this.lb=g;this.F=h;this.j=this.l=null;this.u={};this.g=this.f=this.h=null;Nl(this)&&(b=b._pseudos)&&b.before&&(a=new Ml(a,b.before,c,!1,e,Ol(this),g,!0),c=Pl(a,"content"),El(c)&&(this.h=a,this.g=a.g));this.g=Ql(Rl(this,"before"),this.g);this.lb&&Sl[this.g]&&(e.g=Ql(e.g,this.g))}
function Pl(a,b,c){if(!(b in a.u)){var d=a.style[b];a.u[b]=d?d.evaluate(a.B,b):c||null}return a.u[b]}function Tl(a){return Pl(a,"display",rd)}function Ol(a){if(null===a.l){var b=Tl(a),c=Pl(a,"position"),d=Pl(a,"float");a.l=Ul(b,c,d,a.C).display===Zc}return a.l}function Nl(a){null===a.j&&(a.j=a.F&&Tl(a)!==J);return a.j}function Rl(a,b){var c=null;if(Ol(a)){var d=Pl(a,"break-"+b);d&&(c=d.toString())}return c}function Vl(a){this.g=a;this.b=[];this.lb=this.eb=!0;this.f=[]}
function Wl(a){return a.b[a.b.length-1]}function Xl(a){return a.b.every(function(a){return Tl(a)!==J})}Vl.prototype.push=function(a,b,c,d){var e=Wl(this);d&&e&&d.b!==e.b&&this.f.push({eb:this.eb,lb:this.lb});e=d||e.pa;d=this.lb||!!d;var f=Xl(this);a=new Ml(this.g,a,b,c,e,d||this.eb,d,f);this.b.push(a);this.eb=Nl(a)?!a.h&&Ol(a):this.eb;this.lb=Nl(a)?!a.h&&d:this.lb;return a};
function Yl(a,b){if(!b.eb)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.eb||d.C)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function Zl(a,b,c,d,e,f,g,h){this.ba=a;this.root=a.root;this.ib=c;this.h=d;this.B=f;this.f=this.root;this.F={};this.X={};this.G={};this.I=[];this.C=this.P=this.N=null;this.Ca=g;this.Y=new pj(b,d,g,h);this.g=new Gl;this.u=!0;this.ha=[];this.Pa=e;this.va=this.sa=!1;this.b=a=ek(a,this.root);this.ga={};this.j=new Vl(d);Il(this.g,a);d=$l(this,this.root);Bj(this.Y,this.root,d,a);am(this,d,!1);this.H=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H=
!1}this.ha.push(!0);this.X={};this.X["e"+a]=d;this.b++;bm(this,-1)}function cm(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function dm(a,b,c){for(var d in c){var e=b[d];e?(a.F[d]=e,delete b[d]):(e=c[d])&&(a.F[d]=new V(e,33554432))}}var em=["column-count","column-width","column-fill"];
function am(a,b,c){["writing-mode","direction"].forEach(function(d){!b[d]||c&&a.F[d]||(a.F[d]=b[d])});if(!a.sa){var d=cm(a,b,a.B.j,"background-color")?b["background-color"].evaluate(a.h):null,e=cm(a,b,a.B.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==qd||e&&e!==qd)dm(a,b,a.B.j),a.sa=!0}if(!a.va)for(d=0;d<em.length;d++)if(cm(a,b,a.B.u,em[d])){dm(a,b,a.B.u);a.va=!0;break}if(!c&&(d=b["font-size"])){e=d.evaluate(a.h);d=e.K;switch(e.ka){case "em":case "rem":d*=a.h.u;break;case "ex":d*=
a.h.u*Lb.ex/Lb.em;break;case "%":d*=a.h.u/100;break;default:(e=Lb[e.ka])&&(d*=e)}a.h.sa=d}}function fm(a){for(var b=0;!a.H&&(b+=5E3,gm(a,b,0)!=Number.POSITIVE_INFINITY););return a.F}function $l(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ba.url,e=new Pj(a.ib,a.B),c=new of(c,e);try{cg(new Uf(Jf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){w.b(f,"Style attribute parse error:")}return e.kb}}return{}}
function bm(a,b){if(!(b>=a.b)){var c=a.h,d=ek(a.ba,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=hm(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=hk(a.ba,b);e=fk(a.ba,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=ek(a.ba,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),hm(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function im(a,b){a.N=b;for(var c=0;c<a.I.length;c++)jm(a.N,a.I[c],a.G[a.I[c].b])}
function hm(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new Jg;try{h.ca(l);p=l.b;break a}catch(q){w.b(q,"toSet:")}}p={}}k=p;h=!!k.exclusive;l=!!k["static"];k=!!k.last}(p=c["flow-linger"])&&(g=Lg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=Lg(c.evaluate(a.h,"flow-priority"),0));c=a.ga[e]||null;p=a.G[b];p||(p=Wl(a.j),p=a.G[b]=new Kk(p?p.pa.b:null));d=new Lk(b,d,e,f,g,h,
l,k,c);a.I.push(d);a.P==b&&(a.P=null);a.N&&jm(a.N,d,p);return d}function km(a,b,c,d){Sl[b]&&(d=a.G[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.ga[c]=Ql(a.ga[c],b)}
function gm(a,b,c){var d=-1;if(b<=a.b&&(d=Kl(a.g,b),d+=c,d<Hl(a.g)))return Ll(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.Y,g=a.f;if(f.Fb.pop()!==g)throw Error("Invalid call to popElement");f.Rb.pop();f.ra.pop();f.Qb.pop();f.Pb.pop();Fj(f);zj(f);a.u=a.ha.pop();var f=a.j,h=a.b,l=g=f.b.pop(),k=f.eb,m=f.lb;if(Nl(l)){var p=l.style._pseudos;p&&p.after&&(h=new Ml(l.B,p.after,h,!1,l.pa,k,m,!0),k=Pl(h,"content"),El(k)&&(l.f=
h))}f.lb&&g.f&&(l=Rl(g.f,"before"),g.pa.g=Ql(g.pa.g,l));if(l=Wl(f))l.b===g.b?Nl(g)&&(f.eb=f.lb=!1):(l=f.f.pop(),f.eb=l.eb,f.lb=l.lb);f=null;g.f&&(f=Rl(g.f,"before"),km(a,f,g.f.eb?Yl(a.j,g):g.f.offset,g.b),f=Rl(g.f,"after"));f=Ql(f,Rl(g,"after"));km(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Kl(a.g,b),d+=c),d<=Hl(a.g))?Ll(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType)a.b+=a.f.textContent.length,f=a.j,g=a.f,l=Wl(f),(f.eb||f.lb)&&
Nl(l)&&(l=Pl(l,"white-space",Ad).toString(),Jk(g,Ik(l))||(f.eb=!1,f.lb=!1)),a.u?Il(a.g,a.b):Jl(a.g,a.b);else{g=a.f;f=$l(a,g);a.ha.push(a.u);Bj(a.Y,g,f,a.b);(l=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&l===a.C&&(a.C=null);a.H||"body"!=g.localName||g.parentNode!=a.root||(am(a,f,!0),a.H=!0);(l=f["flow-into"])?(l=l.evaluate(e,"flow-into").toString(),h=hm(a,l,f,g,a.b),a.u=!!a.Pa[l],g=a.j.push(f,a.b,g===a.root,h)):g=a.j.push(f,a.b,g===a.root);l=Yl(a.j,g);km(a,
g.g,l,g.b);g.h&&(h=Rl(g.h,"after"),km(a,h,g.h.eb?l:g.offset,g.b));a.u&&Tl(g)===J&&(a.u=!1);if(ek(a.ba,a.f)!=a.b)throw Error("Inconsistent offset");a.X["e"+a.b]=f;a.b++;a.u?Il(a.g,a.b):Jl(a.g,a.b);if(b<a.b&&(0>d&&(d=Kl(a.g,b),d+=c),d<=Hl(a.g)))return Ll(a.g,d)}}}Zl.prototype.l=function(a,b){var c=ek(this.ba,a),d="e"+c;b&&(c=fk(this.ba,a,0,!0));this.b<=c&&gm(this,c,0);return this.X[d]};Zl.prototype.ra=function(){};var lm={"font-style":Ad,"font-variant":Ad,"font-weight":Ad},mm="OTTO"+(new Date).valueOf(),nm=1;function om(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in lm)c[e]||(c[e]=lm[e]);return c}function pm(a){a=this.wc=a;var b=new Pa,c;for(c in lm)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.wc.src?this.wc.src.toString():null;this.g=[];this.h=[];this.b=(c=this.wc["font-family"])?c.stringValue():null}
function qm(a,b,c){var d=new Pa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in lm)d.append(e),d.append(": "),a.wc[e].Ya(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function rm(a){this.f=a;this.b={}}
function sm(a,b){if(b instanceof Fc){for(var c=[],d=t(b.values),e=d.next();!e.done;e=d.next()){var e=e.value,f=a.b[e.stringValue()];f&&c.push(D(f));c.push(e)}return new Fc(c)}return(c=a.b[b.stringValue()])?new Fc([D(c),b]):b}function tm(a,b){this.b=a;this.body=b;this.f={};this.g=0}function um(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function vm(a,b,c,d){var e=L("initFont"),f=b.src,g={},h;for(h in lm)g[h]=b.wc[h];d=um(a,b,d);g["font-family"]=D(d);var l=new pm(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=mm+nm++;b.textContent=qm(l,"",tf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in lm)x(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,r=g.bottom-g.top;
b.textContent=qm(l,f,c);w.g("Starting to load font:",f);var z=!1;Be(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||r!=b?(z=!0,M(!1)):(new Date).valueOf()>m?M(!1):Ae(10)}).then(function(){z?w.g("Loaded font:",f):w.b("Failed to load font:",f);a.body.removeChild(k);O(e,l)});return e.result()}
function wm(a,b,c){var d=b.src,e=a.f[d];e?Fe(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;w.b("Found already-loaded font:",d)}else w.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new Ee(function(){var e=L("loadFont"),g=c.f?c.f(d):null;g?sf(d,"blob").then(function(d){d.Rd?g(d.Rd).then(function(d){vm(a,b,d,c).La(e)}):O(e,null)}):vm(a,b,null,c).La(e);return e.result()},"loadFont "+d),a.f[d]=e,e.start());return e}
function xm(a,b,c){var d=[];b=t(b);for(var e=b.next();!e.done;e=b.next())e=e.value,e.src&&e.b?d.push(wm(a,e,c)):w.b("E_FONT_FACE_INVALID");return Ge(d)};de("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Vc?Dd:c,important:a.important};default:return a}});var Sl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},ym={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Ql(a,b){if(a)if(b){var c=!!Sl[a],d=!!Sl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:ym[b]?b:ym[a]?a:b}else return a;else return b}function zm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Am(){}n=Am.prototype;n.Nf=function(a){return{w:a,xd:!1,Mb:!1}};n.pf=function(){};n.xf=function(){};n.eg=function(){};n.wf=function(){};n.sd=function(){};n.kc=function(){};function Bm(a,b){this.b=a;this.f=b}
function Cm(a,b){var c=a.b,d=c.Nf(b),e=L("LayoutIterator");Ce(function(b){for(var e;d.w;){e=d.w.A?1!==d.w.A.nodeType?Jk(d.w.A,d.w.lc)?void 0:d.w.J?c.xf(d):c.pf(d):d.w.xa?d.w.J?c.wf(d):c.eg(d):d.w.J?c.kc(d):c.sd(d):void 0;e=(e&&e.Wa()?e:M(!0)).fa(function(){return d.Mb?M(null):Dm(a.f,d.w,d.xd)});if(e.Wa()){e.then(function(a){d.Mb?Q(b):(d.w=a,P(b))});return}if(d.Mb){Q(b);return}d.w=e.get()}Q(b)}).then(function(){O(e,d.w)});return e.result()}function Em(a){this.$b=a}v(Em,Am);n=Em.prototype;n.fg=function(){};
n.Hf=function(){};n.Nf=function(a){return{w:a,xd:!!this.$b&&a.J,Mb:!1,$b:this.$b,Wc:null,De:!1,Qf:[],cd:null}};n.pf=function(a){a.De=!1};n.sd=function(a){a.Qf.push(Wk(a.w));a.Wc=Ql(a.Wc,a.w.g);a.De=!0;return this.fg(a)};n.kc=function(a){var b;a.De?(b=(b=void 0,M(!0)),b=b.fa(function(){a.Mb||(a.Qf=[],a.$b=!1,a.xd=!1,a.Wc=null);return M(!0)})):b=(b=this.Hf(a))&&b.Wa()?b:M(!0);return b.fa(function(){a.Mb||(a.De=!1,a.cd=Wk(a.w),a.Wc=Ql(a.Wc,a.w.G));return M(!0)})};
function Fm(a,b,c){this.nf=[];this.ya=Object.create(a);this.ya.element=b;this.ya.j=a.j.clone();this.ya.u=!1;this.ya.ff=c.D;this.ya.Ed=a;a=Gm(this.ya,c);this.ya.ha-=a;var d=this;this.ya.zd=function(a){return Hm.prototype.zd.call(this,a).fa(function(a){d.nf.push(Wk(a));return M(a)})}}function Im(a,b){return Jm(a.ya,b,!0)}Fm.prototype.Yb=function(a){var b=this.ya.Yb();if(a){a=Wk(this.nf[0]);var c=new Km(a,null,a.wa,0);c.f(this.ya,0);if(!b.w)return{zb:c,w:a}}return b};
Fm.prototype.Ja=function(a,b,c){return this.ya.Ja(a,b,c)};function Lm(){this.u=this.h=null}function Mm(a,b,c){a.Zf(b,c);return Nm(a,b,c)}function Nm(a,b,c){var d=L("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.sf(b,c);var e=a.kf(b);e.b(b,c).then(function(a){var f=e.f(a,c);(f=e.g(a,this.f,c,f))?O(d,a):(this.Bd(this.f),this.ce(b,c),Nm(this,this.f,c).La(d))}.bind(a));return d.result()}Lm.prototype.Zf=function(){};
Lm.prototype.Bd=function(a){a=a.A||a.parent.A;for(var b;b=a.lastChild;)a.removeChild(b);for(;b=a.nextSibling;)b.parentNode.removeChild(b)};Lm.prototype.sf=function(a,b){this.f=Wk(a);this.h=[].concat(b.N);this.C=[].concat(b.B);a.D&&(this.u=a.D.Te())};Lm.prototype.ce=function(a,b){b.N=this.h;b.B=this.C;a.D&&a.D.Se(this.u)};function Om(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);c=t(b);for(b=c.next();!b.done;b=c.next())if(b=b.value,b=a.replace(b.h,b.b),b!==a)return b;return a}function Pm(a){var b=Qm,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.da:b.ea)+"(-?)"),b:"$1"+(a?b.ea:b.da)+"$2"}})})});return c}
var Qm={"horizontal-tb":{ltr:[{da:"inline-start",ea:"left"},{da:"inline-end",ea:"right"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}],rtl:[{da:"inline-start",ea:"right"},{da:"inline-end",ea:"left"},{da:"block-start",ea:"top"},{da:"block-end",ea:"bottom"},{da:"inline-size",ea:"width"},{da:"block-size",ea:"height"}]},"vertical-rl":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"right"},{da:"block-end",
ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",ea:"top"},{da:"block-start",ea:"right"},{da:"block-end",ea:"left"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]},"vertical-lr":{ltr:[{da:"inline-start",ea:"top"},{da:"inline-end",ea:"bottom"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}],rtl:[{da:"inline-start",ea:"bottom"},{da:"inline-end",
ea:"top"},{da:"block-start",ea:"left"},{da:"block-end",ea:"right"},{da:"inline-size",ea:"height"},{da:"block-size",ea:"width"}]}},Rm=Pm(!0),Sm=Pm(!1);var Zk="inline";function Tm(a){switch(a){case "inline":return Zk;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function Um(a){switch(a){case Zk:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function Vm(a,b,c,d,e,f){this.b=a;this.V=b;this.Aa=c;this.h=d;this.f=e;this.j=f;this.id=this.order=null}
Vm.prototype.Fa=function(){if(null===this.order)throw Error("The page float is not yet added");return this.order};function Wm(a){if(!a.id)throw Error("The page float is not yet added");return a.id}Vm.prototype.Ze=function(){return!1};function Xm(){this.b=[];this.f=0}Xm.prototype.hf=function(){return this.f++};
Xm.prototype.fe=function(a){if(0<=this.b.findIndex(function(b){return Rk(b.b,a.b)}))throw Error("A page float with the same source node is already registered");var b=a.order=this.hf();a.id="pf"+b;this.b.push(a)};Xm.prototype.Ye=function(a){var b=this.b.findIndex(function(b){return Rk(b.b,a)});return 0<=b?this.b[b]:null};function Ym(a,b,c,d,e){this.V=a;this.Aa=b;this.Hb=c;this.b=d;this.g=e}function Zm(a,b){return a.Hb.some(function(a){return a.ja===b})}
Ym.prototype.Fa=function(){var a=this.Hb.map(function(a){return a.ja});return Math.min.apply(null,a.map(function(a){return a.Fa()}))};Ym.prototype.f=function(a){return this.Fa()<a.Fa()};function $m(a,b){this.ja=a;this.b=b}
function an(a,b,c,d,e,f,g){(this.parent=a)&&a.children.push(this);this.children=[];this.V=b;this.L=c;this.h=d;this.H=e;this.F=f||a&&a.F||pd;this.direction=g||a&&a.direction||zd;this.Kc=!1;this.u=a?a.u:new Xm;this.B=[];this.b=[];this.j=[];this.l={};this.f=[];a:{b=this;for(a=this.parent;a;){if(b=bn(a,b,this.V,this.h,this.H)){a=b;break a}b=a;a=a.parent}a=null}this.G=a?[].concat(a.f):[];this.C=[];this.g=!1}function cn(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function bn(a,b,c,d,e){b=a.children.indexOf(b);0>b&&(b=a.children.length);for(--b;0<=b;b--){var f=a.children[b];if(f.V===c&&f.h===d&&Rk(f.H,e)||(f=bn(f,null,c,d,e)))return f}return null}function dn(a,b){return b&&b!==a.V?dn(cn(a,b),b):a.L}function en(a,b){a.L=b;fn(a)}an.prototype.fe=function(a){this.u.fe(a)};function gn(a,b){return b===a.V?a:gn(cn(a,b),b)}an.prototype.Ye=function(a){return this.u.Ye(a)};
function hn(a,b){var c=Wm(b),d=b.V;d===a.V?a.B.includes(c)||(a.B.push(c),jn(b).ig(b,a)):hn(cn(a,d),b)}function kn(a,b){var c=Wm(b),d=b.V;return d===a.V?a.B.includes(c):kn(cn(a,d),b)}function ln(a,b,c){var d=b.V;d!==a.V?ln(cn(a,d),b,c):a.b.includes(b)||(a.b.push(b),a.b.sort(function(a,b){return a.Fa()-b.Fa()}));c||mn(a)}function nn(a,b,c){var d=b.V;d!==a.V?nn(cn(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.b&&b.b.element)&&b.parentNode&&b.parentNode.removeChild(b),c||mn(a)))}
function on(a,b){if(b.V!==a.V)return on(cn(a,b.V),b);var c=a.b.findIndex(function(a){return Zm(a,b)});return 0<=c?a.b[c]:null}function pn(a,b){return 0<a.b.length&&(!b||a.b.some(b))?!0:a.parent?pn(a.parent,b):!1}function qn(a,b){return pn(a,function(a){return a.g&&a.Hb[0].ja.f===b})}function rn(a,b,c){a.l[Wm(b)]=c}function sn(a){var b=Object.assign({},a.l);return a.children.reduce(function(a,b){return Object.assign(a,sn(b))},b)}
function tn(a,b){if(un(a).some(function(a){return Wm(a.ja)===b}))return!0;var c=sn(a)[b];return c?a.L&&a.L.element?a.L.element.contains(c):!1:!1}function vn(a,b){var c=b.ja;if(c.V===a.V){var d=a.f.findIndex(function(a){return a.ja===c});0<=d?a.f.splice(d,1,b):a.f.push(b)}else vn(cn(a,c.V),b)}function wn(a,b,c){if(!c&&b.V!==a.V)return wn(cn(a,b.V),b,!1);var d=b.Fa();return a.f.some(function(a){return a.ja.Fa()<d&&!b.Ze(a.ja)})?!0:a.parent?wn(a.parent,b,!0):!1}
function un(a,b){b=b||a.h;var c=a.G.filter(function(a){return!b||a.ja.f===b});a.parent&&(c=un(a.parent,b).concat(c));return c.sort(function(a,b){return a.ja.Fa()-b.ja.Fa()})}function xn(a,b){b=b||a.h;var c=a.f.filter(function(a){return!b||a.ja.f===b});return a.parent?xn(a.parent,b).concat(c):c}function yn(a){for(var b=[],c=[],d=a.children.length-1;0<=d;d--){var e=a.children[d];c.includes(e.h)||(c.push(e.h),b=b.concat(e.f.map(function(a){return a.ja})),b=b.concat(yn(e)))}return b}
function zn(a){if(An(a))return!0;for(var b=a.b.length-1;0<=b;b--){var c=a.b[b],d;a:{d=a;for(var e=c.Hb.length-1;0<=e;e--){var f=c.Hb[e].ja;if(!tn(d,Wm(f))){d=f;break a}}d=null}if(d){if(a.g)mn(a);else if(nn(a,c),hn(a,d),c=Bn(a,c.Aa),"block-end"===c||"inline-end"===c)for(b=0;b<a.b.length;)d=a.b[b],Bn(a,d.Aa)===c?nn(a,d):b++;return!0}}return"region"===a.V&&a.parent.g?zn(a.parent):!1}
function An(a){var b=yn(a),c=a.b.reduce(function(a,b){return a.concat(b.Hb.map(function(a){return a.ja}))},[]);c.sort(function(a,b){return b.Fa()-a.Fa()});for(var d={},c=t(c),e=c.next();!e.done;d={ja:d.ja,order:d.order},e=c.next())if(d.ja=e.value,d.order=d.ja.Fa(),b.some(function(a){return function(b){return!a.ja.Ze(b)&&a.order>b.Fa()}}(d)))return a.g?mn(a):(hn(a,d.ja),b=on(a,d.ja),nn(a,b)),!0;return!1}
function Cn(a){if(!zn(a)){for(var b=a.f.length-1;0<=b;b--)if(!tn(a,Wm(a.f[b].ja))){if(a.g){mn(a);return}a.f.splice(b,1)}a.G.forEach(function(a){0<=this.f.findIndex(function(b){return b?a===b?!0:a.ja===b.ja&&Rk(a.b,b.b):!1})||this.b.some(function(b){return Zm(b,a.ja)})||this.f.push(a)},a)}}function Dn(a,b){return!!a.L&&!!b.L&&a.L.element===b.L.element}
function mn(a){a.Kc=!0;a.g||(a.L&&(a.children.forEach(function(a){Dn(this,a)&&a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),zl(a.L)),a.children.forEach(function(a){a.C.splice(0)}),a.children.splice(0),Object.keys(a.l).forEach(function(a){delete this.l[a]},a))}function En(a){a=a.children.splice(0);a.forEach(function(a){a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})});return a}
function Fn(a,b){b.forEach(function(a){this.children.push(a);fn(a)},a)}function Gn(a){return a.Kc||!!a.parent&&Gn(a.parent)}function Bn(a,b){return Om(b,a.F.toString(),a.direction.toString()||null,Sm)}function Hn(a,b){var c=b.V;if(c!==a.V)Hn(cn(a,c),b);else if(c=Bn(a,b.Aa),"block-end"===c||"snap-block"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d],f=Bn(a,e.Aa);(f===c||"snap-block"===c&&"block-end"===f)&&e.f(b)?(a.j.push(e),a.b.splice(d,1)):d++}}
function In(a,b){b!==a.V?In(cn(a,b),b):(a.j.forEach(function(a){ln(this,a,!0)},a),a.j.splice(0))}function Jn(a,b){b!==a.V?Jn(cn(a,b),b):a.j.splice(0)}function Kn(a,b){return b===a.V?a.j.concat().sort(function(a,b){return b.Fa()-a.Fa()}):Kn(cn(a,b),b)}
function Ln(a,b,c,d,e){var f=Bn(a,b);b=Om(b,a.F.toString(),a.direction.toString()||null,Rm);a:{var g=Mn(a,c,d,e);switch(f){case "block-start":f=a.L.b?g.right:g.top;break a;case "block-end":f=a.L.b?g.left:g.bottom;break a;case "inline-start":f=a.L.b?g.top:g.left;break a;case "inline-end":f=a.L.b?g.bottom:g.right;break a;default:throw Error("Unknown logical side: "+f);}}if(a.parent&&a.parent.L)switch(a=Ln(a.parent,b,c,d,e),b){case "top":return Math.max(f,a);case "left":return Math.max(f,a);case "bottom":return Math.min(f,
a);case "right":return Math.min(f,a);default:ra("Should be unreachable")}return f}
function Mn(a,b,c,d){function e(a,d,e){if("%"===a.ka)a=e*a.K/100;else{e=a.K;var f=a.ka,g;b:switch(f.toLowerCase()){case "em":case "ex":case "rem":g=!0;break b;default:g=!1}if(g){for(;d&&1!==d.nodeType;)d=d.parentNode;d=parseFloat(Nn(c,d)["font-size"]);a=ei(a,d,b.b).K}else a=(d=Pb(b.b,f,!1))?e*d:a}return a}var f=a.L.F,g=a.L.G,h=Al(a.L),l={top:h.R-g,left:h.U-f,bottom:h.O-g,right:h.T-f,Ic:0,Hc:0},k=a.b;0<k.length&&(l=k.reduce(function(b,c){if(d&&!d(c,a))return b;var f=Bn(a,c.Aa),g=c.b,k=c.Hb[0].ja.j,
l=b.top,m=b.left,p=b.bottom,E=b.right,K=b.Ic,I=b.Hc;switch(f){case "inline-start":g.b?l=Math.max(l,g.top+g.height):m=Math.max(m,g.left+g.width);break;case "block-start":g.b?(k&&g.left<E&&(K=e(k,g.Pb[0],h.T-h.U)),E=Math.min(E,g.left)):(k&&g.top+g.height>l&&(K=e(k,g.Pb[0],h.O-h.R)),l=Math.max(l,g.top+g.height));break;case "inline-end":g.b?p=Math.min(p,g.top):E=Math.min(E,g.left);break;case "block-end":g.b?(k&&g.left+g.width>m&&(I=e(k,g.Pb[0],h.T-h.U)),m=Math.max(m,g.left+g.width)):(k&&g.top<p&&(I=e(k,
g.Pb[0],h.O-h.R)),p=Math.min(p,g.top));break;default:throw Error("Unknown logical float side: "+f);}return{top:l,left:m,bottom:p,right:E,Ic:K,Hc:I}},l));l.left+=f;l.right+=f;l.top+=g;l.bottom+=g;return l}
function On(a,b,c,d,e,f,g,h){function l(a,c){var d=a(b.Eb,c);return d?(b.b&&(d=new lg(-d.O,d.U,-d.R,d.T)),m=b.b?Math.min(m,d.T):Math.max(m,d.R),p=b.b?Math.max(p,d.U):Math.min(p,d.O),!0):g}if(c!==a.V)return On(cn(a,c),b,c,d,e,f,g,h);var k=Bn(a,d);if("snap-block"===k){if(!h["block-start"]&&!h["block-end"])return null}else if(!h[k])return null;var m=Ln(a,"block-start",b.j,b.f),p=Ln(a,"block-end",b.j,b.f);c=Ln(a,"inline-start",b.j,b.f);var q=Ln(a,"inline-end",b.j,b.f),r=b.b?b.F:b.G,z=b.b?b.G:b.F,m=b.b?
Math.min(m,b.left+rl(b)+b.width+sl(b)+r):Math.max(m,b.top+r),p=b.b?Math.max(p,b.left+r):Math.min(p,b.top+pl(b)+b.height+ql(b)+r),u;if(f){a=b.b?Cg(new lg(p,c,m,q)):new lg(c,m,q,p);if(("block-start"===k||"snap-block"===k||"inline-start"===k)&&!l(Hg,a)||("block-end"===k||"snap-block"===k||"inline-end"===k)&&!l(Ig,a))return null;u=(p-m)*tl(b);f=u-(b.b?sl(b):pl(b))-(b.b?rl(b):ql(b));e=q-c;a=e-(b.b?pl(b):rl(b))-(b.b?ql(b):sl(b));if(!g&&(0>=f||0>=a))return null}else{f=b.h;u=f+(b.b?sl(b):pl(b))+(b.b?rl(b):
ql(b));var A=(p-m)*tl(b);if("snap-block"===k&&(null===e?k="block-start":(k=Al(a.L),k=tl(a.L)*(e-(a.L.b?k.T:k.R))<=tl(a.L)*((a.L.b?k.U:k.O)-e-u)?"block-start":"block-end"),!h[k]))if(h["block-end"])k="block-end";else return null;if(!g&&A<u)return null;a="inline-start"===k||"inline-end"===k?Pn(b.f,b.element,[Qn])[Qn]:b.pe?Rn(b):b.b?b.height:b.width;e=a+(b.b?pl(b):rl(b))+(b.b?ql(b):sl(b));if(!g&&q-c<e)return null}m-=r;p-=r;c-=z;q-=z;switch(k){case "inline-start":case "block-start":case "snap-block":yl(b,
c,a);xl(b,m,f);break;case "inline-end":case "block-end":yl(b,q-e,a);xl(b,p-u*tl(b),f);break;default:throw Error("unknown float direction: "+d);}return k}function Sn(a){var b=a.b.map(function(a){return Bl(a.b,null,null)});return a.parent?Sn(a.parent).concat(b):b}function fn(a){var b=a.L.element&&a.L.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.b.element)})}
function Tn(a){var b=dn(a).b;return a.b.reduce(function(a,d){var c=Cl(d.b);return b?Math.min(a,c.U):Math.max(a,c.O)},b?Infinity:0)}function Un(a){var b=dn(a).b;return a.b.filter(function(a){return"block-end"===a.Aa}).reduce(function(a,d){var c=Cl(d.b);return b?Math.max(a,c.T):Math.min(a,c.R)},b?0:Infinity)}
function Vn(a,b){function c(a){return function(b){return tn(a,Wm(b.ja))}}function d(a,b){return a.Hb.some(c(b))}for(var e=Al(b),e=b.b?e.U:e.O,f=a;f;){if(f.f.some(c(f)))return e;f=f.parent}f=Ln(a,"block-start",b.j,b.f,d);return Ln(a,"block-end",b.j,b.f,d)*tl(b)<e*tl(b)?e:f}
function Wn(a,b,c,d){function e(a){return function(b){return b.Aa===a&&b.Fa()<l}}function f(a,b){return a.children.some(function(a){return a.b.some(e(b))||f(a,b)})}function g(a,b){var c=a.parent;return!!c&&(c.b.some(e(b))||g(c,b))}if(b.V!==a.V)return Wn(cn(a,b.V),b,c,d);var h={"block-start":!0,"block-end":!0,"inline-start":!0,"inline-end":!0};if(!d)return h;c=Bn(a,c);d=Bn(a,d);d="all"===d?["block-start","block-end","inline-start","inline-end"]:"both"===d?["inline-start","inline-end"]:"same"===d?"snap-block"===
c?["block-start","block-end"]:[c]:[d];var l=b.Fa();d.forEach(function(a){switch(a){case "block-start":case "inline-start":h[a]=!f(this,a);break;case "block-end":case "inline-end":h[a]=!g(this,a);break;default:throw Error("Unexpected side: "+a);}},a);return h}function Xn(a){return(a.parent?Xn(a.parent):[]).concat(a.C)}function Yn(a,b,c){c===a.V?a.C.push(b):Yn(cn(a,c),b,c)}
function Zn(a,b){for(var c=b.j,d=b.f,e=a,f=null;e&&e.L;){var g=Mn(e,c,d);f?b.b?(g.right<f.right&&(f.right=g.right,f.Ic=g.Ic),g.left>f.left&&(f.left=g.left,f.Hc=g.Hc)):(g.top>f.top&&(f.top=g.top,f.Ic=g.Ic),g.bottom<f.bottom&&(f.bottom=g.bottom,f.Hc=g.Hc)):f=g;e=e.parent}return(b.b?f.right-f.left:f.bottom-f.top)<=Math.max(f.Ic,f.Hc)}function $n(a){var b=dn(a).b;return a.b.length?Math.max.apply(null,a.b.map(function(a){a=a.b;return b?a.width:a.height})):0}var ao=[];
function bo(a){for(var b=ao.length-1;0<=b;b--){var c=ao[b];if(c.zf(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function jn(a){for(var b=ao.length-1;0<=b;b--){var c=ao[b];if(c.yf(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function co(){}n=co.prototype;n.zf=function(a){return Um(a.V)};n.yf=function(){return!0};n.Ff=function(a,b,c){var d=a.V,e=a.Aa,f=cl(a);return eo(c,d,a.ga,a).fa(function(c){d=c;c=new Vm(f,d,e,a.j,b.h,a.N);b.fe(c);return M(c)})};
n.Gf=function(a,b,c,d){return new Ym(a[0].ja.V,b,a,c,d)};n.rf=function(a,b){return on(b,a)};n.vf=function(){};n.ig=function(){};ao.push(new co);var fo={img:!0,svg:!0,audio:!0,video:!0};
function go(a,b,c,d){var e=a.A;if(!e)return NaN;if(1==e.nodeType){if(a.J||!a.xa){var f=Hk(b,e);if(f.right>=f.left&&f.bottom>=f.top)return a.J?d?f.left:f.bottom:d?f.right:f.top}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.J&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=ho(b,g);if(c=d){c=document.body;if(null==fb){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";
g.style.height="100px";g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";x(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();fb=10>h.right-h.left;c.removeChild(g)}c=fb}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=ho(b,c);e=[];a=t(a);for(c=a.next();!c.done;c=a.next()){c=c.value;for(g=0;g<
b.length;g++)if(h=b[g],c.top>=h.top&&c.bottom<=h.bottom&&1>Math.abs(c.left-h.left)){e.push({top:c.top,left:h.left,bottom:c.bottom,right:h.right});break}g==b.length&&(w.b("Could not fix character box"),e.push(c))}a=e}b=0;e=t(a);for(a=e.next();!a.done;a=e.next())a=a.value,c=d?a.bottom-a.top:a.right-a.left,a.right>a.left&&a.bottom>a.top&&(isNaN(f)||c>b)&&(f=d?a.left:a.bottom,b=c);return f}
function io(a){for(var b=ee("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.Re());}function jo(a){this.Cd=a}jo.prototype.b=function(a){return this.Cd.every(function(b){return b.b(a)})};function ko(){}ko.prototype.u=function(){};ko.prototype.g=function(){return null};function lo(a,b){return{current:b.reduce(function(b,d){return b+d.b(a)},0),Be:b.reduce(function(b,d){return b+d.F(a)},0)}}
function mo(a,b){this.h=a;this.Mc=b;this.j=!1;this.l=null}v(mo,ko);mo.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=no(a,this,0<b),this.j=!0);return this.l};mo.prototype.b=function(){return this.Mc};mo.prototype.g=function(){return this.j?this.l:this.h[this.h.length-1]};function Km(a,b,c,d){this.position=a;this.F=b;this.B=this.j=c;this.C=d;this.h=!1;this.oc=0}v(Km,ko);
Km.prototype.f=function(a,b){if(!this.h){var c=Gm(a,this.position);this.oc=go(this.position,a.f,0,a.b)+c;this.h=!0}var c=this.oc,d=lo(this.g(),oo(a));this.B=po(a,c+(a.b?-1:1)*d.Be);this.j=this.position.wa=po(a,c+(a.b?-1:1)*d.current);b<this.b()?c=null:(a.h=this.C+qo(a,this),c=this.position);return c};
Km.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a=this.g())&&a.parent){var b=ro(a.parent);a=b?(b=b.b)?a&&b.g===a.M:!1:!1}else a=!1;a=a&&!this.B;return(ym[this.F]?1:0)+(this.j&&!a?3:0)+(this.position.parent?this.position.parent.l:0)};Km.prototype.g=function(){return this.position};
function so(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?w.b("validateCheckPoints: duplicate entry"):c.Ia>=d.Ia?w.b("validateCheckPoints: incorrect boxOffset"):c.M==d.M&&(d.J?c.J&&w.b("validateCheckPoints: duplicate after points"):c.J||d.Ia-c.Ia!=d.ma-c.ma&&w.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function to(a){this.parent=a}to.prototype.Re=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};to.prototype.af=function(a,b){return b};
to.prototype.Te=function(){};to.prototype.Se=function(){};function Hm(a,b,c,d,e){ol.call(this,a);this.j=b;this.f=c;this.Dc=d;this.Hg=a.ownerDocument;this.l=e;en(e,this);this.ff=null;this.Uf=this.ag=!1;this.ha=this.ra=this.C=this.ib=this.va=0;this.Eb=this.Yf=this.Xf=null;this.Dd=!1;this.g=this.N=null;this.Fb=!0;this.se=this.ze=this.ye=0;this.u=!0;this.wb=null;this.B=[];this.sa=this.Ed=null;this.ef=NaN}v(Hm,ol);function uo(a,b){return!!b.Aa&&(!a.ag||!!b.parent)}
function po(a,b){return a.b?b<a.ha:b>a.ha}function vo(a,b){if(a)for(var c;(c=a.lastChild)!=b;)a.removeChild(c)}Hm.prototype.zd=function(a){var b=this,c=L("openAllViews"),d=a.oa;wo(b.j,b.element,b.Uf);var e=d.length-1,f=null;Be(function(){for(;0<=e;){f=Uk(d[e],f);e!==d.length-1||f.D||(f.D=b.ff);if(!e){var c=f,h;h=a;h=h.Oa?dl(h.Oa,h.ma,1):h.ma;c.ma=h;f.J=a.J;f.Oa=a.Oa;if(f.J)break}c=xo(b.j,f,!e&&!f.ma);e--;if(c.Wa())return c}return M(!1)}).then(function(){O(c,f)});return c.result()};var yo=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function zo(a,b){if(b.f&&b.xa&&!b.J&&!b.f.count&&1!=b.A.nodeType){var c=b.A.textContent.match(yo);return Ao(a.j,b,c[0].length)}return M(b)}
function Bo(a,b,c){var d=!1,e=L("buildViewToNextBlockEdge");Ce(function(e){b.A&&!Co(b)&&c.push(Wk(b));zo(a,b).then(function(f){f!==b&&(b=f,Co(b)||c.push(Wk(b)));Do(a,b).then(function(c){if(b=c){if(d||!a.Dc.b(b))d=!0,b=b.modify(),b.wa=!0;uo(a,b)&&!a.b?Eo(a,b).then(function(c){b=c;Gn(a.l)&&(b=null);b?P(e):Q(e)}):b.xa?P(e):Q(e)}else Q(e)})})}).then(function(){O(e,b)});return e.result()}function Do(a,b,c){b=Dm(a.j,b,c);return Fo(b,a)}
function Go(a,b){if(!b.A)return M(b);var c=[],d=b.M,e=L("buildDeepElementView");Ce(function(e){b.A&&b.xa&&!Co(b)?c.push(Wk(b)):(0<c.length&&Ho(a,b,c),c=[]);zo(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.M!=d;)g=g.parent;if(!g){b=f;Q(e);return}Co(f)||c.push(Wk(f))}Do(a,f).then(function(c){(b=c)&&b.M!=d?a.Dc.b(b)?P(e):(b=b.modify(),b.wa=!0,a.u?Q(e):P(e)):Q(e)})})}).then(function(){0<c.length&&Ho(a,b,c);O(e,b)});return e.result()}
function Io(a,b,c,d,e){var f=a.Hg.createElement("div");a.b?(e>=a.height&&(e-=.1),x(f,"height",d+"px"),x(f,"width",e+"px")):(d>=a.width&&(d-=.1),x(f,"width",d+"px"),x(f,"height",e+"px"));x(f,"float",c);x(f,"clear",c);a.element.insertBefore(f,b);return f}function Jo(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function Ko(a){for(var b=a.element.firstChild,c=a.b?a.b?a.va:a.C:a.b?a.ra:a.va,d=a.b?a.b?a.ib:a.ra:a.b?a.C:a.ib,e=t(a.Eb),f=e.next();!f.done;f=e.next()){var f=f.value,g=f.O-f.R;f.left=Io(a,b,"left",f.U-c,g);f.right=Io(a,b,"right",d-f.T,g)}}
function Lo(a,b,c,d,e){var f;if(b&&Mo(b.A))return NaN;if(b&&b.J&&!b.xa&&(f=go(b,a.f,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.Ia;;){f=go(b,a.f,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.C;b=c[d];1!=b.A.nodeType&&(e=b.A.textContent.length)}}}function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function No(a,b){var c=Nn(a.f,b),d=new ng;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function Oo(a,b){var c=Nn(a.f,b),d=new ng;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function Po(a,b){var c=L("layoutFloat"),d=b.A,e=b.Aa;x(d,"float","none");x(d,"display","inline-block");x(d,"vertical-align","top");Go(a,b).then(function(f){for(var g=Hk(a.f,d),h=No(a,d),g=new lg(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.va,l=a.ib,k=b.parent;k&&k.xa;)k=k.parent;if(k){var m=k.A.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.b?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");k.A.appendChild(m);var p=
Hk(a.f,m),h=Math.max(a.b?p.top:p.left,h),l=Math.min(a.b?p.bottom:p.right,l);k.A.removeChild(m);m=a.b?g.O-g.R:g.T-g.U;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.A.appendChild(b.A)}m=new lg(h,tl(a)*a.C,l,tl(a)*a.ra);h=g;a.b&&(h=Cg(g));l=tl(a);h.R<a.se*l&&(p=h.O-h.R,h.R=a.se*l,h.O=h.R+p);a:for(var l=a.Eb,p=h,q=p.R,r=p.T-p.U,z=p.O-p.R,u=Gg(l,q);;){var A=q+z;if(A>m.O)break a;for(var H=m.U,E=m.T,K=u;K<l.length&&l[K].R<A;K++){var I=l[K];I.U>H&&(H=I.U);I.T<E&&(E=I.T)}if(H+r<=E||u>=l.length){"left"==
e?(p.U=H,p.T=H+r):(p.U=E-r,p.T=E);p.O+=q-p.R;p.R=q;break a}q=l[u].O;u++}a.b&&(g=new lg(-h.O,h.U,-h.R,h.T));a:{m=Nn(a.f,d);l=new ng;if(m){if("border-box"==m.boxSizing){m=No(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}x(d,"width",g.T-g.U-m.left-m.right+"px");x(d,"height",g.O-g.R-
m.top-m.bottom+"px");x(d,"position","absolute");x(d,"display",b.display);l=null;if(k)if(k.P)l=k;else a:{for(k=k.parent;k;){if(k.P){l=k;break a}k=k.parent}l=null}l?(m=l.A.ownerDocument.createElement("div"),m.style.position="absolute",l.b?m.style.right="0":m.style.left="0",m.style.top="0",l.A.appendChild(m),k=Hk(a.f,m),l.A.removeChild(m)):k={left:(a.b?a.ra:a.va)-a.H,right:(a.b?a.C:a.ib)+a.X,top:(a.b?a.va:a.C)-a.I};(l?l.b:a.b)?x(d,"right",k.right-g.T+"px"):x(d,"left",g.U-k.left+"px");x(d,"top",g.R-k.top+
"px");b.C&&(b.C.parentNode.removeChild(b.C),b.C=null);k=a.b?g.U:g.O;g=a.b?g.T:g.R;if(po(a,k)&&a.N.length)b=b.modify(),b.wa=!0,O(c,b);else{Jo(a);m=new lg(a.b?a.ra:a.va,a.b?a.va:a.C,a.b?a.C:a.ib,a.b?a.ib:a.ra);a.b&&(m=Cg(m));l=a.Eb;for(p=[new pg(h.R,h.O,h.U,h.T)];0<p.length&&p[0].O<=m.R;)p.shift();if(p.length){p[0].R<m.R&&(p[0].R=m.R);h=l.length?l[l.length-1].O:m.R;h<m.O&&l.push(new pg(h,m.O,m.U,m.T));h=Gg(l,p[0].R);p=t(p);for(q=p.next();!q.done;q=p.next()){r=q.value;if(h==l.length)break;l[h].R<r.R&&
(q=l[h],h++,l.splice(h,0,new pg(r.R,q.O,q.U,q.T)),q.O=r.R);for(;h<l.length&&(q=l[h++],q.O>r.O&&(l.splice(h,0,new pg(r.O,q.O,q.U,q.T)),q.O=r.O),r.U!=r.T&&("left"==e?q.U=Math.min(r.T,m.T):q.T=Math.max(r.U,m.U)),q.O!=r.O););}Fg(m,l)}Ko(a);"left"==e?a.ye=k:a.ze=k;a.se=g;Qo(a,k);O(c,f)}});return c.result()}
function Ro(a,b,c,d,e,f){var g=a.element.ownerDocument.createElement("div");x(g,"position","absolute");var h=gn(a.l,b.V),l=new an(null,"column",null,a.l.h,b.b,null,null),h=dn(h),g=new So(c,g,a.j.clone(),a.f,a.Dc,l,h);en(l,g);var h=b.V,k=a.l;b=dn(k,h);l=g.element;b.element.parentNode.appendChild(l);g.ag=!0;g.F=b.F;g.G=b.G;g.b=b.b;g.marginLeft=g.marginRight=g.marginTop=g.marginBottom=0;g.Y=g.Pa=g.ga=g.Ca=0;g.H=g.X=g.I=g.P=0;g.qb=(b.qb||[]).concat();g.Fb=!pn(k);g.Qb=null;var m=Al(b);wl(g,m.U-b.F,m.T-
m.U);vl(g,m.R-b.G,m.O-m.R);e.vf(g,b,a);To(g);(a=!!On(k,g,h,c,d,!0,!pn(k),f))?(Jo(g),To(g)):b.element.parentNode.removeChild(l);return a?g:null}
function Uo(a,b,c,d,e,f,g,h){var l=a.l;b=(h?h.Hb:[]).concat(b);var k=b[0].ja,m=Wn(l,k,c,d),p=Ro(a,k,c,g,f,m),q={Jf:p,jf:null,gf:null};if(!p)return M(q);var r=L("layoutSinglePageFloatFragment"),z=!1,u=0;Ce(function(a){u>=b.length?Q(a):Jm(p,new hl(b[u].b),!0).then(function(b){q.gf=b;!b||e?(u++,P(a)):(z=!0,Q(a))})}).then(function(){if(!z){var a=On(l,p,k.V,c,g,!1,e,m);a?(a=f.Gf(b,a,p,!!q.gf),ln(l,a,!0),q.jf=a):z=!0}O(r,q)});return r.result()}
function Vo(a,b,c,d,e){function f(a,c){c?nn(g,c,!0):a&&a.element.parentNode.removeChild(a.element);In(g,h.V);vn(g,b)}var g=a.l,h=b.ja;Hn(g,h);var l=L("layoutPageFloatInner");Uo(a,[b],h.Aa,h.h,!pn(g),c,d,e).then(function(b){var c=b.Jf,d=b.jf,k=b.gf;d?Wo(a,h.V,[e]).then(function(a){a?(ln(g,d),Jn(g,h.V),k&&vn(g,new $m(h,k.f)),O(l,!0)):(f(c,d),O(l,!1))}):(f(c,d),O(l,!1))});return l.result()}
function Wo(a,b,c){var d=a.l,e=Kn(d,b),f=[],g=[],h=!1,l=L("layoutStashedPageFloats"),k=0;Ce(function(b){if(k>=e.length)Q(b);else{var d=e[k];if(c.includes(d))k++,P(b);else{var l=jn(d.Hb[0].ja);Uo(a,d.Hb,d.Aa,null,!1,l,null).then(function(a){var c=a.Jf;c&&f.push(c);(a=a.jf)?(g.push(a),k++,P(b)):(h=!0,Q(b))})}}}).then(function(){h?(g.forEach(function(a){nn(d,a,!0)}),f.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):e.forEach(function(a){(a=a.b.element)&&a.parentNode&&
a.parentNode.removeChild(a)});O(l,!h)});return l.result()}function Xo(a,b){var c=b.A.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote"===b.Aa&&Yo(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.A);c=b.modify();c.J=!0;c.A=d;return c}
function eo(a,b,c,d){var e=L("resolveFloatReferenceFromColumnSpan"),f=a.l,g=gn(f,"region");dn(f).width<dn(g).width&&"column"===b?c===Wc?Go(a,Wk(d)).then(function(c){var d=c.A;c=Pn(a.f,d,[Zo])[Zo];d=No(a,d);c=a.b?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?O(e,"region"):O(e,b)}):c===Uc?O(e,"region"):O(e,b):O(e,b);return e.result()}
function $o(a,b){var c=a.l,d=bo(b),e=c.Ye(cl(b));return(e?M(e):d.Ff(b,c,a)).fa(function(e){var f=Sk(b),h=Xo(a,b),l=d.rf(e,c),f=new $m(e,f);if(l&&Zm(l,e))return rn(c,e,h.A),M(h);if(kn(c,e)||wn(c,e))return vn(c,f),rn(c,e,h.A),M(h);if(a.sa)return M(null);var k=go(h,a.f,0,a.b);return po(a,k)?M(h):Vo(a,f,d,k,l).fa(function(a){if(a)return M(null);rn(c,e,h.A);return M(h)})})}
function ap(a,b,c){if(!b.J||b.xa){if(c){for(var d="",e=b.parent;e&&!d;e=e.parent)!e.xa&&e.A&&(d=e.A.style.textAlign);if("justify"!==d)return}var f=b.A,g=f.ownerDocument,h=c&&(b.J||1!=f.nodeType);(d=h?f.nextSibling:f)&&!d.parentNode&&(d=null);if(e=f.parentNode||b.parent&&b.parent.A){var l=d,k=document.body;if(null===hb){var m=k.ownerDocument,p=m.createElement("div");p.style.position="absolute";p.style.top="0px";p.style.left="0px";p.style.width="40px";p.style.height="100px";p.style.lineHeight="16px";
p.style.fontSize="16px";p.style.textAlign="justify";k.appendChild(p);var q=m.createTextNode("a a-");p.appendChild(q);var r=m.createElement("span");r.style.display="inline-block";r.style.width="40px";p.appendChild(r);m=m.createRange();m.setStart(q,2);m.setEnd(q,4);hb=37>m.getBoundingClientRect().right;k.removeChild(p)}hb&&(h=(h=h?f:f.previousSibling)?h.textContent:"",h.charAt(h.length-1)===bp(b)&&(h=f.ownerDocument,f=f.parentNode,k=document.body,null===ib&&(m=k.ownerDocument,p=m.createElement("div"),
p.style.position="absolute",p.style.top="0px",p.style.left="0px",p.style.width="40px",p.style.height="100px",p.style.lineHeight="16px",p.style.fontSize="16px",p.style.textAlign="justify",k.appendChild(p),q=m.createTextNode("a a-"),p.appendChild(q),p.appendChild(m.createElement("wbr")),r=m.createElement("span"),r.style.display="inline-block",r.style.width="40px",p.appendChild(r),m=m.createRange(),m.setStart(q,2),m.setEnd(q,4),ib=37>m.getBoundingClientRect().right,k.removeChild(p)),ib?f.insertBefore(h.createTextNode(" "),
l):f.insertBefore(h.createElement("wbr"),l)));h=b.b;f=g.createElement("span");f.style.visibility="hidden";f.style.verticalAlign="top";f.setAttribute("data-adapt-spec","1");k=g.createElement("span");k.style.fontSize="0";k.style.lineHeight="0";k.textContent=" #";f.appendChild(k);f.style.display="block";f.style.textIndent="0";f.style.textAlign="left";e.insertBefore(f,l);l=Hk(a.f,k);f.style.textAlign="right";k=Hk(a.f,k);f.style.textAlign="";p=document.body;if(null===gb){r=p.ownerDocument;q=r.createElement("div");
q.style.position="absolute";q.style.top="0px";q.style.left="0px";q.style.width="30px";q.style.height="100px";q.style.lineHeight="16px";q.style.fontSize="16px";q.style.textAlign="justify";p.appendChild(q);m=r.createTextNode("a | ");q.appendChild(m);var z=r.createElement("span");z.style.display="inline-block";z.style.width="30px";q.appendChild(z);r=r.createRange();r.setStart(m,0);r.setEnd(m,3);gb=27>r.getBoundingClientRect().right;p.removeChild(q)}gb?f.style.display="inline":f.style.display="inline-block";
l=h?k.top-l.top:k.left-l.left;l=1<=l?l-1+"px":"100%";h?f.style.paddingTop=l:f.style.paddingLeft=l;c||(c=g.createElement("div"),e.insertBefore(c,d),d=Hk(a.f,f),a=Hk(a.f,c),b.b?(c.style.marginRight=a.right-d.right+"px",c.style.width="0px"):(c.style.marginTop=d.top-a.top+"px",c.style.height="0px"),c.setAttribute("data-adapt-spec","1"))}}}
function cp(a,b,c,d){var e=L("processLineStyling");so(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.Cg);Ce(function(d){if(h){var e=dp(a,f),l=h.count-g;if(e.length<=l)Q(d);else{var p=ep(a,f,e[l-1]);p?a.Ja(p,!1,!1).then(function(){g+=l;Ao(a.j,p,0).then(function(e){b=e;ap(a,b,!1);h=b.f;f=[];Bo(a,b,f).then(function(a){c=a;P(d)})})}):Q(d)}}else Q(d)}).then(function(){Array.prototype.push.apply(d,f);so(d);O(e,c)});return e.result()}
function fp(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.J||!f.A||1!=f.A.nodeType)break;f=No(a,f.A);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function gp(a,b){var c=L("layoutBreakableBlock"),d=[];Bo(a,b,d).then(function(e){var f=d.length-1;if(0>f)O(c,e);else{var f=Lo(a,e,d,f,d[f].Ia),g=!1;if(!e||!Mo(e.A)){var h=lo(e,oo(a)),g=po(a,f+(a.b?-1:1)*h.Be);po(a,f+(a.b?-1:1)*h.current)&&!a.sa&&(a.sa=e)}e||(f+=fp(a,d));Qo(a,f);var l;b.f?l=cp(a,b,e,d):l=M(e);l.then(function(b){Ho(a,b,d);0<d.length&&(a.N.push(new mo(d,d[0].l)),g&&(2!=d.length&&0<a.N.length||d[0].M!=d[1].M||!fo[d[0].M.localName])&&b&&(b=b.modify(),b.wa=!0));O(c,b)})}});return c.result()}
function Ho(a,b,c){ee("POST_LAYOUT_BLOCK").forEach(function(d){d(b,c,a)})}
function ep(a,b,c){so(b);var d=a.b?c-1:c+1,e=0,f=b[0].Ia;c=e;for(var g=b.length-1,h=b[g].Ia,l;f<h;){l=f+Math.ceil((h-f)/2);c=e;for(var k=g;c<k;){var m=c+Math.ceil((k-c)/2);b[m].Ia>l?k=m-1:c=m}k=Lo(a,null,b,c,l);if(a.b?k<=d:k>=d){for(h=l-1;b[c].Ia==l;)c--;g=c}else Qo(a,k),f=l,e=c}d=f;b=b[c];c=b.A;1!=c.nodeType&&(hp(b),b.J?b.ma=c.length:(e=d-b.Ia,d=c.data,173==d.charCodeAt(e)?(c.replaceData(e,d.length-e,b.B?"":bp(b)),c=e+1):(f=d.charAt(e),e++,g=d.charAt(e),c.replaceData(e,d.length-e,!b.B&&Ua(f)&&Ua(g)?
bp(b):""),c=e),e=c,0<e&&(c=e,b=b.modify(),b.ma+=c,b.g=null)));ip(a,b,!1);return b}function hp(a){ee("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},jp)}var jp=new function(){};function bp(a){return a.F||a.parent&&a.parent.F||"-"}function Co(a){return a?(a=a.A)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function dp(a,b){for(var c=[],d=b[0].A,e=b[b.length-1].A,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=1===e.nodeType?!(!e.firstChild||h):!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=ho(a.f,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?Ok:Nk);l=d=h=g=e=0;for(m=tl(a);;){if(l<f.length&&
(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=h-1)){h=a.b?k.bottom:k.right;a.b?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ya);a.b&&c.reverse();return c}
function Gm(a,b){var c=0;fl(b,function(b){if("clone"===b.h["box-decoration-break"]){var d=Oo(a,b.A);c+=b.b?-d.left:d.bottom;"table"===b.display&&(c+=b.sa)}});return c}function qo(a,b){return(b?lo(b.g(),oo(a)):lo(null,oo(a))).current}
function no(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.xa;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.h.widows||2)-0,1),f=Math.max((e.h.orphans||2)-0,1));var e=Gm(a,e),g=dp(a,d),h=a.ha-e,e=tl(a),l=qo(a,b),h=h-e*l,k=kp(a,d);isNaN(k.oc)&&(k.oc=Infinity*e);var d=Xa(g.length,function(b){b=g[b];return a.b?b<h||b<=k.oc:b>h||b>=k.oc}),m=0>=d;m&&(d=Xa(g.length,function(b){return a.b?g[b]<h:g[b]>h}));d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=m?k.Cf:ep(a,b.h,h))c=lp(a,b),!isNaN(c)&&c<h&&(h=c),a.h=
e*(h-a.C)+l;return b}function lp(a,b){var c=b;do c=c.parent;while(c&&c.xa);return c?(c=Wk(c).modify(),c.J=!0,go(c,a.f,0,a.b)):NaN}function kp(a,b){var c=b.findIndex(function(a){return a.wa});if(0>c)return{oc:NaN,Cf:null};var d=b[c];return{oc:Lo(a,null,b,c,d.Ia),Cf:d}}Hm.prototype.Ja=function(a,b,c){var d=io(a.D).Ja(this,a,b,c);d||(d=mp.Ja(this,a,b,c));return d};
Hm.prototype.Yb=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.N.length-1;0<=e&&!b;--e){var a=this.N[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b&&this.Fb);return{zb:b?a:null,w:b}};
function np(a,b,c,d,e){if(Gn(a.l)||a.g||!c)return M(b);var f=L("doFinishBreak"),g=!1;if(!b){if(a.Fb)return w.b("Could not find any page breaks?!!"),op(a,c).then(function(b){b?(b=b.modify(),b.wa=!1,a.Ja(b,g,!0).then(function(){O(f,b)})):O(f,b)}),f.result();b=d;g=!0;a.h=e}a.Ja(b,g,!0).then(function(){O(f,b)});return f.result()}function pp(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function qp(a,b,c){if(!b||Mo(b.A))return!1;var d=go(b,a.f,0,a.b),e=lo(b,oo(a)),f=po(a,d+(a.b?-1:1)*e.Be);po(a,d+(a.b?-1:1)*e.current)&&!a.sa?a.sa=b:c&&(b=d+fp(a,c),e=a.ha-tl(a)*e.current,d=a.b?Math.min(d,Math.max(b,e)):Math.max(d,Math.min(b,e)));Qo(a,d);return f}function rp(a,b,c,d,e){if(!b||Mo(b.A))return!1;c=qp(a,b,c);!d&&c||sp(a,b,e,c);return c}
function tp(a,b){if(!b.A.parentNode)return!1;var c=No(a,b.A),d=b.A.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.A.parentNode.insertBefore(d,b.A);var e=Hk(a.f,d),e=a.b?e.right:e.top,f=tl(a),g=b.j,h=Infinity*-tl(a);"all"===g&&(h=Vn(a.l,a));switch(g){case "left":h=f*Math.max(h*f,a.ye*f);break;case "right":h=f*Math.max(h*f,a.ze*f);break;default:h=f*Math.max(h*
f,Math.max(a.ze*f,a.ye*f))}if(e*f>=h*f)return b.A.parentNode.removeChild(d),!1;e=Math.max(1,(h-e)*f);a.b?d.style.width=e+"px":d.style.height=e+"px";e=Hk(a.f,d);e=a.b?e.left:e.bottom;a.b?(h=e+c.right-h,0<h==0<=c.right&&(h+=c.right),d.style.marginLeft=h+"px"):(h-=e+c.top,0<h==0<=c.top&&(h+=c.top),d.style.marginBottom=h+"px");b.C=d;return!0}function up(a){return a instanceof to?!0:a instanceof vp?!1:a instanceof wp?!0:!1}
function xp(a,b,c,d){function e(){return!!d||!c&&!!Sl[m]}function f(){b=q[0]||b;b.A.parentNode.removeChild(b.A);h.g=m}var g=b.J?b.parent&&b.parent.D:b.D;if(g&&!up(g))return M(b);var h=a,l=L("skipEdges"),k=!d&&c&&b&&b.J,m=d,p=null,q=[],r=[],z=!1;Ce(function(a){for(;b;){var d=io(b.D);do if(b.A){if(b.xa&&1!=b.A.nodeType){if(Jk(b.A,b.lc))break;if(!b.J){e()?f():rp(h,p,null,!0,m)?(b=(h.u?p||b:b).modify(),b.wa=!0):(b=b.modify(),b.g=m);Q(a);return}}if(!b.J){if(d&&d.Ue(b))break;b.j&&tp(h,b)&&c&&!h.N.length&&
sp(h,Wk(b),m,!1);if(!up(b.D)||b.D instanceof wp||uo(h,b)||b.H){q.push(Wk(b));m=Ql(m,b.g);if(e())f();else if(rp(h,p,null,!0,m)||!h.Dc.b(b))b=(h.u?p||b:b).modify(),b.wa=!0;Q(a);return}}if(1==b.A.nodeType){var g=b.A.style;if(b.J){if(!(b.xa||d&&d.uf(b,h.u))){if(z){if(e()){f();Q(a);return}q=[];k=c=!1;m=null}z=!1;p=Wk(b);r.push(p);m=Ql(m,b.G);!g||pp(g.paddingBottom)&&pp(g.borderBottomWidth)||(r=[p])}}else{q.push(Wk(b));m=Ql(m,b.g);if(!h.Dc.b(b)&&(rp(h,p,null,!h.u,m),b=b.modify(),b.wa=!0,h.u)){Q(a);return}if(fo[b.A.localName]){e()?
f():rp(h,p,null,!0,m)&&(b=(h.u?p||b:b).modify(),b.wa=!0);Q(a);return}!g||pp(g.paddingTop)&&pp(g.borderTopWidth)||(k=!1,r=[]);z=!0}}}while(0);d=Do(h,b,k);if(d.Wa()){d.then(function(c){b=c;P(a)});return}b=d.get()}rp(h,p,r,!h.u,m)?p&&h.u&&(b=p.modify(),b.wa=!0):Sl[m]&&(h.g=m);Q(a)}).then(function(){p&&(h.wb=cl(p));O(l,b)});return l.result()}
function op(a,b){var c=Wk(b),d=L("skipEdges"),e=null,f=!1;Ce(function(d){for(;b;){do if(b.A){if(b.xa&&1!=b.A.nodeType){if(Jk(b.A,b.lc))break;if(!b.J){Sl[e]&&(a.g=e);Q(d);return}}if(!b.J&&(uo(a,b)||b.H)){e=Ql(e,b.g);Sl[e]&&(a.g=e);Q(d);return}if(1==b.A.nodeType){var g=b.A.style;if(b.J){if(f){if(Sl[e]){a.g=e;Q(d);return}e=null}f=!1;e=Ql(e,b.G)}else{e=Ql(e,b.g);if(fo[b.A.localName]){Sl[e]&&(a.g=e);Q(d);return}if(g&&(!pp(g.paddingTop)||!pp(g.borderTopWidth))){Q(d);return}}f=!0}}while(0);g=Dm(a.j,b);if(g.Wa()){g.then(function(a){b=
a;P(d)});return}b=g.get()}c=null;Q(d)}).then(function(){O(d,c)});return d.result()}function Eo(a,b){return Um(b.V)||"footnote"===b.Aa?$o(a,b):Po(a,b)}function yp(a,b,c,d){var e=L("layoutNext");xp(a,b,c,d||null).then(function(d){b=d;!b||a.g||a.u&&b&&b.wa?O(e,b):io(b.D).de(b,a,c).La(e)});return e.result()}function ip(a,b,c){if(b)for(var d=b.parent;b;b=d,d=d?d.parent:null)io((d||b).D).wd(a,d,b,c),c=!1}
function To(a){a.Yf=[];x(a.element,"width",a.width+"px");x(a.element,"height",a.height+"px");var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.I+"px";b.style.right=a.X+"px";b.style.bottom=a.P+"px";b.style.left=a.H+"px";a.element.appendChild(b);var c=Hk(a.f,b);a.element.removeChild(b);var b=a.F+a.left+rl(a),d=a.G+a.top+pl(a);a.Xf=new lg(b,d,b+a.width,d+a.height);a.va=c?a.b?c.top:c.left:0;a.ib=c?a.b?c.bottom:c.right:0;a.C=c?a.b?c.right:c.top:0;a.ra=c?a.b?c.left:
c.bottom:0;a.ye=a.C;a.ze=a.C;a.se=a.C;a.ha=a.ra;c=a.Xf;b=a.F+a.left+rl(a);d=a.G+a.top+pl(a);d=new lg(b,d,b+a.width,d+a.height);if(a.Qb){for(var b=d.U,d=d.R,e=[],f=t(a.Qb.b),g=f.next();!g.done;g=f.next())g=g.value,e.push(new mg(g.f+b,g.b+d));b=new rg(e)}else b=ug(d.U,d.R,d.T,d.O);b=[b];d=Sn(a.l);a.Eb=Eg(c,b,a.qb.concat(d),a.Rb,a.b);Ko(a);a.h=0;a.Dd=!1;a.g=null;a.wb=null}function sp(a,b,c,d){var e=Wk(b);b=io(b.D);var f=Gm(a,e);c=b.Ef(e,c,d,a.h+f);a.N.push(c)}
function Qo(a,b){isNaN(b)||(a.h=Math.max(tl(a)*(b-a.C),a.h))}
function Jm(a,b,c,d){a.Yf.push(b);b.f.J&&(a.wb=b.f);if(a.u&&a.Dd)return M(b);if(Zn(a.l,a))return b.f.J&&1===b.f.oa.length?M(null):M(b);var e=L("layout");a.zd(b.f).then(function(b){var f=null;if(b.A)f=Wk(b);else{var h=function(b){b.w.A&&(f=b.w,a.j.removeEventListener("nextInTree",h))};a.j.addEventListener("nextInTree",h)}var l=new Bp(c,d);Mm(l,b,a).then(function(b){np(a,b,l.g.Od,f,l.b).then(function(b){var c=null;a.Ed?c=M(null):c=Cp(a,b);c.then(function(){if(Gn(a.l))O(e,null);else if(b){a.Dd=!0;var c=
new hl(cl(b));O(e,c)}else O(e,null)})})})});return e.result()}function Cp(a,b){var c=L("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.B);d.sort(function(a,b){return a.oe()-b.oe()});var e=0;Be(function(){return e<d.length?d[e++].Ja(b,a).Bc(!0):M(!1)}).then(function(){O(c,!0)});return c.result()}
function Dp(a,b,c,d){var e=L("doLayout"),f=null;a.N=[];a.sa=null;Ce(function(e){for(var g={};b;){g.Ka=!0;yp(a,b,c,d||null).then(function(g){return function(h){c=!1;d=null;a.sa&&a.u?(a.g=null,b=a.sa,b.wa=!0):b=h;Gn(a.l)?Q(e):a.g?Q(e):b&&a.u&&b&&b.wa?(f=b,h=a.Yb(),b=h.w,h.zb&&h.zb.u(a),Q(e)):g.Ka?g.Ka=!1:P(e)}}(g));if(g.Ka){g.Ka=!1;return}g={Ka:g.Ka}}a.h+=qo(a);Q(e)}).then(function(){O(e,{w:b,Od:f})});return e.result()}function Ep(a){var b=Un(a.l);0<b&&isFinite(b)&&(a.ef=tl(a)*(b-a.C-a.h))}
function Mo(a){for(;a;){if(a.parentNode===a.ownerDocument)return!1;a=a.parentNode}return!0}function Bp(a,b){Lm.call(this);this.$b=a;this.B=b||null;this.l=null;this.b=0;this.j=!1;this.g={Od:null}}v(Bp,Lm);n=Bp.prototype;n.kf=function(){return new Fp(this.$b,this.B,this.g)};n.Zf=function(a,b){b.B=[];b.Ed||(Gp=[])};n.Bd=function(a){for(Lm.prototype.Bd.call(this,a);a;){var b=a.A;b&&vo(b.parentNode,b);a=a.parent}};n.sf=function(a,b){Lm.prototype.sf.call(this,a,b);this.l=b.g;this.b=b.h;this.j=b.Dd};
n.ce=function(a,b){Lm.prototype.ce.call(this,a,b);b.g=this.l;b.h=this.b;b.Dd=this.j};function Fp(a,b,c){this.$b=a;this.j=b;this.h=c}Fp.prototype.b=function(a,b){var c=this,d=L("adapt.layout.DefaultLayoutMode.doLayout");Hp(a,b).then(function(){Dp(b,a,c.$b,c.j).then(function(a){c.h.Od=a.Od;O(d,a.w)})});return d.result()};Fp.prototype.f=function(a,b){var c=this;return Gn(b.l)||b.g||0>=b.B.length?!0:b.B.every(function(d){return d.ee(a,c.h.Od,b)})};
Fp.prototype.g=function(a,b,c,d){d||(d=!c.B.some(function(b){return b.ed(a)}));c.B.forEach(function(e){e.Vc(d,a,b,c)});return d};function Ip(){}n=Ip.prototype;n.de=function(a,b){var c;if(uo(b,a))c=Eo(b,a);else{a:if(a.J)c=!0;else{switch(a.M.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.H}c=c?gp(b,a):Go(b,a)}return c};n.Ef=function(a,b,c,d){return new Km(Wk(a),b,c,d)};n.Ue=function(){return!1};n.uf=function(){return!1};
n.wd=function(a,b,c,d){c.A&&c.A.parentNode&&(a=c.A.parentNode,vo(a,c.A),d&&a.removeChild(c.A))};n.Ja=function(a,b,c,d){c=c||!!b.A&&1==b.A.nodeType&&!b.J;ip(a,b,c);d&&(ap(a,b,!0),Jp(c?b:b.parent));return M(!0)};var mp=new Ip;de("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.D?null:b&&a.D!==b.D?null:a.$c||!a.D&&Ul(c,d,e,f).display===Zc?new to(b?b.D:null):null});de("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof to?mp:null});
function So(a,b,c,d,e,f,g){Hm.call(this,b,c,d,e,f);this.Aa=a;this.bg=g;this.Pb=[];this.$f=[];this.pe=!0}v(So,Hm);
So.prototype.zd=function(a){var b=this;return Hm.prototype.zd.call(this,a).fa(function(a){if(a){for(var c=a;c.parent;)c=c.parent;c=c.A;b.Pb.push(c);b.pe&&Kp(b,c);b.$f.push(No(b,c));if(b.pe){var e=b.Aa;if(b.bg.b){if("block-end"===e||"left"===e)e=Na(c,"height"),""!==e&&"auto"!==e&&x(c,"margin-top","auto")}else if("block-end"===e||"bottom"===e)e=Na(c,"width"),""!==e&&"auto"!==e&&x(c,"margin-left","auto")}}return M(a)})};
function Kp(a,b){function c(a,c){a.forEach(function(a){var d=Na(b,a);d&&"%"===d.charAt(d.length-1)&&x(b,a,c*parseFloat(d)/100+"px")})}var d=Al(a.bg),e=d.T-d.U,d=d.O-d.R;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.b?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===Na(b,a)&&x(b,a,"0")})}
function Rn(a){return Math.max.apply(null,a.Pb.map(function(a,c){var b=Hk(this.f,a),e=this.$f[c];return this.b?e.top+b.height+e.bottom:e.left+b.width+e.right},a))}function Lp(a,b,c){var d=Hk(b.f,a);a=No(b,a);return c?d.width+a.left+a.right:d.height+a.top+a.bottom};function Mp(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Np(a,b){this.Ac=a;this.ld=b;this.Fe=null;this.aa=this.S=-1}function Op(a,b){this.b=a;this.f=b}function Dj(a,b,c){b=a.b.I.Me(b,a.f);a.b.l[b]=c}function Pp(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Qp(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function Rp(a,b){var c=a.b.I.gc(Aa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function fj(a,b,c){var d=new Ib(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b);Sp(a.b,b,function(a){return c(a[0])},d);return d}function hj(a,b,c){var d=new Ib(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b);Sp(a.b,b,c,d);return d}function Tp(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.C=b;for(b=0;d.C&&(b+=5E3,gm(d,b,0)!==Number.POSITIVE_INFINITY););d.C=null}e=a.b.l[c]}return e||null}
function jj(a,b,c,d){var e=Qp(b),f=Rp(a,b),g=Tp(a,e,f,!1);return g&&g[c]?(b=g[c],new Gb(a.j,d(b[b.length-1]||null))):new Ib(a.f,function(){if(g=Tp(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.B[f]||null)return Up(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Vp(a.b,f,!1);return"??"}Vp(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function lj(a,b,c,d){var e=Qp(b),f=Rp(a,b);return new Ib(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.B[f]||null;if(b){Up(a.b,f);var b=b[c]||[],h=Tp(a,e,f,!0)[c]||[];return d(b.concat(h))}Vp(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function Wp(a){this.I=a;this.l={};this.B={};this.b={};this.b.page=[0];this.G={};this.F=[];this.C={};this.j=null;this.u=[];this.g=[];this.H=[];this.f={};this.h={};this.He=[]}function Xp(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function Yp(a,b,c){a.G=Mp(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=Qg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=Qg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function Zp(a,b){a.F.push(a.b);a.b=Mp(b)}
function Up(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Ac===b?(g.ld=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Vp(a,b,!0)}function Vp(a,b,c){a.u.some(function(a){return a.Ac===b})||a.u.push(new Np(b,c))}
function $p(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=Mp(a.b);d.forEach(function(a){this.B[a]=e;var d=this.C[a];if(d&&d.aa<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.ld=!1,f.push(g)}this.C[a]={S:b,aa:c}},a)}for(var d=a.G,f;f=a.u.shift();){f.Fe=d;f.S=b;f.aa=c;var g=void 0;f.ld?(g=a.h[f.Ac])||(g=a.h[f.Ac]=[]):(g=a.f[f.Ac])||(g=a.f[f.Ac]=[]);g.every(function(a){return!(f===a||a&&f.Ac===a.Ac&&f.ld===a.ld&&f.S===a.S&&f.aa===a.aa)})&&g.push(f)}a.j=null}
function aq(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.S-b.S||a.aa-b.aa});var d=[],e=null;c.forEach(function(a){e&&e.S===a.S&&e.aa===a.aa?e.Qd.push(a):(e={S:a.S,aa:a.aa,Fe:a.Fe,Qd:[a]},d.push(e))});return d}function bq(a,b){a.H.push(a.g);a.g=b}function Sp(a,b,c,d){"pages"===b&&a.He.push({Gc:d,format:c})}function cq(a){return a.N.bind(a)}
Wp.prototype.N=function(a,b,c){return 0<=this.He.findIndex(function(b){return b.Gc===a})?(c=c.createElement("span"),c.textContent=b,c.setAttribute("data-vivliostyle-pages-counter",a.g),c):null};function dq(a,b){var c=a.b.page[0];Array.from(b.root.querySelectorAll("[data-vivliostyle-pages-counter]")).forEach(function(a){var b=a.getAttribute("data-vivliostyle-pages-counter"),d=this.He.findIndex(function(a){return a.Gc.g===b});a.textContent=this.He[d].format([c])},a)}
function eq(a,b){this.f=a;this.aa=b}eq.prototype.b=function(a){if(!a||a.J)return!0;a=a.A;if(!a||1!==a.nodeType)return!0;a=a.getAttribute("id")||a.getAttribute("name");return a&&(this.f.h[a]||this.f.f[a])?(a=this.f.C[a])?this.aa>=a.aa:!0:!0};var fq=1;function gq(a,b,c,d,e){this.b={};this.children=[];this.g=null;this.index=0;this.f=a;this.name=b;this.fc=c;this.Ma=d;this.parent=e;this.j="p"+fq++;e&&(this.index=e.children.length,e.children.push(this))}gq.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};gq.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function hq(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function iq(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function jq(a){gq.call(this,a,null,null,[],null);this.b.width=new V(Xd,0);this.b.height=new V(Yd,0)}v(jq,gq);
function kq(a,b){this.g=b;var c=this;Fb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.l[d[1]];if(e&&(e=this.va[e])){if(b){var d=d[2],h=e.ha[d];if(h)e=h;else{switch(d){case "columns":var h=e.f.f,l=new xc(h,0),k=lq(e,"column-count"),m=lq(e,"column-width"),p=lq(e,"column-gap"),h=B(h,zc(h,new uc(h,"min",[l,k]),y(h,m,p)),p)}h&&(e.ha[d]=h);e=h}}else e=lq(e,d[2]);return e}}return null})}v(kq,Fb);
function mq(a,b,c,d,e,f,g){a=a instanceof kq?a:new kq(a,this);gq.call(this,a,b,c,d,e);this.g=this;this.ia=f;this.$=g;this.b.width=new V(Xd,0);this.b.height=new V(Yd,0);this.b["wrap-flow"]=new V(Wc,0);this.b.position=new V(Ed,0);this.b.overflow=new V(Ud,0);this.b.top=new V(new F(-1,"px"),0);this.l={}}v(mq,gq);mq.prototype.h=function(a){return new nq(a,this)};mq.prototype.clone=function(a){a=new mq(this.f,this.name,a.fc||this.fc,this.Ma,this.parent,this.ia,this.$);hq(this,a);iq(this,a);return a};
function oq(a,b,c,d,e){gq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j);this.b["wrap-flow"]=new V(Wc,0)}v(oq,gq);oq.prototype.h=function(a){return new pq(a,this)};oq.prototype.clone=function(a){a=new oq(a.parent.f,this.name,this.fc,this.Ma,a.parent);hq(this,a);iq(this,a);return a};function qq(a,b,c,d,e){gq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j)}v(qq,gq);qq.prototype.h=function(a){return new rq(a,this)};
qq.prototype.clone=function(a){a=new qq(a.parent.f,this.name,this.fc,this.Ma,a.parent);hq(this,a);iq(this,a);return a};function Y(a,b,c){return b&&b!==Wc?b.za(a,c):null}function sq(a,b,c){return b&&b!==Wc?b.za(a,c):a.b}function tq(a,b,c){return b?b===Wc?null:b.za(a,c):a.b}function uq(a,b,c,d){return b&&c!==J?b.za(a,d):a.b}function vq(a,b,c){return b?b===Vd?a.j:b===jd?a.h:b.za(a,a.b):c}
function wq(a,b){this.g=a;this.f=b;this.I={};this.style={};this.B=this.C=null;this.children=[];this.N=this.P=this.h=this.j=!1;this.G=this.H=0;this.F=null;this.ra={};this.ha={};this.va=this.Y=this.b=!1;a&&a.children.push(this)}function xq(a){a.H=0;a.G=0}function yq(a,b,c){b=lq(a,b);c=lq(a,c);if(!b||!c)throw Error("E_INTERNAL");return y(a.f.f,b,c)}
function lq(a,b){var c=a.ra[b];if(c)return c;var d=a.style[b];d&&(c=d.za(a.f.f,a.f.f.b));switch(b){case "margin-left-edge":c=lq(a,"left");break;case "margin-top-edge":c=lq(a,"top");break;case "margin-right-edge":c=yq(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=yq(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=yq(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=yq(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
yq(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=yq(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=yq(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=yq(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=yq(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=yq(a,"bottom-edge","padding-bottom");break;case "left-edge":c=yq(a,"padding-left-edge","padding-left");break;case "top-edge":c=
yq(a,"padding-top-edge","padding-top");break;case "right-edge":c=yq(a,"left-edge","width");break;case "bottom-edge":c=yq(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Ph:Qh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=lq(a,d))}c&&(a.ra[b]=c);return c}
function zq(a){var b=a.f.f,c=a.style,d=vq(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new sc(b,"page-number"),d=yc(b,d,new kc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=yc(b,d,new jc(b,new sc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=yc(b,d,new jc(b,new sc(b,"page-height"),e)));d=a.X(d);c.enabled=new G(d)}wq.prototype.X=function(a){return a};
wq.prototype.ue=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.za(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=uq(a,b["border-left-width"],b["border-left-style"],c),g=sq(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=sq(a,b["padding-right"],c),m=uq(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=y(a,f,g),z=y(a,f,k);d&&q&&h?(r=B(a,c,y(a,h,y(a,y(a,d,r),z))),e?p?q=B(a,r,p):p=B(a,r,y(a,q,e)):(r=B(a,r,
q),p?e=B(a,r,p):p=e=zc(a,r,new Gb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.C,this.j=!0):d=a.b:(h=this.C,this.j=!0),r=B(a,c,y(a,y(a,e,r),y(a,p,z))),this.j&&(l||(l=B(a,r,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.j=!1)),d?h?q||(q=B(a,r,y(a,d,h))):h=B(a,r,y(a,d,q)):d=B(a,r,y(a,q,h)));a=sq(a,b["snap-width"]||(this.g?this.g.style["snap-width"]:null),c);b.left=new G(d);b["margin-left"]=new G(e);b["border-left-width"]=new G(f);b["padding-left"]=
new G(g);b.width=new G(h);b["max-width"]=new G(l?l:h);b["padding-right"]=new G(k);b["border-right-width"]=new G(m);b["margin-right"]=new G(p);b.right=new G(q);b["snap-width"]=new G(a)};
wq.prototype.ve=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.za(a,null):null,d=this.g?this.g.style.height.za(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=uq(a,b["border-top-width"],b["border-top-style"],c),h=sq(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=sq(a,b["padding-bottom"],c),p=uq(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=y(a,g,h),u=y(a,p,m);e&&r&&l?(d=B(a,d,y(a,l,y(a,y(a,e,z),
u))),f?q?r=B(a,d,f):q=B(a,d,y(a,r,f)):(d=B(a,d,r),q?f=B(a,d,q):q=f=zc(a,d,new Gb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||r||l||(e=a.b),e||l?e||r?l||r||(l=this.B,this.h=!0):e=a.b:(l=this.B,this.h=!0),d=B(a,d,y(a,y(a,f,z),y(a,q,u))),this.h&&(k||(k=B(a,d,e?e:r)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.h=!1)),e?l?r||(r=B(a,d,y(a,e,l))):l=B(a,d,y(a,r,e)):e=B(a,d,y(a,r,l)));a=sq(a,b["snap-height"]||(this.g?this.g.style["snap-height"]:null),c);b.top=new G(e);b["margin-top"]=
new G(f);b["border-top-width"]=new G(g);b["padding-top"]=new G(h);b.height=new G(l);b["max-height"]=new G(k?k:l);b["padding-bottom"]=new G(m);b["border-bottom-width"]=new G(p);b["margin-bottom"]=new G(q);b.bottom=new G(r);b["snap-height"]=new G(a)};
function Aq(a){var b=a.f.f,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Ad?f.za(b,null):null)||(f=new rc(b,1,"em"));d&&!e&&(e=new uc(b,"floor",[Ac(b,y(b,a,f),y(b,d,f))]),e=new uc(b,"max",[b.f,e]));e||(e=b.f);d=B(b,Ac(b,y(b,a,f),e),f);c["column-width"]=new G(d);c["column-count"]=new G(e);c["column-gap"]=new G(f)}function Bq(a,b,c,d){a=a.style[b].za(a.f.f,null);return Ub(a,c,d,{})}
function Cq(a,b){b.va[a.f.j]=a;var c=a.f.f,d=a.style,e=a.g?Dq(a.g,b):null,e=Sj(a.I,b,e,!1);a.b=Qj(e,b,a.g?a.g.b:!1);a.Y=Rj(e,b,a.g?a.g.Y:!1);Wj(e,d,a.b,a.Y,function(a,b){return b.value});a.C=new Ib(c,function(){return a.H},"autoWidth");a.B=new Ib(c,function(){return a.G},"autoHeight");a.ue();a.ve();Aq(a);zq(a)}function Eq(a,b,c){(a=a.style[c])&&(a=kg(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=kg(b,a,c));return Sc(a,b)}
function Dq(a,b){var c;a:{if(c=a.I["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==C&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Fq(a,b,c,d,e){if(a=Eq(a,b,d))a.sc()&&Mb(a.ka)&&(a=new F(Sc(a,b),"px")),"font-family"===d&&(a=sm(e,a)),x(c,d,a.toString())}
function Gq(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");wl(c,d,a);x(c.element,"margin-left",e+"px");x(c.element,"padding-left",f+"px");x(c.element,"border-left-width",g+"px");c.marginLeft=e;c.Y=g;c.H=f}
function Hq(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");x(c.element,"margin-right",f+"px");x(c.element,"padding-right",g+"px");x(c.element,"border-right-width",b+"px");c.marginRight=f;c.Pa=b;a.b&&0<e&&(a=d+sl(c),a-=Math.floor(a/e)*e,0<a&&(c.Gd=e-a,g+=c.Gd));c.X=g;c.Jd=e}
function Iq(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ga=b;c.Rb=d;!a.b&&0<d&&(a=e+pl(c),a-=Math.floor(a/d)*d,0<a&&(c.xb=d-a,g+=c.xb));c.I=g;x(c.element,"top",e+"px");x(c.element,"margin-top",f+"px");x(c.element,"padding-top",g+"px");x(c.element,"border-top-width",b+"px")}
function Jq(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.xb;x(c.element,"height",a+"px");x(c.element,"margin-bottom",d+"px");x(c.element,"padding-bottom",e+"px");x(c.element,"border-bottom-width",f+"px");c.height=a-c.xb;c.marginBottom=d;c.Ca=f;c.P=e}function Kq(a,b,c){a.b?(Iq(a,b,c),Jq(a,b,c)):(Hq(a,b,c),Gq(a,b,c))}
function Lq(a,b,c){x(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.P?vl(c,0,d):(Iq(a,b,c),d-=c.xb,c.height=d,x(c.element,"height",d+"px"))}function Mq(a,b,c){x(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.N?wl(c,0,d):(Hq(a,b,c),d-=c.Gd,c.width=d,a=Z(a,b,"right"),x(c.element,"right",a+"px"),x(c.element,"width",d+"px"))}
var Nq="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Oq="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Pq="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Qq=["width","height"],Rq=["transform","transform-origin"];
wq.prototype.dc=function(a,b,c,d){this.g&&this.b==this.g.b||x(b.element,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.j:this.h)?this.b?Mq(this,a,b):Lq(this,a,b):(this.b?Hq(this,a,b):Iq(this,a,b),this.b?Gq(this,a,b):Jq(this,a,b));(this.b?this.h:this.j)?this.b?Lq(this,a,b):Mq(this,a,b):Kq(this,a,b);for(c=0;c<Nq.length;c++)Fq(this,a,b.element,Nq[c],d)};function Sq(a,b,c,d){for(var e=0;e<Pq.length;e++)Fq(a,b,c.element,Pq[e],d)}
function Tq(a,b,c,d){for(var e=0;e<Qq.length;e++)Fq(a,b,c,Qq[e],d)}
wq.prototype.Id=function(a,b,c,d,e,f,g){this.b?this.H=b.h+b.Gd:this.G=b.h+b.xb;var h=(this.b||!d)&&this.h,l=(!this.b||!d)&&this.j;if(l||h)l&&x(b.element,"width","auto"),h&&x(b.element,"height","auto"),d=Hk(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.H-b.Y-b.X-b.Pa),this.b&&(this.H+=b.Gd)),h&&(this.G=d.bottom-d.top-b.I-b.ga-b.P-b.Ca,this.b||(this.G+=b.xb));(this.b?this.h:this.j)&&Kq(this,a,b);if(this.b?this.j:this.h){if(this.b?this.N:this.P)this.b?Hq(this,a,b):Iq(this,a,b);this.b?
Gq(this,a,b):Jq(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Eq(this,a,"column-rule-style"),f=Eq(this,a,"column-rule-color"),0<l&&d&&d!=J&&f!=Rd))for(var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.H-l/2,r=b.height+b.I+b.P,z=b.element.ownerDocument.createElement("div");x(z,"position","absolute");x(z,this.b?"left":"top","0px");x(z,this.b?"top":"left",q+"px");x(z,this.b?"height":"width","0px");x(z,this.b?"width":"height",
r+"px");x(z,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<Oq.length;h++)Fq(this,a,b.element,Oq[h],g);for(h=0;h<Rq.length;h++)e=b,g=Rq[h],l=c.u,(d=Eq(this,a,g))&&l.push(new zk(e.element,g,d))};
wq.prototype.l=function(a,b){var c=this.I,d=this.f.b,e;for(e in d)Wh(e)&&Xh(c,e,d[e]);if("background-host"==this.f.fc)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.f.fc)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);vj(a,this.f.Ma,null,c);c.content&&(c.content=c.content.Hd(new Zi(a,null,a.wb)));Cq(this,a.l);c=t(this.f.children);for(d=c.next();!d.done;d=c.next())d.value.h(this).l(a,b);Fj(a)};
function Uq(a,b){a.j&&(a.N=Bq(a,"right",a.C,b)||Bq(a,"margin-right",a.C,b)||Bq(a,"border-right-width",a.C,b)||Bq(a,"padding-right",a.C,b));a.h&&(a.P=Bq(a,"top",a.B,b)||Bq(a,"margin-top",a.B,b)||Bq(a,"border-top-width",a.B,b)||Bq(a,"padding-top",a.B,b));for(var c=t(a.children),d=c.next();!d.done;d=c.next())Uq(d.value,b)}function Vq(a){wq.call(this,null,a)}v(Vq,wq);Vq.prototype.l=function(a,b){wq.prototype.l.call(this,a,b);this.children.sort(function(a,b){return b.f.$-a.f.$||a.f.index-b.f.index})};
function nq(a,b){wq.call(this,a,b);this.F=this}v(nq,wq);nq.prototype.X=function(a){var b=this.f.g;b.ia&&(a=yc(b.f,a,b.ia));return a};nq.prototype.ga=function(){};function pq(a,b){wq.call(this,a,b);this.F=a.F}v(pq,wq);function rq(a,b){wq.call(this,a,b);this.F=a.F}v(rq,wq);
function Wq(a,b,c,d){var e=null;c instanceof Mc&&(e=[c]);c instanceof Fc&&(e=c.values);if(e)for(a=a.f.f,c=0;c<e.length;c++)if(e[c]instanceof Mc){var f=Db(e[c].name,"enabled"),f=new sc(a,f);d&&(f=new ac(a,f));b=yc(a,b,f)}return b}
rq.prototype.X=function(a){var b=this.f.f,c=this.style,d=vq(b,c.required,b.h)!==b.h;if(d||this.h){var e=c["flow-from"],e=e?e.za(b,b.b):new Gb(b,"body"),e=new uc(b,"has-content",[e]);a=yc(b,a,e)}a=Wq(this,a,c["required-partitions"],!1);a=Wq(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.za(b,null):b.j,c=yc(b,c,a),this.F.style.enabled=new G(c));return a};rq.prototype.dc=function(a,b,c,d,e){x(b.element,"overflow","hidden");wq.prototype.dc.call(this,a,b,c,d,e)};
function Xq(a,b,c,d){Ef.call(this,a,b,!1);this.target=c;this.b=d}v(Xq,Ff);Xq.prototype.Ib=function(a,b,c){Bh(this.b,a,b,c,this)};Xq.prototype.$d=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Xq.prototype.bd=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Xq.prototype.Jb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function Yq(a,b,c,d){Xq.call(this,a,b,c,d)}v(Yq,Xq);
function Zq(a,b,c,d){Xq.call(this,a,b,c,d);c.b.width=new V(Wd,0);c.b.height=new V(Wd,0)}v(Zq,Xq);Zq.prototype.pd=function(a,b,c){a=new qq(this.f,a,b,c,this.target);Df(this.na,new Yq(this.f,this.na,a,this.b))};Zq.prototype.od=function(a,b,c){a=new oq(this.f,a,b,c,this.target);a=new Zq(this.f,this.na,a,this.b);Df(this.na,a)};function $q(a,b,c,d){Xq.call(this,a,b,c,d)}v($q,Xq);$q.prototype.pd=function(a,b,c){a=new qq(this.f,a,b,c,this.target);Df(this.na,new Yq(this.f,this.na,a,this.b))};
$q.prototype.od=function(a,b,c){a=new oq(this.f,a,b,c,this.target);a=new Zq(this.f,this.na,a,this.b);Df(this.na,a)};function ar(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return D(a)}function Ul(a,b,c,d){if(a!==J)if(b===Tc||b===kd)c=J,a=ar(a);else if(c&&c!==J||d)a=ar(a);return{display:a,position:b,ja:c}}
function br(a,b,c,d,e,f,g){e=e||f||pd;return!!g||!!c&&c!==J||b===Tc||b===kd||a===sd||a===Nd||a===Md||a==ld||(a===Zc||a===yd)&&!!d&&d!==Ud||!!f&&e!==f};function cr(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.gc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.gc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.gc(e,b)})}
cr=function(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.gc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.gc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.gc(e,b)})};var dr={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},er={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},fr={"margin-top":"0px"},gr={"margin-right":"0px"},hr={};
function ir(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var jr=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),kr="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function lr(a,b){a.setAttribute("data-adapt-pseudo",b)}function mr(a,b,c,d,e){this.style=b;this.element=a;this.b=c;this.g=d;this.h=e;this.f={}}mr.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);a=this.style._pseudos[b]||{};if(b.match(/^first-/)&&!a["x-first-pseudo"]){var c=1;if("first-letter"==b)c=0;else if(b=b.match(/^first-([0-9]+)-lines$/))c=b[1]-0;a["x-first-pseudo"]=new V(new Oc(c),0)}return a};
mr.prototype.ra=function(a,b){var c=a.getAttribute("data-adapt-pseudo")||"";this.f[c]||(this.f[c]=!0,(c=b.content)&&El(c)&&c.ca(new Dl(a,this.g,c,this.h)))};function nr(a,b,c,d,e,f,g,h,l,k,m,p,q){this.h={};this.H=a;this.b=b;this.viewport=c;this.F=c.b;this.l=d;this.B=cq(d.Ca.b);this.u=e;this.ba=f;this.I=g;this.C=h;this.N=l;this.page=k;this.g=m;this.G=p;this.j=q;this.P=this.w=null;this.f=!1;this.M=null;this.ma=0;this.A=null}v(nr,db);
nr.prototype.clone=function(){return new nr(this.H,this.b,this.viewport,this.l,this.u,this.ba,this.I,this.C,this.N,this.page,this.g,this.G,this.j)};function or(a,b,c,d){a=a._pseudos;if(!a)return null;var e={},f={},g;for(g in a)f.Xc=e[g]={},Vj(f.Xc,a[g],d),Tj(f.Xc,d,a[g]),Uj(a[g],b,c,function(a){return function(b,c){Vj(a.Xc,c,d);pr(c,function(b){Vj(a.Xc,b,d)})}}(f)),f={Xc:f.Xc};return e}
function qr(a,b,c,d,e,f){var g=L("createRefShadow");a.ba.u.load(b).then(function(h){if(h){var l=jk(h,b);if(l){var k=a.N,m=k.I[h.url];if(!m){var m=k.style.j.f[h.url],p=new Nb(0,k.cc(),k.bc(),k.u),m=new Zl(h,m.g,m.f,p,k.l,m.l,new Op(k.h,h.url),new Pp(k.h,h.url,m.f,m.b));k.I[h.url]=m}f=new Xk(d,l,h,e,f,c,m)}}O(g,f)});return g.result()}
function rr(a,b,c,d,e,f,g,h){var l=L("createShadows"),k=e.template,m;k instanceof Qc?m=qr(a,k.url,2,b,h,null):m=M(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),z=null;p?z=h?h.ba:a.ba:h&&(p="http://www.w3.org/1999/xhtml"==h.na.namespaceURI?h.na.getAttribute("href"):h.na.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.gd?h.gd.ba:a.ba);p&&(p=Aa(p,z.url),m=qr(a,p,3,b,h,k))}m||(m=M(k));var u=null;
m.then(function(c){e.display===Nd?u=qr(a,Aa("user-agent.xml#table-cell",za),2,b,h,c):u=M(c)});u.then(function(k){var m=or(d,a.u,a.f,g);if(m){for(var p=[],q=jr.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=t(kr),z=u.next();!z.done;z=u.next()){var z=z.value,A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.f))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===rd))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===Ad||A===J)continue;p.push(z);A=jr.createElementNS("http://www.w3.org/1999/xhtml",
"span");lr(A,z)}else A=jr.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/)&&(r=A)}k=p.length?new Xk(b,q,null,h,k,2,new mr(b,d,f,g,a.B)):k}O(l,k)})});return l.result()}function wo(a,b,c){a.P=b;a.f=c}
function sr(a,b,c,d,e){var f=a.b;d=Sj(d,f,a.u,a.f);b=Qj(d,f,b);c=Rj(d,f,c);Wj(d,e,b,c,function(b,c){var d=c.evaluate(f,b);"font-family"==b&&(d=sm(a.I,d));return d});var g=Ul(e.display||rd,e.position,e["float"],a.M===a.ba.root);["display","position","float"].forEach(function(a){g[a]&&(e[a]=g[a])});return b}
function tr(a,b){for(var c=a.w.M,d=[],e=null,f=a.w.ua,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e=e||Oa(c)}h?(c=f.na,f=f.gd):(c=c.parentNode,g++)}c=Pb(a.b,"em",!g);c={"font-size":new V(new F(c,"px"),0)};f=new ci(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)Dh[k]&&l.push(k);l.sort(ae);for(var l=t(l),m=l.next();!m.done;m=l.next()){m=m.value;f.b=m;var p=h[m];p.value!==qd&&(c[m]=p.Hd(f))}}for(var q in b)Dh[q]||(c[q]=b[q]);return{lang:e,
kb:c}}var ur={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function vr(a,b){b=Aa(b,a.ba.url);return a.G[b]||b}function wr(a){a.w.lang=Oa(a.w.M)||a.w.parent&&a.w.parent.lang||a.w.lang}
function xr(a,b){var c=Fh().filter(function(a){return b[a]});if(c.length){var d=a.w.h;if(a.w.parent){var d=a.w.h={},e;for(e in a.w.parent.h)d[e]=a.w.parent.h[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Oc)d[a]=c.K;else if(c instanceof Mc)d[a]=c.name;else if(c instanceof F)switch(c.ka){case "dpi":case "dpcm":case "dppx":d[a]=c.K*Lb[c.ka]}else d[a]=c;delete b[a]}})}}
function yr(a,b,c,d,e,f){for(var g=ee("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.D=l;break}}}
function zr(a,b,c){var d=!0,e=L("createElementView"),f=a.M,g=a.w.ua?a.w.ua.b:a.l,h=g.l(f,!1);if(!a.w.ua){var l=ek(a.ba,f);Ar(l,a.w.Ra,0)}var k={};a.w.parent||(l=tr(a,h),h=l.kb,a.w.lang=l.lang);var m=h["float-reference"]&&Tm(h["float-reference"].value.toString());a.w.parent&&m&&Um(m)&&(l=tr(a,h),h=l.kb,a.w.lang=l.lang);a.w.b=sr(a,a.w.b,"rtl"===a.w.direction,h,k);g.ra(f,k);xr(a,k);wr(a);k.direction&&(a.w.direction=k.direction.toString());if((l=k["flow-into"])&&l.toString()!=a.H)return O(e,!1),e.result();
var p=k.display;if(p===J)return O(e,!1),e.result();var q=!a.w.parent;a.w.H=p===ld;rr(a,f,q,h,k,g,a.b,a.w.ua).then(function(l){a.w.Ga=l;l=k.position;var r=k["float"],u=k.clear,A=a.w.b?Td:pd,H=a.w.parent?a.w.parent.b?Td:pd:A,E="true"===f.getAttribute("data-vivliostyle-flow-root");a.w.$c=br(p,l,r,k.overflow,A,H,E);a.w.P=l===Ed||l===Tc||l===kd;!el(a.w)||r===md||m&&Um(m)||(u=r=null);A=r===wd||r===Fd||r===Qd||r===cd||r===ud||r===td||r===ad||r===$c||r===Id||r===md;r&&(delete k["float"],r===md&&(a.f?(A=!1,
k.display=Zc):k.display=rd));u&&(u===qd&&a.w.parent&&a.w.parent.j&&(u=D(a.w.parent.j)),u===wd||u===Fd||u===Qd||u===cd||u===bd||u===Uc||u===Gd)&&(delete k.clear,k.display&&k.display!=rd&&(a.w.j=u.toString()));var K=p===yd&&k["ua-list-item-count"];(A||k["break-inside"]&&k["break-inside"]!==Wc)&&a.w.l++;if(!(u=!A&&!p))a:switch(p.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":u=!0;break a;default:u=!1}if(!u)a:switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u=
!0;break a;default:u=!1}a.w.xa=u;a.w.display=p?p.toString():"inline";a.w.Aa=A?r.toString():null;a.w.V=m||Zk;a.w.N=k["float-min-wrap-block"]||null;a.w.ga=k["column-span"];if(!a.w.xa){if(u=k["break-after"])a.w.G=u.toString();if(u=k["break-before"])a.w.g=u.toString()}a.w.Y=k["vertical-align"]&&k["vertical-align"].toString()||"baseline";a.w.ha=k["caption-side"]&&k["caption-side"].toString()||"top";u=k["border-collapse"];if(!u||u===D("separate"))if(A=k["border-spacing"])A.Md()?(u=A.values[0],A=A.values[1]):
u=A,u.sc()&&(a.w.ra=Sc(u,a.b)),A.sc()&&(a.w.sa=Sc(A,a.b));a.w.X=k["footnote-policy"];if(u=k["x-first-pseudo"])a.w.f=new Yk(a.w.parent?a.w.parent.f:null,u.K);a.w.xa||Br(a,f,h,g,a.b);if(u=k["white-space"])u=Ik(u.toString()),null!==u&&(a.w.lc=u);(u=k["hyphenate-character"])&&u!==Wc&&(a.w.F=u.Pc);u=k["overflow-wrap"]||["word-wrap"];a.w.B=k["word-break"]===ed||u===fd;yr(a.w,b,p,l,r,q);a.w.parent&&a.w.parent.D&&(b=a.w.parent.D.af(a.w,b));a.w.xa||(a.w.u=Cr(k),Dr(a,f,g));var I=!1,ja=null,Ca=[],Da=f.namespaceURI,
N=f.localName;if("http://www.w3.org/1999/xhtml"==Da)"html"==N||"body"==N||"script"==N||"link"==N||"meta"==N?N="div":"vide_"==N?N="video":"audi_"==N?N="audio":"object"==N&&(I=!!a.g),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(N="img");else if("http://www.idpf.org/2007/ops"==Da)N="span",Da="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==Da){Da="http://www.w3.org/1999/xhtml";if("image"==N){if(N="div",(l=f.getAttributeNS("http://www.w3.org/1999/xlink",
"href"))&&"#"==l.charAt(0)&&(l=jk(a.ba,l)))ja=Er(a,Da,"img"),l="data:"+(l.getAttribute("content-type")||"image/jpeg")+";base64,"+l.textContent.replace(/[ \t\n\t]/g,""),Ca.push(He(ja,l))}else N=ur[N];N||(N=a.w.xa?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==Da)if(Da="http://www.w3.org/1999/xhtml","ncx"==N||"navPoint"==N)N="div";else if("navLabel"==N){if(N="span",r=f.parentNode){l=null;for(r=r.firstChild;r;r=r.nextSibling)if(1==r.nodeType&&(u=r,"http://www.daisy.org/z3986/2005/ncx/"==
u.namespaceURI&&"content"==u.localName)){l=u.getAttribute("src");break}l&&(N="a",f=f.ownerDocument.createElementNS(Da,"a"),f.setAttribute("href",l))}}else N="span";else"http://www.pyroxy.com/ns/shadow"==Da?(Da="http://www.w3.org/1999/xhtml",N=a.w.xa?"span":"div"):I=!!a.g;K?b?N="li":(N="div",p=Zc,k.display=p):"body"==N||"li"==N?N="div":"q"==N?N="span":"a"==N&&(l=k["hyperlink-processing"])&&"normal"!=l.toString()&&(N="span");k.behavior&&"none"!=k.behavior.toString()&&a.g&&(I=!0);f.dataset&&"true"===
f.getAttribute("data-math-typeset")&&(I=!0);var qb;I?qb=a.g(f,a.w.parent?a.w.parent.A:null,k):qb=M(null);qb.then(function(g){g?I&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Er(a,Da,N);"a"==N&&g.addEventListener("click",a.page.I,!1);ja&&(Yo(a,a.w,"inner",ja),g.appendChild(ja));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&ir(g);var h=a.w.h["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Wc||!m&&!q,p=
p===Wc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==N){for(var q=f.attributes,u=q.length,r=null,z=0;z<u;z++){var A=q[z],H=A.namespaceURI,E=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==E&&(A=vr(a,A));else{if(E.match(/^on/))continue;if("style"==E)continue;if(("id"==E||"name"==E)&&b){A=a.j.Me(A,a.ba.url);g.setAttribute(E,A);Fk(a.page,g,A);continue}"src"==E||"href"==E||"poster"==E?(A=vr(a,
A),"href"===E&&(A=a.j.gc(A,a.ba.url))):"srcset"==E&&(A=A.split(",").map(function(b){return vr(a,b.trim())}).join(","));if("poster"===E&&"video"===N&&"http://www.w3.org/1999/xhtml"===Da&&m&&p){var qb=new Image,zp=He(qb,A);Ca.push(zp);l.push({Lf:qb,element:g,If:zp})}}"http://www.w3.org/2000/svg"==Da&&/^[A-Z\-]+$/.test(E)&&(E=E.toLowerCase());Fr.includes(E.toLowerCase())&&(A=cr(A,a.ba.url,a.j));H&&(qb=hr[H])&&(E=qb+":"+E);"src"!=E||H||"img"!=N&&"input"!=N||"http://www.w3.org/1999/xhtml"!=Da?"href"==
E&&"image"==N&&"http://www.w3.org/2000/svg"==Da&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(He(g,A)):H?g.setAttributeNS(H,E,A):g.setAttribute(E,A):r=A}r&&(qb="input"===N?new Image:g,q=He(qb,r),qb!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&l.push({Lf:qb,element:g,If:q}),Ca.push(q)):a.page.j.push(q))}delete k.content;(m=k["list-style-image"])&&m instanceof Qc&&(m=m.url,Ca.push(He(new Image,m)));Gr(a,k);Hr(a,g,k);if(!a.w.xa&&(m=null,b?c&&(m=a.w.b?gr:fr):m="clone"!==a.w.h["box-decoration-break"]?a.w.b?
er:dr:a.w.b?gr:fr,m))for(var Ap in m)x(g,Ap,m[Ap]);K&&g.setAttribute("value",k["ua-list-item-count"].stringValue());a.A=g;Ca.length?Ge(Ca).then(function(){0<h&&Ir(a,l,h,k,a.w.b);O(e,d)}):ze().then(function(){O(e,d)})})});return e.result()}function Br(a,b,c,d,e){var f=or(c,a.u,a.f,e);f&&f["after-if-continues"]&&f["after-if-continues"].content&&(a.w.I=new Jr(b,new mr(b,c,d,e,a.B)))}var Fr="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Ir(a,b,c,d,e){b.forEach(function(b){if("load"===b.If.get().get()){var f=b.Lf,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===dd&&(d["border-left-style"]!==J&&(h+=Sc(d["border-left-width"],a.b)),d["border-right-style"]!==J&&(h+=Sc(d["border-right-width"],a.b)),d["border-top-style"]!==J&&(f+=Sc(d["border-top-width"],a.b)),d["border-bottom-style"]!==J&&(f+=Sc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||J,k=d["max-height"]||J;l===J&&k===J?x(b,"max-width",
h+"px"):l!==J&&k===J?x(b,"width",h+"px"):l===J&&k!==J?x(b,"height",f+"px"):"%"!==l.ka?x(b,"max-width",Math.min(h,Sc(l,a.b))+"px"):"%"!==k.ka?x(b,"max-height",Math.min(f,Sc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Zd,k=d["min-height"]||Zd,l.K||k.K?l.K&&!k.K?x(b,"width",h+"px"):!l.K&&k.K?x(b,"height",f+"px"):"%"!==l.ka?x(b,"min-width",Math.max(h,Sc(l,a.b))+"px"):"%"!==k.ka?x(b,"min-height",Math.max(f,Sc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+
"px"):x(b,"min-width",h+"px"))}})}function Gr(a,b){ee("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.w,b)})}function Dr(a,b,c){for(b=b.firstChild;b;b=b.nextSibling)if(1===b.nodeType){var d={},e=c.l(b,!1);sr(a,a.w.b,"rtl"===a.w.direction,e,d);if(Cr(d)){if(a.w.D instanceof wp&&!gl(a.w,a.w.D))break;c=a.w.parent;a.w.D=new wp(c&&c.D,a.w.M);Kr(a.w.D,a.w.b);break}}}
function Cr(a){var b=a["repeat-on-break"];return b!==J&&(b===Wc&&(b=a.display===Pd?od:a.display===Od?nd:J),b&&b!==J)?b.toString():null}function Lr(a){var b=L("createTextNodeView");Mr(a).then(function(){var c=a.ma||0,c=Nr(a.w.Oa).substr(c);a.A=document.createTextNode(c);O(b,!0)});return b.result()}
function Mr(a){if(a.w.Oa)return M(!0);var b,c=b=a.M.textContent,d=L("preprocessTextContent"),e=ee("PREPROCESS_TEXT_CONTENT"),f=0;Be(function(){return f>=e.length?M(!1):e[f++](a.w,c).fa(function(a){c=a;return M(!0)})}).then(function(){a.w.Oa=Or(b,c,0);O(d,!0)});return d.result()}
function Pr(a,b,c){var d=L("createNodeView"),e=!0;1==a.M.nodeType?b=zr(a,b,c):8==a.M.nodeType?(a.A=null,b=M(!0)):b=Lr(a);b.then(function(b){e=b;(a.w.A=a.A)&&(b=a.w.parent?a.w.parent.A:a.P)&&b.appendChild(a.A);O(d,e)});return d.result()}function xo(a,b,c,d){(a.w=b)?(a.M=b.M,a.ma=b.ma):(a.M=null,a.ma=-1);a.A=null;return a.w?Pr(a,c,!!d):M(!0)}
function Qr(a){if(null==a.ua||"content"!=a.M.localName||"http://www.pyroxy.com/ns/shadow"!=a.M.namespaceURI)return a;var b=a.Ia,c=a.ua,d=a.parent,e,f;c.qf?(f=c.qf,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.gd,e=c.na.firstChild,c=2);var g=a.M.nextSibling;g?(a.M=g,$k(a)):a.Da?a=a.Da:e?a=null:(a=a.parent.modify(),a.J=!0);if(e)return b=new Vk(e,d,b),b.ua=f,b.hb=c,b.Da=a,b;a.Ia=b;return a}
function Rr(a){var b=a.Ia+1;if(a.J){if(!a.parent)return null;if(3!=a.hb){var c=a.M.nextSibling;if(c)return a=a.modify(),a.Ia=b,a.M=c,$k(a),Qr(a)}if(a.Da)return a=a.Da.modify(),a.Ia=b,a;a=a.parent.modify()}else{if(a.Ga&&(c=a.Ga.root,2==a.Ga.type&&(c=c.firstChild),c))return b=new Vk(c,a,b),b.ua=a.Ga,b.hb=a.Ga.type,Qr(b);if(c=a.M.firstChild)return Qr(new Vk(c,a,b));1!=a.M.nodeType&&(c=Nr(a.Oa),b+=c.length-1-a.ma);a=a.modify()}a.Ia=b;a.J=!0;return a}
function Dm(a,b,c){b=Rr(b);if(!b||b.J)return M(b);var d=L("nextInTree");xo(a,b,!0,c).then(function(c){b.A&&c||(b=b.modify(),b.J=!0,b.A||(b.xa=!0));eb(a,{type:"nextInTree",w:b});O(d,b)});return d.result()}function Sr(a,b){if(b instanceof Fc)for(var c=b.values,d=0;d<c.length;d++)Sr(a,c[d]);else b instanceof Qc&&(c=b.url,a.page.j.push(He(new Image,c)))}
var Tr={"box-decoration-break":!0,"float-min-wrap-block":!0,"float-reference":!0,"flow-into":!0,"flow-linger":!0,"flow-options":!0,"flow-priority":!0,"footnote-policy":!0,page:!0};function Hr(a,b,c){var d=c["background-image"];d&&Sr(a,d);var d=c.position===Ed,e;for(e in c)if(!Tr[e]){var f=c[e],f=f.ca(new Rg(a.ba.url,a.j));f.sc()&&Mb(f.ka)&&(f=new F(Sc(f,a.b),"px"));xk[e]||d&&yk[e]?a.page.u.push(new zk(b,e,f)):x(b,e,f.toString())}}
function Yo(a,b,c,d){if(!b.J){var e=(b.ua?b.ua.b:a.l).l(a.M,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=sr(a,b.b,"rtl"===b.direction,e,c),b=c.content,El(b)&&(b.ca(new Dl(d,a.b,b,a.B)),delete c.content),Hr(a,d,c)}}
function Ao(a,b,c){var d=L("peelOff"),e=b.f,f=b.ma,g=b.J;if(0<c)b.A.textContent=b.A.textContent.substr(0,c),f+=c;else if(!g&&b.A&&!f){var h=b.A.parentNode;h&&h.removeChild(b.A)}for(var l=b.Ia+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.Da;Be(function(){for(;0<k.length;){m=k.pop();b=new Vk(m.M,b,l);k.length||(b.ma=f,b.J=g);b.hb=m.hb;b.ua=m.ua;b.Ga=m.Ga;b.Da=m.Da?m.Da:p;p=null;var c=xo(a,b,!1);if(c.Wa())return c}return M(!1)}).then(function(){O(d,b)});return d.result()}
function Er(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.F.createElement(c):a.F.createElementNS(b,c)}function Jp(a){a&&fl(a,function(a){var b=a.h["box-decoration-break"];b&&"slice"!==b||(b=a.A,a.b?(x(b,"padding-left","0"),x(b,"border-left","none"),x(b,"border-top-left-radius","0"),x(b,"border-bottom-left-radius","0")):(x(b,"padding-bottom","0"),x(b,"border-bottom","none"),x(b,"border-bottom-left-radius","0"),x(b,"border-bottom-right-radius","0")))})}
function Ur(a){this.b=a.h;this.window=a.window}function Vr(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function ho(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Vr(a,d)},a)}function Hk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Vr(c,d)}function Nn(a,b){return a.window.getComputedStyle(b,null)}
function Wr(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=Nn(new Ur(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}function Xr(a){x(a.g,"width","");x(a.g,"height","");x(a.f,"width","");x(a.f,"height","");x(a.f,"transform","")}Wr.prototype.zoom=function(a,b,c){x(this.g,"width",a*c+"px");x(this.g,"height",b*c+"px");x(this.f,"width",a+"px");x(this.f,"height",b+"px");x(this.f,"transform","scale("+c+")")};var Zo="min-content inline size",Qn="fit-content inline size";
function Pn(a,b,c){function d(c){return Nn(a,b).getPropertyValue(c)}function e(){x(b,"display","block");x(b,"position","static");return d(ja)}function f(){x(b,"display","inline-block");x(E,ja,"99999999px");var a=d(ja);x(E,ja,"");return a}function g(){x(b,"display","inline-block");x(E,ja,"0");var a=d(ja);x(E,ja,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,E=b.ownerDocument.createElement("div");x(E,"position",m);H.insertBefore(E,b);E.appendChild(b);x(b,"width","auto");x(b,"max-width","none");x(b,"min-width","0");x(b,"height","auto");x(b,"max-height","none");x(b,"min-height","0");var K=Ma("writing-mode"),K=(K?d(K[0]):null)||d("writing-mode"),I="vertical-rl"===K||"tb-rl"===K||"vertical-lr"===
K||"tb-lr"===K,ja=I?"height":"width",Ca=I?"width":"height",Da={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case Zo:c=g();break;case Qn:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=I?l():e();break;case "fill-available height":c=I?e():l();break;case "max-content width":c=
I?d(Ca):f();break;case "max-content height":c=I?f():d(Ca);break;case "min-content width":c=I?d(Ca):g();break;case "min-content height":c=I?g():d(Ca);break;case "fit-content width":c=I?d(Ca):h();break;case "fit-content height":c=I?h():d(Ca)}Da[a]=parseFloat(c);x(b,"position",m);x(b,"display",k)});x(b,"width",p);x(b,"max-width",q);x(b,"min-width",r);x(b,"height",z);x(b,"max-height",u);x(b,"min-height",A);H.insertBefore(b,E);H.removeChild(E);return Da};function Yr(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Sd||b!==Td&&a!==Kd?"ltr":"rtl"}
var Zr={a5:{width:new F(148,"mm"),height:new F(210,"mm")},a4:{width:new F(210,"mm"),height:new F(297,"mm")},a3:{width:new F(297,"mm"),height:new F(420,"mm")},b5:{width:new F(176,"mm"),height:new F(250,"mm")},b4:{width:new F(250,"mm"),height:new F(353,"mm")},"jis-b5":{width:new F(182,"mm"),height:new F(257,"mm")},"jis-b4":{width:new F(257,"mm"),height:new F(364,"mm")},letter:{width:new F(8.5,"in"),height:new F(11,"in")},legal:{width:new F(8.5,"in"),height:new F(14,"in")},ledger:{width:new F(11,"in"),
height:new F(17,"in")}},$r=new F(.24,"pt"),as=new F(3,"mm"),bs=new F(10,"mm"),cs=new F(13,"mm");
function ds(a){var b={width:Xd,height:Yd,Tb:Zd,Ub:Zd},c=a.size;if(c&&c.value!==Wc){var d=c.value;d.Md()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.sc())b.width=c,b.height=d||c;else if(c=Zr[c.name.toLowerCase()])d&&d===vd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==J&&(b.Ub=cs);a=a.bleed;a&&a.value!==Wc?a.value&&a.value.sc()&&(b.Tb=a.value):c&&(a=!1,c.value.Md()?a=c.value.values.some(function(a){return a===gd}):a=c.value===gd,a&&(b.Tb=new F(6,
"pt")));return b}function es(a,b){var c={},d=a.Tb.K*Pb(b,a.Tb.ka,!1),e=a.Ub.K*Pb(b,a.Ub.ka,!1),f=d+e,g=a.width;c.cc=g===Xd?b.Z.mc?b.Z.mc.width*Pb(b,"px",!1):(b.Z.sb?Math.floor(b.Pa/2)-b.Z.vc:b.Pa)-2*f:g.K*Pb(b,g.ka,!1);g=a.height;c.bc=g===Yd?b.Z.mc?b.Z.mc.height*Pb(b,"px",!1):b.Fb-2*f:g.K*Pb(b,g.ka,!1);c.Tb=d;c.Ub=e;c.ke=f;return c}function fs(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function gs(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var hs={eh:"top left",fh:"top right",Rg:"bottom left",Sg:"bottom right"};
function is(a,b,c,d,e,f){var g=d;g<=e+2*Lb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=fs(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=gs(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=gs(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var js={dh:"top",Qg:"bottom",jg:"left",kg:"right"};
function ks(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=fs(a,g,f),l=gs(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=gs(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=gs(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(js).forEach(function(a){a=
js[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function ls(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Md()?a.values.forEach(function(a){a===gd?e=!0:a===hd&&(f=!0)}):a===gd?e=!0:a===hd&&(f=!0);if(e||f){var g=c.L,h=g.ownerDocument,l=b.Tb,k=Sc($r,d),m=Sc(as,d),p=Sc(bs,d);e&&Object.keys(hs).forEach(function(a){a=is(h,hs[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(js).forEach(function(a){a=ks(h,js[a],k,p,m);g.appendChild(a)})}}
var ms=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),ns={"top-left-corner":{order:1,Va:!0,Sa:!1,Ta:!0,Ua:!0,Ba:null},"top-left":{order:2,
Va:!0,Sa:!1,Ta:!1,Ua:!1,Ba:"start"},"top-center":{order:3,Va:!0,Sa:!1,Ta:!1,Ua:!1,Ba:"center"},"top-right":{order:4,Va:!0,Sa:!1,Ta:!1,Ua:!1,Ba:"end"},"top-right-corner":{order:5,Va:!0,Sa:!1,Ta:!1,Ua:!0,Ba:null},"right-top":{order:6,Va:!1,Sa:!1,Ta:!1,Ua:!0,Ba:"start"},"right-middle":{order:7,Va:!1,Sa:!1,Ta:!1,Ua:!0,Ba:"center"},"right-bottom":{order:8,Va:!1,Sa:!1,Ta:!1,Ua:!0,Ba:"end"},"bottom-right-corner":{order:9,Va:!1,Sa:!0,Ta:!1,Ua:!0,Ba:null},"bottom-right":{order:10,Va:!1,Sa:!0,Ta:!1,Ua:!1,Ba:"end"},
"bottom-center":{order:11,Va:!1,Sa:!0,Ta:!1,Ua:!1,Ba:"center"},"bottom-left":{order:12,Va:!1,Sa:!0,Ta:!1,Ua:!1,Ba:"start"},"bottom-left-corner":{order:13,Va:!1,Sa:!0,Ta:!0,Ua:!1,Ba:null},"left-bottom":{order:14,Va:!1,Sa:!1,Ta:!0,Ua:!1,Ba:"end"},"left-middle":{order:15,Va:!1,Sa:!1,Ta:!0,Ua:!1,Ba:"center"},"left-top":{order:16,Va:!1,Sa:!1,Ta:!0,Ua:!1,Ba:"start"}},os=Object.keys(ns).sort(function(a,b){return ns[a].order-ns[b].order});
function ps(a,b,c){mq.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=ds(c);new qs(this.f,this,c,a);this.B={};rs(this,c);this.b.position=new V(Ed,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)ms[d]||"background-clip"===d||(this.b[d]=c[d])}v(ps,mq);function rs(a,b){var c=b._marginBoxes;c&&os.forEach(function(d){c[d]&&(a.B[d]=new ss(a.f,a,d,b))})}ps.prototype.h=function(a){return new ts(a,this)};
function qs(a,b,c,d){qq.call(this,a,null,null,[],b);this.C=d;this.b["z-index"]=new V(new Oc(0),0);this.b["flow-from"]=new V(D("body"),0);this.b.position=new V(Tc,0);this.b.overflow=new V(Ud,0);for(var e in ms)ms.hasOwnProperty(e)&&(this.b[e]=c[e])}v(qs,qq);qs.prototype.h=function(a){return new us(a,this)};
function ss(a,b,c,d){qq.call(this,a,null,null,[],b);this.u=c;a=d._marginBoxes[this.u];for(var e in d)if(b=d[e],c=a[e],Dh[e]||c&&c.value===qd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==qd&&(this.b[e]=b)}v(ss,qq);ss.prototype.h=function(a){return new vs(a,this)};function ts(a,b){nq.call(this,a,b);this.u=null;this.sa={}}v(ts,nq);
ts.prototype.l=function(a,b){var c=this.I,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}nq.prototype.l.call(this,a,b)};ts.prototype.ue=function(){var a=this.style;a.left=Zd;a["margin-left"]=Zd;a["border-left-width"]=Zd;a["padding-left"]=Zd;a["padding-right"]=Zd;a["border-right-width"]=Zd;a["margin-right"]=Zd;a.right=Zd};
ts.prototype.ve=function(){var a=this.style;a.top=new F(-1,"px");a["margin-top"]=Zd;a["border-top-width"]=Zd;a["padding-top"]=Zd;a["padding-bottom"]=Zd;a["border-bottom-width"]=Zd;a["margin-bottom"]=Zd;a.bottom=Zd};ts.prototype.ga=function(a,b,c){b=b.H;var d={start:this.u.marginLeft,end:this.u.marginRight,ta:this.u.Fc},e={start:this.u.marginTop,end:this.u.marginBottom,ta:this.u.Ec};ws(this,b.top,!0,d,a,c);ws(this,b.bottom,!0,d,a,c);ws(this,b.left,!1,e,a,c);ws(this,b.right,!1,e,a,c)};
function xs(a,b,c,d,e){this.L=a;this.B=e;this.j=c;this.u=!Y(d,b[c?"width":"height"],new rc(d,0,"px"));this.size=null}xs.prototype.b=function(){return this.u};function ys(a){a.size||(a.size=Pn(a.B,a.L.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.size}xs.prototype.g=function(){var a=ys(this);return this.j?rl(this.L)+a["max-content width"]+sl(this.L):pl(this.L)+a["max-content height"]+ql(this.L)};
xs.prototype.h=function(){var a=ys(this);return this.j?rl(this.L)+a["min-content width"]+sl(this.L):pl(this.L)+a["min-content height"]+ql(this.L)};xs.prototype.f=function(){return this.j?rl(this.L)+this.L.width+sl(this.L):pl(this.L)+this.L.height+ql(this.L)};function zs(a){this.j=a}zs.prototype.b=function(){return this.j.some(function(a){return a.b()})};zs.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
zs.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};zs.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function As(a,b,c,d,e,f){xs.call(this,a,b,c,d,e);this.l=f}v(As,xs);As.prototype.b=function(){return!1};As.prototype.g=function(){return this.f()};As.prototype.h=function(){return this.f()};As.prototype.f=function(){return this.j?rl(this.L)+this.l+sl(this.L):pl(this.L)+this.l+ql(this.L)};
function ws(a,b,c,d,e,f){var g=a.f.f,h={},l={},k={},m;for(m in b){var p=ns[m];if(p){var q=b[m],r=a.sa[m],z=new xs(q,r.style,c,g,f);h[p.Ba]=q;l[p.Ba]=r;k[p.Ba]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.ta.evaluate(e);var u=Bs(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.ta);b&&(b=b.evaluate(e),u[a]>b&&(b=k[a]=new As(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(u=Bs(k,b),A=!1,["start","center","end"].forEach(function(a){u[a]=H[a]||u[a]}));
var E={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.ta);b&&(b=b.evaluate(e),u[a]<b&&(b=k[a]=new As(h[a],l[a].style,c,g,f,b),E[a]=b.f(),A=!0))});A&&(u=Bs(k,b),["start","center","end"].forEach(function(a){u[a]=E[a]||u[a]}));var K=a+b,I=a+(a+b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(I-b)/2;break;case "end":e=K-b}c?wl(d,e,b-rl(d)-sl(d)):vl(d,e,b-pl(d)-ql(d))}})}
function Bs(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Cs(d,g.length?new zs(g):null,b);g.vb&&(f.center=g.vb);d=g.vb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Cs(c,e,b),c.vb&&(f.start=c.vb),c.ud&&(f.end=c.ud);return f}
function Cs(a,b,c){var d={vb:null,ud:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.vb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.vb=a+(c-b)*(e-a)/(f-b):0<b&&(d.vb=c*a/b)),0<d.vb&&(d.ud=c-d.vb)):0<e?d.vb=c:0<f&&(d.ud=c)}else a.b()?d.vb=Math.max(c-b.f(),0):b.b()&&(d.ud=Math.max(c-a.f(),0));else a?a.b()&&(d.vb=c):b&&b.b()&&(d.ud=c);return d}ts.prototype.dc=function(a,b,c,d,e){ts.hg.dc.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function us(a,b){rq.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Ec=this.Fc=null}v(us,rq);
us.prototype.l=function(a,b){var c=this.I,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);rq.prototype.l.call(this,a,b);d=this.g;c={Fc:this.Fc,Ec:this.Ec,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.u=c;d=d.style;d.width=new G(c.Fc);d.height=new G(c.Ec);d["padding-left"]=new G(c.marginLeft);d["padding-right"]=new G(c.marginRight);d["padding-top"]=new G(c.marginTop);
d["padding-bottom"]=new G(c.marginBottom)};us.prototype.ue=function(){var a=Ds(this,{start:"left",end:"right",ta:"width"});this.Fc=a.Af;this.marginLeft=a.Tf;this.marginRight=a.Sf};us.prototype.ve=function(){var a=Ds(this,{start:"top",end:"bottom",ta:"height"});this.Ec=a.Af;this.marginTop=a.Tf;this.marginBottom=a.Sf};
function Ds(a,b){var c=a.style,d=a.f.f,e=b.start,f=b.end,g=b.ta,h=a.f.C[g].za(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=sq(d,c["padding-"+e],h),q=sq(d,c["padding-"+f],h),r=uq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=uq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),u=B(d,h,y(d,y(d,r,p),y(d,z,q)));l?(u=B(d,u,l),k||m?k?m=B(d,u,k):k=B(d,u,m):m=k=zc(d,u,new Gb(d,.5))):(k||(k=d.b),m||(m=d.b),l=B(d,u,y(d,k,m)));c[e]=new G(k);c[f]=new G(m);c["margin-"+e]=
Zd;c["margin-"+f]=Zd;c["padding-"+e]=new G(p);c["padding-"+f]=new G(q);c["border-"+e+"-width"]=new G(r);c["border-"+f+"-width"]=new G(z);c[g]=new G(l);c["max-"+g]=new G(l);return{Af:B(d,h,y(d,k,m)),Tf:k,Sf:m}}us.prototype.dc=function(a,b,c,d,e){rq.prototype.dc.call(this,a,b,c,d,e);c.N=b.element};function vs(a,b){rq.call(this,a,b);var c=b.u;this.u=ns[c];a.sa[c]=this;this.va=!0}v(vs,rq);n=vs.prototype;
n.dc=function(a,b,c,d,e){var f=b.element;x(f,"display","flex");var g=Eq(this,a,"vertical-align"),h=null;g===D("middle")?h="center":g===D("top")?h="flex-start":g===D("bottom")&&(h="flex-end");h&&(x(f,"flex-flow",this.b?"row":"column"),x(f,"justify-content",h));rq.prototype.dc.call(this,a,b,c,d,e)};
n.Ba=function(a,b){var c=this.style,d=this.f.f,e=a.start,f=a.end,g="left"===e,h=g?b.Fc:b.Ec,l=Y(d,c[a.ta],h),g=g?b.marginLeft:b.marginTop;if("start"===this.u.Ba)c[e]=new G(g);else if(l){var k=sq(d,c["margin-"+e],h),m=sq(d,c["margin-"+f],h),p=sq(d,c["padding-"+e],h),q=sq(d,c["padding-"+f],h),r=uq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=uq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=y(d,l,y(d,y(d,p,q),y(d,y(d,r,f),y(d,k,m))));switch(this.u.Ba){case "center":c[e]=new G(y(d,
g,Ac(d,B(d,h,l),new Gb(d,2))));break;case "end":c[e]=new G(B(d,y(d,g,h),l))}}};
function Es(a,b,c){function d(a){if(u)return u;u={ta:z?z.evaluate(a):null,nb:l?l.evaluate(a):null,ob:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b&&(c+=b.evaluate(a))});(null===u.nb||null===u.ob)&&c+u.ta+u.nb+u.ob>b&&(null===u.nb&&(u.nb=0),null===u.ob&&(u.kh=0));null!==u.ta&&null!==u.nb&&null!==u.ob&&(u.ob=null);null===u.ta&&null!==u.nb&&null!==u.ob?u.ta=b-c-u.nb-u.ob:null!==u.ta&&null===u.nb&&null!==u.ob?u.nb=b-c-u.ta-u.ob:null!==u.ta&&null!==u.nb&&null===u.ob?u.ob=
b-c-u.ta-u.nb:null===u.ta?(u.nb=u.ob=0,u.ta=b-c):u.nb=u.ob=(b-c-u.ta)/2;return u}var e=a.style;a=a.f.f;var f=b.xe,g=b.Ee;b=b.ta;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=tq(a,e["margin-"+f],h),k=tq(a,e["margin-"+g],h),m=sq(a,e["padding-"+f],h),p=sq(a,e["padding-"+g],h),q=uq(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),r=uq(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),u=null;e[b]=new G(new Ib(a,function(){var a=d(this).ta;return null===a?0:a},b));e["margin-"+
f]=new G(new Ib(a,function(){var a=d(this).nb;return null===a?0:a},"margin-"+f));e["margin-"+g]=new G(new Ib(a,function(){var a=d(this).ob;return null===a?0:a},"margin-"+g));"left"===f?e.left=new G(y(a,c.marginLeft,c.Fc)):"top"===f&&(e.top=new G(y(a,c.marginTop,c.Ec)))}n.ue=function(){var a=this.g.u;this.u.Ta?Es(this,{xe:"right",Ee:"left",ta:"width"},a):this.u.Ua?Es(this,{xe:"left",Ee:"right",ta:"width"},a):this.Ba({start:"left",end:"right",ta:"width"},a)};
n.ve=function(){var a=this.g.u;this.u.Va?Es(this,{xe:"bottom",Ee:"top",ta:"height"},a):this.u.Sa?Es(this,{xe:"top",Ee:"bottom",ta:"height"},a):this.Ba({start:"top",end:"bottom",ta:"height"},a)};n.Id=function(a,b,c,d,e,f,g){rq.prototype.Id.call(this,a,b,c,d,e,f,g);a=c.H;c=this.f.u;d=this.u;d.Ta||d.Ua?d.Va||d.Sa||(d.Ta?a.left[c]=b:d.Ua&&(a.right[c]=b)):d.Va?a.top[c]=b:d.Sa&&(a.bottom[c]=b)};
function Fs(a,b,c,d,e){this.f=a;this.l=b;this.h=c;this.b=d;this.g=e;this.j={};a=this.l;b=new sc(a,"page-number");b=new kc(a,new qc(a,b,new Gb(a,2)),a.b);c=new ac(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===(this.b.G||Yr(this.g))?(a.values["left-page"]=b,b=new ac(a,b),a.values["right-page"]=b):(c=new ac(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Gs(a){var b={};vj(a.f,[],"",b);Fj(a.f);return b}
function Hs(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?""+e.value:Hs(a,e);c.push(d+f+(e.ab||""))}return c.sort().join("^")}function Is(a,b,c){c=c.clone({fc:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=ds(b),e=e.ab;d.width=Uh(a.b,d.width,new V(f.width,e));d.height=Uh(a.b,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.l(a.f,a.g);Uq(c,a.b);return c}
function Js(a){this.b=null;this.h=a}v(Js,W);Js.prototype.apply=function(a){a.Y===this.h&&this.b.apply(a)};Js.prototype.f=function(){return 3};Js.prototype.g=function(a){this.b&&li(a.fd,this.h,this.b);return!0};function Ks(a){this.b=null;this.h=a}v(Ks,W);Ks.prototype.apply=function(a){1===(new sc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Ks.prototype.f=function(){return 2};function Ls(a){this.b=null;this.h=a}v(Ls,W);
Ls.prototype.apply=function(a){(new sc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Ls.prototype.f=function(){return 1};function Ms(a){this.b=null;this.h=a}v(Ms,W);Ms.prototype.apply=function(a){(new sc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Ms.prototype.f=function(){return 1};function Ns(a){this.b=null;this.h=a}v(Ns,W);Ns.prototype.apply=function(a){(new sc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Ns.prototype.f=function(){return 1};
function Os(a){this.b=null;this.h=a}v(Os,W);Os.prototype.apply=function(a){(new sc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Os.prototype.f=function(){return 1};function Ps(a,b){ii.call(this,a,b,null,null,null)}v(Ps,ii);Ps.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.$;ai(b,c,d,a,null,null,null);if(d=d._marginBoxes){var c=Yh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);ai(b,f,d[e],a,null,null,null)}}};
function Qs(a,b,c,d,e){Hj.call(this,a,b,null,c,null,d,!1);this.P=e;this.H=[];this.g="";this.F=[]}v(Qs,Hj);n=Qs.prototype;n.Nc=function(){this.Kb()};n.Nb=function(a,b){if(this.g=b)this.b.push(new Js(b)),this.$+=65536};
n.hd=function(a,b){b&&Hf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.F.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Ks(this.f));this.$+=256;break;case "left":this.b.push(new Ls(this.f));this.$+=1;break;case "right":this.b.push(new Ms(this.f));this.$+=1;break;case "recto":this.b.push(new Ns(this.f));this.$+=1;break;case "verso":this.b.push(new Os(this.f));this.$+=1;break;default:Hf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Rs(a){var b;a.g||a.F.length?b=[a.g].concat(a.F.sort()):b=null;a.H.push({lf:b,$:a.$});a.g="";a.F=[]}n.Lc=function(){Rs(this);Hj.prototype.Lc.call(this)};n.Ha=function(){Rs(this);Hj.prototype.Ha.call(this)};
n.Jb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.H.some(function(a){return!a.lf})){Hj.prototype.Jb.call(this,a,b,c);var d=this.kb[a],e=this.P;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Xh(e[b],a,d)});else if("size"===a){var f=e[""];this.H.forEach(function(b){var c=new V(d.value,d.ab+b.$);b=b.lf?b.lf.join(""):"";var g=e[b];g?(c=(b=g[a])?Uh(null,c,b):c,Xh(g,a,c)):(g=e[b]={},Xh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Xh(g,a,f[a])},this))},this)}}};
n.Of=function(a){li(this.l.fd,"*",a)};n.Rf=function(a){return new Ps(this.kb,a)};n.Le=function(a){var b=Yh(this.kb,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Df(this.na,new Ss(this.f,this.na,this.B,c))};function Ss(a,b,c,d){Ef.call(this,a,b,!1);this.g=c;this.b=d}v(Ss,Ff);Ss.prototype.Ib=function(a,b,c){Bh(this.g,a,b,c,this)};Ss.prototype.bd=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Ss.prototype.$d=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Ss.prototype.Jb=function(a,b,c){Xh(this.b,a,new V(b,c?Af(this):Bf(this)))};function Ts(a){if(1>=a.length)return!1;var b=a[a.length-1].h;return a.slice(0,a.length-1).every(function(a){return b>a.h})}function Us(a,b){a.b?a.width=b:a.height=b}function Vs(a){return a.b?a.width:a.height}function Ws(a,b){this.dd=a;this.Mc=b}function Xs(a,b,c){this.b=a;this.F=b;this.B=c;this.f=Vs(a)}
function Ys(a,b){var c=L("ColumnBalancer#balanceColumns");a.u(b);Zs(a,b);zl(a.b);var d=[$s(a,b)];Ce(function(b){a.l(d)?(a.C(d),a.F().then(function(c){Zs(a,c);zl(a.b);c?(d.push($s(a,c)),P(b)):Q(b)})):Q(b)}).then(function(){var b=d.reduce(function(a,b){return b.Mc<a.Mc?b:a},d[0]);at(a,b.dd);Us(a.b,a.f);O(c,b.dd)});return c.result()}function $s(a,b){var c=a.j(b);return new Ws(b,c)}Xs.prototype.u=function(){};function Zs(a,b){var c=En(a.B);b&&(b.og=c)}
function at(a,b){var c=a.b.element;b.Ab.forEach(function(a){c.appendChild(a.element)});Fn(a.B,b.og)}function bt(a){var b=a[a.length-1];if(!b.Mc||(a=a[a.length-2])&&b.Mc>=a.Mc)return!1;a=b.dd.Ab;b=Math.max.apply(null,a.map(function(a){return a.h}));a=Math.max.apply(null,a.map(function(a){return $n(a.l)}));return b>a+1}function ct(a,b){var c=Math.max.apply(null,a[a.length-1].dd.Ab.map(function(a){return isNaN(a.ef)?a.h:a.h-a.ef+1}))-1;c<Vs(b)?Us(b,c):Us(b,Vs(b)-1)}
function dt(a,b,c,d){Xs.call(this,c,a,b);this.G=d;this.h=null;this.g=!1}v(dt,Xs);dt.prototype.u=function(a){var b=a.Ab.reduce(function(a,b){return a+b.h},0);Us(this.b,b/this.G);this.h=a.position};function et(a,b){return a.h?nl(a.h,b):!b}dt.prototype.j=function(a){if(!et(this,a.position))return Infinity;a=a.Ab;return Ts(a)?Infinity:Math.max.apply(null,a.map(function(a){return a.h}))};
dt.prototype.l=function(a){if(1===a.length)return!0;if(this.g)return bt(a);a=a[a.length-1];return et(this,a.dd.position)&&!Ts(a.dd.Ab)?this.g=!0:Vs(this.b)<this.f};dt.prototype.C=function(a){this.g?ct(a,this.b):Us(this.b,Math.min(this.f,Vs(this.b)+.1*this.f))};function ft(a,b,c){Xs.call(this,c,a,b)}v(ft,Xs);ft.prototype.j=function(a){if(a.Ab.every(function(a){return!a.h}))return Infinity;a=a.Ab.filter(function(a){return!a.g}).map(function(a){return a.h});return gt(a)};ft.prototype.l=function(a){return bt(a)};
ft.prototype.C=function(a){ct(a,this.b)};function ht(a,b,c,d,e,f,g){if(b===Wc)return null;f=f[f.length-1];f=!(!f||!f.g);return!g.b.length||f?new dt(c,d,e,a):b===Yc?new ft(c,d,e):null};var it=new Ee(function(){var a=L("uaStylesheetBase");Ch.get().then(function(b){var c=Aa("user-agent-base.css",za);b=new Hj(null,null,null,null,null,b,!0);b.Oc("UA");Gj=b.l;gg(c,b,null,null).La(a)});return a.result()},"uaStylesheetBaseFetcher");
function jt(a,b,c,d,e,f,g,h,l,k){this.j=a;this.f=b;this.b=c;this.g=d;this.H=e;this.C=f;this.B=a.P;this.F=g;this.h=h;this.u=l;this.G=k;this.l=a.l;Kb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.pa:null:null;var d;d=b.b[a];if(d=kt(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].pa.f<=this.C:!1;return d&&!!c&&!lt(this,c)});Jb(this.b,new Ib(this.b,function(){return this.ga+this.b.page},"page-number"))}
function mt(a,b,c,d,e){if(a.u.length){var f=new Nb(0,b,c,d);a=a.u;for(var g={},h=0;h<a.length;h++)ai(f,g,a[h],0,null,null,null);h=g.width;a=g.height;var l=g["text-zoom"];if(h&&a||l)if(g=Lb.em,(l?l.evaluate(f,"text-zoom"):null)===Hd&&(l=g/d,d=g,b*=l,c*=l),h&&a&&(h=Sc(h.evaluate(f,"width"),f),f=Sc(a.evaluate(f,"height"),f),0<h&&0<f))return{width:e&&e.sb?2*(h+e.vc):h,height:f,fontSize:d}}return{width:b,height:c,fontSize:d}}
function nt(a,b,c,d,e,f,g,h,l,k,m,p){Nb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ba=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.B=this.b=this.I=this.f=this.F=null;this.C=0;this.xb=f;this.j=new rm(this.style.B);this.va={};this.Y=null;this.h=m;this.Eb=new an(null,null,null,null,null,null,null);this.X={};this.G=p||null;this.ib=g;this.wb=h;this.ga=l;this.qb=k;for(var q in a.h)(b=a.h[q]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Uc?this.l[q]=!0:delete this.l[q]);
this.Ca={};this.ra=this.ha=0}v(nt,Nb);
function ot(a){var b=L("StyleInstance.init"),c=new Op(a.h,a.ba.url),d=new Pp(a.h,a.ba.url,a.style.f,a.style.b);a.f=new Zl(a.ba,a.style.g,a.style.f,a,a.l,a.style.l,c,d);d.h=a.f;im(a.f,a);a.I={};a.I[a.ba.url]=a.f;var e=fm(a.f);a.G||(a.G=Yr(e));a.F=new Vq(a.style.H);c=new pj(a.style.g,a,c,d);a.F.l(c,e);Uq(a.F,a);a.Y=new Fs(c,a.style.b,a.F,a,e);e=[];c=t(a.style.C);for(d=c.next();!d.done;d=c.next())if(d=d.value,!d.ia||d.ia.evaluate(a))d=om(d.wc,a),d=new pm(d),e.push(d);xm(a.xb,e,a.j).La(b);var f=a.style.G;
Object.keys(f).forEach(function(a){var b=es(ds(f[a]),this);this.Ca[a]={width:b.cc+2*b.ke,height:b.bc+2*b.ke}},a);return b.result()}function jm(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new kl,a.b[b.b]=c),c.b.push(new jl(new hl({oa:[{node:b.element,hb:Tk,ua:null,Ga:null,Da:null,Ra:0}],ma:0,J:!1,Oa:null}),b))}
function pt(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].b.f,f=e.oa[0].node,g=e.ma,h=e.J,l=0;f.ownerDocument!=a.ba.b;)l++,f=e.oa[l].node,h=!1,g=0;e=fk(a.ba,f,g,h);e<c&&(c=e)}return c}
function qt(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.P=e;for(var g=0;null!=f.P&&(g+=5E3,gm(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=pt(a,f),f<d&&(d=f))}return d}function kt(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new sc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function rt(a,b){var c=a.b,d=qt(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.children,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.f.fc){var h=1,l=Eq(f,a,"utilization");l&&l.cf()&&(h=l.K);var l=Pb(a,"em",!1),k=a.cc()*a.bc();a.C=gm(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=void 0;for(l in c.b)if((k=c.b[l])&&0<k.b.length){var m=k.b[0].pa;if(pt(h,k)===m.f){a:switch(m=k.g,m){case "left":case "right":case "recto":case "verso":break a;default:m=null}k.g=zm(Ql(m,k.b[0].pa.g))}}a.B=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(var m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.pa.tb&&q.pa.f<h.C&&(q.pa.tb=l)}Ob(a,a.style.b);h=Eq(f,a,"enabled");if(!h||h===Vd){c=a;w.debug("Location - page",c.b.page);w.debug("  current:",d);w.debug("  lookup:",c.C);d=void 0;for(d in c.b.b)for(e=t(c.b.b[d].b),g=e.next();!g.done;g=e.next())w.debug("  Chunk",d+":",g.value.pa.f);d=a.Y;e=f;f=b;c=e.f;Object.keys(f).length?(e=c,g=Hs(d,f),e=e.j+"^"+g,g=d.j[e],g||("background-host"===c.fc?(c=
d,f=(new ps(c.l,c.h.f,f)).h(c.h),f.l(c.f,c.g),Uq(f,c.b),g=f):g=Is(d,f,c),d.j[e]=g),f=g.f,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function lt(a,b){var c=a.B.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Xa(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.B.b[d],g=pt(a,d);return c<g?!1:g<c?!0:!kt(a,d.g)}return!1}function st(a,b,c){a=a.b.f[c];a.D||(a.D=new to(null));b.ff=a.D}
function tt(a){var b=a.l,c=un(b),d=L("layoutDeferredPageFloats"),e=!1,f=0;Ce(function(d){if(f===c.length)Q(d);else{var g=c[f++],l=g.ja,k=jn(l),m=k.rf(l,b);m&&Zm(m,l)?P(d):kn(b,l)||wn(b,l)?(vn(b,g),Q(d)):Vo(a,g,k,null,m).then(function(a){a?(a=Gn(b.parent))?Q(d):(Gn(b)&&!a&&(e=!0,b.Kc=!1),P(d)):Q(d)})}}).then(function(){e&&mn(b);O(d,!0)});return d.result()}
function ut(a,b,c){var d=a.b.b[c];if(!d||!kt(a,d.g))return M(!0);d.g="any";st(a,b,c);To(b);a.l[c]&&0<b.Eb.length&&(b.Fb=!1);var e=L("layoutColumn");tt(b).then(function(){if(Gn(b.l))O(e,!0);else{var f=[],g=[],h=!0;Ce(function(e){if(!qn(b.l,c))for(var k={};0<d.b.length-g.length;){for(k.index=0;g.includes(k.index);)k.index++;k.selected=d.b[k.index];if(k.selected.pa.f>a.C||lt(a,k.selected.pa))break;for(var l=k.index+1;l<d.b.length;l++)if(!g.includes(l)){var p=d.b[l];if(p.pa.f>a.C||lt(a,p.pa))break;Mk(p.pa,
k.selected.pa)&&(k.selected=p,k.index=l)}k.pa=k.selected.pa;k.Ka=!0;Jm(b,k.selected.b,h,d.f).then(function(a){return function(c){if(Gn(b.l))Q(e);else if(h=!1,a.selected.pa.u&&(null===c||a.pa.h)&&f.push(a.index),a.pa.h)g.push(a.index),Q(e);else{var k=!!c||!!b.g,l;0<xn(b.l).length&&b.wb?c?(l=c.clone(),l.f=b.wb):l=new hl(b.wb):l=null;if(b.g&&l)a.selected.b=l,d.f=b.g,b.g=null;else{g.push(a.index);if(c||l)a.selected.b=c||l,f.push(a.index);b.g&&(d.g=zm(b.g))}k?Q(e):(b.Fb=!1,a.Ka?a.Ka=!1:P(e))}}}(k));if(k.Ka){k.Ka=
!1;return}k={selected:k.selected,pa:k.pa,index:k.index,Ka:k.Ka}}Q(e)}).then(function(){if(!Gn(b.l)){d.b=d.b.filter(function(a,b){return f.includes(b)||!g.includes(b)});"column"===d.f&&(d.f=null);Ep(b);var a=Tn(b.l);Qo(b,a)}O(e,!0)})}});return e.result()}
function vt(a,b,c,d,e,f,g,h,l,k,m,p,q,r,z){var u=b.b?b.j&&b.N:b.h&&b.P,A=f.element,H=new an(l,"column",null,h,null,null,null),E=a.b.clone(),K=L("createAndLayoutColumn"),I;Ce(function(b){var K=new jo([new eq(a.h,a.b.page-1)].concat(Xn(H)));if(1<k){var ja=a.viewport.b.createElement("div");x(ja,"position","absolute");A.appendChild(ja);I=new Hm(ja,r,a.g,K,H);I.Fb=z;I.b=f.b;I.Rb=f.Rb;I.Jd=f.Jd;f.b?(K=g*(p+m)+f.I,wl(I,f.H,f.width),vl(I,K,p)):(K=g*(p+m)+f.H,vl(I,f.I,f.height),wl(I,K,p));I.F=c;I.G=d}else I=
new Hm(A,r,a.g,K,H),ul(I,f);I.qb=u?[]:e.concat();I.Qb=q;en(H,I);0<=I.width?ut(a,I,h).then(function(){Gn(H)||Cn(H);Gn(I.l)&&!Gn(l)?(I.l.Kc=!1,a.b=E.clone(),I.element!==A&&A.removeChild(I.element),P(b)):Q(b)}):(Cn(H),Q(b))}).then(function(){O(K,I)});return K.result()}function wt(a,b,c,d,e){var f=Eq(c,a,"writing-mode")||null;a=Eq(c,a,"direction")||null;return new an(b,"region",d,e,null,f,a)}
function xt(a,b,c,d,e,f,g,h,l,k){function m(){p.b=q.clone();return yt(p,b,c,d,e,f,g,r,h,l,k,z).fa(function(a){return a?M({Ab:a,position:p.b}):M(null)})}var p=a,q=p.b.clone(),r=wt(p,g,c,h,l),z=!0;return m().fa(function(a){if(!a)return M(null);if(1>=k)return M(a.Ab);var b=Eq(c,p,"column-fill")||Xc,b=ht(k,b,m,r,h,a.Ab,p.b.b[l]);if(!b)return M(a.Ab);z=!1;g.g=!0;r.g=!0;return Ys(b,a).fa(function(a){g.g=!1;g.Kc=!1;r.g=!1;p.b=a.position;return M(a.Ab)})})}
function yt(a,b,c,d,e,f,g,h,l,k,m,p){var q=L("layoutFlowColumns"),r=a.b.clone(),z=Z(c,a,"column-gap"),u=1<m?Z(c,a,"column-width"):l.width,A=Dq(c,a),H=Eq(c,a,"shape-inside"),E=Og(H,0,0,l.width,l.height,a),K=new nr(k,a,a.viewport,a.f,A,a.ba,a.j,a.style.F,a,b,a.ib,a.wb,a.qb),I=0,ja=null,Ca=[];Ce(function(b){vt(a,c,d,e,f,l,I++,k,h,m,z,u,E,K,p).then(function(c){Gn(g)?(Ca=null,Q(b)):((c.g&&"column"!==c.g||I===m)&&!Gn(h)&&Cn(h),Gn(h)?(I=0,a.b=r.clone(),h.Kc=!1,h.g?(Ca=null,Q(b)):P(b)):(ja=c,Ca[I-1]=ja,ja.g&&
"column"!=ja.g&&(I=m,"region"!=ja.g&&(a.X[k]=!0)),I<m?P(b):Q(b)))})}).then(function(){O(q,Ca)});return q.result()}
function zt(a,b,c,d,e,f,g,h){xq(c);var l=Eq(c,a,"enabled");if(l&&l!==Vd)return M(!0);var k=L("layoutContainer"),m=Eq(c,a,"wrap-flow")===Wc,l=Eq(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=Eq(c,a,"position");x(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new ol(p);r.b=c.b;r.qb=g;c.dc(a,r,b,a.j,a.g);r.F=e;r.G=f;e+=r.left+r.marginLeft+r.Y;f+=r.top+r.marginTop+r.ga;(c instanceof us||c instanceof nq&&!(c instanceof ts))&&en(h,r);var z=!1;if(l&&l.Pf())if(a.X[l.toString()])Gn(h)||
c.Id(a,r,b,null,1,a.g,a.j),l=M(!0);else{var u=L("layoutContainer.inner"),A=l.toString(),H=Z(c,a,"column-count");xt(a,b,c,e,f,g,h,r,A,H).then(function(d){if(!Gn(h)){var e=d[0];e.element===p&&(r=e);r.h=Math.max.apply(null,d.map(function(a){return a.h}));c.Id(a,r,b,e,H,a.g,a.j);(d=a.b.b[A])&&"region"===d.f&&(d.f=null)}O(u,!0)});l=u.result()}else{if((l=Eq(c,a,"content"))&&El(l)){q="span";l.url&&(q="img");var E=a.viewport.b.createElement(q);l.ca(new Dl(E,a,l,cq(a.h)));p.appendChild(E);"img"==q&&Tq(c,a,
E,a.j);Sq(c,a,r,a.j)}else c.va&&(d.removeChild(p),z=!0);z||c.Id(a,r,b,null,1,a.g,a.j);l=M(!0)}l.then(function(){if(Gn(h))O(k,!0);else{if(!c.h||0<Math.floor(r.h)){if(!z&&!m){var l=Eq(c,a,"shape-outside"),l=Bl(r,l,a);g.push(l)}}else if(!c.children.length){d.removeChild(p);O(k,!0);return}var q=c.children.length-1;Be(function(){for(;0<=q;){var d=c.children[q--],d=zt(a,b,d,p,e,f,g,h);if(d.Wa())return d.fa(function(){return M(!Gn(h))});if(Gn(h))break}return M(!1)}).then(function(){O(k,!0)})}});return k.result()}
function At(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.pa.tb&&f.pa.tb+f.pa.l-1<=b&&d.b.splice(e,1)}}function Bt(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function Ct(a,b,c){a.X={};c?(a.b=c.clone(),bm(a.f,c.g)):(a.b=new ml,bm(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;Ob(a,a.style.b);a.B=c.clone();var d=Gs(a.Y),e=rt(a,d);if(!e)return M(null);Dk(b,e.f.b.width.value===Xd);Ek(b,e.f.b.height.value===Yd);a.h.j=b;Yp(a.h,d,a);var f=es(ds(d),a);Dt(a,f,b);ls(d,f,b,a);var g=f.Ub+f.Tb,d=Eq(e,a,"writing-mode")||pd,f=Eq(e,a,"direction")||zd,h=new an(a.Eb,"page",null,null,null,d,f),l=L("layoutNextPage");Ce(function(c){zt(a,b,e,b.g,g,g+1,[],h).then(function(){Gn(h)||
Cn(h);Gn(h)?(a.b=a.B.clone(),h.Kc=!1,P(c)):Q(c)})}).then(function(){e.ga(a,b,a.g);var d=new sc(e.f.f,"left-page");b.l=d.evaluate(a)?"left":"right";At(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&kt(a,d)||(b.f=null)});a.b=a.B=null;c.g=a.f.b;Gk(b,a.style.j.N[a.ba.url],a.g);Bt(a,c)&&(c=null);O(l,c)});return l.result()}
function Dt(a,b,c){a.P=b.cc;a.N=b.bc;a.ra=b.cc+2*b.ke;a.ha=b.bc+2*b.ke;c.L.style.width=a.ra+"px";c.L.style.height=a.ha+"px";c.g.style.left=b.Ub+"px";c.g.style.right=b.Ub+"px";c.g.style.top=b.Ub+"px";c.g.style.bottom=b.Ub+"px";c.g.style.padding=b.Tb+"px";c.g.style.paddingTop=b.Tb+1+"px"}function Et(a,b,c,d){Hj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.F=!1}v(Et,Hj);n=Et.prototype;n.Xd=function(){};
n.Wd=function(a,b,c){a=new mq(this.g.u,a,b,c,this.g.G,this.ia,Bf(this.na));Df(this.g,new $q(a.f,this.g,a,this.B))};n.zc=function(a){a=a.Gc;this.ia&&(a=yc(this.f,this.ia,a));Df(this.g,new Et(this.g,a,this,this.G))};n.Td=function(){Df(this.g,new Nj(this.f,this.na))};n.Vd=function(){var a={};this.g.B.push({wc:a,ia:this.ia});Df(this.g,new Oj(this.f,this.na,null,a,this.g.h))};n.Ud=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);Df(this.g,new Oj(this.f,this.na,null,b,this.g.h))};
n.Zd=function(){var a={};this.g.H.push(a);Df(this.g,new Oj(this.f,this.na,this.ia,a,this.g.h))};n.md=function(a){var b=this.g.C;if(a){var c=Yh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Df(this.g,new Oj(this.f,this.na,null,b,this.g.h))};n.Yd=function(){this.F=!0;this.Kb()};n.Nc=function(){var a=new Qs(this.g.u,this.g,this,this.B,this.g.F);Df(this.g,a);a.Nc()};
n.Ha=function(){Hj.prototype.Ha.call(this);if(this.F){this.F=!1;var a="R"+this.g.N++,b=D(a),c;this.ia?c=new Th(b,0,this.ia):c=new V(b,0);$h(this.kb,"region-id").push(c);this.Xb();a=new Et(this.g,this.ia,this,a);Df(this.g,a);a.Ha()}};
function Ft(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Gt(a){Cf.call(this);this.h=a;this.j=new Fb(null);this.u=new Fb(this.j);this.G=new jq(this.j);this.I=new Et(this,null,null,null);this.N=0;this.B=[];this.C={};this.l={};this.H=[];this.F={};this.b=this.I}v(Gt,Cf);
Gt.prototype.error=function(a){w.b("CSS parser:",a)};function Ht(a,b){return It(b,a)}function Jt(a){vf.call(this,Ht,"document");this.P=a;this.H={};this.u={};this.f={};this.N={};this.l=null;this.b=[];this.I=!1}v(Jt,vf);function Kt(a,b,c){Lt(a,b,c);var d=Aa("user-agent.xml",za),e=L("OPSDocStore.init");Ch.get().then(function(b){a.l=b;it.get().then(function(){a.load(d).then(function(){a.I=!0;O(e,!0)})})});return e.result()}function Lt(a,b,c){a.b.splice(0);b&&b.forEach(a.X,a);c&&c.forEach(a.Y,a)}
Jt.prototype.X=function(a){var b=a.url;b&&(b=Aa(b,ya));this.b.push({url:b,text:a.text,mb:"Author",Ma:null,media:null})};Jt.prototype.Y=function(a){var b=a.url;b&&(b=Aa(b,ya));this.b.push({url:b,text:a.text,mb:"User",Ma:null,media:null})};
function It(a,b){var c=L("OPSDocStore.load"),d=b.url;nk(b,a).then(function(b){if(b){if(a.I)for(var e=ee("PREPROCESS_SINGLE_DOCUMENT"),g=0;g<e.length;g++)try{e[g](b.b)}catch(u){w.b("Error during single document preprocessing:",u)}for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g<h.length;g++){var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),
l=l.getAttribute("ref");k&&m&&p&&l&&e.push({Bg:k,event:m,action:p,kd:l})}a.N[d]=e;var q=[];q.push({url:Aa("user-agent-page.css",za),text:null,mb:"UA",Ma:null,media:null});if(g=b.l)for(g=g.firstChild;g;g=g.nextSibling)if(1==g.nodeType)if(e=g,h=e.namespaceURI,k=e.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:e.textContent,mb:"Author",Ma:null,media:null});else if("link"==k){if(m=e.getAttribute("rel"),h=e.getAttribute("class"),k=e.getAttribute("media"),"stylesheet"==m||
"alternate stylesheet"==m&&h)m=e.getAttribute("href"),m=Aa(m,d),e=e.getAttribute("title"),q.push({url:m,text:null,Ma:e?h:null,media:k,mb:"Author"})}else"meta"==k&&"viewport"==e.getAttribute("name")&&q.push({url:d,text:Ft(e),mb:"Author",Ma:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==e.getAttribute("type")&&q.push({url:d,text:e.textContent,mb:"Author",Ma:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=e.getElementsByTagName("name")[0])&&
"stylesheet"===h.textContent&&(e=e.getElementsByTagName("value")[0])&&(m=Aa(e.textContent,d),q.push({url:m,text:null,Ma:null,media:null,mb:"Author"}));for(g=0;g<a.b.length;g++)q.push(a.b[g]);for(var r="",g=0;g<q.length;g++)r+=q[g].url,r+="^",q[g].text&&(r+=q[g].text),r+="^";var z=a.H[r];z?(a.f[d]=z,O(c,b)):(g=a.u[r],g||(g=new Ee(function(){var b=L("fetchStylesheet"),c=0,d=new Gt(a.l);Be(function(){if(c<q.length){var a=q[c++];d.Oc(a.mb);return null!==a.text?hg(a.text,d,a.url,a.Ma,a.media).Bc(!0):gg(a.url,
d,a.Ma,a.media)}return M(!1)}).then(function(){z=new jt(a,d.j,d.u,d.I.l,d.G,d.B,d.C,d.l,d.H,d.F);a.H[r]=z;delete a.u[r];O(b,z)});return b.result()},"FetchStylesheet "+d),a.u[r]=g,g.start()),g.get().then(function(e){a.f[d]=e;O(c,b)}))}else O(c,null)});return c.result()};function Mt(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Nt(a){var b=new Pa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Mt(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Ot(a){var b=Nt(a);a=[];for(var b=t(b),c=b.next();!c.done;c=b.next())c=c.value,a.push(c>>>24&255,c>>>16&255,c>>>8&255,c&255);return a}
function Pt(a){a=Nt(a);for(var b=new Pa,c=0;c<a.length;c++)b.append(Mt(a[c]));a=b.toString();b=new Pa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Qt(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.Z=xb(f);this.u=g;this.j=h;this.h=l;this.g=k;this.fb=this.page=null}function Rt(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Na(d,"height","auto")&&(x(d,"height","auto"),Rt(a,d,c));"absolute"==Na(d,"position","static")&&(x(d,"position","relative"),Rt(a,d,c))}}
function St(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Qt.prototype.Ae=function(a){var b=this.u.Ae(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",x(e,"cursor","pointer"),e.addEventListener("click",St,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",x(e,"margin-left","-1em"),x(e,"display","inline-block"),x(e,"width","1em"),x(e,"text-align","left"),x(e,"cursor","default"),x(e,"font-family","Menlo,sans-serif"),g.appendChild(e),x(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||x(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return M(g)}};
Qt.prototype.Sd=function(a,b,c,d,e){if(this.page)return M(this.page);var f=this,g=L("showTOC"),h=new Ck(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=mt(k,c,1E5,e);b=new Wr(b.window,l.fontSize,b.root,l.width,l.height);var p=new nt(k,d,f.lang,b,f.f,f.l,f.Ae(d),f.j,0,f.h,f.g);f.fb=p;p.Z=f.Z;ot(p).then(function(){Ct(p,h,null).then(function(){Rt(f,a,2);O(g,h)})})});return g.result()};
Qt.prototype.Ld=function(){if(this.page){var a=this.page;this.fb=this.page=null;x(a.L,"visibility","none");var b=a.L.parentNode;b&&b.removeChild(a.L)}};Qt.prototype.df=function(){return!!this.page};function Tt(){Jt.call(this,Ut(this));this.g=new vf(nk,"document");this.F=new vf(xf,"text");this.G={};this.ha={};this.B={};this.C={}}v(Tt,Jt);function Ut(a){return function(b){return a.B[b]}}
function Vt(a,b,c){var d=L("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.F.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=wk(ck(ck(ck(new dk([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");f=t(f);for(var g=f.next();!g.done;g=f.next())if(g=g.value){Wt(a,b,g,c).La(d);return}O(d,null)}else w.error("Received an empty response for EPUB container.xml "+
e+". This may be caused by the server not allowing cross origin requests.")});return d.result()}
function Wt(a,b,c,d){var e=b+c,f=a.G[e];if(f)return M(f);var g=L("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.F.load(b+"?r=list"):M(null)).then(function(d){f=new Xt(a,b);Yt(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.ha[b]=f;O(g,f)})})}):w.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return g.result()}
function Zt(a,b,c){var d=L("EPUBDocStore.load");b=xa(b);(a.C[b]=It(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Rd:null})).La(d);return d.result()}
Tt.prototype.load=function(a){var b=xa(a);if(a=this.C[b])return a.Wa()?a:M(a.get());var c=L("EPUBDocStore.load");a=Tt.hg.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):w.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return c.result()};function $t(){this.id=null;this.src="";this.h=this.f=null;this.S=-1;this.l=0;this.u=null;this.b=this.g=0;this.xc=this.tb=null;this.j=$a}
function au(a){return a.id}function bu(a){var b=Ot(a);return function(a){var c=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));uf(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}O(c,tf([a,f]))});return c.result()}}
var cu={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},du=cu.dcterms+"language",eu=cu.dcterms+"title";
function fu(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==eu&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=du&&b&&(f=(h[du]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[du]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function gu(a,b){function c(a){for(var b in a){var d=a[b];d.sort(fu(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return cb(a,function(a){return bb(a,function(a){var b={v:a.value,o:a.order};a.lh&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:du,value:a.lang,lang:null,id:null,Je:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=ab(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in cu)f[g]=cu[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=cu;var h=1;g=uk(vk(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Je:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:cu.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Je:null,scheme:null};return null});var l=ab(g,function(a){return a.Je});g=d(ab(g,function(a){return a.Je?null:a.name}));var k=null;g[du]&&(k=g[du][0].v);c(g);return g}function hu(){var a=window.MathJax;return a?a.Hub:null}var iu={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Xt(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.C=b;this.B=null;this.P={};this.lang=null;this.G=0;this.I={};this.X=this.N=this.Y=null;this.H={};this.F=null;this.u=ju(this);hu()&&(Gh["http://www.w3.org/1998/Math/MathML"]=!0)}
function ju(a){function b(){}b.prototype.Me=function(a,b){return"viv-id-"+Ea(b+(a?"#"+a:""),":")};b.prototype.gc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Me(c,f)}return b};b.prototype.Eg=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Va(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function ku(a,b){return a.C?b.substr(0,a.C.length)==a.C?decodeURI(b.substr(a.C.length)):null:b}
function Yt(a,b,c,d,e){a.g=b;var f=ck(new dk([b.b]),"package"),g=wk(f,"unique-identifier")[0];g&&(g=jk(b,b.url+"#"+g))&&(a.B=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=bb(ck(ck(f,"manifest"),"item").W,function(c){var d=new $t,e=b.url;d.id=c.getAttribute("id");d.src=Aa(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!iu[d.f]&&(h[d.src]=c);!a.N&&d.j.nav&&
(a.N=d);!a.X&&d.j["cover-image"]&&(a.X=d);return d});a.f=Za(a.j,au);a.l=Za(a.j,function(b){return ku(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(iu[g.f]){a.H[l]=g.src;break}g=g.src}a.b=bb(ck(ck(f,"spine"),"itemref").W,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.S=c;return d});if(l=wk(ck(f,"spine"),"toc")[0])a.Y=a.f[l];if(l=wk(ck(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.F=l}var g=c?wk(ck(ck(sk(ck(ck(new dk([c.b]),"encryption"),"EncryptedData"),rk()),"CipherData"),"CipherReference"),"URI"):[],k=ck(ck(f,"bindings"),"mediaType").W;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.P[l]=a.f[m].src)}a.I=gu(ck(f,"metadata"),wk(f,"prefix")[0]);a.I[du]&&(a.lang=a.I[du][0].v);if(!d){if(0<g.length&&a.B)for(d=bu(a.B),c=0;c<g.length;c++)a.h.B[a.C+g[c]]=d;return M(!0)}f=new Pa;k={};if(0<g.length&&a.B)for(l="1040:"+
Pt(a.B),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.l[q];l=null;g&&(g.u=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}lu(a);return sf(e,"","POST",f.toString(),"text/plain")}function lu(a){for(var b=0,c=t(a.b),d=c.next();!d.done;d=c.next()){var d=d.value,e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.G=b}
function mu(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new bk(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new $t;b.S=a.index;b.id="item"+(a.index+1);b.src=a.url;b.tb=a.tb;b.xc=a.xc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Zt(a.h,b[0].url,c):M(null)}
function nu(a,b,c){var d=a.b[b],e=L("getCFI");a.h.load(d.src).then(function(a){var b=hk(a,c),f=null;b&&(a=fk(a,b,0,!1),f=new sb,vb(f,b,c-a),d.h&&vb(f,d.h,0),f=f.toString());O(e,f)});return e.result()}
function ou(a,b){return ke("resolveFragment",function(c){if(b){var d=new sb;tb(d,b);var e;if(a.g){var f=ub(d,a.g.b);if(1!=f.node.nodeType||f.J||!f.kd){O(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){O(c,null);return}e=a.f[h];d=f.kd}else e=a.b[0];a.h.load(e.src).then(function(a){var b=ub(d,a.b);a=fk(a,b.node,b.offset,b.J);O(c,{S:e.S,Na:a,aa:-1})})}else O(c,null)},function(a,d){w.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function pu(a,b){return ke("resolveEPage",function(c){if(0>=b)O(c,{S:0,Na:0,aa:-1});else{var d=Xa(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=gk(a),f=Math.round(a*b/e.b),f==a&&f--);O(c,{S:d,Na:f,aa:-1})})}},function(a,d){w.b(d,"Cannot resolve epage:",b);O(a,null)})}
function qu(a,b){var c=a.b[b.S];if(0>=b.Na)return M(c.g);var d=L("getEPage");a.h.load(c.src).then(function(a){a=gk(a);O(d,c.g+Math.min(a,b.Na)*c.b/a)});return d.result()}function ru(a,b){return{page:a,position:{S:a.S,aa:b,Na:a.offset}}}function su(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.u=e;this.yc=[];this.l=[];this.Z=xb(d);this.h=new Ur(b);this.f=new Wp(a.u)}function tu(a,b){var c=a.yc[b.S];return c?c.Cb[b.aa]:null}n=su.prototype;
n.Zb=function(a){return this.b.F?this.b.F:(a=this.yc[a?a.S:0])?a.fb.G:null};
function uu(a,b,c,d){c.L.style.display="none";c.L.style.visibility="visible";c.L.style.position="";c.L.style.top="";c.L.style.left="";c.L.setAttribute("data-vivliostyle-page-side",c.l);var e=b.Cb[d];c.G=!b.item.S&&!d;b.Cb[d]=c;e?(b.fb.viewport.f.replaceChild(c.L,e.L),eb(e,{type:"replaced",target:null,currentTarget:null,Vf:c})):b.fb.viewport.f.appendChild(c.L);a.u({width:b.fb.ra,height:b.fb.ha},b.fb.Ca,b.item.S,b.fb.ga+d)}
function vu(a,b,c){var d=L("renderSinglePage"),e=wu(a,b,c);Ct(b.fb,e,c).then(function(f){var g=(c=f)?c.page-1:b.gb.length-1;uu(a,b,e,g);$p(a.f,e.S,g);f=null;if(c){var h=b.gb[c.page];b.gb[c.page]=c;h&&b.Cb[c.page]&&(nl(c,h)||(f=vu(a,b,c)))}f||(f=M(!0));f.then(function(){var f=aq(a.f,e),h=0;Ce(function(b){h++;if(h>f.length)Q(b);else{var c=f[h-1];c.Qd=c.Qd.filter(function(a){return!a.ld});c.Qd.length?xu(a,c.S).then(function(d){d?(Zp(a.f,c.Fe),bq(a.f,c.Qd),vu(a,d,d.gb[c.aa]).then(function(c){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=c.Pd.position;d.S===e.S&&d.aa===g&&(e=c.Pd.page);P(b)})):P(b)}):P(b)}}).then(function(){e.B=!c&&b.item.S===a.b.b.length-1;e.B&&dq(a.f,a.viewport);O(d,{Pd:ru(e,g),Wf:c})})})});return d.result()}function yu(a,b){var c=a.aa,d=-1;0>c&&(d=a.Na,c=Xa(b.gb.length,function(a){return qt(b.fb,b.gb[a],!0)>d}),c=c===b.gb.length?b.complete?b.gb.length-1:Number.POSITIVE_INFINITY:c-1);return{S:a.S,aa:c,Na:d}}
function zu(a,b,c){var d=L("findPage");xu(a,b.S).then(function(e){if(e){var f=null,g;Ce(function(d){var h=yu(b,e);g=h.aa;(f=e.Cb[g])?Q(d):e.complete?(g=e.gb.length-1,f=e.Cb[g],Q(d)):c?Au(a,h).then(function(a){a&&(f=a.page);Q(d)}):Ae(100).then(function(){P(d)})}).then(function(){O(d,ru(f,g))})}else O(d,null)});return d.result()}
function Au(a,b){var c=L("renderPage");xu(a,b.S).then(function(d){if(d){var e=yu(b,d),f=e.aa,g=e.Na,h=d.Cb[f];h?O(c,ru(h,f)):Ce(function(b){if(f<d.gb.length)Q(b);else if(d.complete)f=d.gb.length-1,Q(b);else{var c=d.gb[d.gb.length-1];vu(a,d,c).then(function(a){var e=a.Pd.page;(c=a.Wf)?0<=g&&qt(d.fb,c)>g?(h=e,f=d.gb.length-2,Q(b)):P(b):(h=e,f=a.Pd.position.aa,d.complete=!0,Q(b))})}}).then(function(){h=h||d.Cb[f];var b=d.gb[f];h?O(c,ru(h,f)):vu(a,d,b).then(function(a){a.Wf||(d.complete=!0);O(c,a.Pd)})})}else O(c,
null)});return c.result()}n.Ke=function(){return Bu(this,{S:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Na:-1})};function Bu(a,b){var c=L("renderAllPages");b||(b={S:0,aa:0,Na:0});var d=b.S,e=b.aa,f=0,g;Ce(function(c){Au(a,{S:f,aa:f===d?e:Number.POSITIVE_INFINITY,Na:f===d?b.Na:-1}).then(function(a){g=a;++f>d?Q(c):P(c)})}).then(function(){O(c,g)});return c.result()}n.rg=function(){return zu(this,{S:0,aa:0,Na:-1})};n.ug=function(){return zu(this,{S:this.b.b.length-1,aa:Number.POSITIVE_INFINITY,Na:-1})};
n.nextPage=function(a,b){var c=this,d=a.S,e=a.aa,f=L("nextPage");xu(c,d).then(function(a){if(a){if(a.complete&&e==a.gb.length-1){if(d>=c.b.b.length-1){O(f,null);return}d++;e=0}else e++;zu(c,{S:d,aa:e,Na:-1},b).La(f)}else O(f,null)});return f.result()};n.Ie=function(a){var b=a.S;if(a=a.aa)a--;else{if(!b)return M(null);b--;a=Number.POSITIVE_INFINITY}return zu(this,{S:b,aa:a,Na:-1})};function Cu(a,b,c){b="left"===b.l;a="ltr"===a.Zb(c);return!b&&a||b&&!a}
function Du(a,b,c){var d=L("getCurrentSpread"),e=tu(a,b);if(!e)return M({left:null,right:null});var f="left"===e.l;(Cu(a,e,b)?a.Ie(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?O(d,{left:e,right:a}):O(d,{left:a,right:e})});return d.result()}n.Ag=function(a,b){var c=tu(this,a);if(!c)return M(null);var c=Cu(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.fa(function(a){return a?e.nextPage(a.position,!!b):M(null)})};
n.Dg=function(a){var b=tu(this,a);if(!b)return M(null);b=Cu(this,b,a);a=this.Ie(a);if(b){var c=this;return a.fa(function(a){return a?c.Ie(a.position):M(null)})}return a};function Eu(a,b){var c=L("navigateToEPage");pu(a.b,b).then(function(b){b?zu(a,b).La(c):O(c,null)});return c.result()}function Fu(a,b){var c=L("navigateToCFI");ou(a.b,b).then(function(b){b?zu(a,b).La(c):O(c,null)});return c.result()}
function Gu(a,b,c){w.debug("Navigate to",b);var d=ku(a.b,xa(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=ku(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.u.Eg(b);a.b.g?d=ku(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return M(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==ku(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?Fu(a,b.substr(d+1)):M(null);var g=L("navigateTo");xu(a,f.S).then(function(d){var e=jk(d.ba,b);e?zu(a,{S:f.S,aa:-1,Na:ek(d.ba,e)}).La(g):c.S!==f.S?zu(a,{S:f.S,aa:0,Na:-1}).La(g):
O(g,null)});return g.result()}
function wu(a,b,c){var d=b.fb.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";Xj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Ck(e,f);g.S=b.item.S;g.position=c;g.offset=qt(b.fb,c);g.offset||(b=a.b.u.Me("",b.item.src),f.setAttribute("id",b),Fk(g,f,b));d!==a.viewport&&(a=ig(null,new of(Ab(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.u.push(new zk(e,"transform",a)));return g}function Hu(a,b,c,d){var e=hu();if(e){var f=d.ownerDocument,g=f.createElement("span");d.appendChild(g);c=f.importNode(c,!0);Iu(a,c,b);g.appendChild(c);a=e.queue;a.Push(["Typeset",e,g]);var e=L("makeMathJaxView"),h=ue(e);a.Push(function(){h.pb(g)});return e.result()}return M(null)}
function Iu(a,b,c){if(b){if(1===b.nodeType&&"mglyph"===b.tagName)for(var d=t(b.attributes),e=d.next();!e.done;e=d.next())if(e=e.value,"src"===e.name){var f=Aa(e.nodeValue,c.url);e.namespaceURI?b.setAttributeNS(e.namespaceURI,e.name,f):b.setAttribute(e.name,f)}b.firstChild&&Iu(a,b.firstChild,c);b.nextSibling&&Iu(a,b.nextSibling,c)}}
n.Ae=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=Aa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=ku(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.P[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ta(f),l=Ta(g),g=new Pa;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Hu(b,a,c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Hu(b,a,c,d):M(null);return e}};
function xu(a,b){if(b>=a.b.b.length)return M(null);var c=a.yc[b];if(c)return M(c);var d=L("getPageViewItem"),e=a.l[b];if(e){var f=ue(d);e.push(f);return d.result()}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(gk(f)/2700),a.b.G=g.b);var k=h.f[f.url],l=a.Ae(f),p=a.viewport,q=mt(k,p.width,p.height,p.fontSize,a.Z);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new Wr(p.window,q.fontSize,p.root,q.width,q.height);q=a.yc[b-1];null!==
g.tb?q=g.tb-1:(q=q?q.fb.ga+q.Cb.length:0,null!==g.xc&&(q+=g.xc));Xp(a.f,q);var r=new nt(k,f,a.b.lang,p,a.h,a.j,l,a.b.H,q,a.b.u,a.f,a.b.F);r.Z=a.Z;ot(r).then(function(){c={item:g,ba:f,fb:r,gb:[null],Cb:[],complete:!1};a.yc[b]=c;O(d,c);e.forEach(function(a){a.pb(c)})})});return d.result()}function Ju(a){for(var b=t(a.yc),c=b.next();!c.done;c=b.next())(c=c.value)&&c.Cb.splice(0);for(a=a.viewport.root;a.lastChild;)a.removeChild(a.lastChild)}
function Ku(a){return a.yc.some(function(a){return a&&0<a.Cb.length})}
n.Sd=function(){var a=this.b,b=a.N||a.Y;if(!b)return M(null);var c=L("showTOC");this.g||(this.g=new Qt(a.h,b.src,a.lang,this.h,this.j,this.Z,this,a.H,a.u,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.Sd(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return c.result()};n.Ld=function(){this.g&&this.g.Ld()};n.df=function(){return this.g&&this.g.df()};var Lu={Zg:"singlePage",$g:"spread",Pg:"autoSpread"};
function Mu(a,b,c,d){var e=this;this.window=a;this.ae=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);Xj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Pa=c;this.Ca=d;a=a.document;this.sa=new tm(a.head,b);this.B="loading";this.N=[];this.h=null;this.ac=this.Xa=!1;this.f=this.j=this.g=this.C=null;this.fontSize=16;this.zoom=1;this.F=!1;this.X="singlePage";this.ha=!1;this.Ke=!0;this.Z=wb();this.ga=[];this.I=function(){};this.u=function(){};
this.Y=function(){e.Xa=!0;e.I()};this.Ge=this.Ge.bind(this);this.G=function(){};this.H=a.getElementById("vivliostyle-page-rules");this.P=!1;this.l=null;this.ra={loadEPUB:this.lg,loadXML:this.mg,configure:this.Ve,moveTo:this.va,toc:this.Sd};Nu(this)}function Nu(a){wa(1,function(b){Ou(a,{t:"debug",content:b})});wa(2,function(b){Ou(a,{t:"info",content:b})});wa(3,function(b){Ou(a,{t:"warn",content:b})});wa(4,function(b){Ou(a,{t:"error",content:b})})}function Ou(a,b){b.i=a.Pa;a.Ca(b)}
function Pu(a,b){a.B!==b&&(a.B=b,a.ae.setAttribute("data-vivliostyle-viewer-status",b),Ou(a,{t:"readystatechange"}))}n=Mu.prototype;n.lg=function(a){Qu.f("beforeRender");Pu(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadEPUB"),h=this;h.Ve(a).then(function(){var a=new Tt;Kt(a,e,f).then(function(){var e=Aa(b,h.window.location.href);h.N=[e];Vt(a,e,d).then(function(a){h.h=a;Ru(h,c).then(function(){O(g,!0)})})})});return g.result()};
n.mg=function(a){Qu.f("beforeRender");Pu(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadXML"),h=this;h.Ve(a).then(function(){var a=new Tt;Kt(a,e,f).then(function(){var e=b.map(function(a,b){return{url:Aa(a.url,h.window.location.href),index:b,tb:a.tb,xc:a.xc}});h.N=e.map(function(a){return a.url});h.h=new Xt(a,"");mu(h.h,e,c).then(function(){Ru(h,d).then(function(){O(g,!0)})})})});return g.result()};
function Ru(a,b){Su(a);var c;b?c=ou(a.h,b).fa(function(b){a.f=b;return M(!0)}):c=M(!0);return c.fa(function(){Qu.b("beforeRender");return Tu(a)})}function Uu(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d)return c*Lb.ex*a.fontSize/Lb.em;if(d=Lb[d])return c*d}return c}
n.Ve=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.C=null,this.window.addEventListener("resize",this.Y,!1),this.Xa=!0):this.window.removeEventListener("resize",this.Y,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Xa=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Uu(this,b["margin-left"])||0,marginRight:Uu(this,b["margin-right"])||0,marginTop:Uu(this,b["margin-top"])||0,marginBottom:Uu(this,b["margin-bottom"])||
0,width:Uu(this,b.width)||0,height:Uu(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Y,!1),this.C=b,this.Xa=!0);"boolean"==typeof a.hyphenate&&(this.Z.re=a.hyphenate,this.Xa=!0);"boolean"==typeof a.horizontal&&(this.Z.qe=a.horizontal,this.Xa=!0);"boolean"==typeof a.nightMode&&(this.Z.Ce=a.nightMode,this.Xa=!0);"number"==typeof a.lineHeight&&(this.Z.lineHeight=a.lineHeight,this.Xa=!0);"number"==typeof a.columnWidth&&(this.Z.je=a.columnWidth,this.Xa=
!0);"string"==typeof a.fontFamily&&(this.Z.fontFamily=a.fontFamily,this.Xa=!0);"boolean"==typeof a.load&&(this.ha=a.load);"boolean"==typeof a.renderAllPages&&(this.Ke=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ya=a.userAgentRootURL.replace(/resources\/?$/,""),za=a.userAgentRootURL);"string"==typeof a.rootURL&&(ya=a.rootURL,za=ya+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.X&&(this.X=a.pageViewMode,this.Xa=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Z.vc&&
(this.viewport=null,this.Z.vc=a.pageBorder,this.Xa=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.ac=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.F&&(this.F=a.fitToScreen,this.ac=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.Z.mc=a.defaultPaperSize,this.Xa=!0);Vu(this,a);return M(!0)};
function Vu(a,b){ee("CONFIGURATION").forEach(function(c){c=c(b);a.Xa=c.Xa||a.Xa;a.ac=c.ac||a.ac})}n.Ge=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||Wu(this,a.Vf):b===a.target&&Wu(this,a.Vf)};function Xu(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Yu(a){Xu(a,function(b){b.removeEventListener("hyperlink",a.G,!1);b.removeEventListener("replaced",a.Ge,!1)})}
function Zu(a){Yu(a);Xu(a,function(a){x(a.L,"display","none")});a.g=null;a.j=null}function $u(a,b){b.addEventListener("hyperlink",a.G,!1);b.addEventListener("replaced",a.Ge,!1);x(b.L,"visibility","visible");x(b.L,"display","block")}function av(a,b){Zu(a);a.g=b;$u(a,b)}function bv(a){var b=L("reportPosition");nu(a.h,a.f.S,a.f.Na).then(function(c){var d=a.g;(a.ha&&0<d.j.length?Ge(d.j):M(!0)).then(function(){cv(a,d,c).La(b)})});return b.result()}
function dv(a){var b=a.ae;if(a.C){var c=a.C;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Wr(a.window,a.fontSize,b,c.width,c.height)}return new Wr(a.window,a.fontSize,b)}
function ev(a){var b=dv(a),c;a:switch(a.X){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.Z.sb!==c;a.Z.sb=c;a.ae.setAttribute("data-vivliostyle-spread-view",c);if(a.C||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(c=a.b&&Ku(a.b)){a:{c=t(a.b.yc);for(d=c.next();!d.done;d=c.next())if(d=d.value)for(var d=t(d.Cb),e=d.next();!e.done;e=d.next())if(e=e.value,e.F&&
e.C){c=!0;break a}c=!1}c=!c}return c?(a.viewport.width=b.width,a.viewport.height=b.height,a.ac=!0):!1}n.Fg=function(a,b,c,d){this.ga[d]=a;fv(this,b)};function fv(a,b){if(!a.P&&a.H){var c="";Object.keys(b).forEach(function(a){c+="@page "+a+"{margin:0;size:";a=b[a];c+=a.width+"px "+a.height+"px;}"});a.H.textContent=c;a.P=!0}}function gv(a){a.H&&(a.H.textContent="",a.P=!1)}
function Wu(a,b,c){a.ac=!1;Yu(a);if(a.Z.sb)return Du(a.b,a.f,c).fa(function(c){Zu(a);a.j=c;c.left&&($u(a,c.left),c.right||c.left.L.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&($u(a,c.right),c.left||c.right.L.setAttribute("data-vivliostyle-unpaired-page",!0));c=hv(a,c);a.viewport.zoom(c.width,c.height,a.F?iv(a,c):a.zoom);a.g=b;return M(null)});av(a,b);a.viewport.zoom(b.f.width,b.f.height,a.F?iv(a,b.f):a.zoom);a.g=b;return M(null)}
function hv(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.Z.vc);return{width:c,height:d}}var jv={Ug:"fit inside viewport"};function iv(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function kv(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}v(kv,Error);
function Su(a){if(a.l){var b=a.l;le(b,new kv);if(b!==fe&&b.b){b.b.g=!0;var c=new ve(b);b.l="interrupt";b.b=c;b.f.pb(c)}}a.l=null}
function Tu(a){a.Xa=!1;a.ac=!1;if(ev(a))return M(!0);Pu(a,"loading");Su(a);var b=ne(fe.f,function(){return ke("resize",function(c){a.l=b;Qu.f("render (resize)");a.b&&(a.b.Ld(),Ju(a.b));gv(a);a.viewport=dv(a);Xr(a.viewport);a.b=new su(a.h,a.viewport,a.sa,a.Z,a.Fg.bind(a));a.f&&(a.f.aa=-1);Bu(a.b,a.f).then(function(d){a.f=d.position;Wu(a,d.page,!0).then(function(){bv(a).then(function(d){Pu(a,"interactive");(a.Ke?a.b.Ke():M(null)).then(function(){a.l===b&&(a.l=null);Qu.b("render (resize)");Pu(a,"complete");
Ou(a,{t:"loaded"});O(c,d)})})})})},function(a,b){if(b instanceof kv)Qu.b("render (resize)"),w.debug(b.message);else throw b;})});return M(!0)}function cv(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.G,last:b.B};qu(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.G;c&&(e.cfi=c);Ou(a,e);O(d,!0)});return d.result()}Mu.prototype.Zb=function(){return this.b?this.b.Zb(this.f):null};
Mu.prototype.va=function(a){var b=this;"complete"!==this.B&&Pu(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.Z.sb?this.b.Ag:this.b.nextPage;break;case "previous":a=this.Z.sb?this.b.Dg:this.b.Ie;break;case "last":a=this.b.ug;break;case "first":a=this.b.rg;break;default:return M(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return Eu(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return Gu(b.b,
e,b.f)}}else return M(!0);var f=L("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=L("moveTo.showCurrent");c=d.result();Wu(b,a.page).then(function(){bv(b).La(d)})}else c=M(!0);c.then(function(a){"loading"===b.B&&Pu(b,"interactive");O(f,a)})});return f.result()};
Mu.prototype.Sd=function(a){var b=!!a.autohide;a=a.v;var c=this.b.df();if(c){if("show"==a)return M(!0)}else if("hide"==a)return M(!0);if(c)return this.b.Ld(),M(!0);var d=this,e=L("showTOC");this.b.Sd(b).then(function(a){if(a){if(b){var c=function(){d.b.Ld()};a.addEventListener("hyperlink",c,!1);a.L.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.G,!1)}O(e,!0)});return e.result()};
function lv(a,b){var c=b.a||"";return ke("runCommand",function(d){var e=a.ra[c];e?e.call(a,b).then(function(){Ou(a,{t:"done",a:c});O(d,!0)}):(w.error("No such action:",c),O(d,!0))},function(a,b){w.error(b,"Error during action:",c);O(a,!0)})}function mv(a){return"string"==typeof a?JSON.parse(a):a}
function nv(a,b){var c=mv(b),d=null;me(function(){var b=L("commandLoop"),f=fe.f;a.G=function(b){var c="#"===b.href.charAt(0)||a.N.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};ne(f,function(){Ou(a,d);return M(!0)})}};Ce(function(b){if(a.Xa)Tu(a).then(function(){P(b)});else if(a.ac)a.g&&Wu(a,a.g).then(function(){P(b)});else if(c){var e=c;c=null;lv(a,e).then(function(){P(b)})}else e=L("waitForCommand"),d=ue(e,self),e.result().then(function(){P(b)})}).La(b);
return b.result()});a.I=function(){var a=d;a&&(d=null,a.pb())};a.u=function(b){if(c)return!1;c=mv(b);a.I();return!0};a.window.adapt_command=a.u};function Or(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=ov(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=pv(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=qv(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);rv(a);null!=c&&(a=sv(a,c));return a=tv(a)}
function qv(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=uv(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Or(f[0],f[2]),d=Or(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,r=0,z=0;z<e;z++){for(var u=-z+m;u<=z-p;u+=2){var A=e+u,H;H=u==-z||u!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var E=H-u;H<c&&E<d&&a.charAt(H)==b.charAt(E);)H++,E++;g[A]=H;if(H>c)p+=2;else if(E>d)m+=2;else if(k&&(A=e+l-u,0<=A&&A<f&&-1!=h[A])){var K=c-h[A];if(H>=K){c=vv(a,b,H,E);break a}}}for(u=-z+q;u<=z-r;u+=2){A=e+u;K=u==-z||u!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=K-u;K<c&&H<d&&a.charAt(c-K-1)==b.charAt(d-H-1);)K++,H++;h[A]=K;if(K>c)r+=2;else if(H>d)q+=2;else if(!k&&
(A=e+l-u,0<=A&&A<f&&-1!=g[A]&&(H=g[A],E=e+H-A,K=c-K,H>=K))){c=vv(a,b,H,E);break a}}}c=[[-1,a],[1,b]]}return c}function vv(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Or(a.substring(0,c),b.substring(0,d));e=Or(e,f);return a.concat(e)}function ov(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function pv(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function uv(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=ov(a.substring(c),b.substring(e)),K=pv(a.substring(0,c),b.substring(0,e));f.length<K+m&&(f=b.substring(e-K,e)+b.substring(e,e+m),g=a.substring(0,c-K),h=a.substring(c+m),k=b.substring(0,e-K),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function rv(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=ov(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=pv(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&rv(a)}Or.f=1;Or.b=-1;Or.g=0;
function sv(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),wv(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),wv(d,c,3)):a}
function tv(a){function b(a){return 55296<=a.charCodeAt(a.length-1)&&56319>=a.charCodeAt(a.length-1)}function c(a){return 56320<=a.charCodeAt(0)&&57343>=a.charCodeAt(0)}for(var d=!1,e=2;e<a.length;e+=1)0===a[e-2][0]&&b(a[e-2][1])&&-1===a[e-1][0]&&c(a[e-1][1])&&1===a[e][0]&&c(a[e][1])&&(d=!0,a[e-1][1]=a[e-2][1].slice(-1)+a[e-1][1],a[e][1]=a[e-2][1].slice(-1)+a[e][1],a[e-2][1]=a[e-2][1].slice(0,-1));if(!d)return a;d=[];for(e=0;e<a.length;e+=1)0<a[e][1].length&&d.push(a[e]);return d}
function wv(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Nr(a){return a.reduce(function(a,c){return c[0]===Or.b?a:a+c[1]},"")}function dl(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Or.f:d++;break;case Or.b:d--;e++;break;case Or.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function xv(a,b,c,d,e){Vm.call(this,a,b,"block-end",null,c,e);this.g=d}v(xv,Vm);xv.prototype.Ze=function(a){return!(a instanceof xv)};function yv(a,b,c,d){Ym.call(this,a,"block-end",b,c,d)}v(yv,Ym);yv.prototype.Fa=function(){return Infinity};yv.prototype.f=function(a){return a instanceof xv?!0:this.Fa()<a.Fa()};function zv(a){this.f=a}zv.prototype.b=function(a){a=cl(a);return!Rk(a,this.f.b)};function Av(){}n=Av.prototype;n.zf=function(a){return"footnote"===a.Aa};
n.yf=function(a){return a instanceof xv};n.Ff=function(a,b){var c="region",d=gn(b,c);Dn(gn(b,"page"),d)&&(c="page");d=cl(a);c=new xv(d,c,b.h,a.X,a.N);b.fe(c);return M(c)};n.Gf=function(a,b,c,d){return new yv(a[0].ja.V,a,c,d)};n.rf=function(a,b){return gn(b,a.V).b.filter(function(a){return a instanceof yv})[0]||null};
n.vf=function(a,b,c){a.Uf=!0;a.pe=!1;var d=a.element,e=c.j;b=b.b;var f=c.j.w&&"rtl"===c.j.w.direction,g={},h=e.C._pseudos;b=sr(e,b,f,e.C,g);if(h&&h.before){var l={},k=Er(e,"http://www.w3.org/1999/xhtml","span");lr(k,"before");d.appendChild(k);sr(e,b,f,h.before,l);delete l.content;Hr(e,k,l)}delete g.content;Hr(e,d,g);a.b=b;Kp(a,d);if(e=Nn(c.f,d))a.marginLeft=X(e.marginLeft),a.Y=X(e.borderLeftWidth),a.H=X(e.paddingLeft),a.marginTop=X(e.marginTop),a.ga=X(e.borderTopWidth),a.I=X(e.paddingTop),a.marginRight=
X(e.marginRight),a.Pa=X(e.borderRightWidth),a.X=X(e.paddingRight),a.marginBottom=X(e.marginBottom),a.Ca=X(e.borderBottomWidth),a.P=X(e.paddingBottom);if(c=Nn(c.f,d))a.width=X(c.width),a.height=X(c.height)};n.ig=function(a,b){switch(a.g){case xd:Yn(b,new zv(a),a.V)}};ao.push(new Av);function Bv(a){return a.reduce(function(a,c){return a+c},0)/a.length}function gt(a){var b=Bv(a);return Bv(a.map(function(a){a-=b;return a*a}))};function Cv(a,b){this.g(a,"end",b)}function Dv(a,b){this.g(a,"start",b)}function Ev(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Fv(){}function Gv(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Fv}
Gv.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});w.g(b)};Gv.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Fv};Gv.prototype.B=function(){this.g=Ev;this.registerStartTiming=this.f=Dv;this.registerEndTiming=this.b=Cv};
var Hv={now:Date.now},Qu,Iv=Qu=new Gv(window&&window.performance||Hv);Ev.call(Iv,"load_vivliostyle","start",void 0);na("vivliostyle.profile.profiler",Iv);Gv.prototype.printTimings=Gv.prototype.l;Gv.prototype.disable=Gv.prototype.u;Gv.prototype.enable=Gv.prototype.B;function ro(a){return(a=a.D)&&a instanceof wp?a:null}function Jv(a,b,c){var d=a.b;return d&&!d.tc&&(a=Kv(a,b),a.A)?!d.qc||d.tc?M(!0):Lv(d,d.qc,a,null,c):M(!0)}function Mv(a,b,c){var d=a.b;return d&&(a=Kv(a,b),a.A)?!d.rc||d.uc?M(!0):Lv(d,d.rc,a,a.A.firstChild,c):M(!0)}function Nv(a,b){a&&Ov(a.J?a.parent:a,function(a,d){a instanceof vp||b.B.push(new Pv(d))})}function Ov(a,b){for(var c=a;c;c=c.parent){var d=c.D;d&&d instanceof wp&&!gl(c,d)&&b(d,c)}}
function wp(a,b){this.parent=a;this.j=b;this.b=null}wp.prototype.Re=function(){return"Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)"};wp.prototype.af=function(a,b){return b};function Qv(a,b){var c=Kv(a,b);return c?c.A:null}function Kv(a,b){do if(!gl(b,a)&&b.M===a.j)return b;while(b=b.parent);return null}
function Kr(a,b){a.b||Gp.some(function(b){return b.root===a.j?(a.b=b.elements,!0):!1})||(a.b=new Rv(b,a.j),Gp.push({root:a.j,elements:a.b}))}wp.prototype.Te=function(){};wp.prototype.Se=function(){};var Gp=[];function Rv(a,b){this.N=a;this.qc=this.rc=this.u=this.C=this.l=this.B=null;this.G=this.H=0;this.tc=this.uc=!1;this.Zc=this.le=!0;this.j=!1;this.Y=b;this.I=this.g=null;this.P=[];this.X=[]}function Sv(a,b){a.rc||(a.rc=Sk(b),a.B=b.M,a.C=b.A)}function Tv(a,b){a.qc||(a.qc=Sk(b),a.l=b.M,a.u=b.A)}
function Lv(a,b,c,d,e){var f=c.A,g=c.A.ownerDocument.createElement("div");f.appendChild(g);var h=new Fm(e,g,c),l=h.ya.g;h.ya.g=null;a.h=!0;return Im(h,new hl(b)).fa(function(){a.h=!1;f.removeChild(g);if(f)for(;g.firstChild;){var b=g.firstChild;g.removeChild(b);b.setAttribute("data-adapt-spec","1");d?f.insertBefore(b,d):f.appendChild(b)}h.ya.g=l;return M(!0)})}Rv.prototype.b=function(a){var b=0;if(a&&!this.f(a))return b;if(!this.tc||a&&Uv(this,a))b+=this.G;this.uc||(b+=this.H);return b};
Rv.prototype.F=function(a){var b=0;if(a&&!this.f(a))return b;a&&Uv(this,a)&&(b+=this.G);this.Zc||(b+=this.H);return b};function Uv(a,b){return Vv(b,a.X,function(){return Wv(a.I,b,!1)})}Rv.prototype.f=function(a){var b=this;return Vv(a,this.P,function(){return Wv(b.Y,a,!0)})};function Vv(a,b,c){var d=b.filter(function(b){return b.w.M===a.M&&b.w.J===a.J});if(0<d.length)return d[0].result;c=c(a);b.push({w:a,result:c});return c}
function Wv(a,b,c){for(var d=[];a;a=a.parentNode){if(b.M===a)return b.J;d.push(a)}for(a=b.M;a;a=a.parentNode){var e=d.indexOf(a);if(0<=e)return c?!e:!1;for(e=a;e;e=e.previousElementSibling)if(d.includes(e))return!0}return b.J}function Xv(a){return!a.tc&&a.le&&a.qc||!a.uc&&a.Zc&&a.rc?!0:!1}function Yv(a){this.D=a}Yv.prototype.b=function(){};Yv.prototype.f=function(a){return!!a};
Yv.prototype.g=function(a,b,c,d){(a=this.D.b)&&!a.j&&(a.C&&(a.H=Lp(a.C,c,a.N),a.C=null),a.u&&(a.G=Lp(a.u,c,a.N),a.u=null),a.j=!0);return d};function Zv(a){this.D=a}Zv.prototype.b=function(){};Zv.prototype.f=function(){return!0};Zv.prototype.g=function(a,b,c,d){return d};function $v(a){this.D=a}v($v,Yv);$v.prototype.b=function(a,b){Yv.prototype.b.call(this,a,b);var c=L("BlockLayoutProcessor.doInitialLayout");Cm(new Bm(new aw(a.D),b.j),a).La(c);return c.result()};$v.prototype.f=function(){return!1};
function bw(a){this.D=a}v(bw,Zv);bw.prototype.b=function(a,b){gl(a,this.D)||a.J||b.B.unshift(new Pv(a));return cw(a,b)};function Pv(a){this.w=Kv(a.D,a)}n=Pv.prototype;n.ee=function(a,b){var c=this.w.D.b;return c&&!Mo(this.w.A)&&Xv(c)?b&&!a||a&&a.wa?!1:!0:!0};n.ed=function(){var a=this.w.D.b;return a&&Xv(a)?(!a.tc&&a.le&&a.qc?a.tc=!0:!a.uc&&a.Zc&&a.rc&&(a.uc=!0),!0):!1};n.Vc=function(a,b,c,d){(c=this.w.D.b)&&a&&d.u&&(!b||Uv(c,b))&&(c.tc=!1,c.le=!1)};
n.Ja=function(a,b){var c=this.w.D,d=this.w.D.b;if(!d)return M(!0);var e=this.w;return Mv(c,e,b).fa(function(){return Jv(c,e,b).fa(function(){d.uc=d.tc=!1;d.le=!0;d.Zc=!0;return M(!0)})})};n.me=function(a){return a instanceof Pv?this.w.D===a.w.D:!1};n.oe=function(){return 10};function dw(a){Lm.call(this);this.D=a}v(dw,Lm);dw.prototype.kf=function(a){var b=this.D.b;return gl(a,this.D)||b.j?(gl(a,this.D)||a.J||!b||(b.uc=!1,b.Zc=!1),new bw(this.D)):new $v(this.D)};function aw(a){this.D=a}v(aw,Em);
aw.prototype.sd=function(a){var b=this.D,c=a.w,d=b.b;if(c.parent&&b.j===c.parent.M){switch(c.u){case "header":if(d.rc)c.u="none";else return Sv(d,c),M(!0);break;case "footer":if(d.qc)c.u="none";else return Tv(d,c),M(!0)}d.g||(d.g=c.M)}return Em.prototype.sd.call(this,a)};aw.prototype.kc=function(a){var b=this.D,c=a.w;c.M===b.j&&(b.b.I=a.cd&&a.cd.M,a.Mb=!0);return"header"===c.u||"footer"===c.u?M(!0):Em.prototype.kc.call(this,a)};function ew(){}v(ew,Ip);
ew.prototype.de=function(a,b,c){if(uo(b,a))return Eo(b,a);var d=a.D;return Qv(d,a)?(c&&Nv(a.parent,b),gl(a,d)?Ip.prototype.de.call(this,a,b,c):Mm(new dw(d),a,b)):Go(b,a)};ew.prototype.Ue=function(a){var b=ro(a).b;if(!b)return!1;b.h||b.B!==a.M&&b.l!==a.M||a.A.parentNode.removeChild(a.A);return!1};
function cw(a,b){var c=a.D,d=L("doLayout"),e=Dm(b.j,a,!1);Fo(e,b).then(function(a){var e=a;Ce(function(a){for(var d={};e;){d.Ka=!0;yp(b,e,!1).then(function(d){return function(f){e=f;Gn(b.l)?Q(a):b.g?Q(a):e&&b.u&&e&&e.wa?Q(a):e&&e.J&&e.M==c.j?Q(a):d.Ka?d.Ka=!1:P(a)}}(d));if(d.Ka){d.Ka=!1;return}d={Ka:d.Ka}}Q(a)}).then(function(){O(d,e)})});return d.result()}ew.prototype.Ja=function(a,b,c,d){return Ip.prototype.Ja.call(this,a,b,c,d)};ew.prototype.wd=function(a,b,c,d){Ip.prototype.wd(a,b,c,d)};
function oo(a){for(var b=[],c=a;c;c=c.Ed)c.B.forEach(function(c){if(c instanceof Pv){var d=c.w.D.b;b.push(d)}c instanceof fw&&(d=new gw(c.w,c.f),b.push(d));c instanceof hw&&iw(c,a).forEach(function(a){b.push(a)})});return b}var jw=new ew;de("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof wp&&!(a instanceof vp)?jw:null});function kw(a,b){if(!a||!a.I||a.J||uo(b,a))return M(a);var c=a.I;return lw(c,b,a).fa(function(d){var e=a.A;e.appendChild(d);var f=Lp(d,b,a.b);e.removeChild(d);b.B.push(new fw(a,c,f));return M(a)})}function mw(a,b,c){this.b=a;this.f=b;this.Gb=c}mw.prototype.matches=function(){var a=nw[this.b];return!!a&&null!=a.Ra&&zi(a.Ra,this.f,this.Gb)};function rj(a){this.b=a}rj.prototype.matches=function(){return this.b.some(function(a){return a.matches()})};function sj(a){this.b=a}sj.prototype.matches=function(){return this.b.every(function(a){return a.matches()})};
function qj(a,b){var c=b.split("_");if("NFS"==c[0])return new mw(a,parseInt(c[1],10),parseInt(c[2],10));ra("unknown view condition. condition="+b);return null}function Tj(a,b,c){pr(c,function(c){Vj(a,c,b)})}function pr(a,b){var c=a._viewConditionalStyles;c&&c.forEach(function(a){a.wg.matches()&&b(a.Gg)})}function Ar(a,b,c){var d=nw;if(!d[a]||d[a].ab<=c)d[a]={Ra:b,ab:c}}var nw={};function Jr(a,b){this.b=b;this.M=a}
function lw(a,b,c){var d=c.A.ownerDocument.createElement("div"),e=new Fm(b,d,c),f=e.ya.g;e.ya.g=null;return Im(e,ow(a)).fa(function(){a.b.f["after-if-continues"]=!1;e.ya.g=f;var b=d.firstChild;x(b,"display","block");return M(b)})}function ow(a){var b=jr.createElementNS("http://www.w3.org/1999/xhtml","div");lr(b,"after-if-continues");a=new Xk(a.M,b,null,null,null,3,a.b);return new hl({oa:[{node:b,hb:a.type,ua:a,Ga:null,Da:null}],ma:0,J:!1,Oa:null})}function fw(a,b,c){this.w=a;this.b=b;this.f=c}n=fw.prototype;
n.ee=function(a,b){return b&&!a||a&&a.wa?!1:!0};n.ed=function(){return!1};n.Vc=function(){};n.Ja=function(a,b){var c=this;return(new gw(this.w,this.f)).f(a)?lw(this.b,b,this.w).fa(function(a){c.w.A.appendChild(a);return M(!0)}):M(!0)};n.me=function(a){return a instanceof fw?this.b==a.b:!1};n.oe=function(){return 9};function gw(a,b){this.w=a;this.g=b}gw.prototype.b=function(a){return this.f(a)?this.g:0};gw.prototype.F=function(a){return this.b(a)};
gw.prototype.f=function(a){if(!a)return!1;var b=a.ua?a.ua.na:a.M;if(b===this.w.M)return!!a.J;for(a=b.parentNode;a;a=a.parentNode)if(a===this.w.M)return!0;return!1};function Fo(a,b){return a.fa(function(a){return kw(a,b)})}function Hp(a,b){var c=L("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;Be(function(){if(d){var a=kw(d,b);d=d.parent;return a.Bc(!0)}return M(!1)}).then(function(){O(c,!0)});return c.result()};function pw(a){var b=qw.findIndex(function(b){return b.root===a});0<=b&&qw.splice(b,1)}function rw(a){var b=qw.findIndex(function(b){return b.root===a});return(b=qw[b])?b.Ig:null}function sw(a,b,c){var d=a.w,e=d.display,f=d.parent?d.parent.display:null;return"table-row"===e&&!tw(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!tw(f)&&"table"!==f&&"inline-table"!==f||d.D instanceof vp&&d.D!==b?Go(c,d).fa(function(b){a.w=b;return M(!0)}):null}
function tw(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function uw(a,b){this.rowIndex=a;this.M=b;this.b=[]}function vw(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function ww(a,b,c){this.rowIndex=a;this.Qa=b;this.g=c;this.f=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.b=null}function xw(a,b,c){this.rowIndex=a;this.Qa=b;this.Vb=c}function yw(a,b,c){this.g=a;this.b=c;this.ec=new Fm(a,b,c);this.f=!1}
yw.prototype.Yb=function(){var a=this.b.A,b=this.b.Y;"middle"!==b&&"bottom"!==b||x(a,"vertical-align","top");var c=this.ec.Yb(!0);x(a,"vertical-align",b);return c};function zw(a,b){this.A=a;this.b=b}function Aw(a,b,c,d){Km.call(this,a,b,c,d);this.D=a.D;this.rowIndex=this.l=null}v(Aw,Km);Aw.prototype.f=function(a,b){var c=Km.prototype.f.call(this,a,b);return b<this.b()?null:Bw(this).every(function(a){return!!a.w})?c:null};
Aw.prototype.b=function(){var a=Km.prototype.b.call(this);Bw(this).forEach(function(b){a+=b.zb.b()});return a};function Bw(a){a.l||(a.l=Cw(a).map(function(a){return a.Yb()}));return a.l}function Cw(a){return Dw(a.D,null!=a.rowIndex?a.rowIndex:a.rowIndex=Ew(a.D,a.position.M)).map(a.D.Kd,a.D)}function Fw(a,b,c){this.rowIndex=a;this.j=b;this.D=c;this.h=null}v(Fw,ko);
Fw.prototype.f=function(a,b){if(b<this.b())return null;var c=Gw(this),d=Hw(this),e=d.every(function(a){return!!a.w})&&d.some(function(a,b){var d=c[b].ec,e=a.w,f=d.nf[0];return!(f.A===e.A&&f.J===e.J&&f.ma===e.ma)&&!Rk(cl(e),d.ya.wb)});this.j.wa=d.some(function(a){return a.w&&a.w.wa});return e?this.j:null};Fw.prototype.b=function(){var a=this.D,b=0;vw(a.g[this.rowIndex])>a.N/2||(b+=10);Hw(this).forEach(function(a){b+=a.zb.b()});return b};
function Hw(a){a.h||(a.h=Gw(a).map(function(a){return a.Yb()}));return a.h}function Gw(a){return Iw(a.D,a.rowIndex).map(a.D.Kd,a.D)}function vp(a,b){wp.call(this,a,b);this.F=b;this.u=!1;this.G=-1;this.N=0;this.H=[];this.I=this.B=null;this.P=0;this.g=[];this.l=[];this.f=[];this.C=null;this.h=[];this.b=null}v(vp,wp);n=vp.prototype;n.Re=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};
n.af=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.h.length;case "table-cell":return!this.h.some(function(b){return b.Ad.oa[0].node===a.M});default:return b}};function Jw(a,b){var c=a.l[b];c||(c=a.l[b]=[]);return c}function Ew(a,b){return a.g.findIndex(function(a){return b===a.M})}function Iw(a,b){return Jw(a,b).reduce(function(a,b){return b.Vb!==a[a.length-1]?a.concat(b.Vb):a},[])}function Dw(a,b){return Iw(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}
n.Kd=function(a){return this.f[a.rowIndex]&&this.f[a.rowIndex][a.Qa]};function Kw(a){0>a.G&&(a.G=Math.max.apply(null,a.g.map(function(a){return a.b.reduce(function(a,b){return a+b.f},0)})));return a.G}function Lw(a,b){a.g.forEach(function(a){a.b.forEach(function(a){var c=Hk(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}
function Mw(a,b){if(!b)return null;var c=null,d=0;a:for(;d<a.f.length;d++)if(a.f[d])for(var e=0;e<a.f[d].length;e++)if(a.f[d][e]&&b===a.f[d][e].ec.ya){c=a.g[d].b[e];break a}if(!c)return null;for(;d<a.l.length;d++)for(;e<a.l[d].length;e++){var f=a.l[d][e];if(f.Vb===c)return{rowIndex:f.rowIndex,Qa:f.Qa}}return null}function Nw(a,b){var c=[];return a.l.reduce(function(d,e,f){if(f>=b.rowIndex)return d;e=a.Kd(e[b.Qa].Vb);if(!e||c.includes(e))return d;Ow(e.ec.ya,d);c.push(e);return d},[])}
function Pw(a){var b=[];a.g.forEach(function(c){c.b.forEach(function(c,e){b[e]||(b[e]={Df:[],elements:[]});var d=b[e],g=a.Kd(c);g&&!d.Df.includes(g)&&(Ow(g.ec.ya,d.elements),d.Df.push(g))})});return[new Qw(b.map(function(a){return a.elements}))]}function Ow(a,b){a.B.forEach(function(a){a instanceof Pv&&b.push(a.w.D.b);a instanceof hw&&iw(a,null).forEach(function(a){b.push(a)})})}n.Te=function(){return[].concat(this.h)};n.Se=function(a){this.h=a};function Qw(a){this.f=a}
Qw.prototype.b=function(a){return Rw(this,a,function(a){return a.current})};Qw.prototype.F=function(a){return Rw(this,a,function(a){return a.Be})};function Rw(a,b,c){var d=0;a.f.forEach(function(a){a=lo(b,a);d=Math.max(d,c(a))});return d}function Sw(a,b){this.D=a;this.h=b;this.rowIndex=-1;this.Qa=0;this.g=!1;this.f=[]}v(Sw,Em);n=Sw.prototype;
n.sd=function(a){var b=this.D,c=sw(a,b,this.h);if(c)return c;Tw(this,a);var c=a.w,d=b.b;switch(c.display){case "table":b.P=c.ra;break;case "table-caption":b.H.push(new zw(c.A,c.ha));break;case "table-header-group":return d.rc||(this.b=!0,Sv(d,c)),M(!0);case "table-footer-group":return d.qc||(this.b=!0,Tv(d,c)),M(!0);case "table-row":this.b||(this.g=!0,this.rowIndex++,this.Qa=0,b.g[this.rowIndex]=new uw(this.rowIndex,c.M),d.g||(d.g=c.M))}return Em.prototype.sd.call(this,a)};
n.kc=function(a){var b=this.D,c=a.w,d=c.display,e=this.h.f;Tw(this,a);if(c.M===b.F)d=Nn(e,Qv(b,c)),b.N=parseFloat(d[b.u?"height":"width"]),b.b.I=a.cd&&a.cd.M,a.Mb=!0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b=!1,M(!0);break;case "table-row":this.b||(b.C=c.A,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.Qa=0,this.g=!0);d=this.rowIndex;c=new ww(this.rowIndex,this.Qa,c.A);e=b.g[d];e||(b.g[d]=new uw(d,null),e=b.g[d]);e.b.push(c);
for(var e=d+c.rowSpan,f=Jw(b,d),g=0;f[g];)g++;for(;d<e;d++)for(var f=Jw(b,d),h=g;h<g+c.f;h++){var l=f[h]=new xw(d,h,c);c.b||(c.b=l)}this.Qa++}}return Em.prototype.kc.call(this,a)};n.pf=function(a){Uw(this,a)};n.xf=function(a){Uw(this,a)};n.eg=function(a){Uw(this,a)};n.wf=function(a){Uw(this,a)};function Uw(a,b){var c=b.w;c&&c.A&&!Co(c)&&a.f.push(c.clone())}function Tw(a,b){0<a.f.length&&Ho(a.h,b.w,a.f);a.f=[]}
function Vw(a,b){this.$b=!0;this.D=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.u=b.u;b.u=!1}v(Vw,Em);var Ww={"table-caption":!0,"table-column-group":!0,"table-column":!0};
function Xw(a,b,c,d){var e=b.rowIndex,f=b.Qa,g=c.A;if(1<b.f){x(g,"box-sizing","border-box");for(var h=a.D.I,l=0,k=0;k<b.f;k++)l+=h[b.b.Qa+k];l+=a.D.P*(b.f-1);x(g,a.D.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new yw(a.f,b,c);a=a.D;(g=a.f[e])||(g=a.f[e]=[]);g[f]=c;1===d.f.oa.length&&d.f.J&&(c.f=!0);return Im(c.ec,d).Bc(!0)}function Yw(a,b){var c=a.D.h[0];return c?c.Vb.b.Qa===b:!1}
function Zw(a){var b=a.D.h;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.Vb.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function $w(a,b){var c=a.D,d=Zw(a),e=d.reduce(function(a){return a+1},0);if(0===e)return M(!0);var f=a.f.j,g=b.w;g.A.parentNode.removeChild(g.A);var h=L("layoutRowSpanningCellsFromPreviousFragment"),l=M(!0),k=0,m=[];d.forEach(function(a){var b=this;l=l.fa(function(){var d=Uk(a[0].Ad.oa[1],g.parent);return xo(f,d,!1).fa(function(){function g(a){for(;l<a;){if(!m.includes(l)){var b=d.A.ownerDocument.createElement("td");x(b,"padding","0");d.A.appendChild(b)}l++}}var h=M(!0),l=0;a.forEach(function(a){var b=
this;h=h.fa(function(){var c=a.Vb;g(c.b.Qa);var h=a.Ad,p=Uk(h.oa[0],d);p.ma=h.ma;p.J=h.J;p.Ra=h.oa[0].Ra+1;return xo(f,p,!1).fa(function(){for(var d=a.Bf,f=0;f<c.f;f++)m.push(l+f);l+=c.f;return Xw(b,c,p,d).fa(function(){p.A.rowSpan=c.rowIndex+c.rowSpan-b.b+e-k;return M(!0)})})})},b);return h.fa(function(){g(Kw(c));k++;return M(!0)})})})},a);l.then(function(){xo(f,g,!0,b.xd).then(function(){O(h,!0)})});return h.result()}
function ax(a,b){if(a.j||a.h)return M(!0);var c=b.w,d=a.D;0>a.b?a.b=Ew(d,c.M):a.b++;a.g=0;a.l=!0;return $w(a,b).fa(function(){bx(a);rp(a.f,b.cd,null,!0,b.Wc)&&!Dw(d,a.b-1).length&&(a.f.u=a.u,c.wa=!0,b.Mb=!0);return M(!0)})}function bx(a){a.D.g[a.b].b.forEach(function(b){var c=a.D.h[b.Qa];c&&c.Vb.b.Qa==b.b.Qa&&(b=c.Ad.oa[0],c=ek(a.f.j.ba,b.node),Ar(c,b.Ra+1,1))})}
function cx(a,b){if(a.j||a.h)return M(!0);var c=b.w;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.D.g[a.b].b[a.g],e=Wk(c).modify();e.J=!0;b.w=e;var f=L("startTableCell");Yw(a,d.b.Qa)?(e=a.D.h.shift(),c.Ra=e.Ad.oa[0].Ra+1,e=M(e.Bf)):e=Do(a.f,c,b.xd).fa(function(a){a.A&&c.A.removeChild(a.A);return M(new hl(Sk(a)))});e.then(function(e){Xw(a,d,c,e).then(function(){a.kc(b);a.g++;O(f,!0)})});return f.result()}
Vw.prototype.fg=function(a){var b=sw(a,this.D,this.f);if(b)return b;var b=a.w,c=this.D.b,d=b.display;return"table-header-group"===d&&c&&c.B===b.M?(this.j=!0,M(!0)):"table-footer-group"===d&&c&&c.l===b.M?(this.h=!0,M(!0)):"table-row"===d?ax(this,a):"table-cell"===d?cx(this,a):M(!0)};Vw.prototype.Hf=function(a){a=a.w;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=Wk(a).modify(),a.J=!1,this.f.N.push(new Fw(this.b,a,this.D))));return M(!0)};
Vw.prototype.kc=function(a){var b=a.w,c=this.D.b,d=b.display;"table-header-group"===d?c&&!c.h&&c.B===b.M?(this.j=!1,b.A.parentNode.removeChild(b.A)):x(b.A,"display","table-row-group"):"table-footer-group"===d&&(c&&!c.h&&c.l===b.M?(this.h=!1,b.A.parentNode.removeChild(b.A)):x(b.A,"display","table-row-group"));if(d&&Ww[d])b.A.parentNode.removeChild(b.A);else if(b.M===this.D.F)b.wa=qp(this.f,b,null),this.f.u=this.u,a.Mb=!0;else return Em.prototype.kc.call(this,a);return M(!0)};var qw=[];
function dx(){}function ex(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Hk(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function fx(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function gx(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function hx(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function ix(a,b,c){var d=a.u,e=a.C;if(e){a.C=null;var f=e.ownerDocument.createDocumentFragment(),g=Kw(a);if(0<g){var h=a.I=ex(e,g,d,c.f);c=fx(b);e=gx(c);hx(e,c,g,b);e.forEach(function(a,b){x(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.B=f}}
function jx(a,b,c){var d=b.D;d.u=b.b;Kr(d,b.b);var e=rw(b.M);pw(b.M);var f=L("TableLayoutProcessor.doInitialLayout"),g=Wk(b);Cm(new Bm(new Sw(b.D,c),c.j),b).then(function(a){var h=a.A,k=Hk(c.f,h),k=c.b?k.left:k.bottom,k=k+(c.b?-1:1)*lo(b,oo(c)).current;po(c,k)||e&&e.ng?(ix(d,h,c),Lw(d,c.f),O(f,null)):(c.N.push(new kx(g)),O(f,a))}.bind(a));return f.result()}function lx(a,b,c){var d=a.H;d.forEach(function(a,f){a&&(b.insertBefore(a.A,c),"top"===a.b&&(d[f]=null))})}
function mx(a,b){if(a.B&&b){var c=fx(b);c&&c.forEach(function(a){b.removeChild(a)})}}function nx(a,b){var c=a.D,d=Qv(c,a),e=d.firstChild;lx(c,d,e);c.B&&!fx(d).length&&d.insertBefore(c.B.cloneNode(!0),e);c=new Vw(c,b);c=new Bm(c,b.j);d=L("TableFormattingContext.doLayout");Cm(c,a).La(d);return d.result()}n=dx.prototype;n.de=function(a,b,c){var d=a.D;return Qv(d,a)?(c&&Nv(a.parent,b),Mm(new ox(d,this),a,b)):Go(b,a)};n.Ef=function(a,b,c,d){return new Aw(a,b,c,d)};n.Ue=function(){return!1};n.uf=function(){return!1};
n.Ja=function(a,b,c,d){var e=b.D;if("table-row"===b.display){var f=Ew(e,b.M);e.h=[];var g;g=b.J?Dw(e,f):Iw(e,f);if(g.length){var h=L("TableLayoutProcessor.finishBreak"),l=0;Ce(function(a){if(l===g.length)Q(a);else{var b=g[l++],c=e.Kd(b),d=c.Yb().w,h=c.b,k=cl(h),u=new hl(cl(d));e.h.push({Ad:k,Bf:u,Vb:b});h=h.A;Jp(c.b);f<b.rowIndex+b.rowSpan-1&&(h.rowSpan=f-b.rowIndex+1);c.f?P(a):c.ec.Ja(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.ec.ya.element,k=c.b.A,l=Hk(g.f,k),k=Oo(g,k);f?(b=l.right-
g.ha-b.b(d)-k.right,x(h,"max-width",b+"px")):(b=g.ha-b.b(d)-l.top-k.top,x(h,"max-height",b+"px"));x(h,"overflow","hidden")}P(a)})}}).then(function(){ip(a,b,!1);Jp(b);e.f=[];O(h,!0)});return h.result()}}e.f=[];return mp.Ja(a,b,c,d)};n.wd=function(a,b,c,d){Ip.prototype.wd(a,b,c,d)};function ox(a,b){Lm.call(this);this.g=b;this.b=a}v(ox,Lm);ox.prototype.kf=function(a){var b=this.b.b;return b&&b.j?(a.M===this.b.F&&!a.J&&b&&(b.uc=!1,b.Zc=!1),new px(this.b)):new qx(this.b,this.g)};
ox.prototype.Bd=function(a){Lm.prototype.Bd.call(this,a);mx(this.b,Qv(this.b,a))};ox.prototype.ce=function(a,b){Lm.prototype.ce.call(this,a,b);this.b.f=[]};function qx(a,b){this.D=a;this.h=b}v(qx,Yv);qx.prototype.b=function(a,b){Yv.prototype.b.call(this,a,b);return jx(this.h,a,b)};function kx(a){Km.call(this,a,null,a.wa,0)}v(kx,Km);kx.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(this.j?3:0)+(this.position.parent?this.position.parent.l:0)};
kx.prototype.u=function(a){a.B.push(new rx(this.position.M))};function rx(a){this.b=a}n=rx.prototype;n.ee=function(){return!1};n.ed=function(){return!0};n.Vc=function(a,b){qw.push({root:b.M,Ig:{ng:!0}})};n.Ja=function(){return M(!0)};n.me=function(a){return a instanceof rx&&a.b===this.b};n.oe=function(){return 0};function px(a){this.D=a}v(px,Zv);px.prototype.b=function(a,b){var c=this.D.b;if(c&&!Uv(c,a)){var d=new hw(a);b.B.some(function(a){return d.me(a)})||b.B.unshift(d)}return nx(a,b)};
function hw(a){Pv.call(this,a);this.b=[]}v(hw,Pv);n=hw.prototype;n.ee=function(a,b,c){var d=this.w.D.b;return!d||c.Ed||Mo(this.w.A)||!Xv(d)?!0:b&&!a||a&&a.wa?!1:!0};n.ed=function(a){return sx(a,this.w.D).some(function(b){return b.Cd.some(function(b){return b.ed(a)})})?!0:Pv.prototype.ed.call(this,a)};n.Vc=function(a,b,c,d){var e=this.w.D;this.b=sx(b,e);this.b.forEach(function(b){b.Cd.forEach(function(e){e.Vc(a,b.zb,c,d)})});a||(mx(e,Qv(e,this.w)),tx(c));Pv.prototype.Vc.call(this,a,b,c,d)};
n.Ja=function(a,b){var c=this,d=L("finishBreak"),e=this.b.reduce(function(a,b){return a.concat(b.Cd.map(function(a){return{pg:a,zb:b.zb}}))},[]),f=0;Be(function(){if(f<e.length){var a=e[f++];return a.pg.Ja(a.zb,b).Bc(!0)}return M(!1)}).then(function(){O(d,!0)});return d.result().fa(function(){return Pv.prototype.Ja.call(c,a,b)})};function tx(a){if(a&&"table-row"===a.display&&a.A)for(;a.A.previousElementSibling;){var b=a.A.previousElementSibling;b.parentNode&&b.parentNode.removeChild(b)}}
function sx(a,b){return ux(a,b).map(function(a){return{Cd:a.sg.ec.ya.B,zb:a.zb}})}function ux(a,b){var c=Number.MAX_VALUE;a&&"table-row"===a.display&&(c=Ew(b,a.M)+1);for(var c=Math.min(b.f.length,c),d=[],e=0;e<c;e++)b.f[e]&&b.f[e].forEach(function(a){a&&d.push({sg:a,zb:a.Yb().w})});return d}function iw(a,b){var c=a.w.D,d=Mw(c,b);return d?Nw(c,d):Pw(c)}n.me=function(a){return a instanceof hw?this.w.D===a.w.D:!1};var vx=new dx;
de("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===Ld?(b=a.parent,new vp(b?b.D:null,a.M)):null:null});de("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof vp?vx:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function wx(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,tb:null,xc:null}:{url:a.url,tb:b(a.startPage),xc:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function xx(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function yx(a,b){Xj=a.debug;this.g=!1;this.h=a;this.Sb=new Mu(a.window||window,a.viewportElement,"main",this.qg.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.dg(b);this.b=new db;Object.defineProperty(this,"readyState",{get:function(){return this.Sb.B}})}n=yx.prototype;n.dg=function(a){var b=Object.assign({a:"configure"},xx(a));this.Sb.u(b);Object.assign(this.f,a)};
n.qg=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});eb(this.b,b)};n.Jg=function(a,b){this.b.addEventListener(a,b,!1)};n.Mg=function(a,b){this.b.removeEventListener(a,b,!1)};n.vg=function(a,b,c){a||eb(this.b,{type:"error",content:"No URL specified"});zx(this,a,null,b,c)};n.Kg=function(a,b,c){a||eb(this.b,{type:"error",content:"No URL specified"});zx(this,null,a,b,c)};
function zx(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:wx(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},xx(a.f));a.g?a.Sb.u(b):(a.g=!0,nv(a.Sb,b))}n.Zb=function(){return this.Sb.Zb()};
n.yg=function(a){a:switch(a){case "left":a="ltr"===this.Zb()?"previous":"next";break a;case "right":a="ltr"===this.Zb()?"next":"previous"}this.Sb.u({a:"moveTo",where:a})};n.xg=function(a){this.Sb.u({a:"moveTo",url:a})};n.Lg=function(a){a:{var b=this.Sb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=iv(b,b.Z.sb?hv(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};n.tg=function(){return this.Sb.ga};na("vivliostyle.viewer.Viewer",yx);
yx.prototype.setOptions=yx.prototype.dg;yx.prototype.addListener=yx.prototype.Jg;yx.prototype.removeListener=yx.prototype.Mg;yx.prototype.loadDocument=yx.prototype.vg;yx.prototype.loadEPUB=yx.prototype.Kg;yx.prototype.getCurrentPageProgression=yx.prototype.Zb;yx.prototype.navigateToPage=yx.prototype.yg;yx.prototype.navigateToInternalUrl=yx.prototype.xg;yx.prototype.queryZoomFactor=yx.prototype.Lg;yx.prototype.getPageSizes=yx.prototype.tg;na("vivliostyle.viewer.ZoomType",jv);
jv.FIT_INSIDE_VIEWPORT="fit inside viewport";na("vivliostyle.viewer.PageViewMode",Lu);Lu.SINGLE_PAGE="singlePage";Lu.SPREAD="spread";Lu.AUTO_SPREAD="autoSpread";Ev.call(Qu,"load_vivliostyle","end",void 0);var Ax=16,Bx="ltr";function Cx(a){window.adapt_command(a)}function Dx(){Cx({a:"moveTo",where:"ltr"===Bx?"previous":"next"})}function Ex(){Cx({a:"moveTo",where:"ltr"===Bx?"next":"previous"})}
function Fx(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Cx({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Cx({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Cx({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Cx({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Ex(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Dx(),a.preventDefault();else if("0"===b||"U+0030"===c)Cx({a:"configure",fontSize:Math.round(Ax)}),a.preventDefault();else if("t"===b||"U+0054"===c)Cx({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Ax*=1.2,Cx({a:"configure",fontSize:Math.round(Ax)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Ax/=1.2,Cx({a:"configure",
fontSize:Math.round(Ax)}),a.preventDefault()}
function Gx(a){switch(a.t){case "loaded":a=a.viewer;var b=Bx=a.Zb();a.ae.setAttribute("data-vivliostyle-page-progression",b);a.ae.setAttribute("data-vivliostyle-spread-view",a.Z.sb);window.addEventListener("keydown",Fx,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Dx,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Ex,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(Fa(location.href,Ta(a||"")));break;case "hyperlink":a.internal&&Cx({a:"moveTo",url:a.href})}}
na("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||Ba("f"),c=a&&a.epubURL||Ba("b"),d=a&&a.xmlURL||Ba("x"),e=a&&a.defaultPageWidth||Ba("w"),f=a&&a.defaultPageHeight||Ba("h"),g=a&&a.defaultPageSize||Ba("size"),h=a&&a.orientation||Ba("orientation"),l=Ba("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));nv(new Mu(window,k,"main",Gx),a)});
    return enclosingObject.vivliostyle;
}.bind(window));


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[5]);
