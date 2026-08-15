---
name: resolve-issue
description: "Resolve a Vivliostyle.js GitHub issue end-to-end. Use when: reproducing a bug, fixing an issue, creating test case from issue, verifying issue behavior, debugging rendering problems. Fetches issue content, creates an HTML test file, reproduces the bug visually with the VS Code integrated browser, and falls back to Chrome DevTools MCP when DevTools-specific diagnostics are needed."
argument-hint: "GitHub issue number or URL (e.g. #1879 or https://github.com/vivliostyle/vivliostyle.js/issues/1879)"
---

# Resolve a Vivliostyle.js Issue

Fetch a GitHub issue, create a minimal test case, visually confirm the bug, fix the code, and verify the fix using the dev server and the VS Code integrated browser. Use Chrome DevTools MCP only when you need DevTools-specific diagnostics.

## Procedure

### 1. Fetch the Issue

- Parse the issue number from the user's input (e.g., `#1879`, `1879`, or a full GitHub URL).
- Use the `github-pull-request_issue_fetch` tool to fetch the issue content (owner: `vivliostyle`, repo: `vivliostyle.js`).
- Extract the following from the issue body:
  - **Test HTML**: Look for HTML code blocks, embedded test cases, or links to reproducible examples.
  - **Expected vs actual behavior**: Understand what the bug is.
  - **CSS properties or features involved**: Identify the area of the engine affected.

### 2. Create the Test File

- Create an HTML test file in `packages/core/test/files/`.
- **File naming**: Use kebab-case derived from the issue topic, e.g., `float-clear.html`, `footnote-in-table.html`. Only add the issue number if the name would otherwise collide with an existing file (e.g., `float-clear-issue1879.html`).
- **File content rules**:
  - Self-contained HTML with inline `<style>` — no external dependencies.
  - Include `@page` rules with explicit size for consistent rendering (e.g., `@page { size: 200mm 150mm; }`).
  - Keep the test case minimal — only enough content to demonstrate the bug.
  - Add a comment at the top referencing the issue: `<!-- Test case for Issue #NNNN: brief description -->`.
- If the issue provides a test URL or external HTML, adapt it into a self-contained local file.
- If the issue only describes the problem without HTML, create a minimal reproduction from the description.

### 3. Register in file-list.js

- Open `packages/core/test/files/file-list.js`.
- Add an entry in the appropriate category (usually "General" or a relevant existing category).
- Format: `{ file: "filename.html", title: "Description (Issue #NNNN)" }`.
- Place the entry near related test files if applicable.

### 4. Start the Dev Server

- Check if `yarn dev` is already running (look for existing terminal output on port 3000).
- If not running, start it: `yarn dev` in async mode from the workspace root.
- Wait for the server to be ready (look for output indicating port 3000 is listening).

### 5. Visually Reproduce the Bug

Use the VS Code integrated browser to confirm the issue:

1. **Navigate to the test file**:
   - URL: `http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=../../core/test/files/<filename>.html`
   - Do NOT add `&debug=true` (causes flickering during rendering).

2. **Wait for rendering to complete**:
   - Use the integrated browser page-reading tools to confirm the rendered content appears.
   - If the page needs an explicit wait, use the browser automation tool to wait for the rendered page container.

3. **Capture the current state**:
   - Take a screenshot to see the rendered output.
   - Use the page snapshot/read tools for a text-based view of the DOM when needed.

4. **For multi-page documents**:
   - Take screenshot of first page.
   - Send `ArrowDown` to navigate to next page, then take a screenshot.
   - Repeat for all relevant pages.
   - Use `Home` / `End` to jump to first/last page.

5. **Confirm the bug**:
   - Compare the rendered output against the expected behavior described in the issue.
   - Report what is observed vs what is expected.
   - If the bug is NOT reproduced, check whether the issue requires specific conditions (viewport size, multi-column, specific CSS features) and adjust the test case.
   - If the issue needs browser-level diagnostics such as console logs, network requests, performance traces, or device emulation, switch to Chrome DevTools MCP for that part of the investigation.

### 6. Report Reproduction Results

Summarize:

- Whether the bug was reproduced.
- What the test file shows (screenshot evidence).
- The test file location and viewer URL for manual inspection.

---

## Phase 2: Fix the Issue

### 7. Analyze the Root Cause

- Based on the reproduced behavior and the CSS features involved, identify the relevant source files in `packages/core/src/vivliostyle/`.
- Key entry points by area (use `semantic_search` / `grep_search` to explore):
  - **CSS parsing**: `css-parser.ts`, `css-cascade.ts`, `css-styler.ts`
  - **Layout/pagination**: `layout.ts`, `layout-processor.ts`, `page-floats.ts`
  - **Floats/exclusions**: `layout.ts` (float functions), `page-floats.ts`
  - **Footnotes**: `layout.ts` (footnote functions)
  - **Columns**: `columns.ts`, `layout-processor.ts`
  - **Page margins/running elements**: `page-master.ts`, `vgen.ts`
  - **Counters/target-counter**: `counters.ts`
- Check repo memory (`/memories/repo/`) for notes from similar past fixes.

### 8. Implement the Fix

- Edit the relevant source files in `packages/core/src/vivliostyle/`.
- `yarn dev` auto-rebuilds on save — no manual rebuild needed.
- Keep changes minimal and focused on the specific bug.

### 9. Verify the Fix Visually

1. Reload the test page in the browser (or wait for auto-reload).
2. Take new screenshots with the integrated browser.
3. Compare with the pre-fix screenshots from Step 5.
4. Confirm the expected behavior now matches.
5. If multi-page, check all pages again.
6. If behavior is still unclear, use Chrome DevTools MCP for deeper diagnostics rather than as the default verification path.

### 10. Check for Regressions

- Look at related test files in `packages/core/test/files/` to ensure similar features still work.
- If the fix touches layout/pagination logic, navigate through a few other test cases via the Test Cases page (`http://localhost:3300/core/test/files/`).

### 11. Run Tests

```bash
yarn test:core
```

- If tests fail, diagnose whether the failure is pre-existing or caused by the fix.
- If the fix intentionally changes behavior, update affected tests.

### 12. Run Layout Regression Test

Run the layout regression test against the local dev server to check for visual regressions across all test entries:

```bash
yarn test:layout-regression --actual-viewer dev --baseline-viewer canary
```

- This compares the local dev build against the canary (latest deployed) version.
- After the run completes, read `artifacts/layout-regression/report.md` for a summary.
- If differences are found:
  - Check whether they are caused by the fix (expected improvement) or unintended regressions.
  - Review diff images in `artifacts/layout-regression/diff/` if needed.
  - Use `--title-includes` or `--file` filters to re-run specific entries for closer inspection.
- See `docs/layout-regression-test.md` for full options and triage workflow.

### 13. Record Findings in Repo Memory

- Save key findings (root cause, fix approach, pitfalls) to `/memories/repo/` for future reference.
- Use a descriptive filename like `issue1879-float-clear-fix.md`.

## Notes

- The dev server (`yarn dev`) auto-rebuilds on source changes and auto-reloads the viewer. Once it's running, any code fix will be reflected by reloading the page.
- Test files in `packages/core/test/files/` appear in the test case list at `http://localhost:3300/core/test/files/`.
- If the issue references an EPUB or external URL, you can also test directly via `http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=<URL>` without creating a local file.
- Prefer the integrated browser for normal reproduction and verification loops. Use Chrome DevTools MCP when you need capabilities closer to DevTools itself, such as console, network, performance, Lighthouse, memory, or advanced emulation.
