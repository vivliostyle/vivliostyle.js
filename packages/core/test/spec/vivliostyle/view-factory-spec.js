import * as vivliostyle_vgen from "../../../src/vivliostyle/vgen";

describe("ViewFactory", function () {
  function viewFactory(breakSuppressionStore, continuationStore) {
    return new vivliostyle_vgen.ViewFactory(
      "body",
      breakSuppressionStore,
      continuationStore,
      null,
      { document: document },
      {
        counterListener: {
          getExprContentListener: function () {
            return null;
          },
        },
      },
    );
  }

  it("shares document-scoped stores with a clone", function () {
    var breakSuppressionStore = {
      breakSuppressionByViewNode: new WeakMap(),
    };
    var continuationStore = {
      continuationOfSlot: new WeakMap(),
      slotOfContinuation: new WeakMap(),
    };
    var original = viewFactory(breakSuppressionStore, continuationStore);
    var cloned = original.clone();
    expect(cloned.breakSuppressionStore).toBe(breakSuppressionStore);
    expect(cloned.continuationStore).toBe(continuationStore);
  });
});
