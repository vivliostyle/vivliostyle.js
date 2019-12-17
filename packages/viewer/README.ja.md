# Vivliostyle Viewer

Vivliostyle Viewer は、HTML+CSS 文書を美しくページ組版・表示する Web アプリケーションであり、EPUB や Web 出版物をサポートします。

このパッケージは[Vivliostyle Core](https://github.com/vivliostyle/vivliostyle/tree/master/packages/core)と[Vivliostyle Viewer](https://github.com/vivliostyle/vivliostyle/tree/master/packages/viewer)を組み合わせたものです。

- オンラインでサンプルを見る <https://vivliostyle.org/samples>
- リリース版のダウンロード <https://github.com/vivliostyle/vivliostyle/releases>
- 開発最新版のダウンロード <http://vivliostyle.org/downloads/vivliostyle-latest.zip>

## 使い方

1. ダウンロードした ZIP ファイルを展開する

2. ターミナルまたはコマンドプロンプトを開き、1.の展開で作られたフォルダ(`vivliostyle-js-[version]`)に移動する

3. 以下のコマンドを実行する

```
（macOS, Linuxなど、シェルがある環境）
> ./start-webserver
（Windows）
> .\start-webserver
```

Node, Ruby, Python のいずれかがインストールされている場合、このコマンドで web サーバーが起動します。

```
Please install Node or Python or Ruby and rerun this script, or use your favorite HTTP server.
```

と表示された場合は、これらのいずれかをインストールしてから再実行するか、お好きな web サーバーを起動してください。

4. ブラウザで<http://localhost:8000>を開く

## 不具合報告・要望

以下にお寄せください。

- GitHub Issues: <https://github.com/vivliostyle/vivliostyle/issues>

## ソースコード

- Vivliostyle on GitHub: <https://github.com/vivliostyle/vivliostyle>

## ドキュメント

- [Vivliostyle ドキュメント](https://vivliostyle.org/ja/docs/)
- [Vivliostyle Viewer ユーザーガイド](https://vivliostyle.org/ja/docs/user-guide)
