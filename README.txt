EPUB Adaptive Layout JavaScript-based implementation ("Adapt")

Adapt is an implementation of EPUB Adaptive Layout specification
http://www.idpf.org/epub/pgt/. It can be used either in the context of a
web application, in a mobile app, or a traditional desktop application.

1. Using the code in a web application.

1.1 Running sample JavaScript web app without JavaScript compilation.

JavaScript source code can be found in adapt/js. Its sole dependency
is closure library base file goog/base.js. JavaScript code can run
without any additional processing or compilation. (For better
performance it could (and should) be compiled with Google Closure
compiler, but more on that later).

To run the sample app in a browser, the following files are required:
- js/adapt/sampleapp.xhtml (which references all javascript files)
- Google's goog/base.js (referenced as ../closure/goog/base.js from XHTML)
- all js/adapt/*.js files (source code)
- js/adapt/user-agent-*.css (user agent stylesheet)
- js/adapt/user-agent.xml (user agent stylesheet resources)
- js/adapt/validation.txt (CSS property syntax validation rules)

You will need a web server that can serve the resources above. No code
is executed server-side for sample app, so any web server should work.
All files, except for goog/base.js should be placed in the same folder.
goog/base.js should be placed in a location where sampleapp.xhtml can
find it.

The sample app can display XHTML files, as well as unpackaged EPUB and
FB2 publications. Typically the content should reside on the same
server as the sampleapp.xhtml file.

To display the content, a URL should be constructed as described below.
Then, a browser needs to be navigated to that URL either by typing it into
address field, creating a hyperlink, or by navigating from JavaScript
using browser APIs.

The URL should be constructed in the following way: start by creating a
URL that references sampleapp.xhtml. Then append '#' and one of the
following parameters (x for XHTML/FB2, b for EPUB's OPF file).
- x=<path-to-xhtml-or-fb2-content>
- b=<path-to-opf-file>

Path could either be absolute in the server context (starting with /)
or relative to sampleapp.xhtml file.

1.2 MathML support.

Adapt library can utilize MathJax to reder MathML content in modern browsers.
To use MathJax, ensure that the path to MathJax script is correct in
sample.xhtml.

1.3 Compiling JavaScript using Google Closure compiler.

Google Closure compiler (https://developers.google.com/closure/compiler/)
can be used to make the code faster and much more compact. Use of the
Closure compiler for web apps is optional.

To use Closure compiler, install it as a sibling to this folder. In
particular, make sure that closure jar file is available as
../closure/compiler.jar from this folder.

Then go to js folder and run

./BUILD.sh > adapt.js

Modify sampleapp.xhtml to reference only adapt.js (goog/base.js is not
needed, but MathJax-related files can be kept if desired).

2. Building sample standalone application.

There code contains sample apps for MacOSX and Windows. They have some common
C code (embedded web server, zip library, and, optionally, support for
on-the-fly OpenType to WOFF conversion) and platform-specific UI code.

The first step is to compile JavaScript code and encode it as a set of
resources that can be compiled into a C library. To do that, make sure
that Closure compiler is set up, go to js folder and run

./BUILD_C_RES.sh

This will produce clang/generated/adapt_resources.c file.

If MathJax is installed as a sibling of this folder, a set of MathJax
resources sufficient for running on MacOS will be compiled in as well.

To build MacOS app, open build/osx/Viewer.xcworkspace in XCode and build
Viewer project.

To build Windows app, open build/win/viewer/viewer.sln in VisualStudio and
build it.
