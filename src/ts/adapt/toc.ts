/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 */
import * as counters from '../vivliostyle/counters';

import {DocumentURLTransformer} from './base';
import * as expr from './expr';
import * as font from './font';
import * as ops from './ops';
import {Result} from './task';
import {Frame} from './task';
import * as vgen from './vgen';
import * as vtree from './vtree';

// closed: 25B8
// open: 25BE
// empty: 25B9
export const bulletClosed = '\u25b8';

export const bulletOpen = '\u25be';

export const bulletEmpty = '\u25b9';

export class TOCView implements vgen.CustomRendererFactory {
  pref: any;
  page: vtree.Page = null;
  instance: ops.StyleInstance = null;

  constructor(
      public readonly store: ops.OPSDocStore, public readonly url: string,
      public readonly lang: string|null,
      public readonly clientLayout: vtree.ClientLayout,
      public readonly fontMapper: font.Mapper, pref: expr.Preferences,
      public readonly rendererFactory: vgen.CustomRendererFactory,
      public readonly fallbackMap: {[key: string]: string},
      public readonly documentURLTransformer: DocumentURLTransformer,
      public readonly counterStore: counters.CounterStore) {
    this.pref = expr.clonePreferences(pref);
  }

  setAutoHeight(elem: Element, depth: number): void {
    if (depth-- == 0) {
      return;
    }
    for (let c = elem.firstChild; c; c = c.nextSibling) {
      if (c.nodeType == 1) {
        const e = (c as Element);
        if (adapt.base.getCSSProperty(e, 'height', 'auto') != 'auto') {
          adapt.base.setCSSProperty(e, 'height', 'auto');
          this.setAutoHeight(e, depth);
        }
        if (adapt.base.getCSSProperty(e, 'position', 'static') == 'absolute') {
          adapt.base.setCSSProperty(e, 'position', 'relative');
          this.setAutoHeight(e, depth);
        }
      }
    }
  }

  /**
   * @override
   */
  makeCustomRenderer(xmldoc) {
    const renderer = this.rendererFactory.makeCustomRenderer(xmldoc);
    return (srcElem: Element, viewParent: Element,
            computedStyle): Result<Element> => {
      const behavior = computedStyle['behavior'];
      if (!behavior ||
          behavior.toString() != 'toc-node' &&
              behavior.toString() != 'toc-container') {
        return renderer(srcElem, viewParent, computedStyle);
      }
      const adaptParentClass = viewParent.getAttribute('data-adapt-class');
      if (adaptParentClass == 'toc-node') {
        let button = (viewParent.firstChild as Element);
        if (button.textContent != bulletClosed) {
          button.textContent = bulletClosed;
          adapt.base.setCSSProperty(button, 'cursor', 'pointer');
          button.addEventListener('click', toggleNodeExpansion, false);
        }
      }
      const element = viewParent.ownerDocument.createElement('div');
      element.setAttribute('data-adapt-process-children', 'true');
      if (behavior.toString() == 'toc-node') {
        let button = viewParent.ownerDocument.createElement('div');
        button.textContent = bulletEmpty;

        // TODO: define pseudo-element for the button?
        adapt.base.setCSSProperty(button, 'margin-left', '-1em');
        adapt.base.setCSSProperty(button, 'display', 'inline-block');
        adapt.base.setCSSProperty(button, 'width', '1em');
        adapt.base.setCSSProperty(button, 'text-align', 'left');
        adapt.base.setCSSProperty(button, 'cursor', 'default');
        adapt.base.setCSSProperty(button, 'font-family', 'Menlo,sans-serif');
        element.appendChild(button);
        adapt.base.setCSSProperty(element, 'overflow', 'hidden');
        element.setAttribute('data-adapt-class', 'toc-node');
        if (adaptParentClass == 'toc-node' ||
            adaptParentClass == 'toc-container') {
          adapt.base.setCSSProperty(element, 'height', '0px');
        }
      } else {
        if (adaptParentClass == 'toc-node') {
          element.setAttribute('data-adapt-class', 'toc-container');
        }
      }
      return adapt.task.newResult((element as Element));
    };
  }

  showTOC(
      elem: HTMLElement, viewport: vgen.Viewport, width: number, height: number,
      fontSize: number): Result<vtree.Page> {
    if (this.page) {
      return adapt.task.newResult((this.page as vtree.Page));
    }
    const self = this;
    const frame: Frame<vtree.Page> = adapt.task.newFrame('showTOC');
    const page = new vtree.Page(elem, elem);
    this.page = page;
    this.store.load(this.url).then((xmldoc) => {
      const style = self.store.getStyleForDoc(xmldoc);
      const viewportSize = style.sizeViewport(width, 100000, fontSize);
      viewport = new vgen.Viewport(
          viewport.window, viewportSize.fontSize, viewport.root,
          viewportSize.width, viewportSize.height);
      const customRenderer = self.makeCustomRenderer(xmldoc);
      const instance = new ops.StyleInstance(
          style, xmldoc, self.lang, viewport, self.clientLayout,
          self.fontMapper, customRenderer, self.fallbackMap, 0,
          self.documentURLTransformer, self.counterStore);
      self.instance = instance;
      instance.pref = self.pref;
      instance.init().then(() => {
        instance.layoutNextPage(page, null).then(() => {
          self.setAutoHeight(elem, 2);
          frame.finish(page);
        });
      });
    });
    return frame.result();
  }

  hideTOC(): void {
    if (this.page) {
      const page = this.page;
      this.page = null;
      this.instance = null;
      adapt.base.setCSSProperty(page.container, 'visibility', 'none');
      const parent = page.container.parentNode;
      if (parent) {
        parent.removeChild(page.container);
      }
    }
  }

  isTOCVisible(): boolean {
    return !!this.page;
  }
}

export const toggleNodeExpansion = (evt: Event) => {
  const elem = (evt.target as Element);
  const open = elem.textContent == bulletClosed;
  elem.textContent = open ? bulletOpen : bulletClosed;
  const tocNodeElem = (elem.parentNode as Element);
  let c = tocNodeElem.firstChild;
  while (c) {
    if (c.nodeType != 1) {
      c = c.nextSibling;
      continue;
    }
    const ce = (c as HTMLElement);
    const adaptClass = ce.getAttribute('data-adapt-class');
    if (adaptClass == 'toc-container') {
      c = ce.firstChild;
      continue;
    }
    if (ce.getAttribute('data-adapt-class') == 'toc-node') {
      ce.style.height = open ? 'auto' : '0px';
    }
    c = c.nextSibling;
  }
  evt.stopPropagation();
};
