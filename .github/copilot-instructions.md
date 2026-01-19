# Vivliostyle.js AI Coding Guide

## Architecture Overview

Vivliostyle.js is a **Lerna monorepo** for HTML+CSS typesetting and paged viewing. The three core packages are tightly integrated:

- **`packages/core`**: The typesetting engine ([core-viewer.ts](../packages/core/src/vivliostyle/core-viewer.ts) exports `CoreViewer`). Built with esbuild, outputs CommonJS to `lib/vivliostyle.js`.
- **`packages/viewer`**: Web UI wrapping core. Uses Knockout.js for bindings, Rollup for bundling, Gulp for asset processing (SCSS, EJS templates).
- **`packages/react`**: React component wrapper around core. Built with microbundle for modern+CJS formats.

**Key data flow**: Viewer UI → CoreViewer API → CSS parser/layout engine → paged output

## Build System (Critical)

This is a **Lerna monorepo with Yarn workspaces**. Commands run at root or per-package:

### Root Commands

```bash
yarn build          # Build all packages via lerna
yarn dev            # Parallel watch (excludes react)
yarn dev:react      # Parallel watch (excludes viewer)
yarn lint           # Lint all packages
yarn test           # Run all tests
```

### Package-Specific

```bash
cd packages/core && yarn dev        # Watch core with esbuild
cd packages/viewer && yarn dev      # Watch viewer (Gulp + Rollup)
cd packages/react && yarn dev       # Storybook dev server
```

**Critical**: Core must build first—viewer and react depend on `@vivliostyle/core` via symlinks.

## Development Workflows

### Testing

Core uses Karma + Jasmine in [packages/core/test/](../packages/core/test/):

```bash
cd packages/core/test
yarn install  # Separate test dependencies
yarn test     # Run locally (Chrome/Firefox)
```

Tests live in `spec/vivliostyle/*-spec.js` (not TypeScript).

### Debugging

- **Viewer dev mode**: `yarn dev` in `packages/viewer` → serves at http://localhost:3000 with browser-sync
- **Core debug build**: `yarn build-dev` (sets `VIVLIOSTYLE_DEBUG=true`, no minification)
- **React Storybook**: `yarn dev` in `packages/react` → http://localhost:9009

### Interactive Development Workflow

When fixing bugs or adding features to core/viewer, running `yarn dev` at the **root** provides the most efficient workflow:

1. **Auto-rebuild on save**: Changes to source files trigger automatic rebuild of development versions
2. **Test URL**: http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html loads the dev viewer
3. **Adding CSS feature tests**:
   - Create test HTML in `packages/core/test/files/`
   - Add entry to `packages/core/test/files/file-list.js`
   - View test at http://localhost:3000/core/test/files/
   - Click "dev" link to test with Vivliostyle Viewer in debug mode

**Example**: Adding a new CSS property feature:

```javascript
// In packages/core/test/files/file-list.js
{
  "title": "CSS my-new-property",
  "file": "css-my-new-property.html"
}
```

### Lerna Gotchas

- **Don't use `yarn add` in packages**—use `lerna add <pkg> --scope=@vivliostyle/<target>` or run `lerna link` after manual `yarn add`
- **Symlink issues**: Run `lerna link` to recreate cross-package symlinks

## Naming Conventions (Enforced)

From [CONTRIBUTING.md](../CONTRIBUTING.md#consistent-naming-guideline):

1. **File names match class names**: `CoreViewer` class → `core-viewer.ts`
2. **kebab-case files, PascalCase imports**: `import { CoreViewer } from "./core-viewer"`
3. **No abbreviations** except initialisms (EPUB, PDF) or lengthy names (conditional-props OK)

## Code Patterns

### Core Architecture

- **Entry point**: [packages/core/src/vivliostyle.ts](../packages/core/src/vivliostyle.ts) re-exports all public APIs
- **Viewer API**: [core-viewer.ts](../packages/core/src/vivliostyle/core-viewer.ts) exposes `CoreViewer` class with `loadDocument()`, `navigateToPage()`, etc.

### CSS Processing Pipeline

The CSS processing system transforms stylesheets into computed styles through multiple stages:

1. **CSS Parsing** ([css-parser.ts](../packages/core/src/vivliostyle/css-parser.ts))
   - `Parser` class tokenizes and parses CSS using `CssTokenizer`
   - `ParserHandler` handles different CSS constructs (selectors, properties, at-rules)
   - Multiple handler types: `DispatchParserHandler`, `SkippingParserHandler`, `SlaveParserHandler`
   - Outputs structured CSS objects (`Css.Expr`, selectors, rules)

2. **CSS Cascade** ([css-cascade.ts](../packages/core/src/vivliostyle/css-cascade.ts))
   - `Cascade` class manages stylesheet rules and selector matching
   - `CascadeInstance` applies cascade to specific elements
   - `CascadeValue` represents computed values with specificity tracking
   - `CascadeAction` pattern for incremental style computation
   - Specificity constants: `SPECIFICITY_USER_AGENT`, `SPECIFICITY_AUTHOR`, `SPECIFICITY_STYLE`, etc.
   - `CascadeParserHandler` extends `ParserHandler` to build cascade structures

3. **CSS Styling** ([css-styler.ts](../packages/core/src/vivliostyle/css-styler.ts))
   - `Styler` class caches computed styles for DOM nodes
   - Incrementally applies cascade to document tree
   - `SlipMap` handles text node position mapping between source and rendered
   - Manages pseudo-elements and dynamic content

### Layout Engine Architecture

Layout transforms styled content into positioned page content:

1. **Layout Orchestration** ([layout.ts](../packages/core/src/vivliostyle/layout.ts))
   - `Column` class (4400+ lines): Main layout container, fills columns with content
   - Implements `Layout.Column` interface with methods like `layout()`, `layoutBreakableBlock()`, `layoutFloatOrFootnote()`
   - `PseudoColumn`: Handles parallel fragmented flows (e.g., table columns, pseudo-elements)
   - `AfterIfContinues`: Manages `::after-if-continues` pseudo-element for fragmentation
   - `LayoutConstraint`: Controls layout decisions (e.g., `AfterIfContinuesLayoutConstraint`)

2. **Layout Processors** ([layout-processor.ts](../packages/core/src/vivliostyle/layout-processor.ts))
   - `LayoutProcessor` interface: Extensible layout algorithm system
   - Different processors for different formatting contexts (block, table, flex, etc.)
   - `LayoutProcessorResolver` with plugin hooks for custom layout types
   - Methods: `layout()`, `createEdgeBreakPosition()`, `finishBreak()`, `clearOverflownViewNodes()`

3. **Adaptive Viewer** ([adaptive-viewer.ts](../packages/core/src/vivliostyle/adaptive-viewer.ts))
   - `AdaptiveViewer` class: Top-level viewer managing document rendering
   - Handles viewport management, page navigation, and user interaction
   - Integrates `Font.Mapper`, manages `Epub.OPFDoc` for publications
   - Controls `PageViewMode`: `SINGLE_PAGE`, `SPREAD`, `AUTO_SPREAD`
   - Task-based async operations using `Task.Result<T>`

**Key data flow**:

```
HTML/EPUB → CSS Parser → Cascade → Styler (caches)
          ↓
Styled nodes → Column.layout() → LayoutProcessor → Positioned pages
                                ↓
                          AdaptiveViewer → Display
```

### Viewer Patterns

- **Knockout.js bindings**: View models in [viewmodels/](../packages/viewer/src/viewmodels/)
- **Build outputs**: Gulp compiles SCSS→CSS, EJS→HTML into `lib/`, Rollup bundles TS→JS
- **Two HTML files**: `index.html` (production) and `vivliostyle-viewer-dev.html` (dev)

### React Patterns

- **Main component**: [src/index.tsx](../packages/react/src/index.tsx) exports `<Renderer>` wrapping CoreViewer
- **Build**: microbundle generates modern ES modules + CJS fallback

## Release Process

Follow [CONTRIBUTING.md](../CONTRIBUTING.md#release-flow) strictly:

1. **Pre-test**: `yarn lint && yarn test && yarn clean && yarn build`
2. **Version bump**:
   - Pre-release: `yarn version:prerelease` (creates `-pre.1`)
   - Increment pre: `yarn version:prerelease` again (→ `-pre.2`)
   - Graduate: `yarn version:graduate` (removes `-pre`)
   - Stable bump: `yarn version:bump`
3. **Publish**: Just `git push`—CI handles `lerna publish`

**Versioning**: Uses [Conventional Commits](https://conventionalcommits.org) for CHANGELOG generation.

## Common Pitfalls

1. **Building before testing**: Always `yarn build` before running tests—tests don't transpile TS
2. **Cross-package changes**: Edit core → must rebuild before viewer/react see changes
3. **Node version**: Requires Node ≥20 (see root [package.json](../package.json))
4. **Viewer gulp tasks**: Use `gulp serve` to test production build, `gulp serve-dev` for dev
5. **TypeScript configs**: Root [tsconfig.json](../tsconfig.json) is empty—each package has its own config

## Key Files to Reference

- **API surface**: [packages/core/src/vivliostyle.ts](../packages/core/src/vivliostyle.ts)
- **Build configs**: [lerna.json](../lerna.json), [packages/\*/package.json](../packages/)
- **CI**: [.github/workflows/ci.yml](../.github/workflows/ci.yml) shows full test matrix
- **Viewer build**: [packages/viewer/gulpfile.js](../packages/viewer/gulpfile.js), [rollup.config.js](../packages/viewer/rollup.config.js)
