# Vivliostyle

[![Build Status](https://travis-ci.org/vivliostyle/vivliostyle.svg?branch=master)](https://travis-ci.org/vivliostyle/vivliostyle)

HTML+CSS typesetting and rich paged viewing with EPUB/Web publications support.

- 🌏 [Vivliostyle website (vivliostyle.org)](https://vivliostyle.org)
- 📖 [Documentation](https://vivliostyle.org/docs/)
- 🤝 [Join Community](https://vivliostyle.org/community/)

## Official Packages

### [Vivliostyle Core](https://github.com/vivliostyle/vivliostyle/tree/master/packages/core) (vivliostyle-core)

Vivliostyle can be installed from [npm](https://www.npmjs.com/package/vivliostyle):

```
npm install @vivliostyle/core
```

See [API Reference](https://github.com/vivliostyle/vivliostyle/blob/master/tree/master/packages/core/doc/api.md).

#### `printHTML`

```js
import { printHTML } from "@vivliostyle/core";

const htmlDoc = `<!doctype html>
<html>
    <head>
        <style>
        ... Add your CSS code here ...
        </style>
    </head>
    <body>
        ... Add your HTML code here ...
    </body>
</html>`,
  config = {
    title: "my printed page",
    printCallback: (iframeWin) => iframeWin.print(), // optional: only needed if calling something other than window.print() for printing.
  };

printHTML(htmlDoc, config);
```

### [Vivliostyle Viewer](https://github.com/vivliostyle/vivliostyle/tree/master/packages/viewer) (vivliostyle-viewer)

- [User’s Guide](https://vivliostyle.github.io/vivliostyle/docs/en/)
- [Samples](https://vivliostyle.org/samples/)
- [Source Code](https://github.com/vivliostyle/vivliostyle/tree/master/packages/viewer)

Download the Vivliostyle Viewer package from <https://vivliostyle.org/download/> and follow the instruction in it.

Alos see [Vivliostyle Viewer User’s Guide](https://vivliostyle.github.io/vivliostyle/docs/en/) for further information.

### [Vivliostyle CLI](https://github.com/vivliostyle/vivliostyle-cli) (vivliostyle-cli)

See [Vivliostyle CLI](https://github.com/vivliostyle/vivliostyle-cli), the save PDF command line tool with Vivliostyle and headless Chrome.

## Contribution

- [Contribution Guide](./CONTRIBUTING.md) for development setup.
- [Vivliostyle.js Development](https://github.com/vivliostyle/vivliostyle.js/wiki/Development).

### Bug Reports & Feature Requests

Please report on [GitHub Issues](https://github.com/vivliostyle/vivliostyle.js/issues).

### Contributors

list of contributors, generated from `git shortlog -sn`.

- KAWAKUBO Toru
- MurakamiShinyu
- unageanu
- kwkbtr
- Satoshi KOJIMA
- Shinyu Murakami
- Shota Kubota
- Johannes Wilm
- spring-raining
- Peter Sorotokin
- Satoshi Kojima
- Satoru MATSUSHIMA (℠)
- Yasuaki Uechi
- kubosho
- U-birksu\peter
- spring_raining
- Masaya Yamauchi
- takanakahiko
- Hiroshi Hatake
- Florian Rivoal
- Seiya Konno
- nulltask

## License

Licensed under [AGPL Version 3](http://www.gnu.org/licenses/agpl.html).

Vivliostyle.js is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout), which is licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Vivliostyle.js contains following components:

- [fast-diff](https://www.npmjs.com/package/fast-diff)
  - Licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
