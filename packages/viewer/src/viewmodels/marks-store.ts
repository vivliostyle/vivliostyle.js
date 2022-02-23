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

import ko, { Computed, Observable, ObservableArray } from "knockout";
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
  //  return e.hasAttribute('data-adapt-eloff') || e.parentElement?.hasAttribute('data-adapt-eloff');
  return !!e.closest("[data-adapt-eloff]");
};

interface TextInRange {
  t: Text;
  startOffset: number;
  endOffset: number;
}

const collectTextWithEloffInRange = (r: Range): TextInRange[] => {
  const start = r.startContainer;
  const end = r.endContainer;
  const nodes: TextInRange[] = [];
  for (let node = start; node; node = getNextNode(node)) {
    if (node.nodeType == 3 && isNodeInEloff(node)) {
      const t = node as Text;
      const startOffset = node == start ? r.startOffset : 0;
      const endOffset = node == end ? r.endOffset : t.data.length;
      nodes.push({ t, startOffset, endOffset });
    }
    if (node == end) {
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

const highlightRange = (
  range: Range,
  background = "rgba(255, 0, 0, 0.2)",
  mark?: Mark,
): void => {
  // TODO; collect all active page container and check boundary.
  const startParent = range.startContainer.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  const endParent = range.endContainer.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  if (mark?.existMarkIn(startParent) && mark?.existMarkIn(endParent)) {
    // already exists;
    return;
  }
  const zoomBox = range.startContainer?.parentElement?.closest(
    "[data-vivliostyle-outer-zoom-box]",
  )?.firstElementChild as HTMLElement;
  const scale = zoomBox?.style?.transform;
  const textNodes = collectTextWithEloffInRange(range);
  const selectId = mark?.idString() || Mark.notCreatedId;
  const invokeMenu = (event: MouseEvent): void => {
    const x = event.clientX;
    const y = event.clientY;
    marksMenuStatus.openEditMenu(x, y, selectId);
  };

  let index = 0;
  Array.from(textNodes).forEach((tn) => {
    const parent = tn.t.parentElement.closest(
      "[data-vivliostyle-page-container='true']",
    );
    const parentRect = parent?.getBoundingClientRect();
    for (const r of textNodeRects(tn)) {
      const rect = applyTransformToRect(r, scale, parentRect);
      const rectNum = index++;
      if (
        document.querySelector(
          `[${Mark.idAttr}='${selectId}'][data-mn='${rectNum}']`,
        )
      ) {
        // already exists.
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
      div.style.background = background;
      div.setAttribute(Mark.idAttr, selectId);
      div.setAttribute("data-mn", `${rectNum}`);
      div.addEventListener("click", invokeMenu);
      parent.appendChild(div);
    }
  });
};

export const getPageIndex = (pageElement: Element): number => {
  const p = parseInt(pageElement.getAttribute("data-vivliostyle-page-index"));
  if (isNaN(p)) {
    return -1;
  }
  return p;
};

const getSpineIndex = (pageElement: Element): number => {
  const p =
    parseInt(pageElement.getAttribute("data-vivliostyle-spine-index")) || -1;
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

  return new SelectPosition(spineIndex, eloff, nodeIndexPath, offset);
};

interface NodePosition {
  node: Node;
  offset: number;
}

const selectedPositionToNode = (pos: SelectPosition): NodePosition | null => {
  const es = collectElementsWithEloff(pos.spine, pos.eloff);
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
      if (nextCount >= pos.nodePath[0]) {
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
          if (pos.offset < targetCandidate.data.length) {
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

const collectElementsWithEloff = (spine: number, eloff: number): Element[] => {
  const eloffAttrSelector = `[data-vivliostyle-spine-index='${spine}'] [data-adapt-eloff='${eloff}']`;
  return Array.from(document.querySelectorAll(eloffAttrSelector)).filter(
    (e) => !e.querySelector(eloffAttrSelector),
  );
};

export class SelectPosition {
  constructor(
    readonly spine: number,
    readonly eloff: number,
    readonly nodePath: number[],
    readonly offset: number,
  ) {}

  toString(): string {
    return `${this.spine}-${this.eloff}-${this.nodePath.join("/")}-${
      this.offset
    }`;
  }

  static fromString(str: string): SelectPosition {
    const [spine, eloff, nodePathString, offset] = str
      .split("-")
      .map((x) => x.trim());
    const nodePath = nodePathString.split("/").map((x) => parseInt(x));
    return new SelectPosition(
      parseInt(spine),
      parseInt(eloff),
      nodePath,
      parseInt(offset),
    );
  }
}

export class Mark {
  uniqueIdentifier?: string;
  static readonly idAttr = "data-viv-marker-id";
  static readonly notCreatedId = "not-created";
  constructor(
    public start: SelectPosition,
    public end: SelectPosition,
    public color: string,
  ) {
    this.uniqueIdentifier = Mark.notCreatedId;
  }

  toString(): string {
    return `${this.start},${this.end},${this.color}`;
  }

  idString(): string {
    return `${this.uniqueIdentifier}`;
  }

  isPersisted(): boolean {
    return this.uniqueIdentifier && this.uniqueIdentifier != Mark.notCreatedId;
  }

  existMarkIn(e: Element): boolean {
    return !!e.querySelector(`[${Mark.idAttr}="${this.idString()}"]`);
  }

  static fromString(str: string): Mark {
    const [s, e, c] = str.split(",");
    const start = SelectPosition.fromString(s);
    const end = SelectPosition.fromString(e);
    const m = new Mark(start, end, c);
    return m;
  }
}

export const processSelection = (
  selection: Selection,
  event: MouseEvent,
): void => {
  if (selection.type == "Range") {
    const range = selection.getRangeAt(0);
    if (
      range.startContainer.nodeType !== 3 ||
      range.endContainer.nodeType !== 3
    ) {
      // do nothing
      // TODO; find text container neareset start/end;
      selection.empty();
      return;
    }
    const start = selectedNodeToPosition(
      range.startContainer,
      range.startOffset,
    );
    const end = selectedNodeToPosition(range.endContainer, range.endOffset);
    const x = event.clientX;
    const y = event.clientY;
    marksMenuStatus.openSelectionMenu(x, y, start, end, selection); // TODO
  }
};

interface MarkAction {
  currentId(): string;
  deletable(): boolean;
  cancellable(): boolean;
  applyEditing(): void;
  colorChanged(): void;
  deleteCurrentEditing(): void;
  close(): void;
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
  applyEditing(): void {
    return;
  }
  colorChanged(): void {
    return;
  }
  deleteCurrentEditing(): void {
    return;
  }
  close(): void {
    return;
  }
}
class NewMarkAction implements MarkAction {
  currentStart?: SelectPosition;
  currentEnd?: SelectPosition;

  start = (
    currentStart: SelectPosition,
    currentEnd: SelectPosition,
    currentSelection: Selection,
  ): void => {
    this.currentStart = currentStart;
    this.currentEnd = currentEnd;
    const start = selectedPositionToNode(this.currentStart);
    const end = selectedPositionToNode(this.currentEnd);
    if (start && end) {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      const color = colorNameToColor(marksMenuStatus.currentEditingColor());
      highlightRange(range, color);
      currentSelection.empty();
    }
  };

  deletable = (): boolean => false;
  cancellable = (): boolean => true;
  deleteCurrentEditing = (): void => {
    // do nothing
  };
  currentId = (): string => Mark.notCreatedId;
  applyEditing = (): void => {
    if (this.currentStart && this.currentEnd) {
      const mark = new Mark(
        this.currentStart,
        this.currentEnd,
        marksMenuStatus.currentEditingColor(),
      );
      marksStore.persistMark(mark);
    }
    marksMenuStatus.closeMenu();
  };

  colorChanged = (): void => {
    if (this.cancellable() == false) {
      this.applyEditing();
    }
  };

  close = (): void => {
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
  deleteCurrentEditing = (): void => {
    if (this.currentEditing) {
      marksStore.removeMark(this.currentEditing);
    }
  };

  currentId = (): string => {
    return this.currentEditing?.idString();
  };

  applyEditing = (): void => {
    if (this.currentEditing) {
      if (marksMenuStatus.currentEditingColor() != this.currentEditing.color) {
        this.currentEditing.color = marksMenuStatus.currentEditingColor();
        marksStore.updateMark(this.currentEditing);
      }
    }
    marksMenuStatus.closeMenu();
  };
  colorChanged = (): void => {
    // do nothing.
  };

  close = (): void => {
    if (this.currentEditing) {
      // TODO ; should be in method cancel() or the like
      const color = colorNameToColor(this.currentEditing.color);
      if (color.length > 0) {
        document
          .querySelectorAll(
            `[${Mark.idAttr}="${this.currentEditing.idString()}"]`,
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
  selectionMenuOpened: Observable<boolean>;
  currentEditingColor: Observable<string>;
  deletable: Computed<boolean>;
  cancellable: Computed<boolean>;
  markAction: Observable<MarkAction>;
  emptyAction: EmptyMarkAction;
  editAction: EditAction;
  newMarkAction: NewMarkAction;

  constructor(private parent: MarksStoreFacade) {
    this.menuOpened = ko.observable(false);
    this.selectionMenuOpened = ko.observable(false);
    this.currentEditingColor = ko.observable("");
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

  editingColorChanged = (colorName: string): void => {
    const idString = this.markAction().currentId();
    const color = colorNameToColor(colorName);
    if (color.length > 0) {
      document
        .querySelectorAll(`[${Mark.idAttr}="${idString}"]`)
        .forEach((e) => {
          (e as HTMLElement).style.background = color;
        });
    }
    this.markAction().colorChanged();
  };

  private openMenu = (x: number, y: number): void => {
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
          if (mb.right > ob.right) {
            menu.style.left = `${ob.right - mb.width - 10}px`;
          }
          if (mb.bottom > ob.bottom) {
            menu.style.top = `${ob.bottom - mb.height - 10}px`;
          }
        }
      }
      subscription.dispose();
    });
    this.menuOpened(true);
  };

  openEditMenu = (x: number, y: number, id: string): void => {
    const currentEditing = this.parent.getMark(id);
    this.currentEditingColor(currentEditing.color);
    this.editAction.currentEditing = currentEditing;
    this.markAction(this.editAction);
    this.openMenu(x, y);
  };

  closeMenu = (): void => {
    this.markAction().close();
    this.markAction(this.emptyAction);
    this.menuOpened(false);
  };

  applyEditing = (): void => {
    this.markAction().applyEditing();
  };

  deleteCurrentEditing = (): void => {
    if (confirm("削除しますか？")) {
      this.markAction().deleteCurrentEditing();
    }
    this.closeMenu();
  };

  openSelectionMenu = (
    x: number,
    y: number,
    start: SelectPosition,
    end: SelectPosition,
    selection: Selection,
  ): void => {
    this.currentEditingColor("yellow");
    this.newMarkAction.start(start, end, selection);
    this.markAction(this.newMarkAction);
    this.openMenu(x, y);
  };

  closeSelectionMenu = (): void => {
    //    this.currentStart = undefined;
    //    this.currentEnd = undefined;
    //    this.currentSelection = undefined;
    this.selectionMenuOpened(false);
  };
}

export interface MarksStoreInterface {
  init(documentId: string): void;
  persistMark(mark: Mark): Mark; // should set unique identifier to mark object
  getMark(id: string): Mark;
  updateMark(mark: Mark): void;
  removeMark(mark: Mark): void;
  getAllMarks(): Mark[];
}

let seqId = 0;
export class URLMarksStore implements MarksStoreInterface {
  private markArray: ObservableArray<Mark>;
  private markKeyToArrayIndex: Map<string, number>;
  public documentId = "";

  constructor() {
    this.markArray = ko.observableArray();
    this.markKeyToArrayIndex = new Map();
    this.markArray.subscribe(this.markChanged, null, "arrayChange");
  }

  init(documentId: string): void {
    const marksParam = urlParameters.getParameter("mark");
    marksParam.forEach((m) => {
      const mark = Mark.fromString(m);
      this.pushMarkInternal(mark, "doNotAddToUrl", "persist");
    });
    this.documentId = documentId;
    console.log(documentId);
  }

  persistMark(mark: Mark): Mark {
    return this.pushMarkInternal(mark, "addToUrl", "persist");
  }

  updateMark(mark: Mark): void {
    this.removeMark(mark);
    this.pushMarkInternal(mark, "addToUrl", "doNotPersist");
  }

  getMark(id: string): Mark {
    const index = this.markKeyToArrayIndex.get(id);
    return this.markArray()[index];
  }

  removeMark(mark: Mark): void {
    this.markArray.remove(mark);
  }

  getAllMarks(): Mark[] {
    return this.markArray();
  }

  private pushMarkInternal(
    mark: Mark,
    addToUrl: "addToUrl" | "doNotAddToUrl",
    persist: "persist" | "doNotPersist",
  ): Mark {
    if (persist == "persist") {
      mark.uniqueIdentifier = `${seqId++}`;
    }
    this.markArray.push(mark);
    this.markKeyToArrayIndex.set(mark.idString(), this.markArray().length - 1);
    if (addToUrl == "addToUrl") {
      const count = urlParameters.getParameter("mark").length;
      urlParameters.setParameter("mark", mark.toString(), count);
    }
    return mark;
  }

  markChanged = (changes: ko.utils.ArrayChange<Mark>[]): void => {
    let removed = false;
    for (const change of changes) {
      removed = removed || change.status == "deleted";
    }
    if (removed) {
      console.log("remove occured");
      this.markKeyToArrayIndex.clear();
      urlParameters.removeParameter("mark");
      this.markArray().forEach((m, i) => {
        urlParameters.setParameter("mark", m.toString(), i);
        this.markKeyToArrayIndex.set(m.idString(), i);
      });
    }
  };
}

export class MarksStoreFacade {
  private actualStore?: MarksStoreInterface;
  menuStatus: MarksMenuStatus;

  constructor() {
    this.menuStatus = new MarksMenuStatus(this);
  }

  init(): void {
    this.actualStore = new URLMarksStore(); // TODO
    const src = urlParameters.getParameter("src").join();
    const bookMode = urlParameters.getParameter("bookMode").join();
    const userStyle = urlParameters.getParameter("userStyle").join();
    const documentId = `${src}:${bookMode}:${userStyle}`;
    this.actualStore.init(documentId);
  }

  persistMark(mark: Mark): void {
    mark = this.actualStore.persistMark(mark);
    this.highlightMark(mark);
  }

  updateMark(mark: Mark): void {
    this.unhighlightMark(mark);
    this.highlightMark(mark);
    this.actualStore.updateMark(mark);
  }

  getMark(id: string): Mark {
    return this.actualStore.getMark(id);
  }

  removeMark(mark: Mark): void {
    this.unhighlightMark(mark);
    this.actualStore.removeMark(mark);
  }

  retryHighlightMarks(): void {
    this.actualStore.getAllMarks().forEach((mark) => {
      this.highlightMark(mark);
    });
  }

  private unhighlightMark(mark: Mark): void {
    document
      .querySelectorAll(`[${Mark.idAttr}="${mark.idString()}"]`)
      .forEach((e) => {
        e.remove();
      });
  }
  private highlightMark(mark: Mark, allowNotPersisted = false): void {
    if (!mark.isPersisted && !allowNotPersisted) {
      throw "mark is not persisted.";
    }
    const start = selectedPositionToNode(mark.start);
    const end = selectedPositionToNode(mark.end);
    if (start && end) {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      const color = colorNameToColor(mark.color);
      highlightRange(range, color, mark);
    }
  }
}

export const marksStore = new MarksStoreFacade();
export const marksMenuStatus = marksStore.menuStatus;
