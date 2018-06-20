#!/usr/bin/env node

const { exec } = require('child_process');

const hideWarningFiles = [
    'node_modules/fast-diff/diff.js',
    'src/closure/goog/base.js',
    'src/closure/goog/*/*.js',
    'src/adapt/*.js',
    'src/vivliostyle/*.js',
    'plugins/*/src/*.js',
    'node_modules/fast-diff/diff.js'
];
const execScript = `
java -jar node_modules/google-closure-compiler/compiler.jar \
--checks_only \
--compilation_level ADVANCED_OPTIMIZATIONS \
--language_in ECMASCRIPT5 \
--warning_level VERBOSE \
--externs src/externs.js \
--process_common_js_modules \
--hide_warnings_for ${hideWarningFiles.join(' ')}
`;

exec(execScript, (error, stdout, stderr) => {
    if (error) {
        throw new Error(error);
    }

    console.log(stdout);
    console.log(stderr);
});
