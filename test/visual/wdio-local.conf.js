const {config: commonConfig, getVisualRegressionCompare} = require('./wdio-common.conf');

const screenshotBasePath = './test/visual/screenshots/local/';

exports.config = Object.assign({}, commonConfig, {
    capabilities: [
        {
            browserName: 'chrome',
            version: 'latest'
        },
        {
            browserName: 'firefox'
        },
        {
            browserName: 'safari',
            version: 'latest'
        },
        {
            browserName: 'MicrosoftEdge',
            version: 'latest'
        },
        {
            browserName: 'internet explorer',
            version: 'latest'
        }
    ],
    //
    // Saves a screenshot to a given path if a command fails.
    screenshotPath: screenshotBasePath + 'error/',
    services: commonConfig.services.concat('selenium-standalone'),
    seleniumLogs: "./test/visual/local-selenium.log",
    visualRegression: {
        compare: getVisualRegressionCompare(screenshotBasePath)
    },
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    before: function(config, capabilities) {
        browser.setViewportSize({ width: 1400, height: 960 });
    }
});
