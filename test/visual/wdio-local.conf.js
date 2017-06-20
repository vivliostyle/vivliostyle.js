const commonConfig = require('./wdio-common.conf').config;

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
    services: commonConfig.services.concat('selenium-standalone')
});
