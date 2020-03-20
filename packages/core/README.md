# Vivliostyle Core

[![npm][npm]][npm-url]
[![npm][npm-next]][npm-url]
[![Build Status][build-status]][build-status-url]
[![deps][deps]][deps-url]
[![Install Size][size]][size-url]
[![Downloads][downloads]][downloads-url]

JavaScript Library for HTML+CSS typesetting and rich paged viewing with EPUB/Web publications support.

## Try Vivliostyle

[Vivliostyle Viewer samples](https://vivliostyle.org/samples/)

## Bug reports & feature requests

Please send them to

- [GitHub Issues](https://github.com/vivliostyle/vivliostyle.js/issues)

## Use Vivliostyle

### Vivliostyle Viewer

Download the Vivliostyle Viewer from <https://vivliostyle.org/download/> and follow the instruction in it.

See [Vivliostyle Viewer User’s Guide](https://vivliostyle.github.io/vivliostyle.js/docs/en/)

See <https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/viewer> for source code of the Viewer.

### Vivliostyle CLI

Check ouut [vivliostyle-cli](https://github.com/vivliostyle/vivliostyle-cli/), a command line tool armed with Vivliostyle and headless Chrome to generate PDF from source file.

### Integrate Vivliostyle.js with web site

Vivliostyle can be installed via [npm](https://www.npmjs.com/package/@vivliostyle/core):

```
npm install @vivliostyle/core
```

See [API Reference](https://vivliostyle.org/docs/api).

## Development

See [Vivliostyle Development Guide](https://github.com/vivliostyle/vivliostyle.js/wiki/Development).

## License

Licensed under [AGPL Version 3](http://www.gnu.org/licenses/agpl.html).

Vivliostyle is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout), which is licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Vivliostyle contains following components:

- [fast-diff](https://www.npmjs.com/package/fast-diff)
  - Licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

## Other Documentation

- [Vivliostyle Viewer User’s Guide](https://vivliostyle.github.io/vivliostyle.js/docs/en/)
- [Vivliostyle Documentation](https://vivliostyle.org/docs/)

[npm]: https://img.shields.io/npm/v/@vivliostyle/core/latest
[npm-next]: https://img.shields.io/npm/v/@vivliostyle/core/next
[npm-url]: https://www.npmjs.com/package/@vivliostyle/core
[build-status]: https://travis-ci.org/vivliostyle/vivliostyle.svg
[build-status-url]: https://travis-ci.org/vivliostyle/vivliostyle
[deps]: https://img.shields.io/david/vivliostyle/vivliostyle?path=packages%2Fcore
[deps-url]: https://www.npmjs.com/package/@vivliostyle/corhttps://david-dm.org/vivliostyle/vivliostyle/?path=packages/core
[size]: https://packagephobia.now.sh/badge?p=@vivliostyle/core
[size-url]: https://packagephobia.now.sh/result?p=@vivliostyle/core
[downloads]: https://img.shields.io/npm/dw/@vivliostyle/core.svg
[downloads-url]: https://www.npmjs.com/package/@vivliostyle/core
