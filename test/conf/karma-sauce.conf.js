/*eslint-env node */
/*eslint global-require: "off", no-process-env: "off" */
module.exports = function(config) {
    var commonConfig = (require("./karma-common.conf"))(config);
    var customLaunchers = {
        sl_chrome: {
            base: "SauceLabs",
            browserName: "chrome",
            platform: "Windows 10"
        },
        sl_firefox: {
            base: "SauceLabs",
            browserName: "firefox",
            platform: "Windows 10"
        },
        sl_safari: {
            base: "SauceLabs",
            browserName: "safari",
            platform: "OS X 10.11"
        },
        sl_ie_11: {
            base: "SauceLabs",
            browserName: "internet explorer",
            platform: "Windows 10"
        }
    };

    var options = {
        reporters: ["verbose", "saucelabs"],
        sauceLabs: {
            build: process.env.TRAVIS_BUILD_NUMBER,
            testName: "Vivliostyle.js",
            recordScreenshots: false,
            startConnect: false, // Sauce Connect is started by Travis CI
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
        },
        captureTimeout: 120000,
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        singleRun: true,
        concurrency: 4
    };
    for (var key in commonConfig) {
        if (commonConfig.hasOwnProperty(key)) {
            options[key] = commonConfig[key];
        }
    }

    config.set(options);
};
