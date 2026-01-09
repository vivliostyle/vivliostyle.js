# Vivliostyle.js Contribution Guide

## Module structure

Vivliostyle.js consists of two components:

| [Core](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/core) | [Viewer](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/viewer) |
| --------------------------------- | --------------------------------- |
| Vivliostyle.js Core layout engine | Vivliostyle.js Viewer UI          |

## Setup a development environment

Make sure that the following is installed:

- [Node.js](https://nodejs.org)
- [Yarn](https://classic.yarnpkg.com)
- [Git](https://git-scm.com)

Clone [vivliostyle.js](https://github.com/vivliostyle/vivliostyle.js).

```shell
git clone https://github.com/vivliostyle/vivliostyle.js.git
cd vivliostyle.js
```

Install dependencies and link packages:

```shell
yarn install    # install dependencies and link packages
```

`@vivliostyle/core` is listed as a dependency for `@vivliostyle/viewer` in `package.json`. During development, the local copy of `@vivliostyle/core` is used rather than the package installed from npm.

## Build and serve

```shell
yarn build-dev  # build a development version of both Core and Viewer.
yarn dev        # start watching source files and open browser.
```

With `yarn dev`, a web server starts ([Browsersync](https://browsersync.io/) with live-reload enabled), and Google Chrome should automatically open. If no browser opens, open <http://localhost:3000/core/test/files/>. On saving any source file, the browser automatically reloads.

### Viewer and test files

Viewer HTML file (in development mode) is located at `packages/viewer/lib/vivliostyle-viewer-dev.html`. You can open an (X)HTML file with a URL (relative to the viewer HTML file) specified to `#src=` hash parameter. For example, <http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html#src=../../core/test/files/print_media/index.html> opens a test file for print media located at `packages/core/test/files/print_media/index.html`.

Test HTML files, intended to be used during development, are located at `packages/core/test/files/`. You are encouraged to add test files useful for implementing and verifying features.

The `packages/core/scripts/package-artifacts/samples/` directory holds sample files for testing. See [Vivliostyle Samples](https://vivliostyle.org/samples/) for more samples.

### Testing

The TypeScript source files are compiled and minified by Rollup. To build the minified version of JavaScript files, run `yarn build` (in the repository root directory). The sources are type-checked and the minified file will be generated under `packages/core/lib/` and `packages/viewer/lib` directories.

[Jasmine](http://jasmine.github.io/) is used for unit testing. Spec files are located under `packages/core/test/spec/`. To run unit tests on a local machine, run `yarn test`.

The unit tests is automatically invoked in [Travis CI](https://travis-ci.org/vivliostyle/vivliostyle.js) when pushing to GitHub. When pushed to master, after all tests pass, the code will be automatically deployed as the [Canary release](https://vivliostyle.github.io/#canary-release-equivalent-to-master) so please be careful when pushing to master (merging PR).

### Development mode

In development mode (`yarn dev`), you can debug Vivliostyle.js with TypeScript source code in your browser's DevTools.

### Lint and code formatting

Run `yarn lint` for lint and code formatting (using [ESLint](https://eslint.org/) with [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)).

Run `yarn format` for code formatting with [prettier](https://prettier.io/).

### Release Flow

Before proceeding with the release process, run the following code to ensure that a production build has been created.

```shell
yarn lint
yarn test
yarn clean
yarn build
```

#### 1. Pre-release

Run `yarn version:prerelease` to create pre-release. And run `yarn version:bump` to increment pre-release count.

#### 2. Stable release

If current version is pre-release (e.g. v2.0.0-pre.4), run:

```shell
yarn version:graduate
```

To bump up version from stable version to stable version (e.g. v2.0.0 -> v2.0.1):

```shell
yarn version:bump
```

## Consistent Naming Guideline

1. Match class name and its file name for consistency.
2. Use PascalCase for module import name, kebab-case for a file name, making easier to visually distinguish differences.
3. No abbreviation in a file name and class name for perspicuity, except:
   1. Initialism (EPUB, PDF, etc).
   2. Lengthy name (prefer conditional-props over conditional-properties).

## Commit Message Guideline

All notable changes to this project will be documented in `CHANGELOG.md`.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## Troubleshooting

### Cannot find `node_modules/@vivliostyle/core`

This occurs after `yarn add`. Run `lerna link` to recreate symlinks after the installation, otherwise use `lerna add` instead of `yarn add`.

## Maintaining documents

Please update the following documents as developing.

- [`CHANGELOG.md`](https://github.com/vivliostyle/vivliostyle.js/blob/master/CHANGELOG.md)
  - Automatically generated with [Conventional Commits](https://conventionalcommits.org).
- [Supported CSS Features](./supported-css-features.md)
  - Document about CSS features (values, selectors, at-rules, media queries and properties) supported by Vivliostyle.

## Source files

Source files under `packages/core/src/` are briefly described below.

### `vivliostyle/core-viewer.ts`

- Exposed interface of vivliostyle-core. To use vivliostyle-core, instantiate
  Vivliostyle.CoreViewer, set options, register event listeners by addListener
  method, and call loadDocument or loadPublication method.

### `vivliostyle/constants.ts`

- Defines constants used throughout the library.

### `vivliostyle/task.ts`

- Task scheduling.

### `vivliostyle/exprs.ts`

- Definitions for [expressions](http://www.idpf.org/epub/pgt/#s2) of Adaptive Layout.

### `vivliostyle/css.ts`

- Definitions for various CSS values.

### `vivliostyle/css-parser.ts`

- CSS parser.

### `vivliostyle/css-cascade.ts`

- Classes for selector matching and cascading calculation.

### `vivliostyle/vtree.ts`

- View tree data structures.

### `vivliostyle/css-styler.ts`

- Apply CSS cascade to a document incrementally.

### `vivliostyle/font.ts`

- Web font handling.

### `vivliostyle/page-masters.ts`

- Classes for [page masters of Adaptive Layout](http://www.idpf.org/epub/pgt/#s3.4).

### `vivliostyle/page-floats.ts`

- Page floats.

### `vivliostyle/vgen.ts`

- Generation of view tree.

### `vivliostyle/layout.ts`

- Content layout inside regions, including column breaking etc.

### `vivliostyle/css-page.ts`

- Support for [CSS Paged Media](https://drafts.csswg.org/css-page/).

### `vivliostyle/ops.ts`

- Select page master, layout regions (columns) one by one etc.

### `vivliostyle/epub.ts`

- Handling EPUB metadata, rendering pages etc.

> (There are more files... See the `pakcages/core/src` directory)

## Other dev documents

- [Vivliostyle API Reference](./api.md)
- [Migration to TypeScript](./typescript-migration.md)
