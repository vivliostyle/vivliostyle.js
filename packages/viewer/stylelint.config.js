module.exports = {
  plugins: ["stylelint-scss"],
  extends: "stylelint-config-recommended",
  rules: {
    "at-rule-no-unknown": [
      true,
      { ignoreAtRules: ["include", "mixin", "if", "else"] },
    ],
  },
};
