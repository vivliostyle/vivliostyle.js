import ko, { ObservableArray } from "knockout";
import urlParameters from "../stores/url-parameters";
import applyTransformToRect from "../utils/scale-util";

const hightlightRange = (
  range: Range,
  background = "rgba(255, 0, 0, 0.2)",
): void => {
  // TODO; collect all active page container and check boundary.
  const parent = range.startContainer.parentElement.closest(
    "[data-vivliostyle-page-container='true']",
  );
  const zoomBox = range.startContainer.parentElement.closest(
    "[data-vivliostyle-outer-zoom-box]",
  ).firstElementChild as HTMLElement;
  const scale = zoomBox.style.transform;
  const parentRect = parent.getBoundingClientRect();
  const rects = range.getClientRects();
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
    parent.appendChild(div);
  }
};

const selectedNodeToPosition = (node: Node, offset: number): SelectPosition => {
  const e = node.parentElement.closest("[data-adapt-eloff]");
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

  const children = e.childNodes;
  const nodeIndex = [...children].indexOf(node as ChildNode);
  if (nodeIndex == 0 && node.nodeType == 3 && lastNodeType == 3) {
    offset += lastNodeTextLength;
  } else {
    count += nodeIndex + 1;
  }

  return new SelectPosition(eloff, count - 1, offset);
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
    let childrenCount = children.length;
    if (childrenCount > 0) {
      if (children[0].nodeType == 3 && lastNodeType == 3) {
        childrenCount -= 1;
      }
      if (count + childrenCount > pos.nodeIndex) {
        if (count == pos.nodeIndex + 1) {
          // maybe the result is the first node
          if (children[0].nodeType == 3) {
            const targetCandidate = children[0] as Text;
            if (
              lastNodeTextLength <= pos.offset &&
              pos.offset <= lastNodeTextLength + targetCandidate.data.length
            ) {
              targetNode = targetCandidate;
              break;
            }
          } else {
            console.error("should not reach here.");
          }
        } else if (count + childrenCount == pos.nodeIndex + 1) {
          // maybe the result is the last node
          if (children[children.length - 1].nodeType == 3) {
            const targetCandidate = children[children.length - 1] as Text;
            if (pos.offset <= targetCandidate.data.length) {
              targetNode = targetCandidate;
              lastNodeTextLength = 0;
              break;
            }
          }
        } else {
          // the result is the specified node
          targetNode = children[pos.nodeIndex - count] as Text;
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
  constructor(
    readonly eloff: number,
    readonly nodeIndex: number,
    readonly offset: number,
  ) {}

  toString(): string {
    return `${this.eloff}-${this.nodeIndex}-${this.offset}`;
  }

  static fromString(str: string): SelectPosition {
    const [eloff, nodeIndex, offset] = str.split("-").map((x) => x.trim());
    return new SelectPosition(
      parseInt(eloff),
      parseInt(nodeIndex),
      parseInt(offset),
    );
  }
}

class Mark {
  constructor(readonly start: SelectPosition, readonly end: SelectPosition) {
    // TODO; generete id ?
  }

  toString(): string {
    return `${this.start},${this.end}`;
  }

  static fromString(str: string): Mark {
    const [s, e] = str.split(",");
    const start = SelectPosition.fromString(s);
    const end = SelectPosition.fromString(e);
    return new Mark(start, end);
  }
}

export const processSelection = (selection: Selection): void => {
  if (selection.type == "Range") {
    const range = selection.getRangeAt(0);
    if (
      range.startContainer.nodeType !== 3 ||
      range.endContainer.nodeType !== 3
    ) {
      // do nothing
      return;
    }
    const start = selectedNodeToPosition(
      range.startContainer,
      range.startOffset,
    );
    const end = selectedNodeToPosition(range.endContainer, range.endOffset);

    const reStart = selectedPositionToNode(start);
    const reEnd = selectedPositionToNode(end);
    if (reStart && reEnd) {
      const mark = new Mark(start, end);
      marksStore.pushMark(mark);
    } else {
      console.error("something wrong");
    }
    selection.empty();
  }
};

export class MarksStore {
  markArray: ObservableArray<Mark>;
  constructor() {
    this.markArray = ko.observableArray();
    this.markArray.subscribe(this.markChanged, null, "arrayChange");
  }

  init(): void {
    const marksParam = urlParameters.getParameter("mark");
    marksParam.forEach((m) => {
      const mark = Mark.fromString(m);
      this.pushMark(mark, false);
    });
    // TODO; wait for page rendered.
  }

  pushMark(mark: Mark, addToUrl = true): void {
    this.markArray.push(mark);
    if (addToUrl) {
      urlParameters.setParameter("mark", mark.toString());
    }
  }

  markChanged = (changes: ko.utils.ArrayChange<Mark>[]): void => {
    for (const change of changes) {
      if (change.status == "added") {
        const start = selectedPositionToNode(change.value.start);
        const end = selectedPositionToNode(change.value.end);
        if (start && end) {
          const range = document.createRange();
          range.setStart(start.node, start.offset);
          range.setEnd(end.node, end.offset);
          hightlightRange(range, "rgba(0, 255, 0, 0.2)");
        }
      }
    }
  };
}

const marksStore = new MarksStore();

export default marksStore;
