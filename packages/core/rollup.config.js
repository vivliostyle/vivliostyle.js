import { string } from "rollup-plugin-string";
import { terser } from "rollup-plugin-terser";
import babel from "rollup-plugin-babel";
import commonJS from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import pkg from "./package.json";
import sourcemaps from "rollup-plugin-sourcemaps";
import strip from "rollup-plugin-strip";
import ts from "@wessberg/rollup-plugin-ts";

const input = "src/ts/vivliostyle.ts";
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

const isDevelopment = process.env.NODE_ENV === "development";

const plugins = [
  ts({ tsconfig: "tsconfig.json" }),
  string({
    include: ["src/ts/resources/*", "resources/*"],
  }),
  nodeResolve({
    mainFields: ["browser", "main"],
  }),
  sourcemaps(),
  commonJS({
    sourceMap: true,
  }),
  !isDevelopment
    ? strip({
        debugger: false,
        functions: [
          "console.*",
          "console.warn.apply",
          "console.info.apply",
          "console.debug.apply",
          "console.error.apply",
        ],
      })
    : {},
  !isDevelopment ? babel() : babel(),
  !isDevelopment ? terser() : {},
];

console.log(
  plugins
    .map((p) => p.name)
    .filter((s) => s)
    .join(" -> "),
);

function devify(name, infix = ".development") {
  const [base, ext] = name.match(/^(.+)\.(.+)$/).slice(1);
  return `${base}${infix}.${ext}`;
}

export default [
  {
    input,
    output: [
      {
        name: "Vivliostyle",
        file: pkg.unpkg,
        format: "umd",
        sourcemap: true,
        banner,
      },
    ],
    plugins,
  },
  {
    input,
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        banner,
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
        banner,
      },
    ],
    plugins,
  },
];
