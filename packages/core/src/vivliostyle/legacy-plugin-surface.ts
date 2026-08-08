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
    if (!isDecorated(nc)) {
      // The core builds node contexts as plain object literals, so the legacy
      // prototype cannot shadow any own field of the value.
      Object.setPrototypeOf(nc, legacyPrototype);
    }
    if (nc.shadowSibling && !isDecorated(nc.shadowSibling)) {
      decorate(nc.shadowSibling);
    }
    if (nc.blockContainer && !isDecorated(nc.blockContainer)) {
      decorate(nc.blockContainer);
    }
  }
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
  | "fragmentLayoutConstraints"
  | "collectElementsOffset"
> & {
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
    breakPosition: Layout.BreakPosition;
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
    normalizeLegacyNodeContext(value as unknown as LegacyNodeContext);
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
): object {
  const projections = projectionsOf(members);
  const bound = new Map<string | symbol, unknown>();
  const overrides = new Map<string | symbol, unknown>();
  return new Proxy(target, {
    get: (t, property) =>
      projectedMemberOf(t, bound, overrides, projections, property),
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
          .thenAsync((result) => Task.newResult(result.processChildren)),
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

export function asLegacyColumn(
  hook: (...p1) => any,
  column: Layout.Column,
): LegacyColumn {
  if (Plugin.isCoreHook(hook)) {
    return column as unknown as LegacyColumn;
  }
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
    resolveTextNodeBreaker: () => (nodeContext: Vtree.NodeContext) =>
      legacyTextNodeBreakerViewOf(column.resolveTextNodeBreaker(nodeContext)),
    nodeContextOverflowingDueToRepetitiveElements: () =>
      decoratedOrNull<LegacyNodeContext>(
        column.nodeContextOverflowingDueToRepetitiveElements,
      ),
    pseudoParent: () =>
      column.pseudoParent === null
        ? null
        : asLegacyColumn(hook, column.pseudoParent),
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
    findBoxBreakPosition: () => (bp: Layout.BoxBreakPosition, force: boolean) =>
      decoratedOrNull<LegacyNodeContext>(
        column.findBoxBreakPosition(bp, force),
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
    findEdgeBreakPosition: () => (bp: Layout.EdgeBreakPosition) =>
      decoratedAs<LegacyNodeContext>(column.findEdgeBreakPosition(bp)),
    findAcceptableBreakPosition: () => () => {
      const result = column.findAcceptableBreakPosition();
      return result === null
        ? null
        : {
            ...result,
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

/**
 * @deprecated Give a value coming back from a legacy implementation the
 * discriminant its own fields imply, and hand it to the core as itself.
 */
export function normalizeLegacyNodeContext(
  nodeContext: LegacyNodeContext | null | undefined,
): Vtree.NodeContext | null {
  if (!nodeContext) {
    return null;
  }
  setLegacyKind(nodeContext, kindOfLegacy(nodeContext));
  return coreOf(nodeContext);
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

function decoratedCheckPoints(
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  for (const checkPoint of checkPoints) {
    decorate(checkPoint);
  }
  // Same array, same elements: see coreOf.
  return checkPoints as unknown as LegacyRenderedNodeContext[];
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
