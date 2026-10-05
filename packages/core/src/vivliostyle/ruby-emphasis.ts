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
 *
 * @fileoverview Ruby and text-emphasis boundary leading (Issue #1604).
 *
 * Negative margins belong only to a root fragment's first line and block-start
 * side. Applying them to normal lines or block-end removes the space browsers
 * reserve between opposing over/under annotations and can make those overlap.
 * End-side overflow is a bounded break-measurement allowance, not a margin.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssCascade from "./css-cascade";
import * as Display from "./display";
import { Vtree } from "./types";

const viewContexts = new WeakMap<
  Element,
  { boundary: boolean; outOfFlow: boolean }
>();

/**
 * Preserve source layout roles before floats and other boxes are rewritten.
 * Computed view styles alone can no longer identify the original BFC or float.
 */
export function registerViewContext(
  element: Element,
  node: Vtree.NodeContext,
  position: Css.Ident | null | undefined,
): void {
  viewContexts.set(element, {
    boundary:
      node.establishesBFC ||
      (!!node.parent &&
        node.formattingContext !== node.parent.formattingContext),
    outOfFlow: !!node.floatSide || Display.isAbsolutelyPositioned(position),
  });
}

function isOutOfFlow(element: Element, style: CSSStyleDeclaration): boolean {
  return (
    viewContexts.get(element)?.outOfFlow ||
    !!element.getAttribute("data-adapt-spec") ||
    ["absolute", "fixed"].includes(style.position) ||
    (!!style.float && style.float !== "none")
  );
}

/** Record eligible ruby; its line is not known while the view is being built. */
export function prepareRubyAnnotation(
  target: Element,
  ruby: HTMLElement | null,
  computedStyle: { [key: string]: Css.Val },
  window: Window,
  sourceRuby: Element | null = ruby,
  getSourceDisplay?: (element: Element) => string | undefined,
  cascadedMargins: { [key: string]: CssCascade.CascadeValue } = {},
): void {
  if (
    !["chromium", "webkit", "firefox"].includes(Base.browserType) ||
    computedStyle["display"] !== Css.getName("ruby-text") ||
    (computedStyle["position"] &&
      computedStyle["position"] !== Css.ident._static)
  ) {
    return;
  }
  if (!ruby) {
    return;
  }
  if (inNestedColumns(ruby, (e) => window.getComputedStyle(e))) return;
  const style = window.getComputedStyle(ruby);
  // Judge ruby by its display role, including spans styled as ruby/ruby-text.
  // Check the source too: later annotations may not exist in the view yet.
  if (
    style.display !== "ruby" ||
    Array.from(sourceRuby?.querySelectorAll("*") || []).some((element) => {
      const display = getSourceDisplay?.(element);
      return (
        element.localName === "rtc" ||
        element.localName === "ruby" ||
        display === "ruby" ||
        display === "ruby-text-container" ||
        display === "ruby-base-container"
      );
    })
  ) {
    return;
  }
  const position =
    computedStyle["ruby-position"]?.toString() ||
    ruby
      .closest("[data-viv-ruby-position]")
      ?.getAttribute("data-viv-ruby-position") ||
    style.rubyPosition;
  if (position !== "over" && position !== "under") {
    return;
  }
  const atStart =
    (position === "over") !== (style.writingMode === "vertical-lr");
  const side = atStart ? "start" : "end";
  // Firefox already handles start-side leading; only permit end ink when breaking.
  if (Base.browserType === "firefox" && atStart) return;
  const physicalSide =
    style.writingMode === "horizontal-tb"
      ? atStart
        ? "top"
        : "bottom"
      : (style.writingMode === "vertical-lr") === atStart
        ? "left"
        : "right";
  // Ignore normal zero resets, even when explicitly targeted at ruby-text.
  // Important zero is an opt-out; nonzero/auto/other values remain untouched.
  if (
    [`margin-block-${side}`, `margin-${physicalSide}`].some((name) => {
      const value = computedStyle[name];
      const declaration = cascadedMargins[name];
      return (
        (declaration && CssCascade.isImportant(declaration)) ||
        (value &&
          !(
            (value instanceof Css.Numeric || value instanceof Css.Num) &&
            value.num === 0
          ))
      );
    })
  ) {
    return;
  }
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight);
  const leading = Math.max(0, (lineHeight - fontSize) / 2);
  if (Number.isFinite(leading) && leading > 0) {
    target.setAttribute(`data-viv-ruby-${side}`, `${leading}`);
  }
}

type BlockSide = "start" | "end";
const adjustmentAttribute = "data-viv-emphasis-adjust";
const savedMargins = new WeakMap<
  HTMLElement,
  { value: string; priority: string }
>();

/** Convert line-relative emphasis position to a logical block side. */
export function emphasisSide(writingMode: string, position: string): BlockSide {
  if (writingMode === "horizontal-tb") {
    return position.includes("under") ? "end" : "start";
  }
  const right = !position.includes("left");
  return right !== (writingMode === "vertical-lr") ? "start" : "end";
}

function halfLeading(style: CSSStyleDeclaration): number {
  // An intentionally conservative approximation, not the font's used metrics.
  const value = (parseFloat(style.lineHeight) - parseFloat(style.fontSize)) / 2;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Compensate start emphasis only in the first paragraph fragment of a root
 * column. Preserve native spacing within it and restore all measurement styles.
 */
export function adjustEmphasisBlock(
  block: HTMLElement,
  clientLayout: Vtree.ClientLayout,
  atColumnStart = false,
): void {
  if (Base.browserType !== "chromium") {
    return; // WebKit emphasis leading and Firefox are left unchanged.
  }
  const previous = savedMargins.get(block);
  if (previous) {
    block.style.setProperty(
      "margin-block-start",
      previous.value,
      previous.priority,
    );
    block.style.removeProperty("--viv-emphasis-start");
    block.removeAttribute(adjustmentAttribute);
    savedMargins.delete(block);
  }
  if (
    !atColumnStart ||
    inNestedColumns(block, (e) => clientLayout.getElementComputedStyle(e))
  )
    return;
  // Most paragraphs have no emphasis. Avoid forcing layout for those.
  if (
    !block.closest('[style*="text-emphasis"]') &&
    !block.querySelector('[style*="text-emphasis"]')
  ) {
    return;
  }
  const getStyle = (element: Element) =>
    clientLayout.getElementComputedStyle(element);
  const style = getStyle(block);
  if (style.display !== "block" && style.display !== "list-item") {
    return;
  }
  const vertical = style.writingMode !== "horizontal-tb";
  const leftToRight = style.writingMode === "vertical-lr";
  // Fixed-size boxes and nested block layout require a different model.
  if (
    block.style.getPropertyValue(vertical ? "width" : "height") ||
    block.style.blockSize ||
    isOutOfFlow(block, style) ||
    style.float !== "none"
  ) {
    return;
  }
  const elements = [
    block,
    ...Array.from(block.querySelectorAll<HTMLElement>("*")),
  ];
  const marked: { element: HTMLElement; value: string; priority: string }[] =
    [];
  let startLimit = 0;
  for (const element of elements) {
    const childStyle = getStyle(element);
    if (
      element !== block &&
      childStyle.display !== "none" &&
      !["inline", "ruby", "ruby-base", "ruby-text"].includes(
        childStyle.display,
      ) &&
      !isAtomicInline(element, childStyle)
    ) {
      return; // Do not compensate nested blocks, rtc, etc. twice.
    }
    if (
      childStyle.textEmphasisStyle &&
      childStyle.textEmphasisStyle !== "none"
    ) {
      // An unmarked atomic prefix can share the outer first line; emphasis
      // inside its own formatting context needs separate measurement.
      if (element !== block && isAtomicInline(element, childStyle)) return;
      if (childStyle.writingMode !== style.writingMode) {
        return;
      }
      const side = emphasisSide(
        style.writingMode,
        childStyle.textEmphasisPosition,
      );
      if (side === "start")
        startLimit = Math.max(startLimit, halfLeading(childStyle));
      marked.push({
        element,
        value: element.style.getPropertyValue("text-emphasis-style"),
        priority: element.style.getPropertyPriority("text-emphasis-style"),
      });
    }
  }
  if (!marked.length || !startLimit) {
    return;
  }
  const allowed = (side: BlockSide) =>
    parseFloat(style.getPropertyValue(`margin-block-${side}`)) === 0 &&
    parseFloat(style.getPropertyValue(`padding-block-${side}`)) === 0 &&
    parseFloat(style.getPropertyValue(`border-block-${side}-width`)) === 0;
  const allowStart = allowed("start");
  if (!allowStart || hasStartBoundary(block, clientLayout)) {
    return;
  }
  const textNodes: Node[] = [];
  const walker = block.ownerDocument.createTreeWalker(block, 4 /* SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (
      /\S/.test(node.textContent || "") &&
      !node.parentElement?.closest("rt, rtc, rp")
    ) {
      textNodes.push(node);
    }
  }
  if (!textNodes.length) {
    return;
  }
  const columns: {
    element: HTMLElement;
    property: string;
    value: string;
    priority: string;
  }[] = [];
  const inlineSize = block.style.inlineSize;
  const inlinePriority = block.style.getPropertyPriority("inline-size");
  const usedInlineSize = style.inlineSize;
  const measure = () => {
    const rect = clientLayout.getElementClientRect(block);
    const start = vertical ? (leftToRight ? rect.left : -rect.right) : rect.top;
    const end = vertical
      ? leftToRight
        ? rect.right
        : -rect.left
      : rect.bottom;
    const positions: { start: number; end: number }[] = [];
    const range = block.ownerDocument.createRange();
    for (const node of textNodes) {
      range.selectNodeContents(node);
      for (const r of clientLayout.getRangeClientRects(range)) {
        if (r.width > 0 && r.height > 0) {
          positions.push({
            start:
              (vertical ? (leftToRight ? r.left : -r.right) : r.top) - start,
            end:
              (vertical ? (leftToRight ? r.right : -r.left) : r.bottom) - start,
          });
        }
      }
    }
    return { start, size: end - start, positions };
  };
  let on: ReturnType<typeof measure>;
  let off: ReturnType<typeof measure>;
  try {
    // Compare continuous lines, before browser column breaking can move a line
    // to another column. Keep the paragraph's original inline size for wrapping.
    block.style.setProperty("inline-size", usedInlineSize, "important");
    for (
      let ancestor = block.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const ancestorStyle = getStyle(ancestor);
      if (
        ancestorStyle.columnCount !== "auto" ||
        ancestorStyle.columnWidth !== "auto"
      ) {
        for (const prop of ["column-count", "column-width"]) {
          columns.push({
            element: ancestor,
            property: prop,
            value: ancestor.style.getPropertyValue(prop),
            priority: ancestor.style.getPropertyPriority(prop),
          });
          ancestor.style.setProperty(prop, "auto", "important");
        }
      }
    }
    on = measure();
    for (const { element } of marked) {
      element.style.setProperty("text-emphasis-style", "none", "important");
    }
    off = measure();
  } finally {
    for (const { element, value, priority } of marked) {
      element.style.setProperty("text-emphasis-style", value, priority);
    }
    columns.forEach(({ element, property, value, priority }) => {
      element.style.setProperty(property, value, priority);
    });
    block.style.setProperty("inline-size", inlineSize, inlinePriority);
  }
  if (!on.positions.length || on.positions.length !== off.positions.length) {
    return;
  }
  const delta = on.positions[0].start - off.positions[0].start;
  const tolerance = 0.5;
  if (
    on.positions.some(
      (p, i) =>
        Math.abs(p.start - off.positions[i].start - delta) > tolerance ||
        Math.abs(p.end - off.positions[i].end - delta) > tolerance,
    )
  ) {
    return; // Moving the block cannot fix extra paragraph-internal leading.
  }
  // Chromium can share the preceding paragraph's half-leading by moving this
  // block back while keeping its text in place. Include that block movement:
  // an offset relative to the block alone would subtract the shared space twice.
  const textDelta = on.start - off.start + delta;
  const start = allowStart ? Math.min(startLimit, Math.max(0, textDelta)) : 0;
  if (start <= tolerance) return;
  savedMargins.set(block, {
    value: block.style.getPropertyValue("margin-block-start"),
    priority: block.style.getPropertyPriority("margin-block-start"),
  });
  block.style.setProperty("--viv-emphasis-start", `${-start}px`);
  block.style.setProperty("margin-block-start", "var(--viv-emphasis-start)");
  block.setAttribute(adjustmentAttribute, "block-start");
}

/**
 * Author multi-column content is outside the boundary correction scope.
 * Its first line may neighbor under annotations outside the column box, so it
 * cannot be treated as the isolated start of a page/root-column fragment.
 */
function inNestedColumns(
  element: Element,
  getStyle: (element: Element) => CSSStyleDeclaration,
): boolean {
  for (let e: Element | null = element; e; e = e.parentElement) {
    if (e.hasAttribute("data-vivliostyle-column")) break;
    const style = getStyle(e);
    if (
      (style.columnCount && style.columnCount !== "auto") ||
      (style.columnWidth && style.columnWidth !== "auto")
    )
      return true;
  }
  return false;
}

/** Start correction stays in the document's root BFC, inside author borders. */
function hasStartBoundary(
  element: Element,
  layout: Vtree.ClientLayout,
): boolean {
  const mode = layout.getElementComputedStyle(element).writingMode;
  const side =
    mode === "horizontal-tb"
      ? "top"
      : mode === "vertical-lr"
        ? "left"
        : "right";
  for (let e: Element | null = element; e; e = e.parentElement) {
    // Page decoration never changes the content's compensation policy.
    if (e.hasAttribute("data-vivliostyle-page-box")) break;
    const style = layout.getElementComputedStyle(e);
    if (
      // The page area's transparent border is an internal measurement gutter,
      // not an author separator.
      !e.hasAttribute("data-vivliostyle-page-area") &&
      parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0
    )
      return true;
    if (e.hasAttribute("data-vivliostyle-column")) break;
    const context = viewContexts.get(e);
    if (
      isOutOfFlow(e, style) ||
      (context
        ? context.boundary
        : Display.establishesBFC(
            Css.getName(style.display),
            Css.getName(style.position || "static"),
            Css.getName(style.float || "none"),
            Css.getName(style.overflow || "visible"),
          )) ||
      // Tables and flex/grid formatting also isolate their descendant blocks.
      ![
        "block",
        "list-item",
        "inline",
        "contents",
        "ruby",
        "ruby-base",
        "ruby-text",
      ].includes(style.display)
    )
      return true;
  }
  return false;
}

const savedRubyMargins = new WeakMap<
  HTMLElement,
  { value: string; priority: string }
>();
const savedColumnSizes = new WeakMap<
  HTMLElement,
  {
    property: string;
    value: string;
    priority: string;
    left: string;
    leftPriority: string;
    columnCount: string;
    columnWidth: string;
  }
>();

/** Only in-flow base text identifies a line; annotation ink can precede it. */
function baseRects(
  element: Node,
  layout: Vtree.ClientLayout,
): Vtree.ClientRect[] {
  const texts: Node[] = [];
  if (element.nodeType === 3) texts.push(element);
  else {
    const walker = element.ownerDocument.createTreeWalker(element, 4);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
  }
  const rects: Vtree.ClientRect[] = [];
  for (const text of texts) {
    if (!/\S/.test(text.textContent || "")) continue;
    let excluded = false;
    for (let e = text.parentElement; e; e = e.parentElement) {
      if (e.hasAttribute("data-vivliostyle-column")) break;
      const style = layout.getElementComputedStyle(e);
      if (
        ["rt", "rp", "rtc", "script", "style"].includes(e.localName) ||
        style.display === "ruby-text" ||
        style.display === "none" ||
        isOutOfFlow(e, style)
      ) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(text);
    rects.push(
      ...layout
        .getRangeClientRects(range)
        .filter((r) => r.width > 0 && r.height > 0),
    );
  }
  return rects;
}

/** Atomic inline boxes identify their outer line, not lines inside the box. */
function isAtomicInline(element: Element, style: CSSStyleDeclaration): boolean {
  return (
    !!Base.mediaTags[element.localName] ||
    ["input", "select", "textarea", "button", "meter", "progress"].includes(
      element.localName,
    ) ||
    ["inline-block", "inline-flex", "inline-grid", "inline-table"].includes(
      style.display,
    )
  );
}

function firstBase(
  column: HTMLElement,
  layout: Vtree.ClientLayout,
): { node: Node; rect: Vtree.ClientRect } | null {
  const walker = column.ownerDocument.createTreeWalker(
    column,
    5 /* element and text */,
    {
      acceptNode(node) {
        if (node.nodeType === 1) {
          const e = node as Element;
          const style = layout.getElementComputedStyle(e);
          if (
            isOutOfFlow(e, style) ||
            style.display === "none" ||
            style.display === "ruby-text" ||
            ["rt", "rp", "rtc", "script", "style"].includes(e.localName)
          )
            return 2; // FILTER_REJECT: ignore the entire out-of-flow subtree.
        }
        return 1; // FILTER_ACCEPT
      },
    },
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === 1 && (node as Element).localName === "br") {
      // A leading empty line is still the first line. Never move the next one up.
      return null;
    }
    if (node.nodeType === 1) {
      const e = node as Element;
      const style = layout.getElementComputedStyle(e);
      if (isAtomicInline(e, style)) {
        const rect = layout.getElementClientRect(e);
        // Compare the annotation's base with this line. A small leading image
        // can share it, while a width-filling box can push ruby to the next line.
        if (rect.width > 0 && rect.height > 0) return { node, rect };
      }
    }
    if (node.nodeType !== 3) continue;
    const rect = baseRects(node, layout)[0];
    if (rect) return { node, rect };
  }
  return null;
}

function onFirstLine(
  rect: Vtree.ClientRect,
  first: Vtree.ClientRect,
  column: Vtree.ClientRect,
  vertical: boolean,
): boolean {
  const start = vertical ? rect.left : rect.top;
  const end = vertical ? rect.right : rect.bottom;
  const firstStart = vertical ? first.left : first.top;
  const firstEnd = vertical ? first.right : first.bottom;
  const overlap = Math.min(end, firstEnd) - Math.max(start, firstStart);
  const inlineStart = vertical ? rect.top : rect.left;
  const inlineEnd = vertical ? rect.bottom : rect.right;
  return (
    overlap > Math.min(end - start, firstEnd - firstStart) / 2 &&
    inlineStart >= (vertical ? column.top : column.left) - 0.5 &&
    inlineEnd <= (vertical ? column.bottom : column.right) + 0.5
  );
}

/** Pair simple rt with the bases since the previous annotation (also CSS ruby). */
function annotationBases(
  annotation: Element,
  layout: Vtree.ClientLayout,
): Vtree.ClientRect[] {
  const rects: Vtree.ClientRect[] = [];
  for (
    let node = annotation.previousSibling;
    node;
    node = node.previousSibling
  ) {
    if (
      node.nodeType === 1 &&
      (node.nodeName.toLowerCase() === "rt" ||
        layout.getElementComputedStyle(node as Element).display === "ruby-text")
    )
      break;
    rects.push(...baseRects(node, layout));
  }
  return rects;
}

/** Emphasis has no DOM annotation box; allow end leading without moving text. */
function prepareEmphasisEnd(
  block: HTMLElement,
  layout: Vtree.ClientLayout,
): void {
  if (Base.browserType !== "chromium") return;
  const style = layout.getElementComputedStyle(block);
  if (
    ![
      style.marginBlockEnd,
      style.paddingBlockEnd,
      style.borderBlockEndWidth,
    ].every((v) => parseFloat(v) === 0)
  )
    return;
  for (const element of [
    block,
    ...Array.from(block.querySelectorAll<HTMLElement>("*")),
  ]) {
    const cs = layout.getElementComputedStyle(element);
    if (
      Array.from(element.childNodes).some(
        (n) => n.nodeType === 3 && /\S/.test(n.textContent || ""),
      ) &&
      cs.textEmphasisStyle &&
      cs.textEmphasisStyle !== "none" &&
      emphasisSide(cs.writingMode, cs.textEmphasisPosition) === "end" &&
      halfLeading(cs) > 0 &&
      !inNestedColumns(element, (e) => layout.getElementComputedStyle(e))
    )
      element.setAttribute("data-viv-emphasis-end", `${halfLeading(cs)}`);
  }
}

/** Apply margins only at a root fragment's first line; keep end allowances separate. */
export function adjustAnnotationsForNodes(
  nodes: Vtree.NodeContext[],
  layout: Vtree.ClientLayout,
): void {
  if (!["chromium", "webkit", "firefox"].includes(Base.browserType)) return;
  const roots = new Set<HTMLElement>();
  const blocks = new Set<HTMLElement>();
  for (const node of nodes) {
    for (let n: Vtree.NodeContext | null = node; n; n = n.parent) {
      if (!n.inline && n.viewNode?.nodeType === 1) {
        const block = n.viewNode as HTMLElement;
        const root = block.closest<HTMLElement>("[data-vivliostyle-column]");
        if (root) roots.add(root);
        if (!inNestedColumns(block, (e) => layout.getElementComputedStyle(e)))
          blocks.add(block);
        break;
      }
    }
  }
  for (const root of roots) {
    // Leave ordinary layout untouched, including its measurement timing.
    if (
      !root.querySelector(
        '[data-viv-ruby-start], [data-viv-ruby-end], [style*="text-emphasis"]',
      ) &&
      !root.closest('[style*="text-emphasis"]')
    )
      continue;
    const annotations = Array.from(
      root.querySelectorAll<HTMLElement>("[data-viv-ruby-start]"),
    );
    for (const annotation of annotations) {
      const saved = savedRubyMargins.get(annotation);
      if (saved) {
        annotation.style.setProperty(
          "margin-block-start",
          saved.value,
          saved.priority,
        );
        savedRubyMargins.delete(annotation);
      }
    }
    const first = firstBase(root, layout);
    const rootStyle = layout.getElementComputedStyle(root);
    const vertical = rootStyle.writingMode !== "horizontal-tb";
    const column = layout.getElementClientRect(root);
    const selected =
      first && Base.browserType !== "firefox"
        ? annotations.filter((annotation) => {
            if (
              hasStartBoundary(annotation, layout) ||
              inNestedColumns(annotation, (e) =>
                layout.getElementComputedStyle(e),
              ) ||
              layout.getElementComputedStyle(annotation).writingMode !==
                rootStyle.writingMode
            )
              return false;
            const bases = annotationBases(annotation, layout);
            return (
              bases.length > 0 &&
              bases.every((r) => onFirstLine(r, first.rect, column, vertical))
            );
          })
        : [];
    for (const annotation of selected) {
      savedRubyMargins.set(annotation, {
        value: annotation.style.marginBlockStart,
        priority: annotation.style.getPropertyPriority("margin-block-start"),
      });
      annotation.style.setProperty(
        "margin-block-start",
        `${-parseFloat(annotation.getAttribute("data-viv-ruby-start"))}px`,
      );
    }
    for (const block of blocks) {
      if (!root.contains(block)) continue;
      prepareEmphasisEnd(block, layout);
      adjustEmphasisBlock(block, layout, !!first && block.contains(first.node));
    }
    // End measurement must not enlarge the space available to author columns.
    if (
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[style*="column-count"], [style*="column-width"]',
        ),
      ).some((e) =>
        inNestedColumns(e, (e) => layout.getElementComputedStyle(e)),
      )
    ) {
      finishAnnotationLayout(root, layout, true);
      continue;
    }
    const ends = Array.from(
      root.querySelectorAll<HTMLElement>(
        "[data-viv-ruby-end], [data-viv-emphasis-end]",
      ),
    ).filter(
      (e) => !inNestedColumns(e, (e) => layout.getElementComputedStyle(e)),
    );
    // WebKit's native root fragmentation can be early even for start ruby.
    const amount = Math.max(
      0,
      ...ends.map((e) =>
        parseFloat(
          e.getAttribute("data-viv-ruby-end") ||
            e.getAttribute("data-viv-emphasis-end") ||
            "0",
        ),
      ),
      ...(Base.browserType === "webkit" &&
      rootStyle.writingMode === "vertical-rl"
        ? selected.map((e) => parseFloat(e.getAttribute("data-viv-ruby-start")))
        : []),
    );
    if (
      !(amount > 0) ||
      !["horizontal-tb", "vertical-rl"].includes(rootStyle.writingMode)
    )
      continue;
    const property = vertical ? "width" : "height";
    if (!savedColumnSizes.has(root))
      savedColumnSizes.set(root, {
        property,
        value: root.style.getPropertyValue(property),
        priority: root.style.getPropertyPriority(property),
        left: root.style.left,
        leftPriority: root.style.getPropertyPriority("left"),
        columnCount: root.style.columnCount,
        columnWidth: root.style.columnWidth,
      });
    const saved = savedColumnSizes.get(root);
    const size = parseFloat(saved.value);
    if (!Number.isFinite(size)) continue;
    if (Base.browserType === "webkit") {
      root.style.columnCount = "auto";
      root.style.columnWidth = "auto";
    } else {
      const extended = Math.max(
        parseFloat(root.style.getPropertyValue(property)),
        size + amount,
      );
      root.style.setProperty(property, `${extended}px`, saved.priority);
      if (vertical && Number.isFinite(parseFloat(saved.left)))
        root.style.setProperty(
          "left",
          `${parseFloat(saved.left) - extended + size}px`,
          saved.leftPriority,
        );
    }
    root.setAttribute("data-viv-end-annotations", "true");
  }
}

/** Restore only the measurement area. Native paragraph spacing is never trimmed. */
export function finishAnnotationLayout(
  column: HTMLElement,
  _layout: Vtree.ClientLayout,
  restoreBreaking = false,
): void {
  const saved = savedColumnSizes.get(column);
  if (!saved) return;
  column.style.setProperty(saved.property, saved.value, saved.priority);
  column.style.setProperty("left", saved.left, saved.leftPriority);
  if (restoreBreaking) {
    column.style.columnCount = saved.columnCount;
    column.style.columnWidth = saved.columnWidth;
  }
  savedColumnSizes.delete(column);
}

/** Discount only the permitted part of an end ruby's ink when choosing a break. */
export function adjustRubyEndRects(
  rects: Vtree.ClientRect[],
  element: Element,
  vertical: boolean,
): void {
  const annotation = element.closest("[data-viv-ruby-end]");
  const amount = parseFloat(
    annotation?.getAttribute("data-viv-ruby-end") || "0",
  );
  if (
    !(amount > 0) ||
    inNestedColumns(element, (e) =>
      e.ownerDocument.defaultView.getComputedStyle(e),
    )
  )
    return;
  const mode =
    annotation.ownerDocument.defaultView.getComputedStyle(
      annotation,
    ).writingMode;
  if (mode !== (vertical ? "vertical-rl" : "horizontal-tb")) return;
  for (const rect of rects) {
    if (vertical) {
      rect.left = Math.min(rect.right, rect.left + amount);
      rect.width = rect.right - rect.left;
    } else {
      rect.bottom = Math.max(rect.top, rect.bottom - amount);
      rect.height = rect.bottom - rect.top;
    }
  }
}

/**
 * Keep end annotations on their base line when grouping range rectangles.
 * WebKit's under ruby rects can be disjoint from the base glyphs, which would
 * otherwise create a false extra line and permit a break before the ruby in
 * the middle of a fitting base line. Extend only the start edge for grouping;
 * retain the annotation's end extent and the bounded overflow allowance.
 */
export function includeRubyBaseInLineRects(
  rects: Vtree.ClientRect[],
  element: Element,
  layout: Vtree.ClientLayout,
  vertical: boolean,
): void {
  const annotation = element.closest("[data-viv-ruby-end]");
  if (
    !annotation ||
    inNestedColumns(annotation, (e) => layout.getElementComputedStyle(e)) ||
    layout.getElementComputedStyle(annotation).writingMode !==
      (vertical ? "vertical-rl" : "horizontal-tb")
  )
    return;
  const bases = annotationBases(annotation, layout);
  for (const rect of rects) {
    for (const base of bases) {
      const overlap = vertical
        ? Math.min(rect.bottom, base.bottom) - Math.max(rect.top, base.top)
        : Math.min(rect.right, base.right) - Math.max(rect.left, base.left);
      if (!(overlap > 0)) continue;
      if (vertical) {
        rect.right = Math.max(rect.right, base.right);
        rect.width = rect.right - rect.left;
      } else {
        rect.top = Math.min(rect.top, base.top);
        rect.height = rect.bottom - rect.top;
      }
    }
  }
}

/** End allowance is for the last annotated line, never for borders or padding. */
export function blockEndAllowance(
  element: Element,
  layout: Vtree.ClientLayout,
  vertical: boolean,
): number {
  if (
    !element.hasAttribute("data-viv-ruby-end") &&
    !element.hasAttribute("data-viv-emphasis-end") &&
    !element.querySelector("[data-viv-ruby-end], [data-viv-emphasis-end]")
  )
    return 0;
  if (inNestedColumns(element, (e) => layout.getElementComputedStyle(e)))
    return 0;
  const style = layout.getElementComputedStyle(element);
  if (
    style.writingMode &&
    style.writingMode !== (vertical ? "vertical-rl" : "horizontal-tb")
  )
    return 0;
  if (
    parseFloat(style.paddingBlockEnd) > 0 ||
    parseFloat(style.borderBlockEndWidth) > 0
  )
    return 0;
  const box = layout.getElementClientRect(element);
  const end = vertical ? -box.left : box.bottom;
  let allowance = 0;
  for (const candidate of [
    element,
    ...Array.from(
      element.querySelectorAll("[data-viv-ruby-end], [data-viv-emphasis-end]"),
    ),
  ]) {
    if (inNestedColumns(candidate, (e) => layout.getElementComputedStyle(e)))
      continue;
    const amount = parseFloat(
      candidate.getAttribute("data-viv-ruby-end") ||
        candidate.getAttribute("data-viv-emphasis-end") ||
        "0",
    );
    if (!(amount > 0)) continue;
    const rect = layout.getElementClientRect(candidate);
    if (Math.abs(end - (vertical ? -rect.left : rect.bottom)) <= amount + 0.5)
      allowance = Math.max(allowance, amount);
  }
  return allowance;
}
