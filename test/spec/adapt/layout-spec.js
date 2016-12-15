describe("layout", function() {

    describe("adapt.layout.TextNodeBreaker", function() {

        var breaker;
        var textNode, nodeContext;
        beforeEach(function() {
            breaker = new adapt.layout.TextNodeBreaker();

            textNode = {
                length: 17,
                data: 'abcdeabcde\u00ADf ghij',
                replaceData: function() {}
            };
            spyOn(textNode, 'replaceData').and.callThrough();

            nodeContext = new adapt.vtree.NodeContext({}, null, 3);
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

        describe("#resolveHyphenateCharacter", function() {
            it("returns a value of `hyphenateCharacter` in the nodeContext.", function() {
                expect(breaker.resolveHyphenateCharacter({
                    hyphenateCharacter: 'a',
                    parent: { hyphenateCharacter: 'b' }
                })).toEqual('a');
            });
            it("returns a value of `hyphenateCharacter` in the parent nodeContext if nodeContext's `hyphenateCharacter` is undefined.", function() {
                expect(breaker.resolveHyphenateCharacter({
                    parent: { hyphenateCharacter: 'b' }
                })).toEqual('b');
            });
            it("returns a default value if `hyphenateCharacter` of nodeContext and parent nodeContext are undefined.", function() {
                expect(breaker.resolveHyphenateCharacter({})).toEqual('-');
            });
        });

    });

});
