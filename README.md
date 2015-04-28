# Vivliostyle.js

JavaScript library for web sites with rich paged viewing and EPUB support, shared with Vivliostyle Formatter & Browser.
Vivliostyle.js is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout) (licensed under Apache License 2.0).

## Try Vivliostyle.js

http://vivliostyle.github.io/vivliostyle.js/

## Bug reports & feature requests

Please send them to

- [GitHub Issues](https://github.com/vivliostyle/vivliostyle.js/issues)
- Mailing list ([Japanese](https://groups.google.com/forum/?hl=ja#!forum/vivliostyle-ja))

## Using Vivliostyle.js viewer

To run the viewer, you need to generate CSS files using [Compass](http://compass-style.org):

```sh
# Ensure Ruby and Node.js is installed in your system
gem install compass
npm run install
npm run build-css
```

Then you need a web server that can serve the following resources:

- `src` directory (contains core JavaScript files and resources)
- `viewer` directory (contains viewer resources like HTML/CSS/web fonts)
- Content files you want to view in the viewer (see below)

The viewer can display XHTML files, as well as unpackaged EPUB and FB2 publications.
Note that the viewer may not be able to display contents on servers different
from one hosting the viewer files due to security restriction on cross-origin resources.

To display the content, a URL should be constructed in the following way:
start by creating a URL that references vivliostyle-viewer.xhtml.
Then append '#' and one of the following parameters (x for XHTML/FB2, b for EPUB's OPF file).

- x=[path-to-xhtml-or-fb2-content]
- b=[path-to-opf-file]

Path could either be absolute in the server context (starting with /)
or relative to vivliostyle-viewer.xhtml file.

### MathML support

Vivliostyle viewer can utilize MathJax to render MathML content in modern browsers.
To use MathJax, ensure that the path to MathJax script is correct in
vivliostyle-viewer.xhtml.

### Compiling JavaScript using Google Closure compiler

[Google Closure compiler](https://developers.google.com/closure/compiler/)
can be used to make the code faster and much more compact. Use of the
Closure compiler for web apps is optional.

Closure compiler can be installed via npm. To compile JavaScipt, run

```sh
npm install
npm run build
```

Then the compiled JavaScript file appears at `build/vivliostyle-viewer.min.js`.
Modify vivliostyle-viewer.xhtml to reference only vivliostyle-viewer.min.js
(goog/base.js is not needed, but MathJax-related files can be kept if desired).
You might need to modify `uaRoot` parameter in vivliostyle-viewer.xhtml to
point the location of user agent resources (user-agent-* and validation.txt files).
