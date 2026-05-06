# Vivliostyle.js レイアウト回帰テスト

このスクリプトは、2つの Vivliostyle ビューワー URL 間のレンダリング結果を比較します。

- actual（デフォルト）: https://vivliostyle.vercel.app/ (canary)
- baseline（デフォルト）: https://vivliostyle.org/viewer/ (stable)

チェック内容:

- ページ数の一致
- 各ページの視覚的な一致（ピクセル差分）
- テストごとのタイムアウト・エラーを記録し、次のテストに継続

テストソースリストは `packages/core/test/files/file-list.js` です。
トリアージ決定の永続データは `scripts/layout-regression-triage.yaml` に保存されます。

## セットアップ

依存パッケージと Playwright ブラウザを一度だけインストール:

```bash
yarn install
npx playwright install chromium --with-deps
# Firefox や WebKit も使う場合:
npx playwright install firefox webkit --with-deps
```

## 基本的な実行

全エントリを実行（デフォルト: canary vs stable）:

```bash
yarn test:layout-regression
```

動作確認用に1エントリだけ実行:

```bash
yarn test:layout-regression --limit 1
```

ページ数のみ確認（スクリーンショットなし）:

```bash
yarn test:layout-regression --skip-screenshots
```

## フィルター

カテゴリーで絞り込み（繰り返し指定可・大文字小文字を区別しない）:

```bash
yarn test:layout-regression --category "Footnotes" --category "Page floats"
```

タイトルの部分文字列で絞り込み（繰り返し指定可・大文字小文字を区別しない）:

```bash
yarn test:layout-regression --title-includes "Issue #1767" --title-includes "footnote"
```

`packages/core/test/files/` からの相対パスでファイル指定して絞り込み
（繰り返し指定可・大文字小文字を区別しない）:

```bash
yarn test:layout-regression \
  --file footnotes/footnote-marker-outside-style.html \
  --file table/table_colspan.html
```

同じオプションを複数指定した場合は OR 条件、
異なる種類のフィルターを併用した場合は AND 条件で評価されます。

## カスタムテスト URL

`--test-url` で任意の Web URL をテスト対象に追加できます（繰り返し指定可）。
デフォルトブラウザの Chromium では CORS 制限が無効化されているため、任意の Web コンテンツをテストできます。
ただし `--browser firefox` や `--browser webkit` では CORS の無効化に対応していないため、クロスオリジンのコンテンツはロードできない場合があります。

```bash
yarn test:layout-regression \
  --test-url "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html" \
  --test-url "https://example.com/another-test.html"
```

## Reftest モード

同じスクリプトで、WPT のテスト文書とその reference を同じ Vivliostyle
ビューワーで比較することもできます。これは CSS reftest の manifest ベースの
スモークチェックを想定した機能で、任意の URL ペアも比較できます。

現在の対応範囲:

- `MANIFEST.json` の `items.reftest` と `items.print-reftest`
- `==` と `!=` の reference
- 1 テストに対する複数 reference
- テスト側と reference 側で同じビューワーを使用
- WPT manifest の `page_ranges` メタデータ
- WPT の `fuzzy` メタデータ

WPT manifest ベースの実行では、ビューワーのハッシュパラメータに
`&pixelRatio=0` が自動付与されます。これにより Vivliostyle 独自の高解像度
fallback ではなく、ブラウザのネイティブな device pixel ratio で比較します。
この設定は WPT manifest テストのみに適用され、手動の `--test-url` /
`--ref-url` ペアでは通常の viewer デフォルトが使われます。

このモードのデフォルト:

- 出力ディレクトリ: `artifacts/wpt-reftest`
- WPT base URL: `https://wpt.live/`
- WPT manifest path: `artifacts/wpt-reftest/MANIFEST.json`

最新の公開 WPT manifest を取得:

```bash
yarn download:wpt-manifest
```

`wpt.live` を使った基本例:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --wpt-manifest ../wpt/MANIFEST.json \
  --file css/css-break/abspos-in-opacity-000.html
```

WPT の対象を path prefix で絞り込み:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --wpt-manifest ../wpt/MANIFEST.json \
  --wpt-path-prefix css/css-break/ \
  --limit 20
```

manifest を使わずに任意の test/reference URL を比較することもできます:

```bash
yarn test:reftest \
  --actual-viewer dev \
  --test-url https://wpt.live/css/css-break/abspos-in-opacity-000.html \
  --ref-url https://wpt.live/css/css-break/abspos-in-opacity-000-ref.html
```

`reftest` モードでは test と reference を同じビューワーでレンダリングし、
`test` vs `reference` としてレポートします。

このモードでも `report.html` が出力されます。テスト名から元の test 文書を開けて、
各 viewer badge からそのまま viewer URL を開けます。スクリーンショット差分がある
場合は Change 列にページごとの diff 画像リンクも表示されます。

## Reftest-diff モード

`reftest-diff` は、test を 2 つのビューワーでレンダリングし、それぞれを同じ
reference セットと比較します。viewer 間の変更が regression なのか、improvement
なのか、あるいは expected-change なのかを判定するための 3-way モードです。

- `baseline` viewer: `--baseline-viewer` でレンダリングした test
- `actual` viewer: `--actual-viewer` でレンダリングした test
- 各 side はそれぞれ自身の reference rendering と比較
- WPT manifest テストと手動の `--test-url` / `--ref-url` ペアの両方に対応
- WPT の `items.manual` もこのモードで対応
- WPT manual test は `MANUAL` / `MANUAL` として扱われ、viewer 間の差分有無のみを
  `changed` / `unchanged` で報告

基本例:

```bash
yarn test:reftest-diff \
  --actual-viewer canary \
  --baseline-viewer stable \
  --file css/css-break/abspos-in-opacity-000.html
```

このモードのデフォルト出力ディレクトリ:

- `artifacts/reftest-diff`

このモードでも `report.html` が `report.json` と `report.md` と一緒に出力されます。
HTML レポートでは viewer ごとの PASS / FAIL と change classification を色付きで
表示します。テスト名は元文書へのリンク、viewer badge は各 viewer URL へのリンク、
サマリーカードは行フィルターとして機能し、スクリーンショット差分がある場合は
ページごとの diff 画像リンクも Change 列に表示されます。

WPT manual test のみを対象にした例:

```bash
yarn test:reftest-diff \
  --actual-viewer canary \
  --baseline-viewer stable \
  --wpt-path-prefix css/CSS2/backgrounds/ \
  --file css/CSS2/backgrounds/background-012.xht
```

## ビューワー指定形式

`--actual-viewer` と `--baseline-viewer` には次の形式が使えます:

| 形式 | 例 | 説明 |
|------|-----|------|
| キーワード | `canary` | https://vivliostyle.vercel.app/ |
| キーワード | `stable` | https://vivliostyle.org/viewer/ |
| キーワード | `dev` | http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html |
| キーワード | `prod` | http://localhost:3300/viewer/lib/ |
| `git-<branch>` | `git-fix-issue1775` | Vercel PR プレビュー（ブランチ: `fix-issue1775`） |
| `git:<branch>` | `git:fix/issue-1775` | 同形式; `/` は `-` にサニタイズ（ブランチ: `fix-issue-1775`） |
| バージョン | `v2.35.0` | https://vivliostyle.github.io/viewer/v2.35.0/ |
| レガシーバージョン | `2019.11.100` | https://vivliostyle.github.io/viewer/2019.11.100/vivliostyle-viewer.html |
| URL | `https://...` | 任意のビューワー URL（レガシーの `vivliostyle-viewer.html` URL も自動判別） |

使用例:

```bash
# PR ブランチを stable と比較
yarn test:layout-regression \
  --actual-viewer git-fix-issue1775

# 特定の2バージョンを比較
yarn test:layout-regression \
  --actual-viewer v2.36.0 \
  --baseline-viewer v2.35.0

# レガシービューワーと現在の stable を比較
yarn test:layout-regression \
  --actual-viewer "https://vivliostyle.github.io/viewer/2019.11.100/vivliostyle-viewer.html" \
  --baseline-viewer stable
```

## 追加ビューワーパラメータ

両サイドに共通のハッシュパラメータを追加（例: カスタムスタイル）:

```bash
yarn test:layout-regression \
  --extra-viewer-params "&style=https://example.com/some-style.css"
```

サイドごとに別々のパラメータを指定:

```bash
yarn test:layout-regression \
  --actual-viewer-params "&style=https://example.com/preview.css" \
  --baseline-viewer-params "&style=https://example.com/baseline.css"
```

## テストファイルの参照URL

`file-list.js` 由来のエントリ（`--test-url` を除く）では、テストHTMLの参照URLは
`--actual-viewer` をもとに決定され、actual/baseline の両方で同じ参照URLを使います。

- `--actual-viewer` がローカル（`localhost`/`127.0.0.1`）の場合:
  - `http://localhost:3300/core/test/files/`
- `--actual-viewer` がレガシーURL（`vivliostyle-viewer.html`）の場合:
  - `https://raw.githack.com/vivliostyle/vivliostyle.js/<ref>/packages/core/test/files/`
- それ以外の場合:
  - `https://raw.githubusercontent.com/vivliostyle/vivliostyle.js/<ref>/packages/core/test/files/`

`<ref>` は次の優先順で決定されます:

1. `LAYOUT_REGRESSION_TEST_REF`
2. `GITHUB_HEAD_REF`（PR ワークフロー）
3. `GITHUB_REF_NAME`
4. `master`

## タイムアウト・エラーの扱い

テストエントリがタイムアウトまたはクラッシュした場合、エラーを記録して次のエントリに継続します。
エラーは `report.md` および `report.json` の `errors` セクションに表示されます。

## 人手によるトリアージ作業

実行後、トリアージテンプレートが生成されます:

- `artifacts/layout-regression/triage.yaml`

各エントリの主なフィールド:

```yaml
- id: "0001"
  category: Page floats
  title: "'Page' page floats"
  type: difference        # difference / error
  decision: ""            # regression / expected / skip
  notes: ""
  approvedViewer: ""      # このエントリ専用のベースラインビューワー指定
  actualLabel: canary
  actualUrl: https://...
  baselineLabel: stable
  baselineUrl: https://...
  diffPages:
    - 1
```

推奨ワークフロー:

1. `report.md` でサマリーを確認。
2. `diff/*.png` および `actual/`・`baseline/` のスクリーンショットを確認。
3. 各エントリの `decision` を記入:
   - `regression` — 変更によって生じた本物のバグ
   - `expected` — 意図的な改善または既知の差分
   - `skip` — ノイズまたは無関係
4. 必要に応じて `approvedViewer` にビューワー指定（例: `git-fix-issue1775`、`v2.35.0`）を設定すると、このエントリの次回実行時にそのビューワーをベースラインとして比較します。比較結果が再び差分になった場合は `decision` がリセットされ、再評価が促されます。
  `reftest-diff` モードでは、`actual` 側がすでに PASS していて
  `improvement` と判定されたエントリは、トリアージ不要のため
  `triage.yaml` には出力されません。
5. サマリーを確認:
   ```bash
   yarn test:layout-regression:triage
   yarn test:layout-regression:triage --show-pending  # 未トリアージのエントリも表示
   ```

### 決定の永続化

`triage.yaml` のトリアージ決定は再実行時に自動で引き継がれます（既存の `decision`/`notes` は保持）。

決定をリポジトリに永続化するには（CI実行やブランチをまたいで有効）:

```bash
yarn test:layout-regression:triage:save
git add scripts/layout-regression-triage.yaml
git commit -m "chore: update layout regression triage"
```

`scripts/layout-regression-triage.yaml` はリポジトリにコミットされており、ローカルに `triage.yaml` がない場合の引き継ぎ元として使われます。

### リリースゲート

`yarn version:bump`、`yarn version:graduate`、`yarn version:prerelease` はいずれも実行前に `yarn test:layout-regression:triage:check` を呼び出します。これは `scripts/layout-regression-triage.yaml` を読み込み、`regression` または未決定のエントリが残っていると失敗（exit 2）します。リリース前にすべてのエントリを解決してください。

## CI 連携

`.github/workflows/layout-regression.yml` により、すべてのプルリクエストで自動的に回帰比較が実行されます（フォーク PR と Dependabot PR はスキップ）。

PR 実行時は `--actual-viewer` が自動的に `git-<branch>` に設定され、Vercel プレビューデプロイメントが actual ビューワーとして使用されます。

結果は PR コメントとして投稿され（新しいプッシュごとに更新）、Actions タブから手動でカスタムビューワー指定、カテゴリーフィルター、制限数を指定して実行することもできます。PR 実行がキャンセルされた場合や、コメント投稿ステップに到達する前に PR が close / merge された場合は、PR コメントの投稿・更新はスキップされます。

## HTML レポート

3 つのモードすべてで `report.html` が `report.json` と `report.md` と一緒に出力されます。

- ヘッダーに `report.json`、`report.md`、`triage.yaml` へのリンクがあり、
  他の形式のレポートにすぐアクセスできます。
- `#` 列にエントリ ID（`report.json` と同じもの）が表示されます。
- Test 列にはカテゴリー、タイトル（元の test 文書へのリンク付き）、ファイルパス
  （タイトルと異なる場合）、リファレンスファイルのリンクが表示されます。
- 結果件数が多い場合でも、スクロール中にテーブルヘッダーが表示されたままになります。
- 全モードで、差分ありの行だけでなく unchanged / 差分なしの行も HTML テーブルに表示されます。
- viewer badge からその side の実際の viewer URL を開けます。
- `version-diff` は「差分がある」ことだけを示すモードなので、actual/baseline の badge は
  side のラベル名（例: `canary`、`stable`）で表示されます。
- `reftest` と `reftest-diff` では、意味のある場合に PASS / FAIL / ERROR badge を表示します。
- `reftest-diff` モードでは、Baseline/Actual 列の PASS/FAIL badge の横に
  リファレンスビューワーリンク（例: `v2.40.0 ref`、`canary ref`）が表示されます。
- リンクは名前付き `target` 属性（`lr-source`、`lr-baseline`、`lr-actual`、
  `lr-diff`）を使用するため、異なるエントリをクリックしても毎回新しいタブが
  開くのではなく、同じタブが再利用されます。
- サマリーカードは色分けされており、すべてのカードをクリックしてその条件で表を絞り込めます。
  `Compared` はフィルター解除として動作し、change type の各カードに加えて、
  `ERROR`、`Page count changed`、`Screenshot mismatches`、`Timeout entries`
  でも対応する行だけを表示できます。エントリ単位のエラー件数が `ERROR`
  change type の件数と異なる場合は、追加で `Entry errors` カードも表示されます。
- スクリーンショット差分がある場合は、Change 列に `p1` や `r1-p1` のようなページ単位の
  diff 画像リンクが表示されます。

## npm スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `yarn test:layout-regression` | 比較を実行 |
| `yarn test:reftest` | 1 つのビューワーで WPT / カスタム reftest を実行 |
| `yarn test:reftest-diff` | 2 つのビューワーで WPT / カスタム reftest を実行 |
| `yarn download:wpt-manifest` | 最新の公開 WPT `MANIFEST.json` を取得 |
| `yarn test:layout-regression:triage` | `artifacts/layout-regression/triage.yaml` のサマリーを表示 |
| `yarn test:layout-regression:triage --show-pending` | 未トリアージのエントリも表示 |
| `yarn test:layout-regression:triage:save` | triage.yaml を scripts/layout-regression-triage.yaml にコピー |
| `yarn test:layout-regression:triage:check` | scripts/layout-regression-triage.yaml をチェック（バージョンスクリプトで使用） |

## オプション

```
--mode <name>                version-diff（デフォルト）, reftest, reftest-diff
--browser <name>             使用するブラウザ: chromium（デフォルト）, firefox, webkit
--category <name>            カテゴリーで絞り込み（繰り返し指定可・大文字小文字を区別しない）
--title-includes <text>      タイトルの部分文字列で絞り込み（繰り返し指定可・大文字小文字を区別しない）
--file <path>                packages/core/test/files/ からの相対パスで絞り込み
                             （繰り返し指定可・大文字小文字を区別しない）
--limit <number>             N エントリで停止
--out-dir <path>             出力ディレクトリ
--timeout <seconds>          ページあたりのタイムアウト秒数（デフォルト: 30）
--max-diff-ratio <number>    許容する差分ピクセル比率（デフォルト: 0.00002）
--pixel-threshold <0..1>     ピクセルごとの色差感度（デフォルト: 0.1）
--viewport-width <number>    ブラウザのビューポート幅（デフォルト: 1800）
--viewport-height <number>   ブラウザのビューポート高さ（デフォルト: 1800）
--skip-screenshots           スクリーンショットをスキップしてページ数のみ確認
--concurrency <number>       並列キャプチャ数（デフォルト: os.availableParallelism()）
--export-html                各エントリのレンダリング済み HTML スナップショットを出力
--export-html-diff           整形済み HTML を比較して差分を出力
--actual-viewer <spec>       actual ビューワー指定（デフォルト: canary）
--baseline-viewer <spec>     baseline ビューワー指定（デフォルト: stable）
--actual-label <name>        レポートでの actual のラベル
--baseline-label <name>      レポートでの baseline のラベル
--extra-viewer-params <s>    両サイド共通の追加ハッシュパラメータ
--actual-viewer-params <s>   actual サイドのみの追加ハッシュパラメータ
--baseline-viewer-params <s> baseline サイドのみの追加ハッシュパラメータ
--test-url <url>             追加テスト URL（繰り返し指定可）
--ref-url <url>              --test-url に対応する reference URL（繰り返し指定可）
--wpt-manifest <path>        WPT MANIFEST.json のパス
--wpt-base-url <url>         WPT テストの base URL（デフォルト: https://wpt.live/）
--wpt-path-prefix <path>     WPT path prefix で絞り込み（繰り返し指定可）
-h, --help                   ヘルプを表示
```

## 出力

デフォルトの出力ディレクトリはモードごとに異なります:

- `version-diff`: `artifacts/layout-regression`
- `reftest`: `artifacts/wpt-reftest`
- `reftest-diff`: `artifacts/reftest-diff`

全モード共通で次のレポートファイルを出力します:

- `report.json` — JSON 形式のフル結果（各項目の triage 情報と triage 集計を含む）。
  ファイルパス（`diffImage`）はレポートディレクトリからのスラッシュ区切り相対パスで保存され、
  `options.outDir` / `options.wptManifestPath` はワーキングディレクトリからの相対パスに
  なるため、マシン間でレポートを持ち運べます。
  `entries` 配列がある場合（entries なしのレガシー version-diff を除く全モード）、
  差分やエラーの詳細は各エントリにマージされ、トップレベルの
  `differences` / `errors` 配列は JSON から省略されます。
- `report.md` — 人が読みやすいサマリー
- `report.html` — source / viewer link、行フィルター、ページ単位 diff link を持つ HTML サマリー
- `triage.yaml` — トリアージテンプレート（前回の決定を引き継ぎ済み）

スクリーンショット出力ディレクトリはモードごとに異なります:

- `version-diff`: `baseline/*.png`, `actual/*.png`, `diff/*.png`
- `reftest`: `reference/*.png`, `test/*.png`, `diff/*.png`
- `reftest-diff`: `baseline/*.png`, `actual/*.png`, `diff/*.png`,
  `baseline-reference/*.png`, `actual-reference/*.png`,
  `baseline-reference-diff/*.png`, `actual-reference-diff/*.png`

差分ありと判定される条件:

- 両サイドのページ数が異なる
- ページごとのピクセル差分比率が `--max-diff-ratio`（デフォルト `0.00002`）を超える

エラーとして記録される条件:

- どちらかのサイドがレンダリングを完了できない

`reftest-diff` モードでは、両サイドともに失敗（outcome `error`）のエントリは
Errors セクションのみに出力され、Differences セクションには含まれません。
`Entries with differences` サマリー行では、improvement がある場合に件数が表示されます（例: `(improvement: 20, pending: 14, triaged: 0)`）。

実行中ログには、色付きで検出した差分・エラーの triage 状態も表示されます（例）:

```text
-> outcome=changed (pageCountMismatch=false, pageDiffs=4, triage=triaged/regression)
```

実行の最後には、未トリアージ件数も表示されます:

```text
N entry/entries need triage (decision is empty)
```

## 終了コード

- `0`: 差分なし・エラーなし
- `2`: 差分またはエラーあり
- `1`: 実行エラー（スクリプトのクラッシュ）
