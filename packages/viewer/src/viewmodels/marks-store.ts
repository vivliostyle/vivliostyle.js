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

import ko, { Observable, ObservableArray } from "knockout";
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

const highlightRange = (
  range: Range,
  background = "rgba(255, 0, 0, 0.2)",
  mark: Mark,
): void => {
  // TODO; collect all active page container and check boundary.
  const parent = range.startContainer.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  if (mark.existMarkIn(parent)) {
    // already exists;
    return;
  }
  const zoomBox = range.startContainer?.parentElement?.closest(
    "[data-vivliostyle-outer-zoom-box]",
  )?.firstElementChild as HTMLElement;
  const scale = zoomBox?.style?.transform;
  const parentRect = parent?.getBoundingClientRect();
  const rects = range?.getClientRects() || [];
  const selectId = mark.idString();
  const invokeMenu = (event: MouseEvent): void => {
    const x = event.clientX;
    const y = event.clientY;
    marksMenuStatus.openEditMenu(x, y, selectId);
  };

  for (const r of rects) {
    const rect = applyTransformToRect(r, scale, parentRect);
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
    div.addEventListener("click", invokeMenu);
    parent.appendChild(div);
  }
};

const selectedNodeToPosition = (node: Node, offset: number): SelectPosition => {
  const e = node.parentElement.closest("[data-adapt-eloff]");
  const nodePath: Node[] = [];
  let n = node;
  while (n && n !== e) {
    nodePath.unshift(n);
    n = n.parentElement;
  }
  const eloff = parseInt(e.getAttribute("data-adapt-eloff"));
  const es = collectElementsWithEloff(eloff);
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

  return new SelectPosition(eloff, nodeIndexPath, offset);
};

interface NodePosition {
  node: Node;
  offset: number;
}

const selectedPositionToNode = (pos: SelectPosition): NodePosition | null => {
  const es = collectElementsWithEloff(pos.eloff);
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

const collectElementsWithEloff = (eloff: number): Element[] => {
  const eloffAttrSelector = `[data-adapt-eloff='${eloff}']`;
  return Array.from(document.querySelectorAll(eloffAttrSelector)).filter(
    (e) => !e.querySelector(eloffAttrSelector),
  );
};

class SelectPosition {
  // TODO ; should include document index
  constructor(
    readonly eloff: number,
    readonly nodePath: number[],
    readonly offset: number,
  ) {}

  toString(): string {
    return `${this.eloff}-${this.nodePath.join("/")}-${this.offset}`;
  }

  static fromString(str: string): SelectPosition {
    const [eloff, nodePathString, offset] = str.split("-").map((x) => x.trim());
    const nodePath = nodePathString.split("/").map((x) => parseInt(x));
    return new SelectPosition(parseInt(eloff), nodePath, parseInt(offset));
  }
}

let markSeq = 0;
class Mark {
  readonly seqNumber: number;
  static readonly idAttr = "data-viv-marker-id";
  constructor(
    readonly start: SelectPosition,
    readonly end: SelectPosition,
    readonly color: string,
  ) {
    this.seqNumber = markSeq++;
  }

  toString(): string {
    return `${this.start},${this.end},${this.color}`;
  }

  idString(): string {
    // TODO; may change
    return `${this.seqNumber}`;
  }

  existMarkIn(e: Element): boolean {
    return !!e.querySelector(`[${Mark.idAttr}="${this.idString()}"]`);
  }

  static fromString(str: string): Mark {
    const [s, e, c] = str.split(",");
    const start = SelectPosition.fromString(s);
    const end = SelectPosition.fromString(e);
    return new Mark(start, end, c);
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

export class MarksMenuStatus {
  selectionMenuOpened: Observable<boolean>;
  editMenuOpened: Observable<boolean>;
  currentStart?: SelectPosition;
  currentEnd?: SelectPosition;
  currentSelection?: Selection;
  currentEditing?: Mark;
  currentEditingColor: Observable<string>;

  constructor(private parent: MarksStore) {
    this.selectionMenuOpened = ko.observable(false);
    this.editMenuOpened = ko.observable(false);
    this.currentEditingColor = ko.observable("");
  }

  editingColorChanged = (colorName: string): void => {
    if (this.currentEditing) {
      const color = colorNameToColor(colorName);
      if (color.length > 0) {
        document
          .querySelectorAll(
            `[${Mark.idAttr}="${this.currentEditing.idString()}"]`,
          )
          .forEach((e) => {
            (e as HTMLElement).style.background = color;
          });
      }
    }
  };

  openEditMenu = (x: number, y: number, id: string): void => {
    this.closeSelectionMenu();
    const menu = document.getElementById(
      "vivliostyle-text-selection-edit-menu",
    ) as HTMLElement;
    if (menu) {
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
    this.currentEditing = this.parent.getMarkWithId(id);
    this.currentEditingColor(this.currentEditing.color);
    const subscription = this.editMenuOpened.subscribe((v) => {
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
    this.editMenuOpened(true);
  };

  closeEditMenu = (): void => {
    if (this.currentEditing) {
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
    }
    this.currentEditing = undefined;
    this.editMenuOpened(false);
  };

  private deleteCurrentEditingInternal = (): void => {
    if (this.currentEditing) {
      this.parent.removeMark(this.currentEditing);
      document
        .querySelectorAll(
          `[${Mark.idAttr}="${this.currentEditing.idString()}"]`,
        )
        .forEach((e) => {
          e.remove();
        });
    }
  };
  applyEditing = (): void => {
    if (this.currentEditing) {
      if (this.currentEditingColor() != this.currentEditing.color) {
        const newMark = new Mark(
          this.currentEditing.start,
          this.currentEditing.end,
          this.currentEditingColor(),
        );
        this.parent.pushMark(newMark);
        this.deleteCurrentEditingInternal();
      }
    }
    this.closeEditMenu();
  };

  deleteCurrentEditing = (): void => {
    if (confirm("削除しますか？")) {
      this.deleteCurrentEditingInternal();
    }
    this.closeEditMenu();
  };

  openSelectionMenu = (
    x: number,
    y: number,
    start: SelectPosition,
    end: SelectPosition,
    selection: Selection,
  ): void => {
    this.currentStart = start;
    this.currentEnd = end;
    this.currentSelection = selection;
    const menu = document.getElementById(
      "vivliostyle-text-selection-menu",
    ) as HTMLElement;
    if (menu) {
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
    const subscription = this.selectionMenuOpened.subscribe((v) => {
      if (v) {
        const menu = document.getElementById(
          "vivliostyle-text-selection-menu",
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
    this.selectionMenuOpened(true);
  };

  closeSelectionMenu = (): void => {
    this.currentStart = undefined;
    this.currentEnd = undefined;
    this.currentSelection = undefined;
    this.selectionMenuOpened(false);
  };

  mark(colorName: string): void {
    if (this.currentStart && this.currentEnd) {
      const mark = new Mark(this.currentStart, this.currentEnd, colorName);
      marksStore.pushMark(mark);
    }
    this.currentSelection?.empty();
    this.closeSelectionMenu();
  }
}

export class MarksStore {
  private markArray: ObservableArray<Mark>;
  markKeyToArrayIndex: Map<string, number>;
  menuStatus: MarksMenuStatus;

  constructor() {
    this.markArray = ko.observableArray();
    this.markKeyToArrayIndex = new Map();
    this.markArray.subscribe(this.markChanged, null, "arrayChange");
    this.menuStatus = new MarksMenuStatus(this);
  }

  init(): void {
    const marksParam = urlParameters.getParameter("mark");
    marksParam.forEach((m) => {
      const mark = Mark.fromString(m);
      this.pushMark(mark, false);
    });
  }

  pushMark(mark: Mark, addToUrl = true): void {
    this.markArray.push(mark);
    this.markKeyToArrayIndex.set(mark.idString(), this.markArray().length - 1);
    if (addToUrl) {
      const count = urlParameters.getParameter("mark").length;
      urlParameters.setParameter("mark", mark.toString(), count);
    }
  }

  retryHighlightMarks(): void {
    this.markArray().forEach((mark) => {
      this.highlightMark(mark);
    });
  }

  private highlightMark(mark: Mark): void {
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
  getMarkWithId(id: string): Mark {
    const index = this.markKeyToArrayIndex.get(id);
    return this.markArray()[index];
  }

  removeMark(mark: Mark): void {
    this.markArray.remove(mark);
  }
  markChanged = (changes: ko.utils.ArrayChange<Mark>[]): void => {
    let removed = false;
    for (const change of changes) {
      if (change.status == "added") {
        this.highlightMark(change.value);
      }
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

export const marksStore = new MarksStore();
export const marksMenuStatus = marksStore.menuStatus;
