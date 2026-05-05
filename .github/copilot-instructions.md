# Vivliostyle.js AI Coding Guide

## Architecture

**Lerna monorepo** with 3 packages:

- **`packages/core`**: Typesetting engine. Exports `CoreViewer`. Built with esbuild.
- **`packages/viewer`**: Web UI. Uses Knockout.js, Rollup, Gulp.
- **`packages/react`**: React wrapper. Built with microbundle.

## Build Commands

```bash
yarn build          # Build all packages
yarn dev            # Watch (excludes react)
yarn dev:react      # Watch (excludes viewer)
yarn lint           # Lint
yarn test           # Test
```

**Critical**: Core must build first—viewer/react depend on it via symlinks.

## Development Workflows

### Core Unit Testing

- `yarn test:core` or `cd packages/core/test && yarn test` (Karma + Jasmine, headless browser)
- `yarn test:core-local` or `cd packages/core/test && yarn test-local` (Karma + Jasmine, manual browser for debugging)
- Tests live in `packages/core/test/spec/vivliostyle/*-spec.js`

### Interactive Development Workflow

- **Core+Viewer dev**: `yarn dev` at root → auto-opens http://localhost:3300/core/test/files/ (Test cases)
- **Test files**: Add HTML to `packages/core/test/files/` + entry in `file-list.js` (appears in Test cases)

### Visual Testing with VS Code Integrated Browser

Use the VS Code integrated browser for routine rendering checks and bug reproduction. It is usually faster for iterative work because the agent can navigate, inspect the page state, send keys, and capture screenshots with less overhead than Chrome DevTools MCP.

**Single Page Test**:

1. Start dev server: `yarn dev` (background)
2. Open test in browser: Navigate to the viewer URL with the test file
3. Wait for rendering: Use the integrated browser page state tools to confirm the rendered content is present
4. Capture results: Take a screenshot to verify rendering
5. Check structure: Use the page snapshot/read tools when a text-based view of the page is useful

**Multi-Page Test**:

1. Navigate to test URL
2. Take screenshot of first page
3. Navigate pages: Send `ArrowDown` for next page and `ArrowUp` for previous
4. Capture each page to verify pagination
5. Use `Home` / `End` to jump to first/last page

**Bug Fix Workflow**:

1. Record current state with screenshots (all pages if multi-page)
2. Modify core source code (`packages/core/src/`)
3. `yarn dev` auto-rebuilds → viewer auto-reloads
4. Reload browser page if needed
5. Take new screenshots and compare with pre-fix state
6. Iterate until bug is resolved

**When to Use Chrome DevTools MCP Instead**:

- Use Chrome DevTools MCP when you need browser diagnostics that the integrated browser does not expose directly, such as console messages, network inspection, performance traces, Lighthouse audits, heap snapshots, or device and network emulation.
- For straightforward local rendering verification, prefer the integrated browser and only switch to Chrome DevTools MCP when the bug requires deeper browser-level investigation.

**Test URLs**:

- Test cases: http://localhost:3300/core/test/files/
- Local test:
  - With test file: `http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=../../core/test/files/<test>.html`
  - With any URL: `http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=<URL>`
- Note: Omit `&debug=true` for visual testing to avoid flickering during render process

## Naming Conventions

- File names match class names: `CoreViewer` → `core-viewer.ts`
- kebab-case files, PascalCase imports
- No abbreviations except initialisms (EPUB, PDF)

## Key Files (Use semantic_search/grep_search to explore)

- **Public API**: `vivliostyle.ts` re-exports all public APIs
- **CoreViewer**: Main viewer class in `core-viewer.ts`
- **CSS**: `css-parser.ts` → `css-cascade.ts` → `css-styler.ts`
- **Layout**: `layout.ts`, `layout-processor.ts`, `adaptive-viewer.ts`
- **Build**: `lerna.json`, `gulpfile.js`, `rollup.config.js`

## Release Process

1. `yarn lint && yarn test && yarn build`
2. Version: `yarn version:prerelease` / `yarn version:graduate` / `yarn version:bump` (creates local commit + tag, does NOT push)
3. Optionally edit `CHANGELOG.md`
4. `yarn version:push` (amends commit, retags, pushes — CI then publishes to npm and creates GitHub Release)

## Commit Message Guidelines

Follow [Conventional Commits](https://conventionalcommits.org):

- **Format**: `<type>[optional scope]: <description>`
- **Types**:
  - `feat:` New feature
  - `fix:` Bug fix
  - `chore:` Maintenance (deps, config, etc.)
  - `docs:` Documentation only
  - `refactor:` Code restructuring
  - `test:` Test updates
- **Scope**: Package name for react/viewer (`fix(react):`, `feat(viewer):`). Core package changes omit scope.
- **Description**: Imperative mood, lowercase, no period
- **Issue**: Reference with `closes #1234` or `fixes #1234`
- **Examples**:
  - `fix: Fix footnotes in tables being ignored`
  - `feat(viewer): Add dark mode support`
  - `chore(deps): bump lodash from 4.17.21 to 4.17.23`

### Layout Regression Testing

Compare rendering results between two Vivliostyle viewer versions to detect visual regressions. See `docs/layout-regression-test.md` for full documentation.

```bash
yarn test:layout-regression                              # canary vs stable (default)
yarn test:layout-regression --actual-viewer dev           # local dev vs canary
yarn test:layout-regression --title-includes "Issue #1879" # filter by title
yarn test:layout-regression --file float-clear.html       # filter by file
yarn test:layout-regression --limit 1                     # smoke check
```

- Results: `artifacts/layout-regression/report.md`, `diff/*.png`
- Triage: `yarn test:layout-regression:triage --show-pending`

## Common Pitfalls

- Build before testing: `yarn build` (tests don't transpile TS)
- Core changes → rebuild before viewer/react see them
- Node ≥20 required
- Root tsconfig.json is empty—each package has its own

## Code Search

Use `semantic_search` for concepts, `grep_search` for names, `read_file` for details.
