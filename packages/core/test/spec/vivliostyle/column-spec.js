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

import * as adapt_vtree from "../../../src/vivliostyle/vtree";
import * as vivliostyle_columns from "../../../src/vivliostyle/columns";

// FIXME: cannot spyOn(module, "...")

describe("column", function () {
  var module = vivliostyle_columns;
  var ColumnBalancer = module.ColumnBalancer;
  var BalanceLastColumnBalancer = module.BalanceLastColumnBalancer;
  var BalanceNonLastColumnBalancer = module.BalanceNonLastColumnBalancer;

  var parentNode;

  beforeEach(function () {
    parentNode = {
      appendChild: jasmine.createSpy("appendChild"),
      removeChild: jasmine.createSpy("removeChild"),
    };
  });

  function createDummyContainer(vertical) {
    var element = {
      appendChild: jasmine.createSpy("appendChild"),
    };
    var container = new adapt_vtree.Container(element);
    container.vertical = vertical;
    if (vertical) container.width = 1000;
    else container.height = 1000;
    return container;
  }

  function createDummyPageFloatLayoutContext(children) {
    return {
      children: children,
      attachChildren: jasmine.createSpy("attachChildren"),
      detachChildren: jasmine
        .createSpy("detachChildren")
        .and.returnValue(children),
    };
  }

  function createDummyColumn(computedBlockSize, pageFloatBlockSize) {
    return {
      element: { parentNode: parentNode },
      computedBlockSize: computedBlockSize || 1000,
      getMaxBlockSizeOfPageFloats: jasmine
        .createSpy("getMaxBlockSizeOfPageFloats")
        .and.returnValue(pageFloatBlockSize || 0),
    };
  }

  describe("ColumnBalancer", function () {
    var columns,
      columnPageFloatLayoutContexts,
      regionPageFloatLayoutContext,
      layoutContainer,
      balancer;

    function createBalancer(vertical) {
      columnPageFloatLayoutContexts = [];
      regionPageFloatLayoutContext = createDummyPageFloatLayoutContext(
        columnPageFloatLayoutContexts,
      );
      layoutContainer = createDummyContainer(vertical);
      return new ColumnBalancer(
        layoutContainer,
        null,
        regionPageFloatLayoutContext,
      );
    }

    beforeEach(function () {
      columns = [1, 2, 3].map(createDummyColumn);
      balancer = createBalancer(false);
    });

    describe("savePageFloatLayoutContexts", function () {
      it("detaches column PageFloatLayoutContexts and save them in the passed ColumnLayoutResult", function () {
        var layoutResult = { columns: columns };
        balancer.savePageFloatLayoutContexts(layoutResult);

        expect(regionPageFloatLayoutContext.detachChildren).toHaveBeenCalled();
        expect(layoutResult.columnPageFloatLayoutContexts).toBe(
          columnPageFloatLayoutContexts,
        );
      });
    });

    describe("restoreContents", function () {
      it("restore column elements and column PageFloatLayoutContexts with new ones", function () {
        var newColumns = [1, 2, 3].map(createDummyColumn);
        var newColumnPageFloatLayoutContexts = [];
        var newLayoutResult = {
          columns: newColumns,
          columnPageFloatLayoutContexts: newColumnPageFloatLayoutContexts,
        };
        balancer.restoreContents(newLayoutResult);

        newColumns.forEach(function (c) {
          expect(layoutContainer.element.appendChild).toHaveBeenCalledWith(
            c.element,
          );
        });
        expect(
          regionPageFloatLayoutContext.attachChildren,
        ).toHaveBeenCalledWith(newColumnPageFloatLayoutContexts);
      });
    });

    describe("postBalance", function () {
      it("resets the layoutContainer's block size to the initial value", function () {
        layoutContainer.height = 900;
        balancer.postBalance();
        expect(layoutContainer.height).toBe(1000);

        balancer = createBalancer(true);
        layoutContainer.width = 900;
        balancer.postBalance();
        expect(layoutContainer.width).toBe(1000);
      });
    });
  });

  describe("BalanceLastColumnBalancer", function () {
    function createBalancer(columnCount, vertical) {
      return new BalanceLastColumnBalancer(
        null,
        null,
        createDummyContainer(vertical),
        columnCount,
      );
    }

    describe("preBalance", function () {
      it("sets layoutContainer's block size to the minimum block size for contents", function () {
        var balancer = createBalancer(3, false);
        var layoutResult = { columns: [800, 680, 899].map(createDummyColumn) };
        balancer.preBalance(layoutResult);

        expect(balancer.layoutContainer.height).toBe(793);
      });

      it("stores the original position at the end of the region", function () {
        var balancer = createBalancer(3, false);
        var layoutResult = {
          columns: [800, 680, 899].map(createDummyColumn),
          position: {},
        };
        balancer.preBalance(layoutResult);

        expect(balancer.originalPosition).toBe(layoutResult.position);
      });
    });

    describe("checkPosition", function () {
      it("checks whether the new position is equivalent to the original position", function () {
        var balancer = createBalancer(3, false);
        var layoutResult = {
          columns: [800, 680, 899].map(createDummyColumn),
          position: null,
        };
        balancer.preBalance(layoutResult);

        expect(balancer.checkPosition({})).toBe(false);
        expect(balancer.checkPosition(null)).toBe(true);

        var originalPosition = {
          isSamePosition: jasmine
            .createSpy("isSamePosition")
            .and.returnValues(true, false),
        };
        balancer = createBalancer(3, false);
        layoutResult = {
          columns: [800, 680, 899].map(createDummyColumn),
          position: originalPosition,
        };
        balancer.preBalance(layoutResult);

        var newPosition = {};
        expect(balancer.checkPosition(newPosition)).toBe(true);
        expect(originalPosition.isSamePosition).toHaveBeenCalledWith(
          newPosition,
        );
        expect(balancer.checkPosition({})).toBe(false);
        expect(originalPosition.isSamePosition).toHaveBeenCalledTimes(2);
      });
    });

    describe("calculatePenalty", function () {
      it("returns Infinity if the position at the end of the region changes", function () {
        var balancer = createBalancer(3, false);
        spyOn(balancer, "checkPosition").and.returnValue(false);
        var layoutResult = { position: {} };

        expect(balancer.calculatePenalty(layoutResult)).toBe(Infinity);
        expect(balancer.checkPosition).toHaveBeenCalledWith(
          layoutResult.position,
        );
      });

      it("returns Infinity if the last column is longer than any other column", function () {
        var balancer = createBalancer(3, false);
        spyOn(balancer, "checkPosition").and.returnValue(true);
        var layoutResult = {
          columns: [800, 680, 807].map(createDummyColumn),
          position: {},
        };

        expect(balancer.calculatePenalty(layoutResult)).toBe(Infinity);
      });

      it("returns the maximum block size of the columns", function () {
        var balancer = createBalancer(3, false);
        spyOn(balancer, "checkPosition").and.returnValue(true);
        var layoutResult = {
          columns: [800, 680, 700].map(createDummyColumn),
          position: {},
        };

        expect(balancer.calculatePenalty(layoutResult)).toBe(800);
      });
    });

    describe("hasNextCandidate", function () {
      var balancer;

      beforeEach(function () {
        balancer = createBalancer(3, false);
      });

      it("returns true if it is the first attempt (candidates.length=1)", function () {
        var candidates = [{}];

        expect(balancer.hasNextCandidate(candidates)).toBe(true);
      });

      // it("calls canReduceContainerSize if foundUpperBound=true", function() {
      //     spyOn(module, "canReduceContainerSize");
      //     balancer.foundUpperBound = true;
      //     var candidates = [{}, {}];
      //     balancer.hasNextCandidate(candidates);

      //     expect(module.canReduceContainerSize).toHaveBeenCalledWith(candidates);
      // });

      it("returns if the current block size of the layoutContainer is smaller than the original size if the position of the last candidate is different from the original position", function () {
        spyOn(balancer, "checkPosition").and.returnValue(false);
        var candidates = [{}, { layoutResult: { position: {} } }];

        balancer.layoutContainer.height = 900;
        expect(balancer.hasNextCandidate(candidates)).toBe(true);
        expect(balancer.checkPosition).toHaveBeenCalledWith(
          candidates[1].layoutResult.position,
        );

        balancer.layoutContainer.height = 1000;
        expect(balancer.hasNextCandidate(candidates)).toBe(false);
      });

      it("returns if the current block size of the layoutContainer is smaller than the original size if the last column of the last candidate is longer than any other column", function () {
        spyOn(balancer, "checkPosition").and.returnValue(true);
        var candidates = [
          {},
          {
            layoutResult: {
              columns: [700, 600, 800].map(createDummyColumn),
              position: {},
            },
          },
        ];

        balancer.layoutContainer.height = 900;
        expect(balancer.hasNextCandidate(candidates)).toBe(true);

        balancer.layoutContainer.height = 1000;
        expect(balancer.hasNextCandidate(candidates)).toBe(false);
      });

      it("sets foundUpperBound to true and returns true if the position of the last candidate is same as the original position and the last column of the last candidate is not longer than some other columns", function () {
        spyOn(balancer, "checkPosition").and.returnValue(true);
        var candidates = [
          {},
          {
            layoutResult: {
              columns: [700, 600, 700].map(createDummyColumn),
              position: {},
            },
          },
        ];

        expect(balancer.hasNextCandidate(candidates)).toBe(true);
        expect(balancer.foundUpperBound).toBe(true);
      });
    });

    describe("updateCondition", function () {
      var balancer;

      beforeEach(function () {
        balancer = createBalancer(3, false);
      });

      // it("calls reduceContainerSize if foundUpperBound=true", function() {
      //     spyOn(module, "reduceContainerSize");
      //     balancer.foundUpperBound = true;
      //     var candidates = [];
      //     balancer.updateCondition(candidates);

      //     expect(module.reduceContainerSize).toHaveBeenCalledWith(candidates, balancer.layoutContainer);
      // });

      it("increase the block size of layoutContainer by 10% of the original container block size", function () {
        balancer.layoutContainer.height = 800;
        balancer.updateCondition([]);

        expect(balancer.layoutContainer.height).toBe(900);

        balancer.layoutContainer.height = 901;
        balancer.updateCondition([]);

        expect(balancer.layoutContainer.height).toBe(1000);
      });
    });
  });

  describe("BalanceNonLastColumnBalancer", function () {
    function createBalancer(vertical) {
      return new BalanceNonLastColumnBalancer(
        null,
        null,
        createDummyContainer(vertical),
      );
    }

    beforeEach(function () {
      // spyOn(module, "canReduceContainerSize");
      // spyOn(module, "reduceContainerSize");
    });

    describe("calculatePenalty", function () {
      it("returns 0 if all columns have the same computedBlockSize", function () {
        var balancer = createBalancer(false);
        var layoutResult = {
          columns: [1000, 1000, 1000].map(createDummyColumn),
        };

        expect(balancer.calculatePenalty(layoutResult)).toBe(0);
      });

      it("returns a positive value when not all columns have the same computedBlockSize", function () {
        var balancer = createBalancer(false);
        var layoutResult = {
          columns: [1000, 999, 1000].map(createDummyColumn),
        };

        expect(balancer.calculatePenalty(layoutResult)).toBeGreaterThan(0);
      });

      it("returns a greater value when computedBlockSizes of columns have a greater variance", function () {
        var balancer = createBalancer(false);
        var layoutResult1 = {
          columns: [1000, 999, 999].map(createDummyColumn),
        };
        var layoutResult2 = {
          columns: [1000, 1000, 998].map(createDummyColumn),
        };

        var penalty1 = balancer.calculatePenalty(layoutResult1);
        var penalty2 = balancer.calculatePenalty(layoutResult2);
        expect(penalty2).toBeGreaterThan(penalty1);
      });

      it("excludes columns ending with forced breaks", function () {
        var balancer = createBalancer(false);
        var layoutResult = {
          columns: [1000, 900, 1000].map(createDummyColumn),
        };
        layoutResult.columns[1].pageBreakType = "column";

        expect(balancer.calculatePenalty(layoutResult)).toBe(0);
      });
    });

    // describe("hasNextCandidate", function() {
    //     it("calls canReduceContainerSize", function() {
    //         var balancer = createBalancer(false);
    //         var candidates = [];
    //         balancer.hasNextCandidate(candidates);

    //         expect(module.canReduceContainerSize).toHaveBeenCalledWith(candidates);
    //     });
    // });

    // describe("updateCondition", function() {
    //     it("calls reduceContainerSize", function() {
    //         var balancer = createBalancer(false);
    //         var candidates = [];
    //         balancer.updateCondition(candidates);

    //         expect(module.reduceContainerSize).toHaveBeenCalledWith(candidates, balancer.layoutContainer);
    //     });
    // });
  });

  describe("canReduceContainerSize", function () {
    it("returns false when penalty of the last candidate is 0", function () {
      var candidates = [{}, { penalty: 0 }];

      expect(module.canReduceContainerSize(candidates)).toBe(false);
    });

    it("returns false if penalty of the last candidate is equal or greater than the previous candidate", function () {
      var candidates = [
        {},
        {
          penalty: 10,
          layoutResult: { columns: [900, 700, 800].map(createDummyColumn) },
        },
        {
          penalty: 20,
          layoutResult: { columns: [900, 700, 800].map(createDummyColumn) },
        },
      ];

      expect(module.canReduceContainerSize(candidates)).toBe(false);

      var candidates = [
        {},
        {
          penalty: 10,
          layoutResult: { columns: [900, 700, 800].map(createDummyColumn) },
        },
        {
          penalty: 10,
          layoutResult: { columns: [900, 700, 800].map(createDummyColumn) },
        },
      ];

      expect(module.canReduceContainerSize(candidates)).toBe(false);
    });

    it("returns false if the last max column block size is equal or less than the max block size of column page floats + 1px", function () {
      var candidates = [
        {},
        {
          layoutResult: {
            columns: [
              [950, 949],
              [700, 0],
              [800, 0],
            ].map(function (a) {
              return createDummyColumn(a[0], a[1]);
            }),
          },
        },
      ];

      expect(module.canReduceContainerSize(candidates)).toBe(false);
    });
  });

  describe("reduceContainerSize", function () {
    it("sets a value slightly smaller than the last max column block size to the layoutContainer's block size", function () {
      var candidates = [
        {},
        { layoutResult: { columns: [901, 700, 800].map(createDummyColumn) } },
      ];

      var container = createDummyContainer(false);
      module.reduceContainerSize(candidates, container);
      expect(container.height).toBe(900);

      container = createDummyContainer(true);
      module.reduceContainerSize(candidates, container);
      expect(container.width).toBe(900);
    });
  });
});
