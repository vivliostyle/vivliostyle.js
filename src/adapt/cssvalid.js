/**
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
 * @fileoverview Parse validation rules (validation.txt), validate properties and shorthands.
 */
goog.provide('adapt.cssvalid');

goog.require('vivliostyle.logging');
goog.require('adapt.base');
goog.require('adapt.net');
goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.css');
goog.require('adapt.csstok');
goog.require('adapt.cssparse');
goog.require('adapt.expr');

/**
 * @interface
 */
adapt.cssvalid.PropertyReceiver = function() {};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 * @return {void}
 */
adapt.cssvalid.PropertyReceiver.prototype.unknownProperty = (name, value) => {};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 * @return {void}
 */
adapt.cssvalid.PropertyReceiver.prototype.invalidPropertyValue = (name, value) => {};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 * @return {void}
 */
adapt.cssvalid.PropertyReceiver.prototype.simpleProperty = (name, value, important) => {};


/**
 * @param {adapt.cssvalid.PropertyValidator} validator
 * @constructor
 */
adapt.cssvalid.Node = function(validator) {
    /** @type {adapt.cssvalid.Node} */ this.success = null;
    /** @type {adapt.cssvalid.Node} */ this.failure = null;
    /** @type {number} */ this.code = 0;
    /** @type {adapt.cssvalid.PropertyValidator} */ this.validator = validator;
};

/**
 * @return {boolean}
 */
adapt.cssvalid.Node.prototype.isSpecial = function() {
    return this.code != 0;
};

/**
 * @return {void}
 */
adapt.cssvalid.Node.prototype.markAsStartGroup = function() {
    this.code = -1;
};


/**
 * @return {boolean}
 */
adapt.cssvalid.Node.prototype.isStartGroup = function() {
    return this.code == -1;
};

/**
 * @return {void}
 */
adapt.cssvalid.Node.prototype.markAsEndGroup = function() {
    this.code = -2;
};

/**
 * @return {boolean}
 */
adapt.cssvalid.Node.prototype.isEndGroup = function() {
    return this.code == -2;
};

/**
 * @param {number} index
 * @return {void}
 */
adapt.cssvalid.Node.prototype.markAsStartAlternate = function(index) {
    this.code = 2 * index + 1;
};

/**
 * @return {boolean}
 */
adapt.cssvalid.Node.prototype.isStartAlternate = function() {
    return this.code > 0 && this.code % 2 != 0;
};

/**
 * @param {number} index
 * @return {void}
 */
adapt.cssvalid.Node.prototype.markAsEndAlternate = function(index) {
    this.code = 2 * index + 2;
};

/**
 * @return {boolean}
 */
adapt.cssvalid.Node.prototype.isEndAlternate = function() {
    return this.code > 0 && this.code % 2 == 0;
};

/**
 * @return {number}
 */
adapt.cssvalid.Node.prototype.getAlternate = function() {
    return Math.floor((this.code - 1) / 2);
};


/**
 * @param {number} where
 * @param {boolean} success
 * @constructor
 */
adapt.cssvalid.Connection = function(where, success) {
    /** @type {number} */ this.what = -1;
    /** @type {number} */ this.where = where;
    /** @type {boolean} */ this.success = success;
};

/**
 * @enum {number}
 */
adapt.cssvalid.Add = {
    FOLLOW: 1,
    OPTIONAL: 2,
    REPEATED: 3,
    ALTERNATE: 4
};


/**
 * A class to build a list validator from other validators.
 * @constructor
 */
adapt.cssvalid.ValidatingGroup = function() {
    /** @type {Array.<adapt.cssvalid.Node>} */ this.nodes = [];
    /** @type {Array.<adapt.cssvalid.Connection>} */ this.connections = [];
    /** @type {Array.<number>} */ this.match = []; // connector indicies
    /** @type {Array.<number>} */ this.nomatch = [];  // connector indicies
    /** @type {Array.<number>} */ this.error = []; // connector indicies
    /** @type {boolean} */ this.emptyHead = true;
};

/**
 * @param {Array.<number>} arr
 * @param {number} nodeIndex
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.connect = function(arr, nodeIndex) {
    for (let i = 0; i < arr.length; i++) {
        this.connections[arr[i]].what = nodeIndex;
    }
    arr.splice(0, arr.length);
};

/**
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatingGroup.prototype.clone = function() {
    const group = new adapt.cssvalid.ValidatingGroup();
    for (var i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const clonedNode = new adapt.cssvalid.Node(node.validator);
        clonedNode.code = node.code;
        group.nodes.push(clonedNode);
    }
    for (var i = 0; i < this.connections.length; i++) {
        const connection = this.connections[i];
        const groupConnection = new adapt.cssvalid.Connection(connection.where, connection.success);
        groupConnection.what = connection.what;
        group.connections.push(groupConnection);
    }
    group.match.push(...this.match);
    group.nomatch.push(...this.nomatch);
    group.error.push(...this.error);
    return group;
};

/**
 * Add "special" validation node to a given array (match, nomatch, or error).
 * @private
 * @param {Array.<number>} arr
 * @param {boolean} start if this a start or the end of a clause/group
 * @param {number} clause 0 indicates group start/end, otherwise clause index
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.addSpecialToArr = function(arr, start, clause) {
    const index = this.nodes.length;
    const node = new adapt.cssvalid.Node(adapt.cssvalid.ALWAYS_FAIL);
    if (clause >= 0) {
        if (start)
            node.markAsStartAlternate(clause);
        else
            node.markAsEndAlternate(clause);
    } else {
        if (start)
            node.markAsStartGroup();
        else
            node.markAsEndGroup();
    }
    this.nodes.push(node);
    this.connect(arr, index);
    const success = new adapt.cssvalid.Connection(index, true);
    const failure = new adapt.cssvalid.Connection(index, false);
    arr.push(this.connections.length);
    this.connections.push(failure);
    arr.push(this.connections.length);
    this.connections.push(success);
};

/**
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.endSpecialGroup = function() {
    const arrs = [this.match, this.nomatch, this.error];
    for (let i = 0; i < arrs.length; i++) {
        this.addSpecialToArr(arrs[i], false, -1);
    }
};

/**
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.startSpecialGroup = function() {
    if (this.nodes.length)
        throw new Error("invalid call");
    this.addSpecialToArr(this.match, true, -1);
};

/**
 * @param {number} clause
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.endClause = function(clause) {
    this.addSpecialToArr(this.match, false, clause);
};

/**
 * @param {number} clause
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.startClause = function(clause) {
    if (this.nodes.length)
        throw new Error("invalid call");
    const node = new adapt.cssvalid.Node(adapt.cssvalid.ALWAYS_FAIL);
    node.markAsStartAlternate(clause);
    this.nodes.push(node);
    const success = new adapt.cssvalid.Connection(0, true);
    const failure = new adapt.cssvalid.Connection(0, false);
    this.nomatch.push(this.connections.length);
    this.connections.push(failure);
    this.match.push(this.connections.length);
    this.connections.push(success);
};

/**
 * @param {adapt.cssvalid.PropertyValidator} validator
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.addPrimitive = function(validator) {
    const index = this.nodes.length;
    this.nodes.push(new adapt.cssvalid.Node(validator));
    const success = new adapt.cssvalid.Connection(index, true);
    const failure = new adapt.cssvalid.Connection(index, false);
    this.connect(this.match, index);
    if (this.emptyHead) {
        // if did not validate -> no match
        this.nomatch.push(this.connections.length);
        this.emptyHead = false;
    } else {
        // if did not validate -> failure
        this.error.push(this.connections.length);
    }
    this.connections.push(failure);
    this.match.push(this.connections.length);
    this.connections.push(success);
};

/**
 * @return {boolean}
 */
adapt.cssvalid.ValidatingGroup.prototype.isSimple = function() {
    return this.nodes.length == 1 && !this.nodes[0].isSpecial();
};

/**
 * @return {boolean}
 */
adapt.cssvalid.ValidatingGroup.prototype.isPrimitive = function() {
    return this.isSimple() && this.nodes[0].validator instanceof adapt.cssvalid.PrimitiveValidator;
};

/**
 * @param {adapt.cssvalid.ValidatingGroup} group
 * @param {adapt.cssvalid.Add} how
 * @return {void}
 */
adapt.cssvalid.ValidatingGroup.prototype.addGroup = function(group, how) {
    if (group.nodes.length == 0)
        return;
    const index = this.nodes.length;
    // optimization for alternate primitive validators
    if (how == adapt.cssvalid.Add.ALTERNATE && index == 1 && group.isPrimitive() &&
        this.isPrimitive()) {
        this.nodes[0].validator =
            (/** @type {adapt.cssvalid.PrimitiveValidator} */ (this.nodes[0].validator)).combine(
                /** @type {adapt.cssvalid.PrimitiveValidator} */ (group.nodes[0].validator));
        return;
    }
    for (var i = 0; i < group.nodes.length; i++) {
        this.nodes.push(group.nodes[i]);
    }
    // nodes[index] is group start
    if (how == adapt.cssvalid.Add.ALTERNATE) {
        this.emptyHead = true;
        this.connect(this.nomatch, index);
    } else {
        this.connect(this.match, index);
    }
    const connectionIndex = this.connections.length;
    for (var i = 0; i < group.connections.length; i++) {
        const connection = group.connections[i];
        connection.where += index;
        if (connection.what >= 0)
            connection.what += index;
        this.connections.push(connection);
    }
    for (var i = 0; i < group.match.length; i++) {
        this.match.push(group.match[i] + connectionIndex);
    }
    if (how == adapt.cssvalid.Add.REPEATED) {
        this.connect(this.match, index);
    }
    if (how == adapt.cssvalid.Add.OPTIONAL || how == adapt.cssvalid.Add.REPEATED) {
        for (var i = 0; i < group.nomatch.length; i++) {
            this.match.push(group.nomatch[i] + connectionIndex);
        }
    } else if (this.emptyHead) {
        for (var i = 0; i < group.nomatch.length; i++) {
            this.nomatch.push(group.nomatch[i] + connectionIndex);
        }
        this.emptyHead = group.emptyHead;
    } else {
        for (var i = 0; i < group.nomatch.length; i++) {
            this.error.push(group.nomatch[i] + connectionIndex);
        }
    }
    for (var i = 0; i < group.error.length; i++) {
        this.error.push(group.error[i] + connectionIndex);
    }
    // invalidate group
    group.nodes = null;
    group.connections = null;
};

/**
 * @param {adapt.cssvalid.Node} successTerminal
 * @param {adapt.cssvalid.Node} failTerminal
 * @return {adapt.cssvalid.Node} how
 */
adapt.cssvalid.ValidatingGroup.prototype.finish = function(successTerminal, failTerminal) {
    const index = this.nodes.length;
    this.nodes.push(successTerminal);
    this.nodes.push(failTerminal);
    this.connect(this.match, index);
    this.connect(this.nomatch, index + 1);
    this.connect(this.error, index + 1);

    for (const connection of this.connections) {
        if (connection.success)
            this.nodes[connection.where].success = this.nodes[connection.what];
        else
            this.nodes[connection.where].failure = this.nodes[connection.what];
    }

    // make sure that our data structure is correct
    for (let j = 0; j < index; j++) {
        if (this.nodes[j].failure == null || this.nodes[j].success == null)
            throw new Error("Invalid validator state");
    }
    return this.nodes[0];
};

/** @const */ adapt.cssvalid.ALLOW_EMPTY = 0x01;
/** @const */ adapt.cssvalid.ALLOW_STR = 0x02;
/** @const */ adapt.cssvalid.ALLOW_IDENT = 0x04;
/** @const */ adapt.cssvalid.ALLOW_POS_NUMERIC = 0x08;
/** @const */ adapt.cssvalid.ALLOW_POS_NUM = 0x10;
/** @const */ adapt.cssvalid.ALLOW_POS_INT = 0x20;
/** @const */ adapt.cssvalid.ALLOW_COLOR = 0x40;
/** @const */ adapt.cssvalid.ALLOW_URL = 0x80;
/** @const */ adapt.cssvalid.ALLOW_NEGATIVE = 0x100;
/** @const */ adapt.cssvalid.ALLOW_ZERO = 0x200;
/** @const */ adapt.cssvalid.ALLOW_ZERO_PERCENT = 0x400;
/** @const */ adapt.cssvalid.ALLOW_SLASH = 0x800;

/**
 * @typedef {Object.<string,adapt.css.Val>}
 */
adapt.cssvalid.ValueMap;

/**
 * @const
 * @type {adapt.cssvalid.ValueMap}
 */
adapt.cssvalid.NO_IDENTS = {};


/**
 * Abstract class to validate simple CSS property value (not a shorthand)
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.cssvalid.PropertyValidator = function() {
    adapt.css.Visitor.call(this);
};
goog.inherits(adapt.cssvalid.PropertyValidator, adapt.css.Visitor);

/**
 * Validate a subsequence of the given values from the given index. Return the list
 * of matched values or null if there is no match.
 * @param {Array.<adapt.css.Val>} values
 * @param {number} index
 * @return {Array.<adapt.css.Val>}
 */
adapt.cssvalid.PropertyValidator.prototype.validateForShorthand = function(values, index) {
    const rval = values[index].visit(this);
    if (rval)
        return [rval];
    return null;
};


/**
 * Validate a primitive CSS value (not a list or function).
 * @param {number} allowed mask of adapt.cssvalid.ALLOW_*** constants.
 * @param {adapt.cssvalid.ValueMap} idents
 * @param {adapt.cssvalid.ValueMap} units
 * @constructor
 * @extends {adapt.cssvalid.PropertyValidator}
 */
adapt.cssvalid.PrimitiveValidator = function(allowed, idents, units) {
    adapt.cssvalid.PropertyValidator.call(this);
    /** @const */ this.allowed = allowed;
    /** @const */ this.idents = idents;
    /** @const */ this.units = units;
};
goog.inherits(adapt.cssvalid.PrimitiveValidator, adapt.cssvalid.PropertyValidator);

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitEmpty = function(empty) {
    if (this.allowed & adapt.cssvalid.ALLOW_EMPTY)
        return empty;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitSlash = function(slash) {
    if (this.allowed & adapt.cssvalid.ALLOW_SLASH)
        return slash;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitStr = function(str) {
    if (this.allowed & adapt.cssvalid.ALLOW_STR)
        return str;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitIdent = function(ident) {
    const val = this.idents[ident.name.toLowerCase()];
    if (val)
        return val;
    if (this.allowed & adapt.cssvalid.ALLOW_IDENT)
        return ident;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitNumeric = function(numeric) {
    if (numeric.num == 0 && !(this.allowed & adapt.cssvalid.ALLOW_ZERO)) {
        if (numeric.unit == "%" && (this.allowed & adapt.cssvalid.ALLOW_ZERO_PERCENT))
            return numeric;
        return null;
    }
    if (numeric.num < 0 && !(this.allowed & adapt.cssvalid.ALLOW_NEGATIVE))
        return null;
    if (this.units[numeric.unit])
        return numeric;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitNum = function(num) {
    if (num.num == 0) {
        return this.allowed & adapt.cssvalid.ALLOW_ZERO ? num : null;
    }
    if (num.num <= 0 && !(this.allowed & adapt.cssvalid.ALLOW_NEGATIVE))
        return null;
    if (this.allowed & adapt.cssvalid.ALLOW_POS_NUM)
        return num;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitInt = function(num) {
    if (num.num == 0) {
        return this.allowed & adapt.cssvalid.ALLOW_ZERO ? num : null;
    }
    if (num.num <= 0 && !(this.allowed & adapt.cssvalid.ALLOW_NEGATIVE))
        return null;
    if (this.allowed & (adapt.cssvalid.ALLOW_POS_INT|adapt.cssvalid.ALLOW_POS_NUM))
        return num;
    const val = this.idents[`${num.num}`];
    if (val)
        return val;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitColor = function(color) {
    if (this.allowed & adapt.cssvalid.ALLOW_COLOR)
        return color;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitURL = function(url) {
    if (this.allowed & adapt.cssvalid.ALLOW_URL)
        return url;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitSpaceList = list => null;

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitCommaList = list => null;

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitFunc = func => null;

/**
 * @override
 */
adapt.cssvalid.PrimitiveValidator.prototype.visitExpr = expr => null;

/**
 * @param {adapt.cssvalid.PrimitiveValidator} other
 * @return {adapt.cssvalid.PrimitiveValidator}
 */
adapt.cssvalid.PrimitiveValidator.prototype.combine = function(other) {
    /** @type {adapt.cssvalid.ValueMap} */ const idents = {};
    /** @type {adapt.cssvalid.ValueMap} */ const units = {};
    for (var ident in this.idents) {
        idents[ident] = this.idents[ident];
    }
    for (var ident in other.idents) {
        idents[ident] = other.idents[ident];
    }
    for (var unit in this.units) {
        units[unit] = this.units[unit];
    }
    for (var unit in other.units) {
        units[unit] = other.units[unit];
    }
    return new adapt.cssvalid.PrimitiveValidator(this.allowed | other.allowed, idents, units);
};


/**
 * @const
 */
adapt.cssvalid.ALWAYS_FAIL = new adapt.cssvalid.PrimitiveValidator(0,
    adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS);


/**
 * Base class for list validation.
 * @param {adapt.cssvalid.ValidatingGroup} group
 * @constructor
 * @extends {adapt.cssvalid.PropertyValidator}
 */
adapt.cssvalid.ListValidator = function(group) {
    adapt.cssvalid.PropertyValidator.call(this);
    /** @type {adapt.cssvalid.Node} */ this.successTerminal = new adapt.cssvalid.Node(null);
    /** @type {adapt.cssvalid.Node} */ this.failureTerminal = new adapt.cssvalid.Node(null);
    /** @type {adapt.cssvalid.Node} */ this.first = group.finish(this.successTerminal,
        this.failureTerminal);
};
goog.inherits(adapt.cssvalid.ListValidator, adapt.cssvalid.PropertyValidator);

/**
 * @param {Array.<adapt.css.Val>} arr
 * @param {boolean} slice
 * @param {number} startIndex
 * @return {Array.<adapt.css.Val>}
 */
adapt.cssvalid.ListValidator.prototype.validateList = function(arr, slice, startIndex) {
    /** @type {Array.<adapt.css.Val>} */ let out = slice ? [] : arr;
    let current = this.first;
    let index = startIndex;
    let alternativeStack = null;
    let alternatives = null;
    while (current !== this.successTerminal && current !== this.failureTerminal) {
        if (index >= arr.length) {
            current = current.failure;
            continue;
        }
        const inval = arr[index];
        let outval = inval;
        if (current.isSpecial()) {
            let success = true;
            if (current.isStartGroup()) {
                if (alternativeStack) {
                    alternativeStack.push(alternatives);
                } else {
                    alternativeStack = [alternatives];
                }
                alternatives = [];
            } else if (current.isEndGroup()) {
                if (alternativeStack.length > 0) {
                    alternatives = alternativeStack.pop();
                } else {
                    alternatives = null;
                }
            } else if (current.isEndAlternate()) {
                alternatives[current.getAlternate()] = "taken";
            } else {
                success = alternatives[current.getAlternate()] == null;
            }
            current = success ? current.success : current.failure;
        } else {
            if (index == 0 && !slice
                && current.validator instanceof adapt.cssvalid.SpaceListValidator
                && this instanceof adapt.cssvalid.SpaceListValidator) {
                // Special nesting case: validate the input space list as a whole.
                outval = (new adapt.css.SpaceList(arr)).visit(current.validator);
                if (outval) {
                    index = arr.length;
                    current = current.success;
                    continue;
                }
            } else 	if (index == 0 && !slice
                && current.validator instanceof adapt.cssvalid.CommaListValidator
                && this instanceof adapt.cssvalid.SpaceListValidator) {
                // Special nesting case: validate the input comma list as a whole.
                outval = (new adapt.css.CommaList(arr)).visit(current.validator);
                if (outval) {
                    index = arr.length;
                    current = current.success;
                    continue;
                }
            } else {
                outval = inval.visit(current.validator);
            }
            if (!outval) {
                current = current.failure;
                continue;
            }
            if (outval !== inval && arr === out) {
                // startIndex is zero here
                out = [];
                for (let k = 0; k < index; k++) {
                    out[k] = arr[k];
                }
            }
            if (arr !== out) {
                out[index - startIndex] = outval;
            }
            index++;
            current = current.success;
        }
    }
    if (current === this.successTerminal) {
        if (slice ? out.length > 0 : index == arr.length)
            return out;
    }
    return null;
};

/**
 * @param {adapt.css.Val} inval
 * @return {adapt.css.Val}
 */
adapt.cssvalid.ListValidator.prototype.validateSingle = function(inval) {
    // no need to worry about "specials"
    /** @type {adapt.css.Val} */ let outval = null;
    let current = this.first;
    while (current !== this.successTerminal && current !== this.failureTerminal) {
        if (!inval) {
            current = current.failure;
            continue;
        }
        if (current.isSpecial()) {
            current = current.success;
            continue;
        }
        outval = inval.visit(current.validator);
        if (!outval) {
            current = current.failure;
            continue;
        }
        inval = null;
        current = current.success;
    }
    if (current === this.successTerminal)
        return outval;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitEmpty = function(empty) {
    return this.validateSingle(empty);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitSlash = function(slash) {
    return this.validateSingle(slash);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitStr = function(str) {
    return this.validateSingle(str);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitIdent = function(ident) {
    return this.validateSingle(ident);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitNumeric = function(numeric) {
    return this.validateSingle(numeric);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitNum = function(num) {
    return this.validateSingle(num);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitInt = function(num) {
    return this.validateSingle(num);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitColor = function(color) {
    return this.validateSingle(color);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitURL = function(url) {
    return this.validateSingle(url);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitSpaceList = list => null;

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitCommaList = list => null;

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitFunc = function(func) {
    return this.validateSingle(func);
};

/**
 * @override
 */
adapt.cssvalid.ListValidator.prototype.visitExpr = expr => null;


/**
 * @param {adapt.cssvalid.ValidatingGroup} group
 * @constructor
 * @extends {adapt.cssvalid.ListValidator}
 */
adapt.cssvalid.SpaceListValidator = function(group) {
    adapt.cssvalid.ListValidator.call(this, group);
};
goog.inherits(adapt.cssvalid.SpaceListValidator, adapt.cssvalid.ListValidator);

/**
 * @override
 */
adapt.cssvalid.SpaceListValidator.prototype.visitSpaceList = function(list) {
    const arr = this.validateList(list.values, false, 0);
    if (arr === list.values)
        return list;
    if (!arr)
        return null;
    return new adapt.css.SpaceList(arr);
};

/**
 * @override
 */
adapt.cssvalid.SpaceListValidator.prototype.visitCommaList = function(list) {
    // Special Case : Issue #156
    let node = this.first;
    let hasCommaListValidator = false;
    while (node) {
        if (node.validator instanceof adapt.cssvalid.CommaListValidator) {
            hasCommaListValidator = true;
            break;
        }
        node = node.failure;
    }
    if (hasCommaListValidator) {
        const arr = this.validateList(list.values, false, 0);
        if (arr === list.values)
            return list;
        if (!arr)
            return null;
        return new adapt.css.CommaList(arr);
    }
    return null;
};


/**
 * @override
 */
adapt.cssvalid.SpaceListValidator.prototype.validateForShorthand = function(values, index) {
    return this.validateList(values, true, index);
};


/**
 * @param {adapt.cssvalid.ValidatingGroup} group
 * @constructor
 * @extends {adapt.cssvalid.ListValidator}
 */
adapt.cssvalid.CommaListValidator = function(group) {
    adapt.cssvalid.ListValidator.call(this, group);
};
goog.inherits(adapt.cssvalid.CommaListValidator, adapt.cssvalid.ListValidator);

/**
 * @override
 */
adapt.cssvalid.CommaListValidator.prototype.visitSpaceList = function(list) {
    return this.validateSingle(list);
};

/**
 * @override
 */
adapt.cssvalid.CommaListValidator.prototype.visitCommaList = function(list) {
    const arr = this.validateList(list.values, false, 0);
    if (arr === list.values)
        return list;
    if (!arr)
        return null;
    return new adapt.css.CommaList(arr);
};

/**
 * @override
 */
adapt.cssvalid.CommaListValidator.prototype.validateForShorthand = function(values, index) {
    let current = this.first;
    let rval;
    while (current !== this.failureTerminal) {
        rval = current.validator.validateForShorthand(values, index);
        if (rval)
            return rval;
        current = current.failure;
    }
    return null;
};


/**
 * @param {string} name
 * @param {adapt.cssvalid.ValidatingGroup} group
 * @constructor
 * @extends {adapt.cssvalid.ListValidator}
 */
adapt.cssvalid.FuncValidator = function(name, group) {
    adapt.cssvalid.ListValidator.call(this, group);
    /** @const */ this.name = name;
};
goog.inherits(adapt.cssvalid.FuncValidator, adapt.cssvalid.ListValidator);

/**
 * @override
 */
adapt.cssvalid.FuncValidator.prototype.validateSingle = inval => null;

/**
 * @override
 */
adapt.cssvalid.FuncValidator.prototype.visitFunc = function(func) {
    if (func.name.toLowerCase() != this.name)
        return null;
    const arr = this.validateList(func.values, false, 0);
    if (arr === func.values)
        return func;
    if (!arr)
        return null;
    return new adapt.css.Func(func.name, arr);
};

//----------------------- Shorthands ------------------------------------------------------------

/**
 * @constructor
 */
adapt.cssvalid.ShorthandSyntaxNode = function() {};

/**
 * @param {Array.<adapt.css.Val>} values
 * @param {number} index
 * @param {adapt.cssvalid.ShorthandValidator} shorthandValidator
 * @return {number} new index.
 */
adapt.cssvalid.ShorthandSyntaxNode.prototype.tryParse = (values, index, shorthandValidator) => index;

/**
 * @param {adapt.css.Val} rval
 * @param {adapt.cssvalid.ShorthandValidator} shorthandValidator
 * @return {void}
 */
adapt.cssvalid.ShorthandSyntaxNode.prototype.success = (rval, shorthandValidator) => {
};

/**
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {string} name
 * @constructor
 * @extends {adapt.cssvalid.ShorthandSyntaxNode}
 */
adapt.cssvalid.ShorthandSyntaxProperty = function(validatorSet, name) {
    adapt.cssvalid.ShorthandSyntaxNode.call(this);
    /** @const */ this.name = name;
    /** @type {adapt.cssvalid.PropertyValidator} */ this.validator = validatorSet.validators[this.name];
};
goog.inherits(adapt.cssvalid.ShorthandSyntaxProperty, adapt.cssvalid.ShorthandSyntaxNode);

/**
 * @override
 */
adapt.cssvalid.ShorthandSyntaxProperty.prototype.tryParse = function(values, index, shorthandValidator) {
    if (shorthandValidator.values[this.name]) {
        return index;
    }
    const rvals = this.validator.validateForShorthand(values, index);
    if (rvals) {
        const len = rvals.length;
        const rval = len > 1 ? new adapt.css.SpaceList(rvals) : rvals[0];
        this.success(rval, shorthandValidator);
        return index + len;
    }
    return index;
};

/**
 * @override
 */
adapt.cssvalid.ShorthandSyntaxProperty.prototype.success = function(rval, shorthandValidator) {
    shorthandValidator.values[this.name] = rval;
};


/**
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {Array.<string>} names
 * @constructor
 * @extends {adapt.cssvalid.ShorthandSyntaxProperty}
 */
adapt.cssvalid.ShorthandSyntaxPropertyN = function(validatorSet, names) {
    adapt.cssvalid.ShorthandSyntaxProperty.call(this, validatorSet, names[0]);
    /** @const */ this.names = names;
};
goog.inherits(adapt.cssvalid.ShorthandSyntaxPropertyN, adapt.cssvalid.ShorthandSyntaxProperty);

/**
 * @override
 */
adapt.cssvalid.ShorthandSyntaxPropertyN.prototype.success = function(rval, shorthandValidator) {
    for (let i = 0; i < this.names.length; i++) {
        shorthandValidator.values[this.names[i]] = rval;
    }
};


/**
 * @param {Array.<adapt.cssvalid.ShorthandSyntaxNode>} nodes
 * @param {boolean} slash
 * @constructor
 * @extends {adapt.cssvalid.ShorthandSyntaxNode}
 */
adapt.cssvalid.ShorthandSyntaxCompound = function(nodes, slash) {
    adapt.cssvalid.ShorthandSyntaxNode.call(this);
    /** @const */ this.nodes = nodes;
    /** @const */ this.slash = slash;
};
goog.inherits(adapt.cssvalid.ShorthandSyntaxCompound, adapt.cssvalid.ShorthandSyntaxNode);

/**
 * @override
 */
adapt.cssvalid.ShorthandSyntaxCompound.prototype.tryParse = function(values, index, shorthandValidator) {
    const index0 = index;
    if (this.slash) {
        if (values[index] == adapt.css.slash) {
            if (++index == values.length) {
                return index0;
            }
        } else {
            return index0;
        }
    }
    let newIndex = this.nodes[0].tryParse(values, index, shorthandValidator);
    if (newIndex == index)
        return index0;
    index = newIndex;
    for (let i = 1; i < this.nodes.length && index < values.length; i++) {
        newIndex = this.nodes[i].tryParse(values, index, shorthandValidator);
        if (newIndex == index)
            break;
        index = newIndex;
    }
    return index;
};


/**
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.cssvalid.ShorthandValidator = function() {
    /** @type {Array.<adapt.cssvalid.ShorthandSyntaxNode>} */ this.syntax = null;
    /** @type {Array.<string>} */ this.propList = null;
    /** @type {boolean} */ this.error = false;
    /** @type {adapt.cssvalid.ValueMap} */ this.values = {};
    /** @type {adapt.cssvalid.ValidatorSet} */ this.validatorSet = null;
};

/**
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 */
adapt.cssvalid.ShorthandValidator.prototype.setOwner = function(validatorSet) {
    this.validatorSet = validatorSet;
};

/**
 * @param {string} name
 * @return {adapt.cssvalid.ShorthandSyntaxNode}
 */
adapt.cssvalid.ShorthandValidator.prototype.syntaxNodeForProperty = function(name) {
    return new adapt.cssvalid.ShorthandSyntaxProperty(this.validatorSet, name);
};

/**
 * @return {adapt.cssvalid.ShorthandValidator}
 */
adapt.cssvalid.ShorthandValidator.prototype.clone = function() {
    const other = /** @type {adapt.cssvalid.ShorthandValidator} */ (new this.constructor());
    other.syntax = this.syntax;
    other.propList = this.propList;
    other.validatorSet = this.validatorSet;
    return other;
};

/**
 * @param {Array.<adapt.cssvalid.ShorthandSyntaxNode>} syntax
 * @param {Array.<string>} propList
 * @return {void}
 */
adapt.cssvalid.ShorthandValidator.prototype.init = function(syntax, propList) {
    this.syntax = syntax;
    this.propList = propList;
};

/**
 * @param {boolean} important
 * @param {adapt.cssvalid.PropertyReceiver} receiver
 * @return {boolean}
 */
adapt.cssvalid.ShorthandValidator.prototype.finish = function(important, receiver) {
    if (!this.error) {
        for (const name of this.propList) {
            receiver.simpleProperty(name, this.values[name] || this.validatorSet.defaultValues[name], important);
        }

        return true;
    }
    return false;
};

/**
 * @param {boolean} important
 * @param {adapt.cssvalid.PropertyReceiver} receiver
 * @return {void}
 */
adapt.cssvalid.ShorthandValidator.prototype.propagateInherit = function(important, receiver) {
    for (const name of this.propList) {
        receiver.simpleProperty(name, adapt.css.ident.inherit, important);
    }
};

/**
 * @param {Array.<adapt.css.Val>} list
 * @return {number}
 */
adapt.cssvalid.ShorthandValidator.prototype.validateList = function(list) {
    this.error = true;
    return 0;
};

/**
 * @param {adapt.css.Val} val
 * @return {adapt.css.Val}
 */
adapt.cssvalid.ShorthandValidator.prototype.validateSingle = function(val) {
    this.validateList([val]);
    return null;
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitEmpty = function(empty) {
    return this.validateSingle(empty);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitStr = function(str) {
    return this.validateSingle(str);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitIdent = function(ident) {
    return this.validateSingle(ident);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitNumeric = function(numeric) {
    return this.validateSingle(numeric);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitNum = function(num) {
    return this.validateSingle(num);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitInt = function(num) {
    return this.validateSingle(num);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitColor = function(color) {
    return this.validateSingle(color);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitURL = function(url) {
    return this.validateSingle(url);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitSpaceList = function(list) {
    this.validateList(list.values);
    return null;
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitCommaList = function(list) {
    this.error = true;
    return null;
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitFunc = function(func) {
    return this.validateSingle(func);
};

/**
 * @override
 */
adapt.cssvalid.ShorthandValidator.prototype.visitExpr = function(expr) {
    this.error = true;
    return null;
};


/**
 * @constructor
 * @extends {adapt.cssvalid.ShorthandValidator}
 */
adapt.cssvalid.SimpleShorthandValidator = function() {
    adapt.cssvalid.ShorthandValidator.call(this);
};
goog.inherits(adapt.cssvalid.SimpleShorthandValidator, adapt.cssvalid.ShorthandValidator);

/**
 * @override
 */
adapt.cssvalid.SimpleShorthandValidator.prototype.validateList = function(list) {
    let index = 0;
    let i = 0;
    while (index < list.length) {
        const newIndex = this.syntax[i].tryParse(list, index, this);
        if (newIndex > index) {
            index = newIndex;
            i = 0;
            continue;
        }
        if (++i == this.syntax.length) {
            this.error = true;
            break;
        }
    }
    return index;
};


/**
 * @constructor
 * @extends {adapt.cssvalid.ShorthandValidator}
 */
adapt.cssvalid.InsetsShorthandValidator = function() {
    adapt.cssvalid.ShorthandValidator.call(this);
};
goog.inherits(adapt.cssvalid.InsetsShorthandValidator, adapt.cssvalid.ShorthandValidator);

/**
 * @override
 */
adapt.cssvalid.InsetsShorthandValidator.prototype.validateList = function(list) {
    if (list.length > this.syntax.length || list.length == 0) {
        this.error = true;
        return 0;
    }
    for (let i = 0; i < this.syntax.length; i++) {
        let index = i;
        while (index >= list.length) {
            index = index == 1 ? 0 : index - 2;
        }
        if (this.syntax[i].tryParse(list, index, this) != index + 1) {
            this.error = true;
            return 0;
        }
    }
    return list.length;
};

/**
 * @return {adapt.cssvalid.ShorthandSyntaxPropertyN}
 */
adapt.cssvalid.InsetsShorthandValidator.prototype.createSyntaxNode = function() {
    return new adapt.cssvalid.ShorthandSyntaxPropertyN(this.validatorSet, this.propList);
};


/**
 * @constructor
 * @extends {adapt.cssvalid.ShorthandValidator}
 */
adapt.cssvalid.InsetsSlashShorthandValidator = function() {
    adapt.cssvalid.ShorthandValidator.call(this);
};
goog.inherits(adapt.cssvalid.InsetsSlashShorthandValidator, adapt.cssvalid.ShorthandValidator);

/**
 * @override
 */
adapt.cssvalid.InsetsSlashShorthandValidator.prototype.validateList = function(list) {
    let slashIndex = list.length;
    for (var i = 0; i < list.length; i++) {
        if (list[i] === adapt.css.slash) {
            slashIndex = i;
            break;
        }
    }
    if (slashIndex > this.syntax.length || list.length == 0) {
        this.error = true;
        return 0;
    }
    for (var i = 0; i < this.syntax.length; i++) {
        let index0 = i;
        while (index0 >= slashIndex) {
            index0 = index0 == 1 ? 0 : index0 - 2;
        }
        let index1;
        if (slashIndex + 1 < list.length) {
            index1 = slashIndex + i + 1;
            while (index1 >= list.length) {
                index1 = index1 - (index1 == slashIndex+2 ? 1 : 2);
            }
        } else {
            index1 = index0;
        }
        const vals = [list[index0], list[index1]];
        if (this.syntax[i].tryParse(vals, 0, this) != 2) {
            this.error = true;
            return 0;
        }
    }
    return list.length;
};


/**
 * @constructor
 * @extends {adapt.cssvalid.SimpleShorthandValidator}
 */
adapt.cssvalid.CommaShorthandValidator = function() {
    adapt.cssvalid.SimpleShorthandValidator.call(this);
};
goog.inherits(adapt.cssvalid.CommaShorthandValidator, adapt.cssvalid.SimpleShorthandValidator);

/**
 * @param {Object.<string,Array.<adapt.css.Val>>} acc
 * @param {adapt.cssvalid.ValueMap} values
 */
adapt.cssvalid.CommaShorthandValidator.prototype.mergeIn = function(acc, values) {
    for (const name of this.propList) {
        const val = values[name] || this.validatorSet.defaultValues[name];
        let arr = acc[name];
        if (!arr) {
            arr = [];
            acc[name] = arr;
        }
        arr.push(val);
    }
};

/**
 * @override
 */
adapt.cssvalid.CommaShorthandValidator.prototype.visitCommaList = function(list) {
    /** @type {Object.<string,Array.<adapt.css.Val>>} */ const acc = {};
    for (let i = 0; i < list.values.length; i++) {
        this.values = {};
        if (list.values[i] instanceof adapt.css.CommaList) {
            this.error = true;
        } else {
            list.values[i].visit(this);
            this.mergeIn(acc, this.values);
            if (this.values["background-color"] && i != list.values.length - 1) {
                this.error = true;
            }
        }
        if (this.error)
            return null;
    }
    this.values = {};
    for (const name in acc) {
        if (name == "background-color") {
            this.values[name] = acc[name].pop();
        } else {
            this.values[name] = new adapt.css.CommaList(acc[name]);
        }
    }
    return null;
};


/**
 * @constructor
 * @extends {adapt.cssvalid.SimpleShorthandValidator}
 */
adapt.cssvalid.FontShorthandValidator = function() {
    adapt.cssvalid.SimpleShorthandValidator.call(this);
};
goog.inherits(adapt.cssvalid.FontShorthandValidator, adapt.cssvalid.SimpleShorthandValidator);

/**
 * @override
 */
adapt.cssvalid.FontShorthandValidator.prototype.init = function(syntax, propList) {
    adapt.cssvalid.SimpleShorthandValidator.prototype.init.call(this, syntax, propList);
    this.propList.push("font-family", "line-height", "font-size");
};

/**
 * @override
 */
adapt.cssvalid.FontShorthandValidator.prototype.validateList = function(list) {
    let index = adapt.cssvalid.SimpleShorthandValidator.prototype.validateList.call(this, list);
    // must at least have font-size and font-family at the end
    if (index + 2 > list.length) {
        this.error = true;
        return index;
    }
    this.error = false;
    const validators = this.validatorSet.validators;
    if (!list[index].visit(validators["font-size"])) {
        this.error = true;
        return index;
    }
    this.values["font-size"] = list[index++];
    if (list[index] === adapt.css.slash) {
        index++;
        // must at least have line-height and font-family at the end
        if (index + 2 > list.length) {
            this.error = true;
            return index;
        }
        if (!list[index].visit(validators["line-height"])) {
            this.error = true;
            return index;
        }
        this.values["line-height"] = list[index++];
    }
    const fontFamily = index == list.length - 1 ? list[index] : new adapt.css.SpaceList(list.slice(index, list.length));
    if (!fontFamily.visit(validators["font-family"])) {
        this.error = true;
        return index;
    }
    this.values["font-family"] = fontFamily;
    return list.length;
};

/**
 * @override
 */
adapt.cssvalid.FontShorthandValidator.prototype.visitCommaList = function(list) {
    list.values[0].visit(this);
    if (this.error)
        return null;
    const familyList = [this.values["font-family"]];
    for (let i = 1; i < list.values.length; i++) {
        familyList.push(list.values[i]);
    }
    const family = new adapt.css.CommaList(familyList);
    if (!family.visit(this.validatorSet.validators["font-family"])) {
        this.error = true;
    } else {
        this.values["font-family"] = family;
    }
    return null;
};

/**
 * @override
 */
adapt.cssvalid.FontShorthandValidator.prototype.visitIdent = function(ident) {
    const props = this.validatorSet.systemFonts[ident.name];
    if (props) {
        for (const name in props) {
            this.values[name] = props[name];
        }
    } else {
        this.error = true;
    }
    return null;
};

/**
 * @const
 * @type {Object.<string,function(new:adapt.cssvalid.ShorthandValidator)>}
 */
adapt.cssvalid.shorthandValidators = {
    "SIMPLE": adapt.cssvalid.SimpleShorthandValidator,
    "INSETS": adapt.cssvalid.InsetsShorthandValidator,
    "INSETS_SLASH": adapt.cssvalid.InsetsSlashShorthandValidator,
    "COMMA": adapt.cssvalid.CommaShorthandValidator,
    "FONT": adapt.cssvalid.FontShorthandValidator
};

//---- validation grammar parser and public property validator ------------------------

/**
 * Object that validates simple and shorthand properties, breaking up shorthand properties
 * into corresponding simple ones, also stripping property prefixes.
 * @constructor
 */
adapt.cssvalid.ValidatorSet = function() {
    /** @type {Object.<string,adapt.cssvalid.PropertyValidator>} */ this.validators = {};
    /** @type {Object.<string,Object.<string,boolean>>} */ this.prefixes = {};
    /** @type {adapt.cssvalid.ValueMap} */ this.defaultValues = {};
    /** @type {Object.<string,adapt.cssvalid.ValidatingGroup>} */ this.namedValidators = {};
    /** @type {Object.<string,adapt.cssvalid.ValueMap>} */ this.systemFonts = {};
    /** @type {Object.<string,adapt.cssvalid.ShorthandValidator>} */ this.shorthands = {};
    /** @type {adapt.cssvalid.ValueMap} */ this.layoutProps = [];
    /** @type {adapt.cssvalid.ValueMap} */ this.backgroundProps = [];
};

/**
 * @private
 * @param {adapt.cssvalid.ValidatingGroup} val
 * @param {adapt.csstok.Token} token
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatorSet.prototype.addReplacement = (val, token) => {
    /** @type {adapt.css.Val} */ let cssval;
    if (token.type == adapt.csstok.TokenType.NUMERIC) {
        cssval = new adapt.css.Numeric(token.num, token.text);
    } else if (token.type == adapt.csstok.TokenType.HASH) {
        cssval = adapt.cssparse.colorFromHash(token.text);
    } else if (token.type == adapt.csstok.TokenType.IDENT) {
        cssval = adapt.css.getName(token.text);
    } else {
        throw new Error("unexpected replacement");
    }
    if (val.isPrimitive()) {
        const validator = /** @type {adapt.cssvalid.PrimitiveValidator} */ (val.nodes[0].validator);
        const idents = validator.idents;
        for (const ident in idents) {
            idents[ident] = cssval;
        }
        return val;
    }
    throw new Error("unexpected replacement");
};

/**
 * @private
 * @param {string} op
 * @param {Array.<adapt.cssvalid.ValidatingGroup>} vals
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatorSet.prototype.newGroup = (op, vals) => {
    const group = new adapt.cssvalid.ValidatingGroup();
    if (op == "||") {
        for (var i = 0; i < vals.length; i++) {
            const subgroup = new adapt.cssvalid.ValidatingGroup();
            subgroup.startClause(i);
            subgroup.addGroup(vals[i], adapt.cssvalid.Add.FOLLOW);
            subgroup.endClause(i);
            group.addGroup(subgroup, i == 0 ? adapt.cssvalid.Add.FOLLOW : adapt.cssvalid.Add.ALTERNATE);
        }
        const outer = new adapt.cssvalid.ValidatingGroup();
        outer.startSpecialGroup();
        outer.addGroup(group, adapt.cssvalid.Add.REPEATED);
        outer.endSpecialGroup();
        return outer;
    } else {
        /** @type {adapt.cssvalid.Add} */ let how;
        switch (op) {
            case " ":
                how = adapt.cssvalid.Add.FOLLOW;
                break;
            case "|":
            case "||":
                how = adapt.cssvalid.Add.ALTERNATE;
                break;
            default:
                throw new Error("unexpected op");
        }
        for (var i = 0; i < vals.length; i++) {
            group.addGroup(vals[i], (i == 0 ? adapt.cssvalid.Add.FOLLOW : how));
        }
        return group;
    }
};

/**
 * @private
 * @param {adapt.cssvalid.ValidatingGroup} val
 * @param {number} min
 * @param {number} max
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatorSet.prototype.addCounts = (val, min, max) => {
    const group = new adapt.cssvalid.ValidatingGroup();
    for (var i = 0; i < min; i++) {
        group.addGroup(val.clone(), adapt.cssvalid.Add.FOLLOW);
    }
    if (max == Number.POSITIVE_INFINITY) {
        group.addGroup(val, adapt.cssvalid.Add.REPEATED);
    } else {
        for (var i = min; i < max; i++) {
            group.addGroup(val.clone(), adapt.cssvalid.Add.OPTIONAL);
        }
    }
    return group;
};

/**
 * @private
 * @param {adapt.cssvalid.PropertyValidator} validator
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatorSet.prototype.primitive = validator => {
    const group = new adapt.cssvalid.ValidatingGroup();
    group.addPrimitive(validator);
    return group;
};

/**
 * @private
 * @param {string} fn
 * @param {adapt.cssvalid.ValidatingGroup} val
 * @return {adapt.cssvalid.ValidatingGroup}
 */
adapt.cssvalid.ValidatorSet.prototype.newFunc = function(fn, val) {
    /**@type {adapt.cssvalid.PropertyValidator} */ let validator;
    switch (fn) {
        case "COMMA":
            validator = new adapt.cssvalid.CommaListValidator(val);
            break;
        case "SPACE":
            validator = new adapt.cssvalid.SpaceListValidator(val);
            break;
        default:
            validator = new adapt.cssvalid.FuncValidator(fn.toLowerCase(), val);
            break;
    }
    return this.primitive(validator);
};

/**
 * @private
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.initBuiltInValidators = function() {
    this.namedValidators["HASHCOLOR"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_COLOR, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["POS_INT"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_INT, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["POS_NUM"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUM, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["POS_PERCENTAGE"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "%": adapt.css.empty
        }));
    this.namedValidators["NEGATIVE"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_NEGATIVE, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["ZERO"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_ZERO, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["ZERO_PERCENTAGE"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_ZERO_PERCENT, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["POS_LENGTH"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "em": adapt.css.empty,
            "ex": adapt.css.empty,
            "ch": adapt.css.empty,
            "rem": adapt.css.empty,
            "vh": adapt.css.empty,
            "vw": adapt.css.empty,
            "vmin": adapt.css.empty,
            "vmax": adapt.css.empty,
            "cm": adapt.css.empty,
            "mm": adapt.css.empty,
            "in": adapt.css.empty,
            "px": adapt.css.empty,
            "pt": adapt.css.empty,
            "pc": adapt.css.empty,
            "q": adapt.css.empty
        }));
    this.namedValidators["POS_ANGLE"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "deg": adapt.css.empty,
            "grad": adapt.css.empty,
            "rad": adapt.css.empty,
            "turn": adapt.css.empty
        }));
    this.namedValidators["POS_TIME"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "s": adapt.css.empty,
            "ms": adapt.css.empty
        }));
    this.namedValidators["FREQUENCY"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "Hz": adapt.css.empty,
            "kHz": adapt.css.empty
        }));
    this.namedValidators["RESOLUTION"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_POS_NUMERIC, adapt.cssvalid.NO_IDENTS, {
            "dpi": adapt.css.empty,
            "dpcm": adapt.css.empty,
            "dppx": adapt.css.empty
        }));
    this.namedValidators["URI"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_URL, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["IDENT"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_IDENT, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["STRING"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_STR, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));
    this.namedValidators["SLASH"] = this.primitive(new adapt.cssvalid.PrimitiveValidator(
        adapt.cssvalid.ALLOW_SLASH, adapt.cssvalid.NO_IDENTS, adapt.cssvalid.NO_IDENTS));

    const stdfont = {
        "font-family": adapt.css.getName("sans-serif")
    };
    this.systemFonts["caption"] = stdfont;
    this.systemFonts["icon"] = stdfont;
    this.systemFonts["menu"] = stdfont;
    this.systemFonts["message-box"] = stdfont;
    this.systemFonts["small-caption"] = stdfont;
    this.systemFonts["status-bar"] = stdfont;
};

/**
 * @private
 * @param {string} name
 * @return {boolean}
 */
adapt.cssvalid.ValidatorSet.prototype.isBuiltIn = name => !!name.match(/^[A-Z_0-9]+$/);

/**
 * @private
 * @param {adapt.csstok.Tokenizer} tok
 * @param {number} section
 * @return {?string}
 */
adapt.cssvalid.ValidatorSet.prototype.readNameAndPrefixes = function(tok, section) {
    let token = tok.token();
    if (token.type == adapt.csstok.TokenType.EOF) {
        // Finished normally
        return null;
    }
    /** @type {!Object.<string,boolean>} */ const rulePrefixes = {"": true};
    if (token.type == adapt.csstok.TokenType.O_BRK) {
        do {
            tok.consume();
            token = tok.token();
            if (token.type != adapt.csstok.TokenType.IDENT)
                throw new Error("Prefix name expected");
            rulePrefixes[token.text] = true;
            tok.consume();
            token = tok.token();
        } while (token.type == adapt.csstok.TokenType.COMMA);
        if (token.type != adapt.csstok.TokenType.C_BRK)
            throw new Error("']' expected");
        tok.consume();
        token = tok.token();
    }
    if (token.type != adapt.csstok.TokenType.IDENT) {
        throw new Error("Property name expected");
    }
    if (section == 2 ? token.text == "SHORTHANDS" : token.text == "DEFAULTS") {
        tok.consume();
        return null;
    }
    const name = token.text;
    tok.consume();
    if (section != 2) {
        if (tok.token().type != adapt.csstok.TokenType.EQ) {
            throw new Error("'=' expected");
        }
        if (!this.isBuiltIn(name)) {
            this.prefixes[name] = rulePrefixes;
        }
    } else {
        if (tok.token().type != adapt.csstok.TokenType.COLON) {
            throw new Error("':' expected");
        }
    }
    return name;
};

/**
 * @private
 * @param {adapt.csstok.Tokenizer} tok
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.parseValidators = function(tok) {
    while (true) {
        const ruleName = this.readNameAndPrefixes(tok, 1);
        if (!ruleName)
            return;

        /** @type {Array.<adapt.cssvalid.ValidatingGroup>} */ let vals = [];
        const stack = [];
        let op = "";
        let val;
        let expectval = true;
        const self = this;

        /**
         * @return {adapt.cssvalid.ValidatingGroup}
         */
        const reduce = () => {
            if (vals.length == 0)
                throw new Error("No values");
            if (vals.length == 1)
                return vals[0];
            return self.newGroup(op, vals);
        };

        /**
         * @param {string} currop
         * @return {void}
         */
        const setop = currop => {
            if (expectval)
                throw new Error(`'${currop}': unexpected`);
            if (op && op != currop)
                throw new Error(`mixed operators: '${currop}' and '${op}'`);
            op = currop;
            expectval = true;
        };

        /** @type {adapt.cssvalid.ValidatingGroup} */ let result = null;
        while (!result) {
            tok.consume();
            let token = tok.token();
            switch (token.type) {
                case adapt.csstok.TokenType.IDENT:
                    if (!expectval)
                        setop(" ");
                    if (this.isBuiltIn(token.text)) {
                        const builtIn = this.namedValidators[token.text];
                        if (!builtIn)
                            throw new Error(`'${token.text}' unexpected`);
                        vals.push(builtIn.clone());
                    } else {
                        var idents = {};
                        idents[token.text.toLowerCase()] = adapt.css.getName(token.text);
                        vals.push(this.primitive(new adapt.cssvalid.PrimitiveValidator(0, idents, adapt.cssvalid.NO_IDENTS)));
                    }
                    expectval = false;
                    break;
                case adapt.csstok.TokenType.INT:
                    var idents = {};
                    idents[`${token.num}`] = new adapt.css.Int(token.num);
                    vals.push(this.primitive(new adapt.cssvalid.PrimitiveValidator(0, idents, adapt.cssvalid.NO_IDENTS)));
                    expectval = false;
                    break;
                case adapt.csstok.TokenType.BAR:
                    setop("|");
                    break;
                case adapt.csstok.TokenType.BAR_BAR:
                    setop("||");
                    break;
                case adapt.csstok.TokenType.O_BRK:
                    if (!expectval)
                        setop(" ");
                    stack.push({ vals, op, b: "[" });
                    op = "";
                    vals = [];
                    expectval = true;
                    break;
                case adapt.csstok.TokenType.FUNC:
                    if (!expectval)
                        setop(" ");
                    stack.push({ vals, op, b: "(", fn: token.text });
                    op = "";
                    vals = [];
                    expectval = true;
                    break;
                case adapt.csstok.TokenType.C_BRK:
                    val = reduce();
                    var open = stack.pop();
                    if (open.b != "[")
                        throw new Error("']' unexpected");
                    vals = open.vals;
                    vals.push(val);
                    op = open.op;
                    expectval = false;
                    break;
                case adapt.csstok.TokenType.C_PAR:
                    val = reduce();
                    var open = stack.pop();
                    if (open.b != "(")
                        throw new Error("')' unexpected");
                    vals = open.vals;
                    vals.push(this.newFunc(open.fn, val));
                    op = open.op;
                    expectval = false;
                    break;
                case adapt.csstok.TokenType.COLON:
                    if (expectval)
                        throw new Error("':' unexpected");
                    tok.consume();
                    vals.push(this.addReplacement(vals.pop(), tok.token()));
                    break;
                case adapt.csstok.TokenType.QMARK:
                    if (expectval)
                        throw new Error("'?' unexpected");
                    vals.push(this.addCounts(vals.pop(), 0, 1));
                    break;
                case adapt.csstok.TokenType.STAR:
                    if (expectval)
                        throw new Error("'*' unexpected");
                    vals.push(this.addCounts(vals.pop(), 0, Number.POSITIVE_INFINITY));
                    break;
                case adapt.csstok.TokenType.PLUS:
                    if (expectval)
                        throw new Error("'+' unexpected");
                    vals.push(this.addCounts(vals.pop(), 1, Number.POSITIVE_INFINITY));
                    break;
                case adapt.csstok.TokenType.O_BRC:
                    tok.consume();
                    token = tok.token();
                    if (token.type != adapt.csstok.TokenType.INT)
                        throw new Error("<int> expected");
                    const min = token.num;
                    let max = min;
                    tok.consume();
                    token = tok.token();
                    if (token.type == adapt.csstok.TokenType.COMMA) {
                        tok.consume();
                        token = tok.token();
                        if (token.type != adapt.csstok.TokenType.INT)
                            throw new Error("<int> expected");
                        max = token.num;
                        tok.consume();
                        token = tok.token();
                    }
                    if (token.type != adapt.csstok.TokenType.C_BRC)
                        throw new Error("'}' expected");
                    vals.push(this.addCounts(vals.pop(), min, max));
                    break;
                case adapt.csstok.TokenType.SEMICOL:
                    result = reduce();
                    if (stack.length > 0)
                        throw new Error(`unclosed '${stack.pop().b}'`);
                    break;
                default:
                    throw new Error("unexpected token");
            }
        }
        tok.consume();
        if (this.isBuiltIn(ruleName)) {
            this.namedValidators[ruleName] = result;
        } else {
            if (result.isSimple()) {
                this.validators[ruleName] = result.nodes[0].validator;
            } else {
                this.validators[ruleName] = new adapt.cssvalid.SpaceListValidator(result);
            }
        }
    }
};

/**
 * @private
 * @param {adapt.csstok.Tokenizer} tok
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.parseDefaults = function(tok) {
    while (true) {
        const propName = this.readNameAndPrefixes(tok, 2);
        if (!propName)
            return;
        /** @type {Array.<adapt.css.Val>} */ const vals = [];
        while (true) {
            tok.consume();
            const token = tok.token();
            if (token.type == adapt.csstok.TokenType.SEMICOL) {
                tok.consume();
                break;
            }
            switch (token.type) {
                case adapt.csstok.TokenType.IDENT:
                    vals.push(adapt.css.getName(token.text));
                    break;
                case adapt.csstok.TokenType.NUM:
                    vals.push(new adapt.css.Num(token.num));
                    break;
                case adapt.csstok.TokenType.INT:
                    vals.push(new adapt.css.Int(token.num));
                    break;
                case adapt.csstok.TokenType.NUMERIC:
                    vals.push(new adapt.css.Numeric(token.num, token.text));
                    break;
                default:
                    throw new Error("unexpected token");
            }
        }
        this.defaultValues[propName] = vals.length > 1 ? new adapt.css.SpaceList(vals) : vals[0];
    }
};

/**
 * @private
 * @param {adapt.csstok.Tokenizer} tok
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.parseShorthands = function(tok) {
    while (true) {
        const ruleName = this.readNameAndPrefixes(tok, 3);
        if (!ruleName)
            return;
        let token = tok.nthToken(1);
        let shorthandValidator;
        if (token.type == adapt.csstok.TokenType.IDENT && adapt.cssvalid.shorthandValidators[token.text]) {
            shorthandValidator = new adapt.cssvalid.shorthandValidators[token.text]();
            tok.consume();
        } else {
            shorthandValidator = new adapt.cssvalid.SimpleShorthandValidator();
        }
        shorthandValidator.setOwner(this);
        let result = false;
        /** @type {Array.<adapt.cssvalid.ShorthandSyntaxNode>} */ let syntax = [];
        let slash = false;
        const stack = [];
        const propList = [];
        while (!result) {
            tok.consume();
            token = tok.token();
            switch (token.type) {
                case adapt.csstok.TokenType.IDENT :
                    if (this.validators[token.text]) {
                        syntax.push(shorthandValidator.syntaxNodeForProperty(token.text));
                        propList.push(token.text);
                    } else if (this.shorthands[token.text] instanceof
                        adapt.cssvalid.InsetsShorthandValidator) {
                        const insetShorthand = /** @type {adapt.cssvalid.InsetsShorthandValidator} */
                            (this.shorthands[token.text]);
                        syntax.push(insetShorthand.createSyntaxNode());
                        propList.push(...insetShorthand.propList);
                    } else {
                        throw new Error(`'${token.text}' is neither a simple property nor an inset shorthand`);
                    }
                    break;
                case adapt.csstok.TokenType.SLASH :
                    if (syntax.length > 0 || slash)
                        throw new Error("unexpected slash");
                    slash = true;
                    break;
                case adapt.csstok.TokenType.O_BRK :
                    stack.push({ slash, syntax });
                    syntax = [];
                    slash = false;
                    break;
                case adapt.csstok.TokenType.C_BRK :
                    const compound = new adapt.cssvalid.ShorthandSyntaxCompound(syntax, slash);
                    const item = stack.pop();
                    syntax = item.syntax;
                    slash = item.slash;
                    syntax.push(compound);
                    break;
                case adapt.csstok.TokenType.SEMICOL:
                    result = true;
                    tok.consume();
                    break;
                default:
                    throw new Error("unexpected token");
            }
        }
        shorthandValidator.init(syntax, propList);
        this.shorthands[ruleName] = shorthandValidator;
    }
};

/**
 * @private
 * @param {string} text
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.parse = function(text) {
    // Not as robust as CSS parser.
    const tok = new adapt.csstok.Tokenizer(text, null);
    this.parseValidators(tok);
    this.parseDefaults(tok);
    this.parseShorthands(tok);
    this.backgroundProps = this.makePropSet(["background"]);
    this.layoutProps = this.makePropSet(["margin", "border", "padding",
        "columns", "column-gap", "column-rule", "column-fill"]);
};

/**
 * @param {Array.<string>} propList
 */
adapt.cssvalid.ValidatorSet.prototype.makePropSet = function(propList) {
    const map = {};

    for (const prop of propList) {
        const shorthand = this.shorthands[prop];
        const list = shorthand ? shorthand.propList : [prop];

        for (const pname of list) {
            const pval = this.defaultValues[pname];
            if (!pval) {
                vivliostyle.logging.logger.warn("Unknown property in makePropSet:", pname);
            } else {
                map[pname] = pval;
            }
        }
    }

    return map;
};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 * @param {boolean} important
 * @param {adapt.cssvalid.PropertyReceiver} receiver
 * @return {void}
 */
adapt.cssvalid.ValidatorSet.prototype.validatePropertyAndHandleShorthand =
    function(name, value, important, receiver) {
        let prefix = "";
        const origName = name;
        name = name.toLowerCase();
        const r = name.match(/^-([a-z]+)-([-a-z0-9]+)$/);
        if (r) {
            prefix = r[1];
            name = r[2];
        }
        const px = this.prefixes[name];
        if (!px || !px[prefix]) {
            receiver.unknownProperty(origName, value);
            return;
        }
        const validator = this.validators[name];
        if (validator) {
            const rvalue = value === adapt.css.ident.inherit || value.isExpr() ? value : value.visit(validator);
            if (rvalue) {
                receiver.simpleProperty(name, rvalue, important);
            } else {
                receiver.invalidPropertyValue(origName, value);
            }
        } else {
            const shorthand = this.shorthands[name].clone();
            if (value === adapt.css.ident.inherit) {
                shorthand.propagateInherit(important, receiver);
            } else {
                value.visit(shorthand);
                if (!shorthand.finish(important, receiver)) {
                    receiver.invalidPropertyValue(origName, value);
                }
            }
        }
    };


/**
 * @type {adapt.taskutil.Fetcher.<adapt.cssvalid.ValidatorSet>}
 */
adapt.cssvalid.validatorFetcher = new adapt.taskutil.Fetcher(() => {
    /** @type {!adapt.task.Frame.<adapt.cssvalid.ValidatorSet>} */ const frame =
        adapt.task.newFrame("loadValidatorSet.load");
    const url = adapt.base.resolveURL("validation.txt", adapt.base.resourceBaseURL);
    const result = adapt.net.ajax(url);
    const validatorSet = new adapt.cssvalid.ValidatorSet();
    validatorSet.initBuiltInValidators();
    result.then(xhr => {
        try {
            if (xhr.responseText) {
                validatorSet.parse(xhr.responseText);
            } else {
                vivliostyle.logging.logger.error("Error: missing", url);
            }
        } catch (err) {
            vivliostyle.logging.logger.error(err, "Error:");
        }
        frame.finish(validatorSet);
    });
    return frame.result();
}, "validatorFetcher");

/**
 * @return {!adapt.task.Result.<adapt.cssvalid.ValidatorSet>}
 */
adapt.cssvalid.loadValidatorSet = () => adapt.cssvalid.validatorFetcher.get();
