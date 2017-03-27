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
describe("csscasc", function() {
    describe("IsNthSiblingAction", function() {
        it("when a=0, matches if currentSiblingOrder=b", function() {
            var action = new adapt.csscasc.IsNthSiblingAction(0, 3);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 1});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 3});
            expect(chained.apply).toHaveBeenCalled();
        });

        it("when a is non-zero, matches if non-negative n which satisfies currentSiblingOrder=an+b exists", function() {

            var action = new adapt.csscasc.IsNthSiblingAction(3, 0);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 1});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 2});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 3});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 4});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 5});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 6});
            expect(chained.apply).toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingAction(2, 3);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 1});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 2});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 3});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 4});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 5});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 6});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 7});
            expect(chained.apply).toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingAction(-3, 0);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 1});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 2});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 3});
            expect(chained.apply).not.toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingAction(-2, 5);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 1});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 2});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 3});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 4});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 5});
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply({currentSiblingOrder: 6});
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply({currentSiblingOrder: 7});
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("IsNthSiblingOfTypeAction", function() {
        function dummyCascadeInstance(counts) {
            var element = {namespaceURI: "foo", localName: "bar"};
            var currentSiblingTypeCounts = {};
            currentSiblingTypeCounts[element.namespaceURI] = counts;
            return {
                currentSiblingTypeCounts: currentSiblingTypeCounts,
                currentNamespace: element.namespaceURI,
                currentLocalName: element.localName
            };
        }

        it("when a=0, matches if currentSiblingTypeCounts[namespace][locaName]=b", function() {
            var action = new adapt.csscasc.IsNthSiblingOfTypeAction(0, 3);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 1, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 3, "baz": 3}));
            expect(chained.apply).toHaveBeenCalled();
        });

        it("when a is non-zero, matches if non-negative n which satisfies currentSiblingTypeCounts[namespace][locaName]=an+b exists", function() {

            var action = new adapt.csscasc.IsNthSiblingOfTypeAction(3, 0);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 1, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 2, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 3, "baz": 1}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 4, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 5, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 6, "baz": 1}));
            expect(chained.apply).toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingOfTypeAction(2, 3);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 1, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 2, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 3, "baz": 1}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 4, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 5, "baz": 1}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 6, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 7, "baz": 3}));
            expect(chained.apply).toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingOfTypeAction(-3, 0);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 1, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 2, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 3, "baz": 3}));
            expect(chained.apply).not.toHaveBeenCalled();

            action = new adapt.csscasc.IsNthSiblingOfTypeAction(-2, 5);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 1, "baz": 2}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 2, "baz": 1}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 3, "baz": 2}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 4, "baz": 1}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 5, "baz": 2}));
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            action.apply(dummyCascadeInstance({"bar": 6, "baz": 1}));
            expect(chained.apply).not.toHaveBeenCalled();

            action.apply(dummyCascadeInstance({"bar": 7, "baz": 1}));
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("IsNthLastSiblingAction", function() {
        function dummyCascadeInstance(count) {
            return {
                currentFollowingSiblingOrder: null,
                currentSiblingOrder: 3,
                currentElement: { parentNode: { childElementCount: count } }
            };
        }

        it("when a=0, matches if currentFollowingSiblingOrder=b", function() {
            var action = new adapt.csscasc.IsNthLastSiblingAction(0, 3);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            var cascadeInstance = dummyCascadeInstance(4);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(2);

            cascadeInstance = dummyCascadeInstance(5);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(3);
        });

        it("when a is non-zero, matches if non-negative n which satisfies currentFollowingSiblingOrder=an+b exists", function() {

            var action = new adapt.csscasc.IsNthLastSiblingAction(3, 0);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            var cascadeInstance = dummyCascadeInstance(3);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(1);

            cascadeInstance = dummyCascadeInstance(4);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(2);

            cascadeInstance = dummyCascadeInstance(5);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(3);

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(6);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(4);

            cascadeInstance = dummyCascadeInstance(7);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(5);

            cascadeInstance = dummyCascadeInstance(8);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(6);

            action = new adapt.csscasc.IsNthLastSiblingAction(2, 3);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(3);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(1);

            cascadeInstance = dummyCascadeInstance(4);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(2);

            cascadeInstance = dummyCascadeInstance(5);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(3);

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(6);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(4);

            cascadeInstance = dummyCascadeInstance(7);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(5);

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(8);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(6);

            cascadeInstance = dummyCascadeInstance(9);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(7);

            action = new adapt.csscasc.IsNthLastSiblingAction(-3, 0);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(3);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(1);

            cascadeInstance = dummyCascadeInstance(4);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(2);

            cascadeInstance = dummyCascadeInstance(5);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(3);

            action = new adapt.csscasc.IsNthLastSiblingAction(-2, 5);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(3);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(1);

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(4);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(2);

            cascadeInstance = dummyCascadeInstance(5);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(3);

            cascadeInstance = dummyCascadeInstance(6);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(4);

            cascadeInstance = dummyCascadeInstance(7);
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(5);

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance(8);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(6);

            cascadeInstance = dummyCascadeInstance(9);
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingOrder).toBe(7);
        });
    });

    describe("IsNthLastSiblingOfTypeAction", function() {
        function dummyCascadeInstance(counts) {
            var currentElement = {namespaceURI: "foo", localName: "bar"};
            var element = currentElement;
            Object.keys(counts).forEach(function(name) {
                for (var i = counts[name]; i > 0; i--) {
                    element = element.nextElementSibling = {
                        namespaceURI: currentElement.namespaceURI,
                        localName: name
                    };
                }
            });
            return {
                currentFollowingSiblingTypeCounts: {},
                currentNamespace: currentElement.namespaceURI,
                currentLocalName: currentElement.localName,
                currentElement: currentElement
            };
        }

        it("when a=0, matches if currentFollowingSiblingTypeCounts[namespace][locaName]=b", function() {
            var action = new adapt.csscasc.IsNthLastSiblingOfTypeAction(0, 3);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            var cascadeInstance = dummyCascadeInstance({"bar": 1, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 2, "baz": 2} });

            cascadeInstance = dummyCascadeInstance({"bar": 2, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 3, "baz": 1} });
        });

        it("when a is non-zero, matches if non-negative n which satisfies currentFollowingSiblingTypeCounts[namespace][locaName]=an+b exists", function() {

            var action = new adapt.csscasc.IsNthLastSiblingOfTypeAction(3, 0);
            var chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            var cascadeInstance = dummyCascadeInstance({"bar": 0, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 1, "baz": 2} });

            cascadeInstance = dummyCascadeInstance({"bar": 1, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 2, "baz": 2} });

            cascadeInstance = dummyCascadeInstance({"bar": 2, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 3, "baz": 1} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 3, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 4, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 4, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 5, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 5, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 6, "baz": 1} });

            action = new adapt.csscasc.IsNthLastSiblingOfTypeAction(2, 3);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 0, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 1, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 1, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 2, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 2, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 3, "baz": 1} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 3, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 4, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 4, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 5, "baz": 1} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 5, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 6, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 6, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 7, "baz": 3} });

            action = new adapt.csscasc.IsNthLastSiblingOfTypeAction(-3, 0);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 0, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 1, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 1, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 2, "baz": 3} });

            cascadeInstance = dummyCascadeInstance({"bar": 2, "baz": 3});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 3, "baz": 3} });

            action = new adapt.csscasc.IsNthLastSiblingOfTypeAction(-2, 5);
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 0, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 1, "baz": 2} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 1, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 2, "baz": 1} });

            cascadeInstance = dummyCascadeInstance({"bar": 2, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 3, "baz": 2} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 3, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 4, "baz": 1} });

            cascadeInstance = dummyCascadeInstance({"bar": 4, "baz": 2});
            action.apply(cascadeInstance);
            expect(chained.apply).toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 5, "baz": 2} });

            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);

            cascadeInstance = dummyCascadeInstance({"bar": 5, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 6, "baz": 1} });

            cascadeInstance = dummyCascadeInstance({"bar": 6, "baz": 1});
            action.apply(cascadeInstance);
            expect(chained.apply).not.toHaveBeenCalled();
            expect(cascadeInstance.currentFollowingSiblingTypeCounts).toEqual({ "foo": {"bar": 7, "baz": 1} });
        });
    });

    describe("IsEmptyAction", function() {
        function dummyCascadeInstance(children) {
            if (children) {
                var node = children[0];
                for (var i = 1; i < children.length; i++) {
                    node = node.nextSibling = children[i];
                }
            }
            return {currentElement: {firstChild: children ? children[0] : null}};
        }

        var action = new adapt.csscasc.IsEmptyAction();
        var chained;

        beforeEach(function() {
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);
        });

        it("applies if the element has no children", function() {
            action.apply(dummyCascadeInstance(null));
            expect(chained.apply).toHaveBeenCalled();
        });

        it("applies if the element has only comment nodes or empty text nodes (length=0) as its children", function() {
            action.apply(dummyCascadeInstance([
                {nodeType: Node.COMMENT_NODE, length: 10},
                {nodeType: Node.TEXT_NODE, length: 0}
            ]));
            expect(chained.apply).toHaveBeenCalled();
        });

        it("not applies if the element has an element child", function() {
            action.apply(dummyCascadeInstance([
                {nodeType: Node.ELEMENT_NODE}
            ]));
            expect(chained.apply).not.toHaveBeenCalled();
        });

        it("not applies if the element has a non-empty text node as a child", function() {
            action.apply(dummyCascadeInstance([
                {nodeType: Node.TEXT_NODE, length: 1}
            ]));
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("IsEnabledAction", function() {
        var action = new adapt.csscasc.IsEnabledAction();
        var chained;

        beforeEach(function() {
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);
        });

        it("applies if the element's 'disabled' property is false (not undefined)", function() {
            action.apply({currentElement: {disabled: false}});
            expect(chained.apply).toHaveBeenCalled();
        });

        it("not applies if the element's 'disabled' property is true", function() {
            action.apply({currentElement: {disabled: true}});
            expect(chained.apply).not.toHaveBeenCalled();
        });

        it("applies if the element does not have 'disabled' property", function() {
            action.apply({currentElement: {}});
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("IsDisabledAction", function() {
        var action = new adapt.csscasc.IsDisabledAction();
        var chained;

        beforeEach(function() {
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);
        });

        it("applies if the element's 'disabled' property is true", function() {
            action.apply({currentElement: {disabled: true}});
            expect(chained.apply).toHaveBeenCalled();
        });

        it("not applies if the element's 'disabled' property is false (not undefined)", function() {
            action.apply({currentElement: {disabled: false}});
            expect(chained.apply).not.toHaveBeenCalled();
        });

        it("applies if the element does not have 'disabled' property", function() {
            action.apply({currentElement: {}});
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("IsCheckedAction", function() {
        var action = new adapt.csscasc.IsCheckedAction();
        var chained;

        beforeEach(function() {
            chained = action.chained = jasmine.createSpyObj("chianed", ["apply"]);
        });

        it("applies if the element's 'selected' property is true", function() {
            action.apply({currentElement: {selected: true}});
            expect(chained.apply).toHaveBeenCalled();
        });

        it("applies if the element's 'checked' property is true", function() {
            action.apply({currentElement: {checked: true}});
            expect(chained.apply).toHaveBeenCalled();
        });

        it("not applies if the element's 'selected' property is false (not undefined)", function() {
            action.apply({currentElement: {selected: false}});
            expect(chained.apply).not.toHaveBeenCalled();
        });

        it("not applies if the element's 'checked' property is false (not undefined)", function() {
            action.apply({currentElement: {checked: false}});
            expect(chained.apply).not.toHaveBeenCalled();
        });

        it("applies if the element does not have 'selected' nor 'checked' property", function() {
            action.apply({currentElement: {}});
            expect(chained.apply).not.toHaveBeenCalled();
        });
    });

    describe("CascadeParserHandler", function() {
        describe("simpleProperty", function() {
            vivliostyle.test.util.mock.plugin.setup();

            it("convert property declaration by calling functions registered to 'SIMPLE_PROPERTY' hook", function() {
                function hook1(original) {
                    return {
                        "name": original["name"] + "1",
                        "value": adapt.css.getName(original["value"].stringValue() + "1"),
                        "important": original["important"]
                    };
                }

                function hook2(original) {
                    return {
                        "name": original["name"] + "2",
                        "value": adapt.css.getName(original["value"].stringValue() + "2"),
                        "important": !original["important"]
                    };
                }

                var handler = new adapt.csscasc.CascadeParserHandler();
                var style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                var originalPriority = style["foo"].priority;
                expect(style["foo"].value).toBe(adapt.css.getName("bar"));

                vivliostyle.plugin.registerHook("SIMPLE_PROPERTY", hook1);
                style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                expect("foo" in style).toBe(false);
                expect(style["foo1"].value).toBe(adapt.css.getName("bar1"));
                expect(style["foo1"].priority).toBe(originalPriority);

                vivliostyle.plugin.registerHook("SIMPLE_PROPERTY", hook2);
                style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                expect("foo1" in style).toBe(false);
                expect(style["foo12"].value).toBe(adapt.css.getName("bar12"));
                expect(style["foo12"].priority).not.toBe(originalPriority);
            });
        });

        describe("attributeSelector", function() {
            var handler;

            beforeEach(function() {
                handler = new adapt.csscasc.CascadeParserHandler();
                handler.startSelectorRule();
            });

            describe("Attribute presence selector", function() {
                it("use CheckAttributePresentAction when the operator is EOF (no operator)", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.EOF, null);

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributePresentAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                });
            });

            describe("Attribute equality selector", function() {
                it("use CheckAttributeEqAction when the operator is '='", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeEqAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    expect(action.value).toBe("bar");
                });
            });

            describe("~= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is not empty and contains no whitespaces", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("a bar b".match(regexp)).toBeTruthy();
                    expect("abar b".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value contains whitespaces", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "b c");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("|= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.BAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeTruthy();
                    expect("barb".match(regexp)).toBeFalsy();
                    expect("a-bar-b".match(regexp)).toBeFalsy();
                });

                it("also use CheckAttributeRegExpAction when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.BAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("-bar".match(regexp)).toBeTruthy();
                    expect("-".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeFalsy();
                });
            });

            describe("^= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.HAT_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeTruthy();
                    expect("barb".match(regexp)).toBeTruthy();
                    expect("a-bar-b".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.HAT_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("$= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.DOLLAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("b-bar".match(regexp)).toBeTruthy();
                    expect("bbar".match(regexp)).toBeTruthy();
                    expect("bbarb".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.DOLLAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("*= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.STAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("a bar b".match(regexp)).toBeTruthy();
                    expect("abarb".match(regexp)).toBeTruthy();
                    expect("foo".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.STAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            it("represents nothing when an unsupported operator is passed", function() {
                handler.attributeSelector("ns", "foo", null, "bar");

                expect(handler.chain.length).toBe(1);
                var action = handler.chain[0];
                expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                expect(action.condition).toBe("");
            });
        });
    });
});
