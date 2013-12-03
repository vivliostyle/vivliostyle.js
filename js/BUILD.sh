#!/bin/bash

java -jar ../../tools/closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS \
    --warning_level VERBOSE closure/goog/base.js adapt/*.js
