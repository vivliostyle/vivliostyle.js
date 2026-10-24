---
name: improve-layout-performance
description: "Measure and improve the layout speed of Vivliostyle.js. Use when: a document or book takes longer to lay out than before, comparing the layout time of versions or commits, finding which commits made layout slower, profiling layout hotspots (forced style recalculations and reflows), or verifying that a performance change does not change the layout result."
argument-hint: "Document or publication URL/path to measure (for example: http://localhost:8080/mybook/publication.json), and optionally the versions to compare (for example: v2.45.2 vs master)"
---

# Improve Layout Performance

Measure how long Vivliostyle.js takes to lay out all pages of a document, find the code that makes it slow, change it, and verify that the layout result stays the same. The work is driven by `scripts/layout-perf.mjs` (`yarn test:layout-perf`).

## When to Use

- A book or document lays out more slowly than with an earlier version.
- A change is meant to be a performance improvement and needs numbers and a check that the output did not change.
- You need to know which commits since a release made layout slower.

## The Tool

```bash
yarn test:layout-perf <measure|profile|compare> --src <url|path> [options] <target>...
```

- Targets: `core:<git-ref>` (core built from a commit, e.g. `core:v2.45.2`, `core:master`, `core:<sha>`), `core:worktree` (the working tree), `viewer:canary`, `viewer:stable`, `viewer:<url>` (measure only). Prefix a label: `before=core:master`.
- `--src` is the document to lay out: a URL that allows CORS, or a local file path (the file is served with its directory, e.g. a `publication.json` and the files next to it; use `--serve-root <dir>` if the document uses root-relative URLs or files outside its directory). Use `--load document|publication` if the file extension does not tell.
- `measure` lays out all pages `--runs` times per target (interleaved) and prints the median, min and max time, after `--warmup` runs per target that are not counted (default 1; the first load of a remote document can take much longer). Core targets use a minified build, as in production, and time only the layout, not the loading of the bundle. Responses from remote servers are kept in memory after the first fetch, so that the network does not distort the timing (`--no-cache` to fetch them in every run; documents on localhost are never cached).
- `profile` records a CPU profile per target with an unminified build and prints the self and inclusive time per function, mapped to the source files. Functions are named from the source, e.g. `NodeContext.clone` or `Column.layoutNext/(anonymous)` (a closure in a method), so that they can be matched between versions. With two targets it prints the change of inclusive time per function; closures may not match when the code structure changed. `--callers <regex>` shows who calls the matching functions.
- `compare` lays out each target and compares the per-page DOM (attributes sorted) and the rects of all elements with the first target. `--repeat 2` renders each target twice, to tell nondeterministic results from real changes (it also allows a single target). It writes the DOM (`.html`) and the element rects (`.rects.txt`, one line per element with its source offset) of the first differing pages to `artifacts/layout-perf/compare/`, and exits with status 2 if anything differs.
- Builds are cached by commit in `artifacts/layout-perf/builds/`; profiles and JSON results also go to `artifacts/layout-perf/`.

The documents used for measuring are often private (e.g. a user's book). Pass them with `--src` only: never commit them, their URLs, or files from `artifacts/layout-perf/compare/` (which contain the document text).

## Procedure

### 1. Establish the Baseline

- Measure the release and the current code with at least 5 runs: `yarn test:layout-perf measure --src <doc> --runs 5 core:<last-release-tag> core:master`.
- Run-to-run noise is about ±1–3% (e.g. ±0.5s for a 15s layout, ±50ms for a 3s one). Compare medians, keep other heavy processes off the machine, and repeat a measurement before trusting a difference under about 3%. With `--no-cache`, a remote document adds the network's variation (±10% or more).
- `viewer:` targets also include loading the viewer and its UI, so compare them only with each other (e.g. `viewer:stable viewer:canary`), not with `core:` targets.

### 2. Find Where the Time Goes

- If a version is slower, list the core changes since the faster one (`git log --oneline <old>..<new> -- packages/core/src`) and measure the commits in between as labeled `core:<sha>` targets in one run (e.g. `2198=core:8f0784175`), so that they are interleaved under the same conditions; then narrow down the steps.
- Profile old and new: `yarn test:layout-perf profile --src <doc> old=core:<old> new=core:master`. Look at the diff table first, then at the self time of the new version.
- Most layout time is spent in the browser's style recalculation and layout, which a CPU profile attributes to the JavaScript function that forces it: a function that reads `getComputedStyle()` values, `getBoundingClientRect()`, `getClientRects()`, `offsetWidth` and so on after the DOM was changed. High self time in such a function means it forces a recalculation or reflow, not that its own code is slow.
- The cost of a forced reflow is the cost of the pending layout. Removing one read can move the cost to the next read, so judge a change by the total time (`measure`), not by the self time of one function.
- Use `--callers '^getElementClientRect '` (or another function) to see which code paths force the most layouts.
- Vivliostyle runs the layout as chains of asynchronous tasks, so the inclusive time of the callers can shift between runs and versions by more than the actual change. When the inclusive diff is inconsistent, compare the self time, and the total self time without `(idle)`, `(program)`, and `(garbage collector)`: a step that does not raise it is probably measurement noise.
- `(idle)` includes waiting outside the layout, e.g. for the network and for the tool to notice the end of the layout, so a difference in idle time alone does not mean slower layout code.

### 3. Typical Improvements

These patterns have made a difference before (PR #2217, PR #2219):

- Read computed styles only when the result is needed: do the cheap checks (DOM structure, attributes, cascaded values) first, and skip the `getComputedStyle()` read when they already decide the result.
- Do not interleave writes and reads. Setting a style and then reading a computed value in a loop forces a recalculation per iteration; do all the reads first, then the writes.
- Do not check something on every call that is rarely relevant: e.g. the ruby/emphasis code checked nested multi-column on every block, even in content without annotations; check the cheap "is there anything to do" condition first.
- Avoid per-page scans of all the preceding content: prune subtrees that end before the page start (using offsets that are already cached; `XMLDocHolder.getElementOffset()` indexes all the content up to the element it is called for).
- Selectors such as `[style*="..."]` scan and serialize every element of the subtree; avoid them in code that runs for every block.

### 4. Verify the Layout Result

- A `perf:` change must not change the layout. Compare the old and the new code on the document and on the test files related to the changed code:

  ```bash
  yarn test:layout-perf compare --src <doc> --repeat 2 core:master core:worktree
  for f in packages/core/test/files/page_breaks/*.html; do
    yarn -s test:layout-perf compare --src "$f" core:master core:worktree | grep " vs "
  done
  ```

- If the result changes, find out why before going on. Removing a forced recalculation can change the layout even when the code is otherwise equivalent, because the layout then depends on browser behavior that the timing of the recalculation hid or caused. In PR #2218, Chromium kept a stale column fragmentation after a container's block-end padding was removed, and whether that happened depended on whether a style recalculation was forced in between. To find such a cause:
  - Find the one forced read that matters: in a debug copy of the source, do the old read only for the first K calls (a global counter), and bisect K on the changed page.
  - Log the geometry measurements and the DOM mutations (a `MutationObserver` with `takeRecords()` at each measurement) around that call in both variants, and find the first measurement that differs.
  - Check whether the same DOM measures differently after a forced fresh layout (e.g. `display: none` and back on the box). If it does, the browser returns stale geometry; reduce it to a standalone page (snapshot the layout box HTML and the stylesheets, then replay the last steps) to report it.
- Changes that alter the layout, even improvements, go into a separate `fix:` commit and PR with a test case; the `perf:` change follows after it.

### 5. Test and Submit

- Run `yarn lint` and `yarn test:core`.
- Run the layout regression test against canary, which has the same code apart from the change: `yarn dev`, then `yarn test:layout-regression --actual-viewer dev --baseline-viewer canary`. Do not edit files under `packages/` while it runs (see `docs/layout-regression-test.md`). The CI compares against stable, so differences that canary already has can appear there and need triage.
- Commit as `perf: ...` with the measured numbers (before → after, the document size, and the browser) in the commit message and the PR description, together with how the unchanged output was verified. Do not name private documents in a public PR; describe them (e.g. "a 261-page book").
