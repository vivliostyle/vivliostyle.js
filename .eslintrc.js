module.exports = {
    parserOptions: {
        sourceType: "module"
    },
    env: {
        es6: true,
        browser: true,
        jasmine: true,
        node: true
    },
    extends: ["eslint:recommended", "plugin:import/errors", "plugin:import/warnings"],
    plugins: ["import", "prettier"],
    rules: {}
};
