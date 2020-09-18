# Contribution Guide

> To get started, <a href="https://cla-assistant.io/vivliostyle/vivliostyle.js">sign the Contributor License Agreement</a>.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Build Guideline](#build-guideline)
  - [Setup](#setup)
  - [Build](#build)
  - [Watch](#watch)
  - [Lint & Format](#lint--format)
  - [Release Flow](#release-flow)
    - [1. Pre-release](#1-pre-release)
    - [2. Stable release](#2-stable-release)
    - [3. Publish](#3-publish)
- [Consistent Naming Guideline](#consistent-naming-guideline)
- [Commit Message Guideline](#commit-message-guideline)
- [Troubleshooting](#troubleshooting)
  - [Cannot find `node_modules/@vivliostyle/core`](#cannot-find-node_modulesvivliostylecore)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Build Guideline

### Setup

```
git clone https://github.com/vivliostyle/vivliostyle.js.git
cd vivliostyle.js
yarn install
yarn bootstrap
```

### Build

```
yarn build
```

### Watch

```
yarn dev
```

### Lint & Format

```
yarn lint
yarn format
```

### Release Flow

Before proceeding with the release process, run the following code to ensure that a production build has been created.

```
yarn lint
yarn test
yarn clean
yarn build
```

#### 1. Pre-release

Run `yarn version:prerelease` to create pre-release. And run `yarn version:prerelease` to increment pre-release count.

#### 2. Stable release

If current version is pre-release (e.g. v2.0.0-pre.4), run:

```
yarn version:graduate
```

To bump up version from stable version to stable version (e.g. v2.0.0 -> v2.0.1):

```
yarn version:bump
```

#### 3. Publish

After running `yarn version:*` command above, just `git push` and CI will do the rest of publishing process.

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
