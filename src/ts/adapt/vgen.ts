/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview Vgen - View tree generator.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssCasc from "./csscasc";
import * as CssProp from "./cssprop";
import * as CssStyler from "./cssstyler";
import * as Exprs from "./expr";
import * as Font from "./font";
import * as Task from "./task";
import * as TaskUtil from "./taskutil";
import * as Vtree from "./vtree";
import * as XmlDoc from "./xmldoc";
import * as Asserts from "../vivliostyle/asserts";
import * as Diff from "../vivliostyle/diff";
import * as Display from "../vivliostyle/display";
import * as Matchers from "../vivliostyle/matcher";
import * as PageFloat from "../vivliostyle/pagefloat";
import * as Plugin from "../vivliostyle/plugin";
import * as PseudoElement from "../vivliostyle/pseudoelement";
import * as RepetitiveElementImpl from "../vivliostyle/repetitiveelements";
import * as Selectors from "../vivliostyle/selectors";
import * as Urls from "../vivliostyle/urls";

const namespacePrefixMap = {};

export const frontEdgeBlackListHor: { [key: string]: string } = {
  "text-indent": "0px",
  "margin-top": "0px",
  "padding-top": "0px",
  "border-top-width": "0px",
  "border-top-style": "none",
  "border-top-color": "transparent",
  "border-top-left-radius": "0px",
  "border-top-right-radius": "0px"
};

export const frontEdgeBlackListVert: { [key: string]: string } = {
  "text-indent": "0px",
  "margin-right": "0px",
  "padding-right": "0px",
  "border-right-width": "0px",
  "border-right-style": "none",
  "border-right-color": "transparent",
  "border-top-right-radius": "0px",
  "border-bottom-right-radius": "0px"
};

export const frontEdgeUnforcedBreakBlackListHor: { [key: string]: string } = {
  "margin-top": "0px"
};

export const frontEdgeUnforcedBreakBlackListVert: { [key: string]: string } = {
  "margin-right": "0px"
};

export type CustomRenderer = (
  p1: Element,
  p2: Element,
  p3: { [key: string]: Css.Val }
) => Task.Result<Element>;

export interface CustomRendererFactory {
  makeCustomRenderer(xmldoc: XmlDoc.XMLDocHolder): CustomRenderer;
}

/**
 * Creates an epubReadingSystem object in the iframe.contentWindow.navigator
 * when load event fires.
 */
export const initIFrame = (iframe: HTMLIFrameElement) => {
  iframe.addEventListener(
    "load",
    () => {
      iframe.contentWindow.navigator["epubReadingSystem"] = {
        name: "adapt",
        version: "0.1",
        layoutStyle: "paginated",
        hasFeature: function(name, version) {
          switch (name) {
            case "mouse-events":
              return true;
          }
          return false;
        }
      };
    },
    false
  );
};

export interface StylerProducer {
  getStylerForDoc(xmldoc: XmlDoc.XMLDocHolder): CssStyler.AbstractStyler;
}

export class ViewFactory extends Base.SimpleEventTarget
  implements Vtree.LayoutContext {
  private static SVG_URL_ATTRIBUTES: string[] = [
    "color-profile",
    "clip-path",
    "cursor",
    "filter",
    "marker",
    "marker-start",
    "marker-end",
    "marker-mid",
    "fill",
    "stroke",
    "mask"
  ];
  document: Document;
  exprContentListener: Vtree.ExprContentListener;

  // provided by layout
  nodeContext: Vtree.NodeContext | null = null;
  viewRoot: Element | null = null;
  isFootnote: boolean = false;
  sourceNode: Node | null = null;
  offsetInNode: number = 0;

  // computed
  // TODO: only set it on NodeContext
  viewNode: Node | null = null;

  constructor(
    public readonly flowName: string,
    public readonly context: Exprs.Context,
    public readonly viewport: Viewport,
    public readonly styler: CssStyler.Styler,
    public readonly regionIds: string[],
    public readonly xmldoc: XmlDoc.XMLDocHolder,
    public readonly docFaces: Font.DocumentFaces,
    public readonly footnoteStyle: CssCasc.ElementStyle,
    public readonly stylerProducer: StylerProducer,
    public readonly page: Vtree.Page,
    public readonly customRenderer: CustomRenderer,
    public readonly fallbackMap: { [key: string]: string },
    public readonly documentURLTransformer: Base.DocumentURLTransformer
  ) {
    super();
    this.document = viewport.document;
    this.exprContentListener = styler.counterListener.getExprContentListener();
  }

  /**
   * @override
   */
  clone(): Vtree.LayoutContext {
    return new ViewFactory(
      this.flowName,
      this.context,
      this.viewport,
      this.styler,
      this.regionIds,
      this.xmldoc,
      this.docFaces,
      this.footnoteStyle,
      this.stylerProducer,
      this.page,
      this.customRenderer,
      this.fallbackMap,
      this.documentURLTransformer
    );
  }

  createPseudoelementShadow(
    element: Element,
    isRoot: boolean,
    cascStyle: CssCasc.ElementStyle,
    computedStyle: { [key: string]: Css.Val },
    styler: CssStyler.AbstractStyler,
    context: Exprs.Context,
    parentShadow: Vtree.ShadowContext,
    subShadow: Vtree.ShadowContext
  ): Vtree.ShadowContext {
    const pseudoMap = this.getPseudoMap(
      cascStyle,
      this.regionIds,
      this.isFootnote,
      this.nodeContext,
      context
    );
    if (!pseudoMap) {
      return subShadow;
    }
    const addedNames = [];
    const root = PseudoElement.document.createElementNS(Base.NS.SHADOW, "root");
    let att = root;
    for (const name of PseudoElement.pseudoNames) {
      let elem;
      if (name) {
        if (!pseudoMap[name]) {
          continue;
        }
        if (name == "footnote-marker" && !(isRoot && this.isFootnote)) {
          continue;
        }
        if (name.match(/^first-/)) {
          const display = computedStyle["display"];
          if (!display || display === Css.ident.inline) {
            continue;
          }
        }
        if (name === "before" || name === "after") {
          const content = pseudoMap[name]["content"];
          if (
            !content ||
            content === Css.ident.normal ||
            content === Css.ident.none
          ) {
            continue;
          }
        }
        addedNames.push(name);
        elem = PseudoElement.document.createElementNS(Base.NS.XHTML, "span");
        PseudoElement.setPseudoName(elem, name);
      } else {
        elem = PseudoElement.document.createElementNS(
          Base.NS.SHADOW,
          "content"
        );
      }
      att.appendChild(elem);
      if (name.match(/^first-/)) {
        att = elem;
      }
    }
    if (!addedNames.length) {
      return subShadow;
    }
    const shadowStyler = new PseudoElement.PseudoelementStyler(
      element,
      cascStyle,
      styler,
      context,
      this.exprContentListener
    );
    return new Vtree.ShadowContext(
      element,
      root,
      null,
      parentShadow,
      subShadow,
      Vtree.ShadowType.ROOTLESS,
      shadowStyler
    );
  }

  getPseudoMap(
    cascStyle: CssCasc.ElementStyle,
    regionIds: string[],
    isFootnote: boolean,
    nodeContext: Vtree.NodeContext,
    context
  ) {
    const pseudoMap = CssCasc.getStyleMap(cascStyle, "_pseudos");
    if (!pseudoMap) {
      return null;
    }
    const computedPseudoStyleMap = {};
    for (const key in pseudoMap) {
      const computedPseudoStyle = (computedPseudoStyleMap[key] = {});
      CssCasc.mergeStyle(computedPseudoStyle, pseudoMap[key], context);
      CssCasc.mergeViewConditionalStyles(
        computedPseudoStyle,
        context,
        pseudoMap[key]
      );
      CssCasc.forEachStylesInRegion(
        pseudoMap[key],
        regionIds,
        isFootnote,
        (regionId, regionStyle) => {
          CssCasc.mergeStyle(computedPseudoStyle, regionStyle, context);
          CssCasc.forEachViewConditionalStyles(
            regionStyle,
            viewConditionalStyles => {
              CssCasc.mergeStyle(
                computedPseudoStyle,
                viewConditionalStyles,
                context
              );
            }
          );
        }
      );
    }
    return computedPseudoStyleMap;
  }

  createRefShadow(
    href: string,
    type,
    element: Element,
    parentShadow: Vtree.ShadowContext,
    subShadow: Vtree.ShadowContext
  ): Task.Result<Vtree.ShadowContext> {
    const self = this;
    const frame: Task.Frame<Vtree.ShadowContext> = Task.newFrame(
      "createRefShadow"
    );
    self.xmldoc.store.load(href).then(refDocParam => {
      const refDoc = refDocParam as XmlDoc.XMLDocHolder;
      if (refDoc) {
        const refElement = refDoc.getElement(href);
        if (refElement) {
          const refStyler = self.stylerProducer.getStylerForDoc(refDoc);
          subShadow = new Vtree.ShadowContext(
            element,
            refElement,
            refDoc,
            parentShadow,
            subShadow,
            type,
            refStyler
          );
        }
      }
      frame.finish(subShadow);
    });
    return frame.result();
  }

  createShadows(
    element: Element,
    isRoot,
    cascStyle: CssCasc.ElementStyle,
    computedStyle: { [key: string]: Css.Val },
    styler: CssStyler.AbstractStyler,
    context: Exprs.Context,
    shadowContext: Vtree.ShadowContext
  ): Task.Result<Vtree.ShadowContext> {
    const self = this;
    const frame: Task.Frame<Vtree.ShadowContext> = Task.newFrame(
      "createShadows"
    );
    const shadow = null;
    const templateURLVal = computedStyle["template"];
    let cont;
    if (templateURLVal instanceof Css.URL) {
      const url = (templateURLVal as Css.URL).url;
      cont = self.createRefShadow(
        url,
        Vtree.ShadowType.ROOTLESS,
        element,
        shadowContext,
        shadow
      );
    } else {
      cont = Task.newResult(shadow);
    }
    cont.then(shadow => {
      let cont1 = null;
      if (element.namespaceURI == Base.NS.SHADOW) {
        if (element.localName == "include") {
          let href = element.getAttribute("href");
          let xmldoc = null;
          if (href) {
            xmldoc = shadowContext ? shadowContext.xmldoc : self.xmldoc;
          } else if (shadowContext) {
            if (shadowContext.owner.namespaceURI == Base.NS.XHTML) {
              href = shadowContext.owner.getAttribute("href");
            } else {
              href = shadowContext.owner.getAttributeNS(Base.NS.XLINK, "href");
            }
            xmldoc = shadowContext.parentShadow
              ? shadowContext.parentShadow.xmldoc
              : self.xmldoc;
          }
          if (href) {
            href = Base.resolveURL(href, xmldoc.url);
            cont1 = self.createRefShadow(
              href,
              Vtree.ShadowType.ROOTED,
              element,
              shadowContext,
              shadow
            );
          }
        }
      }
      if (cont1 == null) {
        cont1 = Task.newResult(shadow);
      }
      let cont2 = null;
      cont1.then(shadow => {
        if (computedStyle["display"] === Css.ident.table_cell) {
          const url = Base.resolveURL(
            "user-agent.xml#table-cell",
            Base.resourceBaseURL
          );
          cont2 = self.createRefShadow(
            url,
            Vtree.ShadowType.ROOTLESS,
            element,
            shadowContext,
            shadow
          );
        } else {
          cont2 = Task.newResult(shadow);
        }
      });
      cont2.then(shadow => {
        shadow = self.createPseudoelementShadow(
          element,
          isRoot,
          cascStyle,
          computedStyle,
          styler,
          context,
          shadowContext,
          shadow
        );
        frame.finish(shadow);
      });
    });
    return frame.result();
  }

  /**
   * @override
   */
  setViewRoot(viewRoot: Element, isFootnote: boolean) {
    this.viewRoot = viewRoot;
    this.isFootnote = isFootnote;
  }

  /**
   * @return vertical
   */
  computeStyle(
    vertical: boolean,
    rtl: boolean,
    style: CssCasc.ElementStyle,
    computedStyle: { [key: string]: Css.Val }
  ): boolean {
    const context = this.context;
    const cascMap = CssCasc.flattenCascadedStyle(
      style,
      context,
      this.regionIds,
      this.isFootnote,
      this.nodeContext
    );
    vertical = CssCasc.isVertical(cascMap, context, vertical);
    rtl = CssCasc.isRtl(cascMap, context, rtl);
    const self = this;
    CssCasc.convertToPhysical(
      cascMap,
      computedStyle,
      vertical,
      rtl,
      (name, cascVal) => {
        let value = cascVal.evaluate(context, name);
        if (name == "font-family") {
          value = self.docFaces.filterFontFamily(value);
        }
        return value;
      }
    );

    // Compute values of display, position and float
    const position = computedStyle["position"] as Css.Ident;
    const float = computedStyle["float"] as Css.Ident;
    const displayValues = Display.getComputedDislayValue(
      (computedStyle["display"] as Css.Ident) || Css.ident.inline,
      position,
      float,
      this.sourceNode === this.xmldoc.root
    );
    ["display", "position", "float"].forEach(name => {
      if (displayValues[name]) {
        computedStyle[name] = displayValues[name];
      }
    });
    return vertical;
  }

  private inheritFromSourceParent(
    elementStyle: CssCasc.ElementStyle
  ): { lang: string | null; elementStyle: CssCasc.ElementStyle } {
    let node = this.nodeContext.sourceNode;
    const styles = [];
    let lang = null;

    // TODO: this is hacky. We need to recover the path through the shadow
    // trees, but we do not have the full shadow tree structure at this point.
    // This code handles coming out of the shadow trees, but does not go back in
    // (through shadow:content element).
    let shadowContext = this.nodeContext.shadowContext;
    let steps = -1;
    while (node && node.nodeType == 1) {
      const shadowRoot = shadowContext && shadowContext.root == node;
      if (!shadowRoot || shadowContext.type == Vtree.ShadowType.ROOTLESS) {
        const styler = shadowContext
          ? (shadowContext.styler as CssStyler.AbstractStyler)
          : this.styler;
        const nodeStyle = styler.getStyle(node as Element, false);
        styles.push(nodeStyle);
        lang = lang || Base.getLangAttribute(node as Element);
      }
      if (shadowRoot) {
        node = shadowContext.owner;
        shadowContext = shadowContext.parentShadow;
      } else {
        node = node.parentNode;
        steps++;
      }
    }
    const isRoot = steps === 0;
    const fontSize = this.context.queryUnitSize("em", isRoot);
    const props = {
      "font-size": new CssCasc.CascadeValue(new Css.Numeric(fontSize, "px"), 0)
    } as CssCasc.ElementStyle;
    const inheritanceVisitor = new CssCasc.InheritanceVisitor(
      props,
      this.context
    );
    for (let i = styles.length - 1; i >= 0; --i) {
      const style = styles[i];
      const propList = [];
      for (const propName in style) {
        if (CssCasc.isInherited(propName)) {
          propList.push(propName);
        }
      }
      propList.sort(Css.processingOrderFn);
      for (const name of propList) {
        inheritanceVisitor.setPropName(name);
        const value = CssCasc.getProp(style, name);
        if (value.value !== Css.ident.inherit) {
          props[name] = value.filterValue(inheritanceVisitor);
        }
      }
    }
    for (const sname in elementStyle) {
      if (!CssCasc.isInherited(sname)) {
        props[sname] = elementStyle[sname];
      }
    }
    return { lang, elementStyle: props };
  }

  resolveURL(url: string): string {
    url = Base.resolveURL(url, this.xmldoc.url);
    return this.fallbackMap[url] || url;
  }

  inheritLangAttribute() {
    this.nodeContext.lang =
      Base.getLangAttribute(this.nodeContext.sourceNode as Element) ||
      (this.nodeContext.parent && this.nodeContext.parent.lang) ||
      this.nodeContext.lang;
  }

  transferPolyfilledInheritedProps(computedStyle: { [key: string]: Css.Val }) {
    const polyfilledInheritedProps = CssCasc.getPolyfilledInheritedProps().filter(
      name => computedStyle[name]
    );
    if (polyfilledInheritedProps.length) {
      let props = this.nodeContext.inheritedProps;
      if (this.nodeContext.parent) {
        props = this.nodeContext.inheritedProps = {};
        for (const n in this.nodeContext.parent.inheritedProps) {
          props[n] = this.nodeContext.parent.inheritedProps[n];
        }
      }
      polyfilledInheritedProps.forEach(name => {
        const value = computedStyle[name];
        if (value) {
          if (value instanceof Css.Int) {
            props[name] = (value as Css.Int).num;
          } else if (value instanceof Css.Ident) {
            props[name] = (value as Css.Ident).name;
          } else if (value instanceof Css.Numeric) {
            const numericVal = value as Css.Numeric;
            switch (numericVal.unit) {
              case "dpi":
              case "dpcm":
              case "dppx":
                props[name] =
                  numericVal.num * Exprs.defaultUnitSizes[numericVal.unit];
                break;
            }
          } else {
            props[name] = value;
          }
          delete computedStyle[name];
        }
      });
    }
  }

  resolveFormattingContext(
    nodeContext: Vtree.NodeContext,
    firstTime: boolean,
    display: Css.Ident,
    position: Css.Ident,
    float: Css.Ident,
    isRoot: boolean
  ) {
    const hooks: Plugin.ResolveFormattingContextHook[] = Plugin.getHooksForName(
      Plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT
    );
    for (let i = 0; i < hooks.length; i++) {
      const formattingContext = hooks[i](
        nodeContext,
        firstTime,
        display,
        position,
        float,
        isRoot
      );
      if (formattingContext) {
        nodeContext.formattingContext = formattingContext;
        return;
      }
    }
  }

  /**
   * @return holding true if children should be processed
   */
  private createElementView(
    firstTime: boolean,
    atUnforcedBreak: boolean
  ): Task.Result<boolean> {
    const self = this;
    let needToProcessChildren = true;
    const frame: Task.Frame<boolean> = Task.newFrame("createElementView");

    // Figure out element's styles
    let element = self.sourceNode as Element;
    const styler = self.nodeContext.shadowContext
      ? (self.nodeContext.shadowContext.styler as CssStyler.AbstractStyler)
      : self.styler;
    let elementStyle = styler.getStyle(element, false);
    if (!self.nodeContext.shadowContext) {
      const offset = this.xmldoc.getElementOffset(element);
      Matchers.NthFragmentMatcher.registerFragmentIndex(
        offset,
        self.nodeContext.fragmentIndex,
        0
      );
    }
    const computedStyle = {};
    if (!self.nodeContext.parent) {
      const inheritedValues = self.inheritFromSourceParent(elementStyle);
      elementStyle = inheritedValues.elementStyle;
      self.nodeContext.lang = inheritedValues.lang;
    }
    const floatReference =
      elementStyle["float-reference"] &&
      PageFloat.floatReferenceOf(
        elementStyle["float-reference"].value.toString()
      );
    if (
      self.nodeContext.parent &&
      floatReference &&
      PageFloat.isPageFloat(floatReference)
    ) {
      // Since a page float will be detached from a view node of its parent,
      // inherited properties need to be inherited from its source parent.
      const inheritedValues = self.inheritFromSourceParent(elementStyle);
      elementStyle = inheritedValues.elementStyle;
      self.nodeContext.lang = inheritedValues.lang;
    }
    self.nodeContext.vertical = self.computeStyle(
      self.nodeContext.vertical,
      self.nodeContext.direction === "rtl",
      elementStyle,
      computedStyle
    );
    styler.processContent(element, computedStyle);
    this.transferPolyfilledInheritedProps(computedStyle);
    this.inheritLangAttribute();
    if (computedStyle["direction"]) {
      self.nodeContext.direction = computedStyle["direction"].toString();
    }

    // Sort out the properties
    const flow = computedStyle["flow-into"];
    if (flow && flow.toString() != self.flowName) {
      // foreign flow, don't create a view
      frame.finish(false);
      return frame.result();
    }
    let display = computedStyle["display"];
    if (display === Css.ident.none) {
      // no content
      frame.finish(false);
      return frame.result();
    }
    const isRoot = self.nodeContext.parent == null;
    self.nodeContext.flexContainer = display === Css.ident.flex;
    self
      .createShadows(
        element,
        isRoot,
        elementStyle,
        computedStyle,
        styler,
        self.context,
        self.nodeContext.shadowContext
      )
      .then(shadowParam => {
        self.nodeContext.nodeShadow = shadowParam;
        const position = computedStyle["position"];
        let floatSide = computedStyle["float"];
        let clearSide = computedStyle["clear"];
        const writingMode = self.nodeContext.vertical
          ? Css.ident.vertical_rl
          : Css.ident.horizontal_tb;
        const parentWritingMode = self.nodeContext.parent
          ? self.nodeContext.parent.vertical
            ? Css.ident.vertical_rl
            : Css.ident.horizontal_tb
          : writingMode;
        const isFlowRoot = Display.isFlowRoot(element);
        self.nodeContext.establishesBFC = Display.establishesBFC(
          display,
          position,
          floatSide,
          computedStyle["overflow"],
          writingMode,
          parentWritingMode,
          isFlowRoot
        );
        self.nodeContext.containingBlockForAbsolute = Display.establishesCBForAbsolute(
          position
        );
        if (
          self.nodeContext.isInsideBFC() &&
          floatSide !== Css.ident.footnote &&
          !(floatReference && PageFloat.isPageFloat(floatReference))
        ) {
          // When the element is already inside a block formatting context
          // (except one from the root), float and clear can be controlled by
          // the browser and we don't need to care.
          floatSide = null;
          clearSide = null;
        }
        let floating =
          floatSide === Css.ident.left ||
          floatSide === Css.ident.right ||
          floatSide === Css.ident.top ||
          floatSide === Css.ident.bottom ||
          floatSide === Css.ident.inline_start ||
          floatSide === Css.ident.inline_end ||
          floatSide === Css.ident.block_start ||
          floatSide === Css.ident.block_end ||
          floatSide === Css.ident.snap_block ||
          floatSide === Css.ident.footnote;
        if (floatSide) {
          // Don't want to set it in view DOM CSS.
          delete computedStyle["float"];
          if (floatSide === Css.ident.footnote) {
            if (self.isFootnote) {
              // No footnotes inside footnotes. self is most likely the root
              // of the footnote body being rendered in footnote area. Treat
              // as block.
              floating = false;
              computedStyle["display"] = Css.ident.block;
            } else {
              computedStyle["display"] = Css.ident.inline;
            }
          }
        }
        if (clearSide) {
          if (clearSide === Css.ident.inherit) {
            if (self.nodeContext.parent && self.nodeContext.parent.clearSide) {
              clearSide = Css.getName(self.nodeContext.parent.clearSide);
            }
          }
          if (
            clearSide === Css.ident.left ||
            clearSide === Css.ident.right ||
            clearSide === Css.ident.top ||
            clearSide === Css.ident.bottom ||
            clearSide === Css.ident.both ||
            clearSide === Css.ident.all ||
            clearSide === Css.ident.same
          ) {
            delete computedStyle["clear"];
            if (
              computedStyle["display"] &&
              computedStyle["display"] != Css.ident.inline
            ) {
              self.nodeContext.clearSide = clearSide.toString();
            }
          }
        }
        const listItem =
          display === Css.ident.list_item &&
          computedStyle["ua-list-item-count"];
        if (
          floating ||
          (computedStyle["break-inside"] &&
            computedStyle["break-inside"] !== Css.ident.auto)
        ) {
          self.nodeContext.breakPenalty++;
        }
        if (
          display &&
          display !== Css.ident.inline &&
          Display.isInlineLevel(display)
        ) {
          // Don't break inside ruby, inline-block, etc.
          self.nodeContext.breakPenalty++;
        }
        self.nodeContext.inline =
          (!floating && !display) ||
          Display.isInlineLevel(display) ||
          Display.isRubyInternalDisplay(display);
        self.nodeContext.display = display ? display.toString() : "inline";
        self.nodeContext.floatSide = floating ? floatSide.toString() : null;
        self.nodeContext.floatReference =
          floatReference || PageFloat.FloatReference.INLINE;
        self.nodeContext.floatMinWrapBlock =
          computedStyle["float-min-wrap-block"] || null;
        self.nodeContext.columnSpan = computedStyle["column-span"];
        if (!self.nodeContext.inline) {
          const breakAfter = computedStyle["break-after"];
          if (breakAfter) {
            self.nodeContext.breakAfter = breakAfter.toString();
          }
          const breakBefore = computedStyle["break-before"];
          if (breakBefore) {
            self.nodeContext.breakBefore = breakBefore.toString();
          }
        }
        self.nodeContext.verticalAlign =
          (computedStyle["vertical-align"] &&
            computedStyle["vertical-align"].toString()) ||
          "baseline";
        self.nodeContext.captionSide =
          (computedStyle["caption-side"] &&
            computedStyle["caption-side"].toString()) ||
          "top";
        const borderCollapse = computedStyle["border-collapse"];
        if (!borderCollapse || borderCollapse === Css.getName("separate")) {
          const borderSpacing = computedStyle["border-spacing"];
          let inlineBorderSpacing;
          let blockBorderSpacing;
          if (borderSpacing) {
            if (borderSpacing.isSpaceList()) {
              inlineBorderSpacing = borderSpacing.values[0];
              blockBorderSpacing = borderSpacing.values[1];
            } else {
              inlineBorderSpacing = blockBorderSpacing = borderSpacing;
            }
            if (inlineBorderSpacing.isNumeric()) {
              self.nodeContext.inlineBorderSpacing = Css.toNumber(
                inlineBorderSpacing,
                self.context
              );
            }
            if (blockBorderSpacing.isNumeric()) {
              self.nodeContext.blockBorderSpacing = Css.toNumber(
                blockBorderSpacing,
                self.context
              );
            }
          }
        }
        self.nodeContext.footnotePolicy = computedStyle["footnote-policy"];
        const firstPseudo = computedStyle["x-first-pseudo"];
        if (firstPseudo) {
          const outerPseudo = self.nodeContext.parent
            ? self.nodeContext.parent.firstPseudo
            : null;
          self.nodeContext.firstPseudo = new Vtree.FirstPseudo(
            outerPseudo,
            /** Css.Int */
            firstPseudo.num
          );
        }
        if (!self.nodeContext.inline) {
          self.processAfterIfcontinues(
            element,
            elementStyle,
            styler,
            self.context
          );
        }
        const whitespace = computedStyle["white-space"];
        if (whitespace) {
          const whitespaceValue = Vtree.whitespaceFromPropertyValue(
            whitespace.toString()
          );
          if (whitespaceValue !== null) {
            self.nodeContext.whitespace = whitespaceValue;
          }
        }
        const hyphenateCharacter = computedStyle["hyphenate-character"];
        if (hyphenateCharacter && hyphenateCharacter !== Css.ident.auto) {
          self.nodeContext.hyphenateCharacter = hyphenateCharacter.str;
        }
        const wordBreak = computedStyle["word-break"];
        const overflowWrap = computedStyle["overflow-wrap"] || ["word-wrap"];
        self.nodeContext.breakWord =
          wordBreak === Css.ident.break_all ||
          overflowWrap === Css.ident.break_word;

        // Resolve formatting context
        self.resolveFormattingContext(
          self.nodeContext,
          firstTime,
          display,
          position,
          floatSide,
          isRoot
        );
        if (
          self.nodeContext.parent &&
          self.nodeContext.parent.formattingContext
        ) {
          firstTime = self.nodeContext.parent.formattingContext.isFirstTime(
            self.nodeContext,
            firstTime
          );
        }
        if (!self.nodeContext.inline) {
          self.nodeContext.repeatOnBreak = self.processRepeatOnBreak(
            computedStyle
          );
          self.findAndProcessRepeatingElements(element, styler);
        }

        // Create the view element
        let custom = false;
        let inner = null;
        const fetchers = [];
        let ns = element.namespaceURI;
        let tag = element.localName;
        if (ns == Base.NS.XHTML) {
          if (
            tag == "html" ||
            tag == "body" ||
            tag == "script" ||
            tag == "link" ||
            tag == "meta"
          ) {
            tag = "div";
          } else if (tag == "vide_") {
            tag = "video";
          } else if (tag == "audi_") {
            tag = "audio";
          } else if (tag == "object") {
            custom = !!self.customRenderer;
          }
          if (element.getAttribute(PseudoElement.PSEUDO_ATTR)) {
            if (
              elementStyle["content"] &&
              elementStyle["content"].value &&
              elementStyle["content"].value.url
            ) {
              tag = "img";
            }
          }
        } else if (ns == Base.NS.epub) {
          tag = "span";
          ns = Base.NS.XHTML;
        } else if (ns == Base.NS.FB2) {
          ns = Base.NS.XHTML;
          if (tag == "image") {
            tag = "div";
            const imageRef = element.getAttributeNS(Base.NS.XLINK, "href");
            if (imageRef && imageRef.charAt(0) == "#") {
              const imageBinary = self.xmldoc.getElement(imageRef);
              if (imageBinary) {
                inner = self.createElement(ns, "img");
                const mediaType =
                  imageBinary.getAttribute("content-type") || "image/jpeg";
                const innerSrc = `data:${mediaType};base64,${imageBinary.textContent.replace(
                  /[ \t\n\t]/g,
                  ""
                )}`;
                fetchers.push(TaskUtil.loadElement(inner, innerSrc));
              }
            }
          } else {
            tag = fb2Remap[tag];
          }
          if (!tag) {
            tag = self.nodeContext.inline ? "span" : "div";
          }
        } else if (ns == Base.NS.NCX) {
          ns = Base.NS.XHTML;
          if (tag == "ncx" || tag == "navPoint") {
            tag = "div";
          } else if (tag == "navLabel") {
            // Cheat here. Translate source to HTML, so it will plug
            // in into the rest of the pipeline.
            tag = "span";
            const navParent = element.parentNode;
            if (navParent) {
              // find the content element
              let href = null;
              for (let c: Node = navParent.firstChild; c; c = c.nextSibling) {
                if (c.nodeType != 1) {
                  continue;
                }
                const childElement = c as Element;
                if (
                  childElement.namespaceURI == Base.NS.NCX &&
                  childElement.localName == "content"
                ) {
                  href = childElement.getAttribute("src");
                  break;
                }
              }
              if (href) {
                tag = "a";
                element = element.ownerDocument.createElementNS(ns, "a");
                element.setAttribute("href", href);
              }
            }
          } else {
            tag = "span";
          }
        } else if (ns == Base.NS.SHADOW) {
          ns = Base.NS.XHTML;
          tag = self.nodeContext.inline ? "span" : "div";
        } else {
          custom = !!self.customRenderer;
        }
        if (listItem) {
          if (firstTime) {
            tag = "li";
          } else {
            tag = "div";
            display = Css.ident.block;
            computedStyle["display"] = display;
          }
        } else if (tag == "body" || tag == "li") {
          tag = "div";
        } else if (tag == "q") {
          tag = "span";
        } else if (tag == "a") {
          const hp = computedStyle["hyperlink-processing"];
          if (hp && hp.toString() != "normal") {
            tag = "span";
          }
        }
        if (computedStyle["behavior"]) {
          const behavior = computedStyle["behavior"].toString();
          if (behavior != "none" && self.customRenderer) {
            custom = true;
          }
        }
        if (
          (element as HTMLElement).dataset &&
          element.getAttribute("data-math-typeset") === "true"
        ) {
          custom = true;
        }
        let elemResult;
        if (custom) {
          const parentNode = self.nodeContext.parent
            ? self.nodeContext.parent.viewNode
            : null;
          elemResult = self.customRenderer(
            element,
            parentNode as Element,
            computedStyle
          );
        } else {
          elemResult = Task.newResult(null);
        }
        elemResult.then(result => {
          if (result) {
            if (custom) {
              needToProcessChildren =
                result.getAttribute("data-adapt-process-children") == "true";
            }
          } else {
            result = self.createElement(ns, tag);
          }
          if (tag == "a") {
            result.addEventListener("click", self.page.hrefHandler, false);
          }
          if (inner) {
            self.applyPseudoelementStyle(self.nodeContext, "inner", inner);
            result.appendChild(inner);
          }
          if (
            result.localName == "iframe" &&
            result.namespaceURI == Base.NS.XHTML
          ) {
            initIFrame(result as HTMLIFrameElement);
          }
          const imageResolution = self.nodeContext.inheritedProps[
            "image-resolution"
          ] as number | undefined;
          const images: {
            image: HTMLElement;
            element: HTMLElement;
            fetcher: TaskUtil.Fetcher<string>;
          }[] = [];
          const cssWidth = computedStyle["width"];
          const cssHeight = computedStyle["height"];
          const attrWidth = element.getAttribute("width");
          const attrHeight = element.getAttribute("height");
          const hasAutoWidth =
            cssWidth === Css.ident.auto || (!cssWidth && !attrWidth);
          const hasAutoHeight =
            cssHeight === Css.ident.auto || (!cssHeight && !attrHeight);
          if (element.namespaceURI != Base.NS.FB2 || tag == "td") {
            const attributes = element.attributes;
            const attributeCount = attributes.length;
            let delayedSrc = null;
            for (let i = 0; i < attributeCount; i++) {
              const attribute = attributes[i];
              const attributeNS = attribute.namespaceURI;
              let attributeName = attribute.localName;
              let attributeValue = attribute.nodeValue;
              if (!attributeNS) {
                if (attributeName.match(/^on/)) {
                  continue; // don't propagate JavaScript code
                }
                if (attributeName == "style") {
                  continue; // we do styling ourselves
                }
                if (attributeName == "id" || attributeName == "name") {
                  // Propagate transformed ids and collect them on the page
                  // (only first time).
                  if (firstTime) {
                    attributeValue = self.documentURLTransformer.transformFragment(
                      attributeValue,
                      self.xmldoc.url
                    );
                    result.setAttribute(attributeName, attributeValue);
                    self.page.registerElementWithId(result, attributeValue);
                    continue;
                  }
                }

                // TODO: understand the element we are working with.
                if (
                  attributeName == "src" ||
                  attributeName == "href" ||
                  attributeName == "poster"
                ) {
                  attributeValue = self.resolveURL(attributeValue);
                  if (attributeName === "href") {
                    attributeValue = self.documentURLTransformer.transformURL(
                      attributeValue,
                      self.xmldoc.url
                    );
                  }
                } else if (attributeName == "srcset") {
                  attributeValue = attributeValue
                    .split(",")
                    .map(value => self.resolveURL(value.trim()))
                    .join(",");
                }
                if (
                  attributeName === "poster" &&
                  tag === "video" &&
                  ns === Base.NS.XHTML &&
                  hasAutoWidth &&
                  hasAutoHeight
                ) {
                  const image = new Image();
                  const fetcher = TaskUtil.loadElement(image, attributeValue);
                  fetchers.push(fetcher);
                  images.push({ image, element: result, fetcher });
                }
              } else if (attributeNS == "http://www.w3.org/2000/xmlns/") {
                continue; // namespace declaration (in Firefox)
              } else if (attributeNS == Base.NS.XLINK) {
                if (attributeName == "href") {
                  attributeValue = self.resolveURL(attributeValue);
                }
              }
              if (ns == Base.NS.SVG && /^[A-Z\-]+$/.test(attributeName)) {
                // Workaround for Edge bug
                // See
                // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/5579311/
                attributeName = attributeName.toLowerCase();
              }
              if (self.isSVGUrlAttribute(attributeName)) {
                attributeValue = Urls.transformURIs(
                  attributeValue,
                  self.xmldoc.url,
                  self.documentURLTransformer
                );
              }
              if (attributeNS) {
                const attributePrefix = namespacePrefixMap[attributeNS];
                if (attributePrefix) {
                  attributeName = `${attributePrefix}:${attributeName}`;
                }
              }
              if (
                attributeName == "src" &&
                !attributeNS &&
                (tag == "img" || tag == "input") &&
                ns == Base.NS.XHTML
              ) {
                // HTML img element should start loading only once all
                // attributes are assigned.
                delayedSrc = attributeValue;
              } else if (
                attributeName == "href" &&
                tag == "image" &&
                ns == Base.NS.SVG &&
                attributeNS == Base.NS.XLINK
              ) {
                self.page.fetchers.push(
                  TaskUtil.loadElement(result, attributeValue)
                );
              } else {
                // When the document is not XML document (e.g. non-XML HTML)
                // attributeNS can be null
                if (attributeNS) {
                  result.setAttributeNS(
                    attributeNS,
                    attributeName,
                    attributeValue
                  );
                } else {
                  result.setAttribute(attributeName, attributeValue);
                }
              }
            }
            if (delayedSrc) {
              const image = tag === "input" ? new Image() : result;
              const imageFetcher = TaskUtil.loadElement(image, delayedSrc);
              if (image !== result) {
                result.src = delayedSrc;
              }
              if (!hasAutoWidth && !hasAutoHeight) {
                // No need to wait for the image, does not affect layout
                self.page.fetchers.push(imageFetcher);
              } else {
                if (
                  hasAutoWidth &&
                  hasAutoHeight &&
                  imageResolution &&
                  imageResolution !== 1
                ) {
                  images.push({
                    image,
                    element: result,
                    fetcher: imageFetcher
                  });
                }
                fetchers.push(imageFetcher);
              }
            }
          }
          delete computedStyle["content"];
          const listStyleImage = computedStyle["list-style-image"];
          if (listStyleImage && listStyleImage instanceof Css.URL) {
            const listStyleURL = (listStyleImage as Css.URL).url;
            fetchers.push(TaskUtil.loadElement(new Image(), listStyleURL));
          }
          self.preprocessElementStyle(computedStyle);
          self.applyComputedStyles(result, computedStyle);
          if (!self.nodeContext.inline) {
            let blackList = null;
            if (!firstTime) {
              if (
                self.nodeContext.inheritedProps["box-decoration-break"] !==
                "clone"
              ) {
                blackList = self.nodeContext.vertical
                  ? frontEdgeBlackListVert
                  : frontEdgeBlackListHor;
              } else {
                // When box-decoration-break: clone, cloned margins are always
                // truncated to zero.
                blackList = self.nodeContext.vertical
                  ? frontEdgeUnforcedBreakBlackListVert
                  : frontEdgeUnforcedBreakBlackListHor;
              }
            } else if (atUnforcedBreak) {
              blackList = self.nodeContext.vertical
                ? frontEdgeUnforcedBreakBlackListVert
                : frontEdgeUnforcedBreakBlackListHor;
            }
            if (blackList) {
              for (const propName in blackList) {
                Base.setCSSProperty(result, propName, blackList[propName]);
              }
            }
          }
          if (listItem) {
            result.setAttribute(
              "value",
              computedStyle["ua-list-item-count"].stringValue()
            );
          }
          self.viewNode = result;
          if (fetchers.length) {
            TaskUtil.waitForFetchers(fetchers).then(() => {
              if (imageResolution > 0) {
                self.modifyElemDimensionWithImageResolution(
                  images,
                  imageResolution,
                  computedStyle,
                  self.nodeContext.vertical
                );
              }
              frame.finish(needToProcessChildren);
            });
          } else {
            frame.timeSlice().then(() => {
              frame.finish(needToProcessChildren);
            });
          }
        });
      });
    return frame.result();
  }

  private processAfterIfcontinues(
    element: Element,
    cascStyle: CssCasc.ElementStyle,
    styler: CssStyler.AbstractStyler,
    context: Exprs.Context
  ) {
    const pseudoMap = this.getPseudoMap(
      cascStyle,
      this.regionIds,
      this.isFootnote,
      this.nodeContext,
      context
    );
    if (!pseudoMap) {
      return;
    }
    if (
      pseudoMap["after-if-continues"] &&
      pseudoMap["after-if-continues"]["content"]
    ) {
      const shadowStyler = new PseudoElement.PseudoelementStyler(
        element,
        cascStyle,
        styler,
        context,
        this.exprContentListener
      );
      this.nodeContext.afterIfContinues = new Selectors.AfterIfContinues(
        element,
        shadowStyler
      );
    }
  }

  /**
   * @return isSVGUrlAttribute
   */
  isSVGUrlAttribute(attributeName: string): boolean {
    return ViewFactory.SVG_URL_ATTRIBUTES.includes(attributeName.toLowerCase());
  }

  modifyElemDimensionWithImageResolution(
    images: {
      image: HTMLElement;
      element: HTMLElement;
      fetcher: TaskUtil.Fetcher<string>;
    }[],
    imageResolution: number,
    computedStyle: { [key: string]: Css.Val },
    isVertical: boolean
  ) {
    const self = this;
    images.forEach(param => {
      if (param.fetcher.get().get() === "load") {
        const img = param.image;
        let scaledWidth = (img as HTMLImageElement).width / imageResolution;
        let scaledHeight = (img as HTMLImageElement).height / imageResolution;
        const elem = param.element;
        if (scaledWidth > 0 && scaledHeight > 0) {
          if (computedStyle["box-sizing"] === Css.ident.border_box) {
            if (computedStyle["border-left-style"] !== Css.ident.none) {
              scaledWidth += Css.toNumber(
                computedStyle["border-left-width"],
                self.context
              );
            }
            if (computedStyle["border-right-style"] !== Css.ident.none) {
              scaledWidth += Css.toNumber(
                computedStyle["border-right-width"],
                self.context
              );
            }
            if (computedStyle["border-top-style"] !== Css.ident.none) {
              scaledHeight += Css.toNumber(
                computedStyle["border-top-width"],
                self.context
              );
            }
            if (computedStyle["border-bottom-style"] !== Css.ident.none) {
              scaledHeight += Css.toNumber(
                computedStyle["border-bottom-width"],
                self.context
              );
            }
          }
          if (imageResolution > 1) {
            const maxWidth = computedStyle["max-width"] || Css.ident.none;
            const maxHeight = computedStyle["max-height"] || Css.ident.none;
            if (maxWidth === Css.ident.none && maxHeight === Css.ident.none) {
              Base.setCSSProperty(elem, "max-width", `${scaledWidth}px`);
            } else if (
              maxWidth !== Css.ident.none &&
              maxHeight === Css.ident.none
            ) {
              Base.setCSSProperty(elem, "width", `${scaledWidth}px`);
            } else if (
              maxWidth === Css.ident.none &&
              maxHeight !== Css.ident.none
            ) {
              Base.setCSSProperty(elem, "height", `${scaledHeight}px`);
            } else {
              // maxWidth != none && maxHeight != none
              Asserts.assert(maxWidth.isNumeric());
              Asserts.assert(maxHeight.isNumeric());
              const numericMaxWidth = maxWidth as Css.Numeric;
              const numericMaxHeight = maxHeight as Css.Numeric;
              if (numericMaxWidth.unit !== "%") {
                Base.setCSSProperty(
                  elem,
                  "max-width",
                  `${Math.min(
                    scaledWidth,
                    Css.toNumber(numericMaxWidth, self.context)
                  )}px`
                );
              } else if (numericMaxHeight.unit !== "%") {
                Base.setCSSProperty(
                  elem,
                  "max-height",
                  `${Math.min(
                    scaledHeight,
                    Css.toNumber(numericMaxHeight, self.context)
                  )}px`
                );
              } else {
                if (isVertical) {
                  Base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                } else {
                  Base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                }
              }
            }
          } else if (imageResolution < 1) {
            const minWidth = computedStyle["min-width"] || Css.numericZero;
            const minHeight = computedStyle["min-height"] || Css.numericZero;
            Asserts.assert(minWidth.isNumeric());
            Asserts.assert(minWidth.isNumeric());
            const numericMinWidth = minWidth as Css.Numeric;
            const numericMinHeight = minHeight as Css.Numeric;
            if (numericMinWidth.num === 0 && numericMinHeight.num === 0) {
              Base.setCSSProperty(elem, "min-width", `${scaledWidth}px`);
            } else if (
              numericMinWidth.num !== 0 &&
              numericMinHeight.num === 0
            ) {
              Base.setCSSProperty(elem, "width", `${scaledWidth}px`);
            } else if (
              numericMinWidth.num === 0 &&
              numericMinHeight.num !== 0
            ) {
              Base.setCSSProperty(elem, "height", `${scaledHeight}px`);
            } else {
              // minWidth != 0 && minHeight != 0
              if (numericMinWidth.unit !== "%") {
                Base.setCSSProperty(
                  elem,
                  "min-width",
                  `${Math.max(
                    scaledWidth,
                    Css.toNumber(numericMinWidth, self.context)
                  )}px`
                );
              } else if (numericMinHeight.unit !== "%") {
                Base.setCSSProperty(
                  elem,
                  "min-height",
                  `${Math.max(
                    scaledHeight,
                    Css.toNumber(numericMinHeight, self.context)
                  )}px`
                );
              } else {
                if (isVertical) {
                  Base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                } else {
                  Base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                }
              }
            }
          }
        }
      }
    });
  }

  private preprocessElementStyle(computedStyle: { [key: string]: Css.Val }) {
    const self = this;
    const hooks: Plugin.PreProcessElementStyleHook[] = Plugin.getHooksForName(
      Plugin.HOOKS.PREPROCESS_ELEMENT_STYLE
    );
    hooks.forEach(hook => {
      hook(self.nodeContext, computedStyle);
    });
  }

  private findAndProcessRepeatingElements(
    element: Element,
    styler: CssStyler.AbstractStyler
  ) {
    for (
      let child: Node = element.firstChild;
      child;
      child = child.nextSibling
    ) {
      if (child.nodeType !== 1) {
        continue;
      }
      const computedStyle = {};
      const elementStyle = styler.getStyle(child as Element, false);
      this.computeStyle(
        this.nodeContext.vertical,
        this.nodeContext.direction === "rtl",
        elementStyle,
        computedStyle
      );
      const processRepeatOnBreak = this.processRepeatOnBreak(computedStyle);
      if (!processRepeatOnBreak) {
        continue;
      }
      if (
        this.nodeContext.formattingContext instanceof
          RepetitiveElementImpl.RepetitiveElementsOwnerFormattingContext &&
        !this.nodeContext.belongsTo(this.nodeContext.formattingContext)
      ) {
        return;
      }
      const parent = this.nodeContext.parent;
      const parentFormattingContext = parent && parent.formattingContext;
      this.nodeContext.formattingContext = new RepetitiveElementImpl.RepetitiveElementsOwnerFormattingContext(
        parentFormattingContext,
        this.nodeContext.sourceNode as Element
      );
      (this.nodeContext
        .formattingContext as RepetitiveElementImpl.RepetitiveElementsOwnerFormattingContext).initializeRepetitiveElements(
        this.nodeContext.vertical
      );
      return;
    }
  }

  private processRepeatOnBreak(computedStyle: { [key: string]: Css.Val }) {
    let repeatOnBreak = computedStyle["repeat-on-break"];
    if (repeatOnBreak !== Css.ident.none) {
      if (repeatOnBreak === Css.ident.auto) {
        if (computedStyle["display"] === Css.ident.table_header_group) {
          repeatOnBreak = Css.ident.header;
        } else if (computedStyle["display"] === Css.ident.table_footer_group) {
          repeatOnBreak = Css.ident.footer;
        } else {
          repeatOnBreak = Css.ident.none;
        }
      }
      if (repeatOnBreak && repeatOnBreak !== Css.ident.none) {
        return repeatOnBreak.toString();
      }
    }
    return null;
  }

  private createTextNodeView(): Task.Result<boolean> {
    const self = this;
    const frame: Task.Frame<boolean> = Task.newFrame("createTextNodeView");
    this.preprocessTextContent().then(() => {
      const offsetInNode = self.offsetInNode || 0;
      const textContent = Diff.restoreNewText(
        self.nodeContext.preprocessedTextContent
      ).substr(offsetInNode);
      self.viewNode = document.createTextNode(textContent);
      frame.finish(true);
    });
    return frame.result();
  }

  private preprocessTextContent(): Task.Result<boolean> {
    if (this.nodeContext.preprocessedTextContent != null) {
      return Task.newResult(true);
    }
    const self = this;
    let originl;
    let textContent = (originl = self.sourceNode.textContent);
    const frame: Task.Frame<boolean> = Task.newFrame("preprocessTextContent");
    const hooks: Plugin.PreProcessTextContentHook[] = Plugin.getHooksForName(
      Plugin.HOOKS.PREPROCESS_TEXT_CONTENT
    );
    let index = 0;
    frame
      .loop(() => {
        if (index >= hooks.length) {
          return Task.newResult(false);
        }
        return hooks[index++](self.nodeContext, textContent).thenAsync(
          processedText => {
            textContent = processedText;
            return Task.newResult(true);
          }
        );
      })
      .then(() => {
        self.nodeContext.preprocessedTextContent = Diff.diffChars(
          originl,
          textContent
        );
        frame.finish(true);
      });
    return frame.result();
  }

  /**
   * @return holding true if children should be processed
   */
  createNodeView(
    firstTime: boolean,
    atUnforcedBreak: boolean
  ): Task.Result<boolean> {
    const self = this;
    const frame: Task.Frame<boolean> = Task.newFrame("createNodeView");
    let result;
    let needToProcessChildren = true;
    if (self.sourceNode.nodeType == 1) {
      result = self.createElementView(firstTime, atUnforcedBreak);
    } else {
      if (self.sourceNode.nodeType == 8) {
        self.viewNode = null; // comment node
        result = Task.newResult(true);
      } else {
        result = self.createTextNodeView();
      }
    }
    result.then(processChildren => {
      needToProcessChildren = processChildren;
      self.nodeContext.viewNode = self.viewNode;
      if (self.viewNode) {
        const parent = self.nodeContext.parent
          ? self.nodeContext.parent.viewNode
          : self.viewRoot;
        if (parent) {
          parent.appendChild(self.viewNode);
        }
      }
      frame.finish(needToProcessChildren);
    });
    return frame.result();
  }

  /**
   * @override
   */
  setCurrent(
      nodeContext: Vtree.NodeContext,
      firstTime: boolean,
      atUnforcedBreak?: boolean
    ): Task.Result<boolean> {
    this.nodeContext = nodeContext;
    if (nodeContext) {
      this.sourceNode = nodeContext.sourceNode;
      this.offsetInNode = nodeContext.offsetInNode;
    } else {
      this.sourceNode = null;
      this.offsetInNode = -1;
    }
    this.viewNode = null;
    if (this.nodeContext) {
      return this.createNodeView(firstTime, !!atUnforcedBreak);
    }
    return Task.newResult(true);
  }

  processShadowContent(pos) {
    if (
      pos.shadowContext == null ||
      pos.sourceNode.localName != "content" ||
      pos.sourceNode.namespaceURI != Base.NS.SHADOW
    ) {
      return pos;
    }
    const boxOffset = pos.boxOffset;
    const shadow = pos.shadowContext;
    const parent = pos.parent;

    // content that will be inserted
    let contentNode;
    let contentShadowType;
    let contentShadow;
    if (shadow.subShadow) {
      contentShadow = shadow.subShadow;
      contentNode = shadow.root;
      contentShadowType = shadow.type;
      if (contentShadowType == Vtree.ShadowType.ROOTLESS) {
        contentNode = contentNode.firstChild;
      }
    } else {
      contentShadow = shadow.parentShadow;
      contentNode = shadow.owner.firstChild;
      contentShadowType = Vtree.ShadowType.ROOTLESS;
    }
    const nextSibling = pos.sourceNode.nextSibling;
    if (nextSibling) {
      pos.sourceNode = nextSibling;
      pos.resetView();
    } else if (pos.shadowSibling) {
      pos = pos.shadowSibling;
    } else if (contentNode) {
      pos = null;
    } else {
      pos = pos.parent.modify();
      pos.after = true;
    }
    if (contentNode) {
      const r = new Vtree.NodeContext(contentNode, parent, boxOffset);
      r.shadowContext = contentShadow;
      r.shadowType = contentShadowType;
      r.shadowSibling = pos;
      return r;
    }
    pos.boxOffset = boxOffset;
    return pos;
  }

  private nextPositionInTree(pos: Vtree.NodeContext): Vtree.NodeContext {
    let boxOffset = pos.boxOffset + 1; // offset for the next position
    if (pos.after) {
      // root, that was the last possible position
      if (!pos.parent) {
        return null;
      }

      // we are done with this sourceNode, see if there is a next sibling,
      // unless this is the root of the shadow tree
      if (pos.shadowType != Vtree.ShadowType.ROOTED) {
        const next = pos.sourceNode.nextSibling;
        if (next) {
          pos = pos.modify();

          // keep shadowType
          pos.boxOffset = boxOffset;
          pos.sourceNode = next;
          pos.resetView();
          return this.processShadowContent(pos);
        }
      }

      // if no viable siblings, check if there are shadow siblings
      if (pos.shadowSibling) {
        // our next position is the element after shadow:content in the parent
        // shadow tree
        pos = pos.shadowSibling.modify();
        pos.boxOffset = boxOffset;
        return pos;
      }

      // if not rootless shadow, move to the "after" position for the parent
      pos = pos.parent.modify();
      pos.boxOffset = boxOffset;
      pos.after = true;
      return pos;
    } else {
      // any shadow trees?
      if (pos.nodeShadow) {
        let shadowNode: Node | null = pos.nodeShadow.root;
        if (pos.nodeShadow.type == Vtree.ShadowType.ROOTLESS) {
          shadowNode = shadowNode.firstChild;
        }
        if (shadowNode) {
          const sr = new Vtree.NodeContext(shadowNode, pos, boxOffset);
          sr.shadowContext = pos.nodeShadow;
          sr.shadowType = pos.nodeShadow.type;
          return this.processShadowContent(sr);
        }
      }

      // any children?
      const child = pos.sourceNode.firstChild;
      if (child) {
        return this.processShadowContent(
          new Vtree.NodeContext(child, pos, boxOffset)
        );
      }

      // no children - was there text content?
      if (pos.sourceNode.nodeType != 1) {
        const content = Diff.restoreNewText(pos.preprocessedTextContent);
        boxOffset += content.length - 1 - pos.offsetInNode;
      }
      pos = pos.modify();
      pos.boxOffset = boxOffset;
      pos.after = true;
      return pos;
    }
  }

  isTransclusion(
    element: Element,
    elementStyle: CssCasc.ElementStyle,
    transclusionType: string | null
  ) {
    const proc = CssCasc.getProp(elementStyle, "hyperlink-processing");
    if (!proc) {
      return false;
    }
    const prop = proc.evaluate(this.context, "hyperlink-processing");
    if (!prop) {
      return false;
    }
    return prop.toString() == transclusionType;
  }

  /**
   * @override
   */
  nextInTree(position: Vtree.NodeContext,
    atUnforcedBreak?: boolean
  ): Task.Result<Vtree.NodeContext> {
    let nodeContext = this.nextPositionInTree(position);
    if (!nodeContext || nodeContext.after) {
      return Task.newResult(nodeContext);
    }
    const frame: Task.Frame<Vtree.NodeContext> = Task.newFrame("nextInTree");
    this.setCurrent(nodeContext, true, atUnforcedBreak).then(
      processChildren => {
        if (!nodeContext.viewNode || !processChildren) {
          nodeContext = nodeContext.modify();
          nodeContext.after = true; // skip
          if (!nodeContext.viewNode) {
            nodeContext.inline = true;
          }
        }
        this.dispatchEvent({ type: "nextInTree", nodeContext } as any);
        frame.finish(nodeContext);
      }
    );
    return frame.result();
  }

  addImageFetchers(bg: Css.Val) {
    if (bg instanceof Css.CommaList) {
      const values = (bg as Css.CommaList).values;
      for (let i = 0; i < values.length; i++) {
        this.addImageFetchers(values[i]);
      }
    } else if (bg instanceof Css.URL) {
      const url = (bg as Css.URL).url;
      this.page.fetchers.push(TaskUtil.loadElement(new Image(), url));
    }
  }

  applyComputedStyles(
    target: Element,
    computedStyle: { [key: string]: Css.Val }
  ) {
    const bg = computedStyle["background-image"];
    if (bg) {
      this.addImageFetchers(bg);
    }
    const isRelativePositioned =
      computedStyle["position"] === Css.ident.relative;
    for (const propName in computedStyle) {
      if (propertiesNotPassedToDOM[propName]) {
        continue;
      }
      let value = computedStyle[propName];
      value = value.visit(
        new CssProp.UrlTransformVisitor(
          this.xmldoc.url,
          this.documentURLTransformer
        )
      );
      if (
        value.isNumeric() &&
        Exprs.needUnitConversion((value as Css.Numeric).unit)
      ) {
        // font-size for the root element is already converted to px
        value = Css.convertNumericToPx(value, this.context);
      }
      if (
        Vtree.delayedProps[propName] ||
        (isRelativePositioned &&
          Vtree.delayedPropsIfRelativePositioned[propName])
      ) {
        // Set it after page layout is done.
        this.page.delayedItems.push(
          new Vtree.DelayedItem(target, propName, value)
        );
        continue;
      }
      Base.setCSSProperty(target, propName, value.toString());
    }
  }

  /**
   * @override
   */
  applyPseudoelementStyle(
      nodeContext: Vtree.NodeContext,
      pseudoName: string,
      target: Element
    ): void {
    if (nodeContext.after) {
      return;
    }
    const element = this.sourceNode as Element;
    const styler = nodeContext.shadowContext
      ? (nodeContext.shadowContext.styler as CssStyler.AbstractStyler)
      : this.styler;
    let elementStyle = styler.getStyle(element, false);
    const pseudoMap = CssCasc.getStyleMap(elementStyle, "_pseudos");
    if (!pseudoMap) {
      return;
    }
    elementStyle = pseudoMap[pseudoName];
    if (!elementStyle) {
      return;
    }
    const computedStyle = {};
    nodeContext.vertical = this.computeStyle(
      nodeContext.vertical,
      nodeContext.direction === "rtl",
      elementStyle,
      computedStyle
    );
    const content = computedStyle["content"];
    if (Vtree.nonTrivialContent(content)) {
      content.visit(
        new Vtree.ContentPropertyHandler(
          target,
          this.context,
          content,
          this.exprContentListener
        )
      );
      delete computedStyle["content"];
    }
    this.applyComputedStyles(target, computedStyle);
  }

  /**
   * @override
   */
  peelOff(
      nodeContext: Vtree.NodeContext,
      nodeOffset: number
    ): Task.Result<Vtree.NodeContext> {
    const frame: Task.Frame<Vtree.NodeContext> = Task.newFrame("peelOff");
    const firstPseudo = nodeContext.firstPseudo;
    let offsetInNode = nodeContext.offsetInNode;
    const after = nodeContext.after;
    if (nodeOffset > 0) {
      const text = nodeContext.viewNode.textContent;
      nodeContext.viewNode.textContent = text.substr(0, nodeOffset);
      offsetInNode += nodeOffset;
    } else if (!after && nodeContext.viewNode && offsetInNode == 0) {
      const parent = nodeContext.viewNode.parentNode;
      if (parent) {
        parent.removeChild(nodeContext.viewNode);
      }
    }
    const boxOffset = nodeContext.boxOffset + nodeOffset;
    const arr = [];
    while (nodeContext.firstPseudo === firstPseudo) {
      arr.push(nodeContext);
      nodeContext = nodeContext.parent;
    }
    let pn = arr.pop(); // container for that pseudoelement
    let shadowSibling = pn.shadowSibling;
    const self = this;
    frame
      .loop(() => {
        while (arr.length > 0) {
          pn = arr.pop();
          nodeContext = new Vtree.NodeContext(
            pn.sourceNode,
            nodeContext,
            boxOffset
          );
          if (arr.length == 0) {
            nodeContext.offsetInNode = offsetInNode;
            nodeContext.after = after;
          }
          nodeContext.shadowType = pn.shadowType;
          (nodeContext.shadowContext = pn.shadowContext),
            (nodeContext.nodeShadow = pn.nodeShadow);
          nodeContext.shadowSibling = pn.shadowSibling
            ? pn.shadowSibling
            : shadowSibling;
          shadowSibling = null;
          const result = self.setCurrent(nodeContext, false);
          if (result.isPending()) {
            return result;
          }
        }
        return Task.newResult(false);
      })
      .then(() => {
        frame.finish(nodeContext);
      });
    return frame.result();
  }

  createElement(ns: string, tag: string): Element {
    if (ns == Base.NS.XHTML) {
      return this.document.createElement(tag);
    }
    return this.document.createElementNS(ns, tag);
  }

  /**
   * @override
   */
  applyFootnoteStyle(
      vertical: boolean,
      rtl: boolean,
      target: Element
    ): boolean {
    const computedStyle = {};
    const pseudoMap = CssCasc.getStyleMap(this.footnoteStyle, "_pseudos");
    vertical = this.computeStyle(
      vertical,
      rtl,
      this.footnoteStyle,
      computedStyle
    );
    if (pseudoMap && pseudoMap["before"]) {
      const childComputedStyle = {};
      const span = this.createElement(Base.NS.XHTML, "span");
      PseudoElement.setPseudoName(span, "before");
      target.appendChild(span);
      this.computeStyle(vertical, rtl, pseudoMap["before"], childComputedStyle);
      delete childComputedStyle["content"];
      this.applyComputedStyles(span, childComputedStyle);
    }
    delete computedStyle["content"];
    this.applyComputedStyles(target, computedStyle);
    return vertical;
  }

  /**
   * @override
   */
  processFragmentedBlockEdge(nodeContext: Vtree.NodeContext) {
    if (nodeContext) {
      nodeContext.walkUpBlocks(block => {
        const boxDecorationBreak = block.inheritedProps["box-decoration-break"];
        if (!boxDecorationBreak || boxDecorationBreak === "slice") {
          const elem = block.viewNode as Element;
          Asserts.assert(elem instanceof Element);
          if (block.vertical) {
            Base.setCSSProperty(elem, "padding-left", "0");
            Base.setCSSProperty(elem, "border-left", "none");
            Base.setCSSProperty(elem, "border-top-left-radius", "0");
            Base.setCSSProperty(elem, "border-bottom-left-radius", "0");
          } else {
            Base.setCSSProperty(elem, "padding-bottom", "0");
            Base.setCSSProperty(elem, "border-bottom", "none");
            Base.setCSSProperty(elem, "border-bottom-left-radius", "0");
            Base.setCSSProperty(elem, "border-bottom-right-radius", "0");
          }
        }
      });
    }
  }

  /**
   * @override
   */
  convertLengthToPx(
      numeric: Css.Numeric,
      viewNode: Node,
      clientLayout: Vtree.ClientLayout
    ): number | Css.Numeric {
    const num = numeric.num;
    const unit = numeric.unit;
    if (Exprs.isFontRelativeLengthUnit(unit)) {
      let elem = viewNode;
      while (elem && elem.nodeType !== 1) {
        elem = elem.parentNode;
      }
      Asserts.assert(elem);
      const fontSize = parseFloat(
        clientLayout.getElementComputedStyle(elem as Element)["font-size"]
      );
      Asserts.assert(this.context);
      return CssCasc.convertFontRelativeLengthToPx(
        numeric,
        fontSize,
        this.context
      ).num;
    } else {
      const unitSize = this.context.queryUnitSize(unit, false);
      if (unitSize) {
        return num * unitSize;
      } else {
        return numeric;
      }
    }
  }

  /**
   * Returns if two NodePositionStep are equivalent.
   */
  isSameNodePositionStep(
    step1: Vtree.NodePositionStep,
    step2: Vtree.NodePositionStep
  ): boolean {
    if (step1.shadowContext) {
      if (!step2.shadowContext) {
        return false;
      }
      const elem1 =
        step1.node.nodeType === 1
          ? (step1.node as Element)
          : (step1.node.parentElement as Element);
      const elem2 =
        step2.node.nodeType === 1
          ? (step2.node as Element)
          : (step2.node.parentElement as Element);
      return (
        step1.shadowContext.owner === step2.shadowContext.owner &&
        PseudoElement.getPseudoName(elem1) ===
          PseudoElement.getPseudoName(elem2)
      );
    } else {
      return step1.node === step2.node;
    }
  }

  /**
   * @override
   */
  isSameNodePosition(
      nodePosition1: Vtree.NodePosition,
      nodePosition2: Vtree.NodePosition
    ): boolean {
    return (
      nodePosition1.offsetInNode === nodePosition2.offsetInNode &&
      nodePosition1.after == nodePosition2.after &&
      nodePosition1.steps.length === nodePosition2.steps.length &&
      nodePosition1.steps.every((step1, i) => {
        const step2 = nodePosition2.steps[i];
        return this.isSameNodePositionStep(step1, step2);
      })
    );
  }

  isPseudoelement(elem) {
    return !!PseudoElement.getPseudoName(elem);
  }
}

export const fb2Remap = {
  a: "a",
  sub: "sub",
  sup: "sup",
  table: "table",
  tr: "tr",
  td: "td",
  th: "th",
  code: "code",
  body: "div",
  p: "p",
  v: "p",
  date: "p",
  emphasis: "em",
  strong: "strong",
  style: "span",
  strikethrough: "del"
};

export const propertiesNotPassedToDOM = {
  "box-decoration-break": true,
  "float-min-wrap-block": true,
  "float-reference": true,
  "flow-into": true,
  "flow-linger": true,
  "flow-options": true,
  "flow-priority": true,
  "footnote-policy": true,
  page: true
};

export class DefaultClientLayout implements Vtree.ClientLayout {
  layoutBox: Element;
  window: Window;

  constructor(viewport: Viewport) {
    this.layoutBox = viewport.layoutBox;
    this.window = viewport.window;
  }

  private subtractOffsets(
    rect: Vtree.ClientRect,
    originRect: Vtree.ClientRect
  ): Vtree.ClientRect {
    const viewportLeft = originRect.left;
    const viewportTop = originRect.top;
    return {
      left: rect.left - viewportLeft,
      top: rect.top - viewportTop,
      right: rect.right - viewportLeft,
      bottom: rect.bottom - viewportTop,
      width: rect.width,
      height: rect.height
    } as Vtree.ClientRect;
  }

  /**
   * @override
   */
  getRangeClientRects(range: Range): ClientRect[] {
    const rects = range["getClientRects"]();
    const layoutBoxRect = this.layoutBox.getBoundingClientRect();
    return Array.from(rects).map(function(rect) {
      return this.subtractOffsets(rect, layoutBoxRect);
    }, this);
  }

  /**
   * @override
   */
  getElementClientRect(element: Element): ClientRect {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect() as Vtree.ClientRect;
    const layoutBoxRect = this.layoutBox.getBoundingClientRect();
    return this.subtractOffsets(rect, layoutBoxRect);
  }

  /**
   * @override
   */
  getElementComputedStyle(element: Element): CSSStyleDeclaration {
    return this.window.getComputedStyle(element, null);
  }
}

export class Viewport {
  document: Document;
  root: HTMLElement;
  private outerZoomBox: HTMLElement;
  contentContainer: HTMLElement;
  layoutBox: Element;
  width: number;
  height: number;

  constructor(
    public readonly window: Window,
    public readonly fontSize: number,
    opt_root?: HTMLElement,
    opt_width?: number,
    opt_height?: number
  ) {
    this.document = window.document;
    this.root = opt_root || this.document.body;
    let outerZoomBox = this.root.firstElementChild;
    if (!outerZoomBox) {
      outerZoomBox = this.document.createElement("div");
      outerZoomBox.setAttribute("data-vivliostyle-outer-zoom-box", "true");
      this.root.appendChild(outerZoomBox);
    }
    let contentContainer = outerZoomBox.firstElementChild;
    if (!contentContainer) {
      contentContainer = this.document.createElement("div");
      contentContainer.setAttribute(
        "data-vivliostyle-spread-container",
        "true"
      );
      outerZoomBox.appendChild(contentContainer);
    }
    let layoutBox = outerZoomBox.nextElementSibling;
    if (!layoutBox) {
      layoutBox = this.document.createElement("div");
      layoutBox.setAttribute("data-vivliostyle-layout-box", "true");
      this.root.appendChild(layoutBox);
    }
    this.outerZoomBox = outerZoomBox as HTMLElement;
    this.contentContainer = contentContainer as HTMLElement;
    this.layoutBox = layoutBox as HTMLElement;
    const clientLayout = new DefaultClientLayout(this);
    const computedStyle = clientLayout.getElementComputedStyle(this.root);
    this.width =
      opt_width || parseFloat(computedStyle["width"]) || window.innerWidth;
    this.height =
      opt_height || parseFloat(computedStyle["height"]) || window.innerHeight;
  }

  /**
   * Reset zoom.
   */
  resetZoom() {
    Base.setCSSProperty(this.outerZoomBox, "width", "");
    Base.setCSSProperty(this.outerZoomBox, "height", "");
    Base.setCSSProperty(this.contentContainer, "width", "");
    Base.setCSSProperty(this.contentContainer, "height", "");
    Base.setCSSProperty(this.contentContainer, "transform", "");
  }

  /**
   * Zoom viewport.
   * @param width Overall width of contents before scaling (px)
   * @param height Overall height of contents before scaling (px)
   * @param scale Factor to which the viewport will be scaled.
   */
  zoom(width: number, height: number, scale: number) {
    Base.setCSSProperty(this.outerZoomBox, "width", `${width * scale}px`);
    Base.setCSSProperty(this.outerZoomBox, "height", `${height * scale}px`);
    Base.setCSSProperty(this.contentContainer, "width", `${width}px`);
    Base.setCSSProperty(this.contentContainer, "height", `${height}px`);
    Base.setCSSProperty(this.contentContainer, "transform", `scale(${scale})`);
  }

  /**
   * Remove all pages inside the viewport.
   */
  clear() {
    const root = this.root;
    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }
  }
}
