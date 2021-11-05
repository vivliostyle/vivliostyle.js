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

import ko from "knockout";
import applyTransformToRect from "../utils/scale-util";

const supportTouchEvents = "ontouchstart" in window;

const highlightSelection = (selection: Selection): void => {
  if (selection.type == "Range") {
    const range = selection.getRangeAt(0);

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
      div.style.background = "rgba(255, 0, 0, 0.2)";
      parent.appendChild(div);
    }
    selection.empty();
  }
};

const selectPosInfo = (node: Node, offset: number) => {
  const e = node.parentElement.closest("[data-adapt-eloff]");
  const eloff = e.getAttribute("data-adapt-eloff");
  const es = document.querySelectorAll(`[data-adapt-eloff='${eloff}']`);
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
        lastNodeTextLength = (lastNode as Text).data.length;
      } else {
        lastNodeTextLength = 0;
      }
    }
    count += childrenCount;
  }

  const children = e.childNodes;
  let nodeIndex = [...children].indexOf(node as ChildNode);
  if (nodeIndex == 0 && node.nodeType == 3 && lastNodeType == 3) {
    offset += lastNodeTextLength;
  } else {
    count += nodeIndex + 1;
  }

  return {
    eloff: eloff,
    nodeIndex: count,
    offset: offset,
  };
};

const processSelection = (selection: Selection): void => {
  const range = selection.getRangeAt(0);
  console.log(
    `start: ${JSON.stringify(
      selectPosInfo(range.startContainer, range.startOffset),
    )}`,
  );
  console.log(
    `end: ${JSON.stringify(
      selectPosInfo(range.endContainer, range.endOffset),
    )}`,
  );
  highlightSelection(selection);
};

ko.bindingHandlers.textSelection = {
  init(element, valueAccessor): void {
    if (ko.unwrap(valueAccessor())) {
      if (supportTouchEvents) {
        element.addEventListener("touchend", () => {
          processSelection(document.getSelection());
        });
      } else {
        element.addEventListener("mouseup", () => {
          processSelection(document.getSelection());
        });
      }
    }
  },
};
