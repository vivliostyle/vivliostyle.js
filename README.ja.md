# Vivliostyle Viewer

Vivliostyle Viewerは、HTML+CSS文書を美しくページ組版・表示するWebアプリケーションであり、EPUBやWeb出版物をサポートします。

このパッケージは[Vivliostyle.js (core engine)](https://github.com/vivliostyle/vivliostyle.js)と[Vivliostyle UI](https://github.com/vivliostyle/vivliostyle-ui)を組み合わせたものです。

- オンラインでサンプルを見る <https://vivliostyle.org/samples/>
- リリース版のダウンロード <https://github.com/vivliostyle/vivliostyle.js/releases>
- 開発最新版のダウンロード <http://vivliostyle.github.io/vivliostyle.js/downloads/vivliostyle-js-latest.zip>

## 使い方

1. ダウンロードしたZIPファイルを展開する

2. ターミナルまたはコマンドプロンプトを開き、1.の展開で作られたフォルダ(`vivliostyle-js-[version]`)に移動する

3. 以下のコマンドを実行する

  ```
  （macOS, Linuxなど、シェルがある環境）
  > ./start-webserver
  （Windows）
  > .\start-webserver
  ```

  Node.js, Ruby, Pythonのいずれかがインストールされている場合、このコマンドでwebサーバーが起動します。

  ```
  Please install Node.js or Python or Ruby and rerun this script, or use your favorite HTTP server.
  ```
  と表示された場合は、これらのいずれかをインストールしてから再実行するか、お好きなwebサーバーを起動してください。

4. ブラウザで<http://localhost:8000>を開く

## 不具合報告・要望

以下にお寄せください。

- GitHub Issues: <https://github.com/vivliostyle/vivliostyle.js/issues>
  - UIに関する問題は <https://github.com/vivliostyle/vivliostyle-ui/issues>

## ソースコード

- Vivliostyle.js (core engine) on GitHub: <https://github.com/vivliostyle/vivliostyle.js>
- Vivliostyle UI on GitHub: <https://github.com/vivliostyle/vivliostyle-ui>

## ドキュメント

- [Vivliostyle Viewer  ユーザーガイド](https://vivliostyle.github.io/vivliostyle.js/docs/ja/)

- [Vivliostyle ドキュメント](https://vivliostyle.org/ja/docs/)
