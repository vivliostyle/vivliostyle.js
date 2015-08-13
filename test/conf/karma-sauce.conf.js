module.exports = function(config) {
    var commonConfig = (require("./karma-common.conf"))(config);
    var customLaunchers = {
        sl_chrome: {
            base: "SauceLabs",
            browserName: "chrome",
            platform: "Windows 8.1"
        },
        sl_firefox: {
            base: "SauceLabs",
            browserName: "firefox",
            platform: "Windows 8.1",
            version: "beta"
        },
        sl_safari: {
            base: "SauceLabs",
            browserName: "safari",
            platform: "OS X 10.10"
        },
        sl_ie_11: {
            base: "SauceLabs",
            browserName: "internet explorer",
            platform: "Windows 8.1"
        }
    };

    var options = {
        reporters: ["verbose", "saucelabs"],
        sauceLabs: {
            testName: "Vivliostyle.js",
            recordScreenshots: false,
            startConnect: false, // Sauce Connect is started by Travis CI
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
        },
        captureTimeout: 120000,
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        singleRun: true
    };
    for (var key in commonConfig) {
        if (commonConfig.hasOwnProperty(key)) {
            options[key] = commonConfig[key];
        }
    }

    config.set(options);
};
