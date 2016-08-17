/*eslint-env node */
/*eslint global-require: "off" */
module.exports = function(config) {
    var commonConfig = (require("./karma-common.conf"))(config);

    var options = {
        reporters: ["verbose"],
        autoWatch: true,
        captureTimeout: 120000
    };
    for (var key in commonConfig) {
        if (commonConfig.hasOwnProperty(key)) {
            options[key] = commonConfig[key];
        }
    }

    config.set(options);
};
