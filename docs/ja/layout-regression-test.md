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

依存パッケージと Playwright Chromium を一度だけインストール:

```bash
yarn install
npx playwright install chromium --with-deps
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

カテゴリーで絞り込み（繰り返し指定可）:

```bash
yarn test:layout-regression --category "Footnotes" --category "Page floats"
```

タイトルの部分文字列で絞り込み:

```bash
yarn test:layout-regression --title-includes "Issue #1767"
```

## カスタムテスト URL

`--test-url` で任意の Web URL をテスト対象に追加できます（繰り返し指定可）。
ブラウザの CORS 制限は無効化されているため、任意の Web コンテンツをテストできます:

```bash
yarn test:layout-regression \
  --test-url "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html" \
  --test-url "https://example.com/another-test.html"
```

## ビューワー指定形式

`--actual-viewer` と `--baseline-viewer` には次の形式が使えます:

| 形式 | 例 | 説明 |
|------|-----|------|
| キーワード | `canary` | https://vivliostyle.vercel.app/ |
| キーワード | `stable` | https://vivliostyle.org/viewer/ |
| キーワード | `dev` | http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html |
| キーワード | `prod` | http://localhost:3000/viewer/lib/ |
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

結果は PR コメントとして投稿され（新しいプッシュごとに更新）、Actions タブから手動でカスタムビューワー指定、カテゴリーフィルター、制限数を指定して実行することもできます。

## npm スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `yarn test:layout-regression` | 比較を実行 |
| `yarn test:layout-regression:triage` | `artifacts/layout-regression/triage.yaml` のサマリーを表示 |
| `yarn test:layout-regression:triage --show-pending` | 未トリアージのエントリも表示 |
| `yarn test:layout-regression:triage:save` | triage.yaml を scripts/layout-regression-triage.yaml にコピー |
| `yarn test:layout-regression:triage:check` | scripts/layout-regression-triage.yaml をチェック（バージョンスクリプトで使用） |

## オプション

```
--category <name>            カテゴリーで絞り込み（繰り返し指定可）
--title-includes <text>      タイトルの部分文字列で絞り込み
--limit <number>             N エントリで停止
--out-dir <path>             出力ディレクトリ（デフォルト: artifacts/layout-regression）
--timeout <seconds>          ページあたりのタイムアウト秒数（デフォルト: 30）
--max-diff-ratio <number>    許容する差分ピクセル比率（デフォルト: 0.0001）
--pixel-threshold <0..1>     ピクセルごとの色差感度（デフォルト: 0.1）
--viewport-width <number>    ブラウザのビューポート幅（デフォルト: 1800）
--viewport-height <number>   ブラウザのビューポート高さ（デフォルト: 1800）
--skip-screenshots           スクリーンショットをスキップしてページ数のみ確認
--actual-viewer <spec>       actual ビューワー指定（デフォルト: canary）
--baseline-viewer <spec>     baseline ビューワー指定（デフォルト: stable）
--actual-label <name>        レポートでの actual のラベル
--baseline-label <name>      レポートでの baseline のラベル
--extra-viewer-params <s>    両サイド共通の追加ハッシュパラメータ
--actual-viewer-params <s>   actual サイドのみの追加ハッシュパラメータ
--baseline-viewer-params <s> baseline サイドのみの追加ハッシュパラメータ
--test-url <url>             追加テスト URL（繰り返し指定可）
-h, --help                   ヘルプを表示
```

## 出力

デフォルトでは `artifacts/layout-regression/` に出力されます:

- `report.json` — JSON 形式のフル結果
- `report.md` — 人が読みやすいサマリー
- `baseline/*.png` — baseline スクリーンショット
- `actual/*.png` — actual スクリーンショット
- `diff/*.png` — 差分画像（閾値を超えたページのみ）
- `triage.yaml` — トリアージテンプレート（前回の決定を引き継ぎ済み）

差分ありと判定される条件:

- 両サイドのページ数が異なる
- ページごとのピクセル差分比率が `--max-diff-ratio`（デフォルト `0.0001`）を超える

エラーとして記録される条件:

- どちらかのサイドがレンダリングを完了できない

## 終了コード

- `0`: 差分なし・エラーなし
- `2`: 差分またはエラーあり
- `1`: 実行エラー（スクリプトのクラッシュ）
