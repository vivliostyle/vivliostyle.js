/**
 * Copyright 2015 Trim-marks Inc.
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
 *
 * @fileoverview Logging utility
 */
goog.provide("vivliostyle.logging");

goog.require("vivliostyle.namespace");

goog.scope(() => {
    "use strict";

    /**
     * Log level.
     * @enum {number}
     */
    vivliostyle.logging.LogLevel = {
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4
    };
    /** @const */ var LogLevel = vivliostyle.logging.LogLevel;

    /**
     * @dict @typedef {{error: Error, messages: !Array<*>}}
     */
    vivliostyle.logging.ErrorInfo;

    /**
     * Class logging error, warning, information or debug messages.
     * @param {Console=} opt_console
     * @constructor
     */
    vivliostyle.logging.Logger = function(opt_console) {
        var c = opt_console || console;

        function makeConsoleMethod(method) {
            return args => method.apply(c, args);
        }

        /** @const @private */ this.consoleDebug = makeConsoleMethod(c.debug || c.log);
        /** @const @private */ this.consoleInfo = makeConsoleMethod(c.info || c.log);
        /** @const @private */ this.consoleWarn = makeConsoleMethod(c.warn || c.log);
        /** @const @private */ this.consoleError = makeConsoleMethod(c.error || c.log);

        /** @const @private @type {Object<vivliostyle.logging.LogLevel, Array<!function(vivliostyle.logging.ErrorInfo):void>>} */ this.listeners = {};
    };
    /** @const */ var Logger = vivliostyle.logging.Logger;

    /**
     * @private
     * @param {vivliostyle.logging.LogLevel} level
     * @param {!vivliostyle.logging.ErrorInfo} args
     */
    Logger.prototype.triggerListeners = function(level, args) {
        var listeners = this.listeners[level];
        if (listeners) {
            listeners.forEach(listener => {
                listener(args);
            });
        }
    };

    /**
     * Add a listener function invoked when a log event with the specified level occurs.
     * @param {vivliostyle.logging.LogLevel} level
     * @param {!function(vivliostyle.logging.ErrorInfo):void} listener
     */
    Logger.prototype.addListener = function(level, listener) {
        var listeners = this.listeners[level];
        if (!listeners) {
            listeners = this.listeners[level] = [];
        }
        listeners.push(listener);
    };

    /**
     * @param args
     * @returns {!vivliostyle.logging.ErrorInfo}
     */
    function argumentsToErrorInfo(args) {
        var a = Array.from(args);
        var e = null;
        if (a[0] instanceof Error) {
            e = a.shift();
        }
        return {
            "error": e,
            "messages": a
        };
    }

    /**
     * @param {!vivliostyle.logging.ErrorInfo} args
     * @returns {Array.<string>}
     */
    function buildMessageAndStackTrace(args) {
        var e = args.error;
        var stack = e && (e["frameTrace"] || e["stack"]);
        var messages = [].concat(args["messages"]);
        if (e) {
            if (messages.length > 0) {
                messages = messages.concat(["\n"]);
            }
            messages = messages.concat([e["toString"]()]);
            if (stack) {
                messages = messages.concat(["\n"]).concat(stack);
            }
        }
        return messages;
    }

    /**
     * @param {...} var_args
     */
    Logger.prototype.debug = function(var_args) {
        var args = argumentsToErrorInfo(arguments);
        this.consoleDebug(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.DEBUG, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.info = function(var_args) {
        var args = argumentsToErrorInfo(arguments);
        this.consoleInfo(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.INFO, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.warn = function(var_args) {
        var args = argumentsToErrorInfo(arguments);
        this.consoleWarn(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.WARN, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.error = function(var_args) {
        var args = argumentsToErrorInfo(arguments);
        this.consoleError(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.ERROR, args);
    };

    vivliostyle.logging.logger = new Logger();
});
