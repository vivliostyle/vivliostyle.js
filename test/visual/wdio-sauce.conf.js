/* eslint-disable no-process-env */
const commonConfig = require('./wdio-common.conf').config;

exports.config = Object.assign({}, commonConfig, {
    //
    // =================
    // Service Providers
    // =================
    // WebdriverIO supports Sauce Labs, Browserstack, and Testing Bot (other cloud providers
    // should work too though). These services define specific user and key (or access key)
    // values you need to put in here in order to connect to these services.
    //
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 1,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [
        {
            browserName: 'chrome',
            version: 'latest',
            platform: 'Windows 10',
            screenResolution: '2560x1600'
        },
        {
            // maxInstances can get overwritten per capability. So if you have an in-house Selenium
            // grid with only 5 firefox instances available you can make sure that not more than
            // 5 instances get started at a time.
            // maxInstances: 5,
            browserName: 'firefox',
            version: 'latest',
            platform: 'Windows 10',
            screenResolution: '2560x1600'
        },
        {
            browserName: 'safari',
            version: 'latest',
            platform: 'macOS 10.12',
            screenResolution: '2360x1770'
        },
        {
            browserName: 'MicrosoftEdge',
            version: 'latest',
            platform: 'Windows 10',
            screenResolution: '2560x1600'
        },
        {
            browserName: 'internet explorer',
            version: 'latest',
            platform: 'Windows 10',
            screenResolution: '2560x1600'
        }
    ],
    services: commonConfig.services.concat('sauce'),
    sauceConnect: true,
    sauceConnectOpts: {
        verbose: true,
        verboseDebugging: true
    }
});
