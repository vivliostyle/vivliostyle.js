# Vivliostyle.js Layout Regression Test

This script compares rendering results between two Vivliostyle viewer URLs.

- actual (default): https://vivliostyle.vercel.app/ (canary)
- baseline (default): https://vivliostyle.org/viewer/ (stable)

It checks:

- total page count match
- visual match for each page (pixel diff)
- per-entry timeout/error and continues to the next test

The test source list is `packages/core/test/files/file-list.js`.
Persistent triage decisions are stored in `scripts/layout-regression-triage.yaml`.

## Setup

Install dependencies and Playwright browsers once:

```bash
yarn install
npx playwright install chromium --with-deps
# To also use Firefox or WebKit:
npx playwright install firefox webkit --with-deps
```

## Basic run

Run all entries (default: canary vs stable):

```bash
yarn test:layout-regression
```

Run only one entry for a smoke check:

```bash
yarn test:layout-regression --limit 1
```

Check only page counts (no screenshots):

```bash
yarn test:layout-regression --skip-screenshots
```

## Useful filters

Filter by category (repeatable, case-insensitive):

```bash
yarn test:layout-regression --category "Footnotes" --category "Page floats"
```

Filter by title substring (repeatable, case-insensitive):

```bash
yarn test:layout-regression --title-includes "Issue #1767" --title-includes "footnote"
```

Filter by test file path relative to `packages/core/test/files/`
(repeatable, case-insensitive):

```bash
yarn test:layout-regression \
  --file footnotes/footnote-marker-outside-style.html \
  --file table/table_colspan.html
```

When multiple values are passed for the same option, they are OR conditions.
When different filter options are combined, they are AND conditions.

## Custom test URLs

Any web URL can be used as a test target with `--test-url` (repeatable).
CORS restrictions are disabled in Chromium (the default browser), so arbitrary
web content can be tested. Note that `--browser firefox` and `--browser webkit`
do not support disabling CORS, so cross-origin content may fail to load with
those browsers.

```bash
yarn test:layout-regression \
  --test-url "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html" \
  --test-url "https://example.com/another-test.html"
```

## Reftest mode

The same script can also compare a WPT test document against its reference using
the same Vivliostyle viewer. This is intended for manifest-driven CSS reftest
smoke checks, and it can also compare any arbitrary pair of URLs.

Current scope:

- `items.reftest` and `items.print-reftest` from `MANIFEST.json`
- `==` and `!=` references
- multiple references per test
- same viewer for test and reference
- `page_ranges` metadata from the WPT manifest
- WPT `fuzzy` metadata

Manifest-driven WPT runs also add `&pixelRatio=0` to the viewer hash params by
default so Vivliostyle renders at the browser's native device pixel ratio rather
than the viewer's high-resolution fallback. This only applies to WPT manifest
tests; manual `--test-url` / `--ref-url` pairs keep the normal viewer defaults.

Defaults in this mode:

- output directory: `artifacts/wpt-reftest`
- WPT base URL: `https://wpt.live/`
- WPT manifest path: `artifacts/wpt-reftest/MANIFEST.json`

Download the latest published WPT manifest:

```bash
yarn download:wpt-manifest
```

Basic example using `wpt.live` as the test origin:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --wpt-manifest ../wpt/MANIFEST.json \
  --file css/css-break/abspos-in-opacity-000.html
```

You can narrow the WPT set by path prefix:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --wpt-manifest ../wpt/MANIFEST.json \
  --wpt-path-prefix css/css-break/ \
  --limit 20
```

You can also compare arbitrary test/reference URLs without a manifest:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --test-url https://wpt.live/css/css-break/abspos-in-opacity-000.html \
  --ref-url https://wpt.live/css/css-break/abspos-in-opacity-000-ref.html
```

In `reftest` mode the script renders both the test and the reference with
the same viewer and reports them as `test` vs `reference`.

Like `version-diff`, this mode also writes `report.html`. The HTML report links
the test name to the source document, links each viewer badge to the viewer URL,
and shows per-page diff image links in the Change column when screenshot diffs
exist.

## Reftest-diff mode

`reftest-diff` runs the test with both viewers and judges each side against the
same reference set. This is the 3-way mode for deciding whether a viewer-to-viewer
change is a regression, an improvement, or an expected change.

- `baseline` viewer: test rendered with `--baseline-viewer`
- `actual` viewer: test rendered with `--actual-viewer`
- each side is compared against its own reference rendering
- WPT manifest tests and manual `--test-url` / `--ref-url` pairs are both supported
- WPT `items.manual` tests are also included in this mode
- WPT manual tests are reported as `MANUAL` / `MANUAL`, and only viewer-to-viewer
  change presence is reported as `changed` or `unchanged`

Basic example:

```bash
yarn test:reftest-diff \
  --actual-viewer canary \
  --baseline-viewer stable \
  --file css/css-break/abspos-in-opacity-000.html
```

Default output directory in this mode:

- `artifacts/reftest-diff`

The script now also writes `report.html` alongside `report.json` and `report.md`.
The HTML report shows a color-coded table of PASS / FAIL per viewer and the overall
change classification. Test names link to the original document, viewer badges link
to the corresponding viewer page, summary cards can filter rows in place, and page-
level diff image links appear in the Change column when screenshot diffs exist.

Example limited to WPT manual tests:

```bash
yarn test:reftest-diff \
  --actual-viewer canary \
  --baseline-viewer stable \
  --wpt-path-prefix css/CSS2/backgrounds/ \
  --file css/CSS2/backgrounds/background-012.xht
```

## Viewer spec

`--actual-viewer` and `--baseline-viewer` accept:

| Format | Example | Description |
|--------|---------|-------------|
| keyword | `canary` | https://vivliostyle.vercel.app/ |
| keyword | `stable` | https://vivliostyle.org/viewer/ |
| keyword | `dev` | http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html |
| keyword | `prod` | http://localhost:3000/viewer/lib/ |
| `git-<branch>` | `git-fix-issue1775` | Vercel PR preview (branch: `fix-issue1775`) |
| `git:<branch>` | `git:fix/issue-1775` | Same format; `/` is sanitized to `-` (branch: `fix-issue-1775`) |
| version | `v2.35.0` | https://vivliostyle.github.io/viewer/v2.35.0/ |
| legacy version | `2019.11.100` | https://vivliostyle.github.io/viewer/2019.11.100/vivliostyle-viewer.html |
| URL | `https://...` | Any viewer URL (legacy `vivliostyle-viewer.html` URLs are auto-detected) |

Examples:

```bash
# Compare a PR branch against stable
yarn test:layout-regression \
  --actual-viewer git-fix-issue1775

# Compare two specific versions
yarn test:layout-regression \
  --actual-viewer v2.36.0 \
  --baseline-viewer v2.35.0

# Compare legacy viewer with current stable
yarn test:layout-regression \
  --actual-viewer "https://vivliostyle.github.io/viewer/2019.11.100/vivliostyle-viewer.html" \
  --baseline-viewer stable
```

## Extra viewer params

Add extra hash params to both sides, e.g. to apply a custom style:

```bash
yarn test:layout-regression \
  --extra-viewer-params "&style=https://example.com/some-style.css"
```

Add side-specific params:

```bash
yarn test:layout-regression \
  --actual-viewer-params "&style=https://example.com/preview.css" \
  --baseline-viewer-params "&style=https://example.com/baseline.css"
```

## Test file source URL

For entries from `file-list.js` (excluding `--test-url`), the test HTML source URL
is chosen from `--actual-viewer`, and the same source URL is used for both
actual and baseline.

- If `--actual-viewer` is local (`localhost`/`127.0.0.1`):
  - `http://localhost:3000/core/test/files/`
- If `--actual-viewer` is a legacy viewer URL (`vivliostyle-viewer.html`):
  - `https://raw.githack.com/vivliostyle/vivliostyle.js/<ref>/packages/core/test/files/`
- Otherwise:
  - `https://raw.githubusercontent.com/vivliostyle/vivliostyle.js/<ref>/packages/core/test/files/`

`<ref>` is determined in this order:

1. `LAYOUT_REGRESSION_TEST_REF`
2. `GITHUB_HEAD_REF` (PR workflows)
3. `GITHUB_REF_NAME`
4. `master`

## Timeout/Error behavior

If a test entry times out or crashes, the error is recorded and the script
continues with the next entry. Errors appear in `report.md` and `report.json`
under the `errors` section.

## Human triage workflow

After each run a triage template is written to:

- `artifacts/layout-regression/triage.yaml`

Each entry has these key fields:

```yaml
- id: "0001"
  category: Page floats
  title: "'Page' page floats"
  type: difference        # difference / error
  decision: ""            # regression / expected / skip
  notes: ""
  approvedViewer: ""      # viewer spec to use as baseline for this entry
  actualLabel: canary
  actualUrl: https://...
  baselineLabel: stable
  baselineUrl: https://...
  diffPages:
    - 1
```

Recommended workflow:

1. Open `report.md` for a quick summary.
2. Review `diff/*.png` and per-side screenshots in `actual/` and `baseline/`.
3. Fill in `decision` for each entry:
   - `regression` — a real bug introduced by the change
   - `expected` — an intentional improvement or known difference
   - `skip` — noise or irrelevant
4. Optionally set `approvedViewer` to a viewer spec (e.g. `git-fix-issue1775`,
   `v2.35.0`) to use that viewer as the baseline for this specific entry.
   On the next run, the entry will be compared against the approved viewer
   instead of the default baseline. If the result drifts again, `decision`
   is reset and re-evaluation is prompted.
  In `reftest-diff` mode, entries whose `actual` side already passes and are
  classified as `improvement` are omitted from `triage.yaml` because they do
  not need a triage decision.
5. View a summary with:
   ```bash
   yarn test:layout-regression:triage
   yarn test:layout-regression:triage --show-pending  # also list untriaged entries
   ```

### Persisting decisions across runs

Triage decisions in `triage.yaml` are carried over automatically when the script
re-runs: entries with existing `decision`/`notes` retain their values.

To persist decisions permanently (across CI runs and branches):

```bash
yarn test:layout-regression:triage:save
git add scripts/layout-regression-triage.yaml
git commit -m "chore: update layout regression triage"
```

`scripts/layout-regression-triage.yaml` is committed to the repository and serves as
the carry-over source when no local `triage.yaml` exists yet.

### Release gate

`yarn version:bump`, `yarn version:graduate`, and `yarn version:prerelease`
all run `yarn test:layout-regression:triage:check` first, which reads
`scripts/layout-regression-triage.yaml` and fails (exit 2) if any entry is still
`regression` or has no decision. Resolve all entries before releasing.

## CI integration

Regression comparison runs automatically on every pull request (except fork PRs
and Dependabot PRs) via `.github/workflows/layout-regression.yml`.

For PR runs, `--actual-viewer` is automatically set to `git-<branch>` so the
Vercel preview deployment is used as the actual viewer.

Results are posted as a PR comment (updated on every new push). The workflow
can also be triggered manually from the Actions tab with custom viewer specs,
category filter, and limit. If a PR run is cancelled, or if the PR is closed or
merged before the workflow reaches the comment step, the workflow skips posting
or updating the PR comment.

## HTML report

All three modes write `report.html` alongside `report.json` and `report.md`.

- The first table column includes the report entry id (same as `report.json`).
- The table header stays visible while scrolling long result tables.
- All modes list every entry in the HTML table, including unchanged / no-difference rows.
- Test names link to the original test document.
- Viewer badges link to the exact viewer URL used for that side.
- In `version-diff`, viewer badges are shown as `view` because the mode only
  reports that a difference exists, not whether the new rendering is better or worse.
- In `reftest` and `reftest-diff`, PASS / FAIL / ERROR style badges are shown when
  the mode has that semantic information.
- The summary panel is color-coded, and every summary card can be clicked to filter the
  table in place. `Compared` clears the filter, and cards such as change types,
  `ERROR`, `Page count changed`, `Screenshot mismatches`, and `Timeout entries`
  filter to the corresponding subset. When entry-level error counts differ from the
  `ERROR` change-type count, an additional `Entry errors` card is shown.
- When screenshot diffs exist, the Change column also shows page-level diff links
  such as `p1` or `r1-p1`.

## npm scripts

| Script | Description |
|--------|-------------|
| `yarn test:layout-regression` | Run the comparison |
| `yarn test:reftest` | Run WPT/custom reftests with one viewer |
| `yarn test:reftest-diff` | Run WPT/custom reftests with two viewers |
| `yarn download:wpt-manifest` | Download the latest published WPT `MANIFEST.json` |
| `yarn test:layout-regression:triage` | Summarize `artifacts/layout-regression/triage.yaml` |
| `yarn test:layout-regression:triage --show-pending` | Also list untriaged entries |
| `yarn test:layout-regression:triage:save` | Copy triage.yaml → scripts/layout-regression-triage.yaml |
| `yarn test:layout-regression:triage:check` | Check scripts/layout-regression-triage.yaml (used by version scripts) |

## Options

```
--mode <name>                version-diff (default), reftest, or reftest-diff
--browser <name>             Browser to use: chromium (default), firefox, or webkit
--category <name>            Run only this category (repeatable, case-insensitive)
--title-includes <text>      Run entries whose title includes text (repeatable, case-insensitive)
--file <path>                Run entries by file path relative to packages/core/test/files/
                             (repeatable, case-insensitive)
--limit <number>             Stop after N entries
--out-dir <path>             Output directory
--timeout <seconds>          Timeout per page (default: 30)
--max-diff-ratio <number>    Allowed ratio of diff pixels (default: 0.00002)
--pixel-threshold <0..1>     Per-pixel color diff sensitivity (default: 0.1)
--viewport-width <number>    Browser viewport width (default: 1800)
--viewport-height <number>   Browser viewport height (default: 1800)
--skip-screenshots           Skip image capture/compare, check page counts only
--concurrency <number>       Number of entries to capture in parallel (default: os.availableParallelism())
--export-html                Export rendered HTML snapshot for each entry
--export-html-diff           Compare prettified rendered HTML and write diff
--actual-viewer <spec>       Actual viewer spec (default: canary)
--baseline-viewer <spec>     Baseline viewer spec (default: stable)
--actual-label <name>        Label for actual in report
--baseline-label <name>      Label for baseline in report
--extra-viewer-params <s>    Extra hash params for both sides
--actual-viewer-params <s>   Extra hash params only for actual side
--baseline-viewer-params <s> Extra hash params only for baseline side
--test-url <url>             Additional test URL (repeatable)
--ref-url <url>              Reference URL paired with --test-url (repeatable)
--wpt-manifest <path>        WPT MANIFEST.json path
--wpt-base-url <url>         Base URL for WPT tests (default: https://wpt.live/)
--wpt-path-prefix <path>     Restrict WPT paths by prefix (repeatable)
-h, --help                   Show this help
```

## Output

Default output directories depend on mode:

- `version-diff`: `artifacts/layout-regression`
- `reftest`: `artifacts/wpt-reftest`
- `reftest-diff`: `artifacts/reftest-diff`

All modes write these report files:

- `report.json` — full results in JSON (includes triage info per item and triage summary counts)
- `report.md` — human-readable summary
- `report.html` — interactive HTML summary with source/viewer links, row filtering, and page-level diff links
- `triage.yaml` — triage template (pre-filled with carried-over decisions)

Screenshot directories depend on mode:

- `version-diff`: `baseline/*.png`, `actual/*.png`, `diff/*.png`
- `reftest`: `reference/*.png`, `test/*.png`, `diff/*.png`
- `reftest-diff`: `baseline/*.png`, `actual/*.png`, `diff/*.png`,
  `baseline-reference/*.png`, `actual-reference/*.png`,
  `baseline-reference-diff/*.png`, `actual-reference-diff/*.png`

A difference is reported when either:

- page count differs between the two sides
- per-page pixel diff ratio exceeds `--max-diff-ratio` (default `0.00002`)

An error is reported when either side fails to complete rendering.
In `reftest-diff` mode, entries where both sides fail (outcome `error`) appear
only in the Errors section and are excluded from the Differences section.
The `Entries with differences` summary line also shows the improvement count
when improvements are present, e.g. `(improvement: 20, pending: 14, triaged: 0)`.

Execution logs are colorized and include triage status for detected differences/errors, e.g.:

```text
-> outcome=changed (pageCountMismatch=false, pageDiffs=4, triage=triaged/regression)
```

At the end, pending triage count is printed:

```text
N entry/entries need triage (decision is empty)
```

## Exit code

- `0`: no differences and no errors
- `2`: differences or errors found
- `1`: execution error (script crash)
