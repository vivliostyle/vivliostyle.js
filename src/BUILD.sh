#!/bin/bash

java -jar ../../tools/closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --warning_level VERBOSE closure/goog/base.js adapt/*.js

#java -jar ../../tools/closure/compiler.jar --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT --warning_level VERBOSE closure/goog/base.js adapt/base.js adapt/task.js adapt/taskutil.js adapt/net.js adapt/cfi.js adapt/expr.js adapt/css.js adapt/csstok.js adapt/cssparse.js adapt/cssvalid.js adapt/geom.js adapt/cssprop.js adapt/xmldoc.js adapt/font.js adapt/sha1.js adapt/csscasc.js adapt/vtree.js adapt/cssstyler.js adapt/vgen.js adapt/pm.js adapt/layout.js adapt/ops.js adapt/toc.js adapt/epub.js adapt/devel.js adapt/vivliostyle-viewer.js
