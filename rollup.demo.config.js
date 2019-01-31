import buble from "rollup-plugin-buble"
import nodeResolve from "rollup-plugin-node-resolve"
import commonJS from "rollup-plugin-commonjs"
import strip from "rollup-plugin-strip"
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
        commonJS({
            include: '../**',
            sourceMap: true
        }),
        buble(),
        strip(),
        terser()
    ]
}
