# Vivliostyle Viewer

Vivliostyle Viewerは、HTML(XML)/CSS文書を組版・表示するWebアプリケーションです。
このパッケージは[Vivliostyle core engine](https://github.com/vivliostyle/vivliostyle.js)、[Vivliostyle UI](https://github.com/vivliostyle/vivliostyle-ui)およびその他の組版ライブラリーを組み合わせたものです。

- オンラインでサンプルを見る <http://vivliostyle.com/ja/sample/>
- リリース版のダウンロード <http://vivliostyle.github.io/vivliostyle.js/downloads/vivliostyle-js-2017.6.zip>
- 開発最新版のダウンロード <http://vivliostyle.github.io/vivliostyle.js/downloads/vivliostyle-js-latest.zip>

## 使い方

1. ダウンロードしたZIPファイルを展開する

2. ターミナルまたはコマンドプロンプトを開き、1.の展開で作られたフォルダ(`vivliostyle-js-[version]`)に移動する

3. 以下のコマンドを実行する

  ```
  （Mac OS X, Linuxなど、シェルがある環境）
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

- GitHub Issues <https://github.com/vivliostyle/vivliostyle.js/issues>
- メーリングリスト <https://groups.google.com/forum/?hl=ja#!forum/vivliostyle-ja>

## ソースコード

- Vivliostyle core engine on GitHub: <https://github.com/vivliostyle/vivliostyle.js>
- Vivliostyle UI on GitHub: <https://github.com/vivliostyle/vivliostyle-ui>
