/**
 * Copyright 2026 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as Counters from "../../../src/vivliostyle/counters";
import * as Toc from "../../../src/vivliostyle/toc";

const documentURLTransformer = {
  transformFragment(fragment) {
    return fragment;
  },
  transformURL(url) {
    return url;
  },
  restoreURL(encoded) {
    return [encoded, ""];
  },
};

function bookmark(offset, level, label, closed = false) {
  return { offset, level, label, closed, id: `id${offset}` };
}

describe("toc", () => {
  describe("createBookmarksTocDocument", () => {
    function toTree(list) {
      return Array.from(list.children).map((li) => {
        const anchor = li.querySelector(":scope > a");
        const sublist = li.querySelector(":scope > ol");
        const node = {
          label: anchor.textContent,
          href: anchor.getAttribute("href"),
          state: anchor.getAttribute(Toc.bookmarkStateAttr),
        };
        if (sublist) {
          node.children = toTree(sublist);
        }
        return node;
      });
    }

    it("nests bookmarks by level across documents", () => {
      const doc = Toc.createBookmarksTocDocument(
        [
          {
            url: "http://example.com/a.html",
            bookmarks: [
              bookmark(1, 1, "A"),
              bookmark(2, 2, "A.1"),
              bookmark(3, 3, "A.1.1"),
              bookmark(4, 2, "A.2", true),
            ],
          },
          {
            url: "http://example.com/b.html",
            bookmarks: [bookmark(1, 1, "B"), bookmark(2, 3, "B.x")],
          },
        ],
        "en",
      );
      expect(doc.documentElement.getAttribute("lang")).toBe("en");
      const nav = doc.querySelector("nav[role=doc-toc]");
      expect(nav).not.toBeNull();
      expect(toTree(nav.querySelector(":scope > ol"))).toEqual([
        {
          label: "A",
          href: "http://example.com/a.html#id1",
          state: "open",
          children: [
            {
              label: "A.1",
              href: "http://example.com/a.html#id2",
              state: "open",
              children: [
                {
                  label: "A.1.1",
                  href: "http://example.com/a.html#id3",
                  state: "open",
                },
              ],
            },
            {
              label: "A.2",
              href: "http://example.com/a.html#id4",
              state: "closed",
            },
          ],
        },
        {
          label: "B",
          href: "http://example.com/b.html#id1",
          state: "open",
          // Bookmarks do not need to form a strict hierarchy of levels.
          children: [
            {
              label: "B.x",
              href: "http://example.com/b.html#id2",
              state: "open",
            },
          ],
        },
      ]);
    });

    it("keeps a bookmark with a lower level than the first at top level", () => {
      const doc = Toc.createBookmarksTocDocument(
        [
          {
            url: "http://example.com/a.html",
            bookmarks: [bookmark(1, 2, "X"), bookmark(2, 1, "Y")],
          },
        ],
        null,
      );
      const labels = Array.from(
        doc.querySelectorAll("nav > ol > li > a"),
        (a) => a.textContent,
      );
      expect(labels).toEqual(["X", "Y"]);
    });
  });

  describe("CounterStore.setBookmark", () => {
    it("keeps bookmarks in document order and updates by offset", () => {
      const store = new Counters.CounterStore(documentURLTransformer);
      const url = "http://example.com/a.html";
      expect(store.hasBookmarks()).toBe(false);
      store.setBookmark(url, bookmark(20, 1, "B"));
      store.setBookmark(url, bookmark(10, 1, "A"));
      store.setBookmark(url, bookmark(30, 1, "C"));
      expect(store.hasBookmarks()).toBe(true);
      expect(store.bookmarksByDocURL[url].map((b) => b.label)).toEqual([
        "A",
        "B",
        "C",
      ]);
      const version = store.bookmarksVersion;

      // Same bookmark again (e.g., re-layout) does not change the version.
      store.setBookmark(url, bookmark(20, 1, "B"));
      expect(store.bookmarksVersion).toBe(version);

      // Changed label replaces the bookmark at the same offset.
      store.setBookmark(url, bookmark(20, 1, "B2"));
      expect(store.bookmarksVersion).toBe(version + 1);
      expect(store.bookmarksByDocURL[url].map((b) => b.label)).toEqual([
        "A",
        "B2",
        "C",
      ]);
    });
  });
});
