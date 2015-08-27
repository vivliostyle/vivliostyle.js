module.exports = function(config) {
    return {
        basePath: "../..",
        frameworks: ["browserify", "jasmine"],
        preprocessors: {
            "test/spec/**/*.js": ["browserify"]
        },
        files: ["test/spec/**/*.js"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browserify: {
            transform: ["babelify"]
        }
    };
};
