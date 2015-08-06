module.exports = function(config) {
    var commonConfig = (require("./karma-common.conf"))(config);
    var sourceFiles = require("../../src/source-list").map(function(src) {
        return "src/" + src;
    });

    var options = {
        files: sourceFiles.concat(commonConfig.testFiles),
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
