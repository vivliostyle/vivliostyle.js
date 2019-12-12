import { string } from "rollup-plugin-string";
import { terser } from "rollup-plugin-terser";
import babel from "rollup-plugin-babel";
import commonJS from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import pkg from "./package.json";
import sourcemaps from "rollup-plugin-sourcemaps";
import strip from "rollup-plugin-strip";

const banner = `\
/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 *
 * @author ${pkg.author}
 * @license ${pkg.license}
 * @preserve
 */
`;
export default [
  {
    input: "src/index.js",
    output: {
      format: "cjs",
      file: pkg.main,
      sourcemap: true,
      banner,
    },
    plugins: [
      string({
        include: "../**/*.css",
      }),
      nodeResolve({
        mainFields: ["browser", "main"],
      }),
      sourcemaps(),
      commonJS({
        include: "../**",
        sourceMap: true,
      }),
      strip({
        debugger: false,
        functions: [
          "console.*",
          "console.warn.apply",
          "console.info.apply",
          "console.debug.apply",
          "console.error.apply",
        ],
      }),
      babel(),
      terser(),
    ],
  },
  {
    input: "src/index.js",
    output: {
      format: "esm",
      file: pkg.module,
      name: "lib",
      sourcemap: true,
      banner,
    },
    plugins: [
      string({
        include: "../**/*.css",
      }),
      nodeResolve({
        mainFields: ["module", "browser", "main"],
      }),
      sourcemaps(),
      commonJS({
        include: "../**",
        sourceMap: true,
      }),
      strip({
        debugger: false,
        functions: [
          "console.*",
          "console.warn.apply",
          "console.info.apply",
          "console.debug.apply",
          "console.error.apply",
        ],
      }),
      terser(),
    ],
  },
];
