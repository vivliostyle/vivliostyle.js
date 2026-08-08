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
 * @fileoverview LegacyPluginSurface - Compatibility view of the node context
 * contract for externally registered plugin hooks.
 *
 * @deprecated Everything in this module exists so that plugin code written
 * against the mutable class-based `Vtree.NodeContext` keeps compiling, and
 * keeps behaving as it did over the payloads a hook is handed and over the
 * members the projections and the adapters serve. Two things it does not keep,
 * both fixed by the spec: a projected object is not the core object it stands
 * for, and an assignment to a projected member stays inside the view. Core code
 * must use `Vtree.NodeContext` and `node-context.ts`.
 */
import * as Break from "./break";
import * as BreakPosition from "./break-position";
import * as Css from "./css";
import * as Diff from "./diff";
import * as NodeContext from "./node-context";
import * as Plugin from "./plugin";
import * as Task from "./task";
import {
  FragmentLayoutConstraintType,
  Layout,
  PageFloats,
  Selectors,
  Vtree,
} from "./types";
import type { LayoutProcessor } from "./layout-processor";

/**
 * @deprecated Flat mutable view of a node context. Use `Vtree.NodeContext`.
 */
export interface LegacyNodeContext {
  offsetInNode: number;
  after: boolean;
  shadowType: Vtree.ShadowType;
  shadowContext: Vtree.ShadowContext | null;
  nodeShadow: Vtree.ShadowContext | null;
  shadowSibling: LegacyNodeContext | null;
  shared: boolean;
  inline: boolean;
  overflow: boolean;
  breakPenalty: number;
  display: string | null;
  floatReference: PageFloats.FloatReference;
  floatSide: string | null;
  clearSide: string | null;
  floatMinWrapBlock: Css.Numeric | null;
  columnSpan: Css.Val | null;
  captionSide: string;
  inlineBorderSpacing: number;
  blockBorderSpacing: number;
  flexContainer: boolean;
  whitespace: Vtree.Whitespace;
  hyphenateCharacter: string | null;
  breakWord: boolean;
  establishesBFC: boolean;
  containingBlockForAbsolute: boolean;
  breakBefore: string | null;
  breakAfter: string | null;
  viewNode: Element | Text | null;
  clearSpacer: Element | null;
  inheritedProps: { [key: string]: number | string | Css.Val | undefined };
  vertical: boolean;
  direction: string;
  firstPseudo: Vtree.FirstPseudo | null;
  lang: string | null;
  preprocessedTextContent: Diff.Change[] | null;
  formattingContext: Vtree.FormattingContext;
  repeatOnBreak: string | null;
  pluginProps: {
    [key: string]: string | number | undefined | null | (number | null)[];
  };
  fragmentIndex: number;
  afterIfContinues: Selectors.AfterIfContinues | null;
  footnotePolicy: Css.Ident | null;
  pageType: string | null;

  sourceNode: Node;
  parent: LegacyNodeContext | null;
  blockContainer: LegacyElementNodeContext | null;
  boxOffset: number;

  resetView(): void;
  modify(): this;
  copy(): this;
  clone(): this;
  toNodePositionStep(): Vtree.NodePositionStep;
  toNodePosition(): Vtree.NodePosition;
  isInsideBFC(): boolean;
  getContainingBlockForAbsolute(): LegacyElementNodeContext | null;
  belongsTo(formattingContext: Vtree.FormattingContext): boolean;
}

/**
 * @deprecated Use `Vtree.ChildNodeContext`.
 */
export interface LegacyChildNodeContext extends LegacyNodeContext {
  parent: LegacyNodeContext;
}

/**
 * @deprecated Use `Vtree.RootNodeContext`.
 */
export interface LegacyRootNodeContext extends LegacyNodeContext {
  parent: null;
  shadowSibling: null;
}

/**
 * @deprecated Use `Vtree.TextNodeContext`.
 */
export interface LegacyTextNodeContext extends LegacyChildNodeContext {
  viewNode: Text;
}

/**
 * @deprecated Use `Vtree.ElementNodeContext`.
 */
export interface LegacyElementNodeContext extends LegacyNodeContext {
  viewNode: Element;
}

/**
 * @deprecated Use `Vtree.RenderedNodeContext`.
 */
export type LegacyRenderedNodeContext =
  LegacyElementNodeContext | LegacyTextNodeContext;

/**
 * @deprecated Use `Vtree.ContainedElementNodeContext`.
 */
export interface LegacyContainedElementNodeContext extends LegacyElementNodeContext {
  blockContainer: LegacyElementNodeContext;
}

/**
 * @deprecated Use `Vtree.FloatNodeContext`.
 */
export interface LegacyFloatNodeContext extends LegacyElementNodeContext {
  floatSide: string;
}

/**
 * @deprecated Use `Vtree.ClearNodeContext`.
 */
export interface LegacyClearNodeContext extends LegacyElementNodeContext {
  clearSide: string;
}

/**
 * @deprecated Use `Vtree.AfterIfContinuesNodeContext`.
 */
export interface LegacyAfterIfContinuesNodeContext extends LegacyElementNodeContext {
  afterIfContinues: Selectors.AfterIfContinues;
}

/**
 * @deprecated True when the named hook carries registrations the core did not
 * make. The legacy view is built only then.
 */
export function legacySurfaceActive(hook: string): boolean {
  return Plugin.getHooksForName(hook).some((fn) => !Plugin.isCoreHook(fn));
}

const retained = new WeakSet<Vtree.NodeContext>();

function markRetained(nodeContext: Vtree.NodeContext): void {
  for (let nc: Vtree.NodeContext | null = nodeContext; nc; nc = nc.parent) {
    if (retained.has(nc)) {
      return;
    }
    retained.add(nc);
  }
}

/**
 * @deprecated Record, for the plugin boundary alone, that the core keeps this
 * position, which is what `NodeContext.copy()` marked on the value and its
 * ancestors. It states nothing in the type world: the core keeps its own
 * bindings and this call yields no value.
 */
export function noteRetained(nodeContext: Vtree.NodeContext): void {
  markRetained(nodeContext);
}

function coreOf(nodeContext: unknown): Vtree.NodeContext {
  // Runtime fact outside the type system: the legacy view is the core's own
  // node context value, handed out under a flat mutable declaration.
  return nodeContext as Vtree.NodeContext;
}

function legacyViewOf(nodeContext: Vtree.NodeContext): LegacyNodeContext {
  // Same value, opposite direction: see coreOf.
  return nodeContext as unknown as LegacyNodeContext;
}

function legacyElementViewOf(
  nodeContext: Vtree.ElementNodeContext,
): LegacyElementNodeContext {
  // Same value as coreOf; the element variant carries a non-null Element view.
  return nodeContext as unknown as LegacyElementNodeContext;
}

function setLegacyKind(
  nodeContext: LegacyNodeContext,
  kind: Vtree.NodeContextKind,
): void {
  // resetView clears the fields the discriminant classifies, so the core value
  // would otherwise be left tagged as a variant it no longer satisfies.
  (nodeContext as unknown as { kind: Vtree.NodeContextKind }).kind = kind;
}

function cloneCoreItem<T extends Vtree.NodeContext>(nodeContext: T): T {
  const parent = nodeContext.parent;
  return {
    ...nodeContext,
    lang: null,
    direction: parent ? parent.direction : "ltr",
    inheritedProps: parent ? parent.inheritedProps : {},
    pluginProps: { ...nodeContext.pluginProps },
  };
}

class LegacyNodeContextMethods {
  get shared(): boolean {
    return retained.has(coreOf(this));
  }

  set shared(value: boolean) {
    const core = coreOf(this);
    if (value) {
      retained.add(core);
    } else {
      retained.delete(core);
    }
  }

  resetView(this: LegacyNodeContext): void {
    this.inline = true;
    this.breakPenalty = this.parent ? this.parent.breakPenalty : 0;
    this.viewNode = null;
    this.clearSpacer = null;
    this.offsetInNode = 0;
    this.after = false;
    this.display = null;
    this.floatReference = PageFloats.FloatReference.INLINE;
    this.floatSide = null;
    this.clearSide = null;
    this.floatMinWrapBlock = null;
    this.columnSpan = null;
    this.flexContainer = false;
    this.whitespace = this.parent
      ? this.parent.whitespace
      : Vtree.Whitespace.IGNORE;
    this.hyphenateCharacter = this.parent
      ? this.parent.hyphenateCharacter
      : null;
    this.breakWord = this.parent ? this.parent.breakWord : false;
    this.breakBefore = null;
    this.breakAfter = null;
    this.nodeShadow = null;
    this.establishesBFC = false;
    this.containingBlockForAbsolute = false;
    this.vertical = this.parent ? this.parent.vertical : false;
    this.preprocessedTextContent = null;
    if (this.parent) {
      this.formattingContext = this.parent.formattingContext;
    }
    this.repeatOnBreak = null;
    this.pluginProps = {};
    this.fragmentIndex = 1;
    this.afterIfContinues = null;
    this.footnotePolicy = null;
    this.pageType = this.parent ? this.parent.pageType : null;
    setLegacyKind(this, "open");
  }

  modify(this: LegacyNodeContext): LegacyNodeContext {
    const core = coreOf(this);
    return retained.has(core) ? decorated(cloneCoreItem(core)) : this;
  }

  copy(this: LegacyNodeContext): LegacyNodeContext {
    markRetained(coreOf(this));
    return this;
  }

  clone(this: LegacyNodeContext): LegacyNodeContext {
    const chain = NodeContext.positionChainOf(coreOf(this));
    for (let nc: Vtree.NodeContext | null = chain; nc; nc = nc.parent) {
      const writable = nc as unknown as { pluginProps: Vtree.PluginProps };
      writable.pluginProps = { ...nc.pluginProps };
    }
    return decorated(chain);
  }

  toNodePositionStep(this: LegacyNodeContext): Vtree.NodePositionStep {
    return NodeContext.toNodePositionStep(coreOf(this));
  }

  toNodePosition(this: LegacyNodeContext): Vtree.NodePosition {
    return NodeContext.toNodePosition(coreOf(this));
  }

  isInsideBFC(this: LegacyNodeContext): boolean {
    return NodeContext.isInsideBFC(coreOf(this));
  }

  getContainingBlockForAbsolute(
    this: LegacyNodeContext,
  ): LegacyElementNodeContext | null {
    const container = NodeContext.containingBlockForAbsoluteOf(coreOf(this));
    if (!container) {
      return null;
    }
    decorate(container);
    return legacyElementViewOf(container);
  }

  belongsTo(
    this: LegacyNodeContext,
    formattingContext: Vtree.FormattingContext,
  ): boolean {
    return NodeContext.belongsTo(coreOf(this), formattingContext);
  }
}

const legacyPrototype = LegacyNodeContextMethods.prototype;

function isDecorated(nodeContext: Vtree.NodeContext): boolean {
  return Object.getPrototypeOf(nodeContext) === legacyPrototype;
}

function decorate(nodeContext: Vtree.NodeContext): void {
  for (let nc: Vtree.NodeContext | null = nodeContext; nc; nc = nc.parent) {
    reportSuppressedBreaks(nc);
    if (!isDecorated(nc)) {
      // The core builds node contexts as plain object literals, so the legacy
      // prototype cannot shadow any own field of the value.
      Object.setPrototypeOf(nc, legacyPrototype);
    }
    if (nc.shadowSibling) {
      reportSuppressedBreaks(nc.shadowSibling);
      if (!isDecorated(nc.shadowSibling)) {
        decorate(nc.shadowSibling);
      }
    }
    if (nc.blockContainer && !isDecorated(nc.blockContainer)) {
      decorate(nc.blockContainer);
    }
  }
}

function reportSuppressedBreaks(nodeContext: Vtree.NodeContext): void {
  // Suppression used to null the field itself; the core now composes it with
  // the registry, so writing the composed value back is a no-op for the core
  // and restores what a plugin used to read.
  const writable = nodeContext as unknown as {
    breakBefore: string | null;
    breakAfter: string | null;
  };
  writable.breakBefore = Break.reportEffectiveBreakBefore(nodeContext);
  writable.breakAfter = Break.reportEffectiveBreakAfter(nodeContext);
}

let renderFields: readonly string[] | null = null;

function renderFieldsOf(): readonly string[] {
  if (!renderFields) {
    renderFields = Object.keys(
      NodeContext.elementRenderResultOf({} as unknown as Vtree.NodeContext),
    );
  }
  return renderFields;
}

const CONTEXT_FIELDS: readonly string[] = [
  "offsetInNode",
  "after",
  "shadowType",
  "shadowContext",
  "shadowSibling",
  "overflow",
  "viewNode",
  "clearSpacer",
  "preprocessedTextContent",
  "pluginProps",
  "fragmentIndex",
  "sourceNode",
  "parent",
  "blockContainer",
  "boxOffset",
];

type RenderFields = { [field: string]: unknown };

export type LegacyContextWrites = { readonly [field: string]: unknown };

const retainedWrites = new WeakSet<LegacyContextWrites>();

/**
 * @deprecated Hand out a node context whose rendered style is the draft the
 * core has built so far, which is what the value carried when it was mutated
 * in place. Falls back to the value the core hands today while no external
 * hook is registered.
 */
export function asLegacyRenderContext(
  hook: string,
  nodeContext: Vtree.NodeContext,
  progress: Vtree.NodeContext,
  rendered: NodeContext.ElementRenderDraft,
): LegacyNodeContext {
  if (!legacySurfaceActive(hook)) {
    return legacyViewOf(progress);
  }
  // Runtime fact outside the type system: the draft holds the rendered style
  // of this very position, so overlaying it cannot contradict the variant.
  const overlaid = {
    ...progress,
    ...rendered,
  } as unknown as Vtree.NodeContext;
  if (retained.has(nodeContext)) {
    retained.add(overlaid);
  }
  return decorated(overlaid);
}

export function captureRenderFields(
  hook: string,
  nodeContext: LegacyNodeContext,
): RenderFields | null {
  if (!legacySurfaceActive(hook)) {
    return null;
  }
  const source = nodeContext as unknown as RenderFields;
  const snapshot: RenderFields = {};
  for (const field of renderFieldsOf()) {
    snapshot[field] = source[field];
  }
  for (const field of CONTEXT_FIELDS) {
    snapshot[field] = source[field];
  }
  return snapshot;
}

export function applyLegacyRenderWrites(
  hooks: readonly ((...p1) => any)[],
  before: RenderFields | null,
  nodeContext: LegacyNodeContext,
  rendered: NodeContext.ElementRenderDraft,
): LegacyContextWrites {
  if (!before) {
    return {};
  }
  const adapts = hooks.some((hook) => !Plugin.isCoreHook(hook));
  const source = nodeContext as unknown as RenderFields;
  const draft = rendered as unknown as RenderFields;
  for (const field of renderFieldsOf()) {
    if (source[field] !== before[field]) {
      const written = source[field];
      draft[field] =
        field === "formattingContext" && written && adapts
          ? adaptFormattingContext(written as Vtree.FormattingContext)
          : written;
    }
  }
  const written: RenderFields = {};
  for (const field of CONTEXT_FIELDS) {
    if (source[field] !== before[field]) {
      written[field] = source[field];
    }
  }
  if (retained.has(coreOf(nodeContext))) {
    retainedWrites.add(written);
  }
  return written;
}

export function withLegacyContextWrites<T extends Vtree.NodeContext>(
  nodeContext: T,
  writes: LegacyContextWrites,
): T {
  const claimed = retainedWrites.has(writes);
  if (Object.keys(writes).length === 0) {
    if (claimed) {
      retained.add(nodeContext);
    }
    return nodeContext;
  }
  const composed = { ...nodeContext, ...writes } as unknown as T;
  if (claimed) {
    retained.add(composed);
  }
  if ("after" in writes || "viewNode" in writes) {
    normalizeLegacyNodeContext(legacyViewOf(composed));
  }
  return composed;
}

function applyRenderedNodeContext(
  nodeContext: Vtree.NodeContext,
  rendered: Vtree.NodeContext,
): void {
  if (rendered !== nodeContext) {
    const target = nodeContext as unknown as RenderFields;
    const source = rendered as unknown as RenderFields;
    for (const field of renderFieldsOf()) {
      target[field] = source[field];
    }
    for (const field of CONTEXT_FIELDS) {
      target[field] = source[field];
    }
  }
  normalizeLegacyNodeContext(decorated(nodeContext));
}

function decorated(nodeContext: Vtree.NodeContext): LegacyNodeContext {
  decorate(nodeContext);
  return legacyViewOf(nodeContext);
}

function decoratedAs<T>(nodeContext: Vtree.NodeContext): T {
  decorate(nodeContext);
  return nodeContext as unknown as T;
}

function decoratedOrNull<T>(nodeContext: Vtree.NodeContext | null): T | null {
  return nodeContext === null ? null : decoratedAs<T>(nodeContext);
}

function retaggedOrNull<T>(nodeContext: Vtree.NodeContext | null): T | null {
  const legacy = decoratedOrNull<LegacyNodeContext>(nodeContext);
  if (legacy) {
    retagLegacyValue(legacy);
    handedOut.add(nodeContext);
  }
  return legacy as T | null;
}

/**
 * @deprecated Hand a node context to an external hook under the legacy
 * declaration. The value itself is returned so that plugin writes reach the
 * core, as they did when node contexts were mutable class instances.
 */
export function asLegacyNodeContext(
  hook: string,
  nodeContext: Vtree.NodeContext,
): LegacyNodeContext {
  if (legacySurfaceActive(hook)) {
    decorate(nodeContext);
  }
  return legacyViewOf(nodeContext);
}

/**
 * @deprecated `asLegacyNodeContext` for hook payloads that admit null.
 */
export function asLegacyNodeContextOrNull(
  hook: string,
  nodeContext: Vtree.NodeContext | null,
): LegacyNodeContext | null {
  return nodeContext === null ? null : asLegacyNodeContext(hook, nodeContext);
}

/**
 * @deprecated Base-compatible layout context contract. `setCurrent` reported
 * only whether children should be processed, and the caller kept using the
 * node context it had passed in.
 */
export type LegacyLayoutContext = Omit<
  Vtree.LayoutContext,
  | "setCurrent"
  | "clone"
  | "nextInTree"
  | "peelOff"
  | "applyPseudoelementStyle"
  | "processFragmentedBlockEdge"
> & {
  applyPseudoelementStyle(
    nodeContext: LegacyNodeContext,
    pseudoName: string,
    target: Element,
  ): void;
  processFragmentedBlockEdge(nodeContext: LegacyNodeContext);
  setCurrent(
    nodeContext: LegacyNodeContext,
    firstTime: boolean,
    atUnforcedBreak?: boolean,
  ): Task.Result<boolean>;
  clone(): LegacyLayoutContext;
  nextInTree(
    nodeContext: LegacyNodeContext,
    atUnforcedBreak?: boolean,
  ): Task.Result<LegacyNodeContext | null>;
  peelOff(
    nodeContext: LegacyChildNodeContext,
    nodeOffset: number,
  ): Task.Result<LegacyNodeContext>;
};

export interface LegacyFragmentLayoutConstraint {
  flagmentLayoutConstraintType: FragmentLayoutConstraintType;
  allowLayout(
    nodeContext: LegacyNodeContext | null,
    overflownNodeContext: LegacyNodeContext | null,
    column: LegacyColumn,
  ): boolean;
  nextCandidate(nodeContext: LegacyNodeContext | null): boolean;
  postLayout(
    allowed: boolean,
    positionAfter: LegacyNodeContext | null,
    initialPosition: LegacyNodeContext | null,
    column: LegacyColumn,
  );
  finishBreak(
    nodeContext: LegacyNodeContext | null,
    column: LegacyColumn,
  ): Task.Result<boolean>;
  equalsTo(constraint: LegacyFragmentLayoutConstraint): boolean;
  getPriorityOfFinishBreak(): number;
}

export interface LegacyElementsOffset {
  calculateOffset(nodeContext: LegacyNodeContext | null): number;
  calculateMinimumOffset(nodeContext: LegacyNodeContext | null): number;
}

/**
 * @deprecated Base-compatible column contract. The members whose result type
 * changed are served by a projection, so the view is not the column and an
 * assignment to such a member stays inside the view.
 */
export type LegacyColumn = Omit<
  Layout.Column,
  | "checkOverflowAndSaveEdge"
  | "applyClearance"
  | "processLineStyling"
  | "layoutContext"
  | "nodeContextOverflowingDueToRepetitiveElements"
  | "pseudoParent"
  | "asFloatNodeContext"
  | "openAllViews"
  | "maybePeelOff"
  | "buildViewToNextBlockEdge"
  | "nextInTree"
  | "buildDeepElementView"
  | "layoutUnbreakable"
  | "layoutFloat"
  | "setFloatAnchorViewNode"
  | "layoutPageFloat"
  | "layoutBreakableBlock"
  | "findEndOfLine"
  | "findAcceptableBreakInside"
  | "findBoxBreakPosition"
  | "findFirstOverflowingEdgeAndCheckPoint"
  | "findEdgeBreakPosition"
  | "findAcceptableBreakPosition"
  | "doFinishBreak"
  | "skipEdges"
  | "skipTailEdges"
  | "layoutFloatOrFootnote"
  | "layoutNext"
  | "doLayout"
  | "stopByOverflow"
  | "calculateEdge"
  | "resolveFloatReferenceFromColumnSpan"
  | "isLoneImage"
  | "getTrailingMarginEdgeAdjustment"
  | "postLayoutBlock"
  | "resolveTextNodeBreaker"
  | "findLinePositions"
  | "calculateClonedPaddingBorder"
  | "getAfterEdgeOfBlockContainer"
  | "finishBreak"
  | "isBreakable"
  | "checkOverflowAndSaveEdgeAndBreakPosition"
  | "clearOverflownViewNodes"
  | "saveEdgeBreakPosition"
  | "saveBoxBreakPosition"
  | "doFinishBreakOfFragmentLayoutConstraints"
  | "breakPositions"
  | "fragmentLayoutConstraints"
  | "collectElementsOffset"
> & {
  breakPositions: LegacyBreakPosition[];
  fragmentLayoutConstraints: LegacyFragmentLayoutConstraint[];
  collectElementsOffset(): LegacyElementsOffset[];
  stopByOverflow(nodeContext: LegacyNodeContext): boolean;
  calculateEdge(
    nodeContext: LegacyNodeContext | null,
    checkPoints: LegacyRenderedNodeContext[],
    index: number,
    boxOffset: number,
  ): number;
  resolveFloatReferenceFromColumnSpan(
    floatReference: PageFloats.FloatReference,
    columnSpan: Css.Val | null,
    nodeContext: LegacyNodeContext,
  ): Task.Result<PageFloats.FloatReference>;
  isLoneImage(checkPoints: LegacyRenderedNodeContext[]): boolean;
  getTrailingMarginEdgeAdjustment(
    trailingEdgeContexts: LegacyNodeContext[],
  ): number;
  postLayoutBlock(
    nodeContext: LegacyNodeContext | null,
    checkPoints: LegacyRenderedNodeContext[],
  ): void;
  resolveTextNodeBreaker(nodeContext: LegacyNodeContext): LegacyTextNodeBreaker;
  findLinePositions(checkPoints: LegacyRenderedNodeContext[]): number[];
  calculateClonedPaddingBorder(nodeContext: LegacyNodeContext): number;
  getAfterEdgeOfBlockContainer(nodeContext: LegacyNodeContext): number;
  finishBreak(
    nodeContext: LegacyNodeContext,
    forceRemoveSelf: boolean,
    endOfColumn: boolean,
  ): Task.Result<boolean>;
  isBreakable(flowPosition: LegacyNodeContext): boolean;
  checkOverflowAndSaveEdgeAndBreakPosition(
    nodeContext: LegacyNodeContext | null,
    trailingEdgeContexts: LegacyNodeContext[] | null,
    saveEvenOverflown: boolean,
    breakAtTheEdge: string | null,
  ): boolean;
  clearOverflownViewNodes(
    nodeContext: LegacyNodeContext | null,
    removeSelf: boolean,
  ): void;
  saveEdgeBreakPosition(
    position: LegacyNodeContext,
    breakAtEdge: string | null,
    overflows: boolean,
  ): void;
  saveBoxBreakPosition(checkPoints: LegacyRenderedNodeContext[]): void;
  doFinishBreakOfFragmentLayoutConstraints(
    nodeContext: LegacyNodeContext,
  ): Task.Result<boolean>;
  checkOverflowAndSaveEdge(
    nodeContext: LegacyNodeContext | null,
    trailingEdgeContexts: LegacyNodeContext[] | null,
  ): boolean;
  applyClearance(nodeContext: LegacyRenderedNodeContext): boolean;
  processLineStyling(
    nodeContext: LegacyNodeContext,
    resNodeContext: LegacyNodeContext | null,
    checkPoints: LegacyRenderedNodeContext[],
  ): Task.Result<LegacyNodeContext | null>;
  layoutContext: LegacyLayoutContext;
  nodeContextOverflowingDueToRepetitiveElements: LegacyNodeContext | null;
  pseudoParent: LegacyColumn | null;
  asFloatNodeContext(
    nodeContext: LegacyNodeContext,
  ): LegacyFloatNodeContext | null;
  openAllViews(position: Vtree.NodePosition): Task.Result<LegacyNodeContext>;
  maybePeelOff(
    position: LegacyNodeContext,
    count: number,
  ): Task.Result<LegacyNodeContext>;
  buildViewToNextBlockEdge(
    position: LegacyNodeContext | null,
    checkPoints: LegacyRenderedNodeContext[],
  ): Task.Result<LegacyNodeContext | null>;
  nextInTree(
    position: LegacyNodeContext,
    atUnforcedBreak?: boolean,
  ): Task.Result<LegacyNodeContext | null>;
  buildDeepElementView(
    position: LegacyNodeContext | null,
  ): Task.Result<LegacyNodeContext | null>;
  layoutUnbreakable(
    nodeContextIn: LegacyNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  layoutFloat(
    nodeContext: LegacyRenderedNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  setFloatAnchorViewNode(
    nodeContext: LegacyRenderedNodeContext,
  ): LegacyRenderedNodeContext;
  layoutPageFloat(
    nodeContext: LegacyFloatNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  layoutBreakableBlock(
    nodeContext: LegacyNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  findEndOfLine(
    linePosition: number,
    checkPoints: LegacyRenderedNodeContext[],
    isUpdateMaxReachedAfterEdge: boolean,
  ): {
    nodeContext: LegacyRenderedNodeContext;
    index: number;
    checkPointIndex: number;
  };
  findAcceptableBreakInside(
    checkPoints: LegacyRenderedNodeContext[],
    edgePosition: number,
    force: boolean,
  ): LegacyNodeContext | null;
  findBoxBreakPosition(
    bp: Layout.BoxBreakPosition,
    force: boolean,
  ): LegacyNodeContext | null;
  findFirstOverflowingEdgeAndCheckPoint(
    checkPoints: LegacyRenderedNodeContext[],
  ): {
    edge: number;
    checkPoint: LegacyRenderedNodeContext | null;
  };
  findEdgeBreakPosition(bp: Layout.EdgeBreakPosition): LegacyNodeContext;
  findAcceptableBreakPosition(): {
    breakPosition: LegacyBreakPosition;
    nodeContext: LegacyNodeContext;
  } | null;
  doFinishBreak(
    nodeContext: LegacyNodeContext | null,
    overflownNodeContext: LegacyNodeContext | null,
    initialNodeContext: LegacyNodeContext | null,
    initialComputedBlockSize: number,
  ): Task.Result<LegacyNodeContext | null>;
  skipEdges(
    nodeContext: LegacyNodeContext,
    leadingEdge: boolean,
    forcedBreakValue: string | null,
  ): Task.Result<LegacyNodeContext | null>;
  skipTailEdges(
    nodeContext: LegacyNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  layoutFloatOrFootnote(
    nodeContext: LegacyFloatNodeContext,
  ): Task.Result<LegacyNodeContext | null>;
  layoutNext(
    nodeContext: LegacyNodeContext,
    leadingEdge: boolean,
    forcedBreakValue?: string | null,
  ): Task.Result<LegacyNodeContext>;
  doLayout(
    nodeContext: LegacyNodeContext | null,
    leadingEdge: boolean,
    breakAfter?: string | null,
  ): Task.Result<{
    nodeContext: LegacyNodeContext | null;
    overflownNodeContext: LegacyNodeContext | null;
  }>;
};

type LegacyProjections = { [name: string]: () => unknown };

function projectionsOf(members: LegacyProjections): LegacyProjections {
  return Object.assign(Object.create(null) as LegacyProjections, members);
}

type LegacyMember = (...args: unknown[]) => unknown;

function retagLegacyArgument(value: unknown): void {
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === legacyPrototype
  ) {
    retagLegacyValue(value as unknown as LegacyNodeContext);
  }
}

function retagLegacyArguments(args: unknown[]): void {
  for (const arg of args) {
    retagLegacyArgument(arg);
    if (Array.isArray(arg)) {
      for (const item of arg) {
        retagLegacyArgument(item);
      }
    }
  }
}

function retaggingLegacyArguments(member: LegacyMember): LegacyMember {
  return function (this: unknown, ...args: unknown[]): unknown {
    retagLegacyArguments(args);
    return member.apply(this, args);
  };
}

function retaggingMemberOf(member: unknown): unknown {
  return typeof member === "function"
    ? retaggingLegacyArguments(member as LegacyMember)
    : member;
}

function projectedMemberOf(
  target: object,
  bound: Map<string | symbol, unknown>,
  overrides: Map<string | symbol, unknown>,
  projections: LegacyProjections,
  fields: LegacyProjections,
  property: string | symbol,
): unknown {
  if (overrides.has(property)) {
    return overrides.get(property);
  }
  const projection =
    typeof property === "string" ? projections[property] : undefined;
  if (projection) {
    return retaggingMemberOf(projection());
  }
  const field = typeof property === "string" ? fields[property] : undefined;
  if (field) {
    return field();
  }
  const cached = bound.get(property);
  if (cached !== undefined) {
    return cached;
  }
  const member = Reflect.get(target, property, target);
  if (typeof member !== "function") {
    return member;
  }
  // The view must not become the receiver of core methods: a core method that
  // reaches another one through `this` would otherwise read the projection.
  const boundMember = retaggingLegacyArguments(member.bind(target));
  bound.set(property, boundMember);
  return boundMember;
}

function legacyViewOfObject<T extends object>(
  target: T,
  members: LegacyProjections,
  decoratedFields?: LegacyProjections,
): object {
  const projections = projectionsOf(members);
  const fields = projectionsOf(decoratedFields ?? {});
  const bound = new Map<string | symbol, unknown>();
  const overrides = new Map<string | symbol, unknown>();
  return new Proxy(target, {
    get: (t, property) =>
      projectedMemberOf(t, bound, overrides, projections, fields, property),
    set: (t, property, value) => {
      bound.delete(property);
      if (typeof property === "string" && projections[property]) {
        overrides.set(property, value);
        return true;
      }
      return Reflect.set(t, property, value, t);
    },
  });
}

const legacyLayoutContexts = new WeakMap<
  Vtree.LayoutContext,
  LegacyLayoutContext
>();

/**
 * @deprecated Serve a layout context under the base contract. The members whose
 * result type changed are served by a projection, so the view is not the layout
 * context and an assignment to such a member stays inside the view.
 */
export function asLegacyLayoutContext(
  layoutContext: Vtree.LayoutContext,
): LegacyLayoutContext {
  const cached = legacyLayoutContexts.get(layoutContext);
  if (cached) {
    return cached;
  }
  const projected = legacyViewOfObject(layoutContext, {
    setCurrent:
      () =>
      (
        nodeContext: Vtree.NodeContext,
        firstTime: boolean,
        atUnforcedBreak?: boolean,
      ) =>
        layoutContext
          .setCurrent(nodeContext, firstTime, atUnforcedBreak)
          .thenAsync((result) => {
            applyRenderedNodeContext(nodeContext, result.nodeContext);
            return Task.newResult(result.processChildren);
          }),
    clone: () => () => asLegacyLayoutContext(layoutContext.clone()),
    nextInTree:
      () => (nodeContext: Vtree.NodeContext, atUnforcedBreak?: boolean) =>
        layoutContext
          .nextInTree(nodeContext, atUnforcedBreak)
          .thenAsync((result) =>
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
          ),
    peelOff: () => (nodeContext: Vtree.ChildNodeContext, nodeOffset: number) =>
      layoutContext
        .peelOff(nodeContext, nodeOffset)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result)),
        ),
  });
  // Runtime fact outside the type system: the proxy answers every member of
  // the base contract, projecting the ones whose result type changed.
  const view = projected as LegacyLayoutContext;
  legacyLayoutContexts.set(layoutContext, view);
  return view;
}

const legacyColumns = new WeakMap<Layout.Column, LegacyColumn>();

const columnTargets = new WeakMap<object, Layout.Column>();

function coreColumnOf(column: LegacyColumn): Layout.Column {
  return columnTargets.get(column) ?? (column as unknown as Layout.Column);
}

const legacyBreakPositions = new WeakMap<
  Layout.BreakPosition,
  LegacyBreakPosition
>();

const coreBreakPositions = new WeakMap<
  LegacyBreakPosition,
  Layout.BreakPosition
>();

const legacyOfAdaptedBreakPositions = new WeakMap<
  Layout.BreakPosition,
  LegacyBreakPosition
>();

function legacyBreakPositionViewOf(
  breakPosition: Layout.BreakPosition,
): LegacyBreakPosition {
  const legacy = legacyOfAdaptedBreakPositions.get(breakPosition);
  if (legacy) {
    return legacy;
  }
  const cached = legacyBreakPositions.get(breakPosition);
  if (cached) {
    return cached;
  }
  const projected = legacyViewOfObject(
    breakPosition,
    {
      findAcceptableBreak: () => (column: LegacyColumn, penalty: number) =>
        decoratedOrNull<LegacyNodeContext>(
          breakPosition.findAcceptableBreak(coreColumnOf(column), penalty),
        ),
      calculateOffset: () => (column: LegacyColumn) =>
        breakPosition.calculateOffset(coreColumnOf(column)),
      breakPositionChosen: () => (column: LegacyColumn) =>
        breakPosition.breakPositionChosen(coreColumnOf(column)),
      getNodeContext: () => {
        const getNodeContext = (
          breakPosition as Partial<Layout.AbstractBreakPosition>
        ).getNodeContext;
        return getNodeContext
          ? () =>
              decoratedOrNull<LegacyNodeContext>(
                getNodeContext.call(breakPosition),
              )
          : undefined;
      },
    },
    {
      position: () =>
        retaggedOrNull<LegacyNodeContext>(
          (breakPosition as Partial<Layout.EdgeBreakPosition>).position ?? null,
        ),
      breakNodeContext: () =>
        retaggedOrNull<LegacyNodeContext>(
          (breakPosition as Partial<Layout.BoxBreakPosition>)
            .breakNodeContext ?? null,
        ),
      checkPoints: () => {
        const checkPoints = (breakPosition as Partial<Layout.BoxBreakPosition>)
          .checkPoints;
        return checkPoints === undefined
          ? undefined
          : retaggedCheckPoints(checkPoints);
      },
    },
  );
  const view = projected as LegacyBreakPosition;
  legacyBreakPositions.set(breakPosition, view);
  coreBreakPositions.set(view, breakPosition);
  return view;
}

function coreBreakPositionOf(
  breakPosition: LegacyBreakPosition,
): Layout.BreakPosition {
  return adaptLegacyBreakPosition(breakPosition);
}

const legacyTextNodeBreakers = new WeakMap<
  Layout.TextNodeBreaker,
  LegacyTextNodeBreaker
>();

const coreTextNodeBreakers = new WeakMap<
  LegacyTextNodeBreaker,
  Layout.TextNodeBreaker
>();

const legacyOfAdaptedTextNodeBreakers = new WeakMap<
  Layout.TextNodeBreaker,
  LegacyTextNodeBreaker
>();

function legacyTextNodeBreakerViewOf(
  breaker: Layout.TextNodeBreaker,
): LegacyTextNodeBreaker {
  const legacy = legacyOfAdaptedTextNodeBreakers.get(breaker);
  if (legacy) {
    return legacy;
  }
  const cached = legacyTextNodeBreakers.get(breaker);
  if (cached) {
    return cached;
  }
  const view: LegacyTextNodeBreaker = {
    breakTextNode(
      textNode: Text,
      nodeContext: LegacyNodeContext,
      low: number,
      checkPoints: LegacyRenderedNodeContext[],
      checkpointIndex: number,
      force: boolean,
    ): LegacyNodeContext {
      retagLegacyArguments([nodeContext, checkPoints]);
      return decoratedAs<LegacyNodeContext>(
        breaker.breakTextNode(
          textNode,
          coreOf(nodeContext),
          low,
          checkPoints as unknown as Vtree.RenderedNodeContext[],
          checkpointIndex,
          force,
        ),
      );
    },
    breakAfterSoftHyphen(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: LegacyNodeContext,
    ): number {
      retagLegacyArguments([nodeContext]);
      return breaker.breakAfterSoftHyphen(
        textNode,
        text,
        viewIndex,
        coreOf(nodeContext),
      );
    },
    breakAfterOtherCharacter(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: LegacyNodeContext,
    ): number {
      retagLegacyArguments([nodeContext]);
      return breaker.breakAfterOtherCharacter(
        textNode,
        text,
        viewIndex,
        coreOf(nodeContext),
      );
    },
    updateNodeContext(
      nodeContext: LegacyNodeContext,
      viewIndex: number,
      textNode: Text,
    ): LegacyNodeContext {
      retagLegacyArguments([nodeContext]);
      return decoratedAs<LegacyNodeContext>(
        breaker.updateNodeContext(coreOf(nodeContext), viewIndex, textNode),
      );
    },
  };
  legacyTextNodeBreakers.set(breaker, view);
  coreTextNodeBreakers.set(view, breaker);
  return view;
}

const legacyBreakPositionLists = new WeakMap<
  Layout.BreakPosition[],
  LegacyBreakPosition[]
>();

function arrayIndexOf(property: string | symbol): number | null {
  if (typeof property !== "string") {
    return null;
  }
  const index = Number(property);
  return Number.isInteger(index) && index >= 0 && String(index) === property
    ? index
    : null;
}

function legacyBreakPositionsViewOf(
  breakPositions: Layout.BreakPosition[],
): LegacyBreakPosition[] {
  const cached = legacyBreakPositionLists.get(breakPositions);
  if (cached) {
    return cached;
  }
  const projected = new Proxy(breakPositions, {
    get: (target, property) => {
      const index = arrayIndexOf(property);
      if (index === null) {
        return Reflect.get(target, property, target);
      }
      const breakPosition = target[index];
      return breakPosition === undefined
        ? breakPosition
        : legacyBreakPositionViewOf(breakPosition);
    },
    set: (target, property, value) => {
      const index = arrayIndexOf(property);
      if (index === null || !value) {
        return Reflect.set(target, property, value, target);
      }
      return Reflect.set(target, property, coreBreakPositionOf(value), target);
    },
  });
  const view = projected as unknown as LegacyBreakPosition[];
  legacyBreakPositionLists.set(breakPositions, view);
  return view;
}

export function asLegacyColumn(
  hook: (...p1) => any,
  column: Layout.Column,
): LegacyColumn {
  if (Plugin.isCoreHook(hook)) {
    return column as unknown as LegacyColumn;
  }
  return legacyColumnViewOf(column);
}

function legacyColumnViewOf(column: Layout.Column): LegacyColumn {
  const cached = legacyColumns.get(column);
  if (cached) {
    return cached;
  }
  const projected = legacyViewOfObject(column, {
    checkOverflowAndSaveEdge:
      () =>
      (
        nodeContext: Vtree.NodeContext | null,
        trailingEdgeContexts: Vtree.NodeContext[] | null,
      ) =>
        column.checkOverflowAndSaveEdge(nodeContext, trailingEdgeContexts)
          .overflown,
    applyClearance: () => (nodeContext: Vtree.RenderedNodeContext) => {
      const spacer = column.applyClearance(nodeContext);
      if (spacer) {
        (
          nodeContext as unknown as { clearSpacer: Element | null }
        ).clearSpacer = spacer;
      }
      return spacer !== null;
    },
    processLineStyling:
      () =>
      (
        nodeContext: Vtree.NodeContext,
        resNodeContext: Vtree.NodeContext | null,
        checkPoints: Vtree.RenderedNodeContext[],
      ) =>
        column
          .processLineStyling(nodeContext, resNodeContext, checkPoints)
          .thenAsync((result) => {
            checkPoints.splice(0, checkPoints.length, ...result.checkPoints);
            decoratedCheckPoints(checkPoints);
            return Task.newResult(
              decoratedOrNull<LegacyNodeContext>(result.nodeContext),
            );
          }),
    layoutContext: () => asLegacyLayoutContext(column.layoutContext),
    breakPositions: () => legacyBreakPositionsViewOf(column.breakPositions),
    resolveTextNodeBreaker: () => (nodeContext: Vtree.NodeContext) =>
      legacyTextNodeBreakerViewOf(column.resolveTextNodeBreaker(nodeContext)),
    nodeContextOverflowingDueToRepetitiveElements: () =>
      retaggedOrNull<LegacyNodeContext>(
        column.nodeContextOverflowingDueToRepetitiveElements,
      ),
    pseudoParent: () =>
      column.pseudoParent === null
        ? null
        : legacyColumnViewOf(column.pseudoParent),
    asFloatNodeContext: () => (nodeContext: Vtree.NodeContext) =>
      decoratedOrNull<LegacyFloatNodeContext>(
        column.asFloatNodeContext(nodeContext),
      ),
    openAllViews: () => (position: Vtree.NodePosition) =>
      column
        .openAllViews(position)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result)),
        ),
    maybePeelOff: () => (position: Vtree.NodeContext, count: number) =>
      column
        .maybePeelOff(position, count)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result)),
        ),
    buildViewToNextBlockEdge:
      () =>
      (
        position: Vtree.NodeContext | null,
        checkPoints: Vtree.RenderedNodeContext[],
      ) =>
        column
          .buildViewToNextBlockEdge(position, checkPoints)
          .thenAsync((result) => {
            decoratedCheckPoints(checkPoints);
            return Task.newResult(decoratedOrNull<LegacyNodeContext>(result));
          }),
    nextInTree:
      () => (position: Vtree.NodeContext, atUnforcedBreak?: boolean) =>
        column
          .nextInTree(position, atUnforcedBreak)
          .thenAsync((result) =>
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
          ),
    buildDeepElementView: () => (position: Vtree.NodeContext | null) =>
      column
        .buildDeepElementView(position)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    layoutUnbreakable: () => (nodeContextIn: Vtree.NodeContext) =>
      column
        .layoutUnbreakable(nodeContextIn)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    layoutFloat: () => (nodeContext: Vtree.RenderedNodeContext) =>
      column
        .layoutFloat(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    setFloatAnchorViewNode: () => (nodeContext: Vtree.RenderedNodeContext) =>
      decoratedAs<LegacyRenderedNodeContext>(
        column.setFloatAnchorViewNode(nodeContext),
      ),
    layoutPageFloat: () => (nodeContext: Vtree.FloatNodeContext) =>
      column
        .layoutPageFloat(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    layoutBreakableBlock: () => (nodeContext: Vtree.NodeContext) =>
      column
        .layoutBreakableBlock(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    findEndOfLine:
      () =>
      (
        linePosition: number,
        checkPoints: Vtree.RenderedNodeContext[],
        isUpdateMaxReachedAfterEdge: boolean,
      ) => {
        const result = column.findEndOfLine(
          linePosition,
          checkPoints,
          isUpdateMaxReachedAfterEdge,
        );
        return {
          ...result,
          nodeContext: decoratedAs<LegacyRenderedNodeContext>(
            result.nodeContext,
          ),
        };
      },
    findAcceptableBreakInside:
      () =>
      (
        checkPoints: Vtree.RenderedNodeContext[],
        edgePosition: number,
        force: boolean,
      ) =>
        decoratedOrNull<LegacyNodeContext>(
          column.findAcceptableBreakInside(checkPoints, edgePosition, force),
        ),
    findBoxBreakPosition: () => (bp: LegacyBreakPosition, force: boolean) =>
      decoratedOrNull<LegacyNodeContext>(
        column.findBoxBreakPosition(
          coreBreakPositionOf(bp) as Layout.BoxBreakPosition,
          force,
        ),
      ),
    findFirstOverflowingEdgeAndCheckPoint:
      () => (checkPoints: Vtree.RenderedNodeContext[]) => {
        const result =
          column.findFirstOverflowingEdgeAndCheckPoint(checkPoints);
        return {
          ...result,
          checkPoint: decoratedOrNull<LegacyRenderedNodeContext>(
            result.checkPoint,
          ),
        };
      },
    findEdgeBreakPosition: () => (bp: LegacyBreakPosition) =>
      decoratedAs<LegacyNodeContext>(
        column.findEdgeBreakPosition(
          coreBreakPositionOf(bp) as Layout.EdgeBreakPosition,
        ),
      ),
    findAcceptableBreakPosition: () => () => {
      const result = column.findAcceptableBreakPosition();
      return result === null
        ? null
        : {
            breakPosition: legacyBreakPositionViewOf(result.breakPosition),
            nodeContext: decoratedAs<LegacyNodeContext>(result.nodeContext),
          };
    },
    doFinishBreak:
      () =>
      (
        nodeContext: Vtree.NodeContext | null,
        overflownNodeContext: Vtree.NodeContext | null,
        initialNodeContext: Vtree.NodeContext | null,
        initialComputedBlockSize: number,
      ) =>
        column
          .doFinishBreak(
            nodeContext,
            overflownNodeContext,
            initialNodeContext,
            initialComputedBlockSize,
          )
          .thenAsync((result) =>
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
          ),
    skipEdges:
      () =>
      (
        nodeContext: Vtree.NodeContext,
        leadingEdge: boolean,
        forcedBreakValue: string | null,
      ) =>
        column
          .skipEdges(nodeContext, leadingEdge, forcedBreakValue)
          .thenAsync((result) =>
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
          ),
    skipTailEdges: () => (nodeContext: Vtree.NodeContext) =>
      column
        .skipTailEdges(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    layoutFloatOrFootnote: () => (nodeContext: Vtree.FloatNodeContext) =>
      column
        .layoutFloatOrFootnote(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result)),
        ),
    layoutNext:
      () =>
      (
        nodeContext: Vtree.NodeContext,
        leadingEdge: boolean,
        forcedBreakValue?: string | null,
      ) =>
        column
          .layoutNext(nodeContext, leadingEdge, forcedBreakValue)
          .thenAsync((result) =>
            Task.newResult(decoratedAs<LegacyNodeContext>(result)),
          ),
    doLayout:
      () =>
      (
        nodeContext: Vtree.NodeContext | null,
        leadingEdge: boolean,
        breakAfter?: string | null,
      ) =>
        column
          .doLayout(nodeContext, leadingEdge, breakAfter)
          .thenAsync((result) =>
            Task.newResult({
              nodeContext: decoratedOrNull<LegacyNodeContext>(
                result.nodeContext,
              ),
              overflownNodeContext: decoratedOrNull<LegacyNodeContext>(
                result.overflownNodeContext,
              ),
            }),
          ),
  });
  // Runtime fact outside the type system: see asLegacyLayoutContext.
  const view = projected as LegacyColumn;
  legacyColumns.set(column, view);
  columnTargets.set(view, column);
  return view;
}

/**
 * @deprecated Base-compatible text node breaker contract. Implementations are
 * handed to the core through `adaptLegacyTextNodeBreaker`.
 */
export interface LegacyTextNodeBreaker {
  breakTextNode(
    textNode: Text,
    nodeContext: LegacyNodeContext,
    low: number,
    checkPoints: LegacyRenderedNodeContext[],
    checkpointIndex: number,
    force: boolean,
  ): LegacyNodeContext;
  breakAfterSoftHyphen(
    textNode: Text,
    text: string,
    viewIndex: number,
    nodeContext: LegacyNodeContext,
  ): number;
  breakAfterOtherCharacter(
    textNode: Text,
    text: string,
    viewIndex: number,
    nodeContext: LegacyNodeContext,
  ): number;
  updateNodeContext(
    nodeContext: LegacyNodeContext,
    viewIndex: number,
    textNode: Text,
  ): LegacyNodeContext;
}

export interface LegacyBreakPosition {
  findAcceptableBreak(
    column: LegacyColumn,
    penalty: number,
  ): LegacyNodeContext | null;
  getMinBreakPenalty(): number;
  calculateOffset(column: LegacyColumn): { current: number; minimum: number };
  breakPositionChosen(column: LegacyColumn): void;
  getNodeContext?(): LegacyNodeContext | null;
  position?: LegacyNodeContext;
  breakNodeContext?: LegacyNodeContext | null;
  checkPoints?: LegacyRenderedNodeContext[];
}

export interface LegacyFormattingContext extends Omit<
  Vtree.FormattingContext,
  "isFirstTime" | "getParent"
> {
  isFirstTime(nodeContext: LegacyNodeContext, firstTime: boolean): boolean;
  getParent(): LegacyFormattingContext | null;
}

export interface LegacyLayoutProcessor {
  layout(
    nodeContext: LegacyNodeContext,
    column: LegacyColumn,
    leadingEdge: boolean,
  ): Task.Result<LegacyNodeContext | null>;
  createEdgeBreakPosition(
    position: LegacyNodeContext,
    breakOnEdge: string | null,
    overflows: boolean,
    columnBlockSize: number,
  ): LegacyBreakPosition;
  startNonInlineElementNode(nodeContext: LegacyNodeContext): boolean;
  afterNonInlineElementNode(
    nodeContext: LegacyNodeContext,
    stopAtOverflow: boolean,
  ): boolean;
  finishBreak(
    column: LegacyColumn,
    nodeContext: LegacyNodeContext,
    forceRemoveSelf: boolean,
    endOfColumn: boolean,
  ): Task.Result<boolean>;
  clearOverflownViewNodes(
    column: LegacyColumn,
    parentNodeContext: LegacyNodeContext | null,
    nodeContext: LegacyNodeContext,
    removeSelf: boolean,
  );
}

function kindOfLegacy(nodeContext: LegacyNodeContext): Vtree.NodeContextKind {
  const viewNode = nodeContext.viewNode;
  if (viewNode === null) {
    return nodeContext.after ? "after-none" : "open";
  }
  if (viewNode.nodeType === 1) {
    return nodeContext.after ? "after-element" : "element";
  }
  return nodeContext.after ? "after-text" : "text";
}

function retagLegacyValue(nodeContext: LegacyNodeContext): void {
  setLegacyKind(nodeContext, kindOfLegacy(nodeContext));
}

const handedOut = new Set<Vtree.NodeContext>();

function retagHandedOut(): void {
  if (handedOut.size === 0) {
    return;
  }
  const served = [...handedOut];
  handedOut.clear();
  for (const nodeContext of served) {
    retagLegacyValue(legacyViewOf(nodeContext));
  }
}

/**
 * @deprecated Give a value coming back from a legacy implementation the
 * discriminant its own fields imply, and hand it to the core as itself.
 */
export function normalizeLegacyNodeContext(
  nodeContext: LegacyNodeContext | null | undefined,
): Vtree.NodeContext | null {
  retagHandedOut();
  if (!nodeContext) {
    return null;
  }
  retagLegacyValue(nodeContext);
  return coreOf(nodeContext);
}

export function retagLegacyNodeContext(
  hook: string,
  nodeContext: Vtree.NodeContext | null,
): void {
  retagHandedOut();
  if (nodeContext && legacySurfaceActive(hook)) {
    retagLegacyValue(legacyViewOf(nodeContext));
  }
}

export function retagLegacyNodeContexts(
  hook: string,
  checkPoints: Vtree.RenderedNodeContext[],
): void {
  retagHandedOut();
  if (!legacySurfaceActive(hook)) {
    return;
  }
  for (const checkPoint of checkPoints) {
    retagLegacyValue(legacyViewOf(checkPoint));
  }
}

const adaptedTextNodeBreakers = new WeakMap<
  LegacyTextNodeBreaker,
  Layout.TextNodeBreaker
>();

/**
 * @deprecated Serve a legacy text node breaker under the current contract.
 */
export function adaptLegacyTextNodeBreaker(
  hook: (...p1) => any,
  legacy: LegacyTextNodeBreaker,
): Layout.TextNodeBreaker {
  if (Plugin.isCoreHook(hook)) {
    return legacy as unknown as Layout.TextNodeBreaker;
  }
  const core = coreTextNodeBreakers.get(legacy);
  if (core) {
    return core;
  }
  const cached = adaptedTextNodeBreakers.get(legacy);
  if (cached) {
    return cached;
  }
  const adapted: Layout.TextNodeBreaker = {
    breakTextNode(
      textNode: Text,
      nodeContext: Vtree.NodeContext,
      low: number,
      checkPoints: Vtree.RenderedNodeContext[],
      checkpointIndex: number,
      force: boolean,
    ): Vtree.NodeContext {
      const legacyNodeContext = decorated(nodeContext);
      const legacyCheckPoints = decoratedCheckPoints(checkPoints);
      const broken = legacy.breakTextNode(
        textNode,
        legacyNodeContext,
        low,
        legacyCheckPoints,
        checkpointIndex,
        force,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      for (const checkPoint of legacyCheckPoints) {
        normalizeLegacyNodeContext(checkPoint);
      }
      return normalizeLegacyNodeContext(broken)!;
    },
    breakAfterSoftHyphen(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: Vtree.NodeContext,
    ): number {
      const legacyNodeContext = decorated(nodeContext);
      const broken = legacy.breakAfterSoftHyphen(
        textNode,
        text,
        viewIndex,
        legacyNodeContext,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      return broken;
    },
    breakAfterOtherCharacter(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: Vtree.NodeContext,
    ): number {
      const legacyNodeContext = decorated(nodeContext);
      const broken = legacy.breakAfterOtherCharacter(
        textNode,
        text,
        viewIndex,
        legacyNodeContext,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      return broken;
    },
    updateNodeContext(
      nodeContext: Vtree.NodeContext,
      viewIndex: number,
      textNode: Text,
    ): Vtree.NodeContext {
      const legacyNodeContext = decorated(nodeContext);
      const updated = legacy.updateNodeContext(
        legacyNodeContext,
        viewIndex,
        textNode,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      return normalizeLegacyNodeContext(updated)!;
    },
  };
  adaptedTextNodeBreakers.set(legacy, adapted);
  legacyOfAdaptedTextNodeBreakers.set(adapted, legacy);
  return adapted;
}

const adaptedBreakPositions = new WeakMap<
  LegacyBreakPosition,
  Layout.BreakPosition
>();

function adaptLegacyBreakPosition(
  legacy: LegacyBreakPosition,
): Layout.BreakPosition {
  const core = coreBreakPositions.get(legacy);
  if (core) {
    return core;
  }
  const cached = adaptedBreakPositions.get(legacy);
  if (cached) {
    return cached;
  }
  const adapted: Layout.BreakPosition = {
    findAcceptableBreak(
      column: Layout.Column,
      penalty: number,
    ): Vtree.NodeContext | null {
      return normalizeLegacyNodeContext(
        legacy.findAcceptableBreak(legacyColumnViewOf(column), penalty),
      );
    },
    getMinBreakPenalty(): number {
      return legacy.getMinBreakPenalty();
    },
    calculateOffset(column: Layout.Column): {
      current: number;
      minimum: number;
    } {
      return legacy.calculateOffset(legacyColumnViewOf(column));
    },
    breakPositionChosen(column: Layout.Column): void {
      legacy.breakPositionChosen(legacyColumnViewOf(column));
    },
  };
  adaptedBreakPositions.set(legacy, adapted);
  legacyOfAdaptedBreakPositions.set(adapted, legacy);
  return adapted;
}

const adaptedFormattingContexts = new WeakSet<Vtree.FormattingContext>();

function acceptsFirstTimeReplacement(
  formattingContext: Vtree.FormattingContext,
): boolean {
  const target = formattingContext as unknown as object;
  for (
    let owner: object | null = target;
    owner;
    owner = Object.getPrototypeOf(owner)
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, "isFirstTime");
    if (!descriptor) {
      continue;
    }
    if (descriptor.writable !== true) {
      return false;
    }
    return owner === target || Object.isExtensible(target);
  }
  return Object.isExtensible(target);
}

function adaptFormattingContext(
  formattingContext: Vtree.FormattingContext,
): Vtree.FormattingContext {
  if (
    adaptedFormattingContexts.has(formattingContext) ||
    !acceptsFirstTimeReplacement(formattingContext)
  ) {
    return formattingContext;
  }
  adaptedFormattingContexts.add(formattingContext);
  const isFirstTime = formattingContext.isFirstTime;
  formattingContext.isFirstTime = (
    nodeContext: Vtree.NodeContext,
    firstTime: boolean,
  ): boolean => {
    decorate(nodeContext);
    return isFirstTime.call(formattingContext, nodeContext, firstTime);
  };
  return formattingContext;
}

export function adaptLegacyFormattingContext(
  hook: (...p1) => any,
  formattingContext: LegacyFormattingContext,
): Vtree.FormattingContext {
  const core = formattingContext as unknown as Vtree.FormattingContext;
  return Plugin.isCoreHook(hook) ? core : adaptFormattingContext(core);
}

export function legacyFirstTime(
  formattingContext: Vtree.FormattingContext,
  nodeContext: Vtree.NodeContext,
  rendered: NodeContext.ElementRenderDraft,
  firstTime: boolean,
): { firstTime: boolean; nodeContext: Vtree.NodeContext } {
  const hook = Plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT;
  const legacy = asLegacyRenderContext(
    hook,
    nodeContext,
    NodeContext.elementRenderProgress(nodeContext, rendered),
    rendered,
  );
  const before = captureRenderFields(hook, legacy);
  const resolved = formattingContext.isFirstTime(coreOf(legacy), firstTime);
  normalizeLegacyNodeContext(legacy);
  return {
    firstTime: resolved,
    nodeContext: withLegacyContextWrites(
      nodeContext,
      applyLegacyRenderWrites(
        Plugin.getHooksForName(hook),
        before,
        legacy,
        rendered,
      ),
    ),
  };
}

const adaptedLayoutProcessors = new WeakMap<
  LegacyLayoutProcessor,
  LayoutProcessor
>();

export function adaptLegacyLayoutProcessor(
  hook: (...p1) => any,
  legacy: LegacyLayoutProcessor,
): LayoutProcessor {
  if (Plugin.isCoreHook(hook)) {
    return legacy as unknown as LayoutProcessor;
  }
  const cached = adaptedLayoutProcessors.get(legacy);
  if (cached) {
    return cached;
  }
  const adapted: LayoutProcessor = {
    layout(
      nodeContext: Vtree.NodeContext,
      column: Layout.Column,
      leadingEdge: boolean,
    ): Task.Result<Vtree.NodeContext | null> {
      const legacyNodeContext = decorated(nodeContext);
      return legacy
        .layout(legacyNodeContext, legacyColumnViewOf(column), leadingEdge)
        .thenAsync((result) => {
          normalizeLegacyNodeContext(legacyNodeContext);
          return Task.newResult(normalizeLegacyNodeContext(result));
        });
    },
    createEdgeBreakPosition(
      position: Vtree.NodeContext,
      breakOnEdge: string | null,
      overflows: boolean,
      columnBlockSize: number,
    ): Layout.BreakPosition {
      const legacyPosition = decorated(position);
      const breakPosition = legacy.createEdgeBreakPosition(
        legacyPosition,
        breakOnEdge,
        overflows,
        columnBlockSize,
      );
      normalizeLegacyNodeContext(legacyPosition);
      return adaptLegacyBreakPosition(breakPosition);
    },
    startNonInlineElementNode(nodeContext: Vtree.NodeContext): boolean {
      const legacyNodeContext = decorated(nodeContext);
      const skipped = legacy.startNonInlineElementNode(legacyNodeContext);
      normalizeLegacyNodeContext(legacyNodeContext);
      return skipped;
    },
    afterNonInlineElementNode(
      nodeContext: Vtree.NodeContext,
      stopAtOverflow: boolean,
    ): boolean {
      const legacyNodeContext = decorated(nodeContext);
      const skipped = legacy.afterNonInlineElementNode(
        legacyNodeContext,
        stopAtOverflow,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      return skipped;
    },
    finishBreak(
      column: Layout.Column,
      nodeContext: Vtree.NodeContext,
      forceRemoveSelf: boolean,
      endOfColumn: boolean,
    ): Task.Result<boolean> {
      const legacyNodeContext = decorated(nodeContext);
      return legacy
        .finishBreak(
          legacyColumnViewOf(column),
          legacyNodeContext,
          forceRemoveSelf,
          endOfColumn,
        )
        .thenAsync((result) => {
          normalizeLegacyNodeContext(legacyNodeContext);
          return Task.newResult(result);
        });
    },
    clearOverflownViewNodes(
      column: Layout.Column,
      parentNodeContext: Vtree.NodeContext | null,
      nodeContext: Vtree.NodeContext,
      removeSelf: boolean,
    ) {
      const legacyParentNodeContext =
        parentNodeContext === null ? null : decorated(parentNodeContext);
      const legacyNodeContext = decorated(nodeContext);
      legacy.clearOverflownViewNodes(
        legacyColumnViewOf(column),
        legacyParentNodeContext,
        legacyNodeContext,
        removeSelf,
      );
      normalizeLegacyNodeContext(legacyParentNodeContext);
      normalizeLegacyNodeContext(legacyNodeContext);
    },
  };
  adaptedLayoutProcessors.set(legacy, adapted);
  return adapted;
}

function decoratedCheckPoints(
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  for (const checkPoint of checkPoints) {
    decorate(checkPoint);
  }
  // Same array, same elements: see coreOf.
  return checkPoints as unknown as LegacyRenderedNodeContext[];
}

function retaggedCheckPoints(
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  const legacy = decoratedCheckPoints(checkPoints);
  for (const checkPoint of legacy) {
    retagLegacyValue(checkPoint);
    handedOut.add(coreOf(checkPoint));
  }
  return legacy;
}

/**
 * @deprecated `asLegacyNodeContext` for checkpoint arrays. The array itself is
 * returned so that its identity and its elements' identities are preserved.
 */
export function asLegacyRenderedNodeContexts(
  hook: string,
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  if (!legacySurfaceActive(hook)) {
    // Same array, same elements: see coreOf.
    return checkPoints as unknown as LegacyRenderedNodeContext[];
  }
  return decoratedCheckPoints(checkPoints);
}
