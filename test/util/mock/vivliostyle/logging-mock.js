var mockConsole = vivliostyle.logging.mockConsole = {
    debug: function() {},
    info: function() {},
    warn: function() {},
    error: function() {}
};

vivliostyle.logging.logger = new vivliostyle.logging.Logger(mockConsole);
