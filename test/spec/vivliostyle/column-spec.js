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
describe("column", function() {
    var module = vivliostyle.column;
    var ColumnBalancer = module.ColumnBalancer;
    var BalanceNonLastColumnBalancer = module.BalanceNonLastColumnBalancer;

    var parentNode;

    beforeEach(function() {
        parentNode = {
            appendChild: jasmine.createSpy("appendChild"),
            removeChild: jasmine.createSpy("removeChild")
        };
    });

    function createDummyColumn(computedBlockSize) {
        return {
            element: {parentNode: parentNode},
            computedBlockSize: computedBlockSize || 1000
        };
    }

    describe("ColumnBalancer", function() {
        var balancer;

        beforeEach(function() {
            balancer = new ColumnBalancer();
        });

        describe("replaceColumns", function() {
            it("removes column elements if only one array of Columns is passed", function() {
                var columns = [1, 2, 3].map(createDummyColumn);
                balancer.replaceColumns(columns);

                columns.forEach(function(c) {
                    expect(parentNode.removeChild).toHaveBeenCalledWith(c.element);
                });
            });

            it("replaces column elements with new ones if two arrays of Columns are passed", function() {
                var columns = [1, 2, 3].map(createDummyColumn);
                var newColumns = [1, 2, 3].map(createDummyColumn);
                balancer.replaceColumns(columns, newColumns);

                columns.forEach(function(c) {
                    expect(parentNode.removeChild).toHaveBeenCalledWith(c.element);
                });

                newColumns.forEach(function(c) {
                    expect(parentNode.appendChild).toHaveBeenCalledWith(c.element);
                });
            });
        });
    });

    describe("BalanceNonLastColumnBalancer", function() {
        function createDummyContainer(vertical) {
            var container = new adapt.vtree.Container(null);
            container.vertical = vertical;
            if (vertical)
                container.width = 1000;
            else
                container.height = 1000;
            return container;
        }

        function createBalancer(vertical) {
            return new BalanceNonLastColumnBalancer(null, createDummyContainer(vertical));
        }

        describe("calculatePenalty", function() {
            it("returns 0 if all columns have the same computedBlockSize", function() {
                var balancer = createBalancer(false);
                var columns = [1000, 1000, 1000].map(createDummyColumn);

                expect(balancer.calculatePenalty(columns)).toBe(0);
            });

            it("returns a positive value when not all columns have the same computedBlockSize", function() {
                var balancer = createBalancer(false);
                var columns = [1000, 999, 1000].map(createDummyColumn);

                expect(balancer.calculatePenalty(columns)).toBeGreaterThan(0);
            });

            it("returns a greater value when computedBlockSizes of columns have a greater variance", function() {
                var balancer = createBalancer(false);
                var columns1 = [1000, 999, 999].map(createDummyColumn);
                var columns2 = [1000, 1000, 998].map(createDummyColumn);

                var penalty1 = balancer.calculatePenalty(columns1);
                var penalty2 = balancer.calculatePenalty(columns2);
                expect(penalty2).toBeGreaterThan(penalty1);
            });

            it("excludes columns ending with forced breaks", function() {
                var balancer = createBalancer(false);
                var columns = [1000, 900, 1000].map(createDummyColumn);
                columns[1].pageBreakType = "column";

                expect(balancer.calculatePenalty(columns)).toBe(0);
            });
        });

        describe("hasNextCandidate", function() {
            it("returns false when penalty of the last candidate is 0", function() {
                var balancer = createBalancer(false);
                var candidates = [
                    {},
                    {penalty: 0}
                ];

                expect(balancer.hasNextCandidate(candidates)).toBe(false);
            });

            it("returns true if the last max column block size is larger than 90% of the container block size", function() {
                var balancer = createBalancer(false);
                var candidates = [
                    {},
                    {columns: [901, 700, 800].map(createDummyColumn)}
                ];

                expect(balancer.hasNextCandidate(candidates)).toBe(true);

                balancer = createBalancer(true);

                expect(balancer.hasNextCandidate(candidates)).toBe(true);
            });

            it("returns false if the last max column block size is equal or less than 90% of the container block size", function() {
                var balancer = createBalancer(false);
                var candidates = [
                    {},
                    {columns: [900, 700, 800].map(createDummyColumn)}
                ];

                expect(balancer.hasNextCandidate(candidates)).toBe(false);

                balancer = createBalancer(true);

                expect(balancer.hasNextCandidate(candidates)).toBe(false);
            });
        });

        describe("updateCondition", function() {
            it("sets a value slightly smaller than the last max column block size to the layoutContainer's block size", function() {
                var candidates = [
                    {},
                    {columns: [901, 700, 800].map(createDummyColumn)}
                ];

                var balancer = createBalancer(false);
                balancer.updateCondition(candidates);
                expect(balancer.layoutContainer.height).toBe(900);

                balancer = createBalancer(true);
                balancer.updateCondition(candidates);
                expect(balancer.layoutContainer.width).toBe(900);
            });
        });

        describe("postBalance", function() {
            it("resets the layoutContainer's block size to the initial value", function() {
                var balancer = createBalancer(false);
                balancer.layoutContainer.height = 900;
                balancer.postBalance();
                expect(balancer.layoutContainer.height).toBe(1000);

                balancer = createBalancer(true);
                balancer.layoutContainer.width = 900;
                balancer.postBalance();
                expect(balancer.layoutContainer.width).toBe(1000);
            });
        });
    });
});
