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
    files: ["test/conf/*.js", "test/files/file-list.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: "commonjs",
    },

    rules: {
      "global-require": "off",
      "no-process-env": "off",
      "no-process-exit": "off",
      "no-sync": "off",
    },
  },
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
  {
    files: ["src/**/*.ts"],

    ignores: [
      "src/vivliostyle/legacy-plugin-surface.ts",
      "src/vivliostyle/layout-processor.ts",
      "src/vivliostyle/layout-retryers.ts",
      "src/vivliostyle/layout-util.ts",
      "src/vivliostyle/layout.ts",
      "src/vivliostyle/node-context.ts",
      "src/vivliostyle/plugin.ts",
      "src/vivliostyle/table.ts",
      "src/vivliostyle/vgen.ts",
    ],

    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "./legacy-plugin-surface",
                "**/legacy-plugin-surface",
                "./legacy-plugin-surface.*",
                "**/legacy-plugin-surface.*",
              ],
              message:
                "legacy-plugin-surface is the deprecated plugin compatibility layer; only the hook boundaries (vgen.ts, layout.ts, plugin.ts) and the node context retention sites (layout.ts, layout-processor.ts, layout-retryers.ts, layout-util.ts, table.ts, node-context.ts) may import it.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression[source.value=/legacy-plugin-surface/]",
          message:
            "legacy-plugin-surface is the deprecated plugin compatibility layer; a dynamic import reaches it just as a static one does, and only the hook boundaries (vgen.ts, layout.ts, plugin.ts) and the node context retention sites (layout.ts, layout-processor.ts, layout-retryers.ts, layout-util.ts, table.ts, node-context.ts) may import it.",
        },
      ],
    },
  },
  {
    files: [
      "src/vivliostyle/layout-retryers.ts",
      "src/vivliostyle/layout-util.ts",
      "src/vivliostyle/node-context.ts",
      "src/vivliostyle/table.ts",
    ],

    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='LegacyPluginSurface'][property.name!='noteRetained']",
          message:
            "A node context retention site records retained positions and nothing else; LegacyPluginSurface.noteRetained is the only member it may reach. The rest of the compatibility layer belongs to the hook boundaries (vgen.ts, layout.ts, plugin.ts).",
        },
        {
          selector:
            "ImportDeclaration[source.value=/legacy-plugin-surface/] ImportSpecifier[imported.name!='noteRetained']",
          message:
            "A node context retention site records retained positions and nothing else; noteRetained is the only name it may import from legacy-plugin-surface. The rest of the compatibility layer belongs to the hook boundaries (vgen.ts, layout.ts, plugin.ts).",
        },
        {
          selector:
            "ImportDeclaration[source.value=/legacy-plugin-surface/] ImportNamespaceSpecifier[local.name!='LegacyPluginSurface']",
          message:
            "A node context retention site imports legacy-plugin-surface as LegacyPluginSurface so that the member restriction applies to every use of it.",
        },
        {
          selector:
            "Identifier[name='LegacyPluginSurface']:not(MemberExpression > .object):not(ImportNamespaceSpecifier > .local)",
          message:
            "A node context retention site reaches LegacyPluginSurface.noteRetained through the namespace itself; every other reference to the namespace, whether it binds it to another name, casts it, wraps it in an expression or passes it on, puts the rest of the compatibility layer out of the member restriction's reach.",
        },
        {
          selector: "ImportExpression[source.value=/legacy-plugin-surface/]",
          message:
            "A node context retention site imports legacy-plugin-surface statically as LegacyPluginSurface; a dynamic import hands back the whole namespace under a name the member restriction cannot reach.",
        },
        {
          selector:
            ":matches(ExportAllDeclaration, ExportNamedDeclaration)[source.value=/legacy-plugin-surface/]",
          message:
            "A node context retention site keeps legacy-plugin-surface to itself; re-exporting it hands the whole compatibility layer to the files the import restriction covers.",
        },
      ],
    },
  },
  {
    files: ["src/vivliostyle/layout-processor.ts"],

    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='LegacyPluginSurface'][property.name!='noteRetained'][property.name!='adaptLegacyLayoutProcessor']",
          message:
            "layout-processor.ts reaches LegacyPluginSurface.noteRetained to record a retained position and LegacyPluginSurface.adaptLegacyLayoutProcessor at the RESOLVE_LAYOUT_PROCESSOR boundary; the rest of the compatibility layer belongs to the hook boundaries (vgen.ts, layout.ts, plugin.ts).",
        },
        {
          selector:
            "ImportDeclaration[source.value=/legacy-plugin-surface/] ImportSpecifier[imported.name!='noteRetained'][imported.name!='adaptLegacyLayoutProcessor']",
          message:
            "layout-processor.ts imports noteRetained and adaptLegacyLayoutProcessor from legacy-plugin-surface and nothing else; the rest of the compatibility layer belongs to the hook boundaries (vgen.ts, layout.ts, plugin.ts).",
        },
        {
          selector:
            "ImportDeclaration[source.value=/legacy-plugin-surface/] ImportNamespaceSpecifier[local.name!='LegacyPluginSurface']",
          message:
            "layout-processor.ts imports legacy-plugin-surface as LegacyPluginSurface so that the member restriction applies to every use of it.",
        },
        {
          selector:
            "Identifier[name='LegacyPluginSurface']:not(MemberExpression > .object):not(ImportNamespaceSpecifier > .local)",
          message:
            "layout-processor.ts reaches LegacyPluginSurface through the namespace itself; every other reference to the namespace, whether it binds it to another name, casts it, wraps it in an expression or passes it on, puts the rest of the compatibility layer out of the member restriction's reach.",
        },
        {
          selector: "ImportExpression[source.value=/legacy-plugin-surface/]",
          message:
            "layout-processor.ts imports legacy-plugin-surface statically as LegacyPluginSurface; a dynamic import hands back the whole namespace under a name the member restriction cannot reach.",
        },
        {
          selector:
            ":matches(ExportAllDeclaration, ExportNamedDeclaration)[source.value=/legacy-plugin-surface/]",
          message:
            "layout-processor.ts keeps legacy-plugin-surface to itself; re-exporting it hands the whole compatibility layer to the files the import restriction covers.",
        },
      ],
    },
  },
];
