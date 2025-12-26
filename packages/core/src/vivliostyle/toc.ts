/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Toc - Table of Contents view.
 */
import * as Base from "./base";
import * as CmykStore from "./cmyk-store";
import * as Counters from "./counters";
import * as Css from "./css";
import * as Exprs from "./exprs";
import * as Font from "./font";
import * as OPS from "./ops";
import * as Task from "./task";
import * as Vgen from "./vgen";
import * as Vtree from "./vtree";
import * as XmlDoc from "./xml-doc";

// closed: 25B8
// open: 25BE
// empty: 25B9
export const bulletClosed = "\u25b8";

export const bulletOpen = "\u25be";

export const bulletEmpty = "\u25b9";

export type TOCItem = {
  id: string;
  title: string;
  children: TOCItem[];
};

export function findTocElements(doc: Document): Array<Element> {
  // Find `<nav epub:type="toc">` etc. for EPUB.
  let tocElems = Array.from(
    doc.querySelectorAll("nav[*|type],nav[epub\\:type]"),
  );
  if (tocElems.length > 0) {
    return tocElems;
  }
  // Find `role="doc-toc"` for webpub.
  tocElems = Array.from(doc.querySelectorAll("[role=doc-toc]"));
  if (tocElems.length > 0) {
    return tocElems;
  }
  // If neither found, find TOC elements with the following selector.
  const navs = "nav,.toc,#toc,#table-of-contents,#contents,[role=directory]";
  for (const elem of doc.querySelectorAll(navs)) {
    if (tocElems.find((e) => e.contains(elem))) {
      continue; // Skip nested TOC elements.
    }
    let tocElem = elem;
    if (/^h[1-6]$/.test(tocElem.localName)) {
      // If the element is a heading, use its parent or next sibling as TOC element.
      if (!tocElem.previousElementSibling) {
        // If the heading is the first element, use its parent.
        tocElem = tocElem.parentElement;
      } else {
        // Otherwise, use its next sibling.
        tocElem = tocElem.nextElementSibling;
      }
    }
    // TOC element must have at least one list item with an anchor element.
    if (tocElem && tocElem.querySelector("li a[href]")) {
      tocElems.push(tocElem);
    }
  }
  return tocElems;
}

export function findTocAnchorElements(doc: Document): Array<Element> {
  const tocElems = findTocElements(doc);
  const anchors = [] as Array<Element>;
  for (const tocElem of tocElems) {
    for (const anchor of tocElem.querySelectorAll("li a[href]")) {
      anchors.push(anchor);
    }
  }
  return anchors;
}

export class TOCView implements Vgen.CustomRendererFactory {
  pref: Exprs.Preferences;
  page: Vtree.Page = null;
  instance: OPS.StyleInstance = null;

  constructor(
    public readonly store: OPS.OPSDocStore,
    public readonly url: string,
    public readonly lang: string | null,
    public readonly clientLayout: Vtree.ClientLayout,
    public readonly fontMapper: Font.Mapper,
    pref: Exprs.Preferences,
    public readonly rendererFactory: Vgen.CustomRendererFactory,
    public readonly fallbackMap: { [key: string]: string },
    public readonly documentURLTransformer: Base.DocumentURLTransformer,
    public readonly counterStore: Counters.CounterStore,
    public readonly cmykStore: CmykStore.CmykStore,
  ) {
    this.pref = Exprs.clonePreferences(pref);
    this.pref.spreadView = false; // No spred view for TOC box
  }

  setAutoHeight(elem: Element, depth: number): void {
    if (depth-- == 0) {
      return;
    }
    for (let c: Node = elem.firstChild; c; c = c.nextSibling) {
      if (c.nodeType == 1) {
        const e = c as Element;
        if (Base.getCSSProperty(e, "height", "auto") != "auto") {
          Base.setCSSProperty(e, "height", "auto");
          this.setAutoHeight(e, depth);
        }
        if (Base.getCSSProperty(e, "position", "static") == "absolute") {
          Base.setCSSProperty(e, "position", "relative");
          this.setAutoHeight(e, depth);
        }
      }
    }
  }

  /** @override */
  makeCustomRenderer(xmldoc: XmlDoc.XMLDocHolder): Vgen.CustomRenderer {
    const renderer = this.rendererFactory.makeCustomRenderer(xmldoc);
    return (
      srcElem: Element,
      viewParent: Element,
      computedStyle: { [key: string]: Css.Val },
    ): Task.Result<Element> => {
      const behavior = computedStyle["behavior"];
      if (behavior) {
        switch (behavior.toString()) {
          case "toc-node-anchor":
            computedStyle["color"] = Css.ident.inherit;
            computedStyle["text-decoration"] = Css.ident.none;
            break;
          case "toc-node":
            computedStyle["display"] = Css.ident.block;
            computedStyle["margin"] = Css.numericZero;
            computedStyle["padding"] = Css.numericZero;
            computedStyle["padding-inline-start"] = new Css.Numeric(1.25, "em");
            break;
          case "toc-node-first-child":
            computedStyle["display"] = Css.ident.inline_block;
            computedStyle["margin"] = new Css.Numeric(0.2, "em");
            computedStyle["vertical-align"] = Css.ident.top;
            computedStyle["color"] = Css.ident.inherit;
            computedStyle["text-decoration"] = Css.ident.none;
            break;
          case "toc-container":
            computedStyle["padding"] = Css.numericZero;
            break;
        }
      }
      if (
        !behavior ||
        (behavior.toString() != "toc-node" &&
          behavior.toString() != "toc-container")
      ) {
        return renderer(srcElem, viewParent, computedStyle);
      }
      // Remove white-space textnode that becomes unwanted space between button and anchor element.
      const firstChild = srcElem.firstChild;
      if (
        firstChild &&
        firstChild.nodeType !== 1 &&
        Vtree.canIgnore(firstChild)
      ) {
        // To avoid "Inconsistent offset" error, create a comment node with same white-space text.
        srcElem.replaceChild(
          srcElem.ownerDocument.createComment(firstChild.textContent),
          firstChild,
        );
      }
      const adaptParentClass = viewParent.getAttribute("data-adapt-class");
      if (adaptParentClass == "toc-node") {
        const button = viewParent.firstChild as Element;
        if (button.textContent != bulletClosed) {
          button.textContent = bulletClosed;
          Base.setCSSProperty(button, "cursor", "pointer");
          button.addEventListener("click", toggleNodeExpansion, false);

          button.setAttribute("role", "button");
          button.setAttribute("aria-expanded", "false");
          viewParent.setAttribute("aria-expanded", "false");

          // Enable tab move to the button unless hidden.
          if ((viewParent as HTMLElement).style.height !== "0px") {
            (button as HTMLElement).tabIndex = 0;
          }
        }
      }
      const element = viewParent.ownerDocument.createElement("div");
      element.setAttribute("data-adapt-process-children", "true");
      if (behavior.toString() == "toc-node") {
        const button = viewParent.ownerDocument.createElement("div");
        button.textContent = bulletEmpty;

        // TODO: define pseudo-element for the button?
        Base.setCSSProperty(button, "margin", "0.2em 0 0 -1em");
        Base.setCSSProperty(button, "margin-inline-start", "-1em");
        Base.setCSSProperty(button, "margin-inline-end", "0");
        Base.setCSSProperty(button, "display", "inline-block");
        Base.setCSSProperty(button, "width", "1em");
        Base.setCSSProperty(button, "text-align", "center");
        Base.setCSSProperty(button, "vertical-align", "top");
        Base.setCSSProperty(button, "cursor", "default");
        Base.setCSSProperty(button, "font-family", "Menlo,sans-serif");
        element.appendChild(button);
        Base.setCSSProperty(element, "overflow", "hidden");
        element.setAttribute("data-adapt-class", "toc-node");
        element.setAttribute("role", "treeitem");

        if (
          adaptParentClass == "toc-node" ||
          adaptParentClass == "toc-container"
        ) {
          Base.setCSSProperty(element, "height", "0px");

          // Prevent tab move to hidden anchor.
          const anchorElem = srcElem.firstElementChild;
          if (anchorElem && anchorElem.localName === "a") {
            (anchorElem as HTMLElement).tabIndex = -1;
          }
        } else {
          viewParent.setAttribute("role", "tree");
        }
      } else {
        if (adaptParentClass == "toc-node") {
          element.setAttribute("data-adapt-class", "toc-container");
          element.setAttribute("role", "group");
          element.setAttribute("aria-hidden", "true");
        }
      }
      return Task.newResult(element as Element);
    };
  }

  showTOC(
    elem: HTMLElement,
    viewport: Vgen.Viewport,
    width: number,
    height: number,
    fontSize: number,
  ): Task.Result<Vtree.Page> {
    if (this.page) {
      return Task.newResult(this.page as Vtree.Page);
    }
    const frame: Task.Frame<Vtree.Page> = Task.newFrame("showTOC");
    const page = new Vtree.Page(elem, elem);
    this.page = page;

    // The (X)HTML doc for the TOC box may be reused for the TOC page in the book,
    // but they need different styles. So, add "?viv-toc-box" to distinguish with TOC page URL.
    const tocBoxUrl = Base.stripFragment(this.url) + "?viv-toc-box";

    this.store.load(tocBoxUrl).then((xmldoc) => {
      for (const tocElem of findTocElements(xmldoc.document)) {
        // Set `data-vivliostyle-role="doc-toc"`
        tocElem.setAttribute("data-vivliostyle-role", "doc-toc");
      }

      const style = this.store.getStyleForDoc(xmldoc);
      const viewportSize = style.sizeViewport(width, 100000, fontSize);
      viewport = new Vgen.Viewport(
        viewport.window,
        viewportSize.fontSize,
        0,
        viewport.root,
        viewportSize.width,
        viewportSize.height,
      );
      const customRenderer = this.makeCustomRenderer(xmldoc);
      const instance = new OPS.StyleInstance(
        style,
        xmldoc,
        this.lang,
        viewport,
        this.clientLayout,
        this.fontMapper,
        customRenderer,
        this.fallbackMap,
        0,
        this.documentURLTransformer,
        this.counterStore,
        this.cmykStore,
      );
      this.instance = instance;
      instance.pref = this.pref;
      instance.init().then(() => {
        instance.layoutNextPage(page, null).then(() => {
          this.setAutoHeight(elem, 2);
          frame.finish(page);
        });
      });
    });
    return frame.result();
  }

  hideTOC(): void {
    if (this.page) {
      this.page.container.style.visibility = "hidden";
      this.page.container.setAttribute("aria-hidden", "true");
    }
  }

  isTOCVisible(): boolean {
    return !!this.page && this.page.container.style.visibility === "visible";
  }

  getTOC(): TOCItem[] {
    if (!this.page) {
      return [];
    }

    function exportTree(tag): TOCItem[] {
      if (!tag) {
        return [];
      }
      const links = tag.querySelectorAll(":scope > [role=treeitem] > a[href]");
      return Array.from(links).map(exportLink);
    }

    function exportLink(tag): TOCItem {
      const url = new URL(tag.href);
      const [, id] = url.hash.match(/^#?(.*)$/);

      const title = tag.innerText;

      const container = tag.parentElement.querySelector("[role=group]");
      const children = exportTree(container);

      return { id, title, children };
    }

    const topLevelTree = this.page.container.querySelector("[role=tree]");
    return exportTree(topLevelTree);
  }
}

export function toggleNodeExpansion(evt: Event): void {
  const elem = evt.target as Element;
  const open = elem.textContent == bulletClosed;
  elem.textContent = open ? bulletOpen : bulletClosed;
  const tocNodeElem = elem.parentNode as Element;
  elem.setAttribute("aria-expanded", open ? "true" : "false");
  tocNodeElem.setAttribute("aria-expanded", open ? "true" : "false");
  let c: Node = tocNodeElem.firstChild;
  while (c) {
    if (c.nodeType === 1) {
      const ce = c as HTMLElement;
      const adaptClass = ce.getAttribute("data-adapt-class");
      if (adaptClass === "toc-container") {
        ce.setAttribute("aria-hidden", !open ? "true" : "false");
        if (ce.firstChild) {
          c = ce.firstChild;
          continue;
        }
      } else if (adaptClass === "toc-node") {
        ce.style.height = open ? "auto" : "0px";

        // Update enable/disable tab move to the button and anchor.
        if (ce.children.length >= 2) {
          (ce.children[1] as HTMLElement).tabIndex = open ? 0 : -1;
        }
        if (ce.children.length >= 3) {
          (ce.children[0] as HTMLElement).tabIndex = open ? 0 : -1;
          if (!open) {
            const elem1 = ce.children[0];
            if (elem1.textContent == bulletOpen) {
              elem1.textContent = bulletClosed;
              elem1.setAttribute("aria-expanded", "false");
              ce.setAttribute("aria-expanded", "false");
              c = ce.children[2];
              continue;
            }
          }
        }
      }
    }
    while (!c.nextSibling && c.parentNode !== tocNodeElem) {
      c = c.parentNode;
    }
    c = c.nextSibling;
  }
  evt.stopPropagation();
}
