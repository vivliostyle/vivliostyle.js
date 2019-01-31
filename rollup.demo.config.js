import buble from "rollup-plugin-buble"
import nodeResolve from "rollup-plugin-node-resolve"
import commonJS from "rollup-plugin-commonjs"
import strip from "rollup-plugin-strip"
import sourcemaps from "rollup-plugin-sourcemaps"
import {
    terser
} from "rollup-plugin-terser"

export default {
    input: "demo/index.js",
    output: {
        format: "iife",
        file: "demo/bundle.js",
        sourcemap: true
    },
    plugins: [
        nodeResolve({
            main: true,
            browser: true
        }),
        sourcemaps(),
        commonJS({
            include: '../**',
            sourceMap: true
        }),
        strip({
            debugger: false,
            functions: [ 'console.*', 'console.warn.apply', 'console.info.apply', 'console.debug.apply', 'console.error.apply' ]
        }),
        buble(),
        terser()
    ]
}
