module.exports = function(config) {
    return {
        basePath: "../..",
        frameworks: ["jasmine"],
        testFiles: [
            "test/spec/**/*.js"
        ],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO
    };
};
