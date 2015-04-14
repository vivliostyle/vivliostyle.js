# Vivliostyle.js

JavaScript library for web sites with rich paged viewing and EPUB support, shared with Vivliostyle Formatter & Browser.
Vivliostyle.js is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout).

## Bug reports & feature requests

Please send them to

- [GitHub Issues](https://github.com/vivliostyle/vivliostyle.js.experimental/issues)
- Mailing list ([Japanese](https://groups.google.com/forum/?hl=ja#!forum/vivliostyle-ja))

## Using the code in a web application

(This instruction is an edited version of [README.txt on the original adaptive-layout project](https://github.com/sorotokin/adaptive-layout/blob/deaf2e65b9726dd4e58b3a5d3d90e0968bb63792/README.txt))

### Running sample JavaScript web app without JavaScript compilation

JavaScript source code can be found in src/adapt. Its sole dependency
is closure library base file goog/base.js. JavaScript code can run
without any additional processing or compilation. (For better
performance it could (and should) be compiled with Google Closure
compiler, but more on that later).

To run the sample viewer in a browser, the following files are required:

- src/adapt/vivliostyle-viewer.xhtml (which references all javascript files)
- src/adapt/vivliostyle-viewer.css (sample viewer stylesheet referenced from XHTML)
- Google's goog/base.js (referenced as ../closure/goog/base.js from XHTML)
- all src/adapt/*.js files (source code)
- src/adapt/user-agent-*.css (user agent stylesheet)
- src/adapt/user-agent.xml (user agent stylesheet resources)
- src/adapt/validation.txt (CSS property syntax validation rules)

You will need a web server that can serve the resources above. No code
is executed server-side for sample app, so any web server should work.
All files, except for goog/base.js should be placed in the same folder.
goog/base.js should be placed in a location where vivliostyle-viewer.xhtml can
find it.

The sample app can display XHTML files, as well as unpackaged EPUB and
FB2 publications. Typically the content should reside on the same
server as the vivliostyle-viewer.xhtml file.

To display the content, a URL should be constructed as described below.
Then, a browser needs to be navigated to that URL either by typing it into
address field, creating a hyperlink, or by navigating from JavaScript
using browser APIs.

The URL should be constructed in the following way: start by creating a
URL that references vivliostyle-viewer.xhtml. Then append '#' and one of the
following parameters (x for XHTML/FB2, b for EPUB's OPF file).

- x=[path-to-xhtml-or-fb2-content]
- b=[path-to-opf-file]

Path could either be absolute in the server context (starting with /)
or relative to vivliostyle-viewer.xhtml file.

### MathML support

Adapt library can utilize MathJax to render MathML content in modern browsers.
To use MathJax, ensure that the path to MathJax script is correct in
vivliostyle-viewer.xhtml.

### Compiling JavaScript using Google Closure compiler

Google Closure compiler (https://developers.google.com/closure/compiler/)
can be used to make the code faster and much more compact. Use of the
Closure compiler for web apps is optional.

To use Closure compiler, install it as a sibling to this folder. In
particular, make sure that closure jar file is available as
../closure/compiler.jar from this folder.

Then go to js folder and run

```
./BUILD.sh > vivliostyle-viewer.js
```

Modify vivliostyle-viewer.xhtml to reference only vivliostyle-viewer.js (goog/base.js is not
needed, but MathJax-related files can be kept if desired).
