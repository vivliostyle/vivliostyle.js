# Vivliostyle Viewer

Vivliostyle Viewer は、HTML+CSS 文書を美しくページ組版・表示する Web アプリケーションであり、EPUB や Web 出版物をサポートします。

- オンライン Vivliostyle Viewer : <https://vivliostyle.org/viewer/>
- Vivliostyle Viewer をダウンロード: <https://vivliostyle.github.io>
- オンラインでサンプルを見る: <https://vivliostyle.org/ja/samples/>

## 使い方

### 配布パッケージ `vivliostyle-viewer-*.zip` を使う場合

1. ダウンロードした ZIP ファイルを解凍する
2. ターミナル（または Windows コマンドプロンプト）を開く
3. 解凍したディレクトリにある `start-webserver` または `start-viewer` スクリプト（または Windows バッチ）ファイルを実行します。例えば:

```
$ ./vivliostyle-viewer-latest/start-webserver
```

あるいは Windows コマンドプロンプトなら

```
> vivliostyle-viewer-latest\start-webserver
```

もし次のメッセージ、

```
Please install Node.js or Ruby or Python and rerun this script, or use your favorite HTTP server.
```

が表示された場合は、これらのいずれか（[Node.js](https://nodejs.org/) がお勧め）をインストールしてから再実行するか、お好きな web サーバーを起動してください。

`start-webserver` スクリプトはローカル Web サーバーを起動し、デフォルトのブラウザーを開きます。現在のディレクトリが Web サーバーのルートとして使用されます。使用方法のヘルプを表示するには、`start-webserver --help` を実行してください。

`start-viewer` スクリプトはローカル Web サーバーを起動し（`start-webserver` を呼び出します）、ブラウザーで Vivliostyle Viewer（ `./viewer/` に配置）を開きます。 使用方法のヘルプを表示するには、`start-viewer --help` を実行してください。

## ドキュメント

オンラインの [Vivliostyle Documents](https://vivliostyle.org/ja/documents/) が最新ドキュメントです。あるいは、配布パッケージ版の `./docs/` にあるドキュメントをローカル Web サーバー上で見ることができます。

## 不具合報告・要望

以下にお寄せください。

- GitHub Issues: <https://github.com/vivliostyle/vivliostyle.js/issues>

## ソースコード

- Vivliostyle.js on GitHub: <https://github.com/vivliostyle/vivliostyle.js>

## License

Licensed under [AGPL Version 3](https://www.gnu.org/licenses/agpl-3.0.html).
