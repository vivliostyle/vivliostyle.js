#!/usr/bin/env node

const { exec } = require('child_process');
const mkdirp = require('mkdirp');

const outputDir = 'lib';
const outputFiles = [
    'lib/vivliostyle.min.js',
    'src/closure/goog/base.js',
    'src/closure/goog/*/*.js',
    'src/adapt/*.js',
    'src/vivliostyle/*.js',
    'plugins/*/src/*.js',
    'node_modules/fast-diff/diff.js'
];
const execScript = `
java -jar node_modules/google-closure-compiler/compiler.jar \
--compilation_level ADVANCED_OPTIMIZATIONS \
--language_in ECMASCRIPT6 \
--warning_level VERBOSE \
--output_wrapper_file src/wrapper.js \
--externs src/externs.js \
--process_common_js_modules \
--hide_warnings_for node_modules/fast-diff/diff.js \
--js_output_file ${outputFiles.join(' ')}
`;

mkdirp(outputDir, (err) => {
    if (err) {
        throw new Error(err);
    }

    exec(execScript, (error, stdout, stderr) => {
        if (error) {
            throw new Error(error);
        }

        console.log(stdout);
        console.log(stderr);
    });
});
