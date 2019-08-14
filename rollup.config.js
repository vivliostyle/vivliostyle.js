import babel from "rollup-plugin-babel"
import nodeResolve from "rollup-plugin-node-resolve"
import commonJS from "rollup-plugin-commonjs"
import strip from "rollup-plugin-strip"
import sourcemaps from "rollup-plugin-sourcemaps"
import {
    terser
} from "rollup-plugin-terser"
import pkg from "./package.json"

const banner = `\
/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 *
 * @author ${pkg.author}
 * @license ${pkg.license}
 * @preserve
 */
`

export default [
    {
        input: "src/index.js",
        output: {
            format: "cjs",
            file: pkg.main,
            sourcemap: true,
            banner
        },
        plugins: [
            nodeResolve({
                mainFields: ['module', 'browser', 'main']
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
            babel(),
            terser()
        ]
    },
    {
        input: "src/index.js",
        output: {
            format: "esm",
            file: pkg.module,
            name: "lib",
            sourcemap: true,
            banner
        },
        plugins: [
            nodeResolve({
                mainFields: ['module', 'browser', 'main']
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
            terser()
        ]
    }
]
