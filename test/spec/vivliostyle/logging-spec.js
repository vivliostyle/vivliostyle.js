/**
 * Copyright 2017 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */
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
