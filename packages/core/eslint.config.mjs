import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
      "plugin:import/typescript",
    ),
  ),
  {
    files: ["**/*.ts"],

    plugins: {
      "@typescript-eslint": typescriptEslint,
      import: fixupPluginRules(_import),
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jasmine,
        VIVLIOSTYLE_DEBUG: false,
        globalThis: false,
      },

      parser: tsParser,

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      "no-console": "error",

      "no-constant-condition": [
        "error",
        {
          checkLoops: false,
        },
      ],

      "no-empty": [
        "error",
        {
          allowEmptyCatch: true,
        },
      ],

      "no-prototype-builtins": "off",
      "no-template-curly-in-string": "error",
      "no-unsafe-negation": "error",
      "accessor-pairs": "error",
      "array-callback-return": "error",
      "consistent-return": "error",
      "dot-location": ["error", "property"],
      "no-alert": "error",
      "no-caller": "error",
      "no-div-regex": "error",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-extra-label": "error",
      "no-floating-decimal": "error",
      "no-global-assign": "error",
      "no-implied-eval": "error",
      // "no-invalid-this": "off",
      "no-iterator": "error",

      "no-labels": [
        "error",
        {
          allowLoop: true,
          allowSwitch: true,
        },
      ],

      // "no-lone-blocks": "error",
      "no-multi-str": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-new": "error",
      "no-octal-escape": "error",
      "no-proto": "error",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "off",
      "no-void": "error",
      "no-with": "error",
      radix: ["error", "always"],
      "no-undef": "error",
      "no-unused-vars": "off",
      "no-catch-shadow": "error",
      "no-label-var": "error",
      "no-restricted-globals": "error",
      "no-shadow-restricted-names": "error",
      "no-undef-init": "error",
      "global-require": "error",
      "handle-callback-err": "error",
      "no-mixed-requires": "error",
      "no-new-require": "error",
      "no-path-concat": "error",
      "no-process-env": "error",
      "no-process-exit": "error",
      "no-restricted-modules": "error",
      "no-sync": "error",
      "no-mixed-spaces-and-tabs": "warn",
      "array-bracket-spacing": ["error", "never"],
      "comma-dangle": ["error", "only-multiline"],
      "comma-spacing": "error",
      "comma-style": ["error", "last"],
      "eol-last": "warn",
      "func-call-spacing": ["error", "never"],
      "func-names": ["error", "never"],
      "id-blacklist": "error",
      "id-match": "error",
      "keyword-spacing": "error",
      "linebreak-style": ["error", "unix"],
      "max-nested-callbacks": "error",
      "new-parens": "error",
      "no-array-constructor": "error",
      "no-new-object": "error",
      "no-restricted-syntax": "error",
      "no-trailing-spaces": "warn",

      "no-unneeded-ternary": [
        "error",
        {
          defaultAssignment: true,
        },
      ],

      "no-whitespace-before-property": "error",
      "semi-spacing": "error",
      semi: "error",
      "space-before-blocks": "error",
      "space-unary-ops": "error",
      "unicode-bom": ["error", "never"],
      "no-control-regex": "off",
      "prettier/prettier": "warn",
    },
  },
];
