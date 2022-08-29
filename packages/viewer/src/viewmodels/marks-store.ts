/*
 * Copyright 2021 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import ko, { Computed, Observable } from "knockout";
import ViewerOptions from "../models/viewer-options";
import urlParameters from "../stores/url-parameters";
import { applyTransformToRect } from "../utils/scale-util";

const colorNameToColor = (name: string): string => {
  switch (name) {
    case "red":
      return "rgba(255,0, 0,0.2)";
    case "green":
      return "rgba(0,255,0,0.2)";
    case "yellow":
      return "rgba(255,217,0,0.3)";
    default:
      return "";
  }
};

const getNextNode = (node: Node): Node | undefined => {
  if (node.firstChild) {
    return node.firstChild;
  }
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
};

const isNodeInEloff = (node: Node): boolean => {
  let e: Element;
  if (node.nodeType == 1) {
    e = node as Element;
  } else {
    e = node.parentElement;
  }
  return !!e.closest("[data-adapt-eloff]");
};

interface TextInRange {
  t: Text;
  startOffset: number;
  endOffset: number;
}

const isTextInAdaptSpec = (text: Text): boolean => {
  return !!text.parentElement.closest("[data-adapt-spec]");
};

const collectTextWithEloffInRange = (
  start: NodePosition,
  end: NodePosition,
): TextInRange[] => {
  const nodes: TextInRange[] = [];
  for (let node = start.node; node; node = getNextNode(node)) {
    if (
      node.nodeType == 3 &&
      !isTextInAdaptSpec(node as Text) &&
      isNodeInEloff(node)
    ) {
      const t = node as Text;
      if (t.data.trim().length > 0) {
        const startOffset = node == start.node ? start.offset : 0;
        const endOffset = node == end.node ? end.offset : t.data.length;
        nodes.push({ t, startOffset, endOffset });
      }
    }
    if (node == end.node) {
      break;
    }
  }
  return nodes;
};

const textNodeRects = (tn: TextInRange): DOMRect[] => {
  const r = document.createRange();
  r.setStart(tn.t, tn.startOffset);
  r.setEnd(tn.t, tn.endOffset);
  return [...r.getClientRects()];
};

const markExistIn = (markId: string, e: Element): boolean => {
  return !!e.querySelector(`[${Mark.idAttr}="${markId}"]`);
};

const estimateLastEndFromStart = (
  start: NodePosition,
  actualEndPos: SelectPosition,
): NodePosition => {
  let end: Text = start.node as Text;

  for (let node = start.node; node; node = getNextNode(node)) {
    if (node.nodeType == 1) {
      const e = node as Element;
      if (e.hasAttribute("data-vivliostyle-outer-zoom-box")) {
        break;
      }
      if (e.hasAttribute("data-vivliostyle-page-container")) {
        if (getSpineIndex(e) > actualEndPos.spineIndex) {
          break;
        }
      }
    }
    if (node.nodeType == 3 && isNodeInEloff(node)) {
      end = node as Text;
    }
  }
  return { node: end, offset: end.data.length };
};

interface HighlightStyle {
  background?: string;
}

const applyStyle = (e: HTMLElement, style: HighlightStyle): void => {
  if (style.background) {
    e.style.background = style.background;
  }
};

const highlight = (
  start: NodePosition,
  end: NodePosition,
  style: HighlightStyle,
  mark?: Mark,
): string => {
  const startParent = start.node.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  const endParent = end.node.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  if (
    mark &&
    markExistIn(mark.uniqueIdentifier, startParent) &&
    markExistIn(mark.uniqueIdentifier, endParent)
  ) {
    // already exists;
    return "";
  }
  const zoomBox = start.node.parentElement?.closest(
    "[data-vivliostyle-outer-zoom-box]",
  )?.firstElementChild as HTMLElement;
  const scale = zoomBox?.style?.transform;
  const textNodes = collectTextWithEloffInRange(start, end);
  const selectId = mark?.uniqueIdentifier || Mark.notCreatedId;
  const invokeMenu = (event: MouseEvent): void => {
    const x = event.clientX;
    const y = event.clientY;
    marksMenuStatus.openEditMenu(x, y, selectId);
  };

  let index = 0;
  const texts: string[] = [];
  textNodes.forEach((tn) => {
    texts.push(tn.t.data.slice(tn.startOffset, tn.endOffset));
    const parent = tn.t.parentElement.closest(
      "[data-vivliostyle-page-container='true']",
    );
    const parentRect = parent?.getBoundingClientRect();
    const pageIndex = getPageIndex(parent);
    const spineIndex = getSpineIndex(parent);
    for (const r of textNodeRects(tn)) {
      const rect = applyTransformToRect(r, scale, parentRect);
      const rectNum = index++;
      const mn = `${spineIndex}-${pageIndex}-${rectNum}`;
      if (
        document.querySelector(
          `[${Mark.idAttr}='${selectId}'][data-mn='${mn}']`,
        )
      ) {
        return;
      }
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.margin = "0";
      div.style.padding = "0";
      div.style.top = `${rect.top + window.scrollY}px`;
      div.style.left = `${rect.left + window.scrollX}px`;
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;
      applyStyle(div, style);
      div.setAttribute(Mark.idAttr, selectId);
      div.setAttribute("data-mn", `${mn}`);
      div.addEventListener("click", invokeMenu);
      parent.appendChild(div);
    }
  });
  return texts.join("");
};

const getPageIndex = (pageElement: Element): number => {
  const p = parseInt(pageElement.getAttribute("data-vivliostyle-page-index"));
  if (isNaN(p)) {
    return -1;
  }
  return p;
};

const getSpineIndex = (pageElement: Element): number => {
  const p = parseInt(pageElement.getAttribute("data-vivliostyle-spine-index"));
  if (isNaN(p)) {
    return -1;
  }
  return p;
};

const selectedNodeToPosition = (node: Node, offset: number): SelectPosition => {
  const pageElement = node.parentElement.closest(
    "[data-vivliostyle-page-container]",
  );
  const spineIndex: number = getSpineIndex(pageElement);
  const e = node.parentElement.closest("[data-adapt-eloff]");
  const nodePath: Node[] = [];
  let n = node;
  while (n && n !== e) {
    nodePath.unshift(n);
    n = n.parentElement;
  }
  const eloff = parseInt(e.getAttribute("data-adapt-eloff"));
  let offsetInItem = eloff + offset;
  const es = collectElementsWithEloff(spineIndex, eloff);
  let count = 0;
  let lastNodeType = -1;
  let lastNodeTextLength = 0;
  for (const siblingE of es.values()) {
    if (siblingE == e) {
      break;
    }
    const children = [...siblingE.childNodes].filter(
      (x) =>
        !(x.nodeType == 1 && (x as Element).hasAttribute("data-adapt-spec")),
    );
    let childrenCount = children.length;
    if (childrenCount > 0) {
      offsetInItem += children
        .map((child) => child.textContent.length)
        .reduce((a, b) => a + b);

      if (children[0].nodeType == 3 && lastNodeType == 3) {
        childrenCount -= 1;
      }
      const lastNode = children[children.length - 1];
      lastNodeType = lastNode.nodeType;
      if (lastNodeType == 3) {
        lastNodeTextLength += (lastNode as Text).data.length;
      } else {
        lastNodeTextLength = 0;
      }
    }
    count += childrenCount;
  }
  const children = [...e.childNodes].filter(
    (x) => !(x.nodeType == 1 && (x as Element).hasAttribute("data-adapt-spec")),
  );
  const nodeIndex = children.indexOf(nodePath[0] as ChildNode);
  if (nodeIndex > 0) {
    offsetInItem += children
      .map((child, i) => (i < nodeIndex ? child.textContent.length : 0))
      .reduce((a, b) => a + b);
  }
  const nodeIndexPath = [];
  if (nodeIndex == 0 && nodePath[0].nodeType == 3 && lastNodeType == 3) {
    offset += lastNodeTextLength;
    if (nodePath.length > 1) {
      // should not occur
      console.warn(
        "should not reach here; nodePath[0] is text and nodePath is deeper",
      );
    }
    nodeIndexPath.push(count - 1);
  } else {
    count += nodeIndex + 1;
    if (lastNodeType == 3 && children[0].nodeType == 3) {
      count--;
    }
    nodeIndexPath.push(count - 1);
    // go deeper
    let i = 0;
    while (i < nodePath.length - 1) {
      const ct = [...nodePath[i].childNodes].indexOf(
        nodePath[i + 1] as ChildNode,
      );
      nodeIndexPath.push(ct);
      i++;
    }
  }

  return new SelectPosition(
    spineIndex,
    eloff,
    nodeIndexPath,
    offset,
    offsetInItem,
  );
};

interface NodePosition {
  node: Node;
  offset: number;
}

const selectedPositionToNode = (pos: SelectPosition): NodePosition | null => {
  const es = collectElementsWithEloff(pos.spineIndex, pos.eloff);
  let count = 0;
  let lastNodeType = -1;
  let lastNodeTextLength = 0;
  let targetNode: Text | undefined;
  for (const siblingE of es.values()) {
    const children = [...siblingE.childNodes].filter(
      (x) =>
        !(x.nodeType == 1 && (x as Element).hasAttribute("data-adapt-spec")),
    );
    const childrenCount = children.length;
    if (childrenCount > 0) {
      if (children[0].nodeType == 3 && lastNodeType == 3) {
        count--;
      }
      const nextCount = count + childrenCount;
      if (nextCount > pos.nodePath[0]) {
        if (count == pos.nodePath[0] && children[0].nodeType == 3) {
          // maybe the result is in the first node
          const targetCandidate = children[0] as Text;
          if (
            lastNodeTextLength <= pos.offset &&
            pos.offset <= lastNodeTextLength + targetCandidate.data.length
          ) {
            targetNode = targetCandidate;
            break;
          }
        } else if (
          nextCount == pos.nodePath[0] + 1 &&
          children[children.length - 1].nodeType == 3
        ) {
          // maybe the result is the last node
          const targetCandidate = children[children.length - 1] as Text;
          if (pos.offset <= targetCandidate.data.length) {
            targetNode = targetCandidate;
            lastNodeTextLength = 0;
            break;
          }
        } else {
          // the result is the specified node
          let target = children[pos.nodePath[0] - count];
          for (let i = 1; i < pos.nodePath.length; i++) {
            if (
              target.childNodes &&
              target.childNodes.length > pos.nodePath[i]
            ) {
              target = target.childNodes[pos.nodePath[i]];
            } else {
              // should not reach here, this is a workaround.
            }
          }
          targetNode = target as Text;
          lastNodeTextLength = 0;
          break;
        }
      }
      const lastNode = children[children.length - 1];
      lastNodeType = lastNode.nodeType;
      if (lastNodeType == 3) {
        lastNodeTextLength += (lastNode as Text).data.length;
      } else {
        lastNodeTextLength = 0;
      }
    }
    count += childrenCount;
  }
  if (targetNode) {
    return { node: targetNode, offset: pos.offset - lastNodeTextLength };
  }
  return null;
};

const collectElementsWithEloff = (
  spineIndex: number,
  eloff: number,
): Element[] => {
  const eloffAttrSelector = `[data-vivliostyle-spine-index='${spineIndex}'] [data-adapt-eloff='${eloff}']`;
  return Array.from(document.querySelectorAll(eloffAttrSelector)).filter(
    (e) => !e.querySelector(eloffAttrSelector),
  );
};

class SelectPosition {
  constructor(
    readonly spineIndex: number,
    readonly eloff: number,
    readonly nodePath: number[],
    readonly offset: number,
    readonly offsetInItem: number,
  ) {}

  toString(): string {
    return `${this.spineIndex}-${this.eloff}-${this.nodePath.join("/")}-${
      this.offset
    }-${this.offsetInItem}`;
  }

  static fromString(str: string): SelectPosition {
    const [spineIndex, eloff, nodePathString, offset, offsetInItem] = str
      .split("-")
      .map((x) => x.trim());
    const nodePath = nodePathString.split("/").map((x) => parseInt(x));
    return new SelectPosition(
      parseInt(spineIndex),
      parseInt(eloff),
      nodePath,
      parseInt(offset),
      parseInt(offsetInItem),
    );
  }
}

class Mark {
  uniqueIdentifier?: string;
  static readonly idAttr = "data-viv-marker-id";
  static readonly notCreatedId = "not-created";
  constructor(
    public start: SelectPosition,
    public end: SelectPosition,
    public color: string,
    public memo: string,
    public markedText: string,
  ) {
    this.uniqueIdentifier = Mark.notCreatedId;
  }

  markInfoString(): string {
    return `${this.start},${this.end},${this.color}`;
  }

  toMarkJson(): MarkJson {
    return {
      mark: this.markInfoString(),
      id: this.uniqueIdentifier,
      memo: this.memo,
      markedText: this.markedText,
    };
  }

  isPersisted(): boolean {
    return this.uniqueIdentifier && this.uniqueIdentifier != Mark.notCreatedId;
  }

  static fromMarkInfoString(str: string): Mark {
    const [s, e, c] = str.split(",");
    const start = SelectPosition.fromString(s);
    const end = SelectPosition.fromString(e);
    const m = new Mark(start, end, c, "", "");
    return m;
  }

  static fromMarkJson(m: MarkJson): Mark {
    const mark = Mark.fromMarkInfoString(m.mark);
    mark.uniqueIdentifier = m.id;
    mark.memo = m.memo;
    mark.markedText = m.markedText;
    return mark;
  }
}

export const processSelection = (selection: Selection): void => {
  marksMenuStatus.openStartButton(selection);
};

interface MarkAction {
  currentId(): string;
  deletable(): boolean;
  cancellable(): boolean;
  applyEditing(): Promise<void>;
  colorChanged(): Promise<void>;
  deleteCurrentEditing(): Promise<void>;
  close(): Promise<void>;
}

class EmptyMarkAction implements MarkAction {
  currentId(): string {
    return "";
  }
  deletable(): boolean {
    return false;
  }
  cancellable(): boolean {
    return false;
  }
  applyEditing(): Promise<void> {
    return;
  }
  colorChanged(): Promise<void> {
    return;
  }
  deleteCurrentEditing(): Promise<void> {
    return;
  }
  close(): Promise<void> {
    return;
  }
}
class NewMarkAction implements MarkAction {
  currentStart?: SelectPosition;
  currentEnd?: SelectPosition;
  currentText?: string;
  start = (
    currentStart: SelectPosition,
    currentEnd: SelectPosition,
  ): boolean => {
    this.currentStart = currentStart;
    this.currentEnd = currentEnd;
    const start = selectedPositionToNode(this.currentStart);
    const end = selectedPositionToNode(this.currentEnd);
    if (start && end) {
      const color = colorNameToColor(marksMenuStatus.currentEditingColor());
      this.currentText = highlight(start, end, { background: color });
      return true;
    }
    return false;
  };

  deletable = (): boolean => false;
  cancellable = (): boolean => true;
  deleteCurrentEditing = async (): Promise<void> => {
    // do nothing
  };
  currentId = (): string => Mark.notCreatedId;
  applyEditing = async (): Promise<void> => {
    if (this.currentStart && this.currentEnd) {
      const mark = new Mark(
        this.currentStart,
        this.currentEnd,
        marksMenuStatus.currentEditingColor(),
        marksMenuStatus.currentEditingMemo(),
        this.currentText,
      );
      await marksStore.persistMark(mark);
    }
    marksMenuStatus.closeMenu();
  };

  colorChanged = async (): Promise<void> => {
    if (this.cancellable() == false) {
      this.applyEditing();
    }
  };

  close = async (): Promise<void> => {
    document
      .querySelectorAll(`[${Mark.idAttr}="${Mark.notCreatedId}"]`)
      .forEach((e) => {
        e.remove();
      });
  };
}

class EditAction implements MarkAction {
  currentEditing?: Mark;
  deletable = (): boolean => true;
  cancellable = (): boolean => true;
  deleteCurrentEditing = async (): Promise<void> => {
    if (this.currentEditing) {
      await marksStore.removeMark(this.currentEditing);
    }
  };

  currentId = (): string => {
    return this.currentEditing?.uniqueIdentifier;
  };

  applyEditing = async (): Promise<void> => {
    if (this.currentEditing) {
      if (
        marksMenuStatus.currentEditingColor() != this.currentEditing.color ||
        marksMenuStatus.currentEditingMemo() != this.currentEditing.memo
      ) {
        this.currentEditing.color = marksMenuStatus.currentEditingColor();
        this.currentEditing.memo = marksMenuStatus.currentEditingMemo();
        marksStore.updateMark(this.currentEditing);
      }
    }
    marksMenuStatus.closeMenu();
  };
  colorChanged = async (): Promise<void> => {
    // do nothing.
  };

  close = async (): Promise<void> => {
    if (this.currentEditing) {
      const color = colorNameToColor(this.currentEditing.color);
      if (color.length > 0) {
        document
          .querySelectorAll(
            `[${Mark.idAttr}="${this.currentEditing.uniqueIdentifier}"]`,
          )
          .forEach((e) => {
            (e as HTMLElement).style.background = color;
          });
      }
      this.currentEditing = undefined;
    }
  };
}

export class MarksMenuStatus {
  menuOpened: Observable<boolean>;
  startButtonOpened: Observable<boolean>;
  currentEditingColor: Observable<string>;
  currentEditingMemo: Observable<string>;
  deletable: Computed<boolean>;
  cancellable: Computed<boolean>;
  markAction: Observable<MarkAction>;
  emptyAction: EmptyMarkAction;
  editAction: EditAction;
  newMarkAction: NewMarkAction;

  constructor(private parent: MarksStoreFacade) {
    this.menuOpened = ko.observable(false);
    this.startButtonOpened = ko.observable(false);
    this.currentEditingColor = ko.observable("");
    this.currentEditingMemo = ko.observable("");
    this.currentEditingColor.subscribe(this.editingColorChanged);
    this.editAction = new EditAction();
    this.newMarkAction = new NewMarkAction();
    this.emptyAction = new EmptyMarkAction();
    this.markAction = ko.observable(this.emptyAction);
    this.deletable = ko
      .pureComputed(() => this.markAction().deletable())
      .extend({ notify: "always" });
    this.cancellable = ko
      .pureComputed(() => this.markAction().cancellable())
      .extend({ notify: "always" });
  }

  editingColorChanged = async (colorName: string): Promise<void> => {
    if (!marksStore.enabled()) return;
    const idString = this.markAction().currentId();
    const color = colorNameToColor(colorName);
    if (color.length > 0) {
      document
        .querySelectorAll(`[${Mark.idAttr}="${idString}"]`)
        .forEach((e) => {
          (e as HTMLElement).style.background = color;
        });
    }
    await this.markAction().colorChanged();
  };

  private openMenu = (x: number, y: number): void => {
    if (this.menuOpened()) {
      return;
    }
    const menu = document.getElementById(
      "vivliostyle-text-selection-edit-menu",
    ) as HTMLElement;
    if (menu) {
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
    const subscription = this.menuOpened.subscribe((v) => {
      if (v) {
        const menu = document.getElementById(
          "vivliostyle-text-selection-edit-menu",
        ) as HTMLElement;
        const outer = document.querySelector(
          "[data-vivliostyle-outer-zoom-box]",
        ) as HTMLElement;
        if (menu && outer) {
          const mb = menu.getBoundingClientRect();
          const ob = outer.getBoundingClientRect();
          let left = x - mb.width;
          if (left + mb.width > ob.right) {
            left = ob.right - mb.width - 10;
          }
          if (left < ob.left) {
            left = ob.left;
          }
          menu.style.left = `${left}px`;
          if (mb.bottom > ob.bottom) {
            menu.style.top = `${ob.bottom - mb.height - 10}px`;
          }
        }
      }
      subscription.dispose();
    });
    this.startButtonOpened(false);
    this.menuOpened(true);
  };

  closeStartButton = (): void => {
    if (!marksStore.enabled()) return;
    this.startButtonOpened(false);
  };

  openEditMenu = async (x: number, y: number, id: string): Promise<void> => {
    if (!marksStore.enabled()) return;
    const currentEditing = await this.parent.getMark(id);
    this.currentEditingColor(currentEditing.color);
    this.currentEditingMemo(currentEditing.memo);
    this.editAction.currentEditing = currentEditing;
    this.markAction(this.editAction);
    this.openMenu(x, y);
  };

  closeMenu = async (): Promise<void> => {
    if (!marksStore.enabled()) return;
    await this.markAction().close();
    this.markAction(this.emptyAction);
    this.menuOpened(false);
  };

  applyEditing = async (): Promise<void> => {
    if (!marksStore.enabled()) return;
    await this.markAction().applyEditing();
  };

  deleteCurrentEditing = async (): Promise<void> => {
    if (!marksStore.enabled()) return;
    if (confirm("Do you really want to delete it?")) {
      await this.markAction().deleteCurrentEditing();
    }
    await this.closeMenu();
  };

  openSelectionMenu = (
    x: number,
    y: number,
    start: SelectPosition,
    end: SelectPosition,
    selection: Selection,
  ): void => {
    if (!marksStore.enabled()) return;
    this.currentEditingColor("yellow");
    this.currentEditingMemo("");
    if (this.newMarkAction.start(start, end)) {
      selection.empty();
      this.markAction(this.newMarkAction);
      this.openMenu(x, y);
    }
  };

  openStartButton = async (selection: Selection): Promise<void> => {
    if (!marksStore.enabled()) return;
    if (selection.type == "Range") {
      const range = selection.getRangeAt(0);
      const button = document.getElementById(
        "vivliostyle-text-selection-start-button",
      ) as HTMLElement;
      const rs = { node: range.startContainer, offset: range.startOffset };
      const re = { node: range.endContainer, offset: range.endOffset };
      const text = collectTextWithEloffInRange(rs, re);
      if (text.length == 0) {
        return;
      }
      // want to use map and flat, but the compiler option allows only es2018
      const rects = text.reduce((acc, t) => {
        return acc.concat(textNodeRects(t));
      }, []);
      if (rects.length == 0) {
        return;
      }
      const start = selectedNodeToPosition(text[0].t, text[0].startOffset);
      const end = selectedNodeToPosition(
        text[text.length - 1].t,
        text[text.length - 1].endOffset,
      );
      const x = rects[rects.length - 1].left;
      const y = rects[rects.length - 1].bottom;
      const clickListner = (e: MouseEvent): void => {
        e.stopPropagation();
        if (button) {
          button.removeEventListener("click", clickListner);
        }
        this.openSelectionMenu(x, y, start, end, selection);
      };

      if (button) {
        button.style.top = `${y}px`;
        button.style.left = `${x}px`;
        button.addEventListener("click", clickListner);
      }

      const subscription = this.startButtonOpened.subscribe((v) => {
        if (v) {
          const outer = document.querySelector(
            "[data-vivliostyle-outer-zoom-box]",
          ) as HTMLElement;
          if (button && outer) {
            const mb = button.getBoundingClientRect();
            const ob = outer.getBoundingClientRect();
            let left = x - mb.width; // shift to left
            if (left + mb.width > ob.right) {
              left = ob.right - mb.width - 10;
            }
            if (left < ob.left) {
              left = ob.left;
            }
            button.style.left = `${left}px`;
            if (mb.bottom > ob.bottom) {
              button.style.top = `${ob.bottom - mb.height - 10}px`;
            }
          }
        } else {
          button.removeEventListener("click", clickListner);
          subscription.dispose();
        }
      });
      this.startButtonOpened(true);
    }
  };
}

export interface MarkJson {
  mark: string;
  id: string;
  memo: string;
  markedText: string;
}

export interface MarksStoreInterface {
  init(documentId: string): Promise<void>;
  persistMark(mark: MarkJson): Promise<string>; // persists and return id
  getMark(id: string): Promise<MarkJson>;
  updateMark(mark: MarkJson): Promise<void>;
  removeMark(mark: MarkJson): Promise<void>;
  allMarks(): Promise<MarkJson[]>;
  allMarksIterator?(): Promise<AsyncIterable<MarkJson>>; //
}

let seqId = 0;

export class URLMarksStore implements MarksStoreInterface {
  private markArray: MarkJson[] = [];
  private markKeyToArrayIndex: Map<string, number>;
  public documentId = "";

  constructor() {
    this.markKeyToArrayIndex = new Map();
  }

  async init(documentId: string): Promise<void> {
    const marksParam = urlParameters.getParameter("mark");
    marksParam.forEach((m) => {
      const mark = this.urlStringToMark(m);
      this.pushMarkInternal(mark, "doNotAddToUrl", "persist");
    });
    this.documentId = documentId;
  }

  async persistMark(mark: MarkJson): Promise<string> {
    return this.pushMarkInternal(mark, "addToUrl", "persist");
  }

  async updateMark(mark: MarkJson): Promise<void> {
    await this.removeMark(mark);
    this.pushMarkInternal(mark, "addToUrl", "doNotPersist");
  }

  async getMark(id: string): Promise<MarkJson> {
    const index = this.markKeyToArrayIndex.get(id);
    return this.markArray[index];
  }

  async removeMark(mark: MarkJson): Promise<void> {
    const index = this.markKeyToArrayIndex.get(mark.id);
    this.markArray.splice(index, 1);
    this.markRemoved();
  }

  async allMarks(): Promise<MarkJson[]> {
    return this.markArray;
  }

  async allMarksIterator(): Promise<AsyncIterable<MarkJson>> {
    const arr = this.markArray;
    return (async function* (): AsyncIterable<MarkJson> {
      let i = 0;
      while (i < arr.length) {
        const v = arr[i++];
        yield v;
      }
    })();
  }

  private markToURLString(mark: MarkJson): string {
    const memo = mark.memo ? encodeURIComponent(mark.memo) : "";
    const markedText = mark.markedText
      ? encodeURIComponent(mark.markedText)
      : "";
    return `${mark.mark}%1F${memo}%1F${markedText}`;
  }

  private urlStringToMark(s: string): MarkJson {
    const [mark, memo, markedText] = s.split("%1F", 3);
    return {
      mark: mark,
      id: "",
      memo: memo ? decodeURIComponent(memo) : "",
      markedText: markedText ? decodeURIComponent(markedText) : "",
    };
  }

  private pushMarkInternal(
    mark: MarkJson,
    addToUrl: "addToUrl" | "doNotAddToUrl",
    persist: "persist" | "doNotPersist",
  ): string {
    if (persist == "persist") {
      mark.id = `${seqId++}`;
    }
    this.markArray.push(mark);
    this.markKeyToArrayIndex.set(mark.id, this.markArray.length - 1);
    if (addToUrl == "addToUrl") {
      const count = urlParameters.getParameter("mark").length;
      urlParameters.setParameter("mark", this.markToURLString(mark), count);
    }
    return mark.id;
  }

  private async markRemoved(): Promise<void> {
    this.markKeyToArrayIndex.clear();
    urlParameters.removeParameter("mark");
    this.markArray.forEach((m, i) => {
      urlParameters.setParameter("mark", this.markToURLString(m), i);
      this.markKeyToArrayIndex.set(m.id, i);
    });
  }
}

export class MarksStoreFacade {
  private actualStore?: MarksStoreInterface;
  private viewerOptions?: ViewerOptions;
  menuStatus: MarksMenuStatus;
  initialized: boolean;

  constructor() {
    this.menuStatus = new MarksMenuStatus(this);
    this.initialized = false;
  }

  enabled(): boolean {
    return this.initialized && this.viewerOptions.enableMarker();
  }

  async init(viewerOptions?: ViewerOptions): Promise<void> {
    if (viewerOptions) {
      this.viewerOptions = viewerOptions;
    }
    if (!this.viewerOptions || !this.viewerOptions.enableMarker()) {
      return;
    }
    if (window["marksStorePlugin"]) {
      this.actualStore = window["marksStorePlugin"] as MarksStoreInterface;
    } else {
      this.actualStore = new URLMarksStore();
    }
    const documentId = urlParameters.getParameter("src").join();
    await this.actualStore.init(documentId);
    this.initialized = true;
  }

  async toggleEnableMarker(): Promise<void> {
    if (!this.enabled()) {
      this.viewerOptions.enableMarker(true);
      if (!this.initialized) {
        await this.init();
      }
      await this.retryHighlightMarks();
    } else {
      document.querySelectorAll(`[${Mark.idAttr}]`).forEach((e) => {
        e.remove();
      });
      if (this.menuStatus.startButtonOpened()) {
        this.menuStatus.closeStartButton();
      }
      if (this.menuStatus.menuOpened()) {
        this.menuStatus.closeMenu();
      }
      this.viewerOptions.enableMarker(false);
    }
  }

  async persistMark(mark: Mark): Promise<void> {
    if (!this.initialized) return;
    const id = await this.actualStore.persistMark(mark.toMarkJson());
    mark.uniqueIdentifier = id;
    this.highlightMark(mark);
  }

  async updateMark(mark: Mark): Promise<void> {
    if (!this.initialized) return;
    this.unhighlightMark(mark);
    this.highlightMark(mark);
    this.actualStore.updateMark(mark.toMarkJson());
  }

  async getMark(id: string): Promise<Mark> {
    if (!this.initialized) return;
    return Mark.fromMarkJson(await this.actualStore.getMark(id));
  }

  async removeMark(mark: Mark): Promise<void> {
    if (!this.initialized) return;
    this.unhighlightMark(mark);
    await this.actualStore.removeMark(mark.toMarkJson());
  }

  async retryHighlightMarks(): Promise<void> {
    if (!this.enabled()) return;
    if (this.actualStore.allMarksIterator) {
      const it = await this.actualStore.allMarksIterator();
      for await (const m of it) {
        if (m) {
          this.highlightMark(Mark.fromMarkJson(m));
        }
      }
    } else {
      for await (const m of await this.actualStore.allMarks()) {
        if (m) {
          this.highlightMark(Mark.fromMarkJson(m));
        }
      }
    }
  }

  private unhighlightMark(mark: Mark): void {
    document
      .querySelectorAll(`[${Mark.idAttr}="${mark.uniqueIdentifier}"]`)
      .forEach((e) => {
        e.remove();
      });
  }
  private highlightMark(mark: Mark, allowNotPersisted = false): void {
    if (!mark.isPersisted && !allowNotPersisted) {
      throw "mark is not persisted.";
    }
    const start = selectedPositionToNode(mark.start);
    let end = selectedPositionToNode(mark.end);
    if (start && !end && !this.viewerOptions.renderAllPages()) {
      console.log();
      end = estimateLastEndFromStart(start, mark.end);
    }
    if (start && end) {
      const color = colorNameToColor(mark.color);
      highlight(start, end, { background: color }, mark);
    }
  }
}

export const marksStore = new MarksStoreFacade();
export const marksMenuStatus = marksStore.menuStatus;
