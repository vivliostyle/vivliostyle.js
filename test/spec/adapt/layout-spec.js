/**
 * Copyright 2017 Trim-marks Inc.
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
 */

import * as adapt_layout from "../../../src/ts/adapt/layout";
import * as adapt_vtree from "../../../src/ts/adapt/vtree";

describe("layout", function() {

    describe("adapt_layout.TextNodeBreaker", function() {

        var breaker;
        var textNode, nodeContext;
        beforeEach(function() {
            breaker = new adapt_layout.TextNodeBreaker();

            textNode = {
                length: 17,
                data: 'abcdeabcde\u00ADf ghij',
                replaceData: function() {}
            };
            spyOn(textNode, 'replaceData').and.callThrough();

            nodeContext = new adapt_vtree.NodeContext({}, null, 3);
            nodeContext.preprocessedTextContent =
                [[0, 'abcdeabcde'], [1, '\u00AD'], [0, 'f gh'], [1, '\u00AD'], [0, 'j']];
            nodeContext.hyphenateCharacter = '_';
            nodeContext.offsetInNode = 0;
        });
        afterEach(function() {
            textNode.replaceData.calls.reset();
        });

        describe("#breakTextNode", function() {
            it("increments `offsetInNode` when nodeContext#after is true.", function() {
                nodeContext.after = true;
                var newContext = breaker.breakTextNode(textNode, nodeContext, 8);
                expect(newContext.offsetInNode).toEqual(17);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).not.toHaveBeenCalled();
            });
            it("removes characters after split point and inserts a hyphenation character when splits a text node at the soft-hyphen character.", function() {
                var newContext = breaker.breakTextNode(textNode, nodeContext, 13);
                expect(newContext.offsetInNode).toEqual(11);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).toHaveBeenCalledWith(10, 7, '_');
            });
            it("removes characters after split point but does not insert a hyphenation character when splits a text node at the soft-hyphen character and NodeContext#breakWord is true.", function() {
                nodeContext.breakWord = true;
                var newContext = breaker.breakTextNode(textNode, nodeContext, 13);
                expect(newContext.offsetInNode).toEqual(11);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).toHaveBeenCalledWith(10, 7, '');
            });
            it("removes characters after split point but does not insert a hyphenation character when splits a text node at the space character.", function() {
                var newContext = breaker.breakTextNode(textNode, nodeContext, 15);
                expect(newContext.offsetInNode).toEqual(13);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).toHaveBeenCalledWith(13, 4, '');
            });
            it("removes characters after split point and inserts a hyphenation character when splits a text node at the normal character.", function() {
                var newContext = breaker.breakTextNode(textNode, nodeContext, 10);
                expect(newContext.offsetInNode).toEqual(8);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).toHaveBeenCalledWith(8, 9, '_');
            });
            it("removes characters after split point but does not insert a hyphenation character when splits a text node at the normal character and NodeContext#breakWord is true.", function() {
                nodeContext.breakWord = true;
                var newContext = breaker.breakTextNode(textNode, nodeContext, 10);
                expect(newContext.offsetInNode).toEqual(8);
                expect(newContext.preprocessedTextContent).toEqual(newContext.preprocessedTextContent);
                expect(textNode.replaceData).toHaveBeenCalledWith(8, 9, '');
            });
        });

    });

    describe("adapt_layout.resolveHyphenateCharacter", function() {
        it("returns a value of `hyphenateCharacter` in the nodeContext.", function() {
            expect(adapt_layout.resolveHyphenateCharacter({
                hyphenateCharacter: 'a',
                parent: { hyphenateCharacter: 'b' }
            })).toEqual('a');
        });
        it("returns a value of `hyphenateCharacter` in the parent nodeContext if nodeContext's `hyphenateCharacter` is undefined.", function() {
            expect(adapt_layout.resolveHyphenateCharacter({
                parent: { hyphenateCharacter: 'b' }
            })).toEqual('b');
        });
        it("returns a default value if `hyphenateCharacter` of nodeContext and parent nodeContext are undefined.", function() {
            expect(adapt_layout.resolveHyphenateCharacter({})).toEqual('-');
        });
    });

});
