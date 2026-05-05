---
name: fix-wpt-reftest-failure
description: "Fix Vivliostyle.js bugs found by WPT reftest and reftest-diff failures. Use when: investigating FAIL results from yarn test:reftest or yarn test:reftest-diff, comparing test vs reference render, fixing longstanding WPT failures or regressions, or working through grouped WPT issues such as #1915."
argument-hint: "Issue number/URL, report path, or one failing WPT file path (for example: #1915 or css/CSS2/pagination/table-page-break-inside-avoid-5-print.html)"
---

# Fix a WPT Reftest Failure

Reproduce a failing WPT reftest or reftest-diff case, inspect the rendered difference, fix the Vivliostyle.js bug, and verify the result with the narrowest relevant reftest. Keep one session focused on one root cause.

This skill is specific to Vivliostyle.js and its WPT workflow. It assumes the repo layout, `yarn dev`, and the commands documented in `docs/layout-regression-test.md`.

## When to Use

- A WPT case fails in `yarn test:reftest`.
- A regression is reported by `yarn test:reftest-diff`.
- An issue such as `#1915` groups several WPT failures and you need to determine whether they share one cause.
- The report shows page count mismatch, screenshot mismatch, or a suspicious `reference render`.

## Decision Rules

- Use `reftest` when the goal is to compare the current local dev build against the WPT reference.
- Use `reftest-diff` when the goal is to compare two viewer versions and judge whether the local change is a regression, an improvement, or a pre-existing difference.
- Do not require prior PASS history. This skill also covers WPT failures that Vivliostyle has never passed in older versions.
- If an issue contains multiple failing WPT files, cluster them by likely root cause. If they do not clearly share one cause, pick one cluster and fix only that in the current session.
- If `test` and `reference render` differ, do not assume the test side is wrong. The reference side can also expose a Vivliostyle bug.
- If the correct rendering is unclear, verify against the WPT file contents, linked CSS spec text, and, when useful, the document rendered without the Vivliostyle viewer.

## Procedure

### 1. Define the Target

- Parse the user's input as one of:
  - a GitHub issue or issue URL
  - a report path such as `artifacts/tmp-issue1915/report.md`
  - a WPT file path such as `css/CSS2/pagination/table-page-break-inside-avoid-5-print.html`
- If the input is an issue, extract the failing WPT file list and note whether the issue already suggests a suspected cause.
- Choose the narrowest representative failing case that can confirm or falsify one root-cause hypothesis.

### 2. Start or Reuse the Dev Server

- Run `yarn dev` from the repo root.
- If the output says the dev server is already running at `http://localhost:3300/core/test/files/`, reuse it.
- Keep the dev server running throughout the edit and verification loop.

### 3. Run the Narrowest Reftest Command

- For one local failure against the WPT reference, start with:

```bash
yarn test:reftest --actual-viewer dev --out-dir artifacts/tmp-wpt-fix --file <wpt-file>
```

- For a comparison against a previous release or another viewer, start with:

```bash
yarn test:reftest-diff --actual-viewer dev --baseline-viewer <viewer-spec> --out-dir artifacts/tmp-wpt-fix --file <wpt-file>
```

- Prefer a single `--file` first. Only widen to more files after the representative case is understood or fixed.

### 4. Read the Report Before Editing

- Open `report.md` from the chosen output directory.
- Extract the key facts for the chosen entry:
  - failure type: page count mismatch, screenshot mismatch, or error
  - `selected pages`
  - `test` URL
  - `reference render` URL
  - in `reftest-diff`, whether baseline and actual disagree in a way that points to a regression, improvement, or long-standing failure
- If needed, inspect `report.html`, `report.json`, and the generated screenshots under `actual/`, `baseline/`, `test/`, `reference/`, and `diff/`.

### 5. Inspect the Rendered Difference

- Open the `test` URL from the report in the VS Code integrated browser.
- Open the `reference render` URL separately and compare them page by page.
- For multi-page cases:
  - use `ArrowDown` and `ArrowUp` to move between pages
  - use `Home` and `End` to jump to the first and last page
  - capture screenshots when the visual difference matters
- Determine which side appears wrong:
  - `test` side wrong: the feature under test is broken in the normal rendering path
  - `reference render` wrong: the same engine mishandles the reference document
  - both unclear: move to source and spec inspection before editing

### 6. Confirm the Intended Behavior

- Read the WPT test HTML and reference HTML.
- Look for explanatory comments, linked spec sections, and assertions encoded in the markup or CSS.
- If the expected output is still unclear, inspect the WPT document without the Vivliostyle viewer and check the relevant CSS paged media or `@page` specification text.
- When the issue groups many files, decide whether the current failing case is representative of the shared bug or should be split into a separate follow-up.

### 7. Diagnose the Root Cause

- Search the nearest controlling implementation in `packages/core/src/vivliostyle/`.
- Form one falsifiable local hypothesis for why the chosen case fails.
- Identify one cheap validation that can disconfirm that hypothesis.
- Prefer nearby owning code, adjacent tests, or related repo memory entries over broad exploration.
- Use the existing `resolve-issue` skill as a model for the edit and verification loop, but keep the WPT report and reference-side analysis central.

### 8. Implement the Smallest Plausible Fix

- Edit only the code that directly controls the failing behavior.
- Keep the first change small enough that the original reftest command can validate it immediately.
- If the bug changes a shared layout rule, avoid broad cleanup in the same edit.

### 9. Validate Immediately

- Rerun the same narrow `yarn test:reftest` or `yarn test:reftest-diff` command right after the first substantive edit.
- If it still fails but the output changed in a way that supports the current hypothesis, repair the same slice and rerun the same command.
- If it fails in a way that falsifies the hypothesis, step one hop to the code that more directly controls the behavior and repeat.
- Once the representative case passes, rerun any sibling WPT files that likely share the same root cause.

### 10. Finish the Session Cleanly

- If the grouped issue was caused by one bug, verify the related cases in that cluster.
- If remaining failures look unrelated, stop after the current root cause is fixed and note that the remaining cases need separate sessions.
- Run at least one additional focused compatibility or regression check when appropriate.
- Record the root cause and fix summary in repo memory if the finding is reusable.

## Completion Criteria

- The representative WPT case passes in the relevant mode.
- The report confirms the original page count mismatch, screenshot mismatch, or error is gone.
- The correct rendering has been checked when the reference side was suspicious.
- For grouped issues, either the shared cluster is revalidated or the remaining failures are explicitly separated by cause.
- The fix is validated with executable checks, not only by reading a diff.

## Useful Commands

```bash
yarn dev
yarn test:reftest --actual-viewer dev --out-dir artifacts/tmp-issue1915 --file css/CSS2/pagination/table-page-break-inside-avoid-5-print.html
yarn test:reftest-diff --actual-viewer dev --baseline-viewer v2.40.0 --out-dir artifacts/tmp-wpt-fix --file css/css-page/page-name-003-print.html
```

## Notes

- `docs/layout-regression-test.md` is the authoritative reference for reftest and reftest-diff options.
- Prefer one representative WPT file before running a large grouped issue.
- Do not assume the browser-side rendering without Vivliostyle answers paged-media questions by itself; use it as supporting evidence together with the WPT source and spec text.
