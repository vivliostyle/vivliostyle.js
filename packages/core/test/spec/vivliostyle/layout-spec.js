/**
 * Copyright 2017 Daishinsha Inc.
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

import * as adapt_layout from "../../../src/vivliostyle/layout";
import * as adapt_vtree from "../../../src/vivliostyle/vtree";
import * as adapt_css from "../../../src/vivliostyle/css";
import * as adapt_csscasc from "../../../src/vivliostyle/css-cascade";
import * as vivliostyle_matchers from "../../../src/vivliostyle/matchers";

describe("layout", function () {
  describe("adapt_layout.TextNodeBreaker", function () {
    var breaker;
    var textNode, nodeContext;
    beforeEach(function () {
      breaker = new adapt_layout.TextNodeBreaker();

      textNode = {
        length: 17,
        data: "abcdeabcde\u00ADf ghij",
        replaceData: function () {},
      };
      spyOn(textNode, "replaceData").and.callThrough();

      nodeContext = new adapt_vtree.NodeContext({}, null, 3);
      nodeContext.preprocessedTextContent = [
        [0, "abcdeabcde"],
        [1, "\u00AD"],
        [0, "f gh"],
        [1, "\u00AD"],
        [0, "j"],
      ];
      nodeContext.hyphenateCharacter = "_";
      nodeContext.offsetInNode = 0;
    });
    afterEach(function () {
      textNode.replaceData.calls.reset();
    });

    describe("#breakTextNode", function () {
      it("increments `offsetInNode` when nodeContext#after is true.", function () {
        nodeContext.after = true;
        var newContext = breaker.breakTextNode(textNode, nodeContext, 8);
        expect(newContext.offsetInNode).toEqual(17);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).not.toHaveBeenCalled();
      });
      it("removes characters after split point and inserts a hyphenation character when splits a text node at the soft-hyphen character.", function () {
        var newContext = breaker.breakTextNode(textNode, nodeContext, 13);
        expect(newContext.offsetInNode).toEqual(11);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).toHaveBeenCalledWith(10, 7, "_");
      });
      it("removes characters after split point but does not insert a hyphenation character when splits a text node at the soft-hyphen character and NodeContext#breakWord is true.", function () {
        nodeContext.breakWord = true;
        var newContext = breaker.breakTextNode(textNode, nodeContext, 13);
        expect(newContext.offsetInNode).toEqual(11);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).toHaveBeenCalledWith(10, 7, "");
      });
      it("removes characters after split point but does not insert a hyphenation character when splits a text node at the space character.", function () {
        var newContext = breaker.breakTextNode(textNode, nodeContext, 15);
        expect(newContext.offsetInNode).toEqual(13);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).toHaveBeenCalledWith(13, 4, "");
      });
      it("removes characters after split point and inserts a hyphenation character when splits a text node at the normal character.", function () {
        var newContext = breaker.breakTextNode(textNode, nodeContext, 10);
        expect(newContext.offsetInNode).toEqual(8);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).toHaveBeenCalledWith(8, 9, "_");
      });
      it("removes characters after split point but does not insert a hyphenation character when splits a text node at the normal character and NodeContext#breakWord is true.", function () {
        nodeContext.breakWord = true;
        var newContext = breaker.breakTextNode(textNode, nodeContext, 10);
        expect(newContext.offsetInNode).toEqual(8);
        expect(newContext.preprocessedTextContent).toEqual(
          newContext.preprocessedTextContent,
        );
        expect(textNode.replaceData).toHaveBeenCalledWith(8, 9, "");
      });
    });
  });

  describe("adapt_layout.resolveHyphenateCharacter", function () {
    it("returns a value of `hyphenateCharacter` in the nodeContext.", function () {
      expect(
        adapt_layout.resolveHyphenateCharacter({
          hyphenateCharacter: "a",
          parent: { hyphenateCharacter: "b" },
        }),
      ).toEqual("a");
    });
    it("returns a value of `hyphenateCharacter` in the parent nodeContext if nodeContext's `hyphenateCharacter` is undefined.", function () {
      expect(
        adapt_layout.resolveHyphenateCharacter({
          parent: { hyphenateCharacter: "b" },
        }),
      ).toEqual("b");
    });
    it("returns a default value if `hyphenateCharacter` of nodeContext and parent nodeContext are undefined.", function () {
      expect(adapt_layout.resolveHyphenateCharacter({})).toEqual("-");
    });
  });
});

describe("selectors", function () {
  const NthFragmentMatcher = vivliostyle_matchers.NthFragmentMatcher;
  const AllMatcher = vivliostyle_matchers.AllMatcher;
  const AnyMatcher = vivliostyle_matchers.AnyMatcher;
  const MatcherBuilder = vivliostyle_matchers.MatcherBuilder;
  const mergeViewConditionalStyles = adapt_csscasc.mergeViewConditionalStyles;
  const registerFragmentIndex = adapt_layout.registerFragmentIndex;
  const clearFragmentIndices = adapt_layout.clearFragmentIndices;

  beforeEach(function () {
    clearFragmentIndices();
  });

  describe("NthFragmentMatcher", function () {
    describe("#matches", function () {
      describe("nth-fragment(2n+1)", function () {
        var matcher = new NthFragmentMatcher(100, 2, 1);
        it("matches 1", function () {
          registerFragmentIndex(100, 1);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 2", function () {
          registerFragmentIndex(100, 2);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 3", function () {
          registerFragmentIndex(100, 3);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 4", function () {
          registerFragmentIndex(100, 4);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 5", function () {
          registerFragmentIndex(100, 5);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 6", function () {
          registerFragmentIndex(100, 6);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 1 when nodeContext.fragmentSelectorIds does not include fragmentSelectorId", function () {
          expect(matcher.matches()).toBe(false);
        });
      });
      describe("nth-fragment(1)", function () {
        var matcher = new NthFragmentMatcher(100, 0, 1);
        it("matches 1", function () {
          registerFragmentIndex(100, 1);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 2", function () {
          registerFragmentIndex(100, 2);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 3", function () {
          registerFragmentIndex(100, 3);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 4", function () {
          registerFragmentIndex(100, 4);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 5", function () {
          registerFragmentIndex(100, 5);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 6", function () {
          registerFragmentIndex(100, 6);
          expect(matcher.matches()).toBe(false);
        });
      });
      describe("nth-fragment(4)", function () {
        var matcher = new NthFragmentMatcher(100, 0, 4);
        it("does not match 1", function () {
          registerFragmentIndex(100, 1);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 2", function () {
          registerFragmentIndex(100, 2);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 3", function () {
          registerFragmentIndex(100, 3);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 4", function () {
          registerFragmentIndex(100, 4);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 5", function () {
          registerFragmentIndex(100, 5);
          expect(matcher.matches()).toBe(false);
        });
        it("does not match 6", function () {
          registerFragmentIndex(100, 6);
          expect(matcher.matches()).toBe(false);
        });
      });
      describe("nth-fragment(n)", function () {
        var matcher = new NthFragmentMatcher(100, 1, 0);
        it("matches 1", function () {
          registerFragmentIndex(100, 1);
          expect(matcher.matches()).toBe(true);
        });
        it("matches 2", function () {
          registerFragmentIndex(100, 2);
          expect(matcher.matches()).toBe(true);
        });
        it("matches 3", function () {
          registerFragmentIndex(100, 3);
          expect(matcher.matches()).toBe(true);
        });
        it("matches 4", function () {
          registerFragmentIndex(100, 4);
          expect(matcher.matches()).toBe(true);
        });
        it("matches 5", function () {
          registerFragmentIndex(100, 5);
          expect(matcher.matches()).toBe(true);
        });
        it("matches 6", function () {
          registerFragmentIndex(100, 6);
          expect(matcher.matches()).toBe(true);
        });
      });
      describe("nth-fragment(2n)", function () {
        var matcher = new NthFragmentMatcher(100, 2, 0);
        it("does not match 1", function () {
          registerFragmentIndex(100, 1);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 2", function () {
          registerFragmentIndex(100, 2);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 3", function () {
          registerFragmentIndex(100, 3);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 4", function () {
          registerFragmentIndex(100, 4);
          expect(matcher.matches()).toBe(true);
        });
        it("does not match 5", function () {
          registerFragmentIndex(100, 5);
          expect(matcher.matches()).toBe(false);
        });
        it("matches 6", function () {
          registerFragmentIndex(100, 6);
          expect(matcher.matches()).toBe(true);
        });
      });
    });
  });

  describe("AllMatcher", function () {
    describe("#matches", function () {
      it("matches If all matchers return true", function () {
        var matcher = new AllMatcher([
          {
            matches: function () {
              return true;
            },
          },
          {
            matches: function () {
              return true;
            },
          },
          {
            matches: function () {
              return true;
            },
          },
        ]);
        expect(matcher.matches()).toBe(true);
      });
      it("does not match if some matchers return false", function () {
        var matcher = new AllMatcher([
          {
            matches: function () {
              return true;
            },
          },
          {
            matches: function () {
              return false;
            },
          },
          {
            matches: function () {
              return true;
            },
          },
        ]);
        expect(matcher.matches()).toBe(false);
      });
    });
  });

  describe("AnyMatcher", function () {
    describe("#matches", function () {
      it("matches If some matchers return true", function () {
        var matcher = new AnyMatcher([
          {
            matches: function () {
              return false;
            },
          },
          {
            matches: function () {
              return true;
            },
          },
          {
            matches: function () {
              return false;
            },
          },
        ]);
        expect(matcher.matches()).toBe(true);
      });
      it("does not match if all matchers return false", function () {
        var matcher = new AnyMatcher([
          {
            matches: function () {
              return false;
            },
          },
          {
            matches: function () {
              return false;
            },
          },
          {
            matches: function () {
              return false;
            },
          },
        ]);
        expect(matcher.matches()).toBe(false);
      });
    });
  });

  describe("#mergeViewConditionalStyles", function () {
    it("merge styles associated with a fragment selector if the fragment selector matches a nodeContext", function () {
      var style = {
        _viewConditionalStyles: [
          {
            matcher: new NthFragmentMatcher(100, 2, 1),
            styles: {
              display: new adapt_csscasc.CascadeValue(adapt_css.ident.block, 0),
              visivility: new adapt_csscasc.CascadeValue(
                adapt_css.ident.hidden,
                0,
              ),
            },
          },
          {
            matcher: new NthFragmentMatcher(200, 2, 1),
            styles: {
              display: new adapt_csscasc.CascadeValue(
                adapt_css.ident.inline,
                1,
              ),
            },
          },
        ],
      };

      var cascMap = {};
      registerFragmentIndex(100, 3, 0);
      mergeViewConditionalStyles(cascMap, {}, style, {});
      expect(cascMap["display"].evaluate({}, "display").toString()).toBe(
        "block",
      );
      expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe(
        "hidden",
      );

      cascMap = {};
      registerFragmentIndex(100, 2, 0);
      registerFragmentIndex(200, 5, 0);
      mergeViewConditionalStyles(cascMap, {}, style, {});
      expect(cascMap["display"].evaluate({}, "display").toString()).toBe(
        "inline",
      );
      expect(cascMap["visivility"]).toBe(undefined);

      cascMap = {};
      registerFragmentIndex(100, 3, 0);
      registerFragmentIndex(200, 3, 0);
      mergeViewConditionalStyles(cascMap, {}, style, {});
      expect(cascMap["display"].evaluate({}, "display").toString()).toBe(
        "inline",
      );
      expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe(
        "hidden",
      );
    });

    it("do nothing if the fragment selector does not match a nodeContext", function () {
      var style = {
        _viewConditionalStyles: [
          {
            matcher: {
              matches: function () {
                return false;
              },
            },
            styles: {
              display: new adapt_csscasc.CascadeValue(adapt_css.ident.block, 0),
              visivility: new adapt_csscasc.CascadeValue(
                adapt_css.ident.hidden,
                0,
              ),
            },
          },
          {
            matcher: {
              matches: function () {
                return false;
              },
            },
            styles: {
              display: new adapt_csscasc.CascadeValue(
                adapt_css.ident.inline,
                1,
              ),
            },
          },
        ],
      };
      var cascMap = {};
      registerFragmentIndex(100, 2, 0);
      mergeViewConditionalStyles(cascMap, {}, style, {});
      expect(cascMap["visivility"]).toBe(undefined);
      expect(cascMap["display"]).toBe(undefined);
    });

    it("do nothing if styles associated with fragment selectors are not registered", function () {
      var style = {};
      var cascMap = {};
      registerFragmentIndex(100, 3, 0);
      registerFragmentIndex(200, 3, 0);
      mergeViewConditionalStyles(cascMap, {}, style, {});
      expect(cascMap["visivility"]).toBe(undefined);
      expect(cascMap["display"]).toBe(undefined);
    });
  });
});
