/**
 * Copyright 2015 Daishinsha Inc.
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
 * @fileoverview PageFloats - CSS Page Floats
 */
import * as Asserts from "./asserts";
import * as Css from "./css";
import * as Constants from "./constants";
import * as GeometryUtil from "./geometry-util";
import * as LayoutHelper from "./layout-helper";
import * as Logging from "./logging";
import * as CssLogicalUtil from "./css-logical-util";
import * as Sizing from "./sizing";
import * as Task from "./task";
import * as VtreeImpl from "./vtree";
import { Layout as LayoutType, PageFloats, Vtree } from "./types";

export const FloatReference = PageFloats.FloatReference;
export type FloatReference = PageFloats.FloatReference; // eslint-disable-line no-redeclare

type PageFloatID = PageFloats.PageFloatID;

/**
 * Minimum outer block size (in px) for a footnote during iterative sizing.
 * When the halved size falls below this threshold, the retry loop stops and
 * the footnote is forbidden instead. Chosen to be roughly one line-height so
 * that the fragment is still visually meaningful. (Issue #1879)
 */
const MIN_FOOTNOTE_BLOCK_SIZE = 20;

export function floatReferenceOf(str: string): FloatReference {
  switch (str) {
    case "inline":
      return FloatReference.INLINE;
    case "column":
      return FloatReference.COLUMN;
    case "region":
      return FloatReference.REGION;
    case "page":
      return FloatReference.PAGE;
    default:
      throw new Error(`Unknown float-reference: ${str}`);
  }
}

export function isPageFloat(floatReference: FloatReference): boolean {
  switch (floatReference) {
    case FloatReference.INLINE:
      return false;
    case FloatReference.COLUMN:
    case FloatReference.REGION:
    case FloatReference.PAGE:
      return true;
    default:
      throw new Error(`Unknown float-reference: ${floatReference}`);
  }
}

/**
 * Interpret a float value with the writing-mode and direction assuming the
 * float-reference is inline and returns "left" or "right".
 */
export function resolveInlineFloatDirection(
  floatSide: string,
  vertical: boolean,
  direction: string,
  pageSide: Constants.PageSide,
): string {
  const writingMode = vertical ? "vertical-rl" : "horizontal-tb";
  if (floatSide === "top" || floatSide === "bottom") {
    floatSide = CssLogicalUtil.toLogical(floatSide, writingMode, direction);
  }
  if (floatSide === "block-start") {
    floatSide = "inline-start";
  }
  if (floatSide === "block-end") {
    floatSide = "inline-end";
  }
  if (floatSide === "inline-start" || floatSide === "inline-end") {
    const physicalValue = CssLogicalUtil.toPhysical(
      floatSide,
      writingMode,
      direction,
    );
    const lineRelativeValue = CssLogicalUtil.toLineRelative(
      physicalValue,
      writingMode,
    );
    if (lineRelativeValue === "line-left") {
      floatSide = "left";
    } else if (lineRelativeValue === "line-right") {
      floatSide = "right";
    }
  } else if (floatSide === "inside") {
    floatSide = pageSide === "left" ? "right" : "left";
  } else if (floatSide === "outside") {
    floatSide = pageSide === "left" ? "left" : "right";
  }
  if (floatSide !== "left" && floatSide !== "right") {
    Logging.logger.warn(`Invalid float value: ${floatSide}. Fallback to left.`);
    floatSide = "left";
  }
  return floatSide;
}

export class PageFloat implements PageFloats.PageFloat {
  order: number | null = null;
  id: PageFloatID | null = null;

  /**
   * Set to true when this float is created inside a page float area.
   * Used to bypass the normal anchor check in isAllowedOnContext because
   * the anchor node is lost after page-level invalidation. (Issue #1675)
   */
  insidePageFloatArea: boolean = false;

  /**
   * Reference to the parent page float that contains this float.
   * Set when this float is created inside a page float area, allowing
   * isAllowedOnContext to check whether the parent is still present.
   * (Issue #1675)
   */
  parentPageFloat: PageFloat | null = null;

  constructor(
    public readonly nodePosition: Vtree.NodePosition,
    public readonly floatReference: FloatReference,
    public readonly floatSide: string,
    public readonly clearSide: string | null,
    public readonly flowName: string,
    public readonly floatMinWrapBlock: Css.Numeric | null,
  ) {}

  getOrder(): number {
    if (this.order === null) {
      throw new Error("The page float is not yet added");
    }
    return this.order;
  }

  getId(): PageFloatID {
    if (!this.id) {
      throw new Error("The page float is not yet added");
    }
    return this.id;
  }

  isAllowedOnContext(pageFloatLayoutContext: PageFloatLayoutContext): boolean {
    if (pageFloatLayoutContext.isAnchorAlreadyAppeared(this.getId())) {
      return true;
    }
    // When the float was created inside a page float area, its anchor node
    // is lost after page-level invalidation (the page float area context is
    // detached during re-layout). Check whether the parent page float still
    // has a fragment on this context: if the parent was removed (e.g. by
    // checkAndForbidNotAllowedFloat), this float should also be removed
    // to avoid orphaned fragments on the page. (Issue #1675)
    if (this.insidePageFloatArea && this.parentPageFloat) {
      return !!pageFloatLayoutContext.findPageFloatFragment(
        this.parentPageFloat,
      );
    }
    return false;
  }

  isAllowedToPrecede(other: PageFloat): boolean {
    return false;
  }
}

export class PageFloatStore {
  private floats: PageFloat[] = [];
  private nextPageFloatIndex: number = 0;

  private nextOrder(): number {
    return this.nextPageFloatIndex++;
  }

  private createPageFloatId(order: number): PageFloatID {
    return `pf${order}`;
  }

  addPageFloat(float: PageFloat) {
    const index = this.floats.findIndex((f) =>
      VtreeImpl.isSameNodePosition(f.nodePosition, float.nodePosition),
    );
    if (index >= 0) {
      throw new Error(
        "A page float with the same source node is already registered",
      );
    } else {
      const order = (float.order = this.nextOrder());
      float.id = this.createPageFloatId(order);
      this.floats.push(float);
    }
  }

  findPageFloatByNodePosition(
    nodePosition: Vtree.NodePosition,
  ): PageFloat | null {
    // First try exact match using isSameNodePosition
    const index = this.floats.findIndex((f) =>
      VtreeImpl.isSameNodePosition(f.nodePosition, nodePosition),
    );
    if (index >= 0) {
      return this.floats[index];
    }
    // For table cells (PseudoColumn), the steps array may differ in length
    // but the sourceNode (steps[0].node) should be the same.
    // This ensures footnotes inside table cells are identified correctly
    // even when processed within PseudoColumn context.
    // Only apply this fallback when steps lengths differ, and compare step
    // nodes up to the shorter length to avoid false matches with EPUB
    // footnotes that share the same shadow template element as steps[0].node.
    const nSteps = nodePosition?.steps;
    if (nSteps?.length) {
      const fallbackIndex = this.floats.findIndex((f) => {
        const fSteps = f.nodePosition.steps;
        if (
          !fSteps?.length ||
          fSteps.length === nSteps.length ||
          f.nodePosition.offsetInNode !== nodePosition.offsetInNode ||
          f.nodePosition.after !== nodePosition.after
        ) {
          return false;
        }
        const minLen = Math.min(fSteps.length, nSteps.length);
        for (let i = 0; i < minLen; i++) {
          if (fSteps[i].node !== nSteps[i].node) {
            return false;
          }
        }
        return true;
      });
      if (fallbackIndex >= 0) {
        return this.floats[fallbackIndex];
      }
    }
    return null;
  }

  findPageFloatById(id: PageFloatID) {
    const index = this.floats.findIndex((f) => f.id === id);
    return index >= 0 ? this.floats[index] : null;
  }
}

/**
 * @param continues Represents whether the float is fragmented and continues
 *     after this fragment
 */
export class PageFloatFragment implements PageFloats.PageFloatFragment {
  constructor(
    public readonly floatReference: FloatReference,
    public readonly floatSide: string,
    public readonly clearSide: string | null,
    public readonly continuations: PageFloatContinuation[],
    public readonly area: Vtree.Container,
    public readonly continues: boolean,
  ) {}

  hasFloat(float: PageFloat): boolean {
    return this.continuations.some((c) => c.float === float);
  }

  findNotAllowedFloat(context: PageFloatLayoutContext): PageFloat | null {
    for (let i = this.continuations.length - 1; i >= 0; i--) {
      const f = this.continuations[i].float;
      if (!f.isAllowedOnContext(context)) {
        return f;
      }
    }
    return null;
  }

  getOuterShape(): GeometryUtil.Shape {
    return this.area.getOuterShape(null, null);
  }

  getOuterRect(): GeometryUtil.Rect {
    return this.area.getOuterRect();
  }

  getOrder(): number {
    const floats = this.continuations.map((c) => c.float);
    return Math.min.apply(
      null,
      floats.map((f) => f.getOrder()),
    );
  }

  shouldBeStashedBefore(float: PageFloat): boolean {
    return this.getOrder() < float.getOrder();
  }

  addContinuations(continuations: PageFloatContinuation[]) {
    continuations.forEach((c) => {
      this.continuations.push(c);
    });
  }

  getFlowName(): string {
    const flowName = this.continuations[0].float.flowName;
    Asserts.assert(
      this.continuations.every((c) => c.float.flowName === flowName),
    );
    return flowName;
  }
}

export class PageFloatContinuation implements PageFloats.PageFloatContinuation {
  constructor(
    public readonly float: PageFloat,
    public readonly nodePosition: Vtree.NodePosition,
  ) {}

  equals(other: PageFloatContinuation | null): boolean {
    if (!other) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return (
      this.float === other.float &&
      VtreeImpl.isSameNodePosition(this.nodePosition, other.nodePosition)
    );
  }
}

export type PageFloatPlacementCondition =
  PageFloats.PageFloatPlacementCondition;

/**
 * @param generatingNodePosition Source NodePosition generating the context.
 *     Specify when a column context is generated by a non-root element (for
 *     example page floats)
 */
export class PageFloatLayoutContext
  implements PageFloats.PageFloatLayoutContext
{
  private children: PageFloatLayoutContext[] = [];
  writingMode: Css.Val;
  direction: Css.Val;
  private invalidated: boolean = false;
  private floatStore: PageFloatStore;
  private forbiddenFloats: PageFloatID[] = [];
  floatFragments: PageFloatFragment[] = [];
  private stashedFloatFragments: PageFloatFragment[] = [];
  private floatAnchors: { [key in PageFloatID]: Node } = {};
  private floatsDeferredToNext: PageFloatContinuation[] = [];
  private floatsDeferredFromPrevious: PageFloatContinuation[];
  private layoutConstraints: LayoutType.LayoutConstraint[] = [];
  private locked: boolean = false;
  /**
   * Maximum outer block size for footnotes on this page.
   * Set when a footnote is placed but then found to be not-allowed (anchor
   * not reachable in multi-column). Each retry halves this value until
   * the footnote fits or is too small to display. (Issue #1879)
   */
  footnoteMaxBlockSize: number | null = null;

  /**
   * When true, max-height on @footnote areas should be ignored.
   * Set when a page contains only footnote continuation(s) and no body
   * content. Per CSS GCPM §2.4.2, max-height should not apply in this
   * case. (Issue #1878)
   */
  ignoreFootnoteAreaMaxHeight: boolean = false;

  /**
   * Tracks footnote IDs whose anchors have been registered at least once
   * during this page's layout cycle. Unlike floatAnchors, this set
   * survives invalidate() calls, so we can detect feedback loops where
   * a footnote's own size pushes its anchor off the page. (Issue #1879)
   */
  private footnoteAnchorsSeen: Set<PageFloatID> = new Set();

  /**
   * Tracks the footnoteMaxBlockSize value used when a `footnote-policy: line`
   * footnote triggered invalidation (body reflow) on the current page. Like
   * footnoteAnchorsSeen, this map survives invalidate() calls. Placing such a
   * footnote shrinks the body area and invalidates the page to reflow the
   * body; without this guard the same footnote is re-placed and re-invalidated
   * on every page-layout retry, which never converges and hangs the renderer.
   * Allowing exactly one invalidation per line-policy footnote per retry size
   * bounds the retries while still reflowing body after footnoteMaxBlockSize
   * changes.
   * (Issue #2024, #2026)
   */
  private lineFootnoteInvalidationMaxBlockSize: Map<
    PageFloatID,
    number | null
  > = new Map();

  /**
   * Tracks `footnote-policy: line` footnote IDs for which finish() has already
   * forbidden the float and invalidated the page once. Without this guard,
   * finish() forbids and invalidates on every page-layout retry (the float is
   * re-deferred each pass), which never converges and hangs the renderer.
   * Like footnoteAnchorsSeen, this set survives invalidate(). (Issue #2024)
   */
  private lineFootnoteFinishInvalidatedOnce: Set<PageFloatID> = new Set();

  /**
   * Reference to the outer column's context for page float area contexts.
   * Used only for getParent() navigation to propagate nested page floats
   * and footnotes to region/page level. Unlike `parent`, this does NOT
   * affect children registration, isInvalidated() propagation, or
   * getFloatFragmentExclusions(). (Issue #1675)
   */
  private outerContext: PageFloatLayoutContext | null = null;

  constructor(
    public readonly parent: PageFloatLayoutContext,
    private readonly floatReference: FloatReference | null,
    private container: Vtree.Container,
    public readonly flowName: string | null,
    public readonly generatingNodePosition: Vtree.NodePosition | null,
    writingMode: Css.Val | null,
    direction: Css.Val | null,
  ) {
    if (parent) {
      parent.children.push(this);
    }
    this.writingMode =
      (!Css.isDefaultingValue(writingMode) && writingMode) ||
      (parent && parent.writingMode) ||
      Css.ident.horizontal_tb;
    this.direction =
      (!Css.isDefaultingValue(direction) && direction) ||
      (parent && parent.direction) ||
      Css.ident.ltr;
    this.floatStore = parent ? parent.floatStore : new PageFloatStore();
    const previousSibling = this.getPreviousSibling();
    this.floatsDeferredFromPrevious = previousSibling
      ? [].concat(previousSibling.floatsDeferredToNext)
      : [];
  }

  /**
   * Returns the effective parent context for hierarchy traversal.
   * For normal contexts, returns `parent`. For page float area contexts
   * (where `parent` is null), falls back to `outerContext`. (Issue #1675)
   */
  get effectiveParent(): PageFloatLayoutContext | null {
    return this.parent ?? this.outerContext;
  }

  private getParent(floatReference: FloatReference): PageFloatLayoutContext {
    if (this.parent) {
      return this.parent;
    }
    // Fall back to the outer context for page float area contexts.
    // This allows nested page floats and footnotes inside page float areas
    // to propagate to the region/page level without the side effects of
    // a full parent connection. (Issue #1675)
    if (this.outerContext) {
      return this.outerContext;
    }
    throw new Error(`No PageFloatLayoutContext for ${floatReference}`);
  }

  /**
   * Set the outer context for a page float area context.
   * This shares the float store so that page floats/footnotes created inside
   * a page float area are visible at all levels. (Issue #1675)
   */
  setOuterContext(outerContext: PageFloatLayoutContext) {
    this.outerContext = outerContext;
    this.floatStore = outerContext.floatStore;
  }

  /**
   * Expose a previous rendered page's context to a temporary isolated root.
   * The context is stored as a pseudo-child so normal previous-sibling lookup
   * can seed deferred floats without making it this context's real parent.
   * (Issue #2026)
   */
  addPageFloatLayoutContextAsPreviousSibling(
    context: PageFloats.PageFloatLayoutContext,
  ) {
    this.children.push(context as PageFloatLayoutContext);
  }

  private getPreviousSiblingOf(
    child: PageFloatLayoutContext | null,
    floatReference: FloatReference | null,
    flowName: string | null,
    generatingNodePosition: Vtree.NodePosition | null,
  ): PageFloatLayoutContext | null {
    let index = this.children.indexOf(child as PageFloatLayoutContext);
    if (index < 0) {
      index = this.children.length;
    }
    for (let i = index - 1; i >= 0; i--) {
      let result = this.children[i];
      if (
        result.floatReference === floatReference &&
        result.flowName === flowName &&
        VtreeImpl.isSameNodePosition(
          result.generatingNodePosition,
          generatingNodePosition,
        )
      ) {
        return result;
      } else {
        result = result.getPreviousSiblingOf(
          null,
          floatReference,
          flowName,
          generatingNodePosition,
        );
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  private getPreviousSibling(): PageFloatLayoutContext | null {
    let child: PageFloatLayoutContext = this;
    let parent = this.parent;
    let result: PageFloatLayoutContext;
    while (parent) {
      result = parent.getPreviousSiblingOf(
        child,
        this.floatReference,
        this.flowName,
        this.generatingNodePosition,
      );
      if (result) {
        return result;
      }
      child = parent;
      parent = parent.parent;
    }
    return null;
  }

  getContainer(floatReference?: FloatReference): Vtree.Container {
    if (!floatReference || floatReference === this.floatReference) {
      return this.container;
    }
    return this.getParent(floatReference).getContainer(floatReference);
  }

  setContainer(container: Vtree.Container) {
    this.container = container;
    this.reattachFloatFragments();
  }

  addPageFloat(float: PageFloat) {
    this.floatStore.addPageFloat(float);
  }

  getPageFloatLayoutContext(
    floatReference: FloatReference,
  ): PageFloatLayoutContext {
    if (floatReference === this.floatReference) {
      return this;
    }
    return this.getParent(floatReference).getPageFloatLayoutContext(
      floatReference,
    );
  }

  findPageFloatByNodePosition(
    nodePosition: Vtree.NodePosition,
  ): PageFloat | null {
    return this.floatStore.findPageFloatByNodePosition(nodePosition);
  }

  private forbid(float: PageFloat) {
    const id = float.getId();
    const floatReference = float.floatReference;
    if (floatReference === this.floatReference) {
      if (!this.forbiddenFloats.includes(id)) {
        this.forbiddenFloats.push(id);
        const strategy = new PageFloatLayoutStrategyResolver().findByFloat(
          float,
        );
        strategy.forbid(float, this);
      }
    } else {
      const parent = this.getParent(floatReference);
      parent.forbid(float);
    }
  }

  isForbidden(float: PageFloat): boolean {
    const id = float.getId();
    const floatReference = float.floatReference;
    if (floatReference === this.floatReference) {
      return this.forbiddenFloats.includes(id);
    } else {
      const parent = this.getParent(floatReference);
      return parent.isForbidden(float);
    }
  }

  addPageFloatFragment(
    floatFragment: PageFloatFragment,
    dontInvalidate?: boolean,
  ) {
    const floatReference = floatFragment.floatReference;
    if (floatReference !== this.floatReference) {
      const parent = this.getParent(floatReference);
      parent.addPageFloatFragment(floatFragment, dontInvalidate);
    } else if (!this.floatFragments.includes(floatFragment)) {
      this.floatFragments.push(floatFragment);
      this.floatFragments.sort((fr1, fr2) => fr1.getOrder() - fr2.getOrder());
    }
    if (!dontInvalidate) {
      this.invalidate();
    }
  }

  removePageFloatFragment(
    floatFragment: PageFloatFragment,
    dontInvalidate?: boolean,
  ) {
    const floatReference = floatFragment.floatReference;
    if (floatReference !== this.floatReference) {
      const parent = this.getParent(floatReference);
      parent.removePageFloatFragment(floatFragment, dontInvalidate);
    } else {
      const index = this.floatFragments.indexOf(floatFragment);
      if (index >= 0) {
        const fragment = this.floatFragments.splice(index, 1)[0];
        const element = fragment.area && fragment.area.element;
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        if (!dontInvalidate) {
          this.invalidate();
        }
      }
    }
  }

  findPageFloatFragment(float: PageFloat): PageFloatFragment | null {
    if (float.floatReference !== this.floatReference) {
      const parent = this.getParent(float.floatReference);
      return parent.findPageFloatFragment(float);
    }
    const index = this.floatFragments.findIndex((f) => f.hasFloat(float));
    if (index >= 0) {
      return this.floatFragments[index];
    } else {
      return null;
    }
  }

  hasFloatFragments(condition?: (p1: PageFloatFragment) => boolean): boolean {
    if (this.floatFragments.length > 0) {
      if (!condition || this.floatFragments.some(condition)) {
        return true;
      }
    }
    if (this.parent) {
      return this.parent.hasFloatFragments(condition);
    } else {
      return false;
    }
  }

  hasContinuingFloatFragmentsInFlow(flowName: string): boolean {
    return this.hasFloatFragments(
      (fragment) =>
        fragment.continues &&
        fragment.getFlowName() === flowName &&
        fragment.floatSide !== "block-end",
    );
  }

  markPageFloatAnchorSeen(float: PageFloat) {
    if (!("footnotePolicy" in float)) {
      return;
    }
    let ctx: PageFloatLayoutContext | null = this;
    while (ctx) {
      ctx.footnoteAnchorsSeen.add(float.getId());
      ctx = ctx.parent ?? ctx.outerContext;
    }
  }

  registerPageFloatAnchor(float: PageFloat, anchorViewNode: Node) {
    this.floatAnchors[float.getId()] = anchorViewNode;
    // Record that this float's anchor has been seen at least once on this
    // page, propagating up the context hierarchy so the page-level context
    // can detect feedback loops. (Issue #1879)
    this.markPageFloatAnchorSeen(float);
  }

  collectPageFloatAnchors() {
    const anchors = Object.assign({}, this.floatAnchors);
    return this.children.reduce(
      (prev, child) => Object.assign(prev, child.collectPageFloatAnchors()),
      anchors,
    );
  }

  private findPageFloatAnchor(floatId: PageFloatID): Node | null {
    // Match collectPageFloatAnchors(): descendant registrations override
    // anchors recorded on ancestor contexts.
    for (let i = this.children.length - 1; i >= 0; i--) {
      const anchorViewNode = this.children[i].findPageFloatAnchor(floatId);
      if (anchorViewNode) {
        return anchorViewNode;
      }
    }
    return this.floatAnchors[floatId] ?? null;
  }

  hasCurrentAnchor(floatId: PageFloatID) {
    const anchorViewNode = this.findPageFloatAnchor(floatId);
    if (!anchorViewNode) {
      return false;
    }
    return !!this.container?.element?.contains(anchorViewNode);
  }

  /**
   * Whether this `footnote-policy: line` footnote has already triggered
   * invalidation (body reflow) at the current retry size. (Issue #2024, #2026)
   */
  hasInvalidatedForLineFootnote(float: PageFloat): boolean {
    if (float.floatReference === this.floatReference) {
      return (
        this.lineFootnoteInvalidationMaxBlockSize.get(float.getId()) ===
        this.footnoteMaxBlockSize
      );
    }
    return this.getParent(float.floatReference).hasInvalidatedForLineFootnote(
      float,
    );
  }

  /**
   * Mark that this `footnote-policy: line` footnote has triggered invalidation
   * at the current retry size, so subsequent placements suppress redundant
   * invalidation. (Issue #2024, #2026)
   */
  markInvalidatedForLineFootnote(float: PageFloat): void {
    if (float.floatReference === this.floatReference) {
      this.lineFootnoteInvalidationMaxBlockSize.set(
        float.getId(),
        this.footnoteMaxBlockSize,
      );
    } else {
      this.getParent(float.floatReference).markInvalidatedForLineFootnote(
        float,
      );
    }
  }

  isAnchorAlreadyAppeared(floatId: PageFloatID) {
    const deferredFloats = this.getDeferredPageFloatContinuations();
    if (deferredFloats.some((cont) => cont.float.getId() === floatId)) {
      return true;
    }
    const anchorViewNode = this.findPageFloatAnchor(floatId);
    if (!anchorViewNode) {
      return false;
    }
    if (this.container && this.container.element) {
      return this.container.element.contains(anchorViewNode);
    }
    return false;
  }

  deferPageFloat(continuation: PageFloatContinuation) {
    const float = continuation.float;
    if (float.floatReference === this.floatReference) {
      const index = this.floatsDeferredToNext.findIndex(
        (c) => c.float === float,
      );
      if (index >= 0) {
        this.floatsDeferredToNext.splice(index, 1, continuation);
      } else {
        this.floatsDeferredToNext.push(continuation);
      }
    } else {
      const parent = this.getParent(float.floatReference);
      parent.deferPageFloat(continuation);
    }
  }

  removeFloatDeferredToNext(float: PageFloat) {
    const index = this.floatsDeferredToNext.findIndex((c) => c.float === float);
    if (index >= 0) {
      this.floatsDeferredToNext.splice(index, 1);
    }
  }

  hasPrecedingFloatsDeferredToNext(
    float: PageFloat,
    ignoreReference?: boolean,
  ): boolean {
    if (!ignoreReference && float.floatReference !== this.floatReference) {
      return this.getParent(
        float.floatReference,
      ).hasPrecedingFloatsDeferredToNext(float, false);
    }
    const order = float.getOrder();
    const hasPrecedingFloatsDeferredToNext = this.floatsDeferredToNext.some(
      (c) => c.float.getOrder() < order && !float.isAllowedToPrecede(c.float),
    );
    if (hasPrecedingFloatsDeferredToNext) {
      return true;
    } else if (this.parent) {
      return this.parent.hasPrecedingFloatsDeferredToNext(float, true);
    } else {
      return false;
    }
  }

  getLastFollowingFloatInFragments(float: PageFloat): PageFloat | null {
    const order = float.getOrder();
    let lastFollowing: PageFloat = null;
    this.floatFragments.forEach((fragment) => {
      fragment.continuations.forEach((c) => {
        const f = c.float;
        const o = f.getOrder();
        if (o > order && (!lastFollowing || o > lastFollowing.getOrder())) {
          lastFollowing = f;
        }
      });
    });
    if (this.parent) {
      const lastFollowingOfParent =
        this.parent.getLastFollowingFloatInFragments(float);
      if (
        lastFollowingOfParent &&
        (!lastFollowing ||
          lastFollowingOfParent.getOrder() > lastFollowing.getOrder())
      ) {
        lastFollowing = lastFollowingOfParent;
      }
    }
    return lastFollowing;
  }

  getDeferredPageFloatContinuations(
    flowName?: string | null,
  ): PageFloatContinuation[] {
    flowName = flowName || this.flowName;
    let result = this.floatsDeferredFromPrevious.filter(
      (cont) => !flowName || cont.float.flowName === flowName,
    );
    if (this.parent) {
      result = this.parent
        .getDeferredPageFloatContinuations(flowName)
        .concat(result);
    }
    return result.sort((c1, c2) => c1.float.getOrder() - c2.float.getOrder());
  }

  getPageFloatContinuationsDeferredToNext(
    flowName?: string | null,
  ): PageFloatContinuation[] {
    flowName = flowName || this.flowName;
    const result = this.floatsDeferredToNext.filter(
      (cont) => !flowName || cont.float.flowName === flowName,
    );
    if (this.parent) {
      return this.parent
        .getPageFloatContinuationsDeferredToNext(flowName)
        .concat(result);
    } else {
      return result;
    }
  }

  getFloatsDeferredToNextInChildContexts(): PageFloat[] {
    let result = [];
    const done = [];
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (done.includes(child.flowName)) {
        continue;
      }
      done.push(child.flowName);
      result = result.concat(child.floatsDeferredToNext.map((c) => c.float));
      result = result.concat(child.getFloatsDeferredToNextInChildContexts());
    }
    return result;
  }

  private hasRootMultiColumnFootnoteContext(): boolean {
    return this.children.some((child) => {
      let rootColumnCount = 0;
      for (const grandchild of child.children) {
        if (grandchild.generatingNodePosition) {
          continue;
        }
        rootColumnCount += 1;
        if (rootColumnCount > 1) {
          return true;
        }
      }
      return false;
    });
  }

  private hasNonRootMultiColumnFootnoteContext(): boolean {
    return this.children.some((child) =>
      child.children.some((grandchild) => {
        const elem = grandchild.getContainer()?.element;
        return elem != null && LayoutHelper.containsNonRootMultiColumn(elem);
      }),
    );
  }

  private hasMultiColumnFootnoteContext(): boolean {
    return (
      this.hasRootMultiColumnFootnoteContext() ||
      this.hasNonRootMultiColumnFootnoteContext()
    );
  }

  private trySetFootnoteRetryMaxBlockSize(currentOuter: number): boolean {
    const newMax =
      this.footnoteMaxBlockSize != null
        ? this.footnoteMaxBlockSize / 2
        : currentOuter / 2;
    if (newMax < MIN_FOOTNOTE_BLOCK_SIZE) {
      return false;
    }
    this.footnoteMaxBlockSize = newMax;
    return true;
  }

  initFootnoteRetryFromEmptyFragment(
    float: PageFloat,
    area: LayoutType.PageFloatArea,
  ): boolean {
    // Issue #1891: when the footnote call moves later in a multicol flow, the
    // first attempt may produce an empty fragment before footnoteMaxBlockSize
    // has been initialized. Seed the usual size-reduction loop from the space
    // currently available on the page instead of deferring the whole footnote.
    if (!(
      "footnotePolicy" in float &&
      this.footnoteMaxBlockSize == null &&
      this.footnoteAnchorsSeen.has(float.getId()) &&
      this.hasMultiColumnFootnoteContext()
    )) {
      return false;
    }
    const availableOuterBlockSize =
      (area.vertical ? area.width : area.height) +
      area.getInsetBefore() +
      area.getInsetAfter();
    return this.trySetFootnoteRetryMaxBlockSize(availableOuterBlockSize);
  }

  checkAndForbidNotAllowedFloat(): boolean {
    if (this.checkAndForbidFloatFollowingDeferredFloat()) {
      return true;
    }
    for (let i = this.floatFragments.length - 1; i >= 0; i--) {
      const fragment = this.floatFragments[i];
      const notAllowedFloat = fragment.findNotAllowedFloat(this);
      if (notAllowedFloat) {
        const isFootnote =
          fragment.area &&
          "isFootnote" in fragment.area &&
          (fragment.area as any).isFootnote;
        if (this.locked) {
          this.invalidate();
        } else {
          // Issue #1879, #2026: For multicol or `footnote-policy: line`
          // footnotes, try reducing the footnote size instead of forbidding
          // when the footnote's own area pushes its anchor out of reach.
          // Halving the size and retrying lets the footnote fragment at a size
          // that still allows the anchor to be reached during re-layout.
          const isLinePolicyFootnote =
            isFootnote &&
            "footnotePolicy" in notAllowedFloat &&
            notAllowedFloat.footnotePolicy === Css.ident.line;
          const retryFootnoteSizing =
            isFootnote &&
            this.footnoteAnchorsSeen.has(notAllowedFloat.getId()) &&
            (isLinePolicyFootnote || this.hasMultiColumnFootnoteContext());
          if (retryFootnoteSizing) {
            const currentOuter =
              fragment.area.computedBlockSize +
              fragment.area.getInsetBefore() +
              fragment.area.getInsetAfter();
            if (this.trySetFootnoteRetryMaxBlockSize(currentOuter)) {
              // Retry with reduced size
              this.removePageFloatFragment(fragment);
              this.removeEndFloatFragments(fragment.floatSide);
              return true;
            }
            // Too small to display — fall through to forbid
          }
          this.removePageFloatFragment(fragment);
          this.forbid(notAllowedFloat);

          // If the removed float is a block-end/inline-end float,
          // we should re-layout preceding floats with the same float direction.
          this.removeEndFloatFragments(fragment.floatSide);
        }
        return true;
      }
    }
    if (this.floatReference === FloatReference.REGION && this.parent.locked) {
      return this.parent.checkAndForbidNotAllowedFloat();
    }
    return false;
  }

  checkAndForbidFloatFollowingDeferredFloat(): boolean {
    const deferredFloats = this.getFloatsDeferredToNextInChildContexts();
    const floatsInFragments = this.floatFragments.reduce(
      (r, fr) => r.concat(fr.continuations.map((c) => c.float)),
      [],
    );
    floatsInFragments.sort((f1, f2) => f2.getOrder() - f1.getOrder());
    for (const float of floatsInFragments) {
      const order = float.getOrder();
      if (
        deferredFloats.some(
          (d) => !float.isAllowedToPrecede(d) && order > d.getOrder(),
        )
      ) {
        if (this.locked) {
          this.invalidate();
        } else {
          this.forbid(float);
          const fragment = this.findPageFloatFragment(float);
          Asserts.assert(fragment);
          this.removePageFloatFragment(fragment);
        }
        return true;
      }
    }
    return false;
  }

  finish() {
    for (let i = this.floatFragments.length - 1; i >= 0; i--) {
      const fragment = this.floatFragments[i];
      // A line-policy footnote fragment whose anchor moved off this page is
      // stale unless it is continuing from the previous page. Remove it before
      // finishing so retries do not keep an orphaned footnote area.
      const staleLineFootnote = fragment.continuations.some((continuation) => {
        const float = continuation.float;
        return (
          "footnotePolicy" in float &&
          float.footnotePolicy === Css.ident.line &&
          !this.hasCurrentAnchor(float.getId()) &&
          !this.floatsDeferredFromPrevious.some(
            (previous) => previous.float === float,
          )
        );
      });
      if (staleLineFootnote) {
        if (this.locked) {
          this.invalidate();
          return;
        }
        this.removePageFloatFragment(fragment);
        return;
      }
    }
    if (this.checkAndForbidNotAllowedFloat()) {
      return;
    }
    for (let i = this.floatsDeferredToNext.length - 1; i >= 0; i--) {
      const continuation = this.floatsDeferredToNext[i];
      const float = continuation.float;
      const existingFragment = this.findPageFloatFragment(float);
      if (
        "footnotePolicy" in float &&
        float.footnotePolicy === Css.ident.line &&
        this.hasCurrentAnchor(float.getId()) &&
        !existingFragment &&
        !this.lineFootnoteFinishInvalidatedOnce.has(float.getId())
      ) {
        // Once the anchor line has already appeared on the page, a deferred
        // footnote-policy: line footnote can no longer move independently.
        // If a fragment already started on this page, the deferred part is
        // just the continuation and should remain allowed to split.
        // Forbid and invalidate at most once per footnote per page: the float
        // is re-deferred on every page-layout retry, so re-invalidating here
        // each time would never converge and would hang the renderer.
        // (Issue #2024)
        if (this.locked) {
          this.invalidate();
          return;
        }
        this.lineFootnoteFinishInvalidatedOnce.add(float.getId());
        this.removeFloatDeferredToNext(float);
        this.forbid(float);
        this.invalidate();
        return;
      }
    }
    for (let i = this.floatsDeferredToNext.length - 1; i >= 0; i--) {
      const continuation = this.floatsDeferredToNext[i];
      if (!continuation.float.isAllowedOnContext(this)) {
        if (this.locked) {
          this.invalidate();
          return;
        }
        this.floatsDeferredToNext.splice(i, 1);
      }
    }
    this.floatsDeferredFromPrevious.forEach((continuation) => {
      if (
        this.floatsDeferredToNext.findIndex((c) => continuation.equals(c)) >= 0
      ) {
        return;
      }
      if (this.floatFragments.some((f) => f.hasFloat(continuation.float))) {
        return;
      }
      this.floatsDeferredToNext.push(continuation);
    });
  }

  hasSameContainerAs(other: PageFloatLayoutContext): boolean {
    return (
      !!this.container &&
      !!other.container &&
      this.container.element === other.container.element
    );
  }

  invalidate() {
    this.invalidated = true;
    if (this.locked) {
      return;
    }
    if (this.container) {
      this.children.forEach((child) => {
        // Since the same container element is shared by a region page float
        // layout context and a column page float layout context in a single
        // column region, view elements of float fragments of the child (column)
        // context need to be removed here.
        if (this.hasSameContainerAs(child)) {
          child.floatFragments.forEach((fragment) => {
            const elem = fragment.area.element;
            if (elem && elem.parentNode) {
              elem.parentNode.removeChild(elem);
            }
          });
        }
      });
      this.container.clear();
    }
    this.children.forEach((child) => {
      child.layoutConstraints.splice(0);
    });
    this.children.splice(0);
    Object.keys(this.floatAnchors).forEach((k) => {
      delete this.floatAnchors[k];
    });
  }

  detachChildren(): PageFloatLayoutContext[] {
    const children = this.children.splice(0);
    children.forEach((child) => {
      child.floatFragments.forEach((fragment) => {
        const elem = fragment.area.element;
        if (elem && elem.parentNode) {
          elem.parentNode.removeChild(elem);
        }
      });
    });
    return children;
  }

  attachChildren(children: PageFloatLayoutContext[]) {
    children.forEach((child) => {
      this.children.push(child);
      child.reattachFloatFragments();
    });
  }

  isInvalidated() {
    return this.invalidated || (!!this.parent && this.parent.isInvalidated());
  }

  validate() {
    this.invalidated = false;
  }

  private toLogical(side: string): string {
    const writingMode = this.writingMode.toString();
    const direction = this.direction.toString();

    if (side === "inside" || side === "outside") {
      const isLeftPage = !!this.container.element.closest(
        "[data-vivliostyle-page-side='left']",
      );
      side =
        side === "inside"
          ? isLeftPage
            ? "right"
            : "left"
          : isLeftPage
            ? "left"
            : "right";
    }
    return CssLogicalUtil.toLogical(side, writingMode, direction);
  }

  private toPhysical(side: string): string {
    const writingMode = this.writingMode.toString();
    const direction = this.direction.toString();
    return CssLogicalUtil.toPhysical(side, writingMode, direction);
  }

  private toLogicalFloatSides(floatSide: string): string[] {
    const sides = floatSide.split(" ");

    // Convert to logical sides and remove duplicates
    const logicalSides: string[] = [];
    for (const side of sides) {
      const logicalSide = this.toLogical(side);
      if (!logicalSides.includes(logicalSide)) {
        logicalSides.push(logicalSide);
      }
    }

    // Convert "block-start block-end" to "snap-block" and
    // "inline-start inline-end" to "snap-inline".
    // More precisely, when multiple "*block*" values are found
    // convert the first one to "snap-block" and remove the rest,
    // and when multiple "*inline*" values are found convert the
    // first one to "snap-inline" and remove the rest.
    const logicalFloatSides: string[] = [];
    let foundSnapBlock = false;
    let foundSnapInline = false;
    for (let i = 0; i < logicalSides.length; i++) {
      const side = logicalSides[i];
      if (side.includes("block")) {
        if (!foundSnapBlock) {
          // Convert to "snap-block" if another block side is found
          if (logicalSides.slice(i + 1).some((s) => s.includes("block"))) {
            logicalFloatSides.push("snap-block");
            foundSnapBlock = true;
          } else {
            logicalFloatSides.push(side);
          }
        }
      } else if (side.includes("inline")) {
        if (!foundSnapInline) {
          // Convert to "snap-inline" if another inline side is found
          if (logicalSides.slice(i + 1).some((s) => s.includes("inline"))) {
            logicalFloatSides.push("snap-inline");
            foundSnapInline = true;
          } else {
            logicalFloatSides.push(side);
          }
        }
      }
    }

    return logicalFloatSides;
  }

  removeEndFloatFragments(floatSide: string) {
    const logicalFloatSide = this.toLogicalFloatSides(floatSide)[0];
    if (logicalFloatSide === "block-end" || logicalFloatSide === "inline-end") {
      let i = 0;
      while (i < this.floatFragments.length) {
        const fragment = this.floatFragments[i];
        const fragmentFloatSide = this.toLogicalFloatSides(
          fragment.floatSide,
        )[0];
        if (fragmentFloatSide === logicalFloatSide) {
          this.removePageFloatFragment(fragment);
        } else {
          i++;
        }
      }
    }
  }

  private isFragmentInCurrentContainer(fragment: PageFloatFragment): boolean {
    if (this.floatReference !== FloatReference.REGION) {
      return true;
    }
    const area = fragment.area as Partial<LayoutType.PageFloatArea>;
    return (
      !area.parentElement ||
      !this.container?.element ||
      area.parentElement === this.container.element
    );
  }

  stashEndFloatFragments(float: PageFloat) {
    const floatReference = float.floatReference;
    if (floatReference !== this.floatReference) {
      this.getParent(floatReference).stashEndFloatFragments(float);
      return;
    }
    const logicalFloatSide = this.toLogicalFloatSides(float.floatSide)[0];
    if (
      logicalFloatSide === "block-end" ||
      logicalFloatSide === "snap-block" ||
      logicalFloatSide === "inline-end" ||
      logicalFloatSide === "snap-inline"
    ) {
      let i = 0;
      while (i < this.floatFragments.length) {
        const fragment = this.floatFragments[i];
        const fragmentFloatSide = this.toLogicalFloatSides(
          fragment.floatSide,
        )[0];
        if (
          this.isFragmentInCurrentContainer(fragment) &&
          (fragmentFloatSide === logicalFloatSide ||
            (logicalFloatSide === "snap-block" &&
              fragmentFloatSide === "block-end") ||
            (logicalFloatSide === "snap-inline" &&
              fragmentFloatSide === "inline-end")) &&
          fragment.shouldBeStashedBefore(float)
        ) {
          this.stashedFloatFragments.push(fragment);
          this.floatFragments.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }

  restoreStashedFragments(floatReference: FloatReference) {
    if (floatReference !== this.floatReference) {
      this.getParent(floatReference).restoreStashedFragments(floatReference);
      return;
    }
    this.stashedFloatFragments.forEach((stashed) => {
      this.addPageFloatFragment(stashed, true);
    });
    this.stashedFloatFragments.splice(0);
  }

  discardStashedFragments(floatReference: FloatReference) {
    if (floatReference !== this.floatReference) {
      this.getParent(floatReference).discardStashedFragments(floatReference);
      return;
    }
    this.stashedFloatFragments.splice(0);
  }

  getStashedFloatFragments(
    floatReference: FloatReference,
  ): PageFloatFragment[] {
    if (floatReference === this.floatReference) {
      return this.stashedFloatFragments
        .concat()
        .sort((fr1, fr2) => fr2.getOrder() - fr1.getOrder()); // return in reverse order
    } else {
      return this.getParent(floatReference).getStashedFloatFragments(
        floatReference,
      );
    }
  }

  private getLimitValue(
    side: string,
    side2: string | null,
    layoutContext: Vtree.LayoutContext,
    clientLayout: Vtree.ClientLayout,
    condition?: (p1: PageFloatFragment, p2: PageFloatLayoutContext) => boolean,
    includeParent: boolean = true,
    excludedArea?: LayoutType.PageFloatArea,
  ): number {
    Asserts.assert(this.container);
    const logicalSide = this.toLogical(side);
    const physicalSide = this.toPhysical(side);
    const logicalSide2 = side2 && this.toLogical(side2);
    const physicalSide2 = side2 && this.toPhysical(side2);
    const limit = this.getLimitValueInner(
      logicalSide,
      logicalSide2,
      layoutContext,
      clientLayout,
      condition,
      excludedArea,
    );
    if (includeParent && this.parent && this.parent.container) {
      const parentLimit = this.parent.getLimitValue(
        physicalSide,
        physicalSide2,
        layoutContext,
        clientLayout,
        condition,
        includeParent,
        excludedArea,
      );
      switch (physicalSide) {
        case "top":
          return Math.max(limit, parentLimit);
        case "left":
          return Math.max(limit, parentLimit);
        case "bottom":
          return Math.min(limit, parentLimit);
        case "right":
          return Math.min(limit, parentLimit);
        default:
          Asserts.fail("Should be unreachable");
      }
    }
    return limit;
  }

  private getLimitValueInner(
    logicalSide: string,
    logicalSide2: string | null,
    layoutContext: Vtree.LayoutContext,
    clientLayout: Vtree.ClientLayout,
    condition?: (p1: PageFloatFragment, p2: PageFloatLayoutContext) => boolean,
    excludedArea?: LayoutType.PageFloatArea,
  ): number {
    Asserts.assert(this.container);
    const limits = this.getLimitValuesInner(
      layoutContext,
      clientLayout,
      condition,
      logicalSide,
      logicalSide2,
      excludedArea,
    );
    switch (logicalSide) {
      case "block-start":
        return this.container.vertical ? limits.right : limits.top;
      case "block-end":
        return this.container.vertical ? limits.left : limits.bottom;
      case "inline-start":
        return this.container.vertical
          ? this.container.rtl
            ? limits.bottom
            : limits.top
          : this.container.rtl
            ? limits.right
            : limits.left;
      case "inline-end":
        return this.container.vertical
          ? this.container.rtl
            ? limits.top
            : limits.bottom
          : this.container.rtl
            ? limits.left
            : limits.right;
      default:
        throw new Error(`Unknown logical side: ${logicalSide}`);
    }
  }

  private getLimitValuesInner(
    layoutContext: Vtree.LayoutContext,
    clientLayout: Vtree.ClientLayout,
    condition?: (p1: PageFloatFragment, p2: PageFloatLayoutContext) => boolean,
    logicalSide?: string,
    logicalSide2?: string,
    excludedArea?: LayoutType.PageFloatArea,
  ): {
    top: number;
    left: number;
    bottom: number;
    right: number;
    floatMinWrapBlockStart: number;
    floatMinWrapBlockEnd: number;
  } {
    Asserts.assert(this.container);
    const offsetX = this.container.originX;
    const offsetY = this.container.originY;
    const paddingRect = this.container.getPaddingRect();
    let limits = {
      top: paddingRect.y1 - offsetY,
      left: paddingRect.x1 - offsetX,
      bottom: paddingRect.y2 - offsetY,
      right: paddingRect.x2 - offsetX,
      floatMinWrapBlockStart: 0,
      floatMinWrapBlockEnd: 0,
    };
    // During column balancing, the container's JS block-size (width for
    // vertical, height for horizontal) may be reduced while the CSS element
    // dimensions stay at the original value. Use the original CSS dimensions
    // for float limit calculations to keep consistency with float fragment
    // positions, which are based on the real DOM layout. (Issue #1764)
    // Only apply when CSS > JS (balancing reduced JS), not when CSS < JS
    // (footnotes reduced CSS via adjustColumnBlockSizeForBlockEndFloats).
    if (this.container.vertical) {
      const cssWidth = parseFloat(this.container.element?.style?.width);
      if (isFinite(cssWidth) && cssWidth > this.container.width) {
        limits.right += cssWidth - this.container.width;
      }
    } else {
      const cssHeight = parseFloat(this.container.element?.style?.height);
      if (isFinite(cssHeight) && cssHeight > this.container.height) {
        limits.bottom += cssHeight - this.container.height;
      }
    }

    function resolveLengthPercentage(numeric, viewNode, containerLength) {
      if (numeric.unit === "%") {
        return (containerLength * numeric.num) / 100;
      } else {
        return layoutContext.convertLengthToPx(numeric, viewNode, clientLayout);
      }
    }
    const fragments = this.floatFragments;
    if (fragments.length > 0) {
      limits = fragments.reduce((l, f) => {
        if (f.area === excludedArea) {
          return l;
        }
        if (!this.isFragmentInCurrentContainer(f)) {
          return l;
        }
        if (condition && !condition(f, this)) {
          return l;
        }
        const [logicalFloatSide, logicalFloatSide2] = this.toLogicalFloatSides(
          f.floatSide,
        );
        if (
          logicalFloatSide2 &&
          ((logicalSide &&
            logicalFloatSide2.includes("block") ===
              logicalSide.includes("block") &&
            logicalFloatSide2 !== logicalSide) ||
            (logicalSide2 &&
              logicalFloatSide2.includes("block") ===
                logicalSide2.includes("block") &&
              logicalFloatSide2 !== logicalSide2))
        ) {
          // Preceding page floats on the opposite side should not affect
          // the positioning limit. (Issue #1549)
          return l;
        }
        const area = f.area;
        const floatMinWrapBlock = f.continuations[0].float.floatMinWrapBlock;
        const outerBlockEnd = area.vertical
          ? area.left + area.getInsetLeft() + area.width + area.getInsetRight()
          : area.top + area.getInsetTop() + area.height + area.getInsetBottom();
        const outerInlineEnd = area.vertical
          ? area.top + area.getInsetTop() + area.height + area.getInsetBottom()
          : area.left + area.getInsetLeft() + area.width + area.getInsetRight();
        let top = l.top;
        let left = l.left;
        let bottom = l.bottom;
        let right = l.right;
        let floatMinWrapBlockStart = l.floatMinWrapBlockStart;
        let floatMinWrapBlockEnd = l.floatMinWrapBlockEnd;
        switch (logicalFloatSide) {
          case "inline-start":
            if (area.vertical) {
              top = Math.max(top, outerInlineEnd);
            } else {
              left = Math.max(left, outerInlineEnd);
            }
            break;
          case "block-start":
            if (area.vertical) {
              if (floatMinWrapBlock && area.left < right) {
                floatMinWrapBlockStart = resolveLengthPercentage(
                  floatMinWrapBlock,
                  (area as any).rootViewNodes[0],
                  paddingRect.x2 - paddingRect.x1,
                ) as number;
              }
              right = Math.min(right, area.left);
            } else {
              if (floatMinWrapBlock && outerBlockEnd > top) {
                floatMinWrapBlockStart = resolveLengthPercentage(
                  floatMinWrapBlock,
                  (area as any).rootViewNodes[0],
                  paddingRect.y2 - paddingRect.y1,
                ) as number;
              }
              top = Math.max(top, outerBlockEnd);
            }
            break;
          case "inline-end":
            if (area.vertical) {
              bottom = Math.min(bottom, area.top);
            } else {
              right = Math.min(right, area.left);
            }
            break;
          case "block-end":
            if (area.vertical) {
              if (floatMinWrapBlock && outerBlockEnd > left) {
                floatMinWrapBlockEnd = resolveLengthPercentage(
                  floatMinWrapBlock,
                  (area as any).rootViewNodes[0],
                  paddingRect.x2 - paddingRect.x1,
                ) as number;
              }
              left = Math.max(left, outerBlockEnd);
            } else {
              if (floatMinWrapBlock && area.top < bottom) {
                floatMinWrapBlockEnd = resolveLengthPercentage(
                  floatMinWrapBlock,
                  (area as any).rootViewNodes[0],
                  paddingRect.y2 - paddingRect.y1,
                ) as number;
              }
              bottom = Math.min(bottom, area.top);
            }
            break;
          default:
            throw new Error(`Unknown logical float side: ${logicalFloatSide}`);
        }
        return {
          top,
          left,
          bottom,
          right,
          floatMinWrapBlockStart,
          floatMinWrapBlockEnd,
        };
      }, limits);
    }
    limits.left += offsetX;
    limits.right += offsetX;
    limits.top += offsetY;
    limits.bottom += offsetY;
    return limits;
  }

  /**
   * @param anchorEdge Null indicates that the anchor is not in the current
   *     container.
   * @return Logical float side (snap-block is resolved when init=false). Null
   *     indicates that the float area does not fit inside the container
   */
  setFloatAreaDimensions(
    area: LayoutType.PageFloatArea,
    floatReference: FloatReference,
    floatSide: string,
    anchorEdge: number | null,
    init: boolean,
    force: boolean,
    condition: PageFloatPlacementCondition,
  ): string | null {
    if (floatReference !== this.floatReference) {
      const parent = this.getParent(floatReference);
      return parent.setFloatAreaDimensions(
        area,
        floatReference,
        floatSide,
        anchorEdge,
        init,
        force,
        condition,
      );
    }
    const logicalFloatSides = this.toLogicalFloatSides(floatSide);
    if (logicalFloatSides[0] === "snap-block") {
      if (!condition["block-start"] && !condition["block-end"]) {
        return null;
      }
    } else if (logicalFloatSides[0].includes("block")) {
      if (!condition[logicalFloatSides[0]]) {
        return null;
      }
    }
    Asserts.assert(area.clientLayout);

    // Preceding page floats on the opposite side should not affect
    // the positioning limit unless clear:inline-start/end is specified.
    // (Issue #1549, #1550)
    const inlineSideForBlockLimit = logicalFloatSides.find(
      (s) =>
        s.includes("inline") &&
        condition[s === "inline-start" ? "inline-end" : "inline-start"],
    );
    const blockSideForInlineLimit = logicalFloatSides.find((s) =>
      s.includes("block"),
    );
    const includeParentLimits = true;

    let blockStart = this.getLimitValue(
      "block-start",
      inlineSideForBlockLimit,
      area.layoutContext,
      area.clientLayout,
      undefined,
      includeParentLimits,
      area,
    );
    let blockEnd = this.getLimitValue(
      "block-end",
      inlineSideForBlockLimit,
      area.layoutContext,
      area.clientLayout,
      undefined,
      includeParentLimits,
      area,
    );
    let inlineStart = this.getLimitValue(
      "inline-start",
      blockSideForInlineLimit,
      area.layoutContext,
      area.clientLayout,
      undefined,
      includeParentLimits,
      area,
    );
    let inlineEnd = this.getLimitValue(
      "inline-end",
      blockSideForInlineLimit,
      area.layoutContext,
      area.clientLayout,
      undefined,
      includeParentLimits,
      area,
    );
    const blockOffset = area.vertical ? area.originX : area.originY;
    const inlineOffset = area.vertical ? area.originY : area.originX;
    // For footnotes, skip clamping blockStart/blockEnd to the area's own
    // dimensions. The area dimensions may be constrained by max-block-size
    // (max-height in horizontal, max-width in vertical), but the footnote
    // needs the full page limits for correct block-end positioning.
    // After positioning, the block dimension is clamped to max-block-size
    // in setupFloatArea. (Issue #1878)
    if (!area.isFootnote) {
      blockStart = area.vertical
        ? Math.min(
            blockStart,
            area.left +
              area.getInsetLeft() +
              area.width +
              area.getInsetRight() +
              blockOffset,
          )
        : Math.max(blockStart, area.top + blockOffset);
      blockEnd = area.vertical
        ? Math.max(blockEnd, area.left + blockOffset)
        : Math.min(
            blockEnd,
            area.top +
              area.getInsetTop() +
              area.height +
              area.getInsetBottom() +
              blockOffset,
          );
    }

    function limitBlockStartEndValueWithOpenRect(getRect, rect) {
      let openRect = getRect(area.bands, rect);
      if (openRect) {
        if (area.vertical) {
          openRect = GeometryUtil.unrotateBox(openRect);
        }
        blockStart = area.vertical
          ? Math.min(blockStart, openRect.x2)
          : Math.max(blockStart, openRect.y1);
        blockEnd = area.vertical
          ? Math.max(blockEnd, openRect.x1)
          : Math.min(blockEnd, openRect.y2);
        return true;
      } else {
        return force;
      }
    }
    let blockSize: number;
    let inlineSize: number;
    let outerBlockSize: number;
    let outerInlineSize: number;
    if (init) {
      const rect = area.vertical
        ? GeometryUtil.rotateBox(
            new GeometryUtil.Rect(blockEnd, inlineStart, blockStart, inlineEnd),
          )
        : new GeometryUtil.Rect(inlineStart, blockStart, inlineEnd, blockEnd);
      if (
        logicalFloatSides[0] === "block-start" ||
        logicalFloatSides[0] === "snap-block" ||
        logicalFloatSides[0] === "inline-start" ||
        logicalFloatSides[0] === "snap-inline"
      ) {
        if (
          !limitBlockStartEndValueWithOpenRect(
            GeometryUtil.findUppermostFullyOpenRect,
            rect,
          )
        ) {
          return null;
        }
      }
      if (
        logicalFloatSides[0] === "block-end" ||
        logicalFloatSides[0] === "snap-block" ||
        logicalFloatSides[0] === "inline-end" ||
        logicalFloatSides[0] === "snap-inline"
      ) {
        if (
          !limitBlockStartEndValueWithOpenRect(
            GeometryUtil.findBottommostFullyOpenRect,
            rect,
          )
        ) {
          return null;
        }
      }
      // For footnotes with a valid anchor edge, constrain the available
      // block space so the footnote starts no higher than the anchor
      // position. This enables footnote fragmentation: content that
      // doesn't fit below the anchor overflows and is deferred to the
      // next page.
      if (
        area.isFootnote &&
        anchorEdge !== null &&
        isFinite(anchorEdge) &&
        logicalFloatSides[0] === "block-end"
      ) {
        if (area.vertical) {
          blockStart = Math.min(blockStart, anchorEdge);
        } else {
          blockStart = Math.max(blockStart, anchorEdge);
        }
      }
      outerBlockSize = (blockEnd - blockStart) * area.getBoxDir();
      // Issue #1879: Apply footnoteMaxBlockSize constraint from iterative
      // retry. When a footnote was found too large (anchor not reachable
      // in multi-column re-layout), this limits the footnote area.
      if (area.isFootnote && this.footnoteMaxBlockSize != null) {
        outerBlockSize = Math.min(outerBlockSize, this.footnoteMaxBlockSize);
        // Adjust blockStart accordingly for correct positioning
        if (area.vertical) {
          blockStart = blockEnd + outerBlockSize;
        } else {
          blockStart = blockEnd - outerBlockSize;
        }
      }
      blockSize = Math.max(
        0,
        outerBlockSize - area.getInsetBefore() - area.getInsetAfter(),
      );
      outerInlineSize = (inlineEnd - inlineStart) * area.getInlineDir();
      inlineSize = outerInlineSize - area.getInsetStart() - area.getInsetEnd();
      if (!force && (blockSize <= 0 || inlineSize <= 0)) {
        return null;
      }
    } else {
      // computedBlockSize already includes the border-box size (padding +
      // border) of the root float elements and any positive trailing margin.
      // However, negative trailing margin is not reflected, so only add the
      // negative part of margin-after here. (Issue #1752)
      const marginAfter = area.getContentBlockMarginAfter();
      blockSize = Math.max(
        0,
        area.computedBlockSize + Math.min(0, marginAfter),
      );
      outerBlockSize = blockSize + area.getInsetBefore() + area.getInsetAfter();
      const availableBlockSize = (blockEnd - blockStart) * area.getBoxDir();
      if (logicalFloatSides[0] === "snap-block") {
        if (anchorEdge === null) {
          // Deferred from previous container
          logicalFloatSides[0] = "block-start";
        } else {
          const containerRect = this.container.getPaddingRect();
          const fromStart =
            this.container.getBoxDir() *
            (anchorEdge -
              (this.container.vertical ? containerRect.x2 : containerRect.y1));
          const fromEnd =
            this.container.getBoxDir() *
            ((this.container.vertical ? containerRect.x1 : containerRect.y2) -
              anchorEdge -
              outerBlockSize);
          if (fromStart <= fromEnd) {
            logicalFloatSides[0] = "block-start";
          } else {
            logicalFloatSides[0] = "block-end";
          }
        }
        if (!condition[logicalFloatSides[0]]) {
          if (condition["block-end"]) {
            logicalFloatSides[0] = "block-end";
          } else {
            return null;
          }
        }
      } else if (logicalFloatSides[0] === "snap-inline") {
        if (anchorEdge === null) {
          // Deferred from previous container
          logicalFloatSides[0] = "inline-start";
        } else {
          // FIXME: snap-inline should be resolved based on the anchor's inline position
          if (condition["inline-start"]) {
            logicalFloatSides[0] = "inline-start";
          } else if (condition["inline-end"]) {
            logicalFloatSides[0] = "inline-end";
          } else {
            return null;
          }
        }
      }
      if (!force && availableBlockSize < outerBlockSize) {
        return null;
      }
      if (
        logicalFloatSides[0] === "inline-start" ||
        logicalFloatSides[0] === "inline-end" ||
        logicalFloatSides[1]
      ) {
        // If the page float is "inline-start" or "inline-end" or has two sides
        // (e.g. "block-start inline-end"), the inline size is determined by the content size.
        inlineSize = Sizing.getSize(area.clientLayout, area.element, [
          Sizing.Size.FIT_CONTENT_INLINE_SIZE,
        ])[Sizing.Size.FIT_CONTENT_INLINE_SIZE];
      } else if (area.adjustContentRelativeSize) {
        inlineSize = area.getContentInlineSize();
      } else {
        inlineSize = area.vertical ? area.height : area.width;
      }
      outerInlineSize = inlineSize + area.getInsetStart() + area.getInsetEnd();
      const availableInlineSize =
        (inlineEnd - inlineStart) * area.getInlineDir();
      if (!force && availableInlineSize < outerInlineSize) {
        return null;
      }
    }
    blockStart -= blockOffset;
    blockEnd -= blockOffset;
    inlineStart -= inlineOffset;
    inlineEnd -= inlineOffset;

    if (
      logicalFloatSides.some(
        (s) => s === "inline-start" || s === "snap-inline",
      ) ||
      (logicalFloatSides.length === 1 &&
        (logicalFloatSides[0] === "block-start" ||
          logicalFloatSides[0] === "snap-block"))
    ) {
      area.setInlinePosition(inlineStart, inlineSize);
    } else if (
      logicalFloatSides.some((s) => s === "inline-end") ||
      (logicalFloatSides.length === 1 && logicalFloatSides[0] === "block-end")
    ) {
      area.setInlinePosition(
        inlineEnd - outerInlineSize * area.getInlineDir(),
        inlineSize,
      );
    }
    if (
      logicalFloatSides.some(
        (s) => s === "block-start" || s === "snap-block",
      ) ||
      (logicalFloatSides.length === 1 &&
        (logicalFloatSides[0] === "inline-start" ||
          logicalFloatSides[0] === "snap-inline"))
    ) {
      area.setBlockPosition(blockStart, blockSize);
    } else if (
      logicalFloatSides.some((s) => s === "block-end") ||
      (logicalFloatSides.length === 1 && logicalFloatSides[0] === "inline-end")
    ) {
      const blockPosition = blockEnd - outerBlockSize * area.getBoxDir();
      area.setBlockPosition(blockPosition, blockSize);
    }

    return logicalFloatSides.join(" ");
  }

  getFloatFragmentExclusions(): GeometryUtil.Shape[] {
    const result = this.floatFragments.map((fragment) =>
      fragment.getOuterShape(),
    );
    if (this.parent) {
      return this.parent.getFloatFragmentExclusions().concat(result);
    } else {
      return result;
    }
  }

  private reattachFloatFragments() {
    const parent = this.container.element && this.container.element.parentNode;
    if (parent) {
      this.floatFragments.forEach((fragment) => {
        parent.appendChild(fragment.area.element);
      });
    }
  }

  getMaxReachedAfterEdge(): number {
    const isVertical = this.getContainer().vertical;
    return this.floatFragments.reduce(
      (edge, fragment) => {
        const rect = fragment.getOuterRect();
        if (isVertical) {
          return Math.min(edge, rect.x1);
        } else {
          return Math.max(edge, rect.y2);
        }
      },
      isVertical ? Infinity : 0,
    );
  }

  getBlockEndEdgeOfBlockStartFloats(inlinePos?: number): number {
    let context: PageFloatLayoutContext = this;
    let container: Vtree.Container | null = null;
    while (context && !container) {
      container = context.container;
      context = context.parent;
    }
    const isVertical = !!container?.vertical;
    let edge = NaN;
    this.floatFragments
      .filter((fragment) => fragment.floatSide.includes("block-start"))
      .filter((fragment) => {
        if (!isFinite(inlinePos)) {
          return true;
        }
        const rect = fragment.getOuterRect();
        return isVertical
          ? rect.y1 <= inlinePos && inlinePos <= rect.y2
          : rect.x1 <= inlinePos && inlinePos <= rect.x2;
      })
      .forEach((fragment) => {
        const rect = fragment.getOuterRect();
        const fragmentEdge = isVertical ? rect.x1 : rect.y2;
        edge = isFinite(edge)
          ? isVertical
            ? Math.min(edge, fragmentEdge)
            : Math.max(edge, fragmentEdge)
          : fragmentEdge;
      });
    if (this.parent) {
      const parentEdge =
        this.parent.getBlockEndEdgeOfBlockStartFloats(inlinePos);
      if (isFinite(parentEdge)) {
        edge = isFinite(edge)
          ? isVertical
            ? Math.min(edge, parentEdge)
            : Math.max(edge, parentEdge)
          : parentEdge;
      }
    }
    return edge;
  }

  getBlockStartEdgeOfBlockEndFloats(inlinePos?: number): number {
    let context: PageFloatLayoutContext = this;
    let container: Vtree.Container | null = null;
    while (context && !container) {
      container = context.container;
      context = context.parent;
    }
    const isVertical = !!container?.vertical;
    let edge = NaN;
    this.floatFragments
      .filter((fragment) => fragment.floatSide.includes("block-end"))
      .filter((fragment) => {
        if (!isFinite(inlinePos)) {
          return true;
        }
        const rect = fragment.getOuterRect();
        return isVertical
          ? rect.y1 <= inlinePos && inlinePos <= rect.y2
          : rect.x1 <= inlinePos && inlinePos <= rect.x2;
      })
      .forEach((fragment) => {
        const rect = fragment.getOuterRect();
        const fragmentEdge = isVertical ? rect.x2 : rect.y1;
        edge = isFinite(edge)
          ? isVertical
            ? Math.max(edge, fragmentEdge)
            : Math.min(edge, fragmentEdge)
          : fragmentEdge;
      });
    if (this.parent) {
      const parentEdge =
        this.parent.getBlockStartEdgeOfBlockEndFloats(inlinePos);
      if (isFinite(parentEdge)) {
        edge = isFinite(edge)
          ? isVertical
            ? Math.max(edge, parentEdge)
            : Math.min(edge, parentEdge)
          : parentEdge;
      }
    }
    return edge;
  }

  getPageFloatClearEdge(clear: string, column: LayoutType.Column): number {
    const shouldIgnoreFloatForClear = (floatSide: string) => {
      const logicalFloatSides = this.toLogicalFloatSides(floatSide);
      const primaryLogicalFloatSide = logicalFloatSides[0];
      if (clear === "both") {
        return primaryLogicalFloatSide === "block-end";
      }
      if (clear === "inline-start") {
        return (
          logicalFloatSides.includes("inline-end") ||
          primaryLogicalFloatSide === "block-end"
        );
      }
      if (clear === "inline-end") {
        return (
          logicalFloatSides.includes("inline-start") ||
          primaryLogicalFloatSide === "block-start" ||
          primaryLogicalFloatSide === "block-end"
        );
      }
      return false;
    };

    function isContinuationOfAlreadyAppearedFloat(
      context: PageFloatLayoutContext,
    ) {
      return (continuation: PageFloatContinuation) =>
        !shouldIgnoreFloatForClear(continuation.float.floatSide) &&
        context.isAnchorAlreadyAppeared(continuation.float.getId());
    }

    function isFragmentWithAlreadyAppearedFloat(
      fragment: PageFloatFragment,
      context: PageFloatLayoutContext,
    ) {
      if (shouldIgnoreFloatForClear(fragment.floatSide)) {
        // Block-end page floats, including footnotes, are positioned after the
        // current block and must not force inline-side clear on normal blocks.
        // (Issue #1987, revisiting Issue #1550 behavior)
        return false;
      }
      return fragment.continuations.some(
        isContinuationOfAlreadyAppearedFloat(context),
      );
    }
    const columnRect = column.getPaddingRect();
    const columnBlockEnd = column.vertical ? columnRect.x1 : columnRect.y2;
    let context: PageFloatLayoutContext = this;
    while (context) {
      if (
        context.floatsDeferredToNext.some(
          isContinuationOfAlreadyAppearedFloat(context),
        )
      ) {
        return columnBlockEnd;
      }
      context = context.parent;
    }

    function hasFragmentWithAlreadyAppearedFloat(
      context: PageFloatLayoutContext,
    ) {
      return (
        context.floatFragments.some((fragment) =>
          isFragmentWithAlreadyAppearedFloat(fragment, context),
        ) ||
        context.children.some((child) =>
          hasFragmentWithAlreadyAppearedFloat(child),
        )
      );
    }

    // Support clear:column/region/page for page floats. (Issue #1551)
    if (clear === "column" || clear === "region" || clear === "page") {
      for (context = this; context; context = context.parent) {
        if (context.floatReference === clear) {
          if (hasFragmentWithAlreadyAppearedFloat(context)) {
            return columnBlockEnd;
          }
          break;
        }
      }
    }

    Asserts.assert(column.clientLayout);
    const blockStartLimit = this.getLimitValue(
      "block-start",
      null,
      column.layoutContext,
      column.clientLayout,
      isFragmentWithAlreadyAppearedFloat,
    );
    const blockEndLimit = this.getLimitValue(
      "block-end",
      null,
      column.layoutContext,
      column.clientLayout,
      isFragmentWithAlreadyAppearedFloat,
    );
    if (
      blockEndLimit * column.getBoxDir() <
      columnBlockEnd * column.getBoxDir()
    ) {
      return columnBlockEnd;
    } else {
      return blockStartLimit;
    }
  }

  getPageFloatPlacementCondition(
    float: PageFloat,
    floatSide: string,
    clearSide: string | null,
  ): PageFloatPlacementCondition {
    if (float.floatReference !== this.floatReference) {
      const parent = this.getParent(float.floatReference);
      return parent.getPageFloatPlacementCondition(float, floatSide, clearSide);
    }
    const result: PageFloatPlacementCondition = {
      "block-start": true,
      "block-end": true,
      "inline-start": true,
      "inline-end": true,
    };
    if (!clearSide) {
      return result;
    }
    const logicalFloatSide = this.toLogicalFloatSides(floatSide)[0];
    const logicalClearSide = this.toLogical(clearSide);
    let logicalSides: string[];
    if (logicalClearSide === "all") {
      logicalSides = ["block-start", "block-end", "inline-start", "inline-end"];
    } else if (logicalClearSide === "both") {
      logicalSides = ["inline-start", "inline-end"];
    } else if (logicalClearSide === "same") {
      if (logicalFloatSide === "snap-block") {
        logicalSides = ["block-start", "block-end"];
      } else {
        logicalSides = [logicalFloatSide];
      }
    } else {
      logicalSides = [logicalClearSide];
    }
    const floatOrder = float.getOrder();

    function isPrecedingFragment(
      side: string | null,
    ): (p1: PageFloatFragment) => boolean {
      return (fragment) =>
        (!side || fragment.floatSide.includes(side)) &&
        fragment.getOrder() < floatOrder;
    }

    function hasPrecedingFragmentInChildren(
      context: PageFloatLayoutContext,
      side: string | null,
    ): boolean {
      return context.children.some(
        (child) =>
          child.floatFragments.some(isPrecedingFragment(side)) ||
          hasPrecedingFragmentInChildren(child, side),
      );
    }

    function hasPrecedingFragmentInParents(
      context: PageFloatLayoutContext,
      side: string | null,
    ): boolean {
      const parent = context.parent;
      return (
        !!parent &&
        (parent.floatFragments.some(isPrecedingFragment(side)) ||
          hasPrecedingFragmentInParents(parent, side))
      );
    }

    // Support clear:column/region/page for page floats. (Issue #1551)
    if (
      clearSide === "column" ||
      clearSide === "region" ||
      clearSide === "page"
    ) {
      for (
        let context: PageFloatLayoutContext = this;
        context;
        context = context.parent
      ) {
        if (context.floatReference === clearSide) {
          if (
            context.floatFragments.some(isPrecedingFragment(null)) ||
            hasPrecedingFragmentInChildren(context, null)
          ) {
            result["block-start"] = false;
            result["block-end"] = false;
            result["inline-start"] = false;
            result["inline-end"] = false;
          }
          break;
        }
      }
      return result;
    }

    logicalSides.forEach((side) => {
      switch (side) {
        case "block-start":
          result[side] = !hasPrecedingFragmentInChildren(this, side);
          break;
        case "block-end":
          result[side] = !hasPrecedingFragmentInParents(this, side);
          break;
        case "inline-start":
        case "inline-end":
          // Support clear:inline-start/end for page floats. (Issue #1550)
          result[side] = !this.floatFragments.some(isPrecedingFragment(side));
          break;
        default:
          throw new Error(`Unexpected side: ${side}`);
      }
    });
    return result;
  }

  getLayoutConstraints(): LayoutType.LayoutConstraint[] {
    const constraints = this.parent ? this.parent.getLayoutConstraints() : [];
    return constraints.concat(this.layoutConstraints);
  }

  addLayoutConstraint(
    layoutConstraint: LayoutType.LayoutConstraint,
    floatReference: FloatReference,
  ) {
    if (floatReference === this.floatReference) {
      this.layoutConstraints.push(layoutConstraint);
    } else {
      this.getParent(floatReference).addLayoutConstraint(
        layoutConstraint,
        floatReference,
      );
    }
  }

  isColumnFullWithPageFloats(column: LayoutType.Column): boolean {
    const layoutContext = column.layoutContext;
    const clientLayout = column.clientLayout;
    Asserts.assert(clientLayout);
    let context: PageFloatLayoutContext = this;
    let limits: {
      top: number;
      left: number;
      bottom: number;
      right: number;
      floatMinWrapBlockStart: number;
      floatMinWrapBlockEnd: number;
    } = null;
    while (context && context.container) {
      const l = context.getLimitValuesInner(layoutContext, clientLayout);
      if (limits) {
        if (column.vertical) {
          if (l.right < limits.right) {
            limits.right = l.right;
            limits.floatMinWrapBlockStart = l.floatMinWrapBlockStart;
          }
          if (l.left > limits.left) {
            limits.left = l.left;
            limits.floatMinWrapBlockEnd = l.floatMinWrapBlockEnd;
          }
        } else {
          if (l.top > limits.top) {
            limits.top = l.top;
            limits.floatMinWrapBlockStart = l.floatMinWrapBlockStart;
          }
          if (l.bottom < limits.bottom) {
            limits.bottom = l.bottom;
            limits.floatMinWrapBlockEnd = l.floatMinWrapBlockEnd;
          }
        }
      } else {
        limits = l;
      }
      context = context.parent;
    }
    const floatMinWrapBlock = Math.max(
      limits.floatMinWrapBlockStart,
      limits.floatMinWrapBlockEnd,
    );
    const blockSpace = column.vertical
      ? limits.right - limits.left
      : limits.bottom - limits.top;
    return blockSpace <= floatMinWrapBlock;
  }

  getMaxBlockSizeOfPageFloats(): number {
    const isVertical = this.getContainer().vertical;
    if (!this.floatFragments.length) {
      return 0;
    }
    return Math.max.apply(
      null,
      this.floatFragments.map((fragment) => {
        const area = fragment.area;
        if (isVertical) {
          return area.width;
        } else {
          return area.height;
        }
      }),
    );
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  isLocked(): boolean {
    return this.locked;
  }
}

export interface PageFloatLayoutStrategy
  extends PageFloats.PageFloatLayoutStrategy {}

const pageFloatLayoutStrategies: PageFloatLayoutStrategy[] = [];

export class PageFloatLayoutStrategyResolver {
  static register(strategy: PageFloatLayoutStrategy) {
    pageFloatLayoutStrategies.push(strategy);
  }

  findByNodeContext(nodeContext: Vtree.NodeContext): PageFloatLayoutStrategy {
    for (let i = pageFloatLayoutStrategies.length - 1; i >= 0; i--) {
      const strategy = pageFloatLayoutStrategies[i];
      if (strategy.appliesToNodeContext(nodeContext)) {
        return strategy;
      }
    }
    throw new Error(`No PageFloatLayoutStrategy found for ${nodeContext}`);
  }

  findByFloat(float: PageFloat): PageFloatLayoutStrategy {
    for (let i = pageFloatLayoutStrategies.length - 1; i >= 0; i--) {
      const strategy = pageFloatLayoutStrategies[i];
      if (strategy.appliesToFloat(float)) {
        return strategy;
      }
    }
    throw new Error(`No PageFloatLayoutStrategy found for ${float}`);
  }
}

export class NormalPageFloatLayoutStrategy implements PageFloatLayoutStrategy {
  /** @override */
  appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean {
    return isPageFloat(nodeContext.floatReference);
  }

  /** @override */
  appliesToFloat(float: PageFloat): boolean {
    return true;
  }

  /** @override */
  createPageFloat(
    nodeContext: Vtree.NodeContext,
    pageFloatLayoutContext: PageFloatLayoutContext,
    column: LayoutType.Column,
  ): Task.Result<PageFloat> {
    let floatReference = nodeContext.floatReference;
    Asserts.assert(nodeContext.floatSide);
    const floatSide: string = nodeContext.floatSide;
    const nodePosition = nodeContext.toNodePosition();
    const insidePageFloat = !!pageFloatLayoutContext.generatingNodePosition;
    return column
      .resolveFloatReferenceFromColumnSpan(
        floatReference,
        nodeContext.columnSpan,
        nodeContext,
      )
      .thenAsync((ref) => {
        floatReference = ref;
        Asserts.assert(pageFloatLayoutContext.flowName);
        const float = new PageFloat(
          nodePosition,
          floatReference,
          floatSide,
          nodeContext.clearSide,
          pageFloatLayoutContext.flowName,
          nodeContext.floatMinWrapBlock,
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
      });
  }

  /** @override */
  createPageFloatFragment(
    continuations: PageFloatContinuation[],
    floatSide: string,
    clearSide: string | null,
    floatArea: LayoutType.PageFloatArea,
    continues: boolean,
  ): PageFloatFragment {
    const f = continuations[0].float;
    return new PageFloatFragment(
      f.floatReference,
      floatSide,
      clearSide,
      continuations,
      floatArea,
      continues,
    );
  }

  /** @override */
  findPageFloatFragment(
    float: PageFloat,
    pageFloatLayoutContext: PageFloatLayoutContext,
  ): PageFloatFragment | null {
    return pageFloatLayoutContext.findPageFloatFragment(float);
  }

  /** @override */
  adjustPageFloatArea(
    floatArea: LayoutType.PageFloatArea,
    floatContainer: Vtree.Container,
    column: LayoutType.Column,
  ): Task.Result<void> {
    return Task.newResult(undefined);
  }

  /** @override */
  forbid(float: PageFloat, pageFloatLayoutContext: PageFloatLayoutContext) {}
}

PageFloatLayoutStrategyResolver.register(new NormalPageFloatLayoutStrategy());
