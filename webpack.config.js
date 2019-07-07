const path = require("path");
const webpack = require("webpack");
const CircularDependencyPlugin = require("circular-dependency-plugin");
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

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./src/ts/vivliostyle.ts",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "lib-ts"),
    filename:
      process.env.NODE_ENV === "production"
        ? "vivliostyle.min.js"
        : "vivliostyle.dev.js",
    library: "vivliostyle",
    libraryTarget: "umd"
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: JSON.stringify(process.env.NODE_ENV !== "production")
    }),
    new webpack.BannerPlugin({
      banner: bannerText
    }),
    new CircularDependencyPlugin({
      failOnError: true,
      allowAsyncCycles: true
    })
  ]
};
