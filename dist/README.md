# Vivliostyle.js viewer

Vivliostyle.js viewer is a web application displaying and typesetting HTML(XML)/CSS documents with Vivliostyle.js.

- View samples online: <http://vivliostyle.com/en/sample/>
- Download release version (beta): <http://vivliostyle.github.io/vivliostyle.js/downloads/vivliostyle-js-viewer-0.2.0.zip>
- Download latest development version: <http://vivliostyle.github.io/vivliostyle.js/downloads/vivliostyle-js-viewer-latest.zip>

## Usage

1. Unzip the downloaded ZIP file.

2. Open a terminal or a command prompt and navigate to the folder (`vivliostyle-js-viewer-[version]`) generated in the step 1.

3. Run the following command:

  ```
  (Shell environment like Mac OS X or Linux)
  > scripts/start-webserver
  (Windows)
  > scripts\start-webserver
  ```

  This command starts a web server if either of Node.js, Ruby, Python is installed.

  If a message
  ```
  Please install Node.js or Python or Ruby and rerun this script, or use your favorite HTTP server.
  ```
  is shown, install either of them and rerun the command, or start your favorite web server.

4. Open <http://localhost:8000> with a web browser.

## Bug reports & feature requests

Please send them to

- GitHub Issues: <https://github.com/vivliostyle/vivliostyle.js/issues>
- Mailing list: <https://groups.google.com/forum/?hl=ja#!forum/vivliostyle>

## Source code

- Vivliostyle.js on GitHub: <https://github.com/vivliostyle/vivliostyle.js>
- Vivliostyle.js viewer on GitHub: <https://github.com/vivliostyle/vivliostyle-js-viewer>

## License

Licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Vivliostyle.js is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout).
