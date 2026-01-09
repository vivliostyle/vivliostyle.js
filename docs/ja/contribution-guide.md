# Vivliostyle.js コントリビューションガイド

## モジュール構成

Vivliostyle.js は2つのコンポーネントで構成されています:

| [Core](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/core) | [Viewer](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/viewer) |
| --------------------------------- | --------------------------------- |
| Vivliostyle.js Core layout engine | Vivliostyle.js Viewer UI          |

## 開発環境のセットアップ

以下のものがインストールされていることを確認してください:

- [Node.js](https://nodejs.org)
- [Yarn](https://classic.yarnpkg.com)
- [Git](https://git-scm.com)

[vivliostyle.js](https://github.com/vivliostyle/vivliostyle.js)をクローンします。

```shell
git clone https://github.com/vivliostyle/vivliostyle.js.git
cd vivliostyle.js
```

依存関係をインストールし、パッケージをリンクします:

```shell
yarn install    # install dependencies and link packages
```

`@vivliostyle/core` は `@vivliostyle/viewer` 内の `package.json` でdependencyに含まれています。開発時には、`@vivliostyle/core` はnpmからインストールされたパッケージではなくローカルのコピーが用いられます。

## ビルド・開発サーバーの立ち上げ

```shell
yarn build-dev  # build a development version of both Core and Viewer.
yarn dev        # start watching source files and open browser.
```

`yarn dev` を使用すると、（[Browsersync](https://browsersync.io/) によりライブリロードが有効な）Webサーバーが起動し、Google Chromeが自動的に開きます。 ブラウザーが開かない場合は、<http://localhost:3000/core/test/files/>を開きます。 ソースファイルを保存すると、ブラウザは自動的にリロードされます。

### ビューワーとテストファイル

開発モード中のビューワーHTMLファイルは `packages/viewer/lib/vivliostyle-viewer-dev.html` にあります。`#src=` ハッシュパラメータを指定して、ビューワーHTMLファイルから相対の(X)HTMLファイルをURLで指定できます。例えば、<http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html#src=../../core/test/files/print_media/index.html> は `packages/core/test/files/print_media/index.html` にあるprint mediaのテストファイルを開きます。

開発中に使用することを目的としたテストHTMLファイルは、 `packages/core/test/files/` にあります。 機能の実装と検証に役立つテストファイルを追加することをお勧めします。

`packages/core/scripts/package-artifacts/samples/` ディレクトリにテスト用のサンプルファイルがあります。より多くのサンプルが [vivliostyle.orgのサンプルページ](https://vivliostyle.org/samples) にあります。

### テスト

TypeScriptで書かれたソースファイルは、Rollupによってコンパイル・minifyされます。 JavaScriptファイルのminifiedバージョンをビルドするには、（リポジトリのルートディレクトリで）`yarn build` を実行します。 ソースは型チェックされ、minifyされたファイルは `packages/core/lib/` と `packages/viewer/lib` ディレクトリの下に生成されます。

[Jasmine](http://jasmine.github.io/) はユニットテストに使用されます。 スペックファイルは `packages/core/test/spec/` の下にあります。 ローカルマシンでテストを実行するには、`yarn test` を実行します。

ユニットテストはGitHubにプッシュした際に [Travis CI](https://travis-ci.org/vivliostyle/vivliostyle.js) が自動的に実行されます。masterにプッシュされると、すべてのテストに合格した後、コードは自動的に[Canary release](https://vivliostyle.github.io/#canary-release-equivalent-to-master)にデプロイされます。masterへのプッシュ（PRのマージ）には注意してくだい。

### 開発モード

開発モード (`yarn dev`) では、ブラウザの開発者ツールでVivliostyle.jsのTypeScriptソースコードをデバッグできます。

### Lint とコードのフォーマット

### Lint / code formatting

vivliostyleのソースコードは、`yarn lint` を実行（[eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) を用いた [ESLint](https://eslint.org/)）して、コード整形してください。

`yarn format` で [prettier](https://prettier.io/) によるコードのフォーマットを行います。

### リリースのフロー

リリース処理の前に、次のコードを実行して、リリースビルドが作成されることを確認します。

```shell
yarn lint
yarn test
yarn clean
yarn build
```

#### 1. プレリリース

`yarn version:prerelease` を実行してプレリリース版を作成します。そして、 `yarn version:bump` でプレリリース番号を上げます。

#### 2. 安定版(Stable)リリース

現在のバージョンがプレリリース（例 v2.0.0-pre.4）なら、次を実行します:

```shell
yarn version:graduate
```

安定版から次の安定版（例 v2.0.0 -> v2.0.1）にバージョンアップする場合:

```shell
yarn version:bump
```

## 一貫した命名ガイドライン

1. 一貫性を保つために、クラス名とそのファイル名を一致させます。
2. モジュールのインポート名にはPascalCaseを、ファイル名にはkebab-caseを使用して、違いを視覚的に区別しやすくします。
3. 分かりやすさのために、ファイル名とクラス名に省略語を使わないようにします。ただし以下を除きます:
    1. イニシャリズム（EPUB、PDFなど）。
    2. 長い名前（conditional-properties よりも conditional-props が好ましい）。

## コミットメッセージのガイドライン

このプロジェクトへの重要な変更は `CHANGELOG.md` に記録されます。
そのためのコミットメッセージのガイドラインは [Conventional Commits](https://conventionalcommits.org) を参照。

## トラブルシューティング

### Cannot find `node_modules/@vivliostyle/core`

これは `yarn add` の後に発生します。 インストール後にシンボリックリンクを再作成するには、 `lerna link` を実行します。それ以外の場合は、`yarn add` の代わりに `lerna add` を使用します。

## ドキュメントのメンテナンス

以下のドキュメントを開発中に更新してください。

- [`CHANGELOG.md`](https://github.com/vivliostyle/vivliostyle.js/blob/master/CHANGELOG.md)
  - [Conventional Commits](https://conventionalcommits.org) により自動で生成されます.
- [Supported CSS Features](./supported-css-features.md)
  - VivliostyleでサポートされるCSS機能(values, selectors, at-rules, media queries and properties)

## ソースファイル

`packages/core/src/` 以下のソースファイルについて簡単に説明します。

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

## その他の開発ドキュメント

- [Vivliostyle API Reference](./api.md)
- [Migration to TypeScript](./typescript-migration.md)
