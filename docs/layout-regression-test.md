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

Install dependencies and Playwright Chromium once:

```bash
yarn install
npx playwright install chromium --with-deps
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

Filter by category (repeatable):

```bash
yarn test:layout-regression --category "Footnotes" --category "Page floats"
```

Filter by title substring:

```bash
yarn test:layout-regression --title-includes "Issue #1767"
```

## Custom test URLs

Any web URL can be used as a test target with `--test-url` (repeatable).
CORS restrictions are disabled in the browser, so arbitrary web content can be tested:

```bash
yarn test:layout-regression \
  --test-url "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html" \
  --test-url "https://example.com/another-test.html"
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
category filter, and limit.

## npm scripts

| Script | Description |
|--------|-------------|
| `yarn test:layout-regression` | Run the comparison |
| `yarn test:layout-regression:triage` | Summarize `artifacts/layout-regression/triage.yaml` |
| `yarn test:layout-regression:triage --show-pending` | Also list untriaged entries |
| `yarn test:layout-regression:triage:save` | Copy triage.yaml → scripts/layout-regression-triage.yaml |
| `yarn test:layout-regression:triage:check` | Check scripts/layout-regression-triage.yaml (used by version scripts) |

## Options

```
--category <name>            Run only this category (repeatable)
--title-includes <text>      Run entries whose title includes text
--limit <number>             Stop after N entries
--out-dir <path>             Output directory (default: artifacts/layout-regression)
--timeout <seconds>          Timeout per page (default: 30)
--max-diff-ratio <number>    Allowed ratio of diff pixels (default: 0.0008)
--pixel-threshold <0..1>     Per-pixel color diff sensitivity (default: 0.75)
--viewport-width <number>    Browser viewport width (default: 900)
--viewport-height <number>   Browser viewport height (default: 900)
--skip-screenshots           Skip image capture/compare, check page counts only
--actual-viewer <spec>       Actual viewer spec (default: canary)
--baseline-viewer <spec>     Baseline viewer spec (default: stable)
--actual-label <name>        Label for actual in report
--baseline-label <name>      Label for baseline in report
--extra-viewer-params <s>    Extra hash params for both sides
--actual-viewer-params <s>   Extra hash params only for actual side
--baseline-viewer-params <s> Extra hash params only for baseline side
--test-url <url>             Additional test URL (repeatable)
-h, --help                   Show this help
```

## Output

Results are written to `artifacts/layout-regression/` (by default):

- `report.json` — full results in JSON
- `report.md` — human-readable summary
- `baseline/*.png` — baseline screenshots
- `actual/*.png` — actual screenshots
- `diff/*.png` — diff images (only pages with diff above threshold)
- `triage.yaml` — triage template (pre-filled with carried-over decisions)

A difference is reported when either:

- page count differs between the two sides
- per-page pixel diff ratio exceeds `--max-diff-ratio` (default `0.0008`)

An error is reported when either side fails to complete rendering.

## Exit code

- `0`: no differences and no errors
- `2`: differences or errors found
- `1`: execution error (script crash)
