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

type LegacyContextStores = Pick<
  Vtree.LayoutContext,
  "breakSuppressionStore" | "continuationStore"
>;

type LegacyContextMetadata = Readonly<{
  retained?: true;
  stores?: LegacyContextStores;
}>;

const legacyContextMetadata = new WeakMap<
  Vtree.NodeContext,
  LegacyContextMetadata
>();

function isRetained(nodeContext: Vtree.NodeContext): boolean {
  return legacyContextMetadata.get(nodeContext)?.retained === true;
}

function setRetained(nodeContext: Vtree.NodeContext, retained: boolean): void {
  const metadata = legacyContextMetadata.get(nodeContext);
  if (!retained && !metadata?.stores) {
    legacyContextMetadata.delete(nodeContext);
    return;
  }
  legacyContextMetadata.set(nodeContext, {
    ...metadata,
    retained: retained ? true : undefined,
  });
}

function associateContextStores(
  nodeContext: Vtree.NodeContext,
  stores: LegacyContextStores,
): void {
  legacyContextMetadata.set(nodeContext, {
    ...legacyContextMetadata.get(nodeContext),
    stores: {
      breakSuppressionStore: stores.breakSuppressionStore,
      continuationStore: stores.continuationStore,
    },
  });
}

function contextStoresOf(
  nodeContext: Vtree.NodeContext,
): LegacyContextStores | undefined {
  return legacyContextMetadata.get(nodeContext)?.stores;
}

function markRetained(nodeContext: Vtree.NodeContext): void {
  for (let nc: Vtree.NodeContext | null = nodeContext; nc; nc = nc.parent) {
    if (isRetained(nc)) {
      return;
    }
    setRetained(nc, true);
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
    return isRetained(coreOf(this));
  }

  set shared(value: boolean) {
    const core = coreOf(this);
    if (value) {
      setRetained(core, true);
    } else {
      setRetained(core, false);
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
    return isRetained(core)
      ? decorated(cloneCoreItem(core), contextStoresOf(core))
      : this;
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
    return decorated(chain, contextStoresOf(coreOf(this)));
  }

  toNodePositionStep(this: LegacyNodeContext): Vtree.NodePositionStep {
    const core = coreOf(this);
    return NodeContext.toNodePositionStep(
      core,
      contextStoresOf(core)?.continuationStore,
    );
  }

  toNodePosition(this: LegacyNodeContext): Vtree.NodePosition {
    const core = coreOf(this);
    return NodeContext.toNodePosition(
      core,
      contextStoresOf(core)?.continuationStore,
    );
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
    decorate(container, contextStoresOf(coreOf(this)));
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

function decorate(
  nodeContext: Vtree.NodeContext,
  stores?: LegacyContextStores,
  visited: WeakSet<Vtree.NodeContext> = new WeakSet(),
): void {
  for (let nc: Vtree.NodeContext | null = nodeContext; nc; nc = nc.parent) {
    if (visited.has(nc)) {
      continue;
    }
    visited.add(nc);
    const associatedStores = stores ?? contextStoresOf(nc);
    if (associatedStores) {
      associateContextStores(nc, associatedStores);
      reportSuppressedBreaks(associatedStores.breakSuppressionStore, nc);
    }
    if (!isDecorated(nc)) {
      // The core builds node contexts as plain object literals, so the legacy
      // prototype cannot shadow any own field of the value.
      Object.setPrototypeOf(nc, legacyPrototype);
    }
    if (nc.shadowSibling) {
      decorate(nc.shadowSibling, associatedStores, visited);
    }
    if (nc.blockContainer) {
      decorate(nc.blockContainer, associatedStores, visited);
    }
  }
}

function reportSuppressedBreaks(
  breakSuppressionStore: Break.BreakSuppressionStore,
  nodeContext: Vtree.NodeContext,
): void {
  // Suppression used to null the field itself; the core now composes it with
  // the registry, so writing the composed value back is a no-op for the core
  // and restores what a plugin used to read.
  const writable = nodeContext as unknown as {
    breakBefore: string | null;
    breakAfter: string | null;
  };
  writable.breakBefore = Break.reportEffectiveBreakBefore(
    breakSuppressionStore,
    nodeContext,
  );
  writable.breakAfter = Break.reportEffectiveBreakAfter(
    breakSuppressionStore,
    nodeContext,
  );
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

const formattingContextsSnapshot = Symbol();

type FormattingContextSnapshot = Readonly<{
  formattingContext: Vtree.FormattingContext;
  isFirstTime: Vtree.FormattingContext["isFirstTime"];
}>;

type RenderFields = {
  [field: string]: unknown;
  [formattingContextsSnapshot]?: ReadonlyMap<
    Vtree.NodeContext,
    FormattingContextSnapshot
  >;
};

function formattingContextSnapshotsByNodeOf(
  nodeContext: Vtree.NodeContext,
): ReadonlyMap<Vtree.NodeContext, FormattingContextSnapshot> {
  const contexts = new Map<Vtree.NodeContext, FormattingContextSnapshot>();
  const pending = [nodeContext];
  const visited = new WeakSet<Vtree.NodeContext>();
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    contexts.set(current, {
      formattingContext: current.formattingContext,
      isFirstTime: current.formattingContext.isFirstTime,
    });
    if (current.parent) {
      pending.push(current.parent);
    }
    if (current.shadowSibling) {
      pending.push(current.shadowSibling);
    }
    if (current.blockContainer) {
      pending.push(current.blockContainer);
    }
  }
  return contexts;
}

export type LegacyContextWrites = { readonly [field: string]: unknown };

const retainedWrites = new WeakSet<LegacyContextWrites>();

function legacyRenderContext(
  stores: LegacyContextStores,
  nodeContext: Vtree.NodeContext,
  progress: Vtree.NodeContext,
  rendered: NodeContext.ElementRenderDraft,
): LegacyNodeContext {
  const overlaid = {
    ...progress,
    ...rendered,
  } as unknown as Vtree.NodeContext;
  if (isRetained(nodeContext)) {
    setRetained(overlaid, true);
  }
  return decorated(overlaid, stores);
}

/**
 * @deprecated Hand out a node context whose rendered style is the draft the
 * core has built so far, which is what the value carried when it was mutated
 * in place. Falls back to the value the core hands today while no external
 * hook is registered.
 */
export function asLegacyRenderContext(
  hook: string,
  stores: LegacyContextStores,
  nodeContext: Vtree.NodeContext,
  progress: Vtree.NodeContext,
  rendered: NodeContext.ElementRenderDraft,
): LegacyNodeContext {
  if (!legacySurfaceActive(hook)) {
    return legacyViewOf(progress);
  }
  return legacyRenderContext(stores, nodeContext, progress, rendered);
}

function snapshotRenderFields(nodeContext: LegacyNodeContext): RenderFields {
  const source = nodeContext as unknown as RenderFields;
  const snapshot: RenderFields = {};
  for (const field of renderFieldsOf()) {
    snapshot[field] = source[field];
  }
  for (const field of CONTEXT_FIELDS) {
    snapshot[field] = source[field];
  }
  snapshot[formattingContextsSnapshot] = formattingContextSnapshotsByNodeOf(
    coreOf(nodeContext),
  );
  return snapshot;
}

function adaptWrittenFormattingContexts(
  before: RenderFields,
  nodeContext: Vtree.NodeContext,
): void {
  const previous = before[formattingContextsSnapshot] ?? new Map();
  const current = formattingContextSnapshotsByNodeOf(nodeContext);
  const checked = new WeakSet<Vtree.NodeContext>();
  for (const [contextNode, snapshot] of previous) {
    checked.add(contextNode);
    if (
      contextNode.formattingContext !== snapshot.formattingContext ||
      contextNode.formattingContext.isFirstTime !== snapshot.isFirstTime
    ) {
      (
        contextNode as unknown as {
          formattingContext: Vtree.FormattingContext;
        }
      ).formattingContext = adaptFormattingContext(
        contextNode.formattingContext,
      );
    }
  }
  for (const [contextNode, snapshot] of current) {
    const previousSnapshot = previous.get(contextNode);
    if (
      !checked.has(contextNode) ||
      previousSnapshot?.formattingContext !== snapshot.formattingContext ||
      previousSnapshot.isFirstTime !== snapshot.isFirstTime
    ) {
      (
        contextNode as unknown as {
          formattingContext: Vtree.FormattingContext;
        }
      ).formattingContext = adaptFormattingContext(snapshot.formattingContext);
    }
  }
}

export function captureRenderFields(
  hook: string,
  nodeContext: LegacyNodeContext,
): RenderFields | null {
  if (!legacySurfaceActive(hook)) {
    return null;
  }
  return snapshotRenderFields(nodeContext);
}

export function applyLegacyRenderWrites(
  hooks: readonly ((...p1) => any)[],
  before: RenderFields | null,
  nodeContext: LegacyNodeContext,
  rendered: NodeContext.ElementRenderDraft,
  adaptsFormattingContextWrites: boolean = false,
): LegacyContextWrites {
  if (!before) {
    return {};
  }
  const adapts =
    adaptsFormattingContextWrites ||
    hooks.some((hook) => !Plugin.isCoreHook(hook));
  const source = nodeContext as unknown as RenderFields;
  const draft = rendered as unknown as RenderFields;
  if (adapts) {
    adaptWrittenFormattingContexts(before, coreOf(nodeContext));
  }
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
  if (isRetained(coreOf(nodeContext))) {
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
      setRetained(nodeContext, true);
    }
    return nodeContext;
  }
  const composed = { ...nodeContext, ...writes } as unknown as T;
  const stores = contextStoresOf(nodeContext);
  if (stores) {
    associateContextStores(composed, stores);
  }
  if (claimed) {
    setRetained(composed, true);
  }
  if ("after" in writes || "viewNode" in writes) {
    normalizeLegacyNodeContext(legacyViewOf(composed));
  }
  return composed;
}

function applyRenderedNodeContext(
  stores: LegacyContextStores,
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
  normalizeLegacyNodeContext(decorated(nodeContext, stores));
}

function decorated(
  nodeContext: Vtree.NodeContext,
  stores?: LegacyContextStores,
): LegacyNodeContext {
  decorate(nodeContext, stores);
  return legacyViewOf(nodeContext);
}

function decoratedAs<T>(
  nodeContext: Vtree.NodeContext,
  stores?: LegacyContextStores,
): T {
  decorate(nodeContext, stores);
  return nodeContext as unknown as T;
}

function decoratedOrNull<T>(
  nodeContext: Vtree.NodeContext | null,
  stores?: LegacyContextStores,
): T | null {
  return nodeContext === null ? null : decoratedAs<T>(nodeContext, stores);
}

function retaggedOrNull<T>(
  nodeContext: Vtree.NodeContext | null,
  stores?: LegacyContextStores,
): T | null {
  const legacy = decoratedOrNull<LegacyNodeContext>(nodeContext, stores);
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
  stores: LegacyContextStores,
  nodeContext: Vtree.NodeContext,
): LegacyNodeContext {
  if (legacySurfaceActive(hook)) {
    decorate(nodeContext, stores);
  }
  return legacyViewOf(nodeContext);
}

/**
 * @deprecated `asLegacyNodeContext` for hook payloads that admit null.
 */
export function asLegacyNodeContextOrNull(
  hook: string,
  stores: LegacyContextStores,
  nodeContext: Vtree.NodeContext | null,
): LegacyNodeContext | null {
  return nodeContext === null
    ? null
    : asLegacyNodeContext(hook, stores, nodeContext);
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
            applyRenderedNodeContext(
              layoutContext,
              nodeContext,
              result.nodeContext,
            );
            return Task.newResult(result.processChildren);
          }),
    clone: () => () => asLegacyLayoutContext(layoutContext.clone()),
    nextInTree:
      () => (nodeContext: Vtree.NodeContext, atUnforcedBreak?: boolean) =>
        layoutContext
          .nextInTree(nodeContext, atUnforcedBreak)
          .thenAsync((result) =>
            Task.newResult(
              decoratedOrNull<LegacyNodeContext>(result, layoutContext),
            ),
          ),
    peelOff: () => (nodeContext: Vtree.ChildNodeContext, nodeOffset: number) =>
      layoutContext
        .peelOff(nodeContext, nodeOffset)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result, layoutContext)),
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
  stores: LegacyContextStores,
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
          stores,
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
                stores,
              )
          : undefined;
      },
    },
    {
      position: () =>
        retaggedOrNull<LegacyNodeContext>(
          (breakPosition as Partial<Layout.EdgeBreakPosition>).position ?? null,
          stores,
        ),
      breakNodeContext: () =>
        retaggedOrNull<LegacyNodeContext>(
          (breakPosition as Partial<Layout.BoxBreakPosition>)
            .breakNodeContext ?? null,
          stores,
        ),
      checkPoints: () => {
        const checkPoints = (breakPosition as Partial<Layout.BoxBreakPosition>)
          .checkPoints;
        return checkPoints === undefined
          ? undefined
          : retaggedCheckPoints(checkPoints, stores);
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
        contextStoresOf(coreOf(nodeContext)),
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
        contextStoresOf(coreOf(nodeContext)),
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
  stores: LegacyContextStores,
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
        : legacyBreakPositionViewOf(breakPosition, stores);
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
  const stores = column.layoutContext;
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
            decoratedCheckPoints(checkPoints, stores);
            return Task.newResult(
              decoratedOrNull<LegacyNodeContext>(result.nodeContext, stores),
            );
          }),
    layoutContext: () => asLegacyLayoutContext(column.layoutContext),
    breakPositions: () =>
      legacyBreakPositionsViewOf(column.breakPositions, stores),
    resolveTextNodeBreaker: () => (nodeContext: Vtree.NodeContext) => {
      decorate(nodeContext, stores);
      return legacyTextNodeBreakerViewOf(
        column.resolveTextNodeBreaker(nodeContext),
      );
    },
    nodeContextOverflowingDueToRepetitiveElements: () =>
      retaggedOrNull<LegacyNodeContext>(
        column.nodeContextOverflowingDueToRepetitiveElements,
        stores,
      ),
    pseudoParent: () =>
      column.pseudoParent === null
        ? null
        : legacyColumnViewOf(column.pseudoParent),
    asFloatNodeContext: () => (nodeContext: Vtree.NodeContext) =>
      decoratedOrNull<LegacyFloatNodeContext>(
        column.asFloatNodeContext(nodeContext),
        stores,
      ),
    openAllViews: () => (position: Vtree.NodePosition) =>
      column
        .openAllViews(position)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result, stores)),
        ),
    maybePeelOff: () => (position: Vtree.NodeContext, count: number) =>
      column
        .maybePeelOff(position, count)
        .thenAsync((result) =>
          Task.newResult(decoratedAs<LegacyNodeContext>(result, stores)),
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
            decoratedCheckPoints(checkPoints, stores);
            return Task.newResult(
              decoratedOrNull<LegacyNodeContext>(result, stores),
            );
          }),
    nextInTree:
      () => (position: Vtree.NodeContext, atUnforcedBreak?: boolean) =>
        column
          .nextInTree(position, atUnforcedBreak)
          .thenAsync((result) =>
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
          ),
    buildDeepElementView: () => (position: Vtree.NodeContext | null) =>
      column
        .buildDeepElementView(position)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
        ),
    layoutUnbreakable: () => (nodeContextIn: Vtree.NodeContext) =>
      column
        .layoutUnbreakable(nodeContextIn)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
        ),
    layoutFloat: () => (nodeContext: Vtree.RenderedNodeContext) =>
      column
        .layoutFloat(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
        ),
    setFloatAnchorViewNode: () => (nodeContext: Vtree.RenderedNodeContext) =>
      decoratedAs<LegacyRenderedNodeContext>(
        column.setFloatAnchorViewNode(nodeContext),
        stores,
      ),
    layoutPageFloat: () => (nodeContext: Vtree.FloatNodeContext) =>
      column
        .layoutPageFloat(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
        ),
    layoutBreakableBlock: () => (nodeContext: Vtree.NodeContext) =>
      column
        .layoutBreakableBlock(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
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
            stores,
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
          stores,
        ),
    findBoxBreakPosition: () => (bp: LegacyBreakPosition, force: boolean) =>
      decoratedOrNull<LegacyNodeContext>(
        column.findBoxBreakPosition(
          coreBreakPositionOf(bp) as Layout.BoxBreakPosition,
          force,
        ),
        stores,
      ),
    findFirstOverflowingEdgeAndCheckPoint:
      () => (checkPoints: Vtree.RenderedNodeContext[]) => {
        const result =
          column.findFirstOverflowingEdgeAndCheckPoint(checkPoints);
        return {
          ...result,
          checkPoint: decoratedOrNull<LegacyRenderedNodeContext>(
            result.checkPoint,
            stores,
          ),
        };
      },
    findEdgeBreakPosition: () => (bp: LegacyBreakPosition) =>
      decoratedAs<LegacyNodeContext>(
        column.findEdgeBreakPosition(
          coreBreakPositionOf(bp) as Layout.EdgeBreakPosition,
        ),
        stores,
      ),
    findAcceptableBreakPosition: () => () => {
      const result = column.findAcceptableBreakPosition();
      return result === null
        ? null
        : {
            breakPosition: legacyBreakPositionViewOf(
              result.breakPosition,
              stores,
            ),
            nodeContext: decoratedAs<LegacyNodeContext>(
              result.nodeContext,
              stores,
            ),
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
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
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
            Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
          ),
    skipTailEdges: () => (nodeContext: Vtree.NodeContext) =>
      column
        .skipTailEdges(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
        ),
    layoutFloatOrFootnote: () => (nodeContext: Vtree.FloatNodeContext) =>
      column
        .layoutFloatOrFootnote(nodeContext)
        .thenAsync((result) =>
          Task.newResult(decoratedOrNull<LegacyNodeContext>(result, stores)),
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
            Task.newResult(decoratedAs<LegacyNodeContext>(result, stores)),
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
                stores,
              ),
              overflownNodeContext: decoratedOrNull<LegacyNodeContext>(
                result.overflownNodeContext,
                stores,
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
  for (const { formattingContext } of formattingContextSnapshotsByNodeOf(
    coreOf(nodeContext),
  ).values()) {
    adaptFormattingContext(formattingContext);
  }
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
  WeakMap<LegacyContextStores, Layout.TextNodeBreaker>
>();

/**
 * @deprecated Serve a legacy text node breaker under the current contract.
 */
export function adaptLegacyTextNodeBreaker(
  hook: (...p1) => any,
  legacy: LegacyTextNodeBreaker,
  stores: LegacyContextStores,
): Layout.TextNodeBreaker {
  if (Plugin.isCoreHook(hook)) {
    return legacy as unknown as Layout.TextNodeBreaker;
  }
  const core = coreTextNodeBreakers.get(legacy);
  if (core) {
    return core;
  }
  let adapters = adaptedTextNodeBreakers.get(legacy);
  if (!adapters) {
    adapters = new WeakMap();
    adaptedTextNodeBreakers.set(legacy, adapters);
  }
  const cached = adapters.get(stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
      const legacyCheckPoints = decoratedCheckPoints(checkPoints, stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
      const updated = legacy.updateNodeContext(
        legacyNodeContext,
        viewIndex,
        textNode,
      );
      normalizeLegacyNodeContext(legacyNodeContext);
      return normalizeLegacyNodeContext(updated)!;
    },
  };
  adapters.set(stores, adapted);
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

const legacyFormattingContexts = new WeakSet<Vtree.FormattingContext>();

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
  if (legacyFormattingContexts.has(formattingContext)) {
    return formattingContext;
  }
  legacyFormattingContexts.add(formattingContext);
  if (!acceptsFirstTimeReplacement(formattingContext)) {
    return formattingContext;
  }
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
  stores: LegacyContextStores,
  formattingContext: Vtree.FormattingContext,
  nodeContext: Vtree.NodeContext,
  rendered: NodeContext.ElementRenderDraft,
  firstTime: boolean,
): { firstTime: boolean; nodeContext: Vtree.NodeContext } {
  const hook = Plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT;
  const progress = NodeContext.elementRenderProgress(nodeContext, rendered);
  const legacyFormattingContext =
    legacyFormattingContexts.has(formattingContext);
  const legacy = legacyFormattingContext
    ? legacyRenderContext(stores, nodeContext, progress, rendered)
    : asLegacyRenderContext(hook, stores, nodeContext, progress, rendered);
  const before = legacyFormattingContext
    ? snapshotRenderFields(legacy)
    : captureRenderFields(hook, legacy);
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
        legacyFormattingContext,
      ),
    ),
  };
}

const adaptedLayoutProcessors = new WeakMap<
  LegacyLayoutProcessor,
  WeakMap<LegacyContextStores, LayoutProcessor>
>();

export function adaptLegacyLayoutProcessor(
  hook: (...p1) => any,
  legacy: LegacyLayoutProcessor,
  stores: LegacyContextStores,
): LayoutProcessor {
  if (Plugin.isCoreHook(hook)) {
    return legacy as unknown as LayoutProcessor;
  }
  let adapters = adaptedLayoutProcessors.get(legacy);
  if (!adapters) {
    adapters = new WeakMap();
    adaptedLayoutProcessors.set(legacy, adapters);
  }
  const cached = adapters.get(stores);
  if (cached) {
    return cached;
  }
  const adapted: LayoutProcessor = {
    layout(
      nodeContext: Vtree.NodeContext,
      column: Layout.Column,
      leadingEdge: boolean,
    ): Task.Result<Vtree.NodeContext | null> {
      const legacyNodeContext = decorated(nodeContext, stores);
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
      const legacyPosition = decorated(position, stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
      const skipped = legacy.startNonInlineElementNode(legacyNodeContext);
      normalizeLegacyNodeContext(legacyNodeContext);
      return skipped;
    },
    afterNonInlineElementNode(
      nodeContext: Vtree.NodeContext,
      stopAtOverflow: boolean,
    ): boolean {
      const legacyNodeContext = decorated(nodeContext, stores);
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
      const legacyNodeContext = decorated(nodeContext, stores);
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
        parentNodeContext === null
          ? null
          : decorated(parentNodeContext, stores);
      const legacyNodeContext = decorated(nodeContext, stores);
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
  adapters.set(stores, adapted);
  return adapted;
}

function decoratedCheckPoints(
  checkPoints: Vtree.RenderedNodeContext[],
  stores?: LegacyContextStores,
): LegacyRenderedNodeContext[] {
  for (const checkPoint of checkPoints) {
    decorate(checkPoint, stores);
  }
  // Same array, same elements: see coreOf.
  return checkPoints as unknown as LegacyRenderedNodeContext[];
}

function retaggedCheckPoints(
  checkPoints: Vtree.RenderedNodeContext[],
  stores?: LegacyContextStores,
): LegacyRenderedNodeContext[] {
  const legacy = decoratedCheckPoints(checkPoints, stores);
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
  stores: LegacyContextStores,
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  if (!legacySurfaceActive(hook)) {
    // Same array, same elements: see coreOf.
    return checkPoints as unknown as LegacyRenderedNodeContext[];
  }
  return decoratedCheckPoints(checkPoints, stores);
}
