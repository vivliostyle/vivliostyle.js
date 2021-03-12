import path from "path";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import commonJS from "@rollup/plugin-commonjs";
import strip from "@rollup/plugin-strip";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";
import corePkg from "../core/package.json";

const input = "src/main.ts";
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

// Plugins
const plugins = [
  // Transpile TypeScript into JavaScript
  typescript({
    inlineSourceMap: false,
    inlineSources: true,
  }),
  // Replace conditional variable with value
  replace({
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    preventAssignment: true,
  }),
  // Resolve module path in node_modules according to package.json's props
  nodeResolve({
    mainFields: ["main", "module"],
  }),
  // Grab source maps from other module's sourceMappingURLs
  sourcemaps(),
  // Handle 'require()', 'module.exports' statements
  commonJS({
    sourceMap: true,
  }),
  // Remove clutter
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
  // Minimize module size
  !isDevelopment ? terser() : {},
];

// Show build pipeline
console.log(
  plugins
    .map((p) => p.name)
    .filter((s) => s)
    .join(" -> "),
);

export default {
  // UMD
  input,
  output: [
    {
      name: "VivliostyleViewer",
      file: isDevelopment ? "lib/js/vivliostyle-viewer-dev.js" : pkg.main,
      format: "umd",
      sourcemap: true,
      banner,
    },
  ],
  plugins,
  watch: {
    clearScreen: false,
    exclude: ["*"],
    include: [path.join("..", "core", corePkg.main), "src/**/*.ts"],
  },
};
