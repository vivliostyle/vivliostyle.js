/**
 * Copyright 2026 Vivliostyle Foundation
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

import { VivliostylePolyfillCss } from "../../../src/vivliostyle/assets";
import * as Css from "../../../src/vivliostyle/css";
import { TextNodeBreaker } from "../../../src/vivliostyle/layout";
import * as NativeTextSpacing from "../../../src/vivliostyle/native-text-spacing";
import {
  TextSpacingPolyfill,
  splitCheckPoint,
} from "../../../src/vivliostyle/text-polyfill";
import * as Vtree from "../../../src/vivliostyle/vtree";

describe("text-polyfill", function () {
  const polyfill = new TextSpacingPolyfill();
  // The inline style is not kept if the browser does not support it
  const hasTrimProperty = CSS.supports("text-spacing-trim", "normal");
  let element;

  const defaultProps = {
    "text-autospace": "no-autospace",
    "text-spacing-trim": "space-all",
    "hanging-punctuation": "none",
  };

  /**
   * Create check points for the view element, whose children are text nodes
   * or inline elements having text nodes. The text-spacing properties of the
   * inline elements are given by `data-props` attributes in JSON.
   */
  function createCheckPoints(
    props = {},
    { lang = "ja", vertical = false } = {},
  ) {
    const blockContext = new Vtree.NodeContext(
      document.createElement("p"),
      null,
      0,
    );
    blockContext.viewNode = element;
    blockContext.inline = false;
    blockContext.display = "block";
    blockContext.lang = lang;
    blockContext.vertical = vertical;
    blockContext.inheritedProps = { ...defaultProps, ...props };
    const points = [];
    let boxOffset = 1;
    function visit(viewNode, parentContext) {
      for (const child of Array.from(viewNode.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const source = document.createTextNode(child.data);
          const point = new Vtree.NodeContext(source, parentContext, boxOffset);
          point.viewNode = child;
          points.push(point);
          boxOffset += child.length;
          const after = point.copy().modify();
          after.after = true;
          after.boxOffset = boxOffset++;
          points.push(after);
        } else {
          const context = new Vtree.NodeContext(
            document.createElement(child.localName),
            parentContext,
            boxOffset++,
          );
          context.viewNode = child;
          context.inline = true;
          context.inheritedProps = {
            ...parentContext.inheritedProps,
            ...JSON.parse(child.dataset.props ?? "{}"),
          };
          points.push(context);
          visit(child, context);
          const after = context.copy().modify();
          after.after = true;
          after.boxOffset = boxOffset++;
          points.push(after);
        }
      }
    }
    visit(element, blockContext);
    return { blockContext, points };
  }

  function layout(html, props) {
    element.innerHTML = html;
    const { blockContext, points } = createCheckPoints(props);
    polyfill.postLayoutBlock(blockContext, points);
    return points;
  }

  beforeEach(function () {
    element = document.createElement("p");
    element.lang = "ja";
    element.style.cssText = 'font:16px "Hiragino Mincho ProN",serif;width:20em';
    document.body.appendChild(element);
  });

  afterEach(function () {
    element.remove();
  });

  describe("native text spacing and fallback", function () {
    it("does not split text when all spacing is disabled, even without native support", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      const points = layout("「日本語」ABCと123、“Latin”。");
      expect(element.childNodes.length).toBe(1);
      expect(element.textContent).toBe("「日本語」ABCと123、“Latin”。");
      expect(points.length).toBe(2);
    });

    it("uses native autospace without inserting thin spaces or splitting text", function () {
      if (!NativeTextSpacing.supportsAutospace(document, "normal")) {
        pending("native autospace unavailable");
      }
      layout("日本語ABC日本語123", { "text-autospace": "normal" });
      expect(element.style.getPropertyValue("text-autospace")).toBe("normal");
      expect(element.childNodes.length).toBe(1);
    });

    it("keeps the source offset of the after check point of split text", function () {
      spyOn(CSS, "supports").and.callFake(
        (property, value) => value !== "ideograph-alpha",
      );
      const points = layout("日本ABC", { "text-autospace": "ideograph-alpha" });
      const after = points.find(
        (p) => p.after && p.viewNode.nodeType === Node.TEXT_NODE,
      );
      expect(after.viewNode.data).toBe("ABC");
      // A break after the text, e.g. at the end of a table cell, is after
      // the whole source text
      const nodeContext = TextNodeBreaker.instance.breakTextNode(
        after.viewNode,
        after,
        after.boxOffset,
        points,
        points.indexOf(after),
        false,
      );
      expect(nodeContext.offsetInNode).toBe(5);
    });

    it("falls back for an unsupported autospace value", function () {
      spyOn(CSS, "supports").and.callFake(
        (property, value) => value !== "ideograph-alpha",
      );
      layout("日本語ABC日本語123", { "text-autospace": "ideograph-alpha" });
      expect(element.style.getPropertyValue("text-autospace")).toBe(
        "no-autospace",
      );
      expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(2);
      expect(element.textContent).toBe("日本語ABC日本語123");
    });

    it("does not split punctuation for an autospace-only fallback", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      layout("「日本語ABC」。", { "text-autospace": "ideograph-alpha" });
      expect(element.childNodes.length).toBe(3);
      expect(element.firstChild.data).toBe("「日本語");
      expect(element.lastChild.data).toBe("ABC」。");
    });

    it("processes hanging punctuation with or without native trimming", function () {
      element.textContent = "「日本語」";
      const native = NativeTextSpacing.supportsTrim(
        element,
        "trim-start",
        "ja",
        false,
      );
      layout("「日本語」「日本語」", {
        "text-spacing-trim": "trim-both",
        "hanging-punctuation": new Css.SpaceList([
          Css.getName("first"),
          Css.getName("last"),
        ]),
      });
      if (hasTrimProperty) {
        expect(element.style.getPropertyValue("text-spacing-trim")).toBe(
          native ? "trim-start" : "space-all",
        );
      }
      const opens = element.querySelectorAll("viv-ts-open");
      const closes = element.querySelectorAll("viv-ts-close");
      expect(opens[0].className).toBe("viv-hang-first");
      expect(closes[closes.length - 1].className).toBe("viv-hang-last");
      if (native) {
        // Only the hanging punctuation is processed by the polyfill
        expect(opens.length).toBe(1);
        expect(closes.length).toBe(1);
        expect(element.childNodes.length).toBe(3);
      }
    });

    it("falls back throughout the inline formatting context", function () {
      if (!hasTrimProperty) {
        pending("text-spacing-trim unavailable");
      }
      // `space-end` has no native equivalent
      layout(
        '「日本語」<span data-props=\'{"text-spacing-trim":"normal"}\'>「日本語」</span>',
        {
          "text-spacing-trim": new Css.SpaceList([
            Css.getName("trim-start"),
            Css.getName("space-end"),
          ]),
        },
      );
      expect(element.style.getPropertyValue("text-spacing-trim")).toBe(
        "space-all",
      );
      expect(
        element
          .querySelector("span")
          .style.getPropertyValue("text-spacing-trim"),
      ).toBe("space-all");
    });

    it("uses native trim-start for trim-both", function () {
      element.textContent = "「日本語」";
      if (!NativeTextSpacing.supportsTrim(element, "trim-start", "ja", false)) {
        pending("native text-spacing-trim unavailable");
      }
      layout("「日本語」「日本語」", { "text-spacing-trim": "trim-both" });
      expect(element.style.getPropertyValue("text-spacing-trim")).toBe(
        "trim-start",
      );
      // The closing punctuation at the end of the line is set half-width
      expect(element.querySelector("viv-ts-close").className).toBe(
        "viv-ts-trim",
      );
      expect(element.querySelector("viv-ts-open")).toBeNull();
    });

    it("does not trim the closing punctuation set half-width by the polyfill again", function () {
      element.style.width = "auto";
      element.textContent = "」";
      if (!NativeTextSpacing.supportsTrim(element, "trim-start", "ja", false)) {
        pending("native text-spacing-trim unavailable");
      }
      // The last two characters do not fit on the first line even with the
      // closing bracket at half-width, but would if the browser also set it
      // half-width at the end of the line (allow-end)
      const probe = document.createElement("span");
      probe.style.whiteSpace = "nowrap";
      probe.textContent = "あいうえおかきくけこ";
      element.replaceChildren(probe);
      const width = probe.getBoundingClientRect().width;
      element.style.width = `${width + 4}px`;
      const style = document.createElement("style");
      style.textContent = VivliostylePolyfillCss;
      document.head.appendChild(style);
      try {
        layout("あいうえおかきくけこ」", { "text-spacing-trim": "trim-both" });
        const close = element.querySelector("viv-ts-close");
        expect(close?.className).toBe("viv-ts-trim");
        const range = document.createRange();
        range.setStart(element.firstChild, 0);
        range.setEnd(element.firstChild, 1);
        expect(close.getBoundingClientRect().top).toBeGreaterThan(
          range.getBoundingClientRect().bottom,
        );
      } finally {
        style.remove();
      }
    });

    it("processes a block laid out beyond the column to the end", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      // The block is in the next column as a whole (e.g., moved there by
      // `break-inside: avoid`), and may fit in the column after processing
      element.style.position = "absolute";
      element.style.left = "100000px";
      layout("あいう「えお」かき「くけ」こ", { "text-spacing-trim": "normal" });
      expect(element.querySelectorAll("viv-ts-open").length).toBe(2);
      expect(element.querySelectorAll("viv-ts-close").length).toBe(2);
    });

    it("stops processing at the text beyond the column in a block starting in the column", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      // The text beyond the column is processed again in the next column
      // (Issue #1256)
      layout(
        'あいう「えお」<span style="position:relative;left:100000px">か「き」く</span>',
        { "text-spacing-trim": "normal" },
      );
      expect(element.querySelectorAll("viv-ts-open").length).toBe(2);
      expect(element.querySelectorAll("viv-ts-close").length).toBe(1);
    });

    it("does not measure the text detached beyond the lookahead", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      element.append("日本語。", "次の文");
      const { blockContext, points } = createCheckPoints({
        "text-spacing-trim": "normal",
      });
      // The text after the full stop is detached as a deferred tail
      element.lastChild.remove();
      expect(() =>
        polyfill.postLayoutBlock(blockContext, points),
      ).not.toThrow();
    });

    /**
     * Check that the full stop after the text is set half-width at the end of
     * the line, where it fits only at half-width (allow-end) and the run of
     * the text that may not be separated from it by a line break moves to the
     * next line otherwise.
     * @param html the HTML of the text, if it has markup
     * @param className the class of the punctuation set half-width
     */
    function expectHalfWidthAtLineEnd(
      firstLine,
      nextLine,
      html = `${firstLine}。${nextLine}`,
      className = "viv-ts-auto",
    ) {
      element.style.width = "auto";
      element.textContent = "。";
      if (!NativeTextSpacing.supportsTrim(element, "normal", "ja", false)) {
        pending("native text-spacing-trim unavailable");
      }
      const probe = document.createElement("span");
      probe.style.whiteSpace = "nowrap";
      probe.textContent = firstLine;
      element.replaceChildren(probe);
      const width = probe.getBoundingClientRect().width;
      element.style.width = `${width + 8.5}px`;
      // The polyfill styles the punctuation by the class
      const style = document.createElement("style");
      style.textContent = VivliostylePolyfillCss;
      document.head.appendChild(style);
      try {
        layout(html, {
          "text-autospace": "no-autospace",
          "text-spacing-trim": "normal",
        });
        const close = Array.from(element.querySelectorAll("viv-ts-close")).find(
          (elem) => elem.textContent === "。",
        );
        expect(close?.className).toBe(className);
        const range = document.createRange();
        range.selectNodeContents(element.firstChild);
        expect(close.getBoundingClientRect().top).toBeCloseTo(
          range.getBoundingClientRect().top,
          0,
        );
      } finally {
        style.remove();
      }
    }

    it("sets the punctuation after an unbreakable word half-width at the end of a line", function () {
      expectHalfWidthAtLineEnd("あいうえおかabcdef", "さしすせそ");
    });

    it("sets the punctuation after words joined by a no-break space half-width at the end of a line", function () {
      expectHalfWidthAtLineEnd("あいうえおかabc\u00A0def", "さしすせそ");
    });

    it("sets the punctuation after ideographs with keep-all half-width at the end of a line", function () {
      element.style.wordBreak = "keep-all";
      expectHalfWidthAtLineEnd("さしすせそ、あいうえおかきくけ", "たちつてと");
    });

    it("sets the punctuation in nonwrapping text half-width at the end of a line", function () {
      // The space after the punctuation set by `viv-ts-auto` does not hang at
      // the end of a line in nonwrapping text
      expectHalfWidthAtLineEnd(
        "ああいうえおかきくけ",
        "さしす",
        'ああ<span style="white-space:nowrap">いうえおかきくけ。</span>さしす',
        "viv-ts-trim",
      );
    });

    it("sets the punctuation half-width at the end of a line after inserting the spacing before the text", async function () {
      element.style.width = "auto";
      element.textContent = "。";
      if (!NativeTextSpacing.supportsTrim(element, "normal", "ja", false)) {
        pending("native text-spacing-trim unavailable");
      }
      // The full stop fits at full width until the spacing is inserted at the
      // boundary between `A` and `あ`, where the native text-autospace does
      // not insert it
      const probe = document.createElement("span");
      probe.style.whiteSpace = "nowrap";
      probe.innerHTML = "<code>A</code>あいうえおかきく。";
      element.replaceChildren(probe);
      const width = probe.getBoundingClientRect().width;
      element.style.width = `${width + 1}px`;
      const style = document.createElement("style");
      style.textContent = VivliostylePolyfillCss;
      document.head.appendChild(style);
      try {
        await document.fonts.load('16px "-viv-ts-sp"');
        layout(
          `<code data-props='{"text-autospace":"no-autospace"}'>A</code>あいうえおかきく。さしす`,
          { "text-autospace": "normal", "text-spacing-trim": "normal" },
        );
        expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(1);
        const close = Array.from(element.querySelectorAll("viv-ts-close")).find(
          (elem) => elem.textContent === "。",
        );
        expect(close?.className).toBe("viv-ts-auto");
        // On the first line with the text before it
        const range = document.createRange();
        range.selectNodeContents(close.previousSibling);
        expect(close.getBoundingClientRect().top).toBeCloseTo(
          range.getBoundingClientRect().top,
          0,
        );
      } finally {
        style.remove();
      }
    });

    it("preserves the offsets of split text nodes", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      const points = layout(
        '<span data-props=\'{"text-autospace":"normal"}\'>日本語ABC</span>',
      );
      const textPoints = points.filter(
        (p) => p.viewNode.nodeType === 3 && !p.after,
      );
      expect(textPoints.map((p) => p.viewNode.data)).toEqual(["日本語", "ABC"]);
      expect(textPoints.map((p) => p.boxOffset)).toEqual([2, 5]);
      expect(textPoints.map((p) => p.offsetInNode)).toEqual([0, 3]);
      // The after check point refers to the last text node
      const afterPoint = points.find(
        (p) => p.viewNode.nodeType === 3 && p.after,
      );
      expect(afterPoint.viewNode).toBe(textPoints[1].viewNode);
    });

    it("preserves UTF-16 source and box offsets when splitting a resumed view", function () {
      element.textContent = "😀「字́」ABC";
      const source = document.createTextNode(element.textContent);
      const parent = new Vtree.NodeContext(
        document.createElement("p"),
        null,
        0,
      );
      parent.viewNode = element;
      const point = new Vtree.NodeContext(source, parent, 31);
      point.viewNode = element.firstChild;
      point.offsetInNode = 7;
      const result = splitCheckPoint(point, [2, 3, 5, 6]);
      let offset = 0;
      result.forEach((p) => {
        expect(p.sourceNode).toBe(source);
        expect(p.offsetInNode).toBe(7 + offset);
        expect(p.boxOffset).toBe(31 + offset);
        offset += p.viewNode.length;
      });
      expect(result.map((p) => p.viewNode.data)).toEqual([
        "😀",
        "「",
        "字́",
        "」",
        "ABC",
      ]);
      expect(source.data).toBe("😀「字́」ABC");
      expect(point.offsetInNode).toBe(7);
    });

    it("does not split generated content using native autospace", function () {
      if (!NativeTextSpacing.supportsAutospace(document, "normal")) {
        pending("native autospace unavailable");
      }
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
  });

  describe("ASCII hanging punctuation at block edges (Issue #2192)", function () {
    let style;

    beforeEach(function () {
      style = document.createElement("style");
      style.textContent = VivliostylePolyfillCss;
      document.head.appendChild(style);
    });

    afterEach(function () {
      style.remove();
    });

    for (const native of [true, false]) {
      describe(
        native ? "with native trimming" : "without native trimming",
        function () {
          beforeEach(function () {
            if (native) {
              if (!hasTrimProperty) {
                pending("native trimming unavailable");
              }
            } else {
              spyOn(CSS, "supports").and.returnValue(false);
            }
          });

          const firstLast = new Css.SpaceList([
            Css.getName("first"),
            Css.getName("last"),
          ]);

          for (const [open, close] of [
            ["(", ")"],
            ["[", "]"],
            ["{", "}"],
            ['"', '"'],
            ["'", "'"],
          ]) {
            it(`hangs ${open} and ${close} within a text node`, function () {
              const text = `${open}Text (inside), it's [quoted].${close}`;
              layout(text, { "hanging-punctuation": firstLast });
              expect(element.querySelector(".viv-hang-first").textContent).toBe(
                open,
              );
              expect(element.querySelector(".viv-hang-last").textContent).toBe(
                close,
              );
              expect(element.childNodes.length).toBe(3);
              expect(element.childNodes[1].data).toBe(
                "Text (inside), it's [quoted].",
              );
              expect(element.textContent).toBe(text);
            });
          }

          it("handles nested inlines between collapsible white space", function () {
            layout(" \n<span><em>(Text)</em></span> \n", {
              "hanging-punctuation": firstLast,
            });
            expect(element.querySelectorAll(".viv-hang-first").length).toBe(1);
            expect(element.querySelectorAll(".viv-hang-last").length).toBe(1);
          });

          it("hangs last punctuation before trailing collapsible white space", function () {
            for (const html of [
              "(Text) \n",
              "<span>「Text」</span> \t<span> \n</span> ",
            ]) {
              layout(html, { "hanging-punctuation": firstLast });
              expect(element.querySelectorAll(".viv-hang-last").length).toBe(1);
            }
          });

          it("respects preserved spaces and segment breaks after punctuation", function () {
            for (const [whitespace, css, tail, hangs] of [
              [Vtree.Whitespace.PRESERVE, "pre", " ", false],
              [Vtree.Whitespace.NEWLINE, "pre-line", "\n", false],
              [Vtree.Whitespace.NEWLINE, "pre-line", " \t", true],
            ]) {
              element.style.whiteSpace = css;
              element.innerHTML = `<span>(Text)</span>${tail}`;
              const { blockContext, points } = createCheckPoints({
                "hanging-punctuation": firstLast,
              });
              for (const point of points) {
                point.whitespace = whitespace;
              }
              polyfill.postLayoutBlock(blockContext, points);
              expect(element.querySelectorAll(".viv-hang-last").length)
                .withContext(css + JSON.stringify(tail))
                .toBe(hangs ? 1 : 0);
            }
          });

          it("does not hang before content following collapsible white space", function () {
            layout("Text<span>)</span> \n<span>tail</span>", {
              "hanging-punctuation": firstLast,
            });
            expect(element.querySelector(".viv-hang-last")).toBeNull();
          });

          it("does not hang at the interior edges of forced lines", function () {
            layout("(First)<br>(Last)", { "hanging-punctuation": firstLast });
            expect(element.querySelectorAll(".viv-hang-first").length).toBe(1);
            expect(element.querySelectorAll(".viv-hang-last").length).toBe(1);
            expect(element.firstChild.textContent).toBe("(");
            expect(element.lastChild.textContent).toBe(")");
            expect(element.childNodes[1].data).toBe("First)");
            expect(element.childNodes[3].data).toBe("(Last");
          });

          it("keeps combining marks with the hanging punctuation", function () {
            layout("(\u0301Text)\u0301", { "hanging-punctuation": firstLast });
            expect(element.querySelector(".viv-hang-first").textContent).toBe(
              "(\u0301",
            );
            expect(element.querySelector(".viv-hang-last").textContent).toBe(
              ")\u0301",
            );
          });

          it("only splits the requested edges in ASCII-heavy text", function () {
            const inside = "Text (inside), it's [quoted]. ".repeat(20);
            for (const value of ["none", "first", "last"]) {
              layout(`(${inside})`, { "hanging-punctuation": value });
              expect(element.childNodes.length).toBe(value === "none" ? 1 : 2);
              expect(element.querySelectorAll(".viv-hang-first").length).toBe(
                value === "first" ? 1 : 0,
              );
              expect(element.querySelectorAll(".viv-hang-last").length).toBe(
                value === "last" ? 1 : 0,
              );
            }
          });

          it("preserves inline border and padding suppression", function () {
            layout(
              '<span style="border-inline-start:2px solid">(Text</span>' +
                '<span style="padding-inline-end:4px">text)</span>',
              { "hanging-punctuation": firstLast },
            );
            expect(element.querySelector(".viv-hang-first")).toBeNull();
            expect(element.querySelector(".viv-hang-last")).toBeNull();
          });

          it("splits generated ASCII content only at its edges", function () {
            element.textContent = '"Text (inside)"';
            polyfill.processGeneratedContent(
              element,
              Css.getName("no-autospace"),
              Css.getName("space-all"),
              firstLast,
              "en",
              false,
            );
            expect(element.querySelector(".viv-hang-first").textContent).toBe(
              '"',
            );
            expect(element.querySelector(".viv-hang-last").textContent).toBe(
              '"',
            );
            expect(element.childNodes.length).toBe(3);
          });
        },
      );
    }
  });

  describe("text-spacing-trim: trim-all and fullwidth colon punctuation", function () {
    let style;

    beforeEach(async function () {
      style = document.createElement("style");
      style.textContent = VivliostylePolyfillCss;
      document.head.appendChild(style);
      // The spaces of `viv-hang-end` and `viv-ts-auto` have the width of the
      // fallback font until the font is loaded, which depends on whether the
      // tests run before have used it
      await document.fonts.load('16px "-viv-ts-sp"');
    });

    afterEach(function () {
      style.remove();
    });

    function checkFullWidthFont() {
      element.textContent = "（・";
      const width = element.firstChild.length;
      const range = document.createRange();
      range.selectNodeContents(element);
      if (range.getBoundingClientRect().width < width * 16 * 0.9) {
        pending("full-width punctuation font unavailable");
      }
    }

    it("sets all the fullwidth punctuation half-width by the polyfill", function () {
      checkFullWidthFont();
      layout("「国（国）国、国・国。国：国」", {
        "text-spacing-trim": "trim-all",
      });
      if (hasTrimProperty) {
        // Browsers do not support trim-all (Issue #2214)
        expect(element.style.getPropertyValue("text-spacing-trim")).toBe(
          "space-all",
        );
      }
      const opens = element.querySelectorAll("viv-ts-open");
      const closes = element.querySelectorAll("viv-ts-close");
      const middles = element.querySelectorAll("viv-ts-middle");
      expect(Array.from(opens, (e) => e.textContent)).toEqual(["「", "（"]);
      expect(Array.from(closes, (e) => e.textContent)).toEqual([
        "）",
        "、",
        "。",
        "」",
      ]);
      expect(Array.from(middles, (e) => e.textContent)).toEqual(["・", "："]);
      for (const elem of [...opens, ...closes, ...middles]) {
        expect(elem.className).toBe("viv-ts-trim");
      }
      // 7 ideographs and 8 half-width punctuation
      const marker = document.createElement("span");
      element.append(marker);
      expect(
        marker.getBoundingClientRect().left -
          element.getBoundingClientRect().left,
      ).toBeCloseTo(7 * 16 + 8 * 8, 0);
      expect(element.textContent).toBe("「国（国）国、国・国。国：国」");
    });

    it("classifies the fullwidth colon and dot punctuation by language", function () {
      checkFullWidthFont();
      element.lang = "zh-Hans";
      element.innerHTML = "国：国、国";
      const { blockContext, points } = createCheckPoints(
        { "text-spacing-trim": "trim-all" },
        { lang: "zh-Hans" },
      );
      polyfill.postLayoutBlock(blockContext, points);
      expect(element.querySelectorAll("viv-ts-middle").length).toBe(0);
      expect(element.querySelectorAll("viv-ts-close").length).toBe(2);
    });

    it("does not trim the fullwidth colon punctuation not rotated in vertical text", function () {
      checkFullWidthFont();
      element.style.writingMode = "vertical-rl";
      element.style.height = element.style.width;
      element.style.width = "";
      for (const [lang, text, trimmed] of [
        ["ja", "国：国；国", ["："]],
        ["zh-Hant", "國：國；國", []],
        ["zh-Hans", "国：国；国", []],
      ]) {
        element.lang = lang;
        element.innerHTML = text;
        const { blockContext, points } = createCheckPoints(
          { "text-spacing-trim": "trim-all" },
          { lang, vertical: true },
        );
        polyfill.postLayoutBlock(blockContext, points);
        expect(
          Array.from(
            element.querySelectorAll(".viv-ts-trim"),
            (e) => e.textContent,
          ),
        )
          .withContext(lang)
          .toEqual(trimmed);
      }
    });

    it("does not trim the fullwidth colon punctuation not rotated in vertical text with trim-both", function () {
      checkFullWidthFont();
      // Vivliostyle's own implementation
      spyOn(CSS, "supports").and.returnValue(false);
      for (const vertical of [false, true]) {
        element.style.writingMode = vertical ? "vertical-rl" : "";
        element.lang = "zh-Hans";
        element.innerHTML = "国国：";
        const { blockContext, points } = createCheckPoints(
          { "text-spacing-trim": "trim-both" },
          { lang: "zh-Hans", vertical },
        );
        polyfill.postLayoutBlock(blockContext, points);
        // Closing punctuation at the end of the block in horizontal text
        expect(
          Array.from(
            element.querySelectorAll(".viv-ts-trim"),
            (e) => e.textContent,
          ),
        )
          .withContext(vertical ? "vertical" : "horizontal")
          .toEqual(vertical ? [] : ["："]);
      }
    });

    it("trims the fullwidth colon punctuation set sideways in vertical text", function () {
      checkFullWidthFont();
      element.style.writingMode = "vertical-rl";
      element.style.textOrientation = "sideways";
      element.style.height = element.style.width;
      element.style.width = "";
      for (const value of ["trim-all", "trim-both"]) {
        element.lang = "zh-Hans";
        element.innerHTML = "国：国；";
        const { blockContext, points } = createCheckPoints(
          { "text-spacing-trim": value },
          { lang: "zh-Hans", vertical: true },
        );
        polyfill.postLayoutBlock(blockContext, points);
        // trim-both trims only the closing punctuation at the end of the
        // block
        expect(
          Array.from(
            element.querySelectorAll("viv-ts-close.viv-ts-trim"),
            (e) => e.textContent,
          ),
        )
          .withContext(value)
          .toEqual(value === "trim-all" ? ["：", "；"] : ["；"]);
      }
    });

    it("does not trim the half-width punctuation at the end of the block that does not hang", function () {
      checkFullWidthFont();
      element.style.fontFeatureSettings = '"palt"';
      for (const value of ["trim-all", "trim-both"]) {
        layout("あいうえお。", {
          "text-spacing-trim": value,
          "hanging-punctuation": "allow-end",
        });
        const range = document.createRange();
        range.selectNodeContents(element);
        const stop = Array.from(element.querySelectorAll("viv-ts-close")).find(
          (e) => e.textContent === "。",
        );
        expect(stop?.className ?? "")
          .withContext(value)
          .toBe("");
        // The full stop keeps its advance
        const marker = document.createElement("span");
        element.append(marker);
        const stopRange = document.createRange();
        const text = element.lastChild.previousSibling;
        stopRange.selectNodeContents(stop ?? text);
        expect(
          marker.getBoundingClientRect().left -
            stopRange.getBoundingClientRect().left,
        )
          .withContext(value)
          .toBeGreaterThan(4);
      }
    });

    it("accepts keywords in any case, as substituted by var()", function () {
      checkFullWidthFont();
      layout("国（国）国・国", {
        "text-spacing-trim": Css.getName("TRIM-ALL"),
      });
      expect(element.querySelectorAll(".viv-ts-trim").length).toBe(3);
      layout("国国国国国国国国国国国国国国国国国国国国、", {
        "text-spacing-trim": Css.getName("Trim-Both"),
        "hanging-punctuation": new Css.SpaceList([Css.getName("FORCE-END")]),
      });
      expect(element.querySelector("viv-ts-close").className).toBe(
        "viv-hang-end",
      );
    });

    it("sets the punctuation that hangs half-width where it does not hang after the line is fitted again", function () {
      checkFullWidthFont();
      element.style.width = "4em";
      for (const value of ["force-end", "allow-end"]) {
        layout("国国。国。", {
          "text-spacing-trim": "trim-all",
          "hanging-punctuation": value,
        });
        // The first full stop is processed at the end of the first line, but
        // the following text moves to the line when the last one is
        // processed
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const lefts = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (let i = 0; i < node.length; i++) {
            if (node.data[i] === "国") {
              const range = document.createRange();
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              lefts.push(range.getBoundingClientRect().left);
            }
          }
        }
        expect(lefts.length).withContext(value).toBe(3);
        // 2 ideographs and the half-width full stop before the third
        // ideograph
        expect(lefts[2] - lefts[0])
          .withContext(value)
          .toBeCloseTo(2.5 * 16, 0);
        // The last full stop fits in the line when it is half-width, so it
        // hangs only with force-end
        const closes = element.querySelectorAll("viv-ts-close");
        expect(closes[closes.length - 1].className)
          .withContext(value)
          .toBe(value === "force-end" ? "viv-hang-end" : "viv-ts-trim");
      }
      // The last full stop does not fit in the line even when it is
      // half-width, so it hangs with allow-end
      layout("国国国国。", {
        "text-spacing-trim": "trim-all",
        "hanging-punctuation": "allow-end",
      });
      expect(element.querySelector("viv-ts-close").className).toBe(
        "viv-hang-end",
      );
    });

    it("centers the fullwidth dot punctuation in Traditional Chinese that does not hang", function () {
      checkFullWidthFont();
      element.lang = "zh-Hant";
      element.innerHTML = "國。國";
      const { blockContext, points } = createCheckPoints(
        {
          "text-spacing-trim": "trim-all",
          "hanging-punctuation": "force-end",
        },
        { lang: "zh-Hant" },
      );
      polyfill.postLayoutBlock(blockContext, points);
      const close = element.querySelector("viv-ts-close");
      expect(close.className).toBe("viv-ts-trim");
      expect(close.hasAttribute("data-viv-ts-middle")).toBe(true);
      const range = document.createRange();
      range.setStart(element.firstChild, 0);
      range.setEnd(element.firstChild, 1);
      const start = range.getBoundingClientRect().right;
      const innerRect = close.firstChild.getBoundingClientRect();
      // Centered in the half-width advance, as with trim-all alone
      expect(innerRect.left + innerRect.width / 2 - start).toBeCloseTo(4, 0);
    });

    it("does not trim the half-width punctuation that does not hang", function () {
      checkFullWidthFont();
      element.style.fontFeatureSettings = '"palt"';
      layout("あいうえお、かきくけこ。", {
        "text-spacing-trim": "trim-all",
        "hanging-punctuation": "force-end",
      });
      // The character after the comma does not overlap it
      const rectOf = (char) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const index = node.data.indexOf(char);
          if (index >= 0) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            return range.getBoundingClientRect();
          }
        }
        return null;
      };
      expect(rectOf("か").left - rectOf("、").left).toBeGreaterThan(4);
    });

    it("centers the middle dot punctuation in the half-width advance", function () {
      checkFullWidthFont();
      layout("国・国", { "text-spacing-trim": "trim-all" });
      const middle = element.querySelector("viv-ts-middle");
      const inner = middle.firstChild;
      const outerRect = middle.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      // The full-width glyph box is centered on the half-width advance
      expect(innerRect.left + innerRect.width / 2 - outerRect.left).toBeCloseTo(
        outerRect.width / 2,
        0,
      );
    });
  });

  describe("text-autospace at element boundaries", function () {
    const none = 'data-props=\'{"text-autospace":"no-autospace"}\'';
    const normal = 'data-props=\'{"text-autospace":"normal"}\'';

    it("does not insert autospace across white space between elements", function () {
      layout("<span>日本</span> <span>ABC</span>", {
        "text-autospace": "normal",
      });
      expect(element.querySelector("viv-ts-thin-sp")).toBeNull();
      expect(element.childNodes[1].textContent).toBe(" ");
    });

    it("inserts the spacing around an element with no-autospace if the parent has normal", function () {
      layout(`日本<code ${none}>span</code>語`, { "text-autospace": "normal" });
      const thinSps = element.querySelectorAll("viv-ts-thin-sp");
      expect(thinSps.length).toBe(2);
      thinSps.forEach((thinSp) => expect(thinSp.parentNode).toBe(element));
      expect(element.textContent).toBe("日本span語");
    });

    it("does not insert the spacing around an element in a parent with no-autospace", function () {
      layout(`abc<span ${normal}>日本</span>def`);
      expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(0);
    });

    it("does not insert the spacing between elements with normal in a parent with no-autospace", function () {
      // Both children enable the native autospace, which would insert the
      // spacing at the boundary
      layout(`<span ${normal}>日本</span><span ${normal}>ABC日本</span>`);
      const spans = element.querySelectorAll("span");
      if (NativeTextSpacing.supportsAutospace(document, "normal")) {
        expect(spans[1].style.getPropertyValue("text-autospace")).toBe(
          "no-autospace",
        );
      }
      // Only the spacing inside the second element is inserted
      const thinSps = element.querySelectorAll("viv-ts-thin-sp");
      expect(thinSps.length).toBe(1);
      expect(thinSps[0].parentNode).toBe(spans[1]);
    });

    it("inserts the spacing outside an element with no-autospace that contains ideographs", function () {
      layout(`<span ${none}>日本</span>abc`, { "text-autospace": "normal" });
      const thinSp = element.querySelector("viv-ts-thin-sp");
      expect(thinSp.parentNode).toBe(element);
      expect(thinSp.previousSibling.localName).toBe("span");
    });

    it("inserts the spacing at an element boundary after text directly in the parent", function () {
      // The native autospace may be added to the first character of the
      // element, which is left at the start of a line after a line break
      layout("日本<span>span</span>", { "text-autospace": "normal" });
      const thinSp = element.querySelector("viv-ts-thin-sp");
      expect(thinSp.parentNode).toBe(element);
      expect(thinSp.nextSibling.localName).toBe("span");
    });

    it("leaves the spacing between text nodes in the same element to the native autospace", function () {
      if (!NativeTextSpacing.supportsAutospace(document, "normal")) {
        pending("native autospace unavailable");
      }
      element.replaceChildren("日本", "ABC");
      const { blockContext, points } = createCheckPoints({
        "text-autospace": "normal",
      });
      polyfill.postLayoutBlock(blockContext, points);
      // WebKit does not insert the native spacing between text nodes
      expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(
        NativeTextSpacing.autospacesAcrossTextNodes(document) ? 0 : 1,
      );
    });

    it("inserts the spacing across an empty element", function () {
      layout("日本<b></b>ABC", { "text-autospace": "normal" });
      const thinSp = element.querySelector("viv-ts-thin-sp");
      expect(thinSp?.parentNode).toBe(element);
      expect(thinSp.nextSibling.localName).toBe("b");
    });

    it("does not insert the spacing where only the following element enables it in a parent with no-autospace", function () {
      layout(`日本<span ${normal}>ABC</span>`);
      expect(element.querySelectorAll("viv-ts-thin-sp").length).toBe(0);
      // Firefox would insert the native spacing determined by the following
      // side
      if (
        NativeTextSpacing.supportsAutospace(document, "normal") &&
        NativeTextSpacing.autospacesByFollowingSide(document)
      ) {
        expect(
          element
            .querySelector("span")
            .style.getPropertyValue("text-autospace"),
        ).toBe("no-autospace");
      }
    });

    it("inserts the spacing outside an element ending at the boundary", function () {
      // The native autospace would be rendered within the element
      layout("<u>日本</u>abc", { "text-autospace": "normal" });
      const thinSp = element.querySelector("viv-ts-thin-sp");
      expect(thinSp.parentNode).toBe(element);
      expect(thinSp.previousSibling.localName).toBe("u");
    });
  });

  describe("NativeTextSpacing.supportsTrim", function () {
    it("does not accept unsupported trim syntax merely because fonts can trim", function () {
      spyOn(CSS, "supports").and.returnValue(false);
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(false);
    });

    it("rejects a font whose full-width punctuation does not actually trim", function () {
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "unsupported-probe-font";
      element.textContent = "「日本語」";
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          return new DOMRect(0, 0, this.textContent.length * 16, 16);
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(false);
    });

    it("checks fallback glyphs as well as supported glyphs in the same font cascade", function () {
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "mixed-probe-font";
      element.textContent = "「日本語」";
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          const trims =
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
            this.textContent.includes("「");
          return new DOMRect(
            0,
            0,
            this.textContent.length * 16 - (trims ? 8 : 0),
            16,
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(false);
    });

    it("checks adjacent pairs of punctuation from different fonts", function () {
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "pair-probe-font";
      element.textContent = "国。「国";
      // Only identical punctuation (from the same font) is trimmed
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          const trims =
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
            /([。「])\1/u.test(this.textContent);
          return new DOMRect(
            0,
            0,
            this.textContent.length * 16 - (trims ? 8 : 0),
            16,
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(false);
    });

    // Width of the text with `’` and `·` narrow, reduced if `trims`
    function mixedWidth(text, trims) {
      const width = [...text].reduce(
        (w, c) => w + ("’·".includes(c) ? 8 : 16),
        0,
      );
      return new DOMRect(0, 0, width - (trims ? 8 : 0), 16);
    }

    it("checks a full-width punctuation before a narrow middle dot", function () {
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "narrow-dot-probe-font";
      element.textContent = "国。·国";
      // Only identical punctuation is trimmed
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          return mixedWidth(
            this.textContent,
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
              /([。「])\1/u.test(this.textContent),
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(false);
    });

    it("does not check an opening punctuation after a narrow closing quotation mark", function () {
      if (!hasTrimProperty) {
        pending("text-spacing-trim unavailable");
      }
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "narrow-quote-probe-font";
      element.textContent = "国’「国";
      // `’「` is not trimmed, as by the polyfill (Issue #1003)
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          return mixedWidth(
            this.textContent,
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
              /([。「])\1/u.test(this.textContent),
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(true);
    });

    it("checks a full-width punctuation before a narrow middle dot across elements", function () {
      if (!hasTrimProperty) {
        pending("text-spacing-trim unavailable");
      }
      element.innerHTML = '国。<span style="font-family: probe-c">·国</span>';
      // Only punctuation from the same font is trimmed
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          const fonts = new Set(
            [...this.children].map((child) => child.style.fontFamily),
          );
          return mixedWidth(
            this.textContent,
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
              fonts.size <= 1,
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrimPair(
          element,
          "。",
          element.querySelector("span"),
          "·",
          "ja",
          false,
        ),
      ).toBe(false);
    });

    it("checks a pair of punctuation across elements with different fonts", function () {
      if (!hasTrimProperty) {
        pending("text-spacing-trim unavailable");
      }
      element.innerHTML =
        '漢。<span style="font-family: probe-a">「漢</span>' +
        '<span style="font-family: probe-b">「漢</span>';
      const [span1, span2] = element.querySelectorAll("span");
      // Only punctuation from the same font is trimmed
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          const fonts = new Set(
            [...this.children].map((child) => child.style.fontFamily),
          );
          const trims =
            this.style.getPropertyValue("text-spacing-trim") === "normal" &&
            fonts.size <= 1;
          return new DOMRect(
            0,
            0,
            this.textContent.length * 16 - (trims ? 8 : 0),
            16,
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrimPair(
          element,
          "。",
          span1,
          "「",
          "ja",
          false,
        ),
      ).toBe(false);
      span2.style.fontFamily = "probe-a";
      expect(
        NativeTextSpacing.supportsTrimPair(
          span1,
          "「",
          span2,
          "「",
          "ja",
          false,
        ),
      ).toBe(true);
    });

    it("does not check an opening punctuation after other characters across elements", function () {
      element.innerHTML =
        '漢<span style="font-family: probe-a">「引用」</span>';
      // Nothing is trimmed: a pair that needs trimming would fail
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          return new DOMRect(0, 0, this.textContent.length * 16, 16);
        },
      );
      expect(
        NativeTextSpacing.supportsTrimPair(
          element,
          "漢",
          element.querySelector("span"),
          "「",
          "ja",
          false,
        ),
      ).toBe(true);
    });

    it("uses a separate font capability check for vertical text", function () {
      if (!hasTrimProperty) {
        pending("text-spacing-trim unavailable");
      }
      spyOn(CSS, "supports").and.returnValue(true);
      element.style.fontFamily = "vertical-probe-font";
      element.textContent = "「日本語」";
      spyOn(Element.prototype, "getBoundingClientRect").and.callFake(
        function () {
          const trims =
            this.style.getPropertyValue("text-spacing-trim") === "normal";
          return new DOMRect(
            0,
            0,
            this.textContent.length * 16 - (trims ? 8 : 0),
            this.textContent.length * 16,
          );
        },
      );
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", false),
      ).toBe(true);
      expect(
        NativeTextSpacing.supportsTrim(element, "normal", "ja", true),
      ).toBe(false);
    });
  });
});
