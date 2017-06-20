const {
    config: baseConfig,
    saveScreenshotMethod
} = require('./wdio-sauce.conf');

exports.config = Object.assign({}, baseConfig, {
    visualRegression: {
        compare: saveScreenshotMethod
    }
});
