/**
 * Copyright 2017 Daishinsha Inc.
 * Copyright 2019 Vivliostyle Foundation
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
 * @fileoverview Footnotes
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Css from "./css";
import * as LayoutHelper from "./layout-helper";
import * as PageFloats from "./page-floats";
import * as SemanticFootnote from "./semantic-footnote";
import * as Task from "./task";
import * as Vtree from "./vtree";
import { Layout } from "./types";

const PageFloatFragment = PageFloats.PageFloatFragment;
const LINE_POLICY_EDGE_EPSILON = 0.1;

export class Footnote extends PageFloats.PageFloat {
  constructor(
    nodePosition: Vtree.NodePosition,
    floatReference: PageFloats.FloatReference,
    flowName: string,
    public readonly footnotePolicy: Css.Ident | null,
    floatMinWrapBlock: Css.Numeric | null,
    public readonly policyAnchorNode: Node,
  ) {
    super(
      nodePosition,
      floatReference,
      "block-end",
      null,
      flowName,
      floatMinWrapBlock,
    );
  }

  override isAllowedToPrecede(other: PageFloats.PageFloat): boolean {
    return !(other instanceof Footnote);
  }
}

function getLinePolicyConstraintNode(anchorNode: Node): Node {
  let element =
    anchorNode.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as Element)
      : anchorNode.parentElement;
  while (element) {
    if (
      /^(p|li|dd|dt|td|th|blockquote)$/i.test(element.localName) &&
      !element.querySelector("br")
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return anchorNode;
}

// These helpers intentionally work from live DOM nodes only. The line-policy
// constraint runs after layout has produced view nodes, but it does not have a
// Layout.Column/clientLayout available, so LayoutHelper.calculateEdge() cannot
// be reused directly here.

function getBlockDir(vertical: boolean): number {
  return vertical ? -1 : 1;
}

function getBlockStartEdge(rect: Vtree.ClientRect, vertical: boolean): number {
  return vertical ? rect.right : rect.top;
}

function getBlockEndEdge(rect: Vtree.ClientRect, vertical: boolean): number {
  return vertical ? rect.left : rect.bottom;
}

function toMutableClientRect(rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}): Vtree.ClientRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  } as Vtree.ClientRect;
}

function getAdjustedElementRect(
  element: Element,
  vertical: boolean,
): Vtree.ClientRect | null {
  const rect = toMutableClientRect(element.getBoundingClientRect());
  LayoutHelper.adjustRectForColumnBreaking(rect, vertical);
  if (rect.right < rect.left || rect.bottom < rect.top) {
    return null;
  }
  return rect;
}

function getAdjustedNonEmptyRects(
  rects: ArrayLike<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  }>,
  vertical: boolean,
): Vtree.ClientRect[] {
  const adjustedRects = Array.from(rects, toMutableClientRect);
  LayoutHelper.adjustRectsForColumnBreaking(adjustedRects, vertical);
  return adjustedRects.filter(
    (rect) => rect.right > rect.left && rect.bottom > rect.top,
  );
}

function getBlockEndEdgeFromRects(
  rects: Vtree.ClientRect[],
  vertical: boolean,
): number {
  if (!rects.length) {
    return NaN;
  }
  return vertical
    ? Math.min(...rects.map((rect) => rect.left))
    : Math.max(...rects.map((rect) => rect.bottom));
}

function getFirstBlockEndEdgeFromRects(
  rects: Vtree.ClientRect[],
  vertical: boolean,
): number {
  if (!rects.length) {
    return NaN;
  }
  const blockDir = getBlockDir(vertical);
  const firstRect = rects.reduce((first, rect) =>
    getBlockStartEdge(rect, vertical) * blockDir <
    getBlockStartEdge(first, vertical) * blockDir
      ? rect
      : first,
  );
  return getBlockEndEdge(firstRect, vertical);
}

function getBlockEndEdgeFromViewNode(
  viewNode: Element | Text | null,
  vertical: boolean,
): number {
  if (!viewNode) {
    return NaN;
  }
  if (viewNode.nodeType === Node.ELEMENT_NODE) {
    const rect = getAdjustedElementRect(viewNode as Element, vertical);
    return rect ? getBlockEndEdge(rect, vertical) : NaN;
  }
  const text = viewNode.textContent || "";
  if (!text.length) {
    return NaN;
  }
  const range = viewNode.ownerDocument.createRange();
  range.setStart(viewNode, 0);
  range.setEnd(viewNode, text.length);
  const rects = getAdjustedNonEmptyRects(range.getClientRects(), vertical);
  return getBlockEndEdgeFromRects(rects, vertical);
}

function getNodeContextEdge(
  nodeContext: Vtree.NodeContext,
  vertical: boolean,
): number {
  const node = nodeContext.viewNode;
  if (!node) {
    return NaN;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (nodeContext.after || !nodeContext.inline) {
      const rect = getAdjustedElementRect(element, vertical);
      if (rect) {
        if (nodeContext.after) {
          return getBlockEndEdge(rect, vertical);
        }
        return getBlockStartEdge(rect, vertical);
      }
    }
    const rects = getAdjustedNonEmptyRects(element.getClientRects(), vertical);
    // Leading edges of inline elements need the current line's block-end edge,
    // not the element's union rect, otherwise line-policy geometry never fires
    // for inline content and falls back to node-position equality.
    return getFirstBlockEndEdgeFromRects(rects, vertical);
  }
  const text = node.textContent || "";
  if (!text.length) {
    return NaN;
  }
  let offset = nodeContext.offsetInNode;
  if (nodeContext.after) {
    offset += text.length;
  }
  offset = Math.max(0, Math.min(offset, text.length - 1));
  const range = node.ownerDocument.createRange();
  range.setStart(node, offset);
  range.setEnd(node, offset + 1);
  const rects = getAdjustedNonEmptyRects(range.getClientRects(), vertical);
  return getBlockEndEdgeFromRects(rects, vertical);
}

/**
 * @extends PageFloatFragment
 */
export class FootnoteFragment extends PageFloatFragment {
  constructor(
    floatReference: PageFloats.FloatReference,
    continuations: PageFloats.PageFloatContinuation[],
    area: Vtree.Container,
    continues: boolean,
  ) {
    super(floatReference, "block-end", null, continuations, area, continues);
  }

  override getOrder(): number {
    return Infinity;
  }

  override shouldBeStashedBefore(float: PageFloats.PageFloat): boolean {
    if (float instanceof Footnote) {
      return true;
    } else {
      return this.getOrder() < float.getOrder();
    }
  }
}

export class LineFootnotePolicyLayoutConstraint
  implements Layout.LayoutConstraint
{
  private readonly anchorEdge: number;

  constructor(
    public readonly footnote: Footnote,
    anchorViewNode: Element | Text | null,
    private readonly vertical: boolean,
  ) {
    // Capture the rendered anchor line when the footnote becomes constrained.
    // Using live DOM geometry keeps footnote-policy: line tied to the line that
    // owns the call instead of falling back to whole-paragraph ancestry.
    this.anchorEdge = getBlockEndEdgeFromViewNode(anchorViewNode, vertical);
  }

  allowLayout(nodeContext: Vtree.NodeContext): boolean {
    if (!isNaN(this.anchorEdge)) {
      const edge = getNodeContextEdge(nodeContext, this.vertical);
      if (!isNaN(edge)) {
        // Normalize both values to block-progression order so vertical-rl uses
        // the same "before the anchor line" comparison as horizontal-tb.
        const blockDir = getBlockDir(this.vertical);
        return (
          edge * blockDir <
          this.anchorEdge * blockDir - LINE_POLICY_EDGE_EPSILON
        );
      }
    }
    const nodePosition = nodeContext.toNodePosition();
    return !Vtree.isSameNodePosition(nodePosition, this.footnote.nodePosition);
  }
}

export class FootnoteLayoutStrategy
  implements PageFloats.PageFloatLayoutStrategy
{
  /** @override */
  appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean {
    return nodeContext.floatSide === "footnote";
  }

  /** @override */
  appliesToFloat(float: PageFloats.PageFloat): boolean {
    return float instanceof Footnote;
  }

  /** @override */
  createPageFloat(
    nodeContext: Vtree.NodeContext,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    column: Layout.Column,
  ): Task.Result<PageFloats.PageFloat> {
    let floatReference = PageFloats.FloatReference.REGION;

    // If the region context has the same container as the page context,
    // use the page context as the context for the footnote.
    const regionContext =
      pageFloatLayoutContext.getPageFloatLayoutContext(floatReference);
    const pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
      PageFloats.FloatReference.PAGE,
    );
    if (pageContext.hasSameContainerAs(regionContext)) {
      floatReference = PageFloats.FloatReference.PAGE;
    }

    // When inside a page float area, use PAGE level so the footnote fragment
    // survives page-level layout retries triggered by the outer page float.
    // (Issue #1675)
    const insidePageFloat = !!pageFloatLayoutContext.generatingNodePosition;
    if (insidePageFloat && floatReference !== PageFloats.FloatReference.PAGE) {
      floatReference = PageFloats.FloatReference.PAGE;
    }

    const nodePosition = nodeContext.toNodePosition();
    Asserts.assert(pageFloatLayoutContext.flowName);
    let policyAnchorNode: Node = nodeContext.sourceNode;
    const shadowOwner = nodeContext.shadowContext?.owner;
    if (
      shadowOwner instanceof Element &&
      SemanticFootnote.isSemanticFootnoteNoterefElement(shadowOwner)
    ) {
      policyAnchorNode = shadowOwner;
    }
    // Keep the broader source anchor for layoutPageFloat() edge recovery.
    // The line-policy constraint itself is narrowed later by the rendered
    // anchor view node captured in forbid().
    policyAnchorNode = getLinePolicyConstraintNode(policyAnchorNode);
    const float: PageFloats.PageFloat = new Footnote(
      nodePosition,
      floatReference,
      pageFloatLayoutContext.flowName,
      nodeContext.footnotePolicy,
      nodeContext.floatMinWrapBlock,
      policyAnchorNode,
    );
    float.insidePageFloatArea = insidePageFloat;
    if (insidePageFloat) {
      const parentNodePos = pageFloatLayoutContext.generatingNodePosition;
      if (parentNodePos) {
        float.parentPageFloat =
          pageFloatLayoutContext.findPageFloatByNodePosition(parentNodePos);
      }
    }
    pageFloatLayoutContext.addPageFloat(float);
    return Task.newResult(float);
  }

  /** @override */
  createPageFloatFragment(
    continuations: PageFloats.PageFloatContinuation[],
    floatSide: string,
    clearSide: string | null,
    floatArea: Layout.PageFloatArea,
    continues: boolean,
  ): PageFloats.PageFloatFragment {
    const f = continuations[0].float;
    return new FootnoteFragment(
      f.floatReference,
      continuations,
      floatArea,
      continues,
    );
  }

  /** @override */
  findPageFloatFragment(
    float: PageFloats.PageFloat,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  ): PageFloats.PageFloatFragment | null {
    const context = pageFloatLayoutContext.getPageFloatLayoutContext(
      float.floatReference,
    );
    const container = context.getContainer(float.floatReference);
    const containerElement = container.element;
    const fragments = context.floatFragments.filter(
      (fr) =>
        fr instanceof FootnoteFragment &&
        (float.floatReference !== PageFloats.FloatReference.REGION ||
          !(fr.area as Layout.PageFloatArea).parentElement ||
          (fr.area as Layout.PageFloatArea).parentElement === containerElement),
    );
    return fragments.find((fr) => fr.hasFloat(float)) || fragments[0] || null;
  }

  /** @override */
  adjustPageFloatArea(
    floatArea: Layout.PageFloatArea,
    floatContainer: Vtree.Container,
    column: Layout.Column,
  ): Task.Result<void> {
    floatArea.isFootnote = true;
    floatArea.adjustContentRelativeSize = false;
    const element = floatArea.element;
    Asserts.assert(element);
    return column.layoutContext
      .applyFootnoteStyle(
        floatContainer.vertical,
        (column.layoutContext as any).nodeContext &&
          (column.layoutContext as any).nodeContext.direction === "rtl",
        element,
      )
      .thenAsync((vertical) => {
        floatArea.vertical = vertical;
        floatArea.convertPercentageSizesToPx(element);
        column.setComputedInsets(element, floatArea);
        column.setComputedWidthAndHeight(element, floatArea);
        // Handle box-sizing: border-box for footnote areas (Issue #1878).
        // The layout engine always works in content-box mode. When the user
        // specifies box-sizing: border-box, convert max-height/min-height
        // to content-box equivalents and reset box-sizing on the element.
        const computedBoxSizing =
          column.clientLayout.getElementComputedStyle(element)?.boxSizing;
        if (computedBoxSizing === "border-box") {
          const blockInsets = floatArea.vertical
            ? floatArea.paddingLeft +
              floatArea.paddingRight +
              floatArea.borderLeft +
              floatArea.borderRight
            : floatArea.paddingTop +
              floatArea.paddingBottom +
              floatArea.borderTop +
              floatArea.borderBottom;
          // In vertical writing mode, block-direction properties are
          // width/max-width/min-width instead of height/max-height/min-height.
          const blockProps = floatArea.vertical
            ? ["max-width", "min-width", "width"]
            : ["max-height", "min-height", "height"];
          const cs = getComputedStyle(element);
          for (const prop of blockProps) {
            const val = cs.getPropertyValue(prop);
            if (val && val !== "none") {
              const px = parseFloat(val);
              if (!isNaN(px)) {
                Base.setCSSProperty(
                  element,
                  prop,
                  `${Math.max(0, px - blockInsets)}px`,
                );
              }
            }
          }
          Base.setCSSProperty(element, "box-sizing", "content-box");
        }
        // CSS GCPM §2.4.2: "The max-height property on the footnote area
        // limits the size of this area, unless the page contains only
        // footnotes." When the page-level context has
        // ignoreFootnoteAreaMaxHeight set (detected after a prior layout
        // pass found no body content), remove max-height. (Issue #1878)
        let pageCtx: PageFloats.PageFloatLayoutContext | null =
          column.pageFloatLayoutContext as PageFloats.PageFloatLayoutContext;
        while (pageCtx) {
          if (pageCtx.ignoreFootnoteAreaMaxHeight) {
            // Clear both logical and physical max-block-size properties
            Base.setCSSProperty(element, "max-block-size", "");
            Base.setCSSProperty(
              element,
              floatArea.vertical ? "max-width" : "max-height",
              "",
            );
            break;
          }
          pageCtx = pageCtx.parent ?? null;
        }
        return Task.newResult(undefined);
      });
  }

  /** @override */
  forbid(
    float: PageFloats.PageFloat,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  ) {
    const footnote = float as Footnote;
    switch (footnote.footnotePolicy) {
      case Css.ident.line: {
        const anchors = pageFloatLayoutContext.collectPageFloatAnchors();
        const anchorViewNode = anchors[footnote.getId()] || null;
        // Reuse the rendered anchor view node collected during layout so the
        // constraint can stop exactly at the current anchor line.
        const constraint = new LineFootnotePolicyLayoutConstraint(
          footnote,
          anchorViewNode,
          pageFloatLayoutContext.getContainer(footnote.floatReference).vertical,
        );
        pageFloatLayoutContext.addLayoutConstraint(
          constraint,
          footnote.floatReference,
        );
        break;
      }
    }
  }
}

PageFloats.PageFloatLayoutStrategyResolver.register(
  new FootnoteLayoutStrategy(),
);
