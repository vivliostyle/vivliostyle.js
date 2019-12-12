/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";
const outputDir = path.join(__dirname, "lib", "js");

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/ts/main.ts",
  devtool: "source-map",
  output: {
    path: outputDir,
    filename: isProduction
      ? "vivliostyle-viewer.min.js" // "production" or "debug"
      : "vivliostyle-viewer.dev.js", // "development"
    library: "@vivliostyle/viewer",
    libraryTarget: "umd",
    libraryExport: "default",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new CircularDependencyPlugin({
      failOnError: true,
      allowAsyncCycles: true,
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {},
      }),
    ],
  },
};
