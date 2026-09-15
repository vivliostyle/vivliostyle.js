import * as adapt_font from "../../../src/vivliostyle/font";

describe("font", function () {
  describe("Mapper.reorderFontFaceRules", function () {
    var head;
    var mapper;
    var firstStyle;
    var secondStyle;
    var fetchers;

    beforeEach(function () {
      head = document.createElement("div");
      mapper = Object.create(adapt_font.Mapper.prototype);
      mapper.head = head;
      firstStyle = document.createElement("style");
      secondStyle = document.createElement("style");
      fetchers = [
        { resource: { styleElement: firstStyle } },
        { resource: { styleElement: secondStyle } },
      ];
    });

    it("does not move rules that already form the final ordered suffix", function () {
      var precedingElement = document.createElement("meta");
      head.appendChild(precedingElement);
      head.appendChild(firstStyle);
      head.appendChild(secondStyle);
      spyOn(head, "appendChild").and.callThrough();

      mapper.reorderFontFaceRules(fetchers);

      expect(head.appendChild).not.toHaveBeenCalled();
      expect(Array.from(head.children)).toEqual([
        precedingElement,
        firstStyle,
        secondStyle,
      ]);
    });

    it("moves rules into the requested suffix order", function () {
      head.appendChild(secondStyle);
      head.appendChild(firstStyle);
      spyOn(head, "appendChild").and.callThrough();

      mapper.reorderFontFaceRules(fetchers);

      expect(head.appendChild.calls.allArgs()).toEqual([
        [firstStyle],
        [secondStyle],
      ]);
      expect(Array.from(head.children)).toEqual([firstStyle, secondStyle]);
    });

    it("preserves sequential moves when the requested list has duplicates", function () {
      head.appendChild(firstStyle);
      head.appendChild(secondStyle);
      spyOn(head, "appendChild").and.callThrough();

      mapper.reorderFontFaceRules([fetchers[0], fetchers[1], fetchers[0]]);

      expect(head.appendChild.calls.allArgs()).toEqual([
        [firstStyle],
        [secondStyle],
        [firstStyle],
      ]);
      expect(Array.from(head.children)).toEqual([secondStyle, firstStyle]);
    });
  });
});
