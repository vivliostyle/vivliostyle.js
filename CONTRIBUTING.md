# Contribution Guide

> To get started, <a href="https://www.clahub.com/agreements/vivliostyle/vivliostyle">sign the Contributor License Agreement</a>.

## Build Guideline

### Setup

```
git clone https://github.com/vivliostyle/vivliostyle.git
cd vivliostyle
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

Run `yarn version:prerelease` to create pre-release. And run `yarn version:bump` to increment pre-release count.

#### 2. Stable release

If current version is pre-release (e.g. v2.0.0-pre.4), run:

```
yarn version:graduate
```

To bump up version from stable version to stable version (e.g. v2.0.0 -> v2.0.1):

```
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
