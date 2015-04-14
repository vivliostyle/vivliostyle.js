/**
 * Copyright 2013 Google, Inc.
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
adapt.cfi.getId = function(node) {
	if (node.nodeType == 1) {
		var idtxt = (/** @type {Element} */ (node)).getAttribute("id");
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
adapt.cfi.escapeChar = function(ch) {
	return "^" + ch;
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.escape = function(str) {
	return str.replace(/[\[\]\(\),=;^]/g, adapt.cfi.escapeChar);
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.unescapeChar = function(str) {
	return str.substr(1);
};


/**
 * @param {string} str
 * @return {string}
 */
adapt.cfi.unescape = function(str) {
	if (!str)
		return str;
	return str.replace(/\^[\[\]\(\),=;^]/g, adapt.cfi.unescapeChar);
};

/**
 * @param {string} extstr
 * @return {string|Array.<string>}
 */
adapt.cfi.parseExtVal = function(extstr) {
	var result = [];
	do {
		var r = extstr.match(/^(\^,|[^,])*/);
		var p = adapt.cfi.unescape(r[0]);
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
adapt.cfi.parseExt = function(extstr) {
	var ext = {};
	while(extstr) {
		var r = extstr.match(/^;([^;=]+)=(([^;]|\^;)*)/);
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
adapt.cfi.Step.prototype.appendTo = function(sb) {};

/**
 * @param {adapt.cfi.Position} pos
 * @return {boolean}
 */
adapt.cfi.Step.prototype.applyTo = function(pos) {};

/**
 * @constructor
 * @implements {adapt.cfi.Step}
 */
adapt.cfi.RefStep = function() {};

/**
 * @param {adapt.base.StringBuffer} sb
 */
adapt.cfi.RefStep.prototype.appendTo = function(sb) {
	sb.append("!");
};

/**
 * @override
 */
adapt.cfi.RefStep.prototype.applyTo = function(pos) {
	return false;
};

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
	var elem = /** @type {Element} */ (pos.node);
	var childElements = elem.children;
	var childElementCount = childElements.length;
	var child;
	var childIndex = Math.floor(this.index / 2) - 1;
	if (childIndex < 0 || childElementCount == 0) {
		child = elem.firstChild;
		pos.node = child || elem;
	} else {
		child = childElements[Math.min(childIndex, childElementCount - 1)];
		if (this.index & 1) {
			var next = child.nextSibling;
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
		var offset = this.offset;
		var node = pos.node;
		while (true) {
			var nodeType = node.nodeType;
			if (nodeType == 1) {
				break;
			}
			var next = node.nextSibling;
			if (3 <= nodeType && nodeType <= 5) {
				var textLength = node.textContent.length;
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
	var r = fragstr.match(/^#?epubcfi\((.*)\)$/);
	if (!r) {
		throw new Error("E_CFI_NOT_CFI");
	}
	var str = r[1];
	var i = 0;
	var steps = [];
	while(true) {
		switch (str.charAt(i)) {
		case "/":
			i++;
			r = str.substr(i).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);
			if (!r) {
				throw new Error("E_CFI_NUMBER_EXPECTED");				
			}
			i += r[0].length;
			var index = parseInt(r[1], 10);
			var id = r[3];
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
			var offset = parseInt(r[1], 10);
			var textBefore = r[4];
			if (textBefore) {
				textBefore = adapt.cfi.unescape(textBefore);
			}
			var textAfter = r[7];
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
	var pos = {node:doc.documentElement, offset:0, after:false, sideBias:null, ref:null};
	for (var i = 0; i < this.steps.length; i++) {
		if (!this.steps[i].applyTo(pos)) {
			if (++i < this.steps.length) {
				pos.ref = new adapt.cfi.Fragment();
				pos.ref.steps = this.steps.slice(i);
			}
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
adapt.cfi.Fragment.prototype.trim = function(text, after) {
	return text.replace(/\s+/g, " ").match(
			after ? /^[ -\uD7FF\uE000-\uFFFF]{0,8}/ : /[ -\uD7FF\uE000-\uFFFF]{0,8}$/
		)[0].replace(/^\s/, "").replace(/\s$/, "");
};

/**
 * Initialize from a node and an offset.
 * @param {Node} node
 * @param {number} offset
 * @param {boolean} after
 * @param {?string} sideBias
 */
adapt.cfi.Fragment.prototype.prependPathFromNode = function(node, offset, after, sideBias) {
	var steps = [];
	var parent = node.parentNode;
	var textBefore = "";
	var textAfter = "";
	while(node) {
		switch (node.nodeType) {
		case 3:  // Text nodes
		case 4:
		case 5:
			var text = node.textContent;
			var textLength = text.length;
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
 		var id = after ? null : adapt.cfi.getId(node);
 		var index = after ? 1 : 0;
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
	var sb = new adapt.base.StringBuffer();
	sb.append("epubcfi(");
	for (var i = 0; i < this.steps.length; i++) {
		this.steps[i].appendTo(sb);
	}
	sb.append(")");
	return sb.toString();	
};