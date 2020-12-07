# Vivliostyle Viewer

[![npm][npm]][npm-url]
[![Build Status][build-status]][build-status-url]
[![deps][deps]][deps-url]
[![Install Size][size]][size-url]
[![Downloads][downloads]][downloads-url]

Vivliostyle Viewer is a Web application for HTML+CSS typesetting and rich paged viewing with EPUB/Web publications support.

- Online Vivliostyle Viewer: <https://vivliostyle.org/viewer/>
- Download Vivliostyle Viewer: <https://vivliostyle.github.io>
- View samples online: <https://vivliostyle.org/samples/>

## How to use

### To use the distribution package `vivliostyle-viewer-*.zip`

1. Unzip the downloaded ZIP file.
2. Open a terminal (or Windows command prompt)
3. Run the `start-webserver` or `start-viewer` script (or Windows batch) file located in the unzipped directory. For example:

```
$ ./vivliostyle-viewer-latest/start-webserver
```

or in Windows command prompt,

```
> vivliostyle-viewer-latest\start-webserver
```

If a message,

```
Please install Node.js or Ruby or Python and rerun this script, or use your favorite HTTP server.
```

is shown, install either of them (recommend [Node.js](https://nodejs.org/) and rerun the script, or use your favorite web server.

The `start-webserver` script starts a local web server and opens the default browser. The current directory is used as the root of the web server. Run `start-webserver --help` to see the usage help.

The `start-viewer` script starts a local web server (calls `start-webserver`) and opens Vivliostyle Viewer (located in `./viewer/`) in browser. Run `start-viewer --help` to see the usage help.

### To use the npm package [`@vivliostyle/viewer`](https://www.npmjs.com/package/@vivliostyle/viewer)

```
npm install @vivliostyle/viewer
```

Vivliostyle Viewer is located in `./node_modules/@vivliostyle/viewer/lib/`, so you need to start a web server and open this location in the browser to start the Vivliostyle Viewer.

## Documentation

See online [Vivliostyle Documents](https://vivliostyle.org/documents/) for the latest documents, or open `./docs/` in the distribution package using local web server.

## Bug reports & feature requests

Please send them to

- GitHub Issues: <https://github.com/vivliostyle/vivliostyle.js/issues>

## Source code

- Vivliostyle.js on GitHub: <https://github.com/vivliostyle/vivliostyle.js>

## License

Licensed under [AGPL Version 3](https://www.gnu.org/licenses/agpl-3.0.html).

[npm]: https://img.shields.io/npm/v/@vivliostyle/viewer/latest
[npm-next]: https://img.shields.io/npm/v/@vivliostyle/viewer/next
[npm-url]: https://www.npmjs.com/package/@vivliostyle/viewer
[build-status]: https://travis-ci.com/vivliostyle/vivliostyle.js.svg?branch=master
[build-status-url]: https://travis-ci.com/vivliostyle/vivliostyle.js
[deps]: https://img.shields.io/david/vivliostyle/vivliostyle.js?path=packages/viewer
[deps-url]: https://david-dm.org/vivliostyle/vivliostyle.js/?path=packages/viewer
[size]: https://packagephobia.now.sh/badge?p=@vivliostyle/viewer
[size-url]: https://packagephobia.now.sh/result?p=@vivliostyle/viewer
[downloads]: https://img.shields.io/npm/dw/@vivliostyle/viewer.svg
[downloads-url]: https://www.npmjs.com/package/@vivliostyle/viewer
