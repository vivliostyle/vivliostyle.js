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
 */
describe("selectors", function() {

    var NthFragmentMatcher = vivliostyle.selectors.NthFragmentMatcher;
    var AllMatcher = vivliostyle.selectors.AllMatcher;
    var AnyMatcher = vivliostyle.selectors.AnyMatcher;
    var MatcherBuilder = vivliostyle.selectors.MatcherBuilder;
    var mergeViewConditionalStyles = vivliostyle.selectors.mergeViewConditionalStyles;
    var registerFragmentIndex = vivliostyle.selectors.registerFragmentIndex;
    var clearFragmentIndices = vivliostyle.selectors.clearFragmentIndices;

    beforeEach(function() {
        clearFragmentIndices();
    });

    describe("NthFragmentMatcher", function() {
        describe("#matches", function() {
            describe("nth-fragment(2n+1)", function() {
                var matcher = new NthFragmentMatcher(100, 2, 1);
                it("matches 1", function() {
                    registerFragmentIndex(100, 1);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 2", function() {
                    registerFragmentIndex(100, 2);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 3", function() {
                    registerFragmentIndex(100, 3);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 4", function() {
                    registerFragmentIndex(100, 4);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 5", function() {
                    registerFragmentIndex(100, 5);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 6", function() {
                    registerFragmentIndex(100, 6);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 1 when nodeContext.fragmentSelectorIds does not include fragmentSelectorId", function() {
                    expect(matcher.matches()).toBe(false);
                });
            });
            describe("nth-fragment(1)", function() {
                var matcher = new NthFragmentMatcher(100, 0, 1);
                it("matches 1", function() {
                    registerFragmentIndex(100, 1);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 2", function() {
                    registerFragmentIndex(100, 2);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 3", function() {
                    registerFragmentIndex(100, 3);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 4", function() {
                    registerFragmentIndex(100, 4);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 5", function() {
                    registerFragmentIndex(100, 5);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 6", function() {
                    registerFragmentIndex(100, 6);
                    expect(matcher.matches()).toBe(false);
                });
            });
            describe("nth-fragment(4)", function() {
                var matcher = new NthFragmentMatcher(100, 0, 4);
                it("does not match 1", function() {
                    registerFragmentIndex(100, 1);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 2", function() {
                    registerFragmentIndex(100, 2);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 3", function() {
                    registerFragmentIndex(100, 3);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 4", function() {
                    registerFragmentIndex(100, 4);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 5", function() {
                    registerFragmentIndex(100, 5);
                    expect(matcher.matches()).toBe(false);
                });
                it("does not match 6", function() {
                    registerFragmentIndex(100, 6);
                    expect(matcher.matches()).toBe(false);
                });
            });
            describe("nth-fragment(n)", function() {
                var matcher = new NthFragmentMatcher(100, 1, 0);
                it("matches 1", function() {
                    registerFragmentIndex(100, 1);
                    expect(matcher.matches()).toBe(true);
                });
                it("matches 2", function() {
                    registerFragmentIndex(100, 2);
                    expect(matcher.matches()).toBe(true);
                });
                it("matches 3", function() {
                    registerFragmentIndex(100, 3);
                    expect(matcher.matches()).toBe(true);
                });
                it("matches 4", function() {
                    registerFragmentIndex(100, 4);
                    expect(matcher.matches()).toBe(true);
                });
                it("matches 5", function() {
                    registerFragmentIndex(100, 5);
                    expect(matcher.matches()).toBe(true);
                });
                it("matches 6", function() {
                    registerFragmentIndex(100, 6);
                    expect(matcher.matches()).toBe(true);
                });
            });
            describe("nth-fragment(2n)", function() {
                var matcher = new NthFragmentMatcher(100, 2, 0);
                it("does not match 1", function() {
                    registerFragmentIndex(100, 1);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 2", function() {
                    registerFragmentIndex(100, 2);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 3", function() {
                    registerFragmentIndex(100, 3);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 4", function() {
                    registerFragmentIndex(100, 4);
                    expect(matcher.matches()).toBe(true);
                });
                it("does not match 5", function() {
                    registerFragmentIndex(100, 5);
                    expect(matcher.matches()).toBe(false);
                });
                it("matches 6", function() {
                    registerFragmentIndex(100, 6);
                    expect(matcher.matches()).toBe(true);
                });
            });
        });
    });

    describe("AllMatcher", function() {
        describe("#matches", function() {
            it("matches If all matchers return true", function() {
                var matcher = new AllMatcher([
                    {matches: function() { return true; }},
                    {matches: function() { return true; }},
                    {matches: function() { return true; }}
                ]);
                expect(matcher.matches()).toBe(true);
            });
            it("does not match if some matchers return false", function() {
                var matcher = new AllMatcher([
                    {matches: function() { return true; }},
                    {matches: function() { return false; }},
                    {matches: function() { return true; }}
                ]);
                expect(matcher.matches()).toBe(false);
            });
        });
    });

    describe("AnyMatcher", function() {
        describe("#matches", function() {
            it("matches If some matchers return true", function() {
                var matcher = new AnyMatcher([
                    {matches: function() { return false; }},
                    {matches: function() { return true; }},
                    {matches: function() { return false; }}
                ]);
                expect(matcher.matches()).toBe(true);
            });
            it("does not match if all matchers return false", function() {
                var matcher = new AnyMatcher([
                    {matches: function() { return false; }},
                    {matches: function() { return false; }},
                    {matches: function() { return false; }}
                ]);
                expect(matcher.matches()).toBe(false);
            });
        });
    });

    describe("#mergeViewConditionalStyles", function() {
        it("merge styles associated with a fragment selector if the fragment selector matches a nodeContext", function() {
            var style = {
                _viewConditionalStyles: [{
                    matcher: new NthFragmentMatcher(100, 2, 1),
                    styles: {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.block, 0),
                        "visivility": new adapt.csscasc.CascadeValue(adapt.css.ident.hidden, 0)
                    }
                }, {
                    matcher: new NthFragmentMatcher(200, 2, 1),
                    styles: {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.inline, 1)
                    }
                }]
            };

            var cascMap = {};
            registerFragmentIndex(100, 3);
            mergeViewConditionalStyles(cascMap, {}, style, {});
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("block");
            expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe("hidden");

            cascMap = {};
            registerFragmentIndex(100, 2);
            registerFragmentIndex(200, 5);
            mergeViewConditionalStyles(cascMap, {}, style, {});
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("inline");
            expect(cascMap["visivility"]).toBe(undefined);

            cascMap = {};
            registerFragmentIndex(100, 3);
            registerFragmentIndex(200, 3);
            mergeViewConditionalStyles(cascMap, {}, style, {});
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("inline");
            expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe("hidden");
        });

        it("do nothing if the fragment selector does not match a nodeContext", function() {
            var style = {
                _viewConditionalStyles: [{
                    matcher: {matches: function() { return false; }},
                    styles: {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.block, 0),
                        "visivility": new adapt.csscasc.CascadeValue(adapt.css.ident.hidden, 0)
                    }
                }, {
                    matcher: {matches: function() { return false; }},
                    styles: {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.inline, 1)
                    }
                }]
            };
            var cascMap = {};
            registerFragmentIndex(100, 2);
            mergeViewConditionalStyles(cascMap, {}, style, {});
            expect(cascMap["visivility"]).toBe(undefined);
            expect(cascMap["display"]).toBe(undefined);
        });

        it("do nothing if styles associated with fragment selectors are not registered", function() {
            var style = {};
            var cascMap = {};
            registerFragmentIndex(100, 3);
            registerFragmentIndex(200, 3);
            mergeViewConditionalStyles(cascMap, {}, style, {});
            expect(cascMap["visivility"]).toBe(undefined);
            expect(cascMap["display"]).toBe(undefined);
        });
    });
});
