describe("logging", function() {
    "use strict";

    describe("Logger", function() {
        var logger = vivliostyle.logging.logger;
        var mockConsole = vivliostyle.logging.mockConsole;

        beforeEach(function() {
            spyOn(mockConsole, "debug");
            spyOn(mockConsole, "info");
            spyOn(mockConsole, "warn");
            spyOn(mockConsole, "error");
            logger = new vivliostyle.logging.Logger(mockConsole);
        });

        var error = new Error("foo");
        var frameTrace = "This is a frame trace";
        error.frameTrace = frameTrace;
        var msg = error.toString();
        var str1 = "aaa";
        var str2 = "bbb";

        it("calls corresponding methods of console when debug/info/warn/error methods are called", function() {
            logger.debug(error, str1, str2);
            expect(mockConsole.debug).toHaveBeenCalledWith(str1, str2, "\n", msg, "\n", frameTrace);
            logger.debug(error);
            expect(mockConsole.debug).toHaveBeenCalledWith(msg, "\n", frameTrace);
            logger.debug(str1, str2);
            expect(mockConsole.debug).toHaveBeenCalledWith(str1, str2);

            logger.info(error, str1, str2);
            expect(mockConsole.info).toHaveBeenCalledWith(str1, str2, "\n", msg, "\n", frameTrace);

            logger.warn(error, str1, str2);
            expect(mockConsole.warn).toHaveBeenCalledWith(str1, str2, "\n", msg, "\n", frameTrace);

            logger.error(error, str1, str2);
            expect(mockConsole.error).toHaveBeenCalledWith(str1, str2, "\n", msg, "\n", frameTrace);
        });

        it("calls log listners registered with addListener method", function() {
            var debugListener = jasmine.createSpy("debug listener");
            logger.addListener(vivliostyle.logging.LogLevel.DEBUG, debugListener);
            logger.debug(error, str1, str2);
            expect(debugListener).toHaveBeenCalledWith({
                error: error,
                messages: [str1, str2]
            });
            logger.debug(error);
            expect(debugListener).toHaveBeenCalledWith({
                error: error,
                messages: []
            });
            logger.debug(str1, str2);
            expect(debugListener).toHaveBeenCalledWith({
                error: null,
                messages: [str1, str2]
            });

            var infoListener = jasmine.createSpy("info listener");
            logger.addListener(vivliostyle.logging.LogLevel.INFO, infoListener);
            logger.info(error, str1, str2);
            expect(infoListener).toHaveBeenCalledWith({
                error: error,
                messages: [str1, str2]
            });

            var warnListener = jasmine.createSpy("warn listener");
            logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            logger.warn(error, str1, str2);
            expect(warnListener).toHaveBeenCalledWith({
                error: error,
                messages: [str1, str2]
            });

            var errorListener = jasmine.createSpy("error listener");
            logger.addListener(vivliostyle.logging.LogLevel.ERROR, errorListener);
            logger.error(error, str1, str2);
            expect(errorListener).toHaveBeenCalledWith({
                error: error,
                messages: [str1, str2]
            });

        });
    });

});
