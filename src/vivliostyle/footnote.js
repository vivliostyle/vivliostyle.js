/**
 * Copyright 2017 Vivliostyle Inc.
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
 * @fileoverview Footnotes
 */
goog.provide("vivliostyle.footnote");

goog.require("vivliostyle.pagefloat");

goog.scope(function() {

    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;

    /**
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @constructor
     * @extends vivliostyle.pagefloat.PageFloat
     */
    vivliostyle.footnote.Footnote = function(nodePosition, floatReference) {
        PageFloat.call(this, nodePosition, floatReference, "block-end");
    };
    /** @const */ var Footnote = vivliostyle.footnote.Footnote;
    goog.inherits(Footnote, PageFloat);

    /**
     * @override
     */
    Footnote.prototype.getOrder = function() {
        return Infinity;
    };

});
