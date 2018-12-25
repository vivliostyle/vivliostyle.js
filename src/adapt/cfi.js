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
 * @fileoverview Support for EPUB Canonical Fragment Identifiers.
 */
goog.provide('adapt.cfi');

goog.require('adapt.base');

/**
 * @typedef {{
 * 		node: Node,
 * 		offset: number,
 * 		after: boolean,
 *		sideBias: ?string,
 *		ref: adapt.cfi.Fragment
 * }}
 */
adapt.cfi.Position;

/**
 * @param {Node} node
 * @return {?string}
 */
adapt.cfi.getId = node => {
    if (node.nodeType == 1) {
        const idtxt = (/** @type {Element} */ (node)).getAttribute("id");
        if (idtxt && idtxt.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)) {
            return idtxt;
        }
    }
    return null;
};

/**
 * @param {string} ch
 * @return {string}
 */
adapt.cfi.escapeChar = ch => `^${ch}`;

/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.escape = str => str.replace(/[\[\]\(\),=;^]/g, adapt.cfi.escapeChar);

/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.unescapeChar = str => str.substr(1);


/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.unescape = str => {
    if (!str)
        return str;
    return str.replace(/\^[\[\]\(\),=;^]/g, adapt.cfi.unescapeChar);
};

/**
 * @param {string} extstr
 * @return {string|Array.<string>}
 */
adapt.cfi.parseExtVal = extstr => {
    const result = [];
    do {
        const r = extstr.match(/^(\^,|[^,])*/);
        const p = adapt.cfi.unescape(r[0]);
        extstr = extstr.substr(r[0].length + 1);
        if (!extstr && !result.length)
            return p;
        result.push(p);
    } while (extstr);
    return result;
};

/**
 * @param {string} extstr
 * @return {Object.<string,string|Array.<string>>}
 */
adapt.cfi.parseExt = extstr => {
    const ext = {};
    while (extstr) {
        const r = extstr.match(/^;([^;=]+)=(([^;]|\^;)*)/);
        if (!r) {
            return ext;
        }
        ext[r[1]] = adapt.cfi.parseExtVal(r[2]);
        extstr = extstr.substr(r[0].length);
    }
    return ext;
};

/**
 * @interface
 */
adapt.cfi.Step = function() {};

/**
 * @param {adapt.base.StringBuffer} sb
 * @return {void}
 */
adapt.cfi.Step.prototype.appendTo = sb => {};

/**
 * @param {adapt.cfi.Position} pos
 * @return {boolean}
 */
adapt.cfi.Step.prototype.applyTo = pos => {};

/**
 * @constructor
 * @implements {adapt.cfi.Step}
 */
adapt.cfi.RefStep = function() {};

/**
 * @param {adapt.base.StringBuffer} sb
 */
adapt.cfi.RefStep.prototype.appendTo = sb => {
    sb.append("!");
};

/**
 * @override
 */
adapt.cfi.RefStep.prototype.applyTo = pos => false;

/**
 * @constructor
 * @param {number} index
 * @param {?string} id
 * @param {?string} sideBias
 * @implements {adapt.cfi.Step}
 */
adapt.cfi.ChildStep = function(index, id, sideBias) {
    /** @const */ this.index = index;
    /** @const */ this.id = id;
    /** @const */ this.sideBias = sideBias;
};

/**
 * @override
 */
adapt.cfi.ChildStep.prototype.appendTo = function(sb) {
    sb.append("/");
    sb.append(this.index.toString());
    if (this.id || this.sideBias) {
        sb.append("[");
        if (this.id) {
            sb.append(this.id);
        }
        if (this.sideBias) {
            sb.append(";s=");
            sb.append(this.sideBias);
        }
        sb.append("]");
    }
};

/**
 * @override
 */
adapt.cfi.ChildStep.prototype.applyTo = function(pos) {
    if (pos.node.nodeType != 1) {
        throw new Error("E_CFI_NOT_ELEMENT");
    }
    const elem = /** @type {Element} */ (pos.node);
    const childElements = elem.children;
    const childElementCount = childElements.length;
    let child;
    const childIndex = Math.floor(this.index / 2) - 1;
    if (childIndex < 0 || childElementCount == 0) {
        child = elem.firstChild;
        pos.node = child || elem;
    } else {
        child = childElements[Math.min(childIndex, childElementCount - 1)];
        if (this.index & 1) {
            const next = child.nextSibling;
            if (!next || next.nodeType == 1) {
                pos.after = true;
            } else {
                child = next;
            }
        }
        pos.node = child;
    }
    if (this.id && (pos.after || this.id != adapt.cfi.getId(pos.node))) {
        throw new Error("E_CFI_ID_MISMATCH");
    }
    pos.sideBias = this.sideBias;
    return true;
};


/**
 * @constructor
 * @param {number} offset
 * @param {?string} textBefore
 * @param {?string} textAfter
 * @param {?string} sideBias
 * @implements {adapt.cfi.Step}
 */
adapt.cfi.OffsetStep = function(offset, textBefore, textAfter, sideBias) {
    /** @const */ this.offset = offset;
    /** @const */ this.textBefore = textBefore;
    /** @const */ this.textAfter = textAfter;
    /** @const */ this.sideBias = sideBias;
};

adapt.cfi.OffsetStep.prototype.applyTo = function(pos) {
    if (this.offset > 0 && !pos.after) {
        let offset = this.offset;
        let node = pos.node;
        while (true) {
            const nodeType = node.nodeType;
            if (nodeType == 1) {
                break;
            }
            const next = node.nextSibling;
            if (3 <= nodeType && nodeType <= 5) {
                const textLength = node.textContent.length;
                if (offset <= textLength) {
                    break;
                }
                if (!next) {
                    offset = textLength;
                    break;
                }
                offset -= textLength;
            }
            if (!next) {
                offset = 0;
                break;
            }
            node = next;
        }
        pos.node = node;
        pos.offset = offset;
    }
    pos.sideBias = this.sideBias;
    return true;
};

/**
 * @override
 */
adapt.cfi.OffsetStep.prototype.appendTo = function(sb) {
    sb.append(":");
    sb.append(this.offset.toString());
    if (this.textBefore || this.textAfter || this.sideBias) {
        sb.append("[");
        if (this.textBefore || this.textAfter) {
            if (this.textBefore) {
                sb.append(adapt.cfi.escape(this.textBefore));
            }
            sb.append(",");
            if (this.textAfter) {
                sb.append(adapt.cfi.escape(this.textAfter));
            }
        }
        if (this.sideBias) {
            sb.append(";s=");
            sb.append(this.sideBias);
        }
        sb.append("]");
    }
};


/**
 * @constructor
 */
adapt.cfi.Fragment = function() {
    /** @type {Array.<adapt.cfi.Step>} */ this.steps = null;
};

/**
 * @param {string} fragstr
 * @return {void}
 */
adapt.cfi.Fragment.prototype.fromString = function(fragstr) {
    let r = fragstr.match(/^#?epubcfi\((.*)\)$/);
    if (!r) {
        throw new Error("E_CFI_NOT_CFI");
    }
    const str = r[1];
    let i = 0;
    const steps = [];
    while (true) {
        switch (str.charAt(i)) {
            case "/":
                i++;
                r = str.substr(i).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);
                if (!r) {
                    throw new Error("E_CFI_NUMBER_EXPECTED");
                }
                i += r[0].length;
                const index = parseInt(r[1], 10);
                const id = r[3];
                var ext = adapt.cfi.parseExt(r[4]);
                steps.push(new adapt.cfi.ChildStep(index, id, adapt.base.asString(ext["s"])));
                break;
            case ":":
                i++;
                r = str.substr(i).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
                if (!r) {
                    throw new Error("E_CFI_NUMBER_EXPECTED");
                }
                i += r[0].length;
                const offset = parseInt(r[1], 10);
                let textBefore = r[4];
                if (textBefore) {
                    textBefore = adapt.cfi.unescape(textBefore);
                }
                let textAfter = r[7];
                if (textAfter) {
                    textAfter = adapt.cfi.unescape(textAfter);
                }
                var ext = adapt.cfi.parseExt(r[10]);
                steps.push(new adapt.cfi.OffsetStep(offset, textBefore, textAfter, adapt.base.asString(ext["s"])));
                break;
            case "!":
                i++;
                steps.push(new adapt.cfi.RefStep());
                break;
            case "~":
            case "@":
            // Time/space terminus; only useful for highlights/selections which are not yet
            // supported, skip for now.
            // fall through
            case "":
                this.steps = steps;
                return;
            default:
                throw new Error("E_CFI_PARSE_ERROR");
        }
    }
};

/**
 * @param {Document} doc
 * @return {adapt.cfi.Position}
 */
adapt.cfi.Fragment.prototype.navigate = function(doc) {
    const pos = {node:doc.documentElement, offset:0, after:false, sideBias:null, ref:null};
    for (let i = 0; i < this.steps.length; i++) {
        if (!this.steps[i].applyTo(pos)) {
            pos.ref = new adapt.cfi.Fragment();
            pos.ref.steps = this.steps.slice(i + 1);
            break;
        }
    }
    return pos;
};

/**
 * @param {string} text
 * @param {boolean} after
 * @return {string}
 */
adapt.cfi.Fragment.prototype.trim = (text, after) => text.replace(/\s+/g, " ").match(
    after ? /^[ -\uD7FF\uE000-\uFFFF]{0,8}/ : /[ -\uD7FF\uE000-\uFFFF]{0,8}$/
)[0].replace(/^\s/, "").replace(/\s$/, "");

/**
 * Initialize from a node and an offset.
 * @param {Node} node
 * @param {number} offset
 * @param {boolean} after
 * @param {?string} sideBias
 */
adapt.cfi.Fragment.prototype.prependPathFromNode = function(node, offset, after, sideBias) {
    const steps = [];
    let parent = node.parentNode;
    let textBefore = "";
    let textAfter = "";
    while (node) {
        switch (node.nodeType) {
            case 3:  // Text nodes
            case 4:
            case 5:
                const text = node.textContent;
                const textLength = text.length;
                if (after) {
                    offset += textLength;
                    if (!textBefore) {
                        textBefore = text;
                    }
                } else {
                    if (offset > textLength) {
                        offset = textLength;
                    }
                    after = true;
                    textBefore = text.substr(0, offset);
                    textAfter = text.substr(offset);
                }
                node = node.previousSibling;
                continue;
            case 8:  // Comment Node
                node = node.previousSibling;
                continue;
        }
        break;
    }
    if (offset > 0 || textBefore || textAfter) {
        textBefore = this.trim(textBefore, false);
        textAfter = this.trim(textAfter, true);
        steps.push(new adapt.cfi.OffsetStep(offset, textBefore, textAfter, sideBias));
        sideBias = null;
    }
    while (parent) {
        if (!parent || parent.nodeType == 9) {
            break;
        }
        const id = after ? null : adapt.cfi.getId(node);
        let index = after ? 1 : 0;
        while (node) {
            if (node.nodeType == 1) {
                index += 2;
            }
            node = node.previousSibling;
        }
        steps.push(new adapt.cfi.ChildStep(index, id, sideBias));
        sideBias = null;
        node = parent;
        parent = parent.parentNode;
        after = false;
    }
    steps.reverse();
    if (this.steps) {
        steps.push(new adapt.cfi.RefStep());
        this.steps = steps.concat(this.steps);
    } else {
        this.steps = steps;
    }
};

adapt.cfi.Fragment.prototype.toString = function() {
    if (!this.steps)
        return "";
    const sb = new adapt.base.StringBuffer();
    sb.append("epubcfi(");
    for (let i = 0; i < this.steps.length; i++) {
        this.steps[i].appendTo(sb);
    }
    sb.append(")");
    return sb.toString();
};
