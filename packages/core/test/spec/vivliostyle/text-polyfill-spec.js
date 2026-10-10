import * as Css from "../../../src/vivliostyle/css";
import * as Vtree from "../../../src/vivliostyle/vtree";
import {
  TextSpacingPolyfill,
  splitCheckPoint,
} from "../../../src/vivliostyle/text-polyfill";
import * as NativeTextSpacing from "../../../src/vivliostyle/native-text-spacing";

describe("text spacing native handling and fallback", function () {
  let element;
  let source;
  let parent;
  let point;
  let points;
  const polyfill = new TextSpacingPolyfill();

  function setup(text, props = {}) {
    element.textContent = text;
    source = document.createTextNode(text);
    parent = new Vtree.NodeContext(document.createElement("p"), null, 0);
    parent.viewNode = element;
    parent.inline = false;
    parent.display = "block";
    parent.lang = "ja";
    parent.inheritedProps = {
      "text-autospace": "no-autospace",
      "text-spacing-trim": "space-all",
      "hanging-punctuation": "none",
      ...props,
    };
    point = new Vtree.NodeContext(source, parent, 1);
    point.viewNode = element.firstChild;
    const after = parent.copy().modify();
    after.after = true;
    after.boxOffset = text.length + 2;
    points = [point, after];
  }

  beforeEach(function () {
    element = document.createElement("p");
    element.style.cssText = 'font:16px "Hiragino Mincho ProN",serif;width:20em';
    document.body.appendChild(element);
  });
  afterEach(function () {
    element.remove();
  });

  it("does not split text when all spacing is disabled, even without native support", function () {
    spyOn(CSS, "supports").and.returnValue(false);
    setup("「日本語」ABCと123、“Latin”。");
    polyfill.postLayoutBlock(parent, points);
    expect(element.childNodes.length).toBe(1);
    expect(element.textContent).toBe(source.data);
    expect(points.length).toBe(2);
  });

  it("uses native autospace without inserting thin spaces or splitting text", function () {
    if (!CSS.supports("text-autospace", "normal"))
      pending("native autospace unavailable");
    setup("日本語ABC日本語123", { "text-autospace": "normal" });
    polyfill.postLayoutBlock(parent, points);
    expect(element.style.getPropertyValue("text-autospace")).toBe("normal");
    expect(element.childNodes.length).toBe(1);
  });

  it("falls back for an unsupported autospace value without double spacing", function () {
    spyOn(CSS, "supports").and.callFake(
      (property, value) => value !== "ideograph-alpha",
    );
    setup("日本語ABC日本語123", { "text-autospace": "ideograph-alpha" });
    polyfill.postLayoutBlock(parent, points);
    expect(element.style.getPropertyValue("text-autospace")).toBe(
      "no-autospace",
    );
    expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(2);
    expect(source.data).toBe("日本語ABC日本語123");
  });

  it("retains trim-both and hanging punctuation fallback", function () {
    setup("「日本語」。", {
      "text-spacing-trim": "trim-both",
      "hanging-punctuation": "first",
    });
    polyfill.postLayoutBlock(parent, points);
    expect(element.style.getPropertyValue("text-spacing-trim")).toBe(
      "space-all",
    );
    expect(element.querySelector("viv-ts-open").className).toBe(
      "viv-hang-first",
    );
    expect(element.querySelectorAll("viv-ts-close").length).toBe(2);
  });

  it("preserves UTF-16 source and box offsets when splitting a resumed view", function () {
    setup("😀「字́」ABC");
    point.offsetInNode = 7;
    point.boxOffset = 31;
    const result = splitCheckPoint(point);
    let offset = 0;
    result.forEach((p) => {
      expect(p.sourceNode).toBe(source);
      expect(p.offsetInNode).toBe(7 + offset);
      expect(p.boxOffset).toBe(31 + offset);
      offset += p.viewNode.length;
    });
    expect(result.map((p) => p.viewNode.data).join("")).toBe(source.data);
    expect(source.data).toBe("😀「字́」ABC");
    expect(point.offsetInNode).toBe(7);
  });

  it("does not split generated content using native autospace", function () {
    if (!CSS.supports("text-autospace", "normal"))
      pending("native autospace unavailable");
    element.textContent = "日本語ABC「引用」";
    polyfill.processGeneratedContent(
      element,
      Css.ident.normal,
      Css.getName("space-all"),
      Css.ident.none,
      "ja",
      false,
    );
    expect(element.childNodes.length).toBe(1);
    expect(element.style.getPropertyValue("text-autospace")).toBe("normal");
  });

  it("does not accept unsupported trim syntax merely because fonts can trim", function () {
    spyOn(CSS, "supports").and.returnValue(false);
    expect(NativeTextSpacing.supportsTrim(element, "normal", "ja", false)).toBe(
      false,
    );
  });

  it("rejects a font whose full-width punctuation does not actually trim", function () {
    spyOn(CSS, "supports").and.returnValue(true);
    element.style.fontFamily = "unsupported-probe-font";
    element.textContent = "「日本語」";
    spyOn(Element.prototype, "getBoundingClientRect").and.callFake(function () {
      return new DOMRect(0, 0, this.textContent.length * 16, 16);
    });
    expect(NativeTextSpacing.supportsTrim(element, "normal", "ja", false)).toBe(
      false,
    );
  });

  it("checks fallback glyphs as well as supported glyphs in the same font cascade", function () {
    spyOn(CSS, "supports").and.returnValue(true);
    element.style.fontFamily = "mixed-probe-font";
    element.textContent = "「日本語」";
    spyOn(Element.prototype, "getBoundingClientRect").and.callFake(function () {
      const trims =
        this.style.getPropertyValue("text-spacing-trim") === "normal" &&
        this.textContent.includes("「");
      return new DOMRect(
        0,
        0,
        this.textContent.length * 16 - (trims ? 8 : 0),
        16,
      );
    });
    expect(NativeTextSpacing.supportsTrim(element, "normal", "ja", false)).toBe(
      false,
    );
  });

  it("uses a separate font capability check for vertical text", function () {
    spyOn(CSS, "supports").and.returnValue(true);
    element.style.fontFamily = "vertical-probe-font";
    element.textContent = "「日本語」";
    spyOn(Element.prototype, "getBoundingClientRect").and.callFake(function () {
      const trims =
        this.style.getPropertyValue("text-spacing-trim") === "normal";
      return new DOMRect(
        0,
        0,
        this.textContent.length * 16 - (trims ? 8 : 0),
        this.textContent.length * 16,
      );
    });
    expect(NativeTextSpacing.supportsTrim(element, "normal", "ja", false)).toBe(
      true,
    );
    expect(NativeTextSpacing.supportsTrim(element, "normal", "ja", true)).toBe(
      false,
    );
  });

  it("does not split punctuation for an autospace-only fallback", function () {
    spyOn(CSS, "supports").and.returnValue(false);
    setup("「日本語ABC」。", { "text-autospace": "ideograph-alpha" });
    polyfill.postLayoutBlock(parent, points);
    expect(element.childNodes.length).toBe(3);
    expect(element.firstChild.data).toBe("「日本語");
    expect(element.lastChild.data).toBe("ABC」。");
  });
});
