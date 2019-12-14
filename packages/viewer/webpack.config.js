const path = require("path");
const webpack = require("webpack");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const config = (outputFilename, tsConfigName) => ({
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry:
    process.env.NODE_ENV === "production"
      ? "./src/ts/main.ts"
      : "./src/ts/main-dev.ts",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "build", "js"),
    filename:
      process.env.NODE_ENV === "development"
        ? outputFilename + ".dev.js" // "development"
        : outputFilename + ".min.js", // "production" or "debug"
    library: "vivliostyle-ui",
    libraryTarget: "umd",
    libraryExport: "default"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: tsConfigName
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: process.env.NODE_ENV
      }
    }),
    new CircularDependencyPlugin({
      failOnError: true,
      allowAsyncCycles: true
    })
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {}
      })
    ]
  }
});

module.exports = config("vivliostyle-ui", "tsconfig.json");
