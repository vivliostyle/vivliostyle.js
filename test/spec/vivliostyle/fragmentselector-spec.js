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
describe("fragmentselector", function() {

    var NthFragmentMatcher = vivliostyle.fragmentselector.NthFragmentMatcher;
    var AllMatcher = vivliostyle.fragmentselector.AllMatcher;
    var MatcherBuilder = vivliostyle.fragmentselector.MatcherBuilder;
    var mergeStylesOfFragmentSelectors = vivliostyle.fragmentselector.mergeStylesOfFragmentSelectors;
    var setFragmentSelectorIds = vivliostyle.fragmentselector.setFragmentSelectorIds;

    describe("NthFragmentMatcher", function() {
        describe("#matches", function() {
            describe("nth-fragment(2n+1)", function() {
                var matcher = new NthFragmentMatcher("FS1", 2, 1);
                it("matches 1", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(true);
                });
                it("does not match 2", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 2
                    })).toBe(false);
                });
                it("matches 3", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 3
                    })).toBe(true);
                });
                it("does not match 4", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 4
                    })).toBe(false);
                });
                it("matches 5", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 5
                    })).toBe(true);
                });
                it("does not match 6", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 6
                    })).toBe(false);
                });

                it("matches 1 when nodeContext.fragmentSelectorIds includes fragmentSelectorId", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(true);

                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS2", "FS1", "FS3"],
                        fragmentIndex: 1
                    })).toBe(true);
                });
                it("does not matches 1 when nodeContext.fragmentSelectorIds does not include fragmentSelectorId", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: [],
                        fragmentIndex: 1
                    })).toBe(false);

                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS2", "FS3"],
                        fragmentIndex: 1
                    })).toBe(false);
                });
            });
            describe("nth-fragment(1)", function() {
                var matcher = new NthFragmentMatcher("FS1", 0, 1);
                it("matches 1", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(true);
                });
                it("does not match 2", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 2
                    })).toBe(false);
                });
                it("does not match 3", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 3
                    })).toBe(false);
                });
                it("does not match 4", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 4
                    })).toBe(false);
                });
                it("does not match 5", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 5
                    })).toBe(false);
                });
                it("does not match 6", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 6
                    })).toBe(false);
                });
            });
            describe("nth-fragment(4)", function() {
                var matcher = new NthFragmentMatcher("FS1", 0, 4);
                it("does not matche 1", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(false);
                });
                it("does not match 2", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 2
                    })).toBe(false);
                });
                it("does not match 3", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 3
                    })).toBe(false);
                });
                it("matches 4", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 4
                    })).toBe(true);
                });
                it("does not match 5", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 5
                    })).toBe(false);
                });
                it("does not match 6", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 6
                    })).toBe(false);
                });
            });
            describe("nth-fragment(n)", function() {
                var matcher = new NthFragmentMatcher("FS1", 1, 0);
                it("matches 1", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(true);
                });
                it("matches 2", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 2
                    })).toBe(true);
                });
                it("matches 3", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 3
                    })).toBe(true);
                });
                it("matches 4", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 4
                    })).toBe(true);
                });
                it("matches 5", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 5
                    })).toBe(true);
                });
                it("matches 6", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 6
                    })).toBe(true);
                });
            });
            describe("nth-fragment(2n)", function() {
                var matcher = new NthFragmentMatcher("FS1", 2, 0);
                it("does not matche 1", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 1
                    })).toBe(false);
                });
                it("matches 2", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 2
                    })).toBe(true);
                });
                it("does not matche 3", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 3
                    })).toBe(false);
                });
                it("matches 4", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 4
                    })).toBe(true);
                });
                it("does not matche 5", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 5
                    })).toBe(false);
                });
                it("matches 6", function() {
                    expect(matcher.matches({
                        fragmentSelectorIds: ["FS1"],
                        fragmentIndex: 6
                    })).toBe(true);
                });
            });
        });
    });

    describe("#mergeStylesOfFragmentSelectors", function() {
        it("merge styles associated with a fragment selector if the fragment selector matches a nodeContext", function() {
            var style = {
                _fragmentSelectors: {
                    "FS1_2_1": {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.block, 0),
                        "visivility": new adapt.csscasc.CascadeValue(adapt.css.ident.hidden, 0)
                    },
                    "FS2_2_1": {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.inline, 1)
                    }
                }
            };

            var cascMap = {};
            mergeStylesOfFragmentSelectors(cascMap, {}, style, {
                fragmentSelectorIds: ["FS1_2_1"],
                fragmentIndex: 3,
                parent: {
                    fragmentSelectorIds: [],
                    fragmentIndex: 6
                }
            });
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("block");
            expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe("hidden");

            cascMap = {};
            mergeStylesOfFragmentSelectors(cascMap, {}, style, {
                fragmentSelectorIds: ["FS1_2_X"],
                fragmentIndex: 3,
                parent: {
                    fragmentSelectorIds: ["FS2_2_1"],
                    fragmentIndex: 5
                }
            });
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("inline");
            expect(cascMap["visivility"]).toBe(undefined);

            cascMap = {};
            mergeStylesOfFragmentSelectors(cascMap, {}, style, {
                fragmentSelectorIds: ["FS1_2_1"],
                fragmentIndex: 3,
                parent: {
                    fragmentSelectorIds: ["FS2_2_1"],
                    fragmentIndex: 3
                }
            });
            expect(cascMap["display"].evaluate({}, "display").toString()).toBe("inline");
            expect(cascMap["visivility"].evaluate({}, "visivility").toString()).toBe("hidden");
        });

        it("do nothing if the fragment selector does not match a nodeContext", function() {
            var style = {
                _fragmentSelectors: {
                    "FS1_2_1": {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.block, 0),
                        "visivility": new adapt.csscasc.CascadeValue(adapt.css.ident.hidden, 0)
                    },
                    "FS2_2_1": {
                        "display": new adapt.csscasc.CascadeValue(adapt.css.ident.inline, 1)
                    }
                }
            };
            var cascMap = {};
            mergeStylesOfFragmentSelectors(cascMap, {}, style, {
                fragmentSelectorIds: ["FS1_2_X"],
                fragmentIndex: 3,
                parent: {
                    fragmentSelectorIds: [],
                    fragmentIndex: 6
                }
            });
            expect(cascMap["visivility"]).toBe(undefined);
            expect(cascMap["display"]).toBe(undefined);
        });

        it("do nothing if styles associated with fragment selectors are not registered", function() {
            var style = {};
            var cascMap = {};
            mergeStylesOfFragmentSelectors(cascMap, {}, style, {
                fragmentSelectorIds: ["FS1_2_1"],
                fragmentIndex: 3,
                parent: {
                    fragmentSelectorIds: ["FS2_2_1"],
                    fragmentIndex: 3
                }
            });
            expect(cascMap["visivility"]).toBe(undefined);
            expect(cascMap["display"]).toBe(undefined);
        });
    });

    describe("#setFragmentSelectorIds", function() {
        it("inserts fragment selector ids specified in the style into nodecontext.fragmentSelectorIds", function() {
            var style = {
                "fragment-selector-id": [
                    new adapt.csscasc.CascadeValue(adapt.css.getName("FS1_1_1"), 0),
                    new adapt.csscasc.CascadeValue(adapt.css.getName("FS2_1_1"), 0),
                    new adapt.csscasc.CascadeValue(adapt.css.empty, 0)
                ]
            };
            var nodeContext = {
                fragmentSelectorIds: []
            };
            setFragmentSelectorIds(style, {}, nodeContext);
            expect(nodeContext.fragmentSelectorIds).toEqual(["FS1_1_1", "FS2_1_1"]);
        });
        it("do nothing if the styles does not include 'fragment-selector-id'", function() {
            var style = {};
            var nodeContext = {
                fragmentSelectorIds: []
            };
            setFragmentSelectorIds(style, {}, nodeContext);
            expect(nodeContext.fragmentSelectorIds).toEqual([]);
        });
    });
});
