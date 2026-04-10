import { build } from "esbuild";
import process from "node:process";

const isDev = process.argv.includes("--dev");
const external = [
  "react",
  "react-dom",
  "@emotion/core",
  "@emotion/styled",
  "@vivliostyle/core",
];

const sharedOptions = {
  bundle: true,
  entryPoints: ["src/index.tsx"],
  external,
  logLevel: "info",
  platform: "browser",
  sourcemap: true,
  target: "es2018",
};

const builds = [
  build({
    ...sharedOptions,
    format: "cjs",
    minify: !isDev,
    outfile: "dist/react-vivliostyle.js",
  }),
];

if (!isDev) {
  builds.push(
    build({
      ...sharedOptions,
      format: "esm",
      minify: true,
      outfile: "dist/react-vivliostyle.modern.js",
      target: "es2020",
    }),
  );
}

await Promise.all(builds);
