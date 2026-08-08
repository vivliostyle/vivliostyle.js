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
import { PageFloats, Selectors, Vtree } from "./types";

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
 * @deprecated `asLegacyNodeContext` for checkpoint arrays. The array itself is
 * returned so that its identity and its elements' identities are preserved.
 */
export function asLegacyRenderedNodeContexts(
  hook: string,
  checkPoints: Vtree.RenderedNodeContext[],
): LegacyRenderedNodeContext[] {
  if (legacySurfaceActive(hook)) {
    for (const checkPoint of checkPoints) {
      decorate(checkPoint);
    }
  }
  // Same array, same elements: see coreOf.
  return checkPoints as unknown as LegacyRenderedNodeContext[];
}
