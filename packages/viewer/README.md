# Vivliostyle Viewer

[![npm][npm]][npm-url]
[![npm][npm-next]][npm-url]
[![Build Status][build-status]][build-status-url]
[![deps][deps]][deps-url]
[![Install Size][size]][size-url]
[![Downloads][downloads]][downloads-url]

Vivliostyle Viewer is a UI component used with [Vivliostyle Core](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/core) to make Vivliostyle Viewer, a Web application for HTML+CSS typesetting and rich paged viewing with EPUB/Web publications support.

- View samples online: <https://vivliostyle.org/samples/>
- Download release version: <https://github.com/vivliostyle/vivliostyle.js/releases>
- Download latest development version: <https://vivliostyle.github.io>

## Try Vivliostyle Viewer

- [Vivliostyle Viewer samples](https://vivliostyle.org/samples)

## How to use

1. Unzip the downloaded ZIP file.
2. Open a terminal or a command prompt and navigate to the folder generated in the step 1.
3. Run the following command:

```
(Shell environment like macOS or Linux)
> ./start-webserver
(Windows)
> .\start-webserver
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

## Development

See [Vivliostyle.js Development](https://github.com/vivliostyle/vivliostyle.js/wiki/Development).

## License

Licensed under [AGPL Version 3](http://www.gnu.org/licenses/agpl.html).

## Documentation

- [Vivliostyle Documentation](https://docs.vivliostyle.org)
- [Vivliostyle Viewer User’s Guide](https://docs.vivliostyle.org/#/user-guide)

[npm]: https://img.shields.io/npm/v/@vivliostyle/viewer/latest
[npm-next]: https://img.shields.io/npm/v/@vivliostyle/viewer/next
[npm-url]: https://www.npmjs.com/package/@vivliostyle/viewer
[build-status]: https://travis-ci.org/vivliostyle/vivliostyle.js.svg
[build-status-url]: https://travis-ci.org/vivliostyle/vivliostyle.js
[deps]: https://img.shields.io/david/vivliostyle/vivliostyle.js?path=packages/viewer
[deps-url]: https://david-dm.org/vivliostyle/vivliostyle.js/?path=packages/viewer
[size]: https://packagephobia.now.sh/badge?p=@vivliostyle/viewer
[size-url]: https://packagephobia.now.sh/result?p=@vivliostyle/viewer
[downloads]: https://img.shields.io/npm/dw/@vivliostyle/viewer.svg
[downloads-url]: https://www.npmjs.com/package/@vivliostyle/viewer
