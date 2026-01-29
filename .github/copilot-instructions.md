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

- **Core+Viewer dev**: `yarn dev` at root → auto-opens http://localhost:3000/core/test/files/ (Test cases)
- **Test files**: Add HTML to `packages/core/test/files/` + entry in `file-list.js` (appears in Test cases)

### Visual Testing with Chrome DevTools MCP

Use Chrome DevTools MCP to automatically verify rendering results:

**Single Page Test**:

1. Start dev server: `yarn dev` (background)
2. Open test in browser: Navigate to viewer URL with test file
3. Wait for rendering: Use `wait_for` to ensure page is loaded
4. Capture results: Take screenshot to verify rendering
5. Check structure: Use `take_snapshot` for text-based page structure

**Multi-Page Test**:

1. Navigate to test URL
2. Take screenshot of first page
3. Navigate pages: Use `press_key("ArrowDown")` for next page, `press_key("ArrowUp")` for previous
4. Capture each page to verify pagination
5. Use `press_key("Home")` / `press_key("End")` to jump to first/last page

**Bug Fix Workflow**:

1. Record current state with screenshots (all pages if multi-page)
2. Modify core source code (`packages/core/src/`)
3. `yarn dev` auto-rebuilds → viewer auto-reloads
4. Reload browser page if needed
5. Take new screenshots and compare with pre-fix state
6. Iterate until bug is resolved

**Test URLs**:

- Test cases: http://localhost:3000/core/test/files/
- Local test:
  - With test file: `http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html#src=../../core/test/files/<test>.html`
  - With any URL: `http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html#src=<URL>`
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
2. Version: `yarn version:prerelease` / `yarn version:graduate` / `yarn version:bump` (auto-pushes to GitHub)
3. CI publishes to npm

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

## Common Pitfalls

- Build before testing: `yarn build` (tests don't transpile TS)
- Core changes → rebuild before viewer/react see them
- Node ≥20 required
- Root tsconfig.json is empty—each package has its own

## Code Search

Use `semantic_search` for concepts, `grep_search` for names, `read_file` for details.
