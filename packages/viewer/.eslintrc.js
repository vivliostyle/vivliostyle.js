module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module"
  },
  env: {
    es6: true,
    browser: true,
    jasmine: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "prettier/@typescript-eslint"
  ],
  plugins: ["@typescript-eslint", "import", "prettier"],
  rules: {}
};
