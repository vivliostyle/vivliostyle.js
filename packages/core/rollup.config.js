import ts from "@wessberg/rollup-plugin-ts";
import { string } from "rollup-plugin-string";
import replace from "@rollup/plugin-replace";
import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import commonJS from "@rollup/plugin-commonjs";
import strip from "@rollup/plugin-strip";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const input = "src/vivliostyle.ts";
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
  ts({
    tsconfig: (resolvedConfig) => ({
      ...resolvedConfig,
      inlineSourceMap: isDevelopment,
    }),
  }),
  // Replace require() statements refering non-JS resources with its contents
  string({
    include: ["src/vivliostyle/assets/*", "resources/*"],
  }),
  // Replace conditional variable with value
  replace({ VIVLIOSTYLE_DEBUG: JSON.stringify(isDevelopment) }),
  // Resolve module path in node_modules according to package.json's props
  nodeResolve({
    mainFields: ["browser", "main"],
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
  // Cross-browser support
  !isDevelopment ? babel() : {},
  // Minimize module size
  !isDevelopment ? terser() : {},
];

const buildStep = [
  // UMD
  {
    input,
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        banner,
      },
    ],
    plugins,
    watch: {
      clearScreen: true,
      exclude: ["*"],
      include: ["src/**/*.ts"],
    },
  },
];

if (!isDevelopment) {
  buildStep.push(
    // CJS and ES Modules
    {
      input,
      output: [
        {
          file: pkg.module,
          format: "es",
          sourcemap: true,
          banner,
        },
        {
          name: "Vivliostyle",
          file: pkg.browser,
          format: "umd",
          sourcemap: true,
          banner,
        },
      ],
      plugins,
    },
  );
}

// Show build pipeline
console.log(
  plugins
    .map((p) => p.name)
    .filter((s) => s)
    .join(" -> "),
);

export default buildStep;
