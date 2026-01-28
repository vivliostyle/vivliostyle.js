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

### Testing

- `cd packages/core/test && yarn test` (Karma + Jasmine)
- Tests live in `spec/vivliostyle/*-spec.js`

### Interactive Development Workflow

- **Viewer dev**: `yarn dev` at root → http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html
- **Debug build**: `yarn build-dev` (sets `VIVLIOSTYLE_DEBUG=true`)
- **CSS tests**: Add HTML to `packages/core/test/files/` + entry in `file-list.js`

### Lerna

- Use `lerna add <pkg> --scope=@vivliostyle/<target>` or `lerna link` for symlinks

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

1. `yarn lint && yarn test && yarn clean && yarn build`
2. Version: `yarn version:prerelease` / `yarn version:graduate` / `yarn version:bump`
3. `git push` (CI publishes)

## Common Pitfalls

- Build before testing: `yarn build` (tests don't transpile TS)
- Core changes → rebuild before viewer/react see them
- Node ≥20 required
- Root tsconfig.json is empty—each package has its own

## Code Search

Use `semantic_search` for concepts, `grep_search` for names, `read_file` for details.
