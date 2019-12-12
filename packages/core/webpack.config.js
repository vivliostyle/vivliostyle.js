const path = require("path");
const webpack = require("webpack");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const pkg = require("./package.json");

const bannerText = `Copyright 2013 Google, Inc.
Copyright 2015 Trim-marks Inc.
Copyright 2018 Vivliostyle Foundation

Vivliostyle.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vivliostyle.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.

Vivliostyle core ${pkg.version}`;

const isProduction = process.env.NODE_ENV === "production";

const config = (outputFilename, tsConfigName) => ({
  mode: isProduction ? "production" : "development",
  entry: "./src/ts/vivliostyle.ts",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "lib"),
    filename: isProduction
      ? outputFilename + ".min.js" // "production" or "debug"
      : outputFilename + ".dev.js", // "development"
    library: "vivliostyle",
    libraryTarget: "umd",
    libraryExport: "default",
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, "src"),
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: tsConfigName,
              transpileOnly: true,
              experimentalWatchApi: false,
            },
          },
        ],
      },
      {
        test: /\.(css|txt|xml)$/,
        use: "raw-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: JSON.stringify(!isProduction),
    }),
    new webpack.BannerPlugin({
      banner: bannerText,
    }),
    new CircularDependencyPlugin({
      failOnError: true,
      allowAsyncCycles: true,
    }),
  ],
  optimization: {
    minimizer: isProduction ? [new TerserPlugin()] : [],
  },
});

const targets = [config("vivliostyle", "tsconfig.json")];

if (isProduction) {
  targets.push(config("vivliostyle-es5", "tsconfig-es5.json"));
}

module.exports = targets;
