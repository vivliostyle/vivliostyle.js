const {
    config: baseConfig,
    saveScreenshotMethod
} = require('./wdio-local.conf');

exports.config = Object.assign({}, baseConfig, {
    visualRegression: {
        compare: saveScreenshotMethod
    }
});
